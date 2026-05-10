---
created: "2026-05-10"
updated: "2026-05-10"
status: draft
source: disc-4-stuck forensics
scope: forge-harness
---

# Proposal: task-executor 骨架化 — 执行流程下沉到任务模板

## Background

Forensic analysis (disc-4-stuck) identified that T-test-3 (Run e2e Tests) was dispatched to `forge:task-executor` — an agent designed for TDD implementation. The agent's "fix failures" instinct caused 14 minutes of wasted retries instead of analyzing failures and creating fix tasks.

Root cause: **task-executor 硬编码了 TDD 工作流**，与执行型任务（"跑命令、读结果、报告失败"）根本对立。

## Problem Statement

当前 task-executor 的 Step 2-3 硬编码为 TDD 循环 + Quality Gate：

```
Step 0: MAIN_SESSION guard
Step 1: Read task definition
Step 2: TDD (RED → GREEN → REFACTOR)        ← 硬编码
Step 3: Quality Gate (compile→fmt→lint→test)  ← 硬编码
Step 4: Record
Step 5: Commit
```

所有非 MAIN_SESSION 任务走同一条路径。但任务类型多样：

| 任务类型                    | 需要的工作流                      | 当前问题       |
| --------------------------- | --------------------------------- | -------------- |
| 实现 (fix-N, 3.x/4.x)       | TDD + Quality Gate                | OK             |
| 执行 (T-test-3, T-test-4.5) | Run → Analyze → Report            | 14min 无效重试 |
| 迁移 (T-test-4)             | Read → Transform → Write → Verify | 同类风险       |
| 生成 (T-test-1, T-test-2)   | Read PRD → Generate content       | 部分不适配     |

## Proposed Solution

**task-executor 保留骨架，执行流程下沉到任务模板。**

核心思路：task-executor 变成通用执行器（读任务 → 执行流程 → 记录 → 停），具体"做什么"由任务文件的 `## Execution Workflow` 段落决定。Dispatcher 零改动。

### Before vs After

```
BEFORE (当前):
  dispatcher ──→ task-executor ──→ TDD (硬编码)
                 ↓
                 所有任务都走 TDD，不管适不适合

AFTER (提案):
  dispatcher ──→ task-executor ──→ 读取 ## Execution Workflow
                 ↓                    ↓
                 记录+提交          有 → 按模板执行
                                    无 → 回退 TDD（向后兼容）
```

### 变更清单

| 文件                         | 变更类型 | 内容                                             |
| ---------------------------- | -------- | ------------------------------------------------ |
| `agents/task-executor.md`    | 修改     | Step 2-3 合并为"执行 workflow"（从任务文件读取） |
| `tasks/run-e2e-tests.md`     | 修改     | 添加 `## Execution Workflow` 段落                |
| `tasks/verify-regression.md` | 修改     | 添加 `## Execution Workflow` 段落                |
| `commands/run-tasks.md`      | **不变** | dispatcher 零改动                                |
| `task claim` CLI             | **不变** | 无需新字段                                       |

---

## Design

### 1. task-executor 骨架（修改后）

保留 Step 0, 1, 4, 5，重构 Step 2-3：

```markdown
## Execution Workflow (Step 2-3)

After reading the task file in Step 1, check if it contains a
`## Execution Workflow` section:

**If present** — follow the workflow instructions exactly.
The section defines what commands to run, what constitutes success,
and what to do on failure. Do NOT deviate from the specified workflow.
Output: `Step 2/5: Execution workflow... DONE`

**If absent** — use the default TDD implementation workflow:

1. TDD cycle: RED → GREEN → REFACTOR
2. Quality Gate: `just compile [scope] → just fmt [scope] → just lint [scope] → just test [scope]`
   Stop at first failure. Retry rules:
   - compile: fix, retry
   - fmt: mark blocked (no retry)
   - lint: self-fix max 1 retry, then blocked
   - test: fix, retry from compile
     Output: `Step 2/5: TDD implementation... DONE (N tests)`
```

骨架的其他部分不变：

| Step     | 职责                 | 变化                                 |
| -------- | -------------------- | ------------------------------------ |
| Step 0   | MAIN_SESSION guard   | 不变                                 |
| Step 1   | Read task definition | 不变                                 |
| Step 2-3 | **执行 workflow**    | 合并，读取任务文件指令               |
| Step 4   | Record (HARD-GATE)   | 不变                                 |
| Step 5   | Commit               | 不变，仅在 Step 2 产生代码变更时执行 |

### 2. Execution Workflow 段落规范

任务文件通过 `## Execution Workflow` 段落声明执行流程。该段落可包含：

- **指令步骤**: 有序的执行步骤
- **成功/失败判定**: 什么算通过、什么算失败
- **失败处理**: 创建 fix task / mark blocked / 其他
- **约束**: `<HARD-RULE>` 块，覆盖 agent 默认行为

### 3. 模板库

#### 模板 A：执行型（T-test-3, T-test-4.5）

````markdown
## Execution Workflow

1. Run the specified command:
   ```bash
   just test-e2e --feature train-recorder
   ```
````

Set timeout to 600000ms (10 minutes). Do NOT retry.

2. Analyze the output:
   - Count passed, failed, and not-run tests
   - Group failures by root cause category
   - For each category, note affected TC-IDs

3. **If all tests pass**: proceed to Step 4 (Record). Status = completed.

4. **If any test fails**:
   For each root cause category, create a fix task:
   ```bash
   task add --template fix-task --title "Fix: <category>" \
     --source-task-id <TASK_ID> --block-source \
     --var SOURCE_FILES="<paths>" \
     --var TEST_SCRIPT="<test-path>" \
     --description "<root cause with affected TC-IDs>"
   ```
   Then proceed to Step 4 (Record). Status = blocked.

<HARD-RULE>
- Do NOT write or edit source code files
- Do NOT start dev servers or background processes
- Do NOT modify test configuration files
- Do NOT retry the test command — run it exactly once
- Do NOT run `task claim` or start subsequent tasks
</HARD-RULE>
```

#### 模板 B：实现型（当前 fix-task / phase tasks 的默认）

当任务文件**没有** `## Execution Workflow` 段落时，自动使用：

```markdown
(内置默认，不需要在任务文件中写)

1. TDD: RED → GREEN → REFACTOR
2. Quality Gate: just compile → fmt → lint → test
3. On failure: fix and retry (compile/lint max 3, test no hard cap)
4. On persistent failure: task add --template fix-task --block-source
```

#### 模板 C：迁移型（T-test-4 Graduate Tests，未来）

```markdown
## Execution Workflow

1. Read all test scripts in `tests/e2e/features/{{FEATURE}}/`
2. Classify each script: unit / integration / e2e
3. Copy e2e scripts to `tests/e2e/` (regression suite)
4. Rewrite imports for regression suite paths
5. Create graduation marker file
6. Verify: `just test-e2e` on graduated scripts
```

#### 模板 D：生成型（T-test-1 Gen Test Cases，未来）

```markdown
## Execution Workflow

1. Read `docs/features/{{FEATURE}}/prd/prd-spec.md` acceptance criteria
2. Read `docs/features/{{FEATURE}}/ui/ui-design.md` (if exists)
3. Generate test cases in `tests/e2e/features/{{FEATURE}}/test-cases.md`
4. Verify: file exists, TC-IDs traceable to PRD sections
```

### 4. 向后兼容

**关键设计**：`## Execution Workflow` 是可选的。

```
任务文件有 ## Execution Workflow？
  ├─ Yes → 按模板执行
  └─ No  → 回退到当前 TDD 默认行为（Step 2-3 不变）
```

所有现有的实现型任务（fix-N, 3.x, 4.x）不需要任何改动。只有需要不同工作流的任务才加 `## Execution Workflow`。

---

## Migration Plan

### Phase 1: 骨架改造（本次）

1. 修改 `agents/task-executor.md` Step 2-3：合并为"执行 workflow"，增加 fallback 逻辑
2. 修改 T-test-3 任务文件：添加 `## Execution Workflow`（模板 A）
3. 验证：实现型任务（fix-3 等）行为不变

### Phase 2: 扩展执行型任务

| 任务                           | 添加 Workflow                      |
| ------------------------------ | ---------------------------------- |
| T-test-4.5 (Verify Regression) | 模板 A（命令改为 `just test-e2e`） |
| T-test-4 (Graduate Tests)      | 模板 C                             |

### Phase 3: 模板标准化（可选）

- 将常用 workflow 模板提取为 `templates/` 目录下的可引用片段
- `task add --template` 自动注入对应的 `## Execution Workflow`
- 减少手写重复

---

## Risk Assessment

| 风险                                       | 概率 | 缓解                                                                             |
| ------------------------------------------ | ---- | -------------------------------------------------------------------------------- |
| agent 不遵循 Execution Workflow 指令       | 低   | `<HARD-RULE>` 块覆盖默认行为；TDD 本能只在无 Workflow 时激活                     |
| Execution Workflow 写得不好导致 agent 迷失 | 中   | 模板标准化（Phase 3）；审核任务文件时检查 Workflow 段落                          |
| 向后兼容断裂                               | 极低 | 无 Workflow → 完全走当前 TDD 路径，逻辑不变                                      |
| Step 4-5 (Record/Commit) 不适配执行型任务  | 低   | 执行型任务不产生代码变更，Commit 跳过（已有逻辑：仅 STATUS=completed 时 commit） |

## Alternatives Considered

| 方案                                 | 优点                                | 缺点                                       | 结论          |
| ------------------------------------ | ----------------------------------- | ------------------------------------------ | ------------- |
| **A. 新建 agent 文件**               | 完全独立                            | 多一个 agent 维护，重复 Record/Commit 逻辑 | 不采用        |
| **B. dispatcher 路由 + prompt 模板** | dispatcher 控制路由                 | dispatcher 需改，多一条维护线              | 不采用        |
| **C. mainSession 标记**              | 零代码变更                          | 阻塞主会话 10min                           | 作为 fallback |
| **D. 骨架化 + 任务模板（本方案）**   | dispatcher 零改动、向后兼容、可扩展 | 需改 task-executor.md                      | **采用**      |
