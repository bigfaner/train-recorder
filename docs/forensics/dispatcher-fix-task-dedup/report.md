---
created: "2026-05-10"
sessions: [current-session]
skillsInvolved: [forge:run-tasks, forge:task-executor, forge:record-task]
severity: high
---

# Dispatcher fix-task dedup check ignores completed fix tasks, blocks source task permanently

## Executive Summary

When `/run-tasks` dispatcher re-executed T-test-3 and found 21 new e2e failures, it marked the task `blocked` but failed to spawn new fix tasks. The Step 3 dedup check (`grep -l "sourceTaskID.*T-test-3" index.json`) matched 2 **already-completed** fix tasks (fix-1, fix-2) and falsely concluded "fix tasks already exist, skip". This is a pipeline-gap in the `/run-tasks` skill definition — the grep only checks for the presence of `sourceTaskID`, not whether those fix tasks are still active.

## Investigation Scope

| Dimension         | Value                                                            |
| ----------------- | ---------------------------------------------------------------- |
| Sessions analyzed | 1 (current session)                                              |
| Time range        | 2026-05-10 07:59 ~ 08:24                                         |
| Skills involved   | `forge:run-tasks`, `forge:task-executor`, `forge:record-task`    |
| Trigger           | User reported: fix-1、fix-2都完成了，为什么T-test-3还是blocked？ |
| CLI version       | task v1.10.0                                                     |

## Timeline of Events

| Time             | Event                                                | T-test-3 Status           | Evidence                                                                  |
| ---------------- | ---------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| 5/10 01:23~01:33 | fix-1 executed and recorded                          | `blocked` → `pending`     | fix-1 commit `0601430` diff: `- "blocked"` → `+ "pending"`                |
| 5/10 01:34       | fix-1 committed to git                               | `pending`                 | `git show 0601430:index.json` confirms `pending`                          |
| 5/10 01:57~02:33 | fix-2 executed and recorded                          | `pending` (unchanged)     | fix-2 commit `1153681` diff: no status change on run-e2e-tests            |
| 5/10 02:33       | fix-2 committed to git                               | `pending`                 | `git show 1153681:index.json` confirms `pending`                          |
| 5/10 07:59       | `/run-tasks` claimed T-test-3                        | `pending` → `in_progress` | `task claim` output: `ACTION: CLAIMED, STATUS: in_progress`               |
| 5/10 ~08:15      | task-executor ran e2e, found 21 failures             | `in_progress` → `blocked` | Record: `records/run-e2e-tests.md` status=`blocked`, 34/128 pass, 21 fail |
| 5/10 ~08:24      | Dispatcher Step 3 grep matched completed fix-1/fix-2 | `blocked` (no change)     | `grep sourceTaskID.*T-test-3` → 3 matches, all `status: completed`        |
| 5/10 ~08:24      | Dispatcher skipped fix task creation                 | `blocked` (stuck)         | No fix-3 spawned, `task claim` → "no task available"                      |

## Findings

### Finding 1: Dispatcher Step 3 fix-task dedup does not filter by status

**Category:** `pipeline-gap`

**Symptom:**
T-test-3 stuck at `blocked` after dispatcher re-executed it. 21 new e2e failures (TC-UI-021~041) had no fix tasks created.

**Expected behavior (from `/run-tasks` skill definition):**

```markdown
If STATUS is not "completed": task was auto-downgraded.
Before spawning fix tasks, check if fix tasks already exist:
grep -l "sourceTaskID.\*<TASK_ID>" docs/features/<FEATURE>/tasks/index.json
If fix tasks already exist for this source → skip, they are already in progress.
If no fix tasks exist → spawn fix task (same as Step 5a failure handling).
```

**Actual behavior:**
Dispatcher executed `grep -l "sourceTaskID.*T-test-3" index.json` → returned `index.json` (match found) → skipped fix task creation.

**Evidence — 3 matches, all completed:**

```
Line 486: disc-1   sourceTaskID: "T-test-3"  status: completed
Line 550: fix-1    sourceTaskID: "T-test-3"  status: completed
Line 561: fix-2    sourceTaskID: "T-test-3"  status: completed
```

**Gap:**
The grep command checks for **presence** of `sourceTaskID` regardless of task status. The comment says "skip, they are already in progress" but the code matches completed tasks too. The intent is to avoid duplicate fix tasks for the same failure, but it also prevents fix tasks for **new** failures from the same source task.

**Causal chain:**

1. **Symptom:** T-test-3 permanently stuck at `blocked`, no fix tasks created for TC-UI-021~041
2. **Direct cause:** Dispatcher grep matched completed fix-1/fix-2 → "fix tasks already exist, skip"
3. **Root cause:** `/run-tasks` Step 3 dedup logic uses `grep -l "sourceTaskID.*<TASK_ID>"` without filtering on task status — it cannot distinguish "active fix tasks in progress" from "completed fix tasks from a previous round"

### Finding 2: task-cli `auto-restore` mechanism works correctly (non-issue)

**Category:** N/A (validated working)

**Symptom:**
User suspected auto-restore failed to restore T-test-3 after fix-1/fix-2 completed.

**Evidence — auto-restore triggered in fix-1 commit:**

```diff
# git show 0601430 -- index.json
-      "status": "blocked",
+      "status": "pending",
       "file": "run-e2e-tests.md",
```

**Evidence — auto-restore source code (`record.go:161-164`):**

```go
// Auto-restore: if this fix-task completed or skipped, check if source can be unblocked
if t.SourceTaskID != "" && (rd.Status == "completed" || rd.Status == "skipped") {
    autoRestoreSourceTask(index, t.SourceTaskID)
}
```

**Evidence — auto-restore logic (`record.go:209-223`):**

```go
func autoRestoreSourceTask(index *task.TaskIndex, sourceTaskID string) {
    srcKey, srcTask, err := task.FindTask(index, sourceTaskID)
    if err != nil || srcTask.Status != "blocked" {
        return
    }
    unmet := checkUnmetDeps(index, srcTask)
    if len(unmet) > 0 {
        return
    }
    srcTask.Status = "pending"
    index.SetTask(srcKey, *srcTask)
}
```

**Chain of events:**

1. fix-1 recorded as `completed` → `t.SourceTaskID = "T-test-3"` → `autoRestoreSourceTask("T-test-3")` called
2. T-test-3 was `blocked`, checkUnmetDeps found fix-2 still `in_progress` → no restore (correct)
3. fix-2 recorded as `completed` → `t.SourceTaskID = "T-test-3"` → `autoRestoreSourceTask("T-test-3")` called
4. T-test-3 was `blocked`, checkUnmetDeps found all deps completed → restored to `pending` (correct)
5. Committed in fix-2 commit `1153681` as `pending`

**Conclusion:** Auto-restore worked correctly. The "blocked" status observed in the current session was caused by the dispatcher **re-executing** T-test-3, which found new failures and blocked it again.

### Finding 3: Dispatcher re-executed T-test-3 despite prior record existing

**Category:** `pipeline-gap`

**Symptom:**
T-test-3 had a record file (`records/run-e2e-tests.md`) from a previous run. Dispatcher still claimed and re-executed it, producing a new record that overwrote the old one.

**Expected behavior:**
A task with a completed record and `pending` status (auto-restored) should be eligible for re-execution — this is by design for test tasks that need to pass after fix tasks complete.

**Gap:**
This is **working as designed** — T-test-3 is a test task that should be re-run after fixes. The issue is not the re-execution itself, but that when it fails again with new failures, the fix-task dedup (Finding 1) prevents creating new fix tasks.

## Root Cause Analysis

```
                    fix-1 completed ──→ auto-restore ──→ T-test-3: pending ✓
                    fix-2 completed ──→ auto-restore ──→ T-test-3: pending ✓
                                                            │
                    /run-tasks claimed T-test-3              │
                            │                               │
                    task-executor ran e2e                    │
                    21 new failures (TC-UI-021~041)         │
                            │                               │
                    T-test-3 → blocked                      │
                            │                               │
                    Step 3: grep "sourceTaskID.*T-test-3"   │
                            │                               │
                    Matched: fix-1 (completed) ─┐           │
                            fix-2 (completed) ──┤ false positive
                            disc-1 (completed) ─┘           │
                            │                               │
                    "fix tasks already exist, skip"          │
                            │                               │
                    No fix-3 created ──→ T-test-3 stuck     │
```

**The core bug:** The dedup check answers "does ANY task point to this source?" but the question should be "does any ACTIVE (non-completed/non-skipped) fix task point to this source?"

## Recommendations

| Priority | Action                                                                                      | Target                                                 | Finding   |
| -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| P0       | Fix Step 3 dedup: filter fix tasks by status, only match non-completed/non-skipped tasks    | `forge:run-tasks` skill `commands/run-tasks.md` Step 3 | Finding 1 |
| P1       | Consider adding a round/iteration counter to fix tasks (e2eRound) to distinguish fix rounds | `task-cli` + `forge:run-tasks`                         | Finding 1 |

### P0 Fix Detail

Replace the simple grep with a status-aware check:

```bash
# Current (buggy):
grep -l "sourceTaskID.*<TASK_ID>" docs/features/<FEATURE>/tasks/index.json

# Proposed: check if any ACTIVE fix task exists for this source
python3 -c "
import json, sys
index = json.load(open('docs/features/<FEATURE>/tasks/index.json'))
active = [k for k, t in index['tasks'].items()
          if t.get('sourceTaskID') == '<TASK_ID>'
          and t['status'] not in ('completed', 'skipped')]
sys.exit(0 if active else 1)
"
```

Or simpler bash approach:

```bash
# Extract sourceTaskID matches and check their status
grep -A1 "sourceTaskID.*<TASK_ID>" docs/features/<FEATURE>/tasks/index.json | \
  grep -v "completed\|skipped" && echo "ACTIVE_FIX_EXISTS" || echo "NO_ACTIVE_FIX"
```

## Evidence

| File                                      | Description                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `index.json` (HEAD commit `1153681`)      | T-test-3 `status: pending`, fix-1/fix-2 `status: completed` with `sourceTaskID: T-test-3` |
| `0601430` diff                            | fix-1 commit: T-test-3 changed from `blocked` to `pending` (auto-restore evidence)        |
| `1153681` diff                            | fix-2 commit: T-test-3 unchanged at `pending` (no new failures at commit time)            |
| `records/run-e2e-tests.md`                | Task-executor record: `status: blocked`, 34/128 pass, 21 fail (TC-UI-021~041)             |
| `records/fix-1.md`                        | fix-1 record: completed at 01:33, fixed TC-UI-003~015                                     |
| `records/fix-2.md`                        | fix-2 record: completed at 02:33, fixed TC-UI-003~020                                     |
| `task-cli/internal/cmd/record.go:161-164` | Auto-restore trigger code                                                                 |
| `task-cli/internal/cmd/record.go:209-223` | Auto-restore implementation                                                               |
| `run-tasks.md` Step 3                     | Dispatcher dedup check using `grep -l` without status filter                              |
