# Forensic Report: Manual Index.json Dependency Updates

**Date**: 2026-05-09
**Session**: Current (run-tasks dispatcher)
**Question**: Why did the dispatcher manually edit index.json to update task dependencies instead of letting `task add` auto-sync?

## Root Cause

**Category**: `instruction-gap` + `wrong-usage`

The dispatcher used the wrong `--source-task-id` value when adding fix tasks, causing `task add` to wire dependencies to the wrong task.

### What Happened

When the breaking gate for fix task disc-2 failed e2e, the dispatcher ran:

```bash
task add --template fix-task --source-task-id disc-1 ...
```

Instead of:

```bash
task add --template fix-task --source-task-id T-test-3 ...
```

### How `--source-task-id` Works

Per `task add --help`:

> `--source-task-id`: auto-injects {{SOURCE_TASK_ID}} and **adds this task as source dependency**

When the task-executor originally created disc-1, it correctly used:

```bash
task add --template fix-task --source-task-id T-test-3 ...
```

This added disc-1 as a dependency of T-test-3, so T-test-3.blocked_deps = `[T-test-2, disc-1]`.

When disc-1 completed but the fix was insufficient, the dispatcher should have used the same `--source-task-id T-test-3` for disc-2. Instead it used `--source-task-id disc-1`, which:

1. Wired disc-2 as a dependency of disc-1 (already completed — useless)
2. Did NOT update T-test-3's dependencies
3. Required manual index.json edit to fix T-test-3's deps

### Causal Chain

1. **Symptom**: Dispatcher manually edited index.json 3 times (disc-2, disc-3, disc-4) to update T-test-3's dependencies
2. **Direct cause**: `--source-task-id` pointed to the previous fix task instead of the blocked task
3. **Root cause**: Dispatcher Step 5b says `--source-task-id <TASK_ID>` where TASK_ID is "the task that failed the breaking gate" — but in this scenario the breaking gate failure is for a FIX TASK, not the original blocked task. The instructions don't distinguish these two cases.

### Fix-Task Template Auto-Restore

The fix-task template contains:

> When this task is recorded as completed via `task record`, the source task {{SOURCE_TASK_ID}} is **automatically restored to pending** if all its dependencies are completed.

So using `--source-task-id T-test-3` would have given correct auto-restore behavior:

- disc-2 completes → T-test-3 auto-restores to pending (if all deps met)
- No manual index.json edits needed

## Recommendation

### Dispatcher Instruction Update

Step 5a/5b should clarify the `--source-task-id` target:

```
When the failing task IS the original blocked task:
  --source-task-id <TASK_ID>  (the failing task itself)

When the failing task is a FIX TASK whose gate reveals deeper issues:
  --source-task-id <ORIGINAL_BLOCKED_TASK>  (the task that originally failed,
   not the fix task that just completed)
```

### For This Session

The manual edits were correct in outcome (T-test-3 properly depends on the latest fix task). But they bypass the CLI's auto-restore mechanism.
