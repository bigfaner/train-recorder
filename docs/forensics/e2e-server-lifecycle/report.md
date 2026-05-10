---
created: "2026-05-10"
sessions: [7f31629b-6f19-4e52-a641-37dca11334ee]
skillsInvolved: [forge:run-tasks, forge:task-executor, forge:run-e2e-tests]
severity: high
---

# E2E 服务器启动被跳过：Playwright webServer 掩盖了技能流程缺失

## Executive Summary

`/run-e2e-tests` 技能定义了完整的服务器生命周期管理（Step 1: `just run` 启动 → `just probe` 健康检查 → Step 3: 运行测试 → Step 6: teardown）。但 task-executor 子代理**跳过了 Step 1**，直接执行 `just test-e2e`。Playwright 的 `playwright.config.ts` 中的 `webServer` 配置掩盖了这个遗漏——它自动启动了服务器，但只检查 TCP 端口可达性，不等待 Metro bundle 构建完成，导致首次加载时测试在 JS bundle 未就绪时就开始执行，产生大量假阳性失败。

**关键矛盾**: 技能要求手动管理服务器 + 健康检查（30s 轮询），Playwright config 提供自动启动但缺少深度健康检查。两者共存导致代理选择了更省事的自动启动路径。

## Investigation Scope

| Dimension       | Value                                             |
| --------------- | ------------------------------------------------- |
| Skills analyzed | run-e2e-tests (v2.17.0), task-executor, run-tasks |
| Trigger         | 用户问"为什么没有执行 just dev 或启动服务器"      |
| Impact          | 30/114 UI 测试假阳性失败，2 轮 fix task 无法解决  |

## Deep Dive: Playwright webServer 机制

### Playwright webServer 做了什么

```typescript
// tests/e2e/playwright.config.ts
webServer: {
  command: "npx expo start --clear --web --port 8081",
  port: 8081,
  timeout: 60_000,
  reuseExistingServer: !process.env.CI,
}
```

Playwright 的就绪检测机制：

```
1. fork 一个子进程执行 command
2. 循环检测：每 100ms 向 port 发起 TCP 连接
3. 一旦 TCP 握手成功 → 认为服务器"就绪"
4. 如果 timeout 内端口没响应 → 报错退出
```

**关键：它只检查 TCP 端口是否可连接，不发送任何 HTTP 请求。**

### Expo / Metro 的启动时序

Expo dev server 的启动分为两个阶段：

```
Phase 1: HTTP server 就绪（~1-3秒）
┌─────────────────────────────────────────────┐
│ npx expo start --web --port 8081            │
│   ├─ 加载 Expo CLI                          │
│   ├─ 创建 Metro bundler 实例                │
│   ├─ 创建 HTTP server (端口 8081 开始监听)   │  ← Playwright 在这里认为"就绪"
│   └─ 等待第一个请求触发 bundle 构建          │
└─────────────────────────────────────────────┘

Phase 2: JS Bundle 就绪（首次请求触发，~5-10秒）
┌─────────────────────────────────────────────┐
│ 浏览器请求 http://localhost:8081/            │
│   ├─ Metro 解析依赖图（1240 modules）        │
│   ├─ 转译 TypeScript → JavaScript           │
│   ├─ 合并 bundle                            │  ← 测试断言在这期间执行
│   └─ 返回完整的 HTML + JS 响应              │
└─────────────────────────────────────────────┘
```

`--clear` 标志清空 Metro 缓存，强制每次完整重建。没有 `--clear` 时，Metro 增量编译只需 ~2 秒；有 `--clear` 时完整构建需 ~8-10 秒。

### 失败时序图

```
时间线 →

0s        Playwright 启动 npx expo start
          │
2s        Expo HTTP server 开始监听 8081
          │ Playwright 检测到端口可达 → 认为服务器就绪
          │ 立即开始执行第一个测试
          │
2.1s      TC-UI-001: page.goto("http://localhost:8081/")
          │ Expo 收到请求 → Metro 开始构建 bundle（cold start）
          │ Metro 返回 HTML shell（空<body>）
          │ React 未加载 → 页面空白
          │
2.2s      expect(page.getByTestId("empty-state-guide")).toBeVisible()
          │ 10 秒超时开始倒计时
          │
12.2s     超时到期 → bundle 仍在构建中 → 测试失败 ❌
          │
14s       Metro bundle 构建完成（太晚了）
          │
          TC-UI-002: page.goto("http://localhost:8081/plan-editor")
          │ bundle 已缓存 → 即时加载 → 测试可能通过
          │ 但由于第一个测试已失败，Playwright 可能已经影响了全局状态
```

### 为什么手动 just run + just probe 没有这个问题

`/run-e2e-tests` 技能定义的流程：

```bash
# Step 1a: 启动服务器（后台）
just run &
echo $! >> tests/e2e/results/.server-pids

# Step 1b: 健康检查（轮询直到真正可用）
for i in $(seq 1 10); do
  just probe && break    # curl -sf http://localhost:8081/ → 200 OK
  sleep 3
done
```

`just probe` 内部执行 `curl -sf http://localhost:8081/` — 这是一个完整的 HTTP 请求，会：

```
1. 触发 Metro 首次 bundle 构建
2. 等待 Metro 返回完整响应（HTML + JS bundle）
3. HTTP 200 表示 bundle 构建完成、页面可渲染
4. 如果没返回 200，等 3 秒后重试（最多 30 秒）
```

健康检查通过后，Metro bundle 已缓存在内存中。后续 `just test-e2e` 的所有测试请求都会命中缓存，页面加载 < 1 秒。

### reuseExistingServer 的行为

```typescript
reuseExistingServer: !process.env.CI; // 本地开发 = true, CI = false
```

| 场景             | `reuseExistingServer` | 端口 8081 已占用？ | Playwright 行为                 |
| ---------------- | --------------------- | ------------------ | ------------------------------- |
| 本地, 手动预启动 | `true`                | 是                 | **复用已有服务器**，不启动新的  |
| 本地, 无预启动   | `true`                | 否                 | 启动新服务器 + 端口检查         |
| CI               | `false`               | 不管               | **强制启动新服务器** + 端口检查 |

当技能先 `just run` 启动了服务器，`just probe` 通过后，`just test-e2e` 的 Playwright 会发现端口 8081 已被占用 → `reuseExistingServer: true` → 直接复用 → **bundle 已就绪，测试通过**。

### 根本矛盾

```
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│  Playwright webServer            │     │  /run-e2e-tests 技能              │
│                                  │     │                                  │
│  就绪标准：TCP 端口可达           │     │  就绪标准：HTTP 200 + 完整页面     │
│  检测粒度：传输层（L4）           │     │  检测粒度：应用层（L7）            │
│  等待时间：0~60s（端口响应即止）   │     │  等待时间：0~30s（轮询 10 次 × 3s）│
│  Bundle 状态：未知                │     │  Bundle 状态：已构建               │
│  服务器管理：自动                 │     │  服务器管理：手动 PID              │
└──────────────────────────────────┘     └──────────────────────────────────┘
         ↑ 两者共存，没有互斥规则                    ↑
         agent 选择更省事的路径（自动），跳过了更可靠的路径（手动）
```

## Findings

### Finding 1: 双重服务器管理机制冲突

**Category:** `instruction-gap` + `pipeline-gap`

**Symptom:**
`playwright.config.ts` 和 `/run-e2e-tests` 技能各自定义了服务器生命周期：

| 职责       | `/run-e2e-tests` 技能   | Playwright `webServer`                     |
| ---------- | ----------------------- | ------------------------------------------ |
| 启动命令   | `just run` (expo start) | `npx expo start --clear --web --port 8081` |
| 健康检查   | `just probe` (30s 轮询) | 端口 8081 HTTP 响应                        |
| 服务器复用 | 无（手动 PID 管理）     | `reuseExistingServer: !CI`                 |
| 清理       | Step 6: kill PIDs       | Playwright 自动清理                        |

**两条路径的差异:**

1. **技能路径** (设计预期):

   ```
   just run → just probe (轮询 baseUrl 直到 200) → just test-e2e (复用已有服务器) → teardown
   ```

   `just probe` 会访问 `http://localhost:8081`，触发 Metro 首次 bundle 构建，并等待到 HTTP 200 才继续。

2. **Playwright 路径** (实际发生):
   ```
   just test-e2e → Playwright 检测到端口无响应 → 自动启动 npx expo start → 等待端口响应(60s) → 立即执行测试
   ```
   Playwright 只检查端口可达性。Expo HTTP server 在 Metro bundle 构建完成之前就开始监听端口。所以端口可达 ≠ 应用可用。

**Gap:**
两个服务器管理机制并存，但没有明确的优先级规则。task-executor 选择了更简单的路径（直接 `just test-e2e`），跳过了技能的手动服务器管理。

**Transcript 证据 (T-test-3, agent a2c4cd54):**

agent 执行了技能的 Step 1 前置检查（justfile、spec files、helpers、config.yaml、e2e-setup），以及 Step 1b 的 PID 文件清理（`> results/.server-pids`）。但在进入 Step 1 的服务器启动环节时，直接跳到了 Step 3：

```
#8  mkdir -p results && rm -f results/test-results.json && > .server-pids   ← 清空 PID 文件
                                                                              ← 缺失: just run & echo $! >> .server-pids
                                                                              ← 缺失: for i in $(seq 1 10); do just probe && break; sleep 3; done
#9  just test-e2e --feature train-recorder                                   ← 直接运行测试
```

agent 在 Step 6 teardown 执行了 `rm -f results/.server-pids`（删除从未写入过的 PID 文件），表明它"知道"技能的完整流程但跳过了服务器启动步骤。

### Finding 2: Playwright webServer 的健康检查不够深入

**Category:** `pipeline-gap`

**Symptom:**
Playwright 的 `webServer` 配置只做端口级别健康检查：

```typescript
// playwright.config.ts
webServer: {
  command: "npx expo start --clear --web --port 8081",
  port: 8081,
  timeout: 60_000,
  reuseExistingServer: !process.env.CI,
}
```

这个配置的问题是：

1. Expo dev server 在 Metro 开始构建 bundle 之前就开始监听端口 8081
2. Playwright 检测到端口可达 → 认为服务器就绪 → 开始执行测试
3. 第一个 `page.goto("/")` 触发 Metro 首次 bundle 构建（`--clear` 时需 8-10 秒）
4. 测试断言在 bundle 构建完成前执行 → 元素找不到 → 测试失败

**为什么手动启动 + `just probe` 没有这个问题:**
`just probe` 使用 `curl -sf` 访问 `http://localhost:8081`。这个请求会触发 Metro 构建，并且只有当完整 HTTP 响应返回（bundle 构建完成，页面可渲染）时才返回成功。30 秒的轮询窗口足以覆盖 Metro 首次构建。

### Finding 3: `--clear` flag 使问题恶化

**Category:** `wrong-priority`

**Symptom:**
我（主会话 dispatcher）在调试过程中向 `playwright.config.ts` 添加了 `--clear` flag：

```typescript
command: "npx expo start --clear --web --port 8081";
```

这个 flag 强制 Metro 每次**重建**整个 bundle（而非增量编译），使首次加载从 ~2 秒增加到 ~10 秒。这扩大了 Playwright 端口健康检查和实际 bundle 就绪之间的时间差。

**Root cause:**
主会话 dispatcher 在调试 Metro 缓存问题时添加了 `--clear`，但没有意识到这会让 Playwright 的浅层健康检查更不可靠。

## Root Cause Summary

```
/run-e2e-tests 技能要求: just run → just probe → just test-e2e (服务器预启动 + 深度健康检查)
                              ↓ 被跳过
task-executor 直接运行: just test-e2e
                              ↓
Playwright webServer 接管: 自动启动 + 端口级健康检查
                              ↓
端口可达 ≠ bundle 就绪 → 测试在 JS 未加载时执行 → 元素找不到 → 假阳性失败
                              ↓
dispatcher 误诊为"测试选择器问题" → 循环创建 fix task → 无法解决
```

## Recommendations

| Priority | Action                                                                                                      | Target                                                             | Finding   |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- |
| P0       | 移除 `playwright.config.ts` 中的 `webServer` 配置                                                           | `tests/e2e/playwright.config.ts`                                   | Finding 1 |
| P0       | 确保所有运行 e2e 测试的 agent（包括 dispatcher 的 Breaking Gate）遵循技能 Step 1: `just run` → `just probe` | `skills/run-e2e-tests/SKILL.md` 或 `skills/task-executor/SKILL.md` | Finding 1 |
| P1       | `justfile` 添加 `just e2e-server` / `just e2e-server-stop` 命令封装服务器生命周期                           | `justfile`                                                         | Finding 1 |
| P2       | 如果保留 Playwright webServer，改用 `use: { baseURL }` + Playwright 的 `waitForURL` 模式做深度检查          | `playwright.config.ts`                                             | Finding 2 |

### P0 Fix Detail: 服务器共享模型

移除 `playwright.config.ts` 中的 `webServer`，让技能的 `just run` + `just probe` 成为唯一的服务器管理路径：

```typescript
export default defineConfig({
  testDir: ".",
  testIgnore: featureMode ? [] : /^features\//,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalTimeout: 600_000,
  // ... 其余配置不变
  // webServer: 删除 — 由 /run-e2e-tests 技能管理服务器生命周期
});
```

这样当 agent 跳过 Step 1 直接运行 `just test-e2e` 时，Playwright 不会自动启动服务器 → 连接失败 → agent 被迫回到技能流程执行 `just run` + `just probe`。

正确的服务器生命周期：

```
Step 1: 启动服务器（一次性）
  just run &                        # 后台启动
  echo $! >> .server-pids           # 记录 PID
  for i in $(seq 1 10); do          # 健康检查（30s）
    just probe && break
    sleep 3
  done

Step 2: 运行所有测试（共享服务器）
  just test-e2e --feature train-recorder   # Playwright 复用已有服务器

Step 3: 清理
  kill $(cat .server-pids)
```

服务器启动一次，所有测试用例共享。`--clear` 应只在明确需要时使用，不应作为默认行为。

## Evidence

Evidence files at: `docs/forensics/e2e-server-lifecycle/evidence/`

| File                          | Source                       | Lines |
| ----------------------------- | ---------------------------- | ----- |
| `evidence.json`               | 主会话 dispatcher (b9d938ee) | 591   |
| `t-test-3.json/evidence.json` | subagent T-test-3 (a2c4cd54) | 31463 |
| `fix-1.json/evidence.json`    | subagent fix-1 (a49ff877)    | —     |
| `fix-2.json/evidence.json`    | subagent fix-2 (a39dd358)    | —     |

### T-test-3 (run-e2e-tests) Bash 命令序列

```
#0  grep -A 10 "test-e2e" justfile              ← 读 justfile
#1  test -f Justfile && grep -q "test-e2e"       ← 检查 recipe 存在
#2  ls tests/e2e/features/train-recorder/*.spec.ts
#3  ls tests/e2e/helpers.ts playwright.config.ts
#4  ls tests/e2e/config.yaml
#5  grep -q "^e2e-setup:" Justfile
#6  ls node_modules/.package-lock.json && npx playwright --version
#7  npx playwright install --dry-run              ← 检查浏览器
#8  mkdir -p results && rm -f results/test-results.json && > .server-pids
#9  just test-e2e --feature train-recorder        ← 直接运行测试！没有 just run/probe
#10-12 解析 test-results.json
#13 ls e2e-report.md template
#14 rm -f results/.server-pids                    ← teardown: 删除从未写入的 PID 文件
#15-20 task record + task add fix-task
```

**关键缺失**: 在 #8 和 #9 之间，技能要求：

```bash
just run & echo $! >> tests/e2e/results/.server-pids           # ← 未执行
for i in $(seq 1 10); do just probe && break; sleep 3; done    # ← 未执行
```

agent 在 #8 清理了旧 PID 文件，在 #14 删除了它，但从未向其中写入任何 PID。服务器完全由 Playwright `webServer` 自动管理。

### fix-1 Bash 命令序列

```
#0-1  find playwright.config / latest.md
#2-4  npx tsc --noEmit (类型检查)
#5    ls justfile
#6-9  npm test × 3 (单元测试)
#10   npx tsc --noEmit
#11   npm run lint
#12   npm test
#13-20 task record + git commit
```

fix-1 只运行了单元测试（`npm test`/`npx tsc`/`npm run lint`），从未启动 web 服务器或运行 e2e 测试。这符合 fix task 的设计（修复源代码，不负责 e2e 验证）。e2e 验证由 dispatcher 的 Breaking Gate 负责。

### fix-2 Bash 命令序列

```
#0    ls tests/e2e/results/
#1    npx playwright test ... --reporter=list                     ← 直接 Playwright（无预启动服务器）
#2-9  npx playwright test ... (多次，分批跑不同 TC 范围)            ← 全部依赖 Playwright webServer 自动启动
#10   npm test (单元测试)
#11   npx tsc --noEmit
#12-21 task record + git commit
```

fix-2 的 #1 命令直接调用 `npx playwright test`，没有先启动服务器。Playwright 的 `webServer` 检测到端口 8081 空闲（或已被之前的测试运行留下服务器）→ 自动启动 Expo → 端口检查通过 → 测试在 bundle 未就绪时执行。

**但 fix-2 的 `CRITICAL CONTEXT` prompt 明确告知**: "The Expo web server is already running on port 8081 with clean Metro cache. Do NOT restart or kill it." 这意味着 dispatcher 已经预启动了服务器。fix-2 复用了已有服务器，这个 case 下 webServer 自动启动不是问题——但 T-test-3 没有 dispatcher 预启动服务器，直接依赖 Playwright 自动启动。
