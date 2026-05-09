---
created: "2026-05-10"
tags: [testing, e2e, forensics]
---

# E2E 测试失败时先检查 App 健康

## Rule

当 >30% 的 UI E2E 测试同时失败时，**禁止直接逐个修复测试用例**。必须先完成 App 健康检查，确认 app 能正常渲染后，再处理单个测试失败。

## Why

`react-native-gesture-handler@~2.0.0` 与 Expo SDK 54 不兼容导致 `GestureHandlerRootView` 在 web 端为 undefined，整个 app 白屏。但 Playwright 报告的错误是 "element not found"——与 testID 缺失/选择器错误症状完全一致。Agent 将其当作测试问题修了 4 轮（disc-1~4），从未检查 app 是否能正常渲染。

核心问题：**E2E 测试的错误信号无法区分"测试写错了"和"app 崩溃了"。** 必须在修测试之前排除后者。

## How to Apply

### 诊断步骤（按顺序执行）

**Step 1: 检查浏览器控制台**

Playwright 测试失败后，检查 `results/` 中的截图和 trace：

```bash
# 查看失败截图 — 白屏 = app 崩溃
ls tests/e2e/results/**/*.png
```

如果截图显示白屏或空白页 → **app 问题，不是测试问题**。检查：
- 浏览器控制台 fatal error
- `package.json` 依赖版本兼容性（`npx expo-doctor`）
- `_layout.tsx` root 组件是否正常渲染

**Step 2: 检查依赖兼容性**

```bash
npx expo-doctor
```

发现 major version mismatch → 先修复依赖，再跑测试。

**Step 3: 手动验证 app 渲染**

```bash
npx expo start --web --port 8081
# 浏览器打开 http://localhost:8081，确认页面非白屏且控制台无 fatal error
```

**Step 4: 确认健康后再处理测试**

只有在 app 能正常渲染后，才开始修复单个测试的 testID/选择器问题。

### 判断标准

| 失败比例 | 诊断方向 | 首要操作 |
|----------|---------|---------|
| >30% UI 测试同时失败 | App 健康问题 | 检查控制台错误 + 依赖兼容性 |
| 10-30% 部分失败 | 可能是测试问题 | 先 spot check 2-3 个失败用例的截图 |
| <10% 少量失败 | 测试/选择器问题 | 逐个修复测试 |

## Related

- Forensic report: `docs/forensics/e2e-missed-gesture-handler/report.md`
