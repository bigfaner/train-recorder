---
id: "fix-4"
title: "Fix: Missing testIDs on feeling, calendar, other-sport, body-data, workout pages"
priority: "P0"
estimated_time: "2h"
dependencies: []
status: pending
breaking: true
sourceTaskID: "T-test-3"
---

# Fix: Missing testIDs on multiple pages

## Root Cause

TC-UI-021~041, 055~068 tests expect `testID` props on React Native components that were never added. Pages render correctly but tests can't locate interactive elements.

## Missing testIDs by Page

### Feeling Page (`/feeling`) — TC-UI-023~026

- `fatigue-slider`, `satisfaction-slider` — slider components
- `save-feeling-btn` — save button
- `exercise-note-*` (per exercise) — note inputs
- `exercise-note-list` — note list container

### Calendar Page (`/`) — TC-UI-028~029, 032~035, 055, 067

- `calendar-month-view` — month grid container
- `day-cell-today` — today's cell
- `training-type-label` — type label on day cell
- `skip-streak-warning` — streak warning
- `context-menu` — right-click menu
- `skip-day-btn`, `undo-skip-btn` — skip/undo buttons
- `completion-mark` — training completion indicator

### Other Sport Page (`/other-sport`) — TC-UI-036~040

- `sport-type-list` — sport type container
- `sport-type-item-swim` — swimming item
- `metric-distance-input`, `metric-duration-input` — metric inputs
- `custom-sport-btn` — custom sport creation button
- `sport-name-input` — sport name input
- `save-custom-sport-btn`, `save-sport-btn` — save buttons

### Body Data Page (`/body-data`) — TC-UI-041

- `date-picker` — date selector
- `weight-input`, `chest-input`, `waist-input`, `arm-input`, `thigh-input` — body measurement inputs
- `save-body-data-btn` — save button
- `trend-chart-btn` — trend chart toggle

### Workout Page (`/workout`) — TC-UI-056, 068

- `rest-timer` — rest timer display
- `next-set-btn` — next set button
- `retroactive-form` — retroactive logging form
- `overtime-message` — overtime indicator
- `resume-workout-btn` — resume button

## Approach

1. Find each component file listed above
2. Add `testID` prop to the relevant `<View>`, `<TextInput>`, `<TouchableOpacity>`, or `<Pressable>` element
3. For list items, use `testID={`${baseId}-${index}`}` pattern where needed

## Reference Files

- `tests/e2e/features/train-recorder/ui.spec.ts` — test expectations (search for testID strings)
- `src/components/feeling/` — feeling page components
- `src/components/calendar/` — calendar components
- `src/components/workout/` — workout page components
- `app/` — page route files

## Verification

1. `just test` — must pass
2. `just test-e2e --feature train-recorder` — affected TC-UI tests should progress (may still fail due to missing data from fix-5)
