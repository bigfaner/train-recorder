---
created: "2026-05-10"
tags: [testing, e2e, agent-behavior, forensics]
---

# E2E Fix Task 边界规则

## Rule 1: Fix task 禁止启动 dev server

修复 e2e 测试失败的 task 只能修改源代码（添加 testID、修复组件逻辑）和测试文件（调整选择器、断言）。**禁止启动 Expo dev server、运行 `npx expo start`、或尝试手动验证页面渲染。**

验证修复效果的方式是 `just test`（单元测试）和 `just test-e2e`（由 dispatcher 的 Breaking Gate 统一执行）。

## Why

disc-4 task agent 尝试启动 dev server 来"亲眼确认"元素存在性，遇到依赖安装问题后陷入 20+ 次 `npm install` 循环，15.8 分钟内 0 次文件编辑。实际修复只需要改 testID/选择器，不需要启动服务器。

## Rule 2: npm install 最多重试 3 次

当依赖安装失败时，最多尝试 3 种不同方式（不同 flag、不同 registry）。如果 3 次全部失败，标记 task 为 blocked 并报告环境问题，不要继续尝试。

## How to Apply

### 正确的 fix task 工作流

```
1. 读取失败的测试用例和对应组件源码
2. 对比测试期望的 testID 与组件实际的 DOM 结构
3. 修改组件（添加 testID）或测试（调整选择器/断言）
4. just test → 单元测试必须通过
5. task record → 记录完成
```

### 禁止的操作

```
❌ npx expo start / npx expo export --platform web
❌ npm install react-dom react-native-web (修复依赖不是 fix task 的职责)
❌ 手动在浏览器中打开页面验证
❌ 循环重试 npm install > 3 次
```

## Related

- Forensic report: `docs/forensics/disc-4-stuck/report.md`
- Related convention: `docs/conventions/e2e-server-lifecycle.md`
