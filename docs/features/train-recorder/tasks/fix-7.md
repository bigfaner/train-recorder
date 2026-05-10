---
id: "fix-7"
title: "Fix: Missing testIDs and seed data gaps causing 26 e2e failures"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: Missing testIDs and seed data gaps causing 26 e2e failures

## Root Cause

26 e2e tests fail: (1) Missing testIDs: history-record-_, body-record-_, exercise-item-squat, progress-tab, calendar-month-view, feeling/sport page elements (2) Calendar tests TC-UI-028~034 empty state — seed data not populating calendar views

## Reference Files

- Source: src/components/history/,src/components/body/,src/components/exercise/,src/components/feeling/,src/components/sport/,src/components/calendar/,app/seed.tsx
- Test script: tests/e2e/features/train-recorder/ui.spec.ts
- Test results: tests/e2e/features/train-recorder/results/latest.md

## Verification

After fixing, verify the fix works:

1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task T-test-3 is automatically restored to pending if all its dependencies are completed.
