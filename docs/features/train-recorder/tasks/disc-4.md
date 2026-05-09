---
id: "disc-4"
title: "Fix: TC-UI-001/002 empty state and plan-editor elements missing"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: TC-UI-001/002 empty state and plan-editor elements missing

## Root Cause

Only 2 UI tests still fail: TC-UI-001 (empty state guide, create-plan-btn not found) and TC-UI-002 (mode-selector not found on plan-editor). These cascade-block 112 other UI tests. Fix test setup/seeding or adjust test expectations for these 2 tests.

## Reference Files

- Source: tests/e2e/features/train-recorder/ui.spec.ts
- Test script: just test-e2e --feature train-recorder
- Test results: tests/e2e/features/train-recorder/results/latest.md

## Verification

After fixing, verify the fix works:
1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task disc-3 is automatically restored to pending if all its dependencies are completed.
