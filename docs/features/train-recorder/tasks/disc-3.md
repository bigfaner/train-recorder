---
id: "disc-3"
title: "Fix: UI e2e test failures - elements not found"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: UI e2e test failures - elements not found

## Root Cause

12 UI tests fail (TC-UI-001 to TC-UI-012), 102 did not run. Web server starts OK, 14 API tests pass. UI failures show elements not visible/found (e.g. suggestedWeight). Need to investigate app rendering on web vs test expectations and fix test selectors or test setup.

## Reference Files

- Source: tests/e2e/features/train-recorder/ui.spec.ts
- Test script: just test-e2e --feature train-recorder
- Test results: tests/e2e/features/train-recorder/results/latest.md

## Verification

After fixing, verify the fix works:

1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task disc-2 is automatically restored to pending if all its dependencies are completed.
