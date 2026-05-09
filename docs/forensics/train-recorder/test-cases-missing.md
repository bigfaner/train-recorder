---
title: "test-cases.md Missing — Path Mismatch in T-test-1"
date: 2026-05-09
feature: train-recorder
sessions: [subagent T-test-1 execution]
---

# Forensic Report: test-cases.md Missing

## Summary

T-test-1 (gen-test-cases) completed successfully and was marked `completed`, but `test-cases.md` is missing from its expected location. The file was written to the wrong path.

## Symptom

- `docs/features/train-recorder/testing/test-cases.md` does not exist
- `docs/features/train-recorder/testing/` directory does not exist
- T-test-1b (eval-test-cases) fails prerequisite check

## Root Cause Analysis

### 1. Symptom (Observable)

`eval-test-cases` skill prerequisite check fails — cannot find `docs/features/train-recorder/testing/test-cases.md`.

### 2. Direct Cause

T-test-1 task-executor subagent wrote the file to `testing/test-cases.md` (repo root) instead of `docs/features/train-recorder/testing/test-cases.md` (feature directory).

Evidence:

- Commit `5ba4ce6` shows file at path `testing/test-cases.md` (repo root)
- File confirmed to exist at `testing/test-cases.md` with correct content (106 test cases)
- No commit or file at `docs/features/train-recorder/testing/test-cases.md`

### 3. Root Cause

**Path ambiguity in task definition + subagent not following skill instructions.**

The gen-test-cases SKILL.md explicitly states:

> Fill template ... and write to `docs/features/<slug>/testing/test-cases.md`.

But the T-test-1 task file's acceptance criteria says:

> `testing/test-cases.md` file created

This relative path is ambiguous — the subagent resolved it against the repo root (`testing/test-cases.md`) rather than the feature directory (`docs/features/train-recorder/testing/test-cases.md`).

The subagent then verified the file existed at the path it wrote to (passing the acceptance criteria check), but it was the **wrong path**.

## Deviation Classification

| Category               | Description                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `instruction-gap`      | Task acceptance criteria uses ambiguous relative path `testing/test-cases.md` without feature prefix        |
| `trust-without-verify` | Task marked completed after verifying file at written path, not at expected path                            |
| `pipeline-gap`         | No cross-check between task record (says "modified testing/test-cases.md") and actual expected feature path |

## Impact

- T-test-1b blocked — cannot evaluate test cases
- Downstream tasks T-test-2 through T-test-5 all blocked (dependency chain)
- File exists at wrong location with correct content

## Recommended Fix

### Immediate (recover current state)

Copy/move file to correct location:

```bash
mkdir -p docs/features/train-recorder/testing/
mv testing/test-cases.md docs/features/train-recorder/testing/test-cases.md
```

### Preventive

1. **Task file fix**: Change acceptance criteria in gen-test-cases.md to use absolute feature path:
   `- [ ] docs/features/train-recorder/testing/test-cases.md file created`

2. **Record validation**: The `task record` step should verify artifact paths against the feature directory, not just the task's own acceptance criteria wording.

## Files Involved

| File                                                           | Role                                         |
| -------------------------------------------------------------- | -------------------------------------------- |
| `testing/test-cases.md`                                        | File at wrong location (has correct content) |
| `docs/features/train-recorder/tasks/gen-test-cases.md`         | Task definition with ambiguous path          |
| `docs/features/train-recorder/tasks/records/gen-test-cases.md` | Task record claiming completion              |
| `docs/features/train-recorder/tasks/index.json`                | T-test-1 status: completed                   |
| commit `5ba4ce6`                                               | Committed file to wrong path                 |
