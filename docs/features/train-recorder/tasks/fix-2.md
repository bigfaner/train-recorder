---
id: "fix-2"
title: "Fix: 17 UI e2e tests failing (TC-UI-003~020) - missing testIDs and state"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: 17 UI e2e tests failing (TC-UI-003~020) - missing testIDs and state

## Root Cause

17 UI tests still fail after fix-1. Tests TC-UI-003~006 (plan/calendar pages) and TC-UI-007~014 (workout pages) and TC-UI-016~020 (history pages) - mostly missing testIDs, data setup, or unconnected state in web standalone mode. Fix individual testIDs and adjust test expectations where app behavior differs from test assumptions.

## Reference Files

- Source: app/(tabs)/calendar.tsx,app/workout.tsx,src/components/workout/,src/components/history/,src/components/calendar/
- Test script: tests/e2e/features/train-recorder/ui.spec.ts
- Test results: tests/e2e/results/

## Verification

After fixing, verify the fix works:

1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task fix-1 is automatically restored to pending if all its dependencies are completed.
