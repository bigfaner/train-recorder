---
status: "blocked"
started: "2026-05-10 14:55"
completed: "N/A"
time_spent: ""
---

# Task Record: T-test-3 Run e2e Tests

## Summary

Executed e2e tests for train-recorder feature. 35/128 tests passed (14 API + 21 UI), 26 failed (all UI - missing testIDs), 67 skipped (globalTimeout). App health confirmed OK - no crash issues. Failures are due to missing testID props on UI components and empty-state pages for calendar/feeling/body-data tests.

## Changes

### Files Created

无

### Files Modified

- tests/e2e/features/train-recorder/results/latest.md

### Key Decisions

- App health verified before running tests - server started manually, confirmed HTTP 200
- Previous ExpoSQLite crash is resolved - app renders correctly with 35 passes
- 26 UI test failures classified as test-level issues (missing testIDs), not app health
- 67 tests did not run due to globalTimeout (1200s) consumed by 61 executed tests

## Test Results

- **Tests Executed**: No
- **Passed**: 35
- **Failed**: 26
- **Coverage**: N/A (task has no tests)

## Acceptance Criteria

- [x] tests/e2e/features/train-recorder/results/latest.md exists
- [ ] All tests pass (status = PASS in latest.md)

## Notes

26 failures need fix tasks: missing testIDs on history-record-_, body-record-_, exercise-item-\*, progress-tab, calendar-month-view, feeling page elements, other sports elements. Calendar tests (TC-UI-028~034) also show empty state instead of seeded data.
