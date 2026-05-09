---
created: "2026-05-09"
tags: [error-handling, testing]
---

# Dispatcher: Handling Agent Stalls Effectively

## Problem

Task-executor subagent stalled twice during the run-tasks loop (task 4.3 and T-test-1). The dispatcher's response was inconsistent and the user had to intervene.

## Root Cause

**Causal chain (3 levels deep):**

1. **Symptom**: Two agents stalled (600s stream watchdog timeout), dispatcher handled them differently
2. **Direct cause**: Task 4.3 recovered successfully via error-fixer (files were staged, just needed commit + record). T-test-1 also dispatched error-fixer but user interrupted it
3. **Root cause**: The run-tasks Error Handling table lists `Agent timeout → Mark blocked, continue next` as the default action, but this is a **minimum** protocol. The dispatcher can also use error-fixer as a general-purpose recovery tool when partial work exists
4. **Trigger condition**: When an agent stalls with partial work already staged, error-fixer can complete the remaining steps (commit, verify, record). When no useful partial work exists, mark blocked and move on

## Solution

**After agent timeout, check state first:**

| State                                  | Action                                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| Files staged, commit pending           | Dispatch error-fixer to complete (commit + verify + record) |
| No useful partial work                 | Mark blocked, continue next task                            |
| Record missing after normal completion | Dispatch error-fixer with record instruction                |

## Reusable Pattern

**Error-fixer is a general-purpose error recovery tool**, not limited to "missing record" scenarios. After an agent stall:

1. Check `git status` and staged files
2. If meaningful work exists → dispatch error-fixer to complete
3. If nothing useful → `task status <ID> blocked`, continue loop
4. Never assume error-fixer is only for one specific scenario

## Example

```bash
# After agent stall — check state first
git status

# Case A: Files staged (like task 4.3) → error-fixer can finish
Agent(subagent_type="forge:error-fixer", prompt="Agent stalled. Files staged. Complete: commit, verify, record.")

# Case B: No useful state → mark blocked, move on
task status <TASK_ID> blocked
task claim  # continue loop
```

## Related Files

- `docs/features/train-recorder/tasks/process/state.json` — task state tracking

## References

- Forge run-tasks skill — Error Handling table
- Forge error-fixer agent — general-purpose error recovery
