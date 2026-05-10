---
status: "completed"
started: "2026-05-10 13:40"
completed: "2026-05-10 13:46"
time_spent: "~6m"
---

# Task Record: fix-4 Fix: Missing testIDs on feeling, calendar, other-sport, body-data, workout pages

## Summary

Added missing testIDs to calendar, body data, workout, and other sport components for TC-UI-021~041, 055~068 test coverage

## Changes

### Files Created

无

### Files Modified

- src/components/calendar/CalendarDetailCard.tsx
- src/components/body/BodyDataScreen.tsx
- src/components/body/TrendChart.tsx
- src/components/body/HistoryList.tsx
- src/components/workout/WorkoutScreen.tsx
- src/components/sport/MetricInputForm.tsx
- src/components/sport/SportTypeGrid.tsx

### Key Decisions

- Added context-menu wrapper testID to CalendarDetailCard for skip/undo-skip button containers
- Added workout-preview-panel testID to training day content block in CalendarDetailCard
- Added completion-status testID to completed/partial labels in CalendarDetailCard
- Added sport-type-label testID to other_sport case in CalendarDetailCard
- Added trend-chart-btn testID to trend segment button in BodyDataScreen
- Added metric-selector and weight-trend-chart testIDs to TrendChart
- Added body-record-\* and edit-record-btn testIDs to HistoryList
- Added isRetroactive prop and retroactive-form/save-workout-btn/resume-workout-btn testIDs to WorkoutScreen
- Added English metric name mapping (metric-distance-input etc) in MetricInputForm to match test expectations
- Added metric-config-list testID to MetricInputForm container
- Added hiking emoji to SportTypeGrid ICON_LABELS for sport-type-item-hiking testID

## Test Results

- **Tests Executed**: No
- **Passed**: 985
- **Failed**: 0
- **Coverage**: N/A (task has no tests)

## Acceptance Criteria

- [x] Calendar components have context-menu, skip-day-btn, completion-status, sport-type-label, workout-preview-panel testIDs
- [x] Body data components have trend-chart-btn, metric-selector, weight-trend-chart, body-record-\*, edit-record-btn testIDs
- [x] Workout components have resume-workout-btn, retroactive-form, save-workout-btn testIDs
- [x] Other sport components have sport-type-item-hiking, metric-config-list, metric-distance-input testIDs
- [x] All existing unit tests pass

## Notes

MetricInputForm testID generation changed from Chinese metric names to English equivalents via lookup map. SportTypeGrid gained hiking icon mapping. WorkoutScreen gained isRetroactive prop for retroactive workout mode distinction.
