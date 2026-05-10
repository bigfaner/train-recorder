---
created: "2026-05-10"
updated: "2026-05-10"
sessions:
  - 78c5ab60-f17a-46d7-8449-ba4178ed1490 # disc-4 dispatcher
  - a988967ec4fcd288a # disc-4 subagent (stuck)
  - a1fdeb1d-c96f-4a1b-89cf-86692e0a8a85 # T-test-3 dispatcher (current)
  - a7f88e16b3afa459c # T-test-3 subagent (20.7min, did run tests)
skillsInvolved: [forge:task-executor, forge:run-tasks]
severity: high
---

# task-executor 子代理效率问题分析

## Executive Summary

`forge:task-executor` 子代理在两类任务上表现不佳：实现任务（disc-4）完全卡死在 npm install 死循环，测试执行任务（T-test-3）虽最终执行了命令但耗时过长。**根因是 task-executor 的 TDD 工作流缺少"禁止启动 dev server"和"依赖安装重试上限"规则**，以及 T-test-3 这类编排任务被发送给了实现型代理。

---

## 事件 1: disc-4 — 依赖安装死循环

### 概要

| 维度        | 值                   |
| ----------- | -------------------- |
| 持续时间    | 15.8 分钟            |
| 工具调用    | 66 次                |
| 文件编辑    | **0 次**             |
| npm install | **8 次**（全部失败） |
| 结果        | 被用户 kill          |

### 逐动作耗时 Timeline

```
Phase 1: 正常阅读（0:25 ~ 0:27, ~2min）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 #  | Time   | Gap  | Tool  | Action
  1 | 00:25  |    - | Read  | disc-4.md (task definition)
  2 | 00:25  |   0s | Glob  | docs/business-rules/*.md
  3 | 00:25  |   0s | Glob  | docs/conventions/*.md
  4 | 00:25  |   9s | Read  | ui.spec.ts
  5 | 00:25  |   0s | Read  | disc-3.md
  6 | 00:25  |   6s | Glob  | app/**/*.tsx
  7 | 00:25  |   0s | Read  | helpers.js
  8 | 00:25  |   6s | Read  | helpers.ts
  9 | 00:25  |   0s | Read  | calendar.tsx
 10 | 00:25  |   0s | Read  | plan-editor.tsx
 11 | 00:25  |   6s | Grep  | EmptyCalendar
 12 | 00:25  |   0s | Grep  | empty-state-guide|create-plan-btn
 13 | 00:25  |   6s | Read  | EmptyCalendar.tsx
 14 | 00:25  |   0s | Read  | error-context.md
 15 | 00:26  |   6s | Read  | _layout.tsx
 16 | 00:26  |   0s | Read  | _layout.tsx (root)
 17 | 00:26  |   5s | Glob  | **/error-context.md
 18 | 00:26  |  10s | Read  | error-context.md (TC-UI-002)
 19 | 00:26  |   6s | Read  | plan.tsx
 20 | 00:26  |   0s | Grep  | playwright\.config
 21 | 00:26  |   6s | Glob  | playwright.config.*
 22 | 00:26  |   8s | Read  | playwright.config.ts
 23 | 00:26  |   0s | Read  | config.yaml
 24 | 00:26  |   6s | Bash  | cat package.json | head -30
 25 | 00:26  |  12s | Grep  | calendar-month-view
 26 | 00:26  |   0s | Grep  | CalendarMonthGrid
 27 | 00:27  |  10s | Read  | CalendarMonthGrid.tsx
 28 | 00:27  |   6s | Read  | calendar.tsx (offset)
 29 | 00:27  |  10s | Read  | Button.tsx
  ✓ 正常阶段 — 29 次调用，全部是 Read/Glob/Grep

Phase 2: expo export 失败 → 进入死循环（0:27 ~ 0:41, ~14min）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 #  | Time   | Gap   | Tool | Action
 30 | 00:27  |    7s | Bash | npx expo export --platform web          ← 偏差起点！
 31 | 00:27  |   25s | Bash | npx expo install react-dom react-native-web (4.8s)
 32 | 00:28  |   10s | Bash | npm install react-dom react-native-web (2.4s)
 33 | 00:28  |   10s | Bash | npm install --legacy-peer-deps ... (120.2s) ★
    |        |       |      | ↑ 等了 2 分钟，安装失败
    | 00:30  | 124s  |      | （等待 legacy-peer-deps 安装完成）
 34 | 00:30  |    4s | Bash | ls node_modules/react-dom → not found
 35 | 00:30  |    4s | Bash | ls node_modules/react-native-web → not found
 36 | 00:30  |    8s | Grep | @expo/.*/next
 37 | 00:30  |   0s  | Glob | expo-router.*
 38 | 00:30  |   10s | Bash | expo start --web → 失败 (32.9s) ★
 39 | 00:31  |   39s | Bash | node -e require.resolve('react-dom')
 40 | 00:31  |   10s | Bash | cat package.json 版本检查
 41 | 00:31  |    9s | Bash | ls react-dom package.json
 42 | 00:31  |    7s | Bash | find node_modules -name react-dom
 43 | 00:31  |    6s | Bash | cat temp output file
 44 | 00:31  |    7s | Bash | ls *.lock
 45 | 00:32  |    6s | Bash | ls package-lock.json
 46 | 00:32  |    4s | Read | _layout.tsx (re-read)
 47 | 00:32  |   15s | Grep | useLocalSearchParams
 48 | 00:32  |    6s | Bash | git show 65a7565
 49 | 00:32  |   19s | Bash | git show 598dc22
 50 | 00:32  |    5s | Glob | latest.md
 51 | 00:33  |    6s | Glob | **/*.json
 52 | 00:33  |   11s | Bash | ls tests/e2e/results
 53 | 00:33  |    4s | Bash | ls tests/e2e/results (forward slash)
 54 | 00:33  |    4s | Bash | require.resolve check
 55 | 00:33  |   36s | Bash | npm install --legacy-peer-deps react-dom@19.1.0 (1.9s)
 56 | 00:34  |    8s | Bash | npm view react-native-web versions (1.3s)
 57 | 00:34  |    6s | Bash | npm install --legacy-peer-deps @0.19.13 (147.0s) ★★★
    |        |       |      | ↑ 等了 2 分 27 秒
 58 | 00:36  |  152s | Bash | npm install npmmirror @0.19.13 (121.0s) ★★
    |        |       |      | ↑ 等了 2 分钟
 59 | 00:38  |  128s | Bash | npm install npmmirror --no-save (26.1s)
 60 | 00:39  |   32s | Bash | require.resolve check → still MISSING
 61 | 00:39  |    7s | Bash | expo start --web → 失败 (42.5s) ★
 62 | 00:40  |   50s | Bash | npm install npmmirror (all deps) (22.9s)
 63 | 00:40  |   28s | Bash | rm -rf + npm install npmmirror (11.6s)
 64 | 00:41  |   16s | Bash | require.resolve ajv → MISSING
 65 | 00:41  |    5s | Bash | npm install ajv (2.7s)
 66 | 00:41  |    8s | Bash | require.resolve ajv → OK (但为时已晚)
    ✗ 被用户 kill — 37 次调用，0 次文件编辑
```

### 耗时分布

| 阶段                              | 调用数 | 耗时   | 占比    |
| --------------------------------- | ------ | ------ | ------- |
| Phase 1: 正常阅读                 | 29     | ~2min  | 13%     |
| Phase 2: npm install + expo start | 37     | ~14min | **87%** |
| 其中 npm install (8次)            | 8      | ~553s  | **58%** |
| 其中 expo start (2次)             | 2      | ~75s   | 8%      |

### 根因

**Category**: `scope-creep` + `wrong-priority` + `instruction-gap`

1. **偏差起点** (#30): 代理尝试 `npx expo export --platform web`，这不是任务要求的。任务说"Fix test setup/seeding or adjust test expectations"。
2. **npm install 死循环** (#31-66): 代理决定先启动 web 服务器"验证元素存在性"，而不是直接修改 testID。在 8 次 npm install 失败后仍未停止。
3. **缺少退出条件**: task-executor 指令中没有"禁止启动 dev server"和"npm install 最大重试 3 次"的规则。

---

## 事件 2: T-test-3 — 测试执行任务耗时过长

### 概要

| 维度     | 值                                                         |
| -------- | ---------------------------------------------------------- |
| 持续时间 | 20.7 分钟                                                  |
| 工具调用 | 34 次                                                      |
| 文件编辑 | 2 次 (playwright.config.ts)                                |
| 结果     | **确实执行了 `just test-e2e`**，但中途被用户以为卡死而中断 |

### 逐动作耗时 Timeline

```
Phase 1: 正常阅读 + 环境检查（11:11 ~ 11:12, ~1min）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 #  | Time   | Gap  | Tool  | Action
  1 | 11:11  |    - | Read  | run-e2e-tests.md (task definition)
  2 | 11:11  |   0s | Read  | INDEX.md (conventions)
  3 | 11:11  |   4s | Read  | e2e-server-lifecycle.md
  4 | 11:11  |   0s | Read  | e2e-app-health-first.md
  5 | 11:11  |   0s | Read  | e2e-fix-task-boundaries.md
  6 | 11:11  |   4s | Glob  | tests/e2e/features/**/*.ts
  7 | 11:11  |   0s | Read  | playwright.config.ts
  8 | 11:11  |   4s | Glob  | justfile
  9 | 11:11  |   0s | Glob  | Justfile
 10 | 11:11  |   7s | Read  | justfile
 11 | 11:11  |   1s | Read  | ui.spec.ts
 12 | 11:11  |   0s | Read  | api.spec.ts
 13 | 11:11  |   4s | Glob  | tests/e2e/helpers.*
 14 | 11:11  |   0s | Read  | latest.md (previous results)
 15 | 11:11  |   7s | Read  | helpers.ts
 16 | 11:11  |   9s | Glob  | tests/e2e/config.yaml
 17 | 11:11  |   0s | Glob  | tests/e2e/package.json
 18 | 11:11  |  10s | Read  | config.yaml

Phase 2: 修改 config + 首次运行（11:12 ~ 11:20, ~8min）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 19 | 11:12  |   5s | Edit  | playwright.config.ts (修改 timeout?)
 20 | 11:12  |  13s | Edit  | playwright.config.ts (第二次修改)
 21 | 11:12  |   5s | Bash  | just e2e-setup                        ← ✓ 正确！
 22 | 11:12  |  13s | Bash  | expo start --web (background)
 23 | 11:12  |   3s | Bash  | probe (curl loop)
 24 | 11:12  |   4s | Bash  | just test-e2e --feature train-recorder ← ✓ 正确！
    |        |       |      | ↑ 运行 128 个测试，耗时约 8 分钟
    | 11:20  | 471s |       | （等待测试完成，600s timeout）

Phase 3: 重试循环（11:20 ~ 11:31, ~11min）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 25 | 11:20  |   3s | Bash  | tail expo-server.log
 26 | 11:20  |   5s | Bash  | kill port 8081/8082
 27 | 11:20  |   3s | Bash  | netstat check 8081
 28 | 11:20  |   3s | Bash  | curl localhost:8081
 29 | 11:20  |   7s | Bash  | expo start --web (retry)
 30 | 11:20  |   5s | Bash  | probe (curl loop)
 31 | 11:21  |  19s | Bash  | just test-e2e --feature train-recorder (retry)
    |        |       |      | ↑ 第二次运行测试
    | 11:31  | 603s |       | （等待测试完成，又 10 分钟）
 32 | 11:31  |  33s | Bash  | sleep 30 + curl check
 33 | 11:31  |   2s | TaskStop | 停止 agent
 34 | 11:31  |   2s | Bash  | playwright run (直接调用)
```

### 耗时分布

| 阶段                  | 调用数 | 耗时   | 占比    |
| --------------------- | ------ | ------ | ------- |
| Phase 1: 阅读理解     | 18     | ~1min  | 5%      |
| Phase 2: 首次测试运行 | 6      | ~8min  | 39%     |
| Phase 3: 重试         | 11     | ~11min | **56%** |

### 关键发现

**与之前的分析修正**: T-test-3 子代理**确实执行了** `just test-e2e --feature train-recorder`（#24 和 #31）。它没有"卡住"——是测试本身每次运行需要约 8-10 分钟（128 个测试 + 30s timeout per failure）。

**真正的问题**:

1. **子代理修改了 playwright.config.ts** (#19, #20) — 这是 scope-creep，任务只说"运行测试"
2. **测试运行了两次** (#24 和 #31) — 第一次因为 600s timeout 被截断后，代理重试了整个测试，又等了 10 分钟
3. **20.7 分钟对一个 "运行测试" 任务来说太长** — 主要是测试本身耗时，但子代理的 config 修改和重试增加了额外时间

---

## Cross-Event Pattern

| 事件     | 偏差类型      | 关键动作                      | 耗时浪费           |
| -------- | ------------- | ----------------------------- | ------------------ |
| disc-4   | `scope-creep` | 启动 expo web server 验证     | 14/15.8 min (87%)  |
| T-test-3 | `scope-creep` | 修改 playwright.config + 重试 | ~11/20.7 min (53%) |

**共同偏差模式**: 子代理在遇到问题时，倾向于**修改环境/配置**而非遵循任务指令。task-executor 缺少明确的边界约束：

1. 没有 "禁止启动 dev server" 规则
2. 没有 "禁止修改测试配置" 规则
3. 没有 "失败后最多重试 1 次" 上限
4. 没有 "npm install 最大重试 3 次" 上限

---

## Recommendations

| Priority | Action                                                     | Target                    | 预期效果                                 |
| -------- | ---------------------------------------------------------- | ------------------------- | ---------------------------------------- |
| **P0**   | T-test-3 标记 `mainSession: true`                          | `tasks/run-e2e-tests.md`  | 跳过 task-executor，主会话直接运行 skill |
| P1       | task-executor 添加 `FORBIDDEN: 启动 dev server`            | `agents/task-executor.md` | 防止 disc-4 式偏差                       |
| P1       | task-executor 添加 `npm install 最大重试 3 次`             | `agents/task-executor.md` | 防止依赖安装死循环                       |
| P1       | task-executor 添加 `禁止修改测试配置文件`                  | `agents/task-executor.md` | 防止 T-test-3 式 scope-creep             |
| P2       | breakdown-tasks 模板默认 T-test-N 标记 `mainSession: true` | `skills/breakdown-tasks`  | 系统性修复                               |

## Evidence Files

| File                                         | Source                          | 内容                   |
| -------------------------------------------- | ------------------------------- | ---------------------- |
| `evidence/older/evidence.json`               | disc-4 subagent                 | 66 次工具调用，15.8min |
| `evidence/dispatcher-sessions/evidence.json` | disc-4 dispatcher               | 29 次调用，17.5min     |
| `evidence/ttest3/evidence.json`              | T-test-3 subagent               | 34 次调用，20.7min     |
| `evidence/agent-a988967ec4fcd288a.jsonl`     | disc-4 subagent 原始 transcript | 160 行 JSONL           |
