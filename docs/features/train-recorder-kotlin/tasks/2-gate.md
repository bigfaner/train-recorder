---
id: "2.gate"
title: "Phase 2 Exit Gate"
priority: "P0"
estimated_time: "1h"
dependencies: ["2.summary"]
status: pending
breaking: true
mainSession: false
scope: all
---

# Phase 2 Exit Gate

## Gate Criteria
Phase 2 is complete when all of the following are verified:

### Repository Layer
- [ ] ExerciseRepository: all CRUD operations pass, seed data inserts on first launch, delete guards with `ExerciseInUseError`
- [ ] SettingsRepository: get/update round-trip, unit conversion (1 kg = 2.20462 lb), export/import, clearAllData
- [ ] TrainingPlanRepository: plan CRUD with nested training days, activate/deactivate, cascade deletes
- [ ] WorkoutRepository: full session lifecycle (create → record → complete/partial), cascade delete, backfill
- [ ] BodyDataRepository: CRUD with date-range queries
- [ ] OtherSportRepository: sport type CRUD with metrics, record creation
- [ ] FeelingRepository: save/update with exercise-level notes
- [ ] PersonalRecordRepository: auto-update after workout, recalculate on delete
- [ ] WeightSuggestionRepository: cache layer, recalculation from history

### Use Cases
- [ ] WeightSuggester: all algorithm branches tested (increment / hold / deload / CONSIDER_MORE / first-time null)
- [ ] ScheduleCalculator: both modes (weekly_fixed, fixed_interval) produce correct day types
- [ ] All unit tests pass

### SQLDelight
- [ ] All `.sq` query files created and compile without errors

### Integration
- [ ] No regressions in Phase 1 code
- [ ] Project builds successfully on all platforms

## Gate Decision
- **PASS**: All criteria met → proceed to Phase 3 (Presentation Layer)
- **FAIL**: Document failing criteria, create follow-up tasks, re-test

## Sign-off
| Role | Name | Date | Result |
|------|------|------|--------|
| Developer | | | |
| Reviewer | | | |
