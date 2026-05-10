---
id: "fix-1"
title: "Fix: Missing testIDs and data setup for UI e2e tests TC-UI-003~015"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: Missing testIDs and data setup for UI e2e tests TC-UI-003~015

## Root Cause

12 UI e2e tests fail. Root causes: (1) Missing testIDs: save-plan-btn feedback (TC-UI-003), activate-plan-btn (TC-UI-005), rest-day-warning (TC-UI-006), suggested-weight/reps-input on workout page (TC-UI-007~012), exit-confirm-dialog (TC-UI-014), current-set-display (TC-UI-015). (2) No data setup: tests navigate to /workout expecting exercise cards but no active session exists. Need beforeAll hooks to create plan and start workout. (3) globalTimeout in playwright.config.ts is 300s which is too low for 128 tests - increase to 600s. App health confirmed OK - screenshots show functional pages.

## Reference Files

- Source: app/,components/
- Test script: tests/e2e/features/train-recorder/ui.spec.ts
- Test results: tests/e2e/features/train-recorder/results/latest.md

## Verification

After fixing, verify the fix works:

1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task T-test-3 is automatically restored to pending if all its dependencies are completed.
