---
status: "completed"
started: "2026-05-09 17:42"
completed: "2026-05-09 17:47"
time_spent: "~5m"
---

# Task Record: disc-1 Fix: Install Expo web dependencies for e2e testing

## Summary

Installed react-dom and react-native-web for Expo web support (required for e2e testing). Fixed api.spec.ts to use baseUrl() helper for page.goto() calls instead of relative URLs, matching the pattern used in ui.spec.ts.

## Changes

### Files Created

无

### Files Modified

- package.json
- package-lock.json
- tests/e2e/features/train-recorder/api.spec.ts

### Key Decisions

- Used npx expo install with --legacy-peer-deps to resolve react-test-renderer peer dependency conflict
- Imported baseUrl from helpers.js in api.spec.ts to match ui.spec.ts pattern

## Test Results

- **Passed**: 982
- **Failed**: 0
- **Coverage**: 72.3%

## Acceptance Criteria

- [x] react-dom and react-native-web installed and present in package.json
- [x] api.spec.ts uses baseUrl() for all page.goto() calls
- [x] All existing tests pass
- [x] TypeScript compilation passes

## Notes

Coverage is 72.3% (pre-existing baseline, not affected by this fix-task). The fix enables Expo web server startup for e2e testing.
