---
created: "2026-05-10"
tags: [testing, e2e, infrastructure, forensics]
---

# E2E 服务器生命周期管理

## Rule 1: 不要使用 Playwright webServer 自动启动

`playwright.config.ts` 中**禁止配置 `webServer`**。服务器生命周期由 `/run-e2e-tests` 技能或手动管理。

## Why

Playwright `webServer` 的就绪检测只检查 TCP 端口可达（传输层），不验证应用是否可渲染（应用层）。

Expo/Metro 的启动分两阶段：

1. **Phase 1**（~1-3s）：HTTP server 监听端口 ← Playwright 认为就绪
2. **Phase 2**（~5-10s）：Metro 构建 JS bundle ← 测试实际需要这个

如果 Playwright 在 Phase 1 后立即执行测试，`page.goto` 返回空白 HTML，React 未加载，所有 `getByTestId` 断言失败。症状与 testID 缺失完全一致，导致 agent 误修测试而非诊断根因。

实际发生过：T-test-3 agent 跳过 `just run` + `just probe`，直接 `just test-e2e`，30 个 UI 测试假阳性失败，2 轮 fix task 无法解决。

## Rule 2: 服务器启动一次，所有测试共享

运行 e2e 测试前，必须先启动并验证服务器：

```bash
# Step 1: 启动（后台）
just run & echo $! >> tests/e2e/results/.server-pids

# Step 2: 健康检查（L7 级别，轮询直到 HTTP 200）
for i in $(seq 1 10); do just probe && break; sleep 3; done

# Step 3: 运行测试（Playwright 通过 reuseExistingServer 复用已有服务器）
just test-e2e --feature <slug>

# Step 4: 清理
kill $(cat tests/e2e/results/.server-pids) 2>/dev/null || true
rm -f tests/e2e/results/.server-pids
```

`just probe` 发送完整 HTTP 请求，触发 Metro bundle 构建并等待 200 响应。健康检查通过后，bundle 已缓存在内存中，所有测试页面加载 < 1 秒。

**省略 Step 1-2 直接执行 Step 3 是禁止的。** 如果没有预启动服务器且 `playwright.config.ts` 没有 `webServer`，Playwright 会因连接失败而报错——这是正确的行为，强制 agent 回到完整流程。

## Rule 3: 不要使用 --clear flag

`npx expo start --clear` 清空 Metro 缓存，强制完整重建（~10s vs 增量 ~2s）。只在明确需要清除缓存损坏时使用，不应作为默认行为。

## How to Apply

### playwright.config.ts 正确配置

```typescript
export default defineConfig({
  // ... 其他配置
  // webServer: 不配置 — 服务器由 /run-e2e-tests 技能管理
});
```

### 禁止的配置

```typescript
// ❌ 禁止：Playwright 自动启动，只做端口检查
webServer: {
  command: "npx expo start --web --port 8081",
  port: 8081,
  timeout: 60_000,
  reuseExistingServer: !process.env.CI,
}
```

### Fix task 的服务器处理

Fix task（修复 e2e 测试失败）只修改源代码和测试文件，通过 `just test` 验证单元测试。**禁止 fix task 启动 dev server 或运行 e2e 测试。** e2e 回归验证由 dispatcher 的 Breaking Gate 在 fix task 完成后统一执行。

## Related

- Forensic report: `docs/forensics/e2e-server-lifecycle/report.md`
- Related convention: `docs/conventions/e2e-app-health-first.md`
