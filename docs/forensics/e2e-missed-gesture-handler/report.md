---
created: "2026-05-10"
sessions:
  [cee0fee4-a46f-44c4-b729-f2c9bb05f5c6, 78c5ab60-f17a-46d7-8449-ba4178ed1490]
skillsInvolved: [forge:task-executor, forge:run-tasks]
severity: high
---

# E2E 测试流水线未能发现 react-native-gesture-handler 版本不兼容

## Executive Summary

`react-native-gesture-handler@~2.0.0` 与 Expo SDK 54 不兼容，导致 web 端 `GestureHandlerRootView` 为 undefined，整个 app 崩溃。E2E 测试流水线未能发现此问题的根因是：**症状被误诊**——Playwright 测试报告的是"元素找不到"，agent 将其当作测试选择器/testID 问题逐层修复（disc-1~4），从未检查 app 本身是否能正常渲染。流水线在 disc-4 卡死后停滞，app 健康性检查从未被执行。

## Investigation Scope

| Dimension         | Value                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Sessions analyzed | 2（dispatcher 主会话 + 39 个 subagent）                                                                                          |
| Time range        | 2026-05-09 06:02 ~ 2026-05-10 00:45                                                                                              |
| Skills involved   | forge:run-tasks, forge:task-executor                                                                                             |
| Trigger           | 用户报告 web 端 `_layout.tsx:4` 出现 `Cannot read properties of undefined (reading 'displayName')` 错误，质疑为何 E2E 测试未捕获 |

## Context: The Bug

```json
// package.json (before fix)
"react-native-gesture-handler": "~2.0.0"  // expected by Expo 54: ~2.28.0
```

`_layout.tsx:4` 在 web 端 import `GestureHandlerRootView` 时，因为 `~2.0.0` 版本不兼容 Expo 54 / React 19，导出为 undefined。该组件包裹整个 app root，导致全部 UI 页面无法渲染。

Playwright 测试报告的症状是"元素找不到"——与"testID 缺失"、"选择器错误"表现完全一致。

## Findings

### Finding 1: 症状误诊 — 将 app 崩溃当作测试用例问题

**Category:** `trust-without-verify`

**Affected sessions:** disc-1 through disc-4 subagents

**Symptom:**
4 个 discovery 任务（disc-1~4）组成链式修复流水线，逐层处理：

- disc-1: "128 个 e2e 测试失败，因为缺少 react-dom/react-native-web"
- disc-2: "Playwright 缺少 webServer 配置"
- disc-3: "12 个 UI 测试元素找不到"
- disc-4: "TC-UI-001/002 中 create-plan-btn 和 mode-selector 找不到"

每个 discovery 都假设 **测试/配置有问题**，从未验证 **app 本身能否正常渲染**。

**Expected behavior:**
当大量 UI 测试同时失败（128→12→2），agent 应该先检查 app 的基础健康状况（浏览器控制台是否有报错、页面是否白屏），而不是逐个修复测试选择器。

**Gap:**
task-executor 没有"先验证 app 健康再修测试"的指令。Playwright 报告的是 element-not-found，agent 自然地将其归类为测试问题。

**Causal chain:**

1. **Symptom:** E2E 测试报告元素找不到，agent 花了 4 轮 discovery 修测试
2. **Direct cause:** Agent 没有检查浏览器控制台错误，不知道 app 本身崩溃了
3. **Root cause:** `GestureHandlerRootView` undefined 导致的页面白屏在 Playwright 层面只表现为"元素不存在"，与测试选择器错误的症状完全一致

### Finding 2: 流水线在 disc-4 卡死，T-test 未完成

**Category:** `pipeline-gap`

**Affected sessions:** 78c5ab60 (run-tasks 主会话)

**Symptom:**

- disc-4 被分派到 forge:task-executor subagent 后，agent 在 15.8 分钟内执行 66 次工具调用（32 次 Bash，0 次文件编辑），卡在 `npm install` 死循环
- T-test-3（run-e2e-tests）状态为 blocked，等待 disc-4
- T-test-4（graduate-tests）、T-test-4.5（verify-regression）、T-test-5（consolidate-specs）全部 pending
- **All-completed hook（最终安全网）从未触发**

**Expected behavior:**
disc-4 任务说明是"Fix test setup/seeding or adjust test expectations"。Agent 应修改测试选择器或添加 testID，然后运行 `just test-e2e --feature train-recorder` 验证。

**Agent reasoning (from thinking block):**

> "代理将'验证修复'理解为'手动启动 web 服务器查看页面'，而非'运行 e2e 测试'。这是一个 wrong-priority 偏差。"（引自 disc-4-stuck report）

**Gap:**
task-executor 没有禁止启动 dev server 的规则。Agent 在尝试 `npx expo export --platform web` 时遇到依赖问题，陷入 npm install 循环。

**Causal chain:**

1. **Symptom:** disc-4 卡死，E2E 流水线完全停滞
2. **Direct cause:** Agent 尝试启动 web 服务器验证，遇到依赖冲突后无限重试
3. **Root cause:** 恰恰是 `react-native-gesture-handler` 版本不兼容导致 web 服务器启动/渲染异常，但 agent 将其误诊为"缺少 react-dom"

### Finding 3: 缺少 App 健康检查环节

**Category:** `instruction-gap`

**Symptom:**
E2E 测试生命周期中没有任何环节检查"app 是否正常渲染"：

```
T-test-1 (gen-test-cases) → T-test-1b (eval) → T-test-2 (gen-scripts) → T-test-3 (run-tests) → ...
```

Playwright 的 `webServer` 配置只检查服务器进程是否启动（HTTP 端口是否可达），不检查页面内容是否正常渲染。`just probe` 命令也只是 HTTP health check。

**Expected behavior:**
在 T-test-3 运行 E2E 测试前，应该有一个"smoke test"步骤：

1. 启动 web 服务器
2. 访问首页
3. 检查浏览器控制台是否有 fatal error
4. 检查页面是否白屏

如果有这个步骤，`GestureHandlerRootView` 的错误会立即暴露。

**Gap:**
forge 的 E2E 测试生命周期没有定义"app 健康检查"阶段。`just probe` 只检查 HTTP 200，不检查页面内容。

## Root Cause Summary

```
react-native-gesture-handler@~2.0.0 (不兼容 Expo 54)
    ↓
GestureHandlerRootView undefined on web
    ↓
整个 app 无法渲染（白屏）
    ↓
Playwright 报告 "element not found"（与 testID 缺失症状一致）
    ↓
Agent 误诊为测试问题 → 4 轮 discovery 修测试（disc-1~4）
    ↓
disc-4 卡死 → 流水线停滞 → app 健康从未被验证
    ↓
版本不兼容问题 2 天后才被手动发现
```

**核心问题不是"E2E 测试没跑"，而是"E2E 测试的错误信号被误读"。** 测试确实跑了，也确实失败了，但失败原因被错误归因到测试用例而非 app 本身。

## Recommendations

| Priority | Action                                                                           | Target File                                     | Finding   |
| -------- | -------------------------------------------------------------------------------- | ----------------------------------------------- | --------- |
| P0       | 修复 gesture-handler 版本：`npx expo install react-native-gesture-handler --fix` | `package.json`                                  | (done)    |
| P1       | task-executor 添加规则：当 >50% UI 测试失败时，先检查浏览器控制台错误和页面白屏  | `skills/task-executor/SKILL.md`                 | Finding 1 |
| P1       | T-test 流水线增加 "app smoke test" 步骤：启动服务器后检查控制台无 fatal error    | `skills/run-e2e-tests/SKILL.md`                 | Finding 3 |
| P2       | `just probe` 增加页面内容检查（不只检查 HTTP 200，还检查 HTML body 非空）        | `justfile`                                      | Finding 3 |
| P2       | disc-4 已被修复（gesture-handler 版本更新后重新运行即可）                        | `docs/features/train-recorder/tasks/index.json` | Finding 2 |

## Evidence

Evidence files at: `docs/forensics/e2e-missed-gesture-handler/evidence/`

| File                | Source                        | Size   |
| ------------------- | ----------------------------- | ------ |
| evidence.json       | Main session (78c5ab60)       | ~20 KB |
| older/evidence.json | Dispatcher session (cee0fee4) | ~40 KB |
