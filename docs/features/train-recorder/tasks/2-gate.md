---
id: "2.gate"
title: "Phase 2 Exit Gate"
priority: "P0"
estimated_time: "1h"
dependencies: ["2.summary"]
status: pending
breaking: true
---

# 2.gate: Phase 2 Exit Gate

## Description

Exit verification gate for Phase 2. Confirms that all services and stores are complete, internally consistent, and pass their unit tests before UI pages are built on top.

## Verification Checklist

1. [ ] ProgressiveOverload service passes all overload scenario tests (increase/maintain/decrease/chain)
2. [ ] CalendarComputer produces correct day types for weekly_fixed and fixed_interval modes
3. [ ] TimerService state transitions work (start/pause/resume/skip/adjust/persist/recover)
4. [ ] PR Tracker correctly detects, records, and rolls back personal records
5. [ ] Exercise History returns correct session summaries
6. [ ] Unit Conversion kg↔lbs accuracy within tolerance
7. [ ] Data Export produces valid JSON with all entity arrays
8. [ ] Data Import validates and merges with conflict resolution
9. [ ] Onboarding templates create valid plans with exercises
10. [ ] Zustand stores state transitions pass unit tests
11. [ ] No type mismatches between service interfaces and store actions
12. [ ] Project builds successfully
13. [ ] All tests pass (`just test`)

## Reference Files

- design/tech-design.md — All service interfaces, Cross-Layer Data Map
- Phase 2 task records — `records/2.*.md`

## Acceptance Criteria

- [ ] All applicable verification checklist items pass
- [ ] Any deviations from design are documented as decisions in the record
- [ ] Record created via `/record-task` with test evidence

## Implementation Notes

This is a verification-only task. No new feature code should be written.
