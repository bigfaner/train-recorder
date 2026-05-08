---
id: "3.gate"
title: "Phase 3 Exit Gate"
priority: "P0"
estimated_time: "1h"
dependencies: ["3.summary"]
status: pending
breaking: true
---

# 3.gate: Phase 3 Exit Gate

## Description

Exit verification gate for Phase 3. Confirms the core training flow works end-to-end: calendar → workout → feeling, plus plan management.

## Verification Checklist

1. [ ] Tab navigation works: all 5 tabs switch correctly
2. [ ] Calendar page renders month view with training type indicators
3. [ ] Workout flow: start workout → record sets → complete → navigate to feeling
4. [ ] Timer panel slides in after set completion with countdown
5. [ ] Back button during workout shows confirmation dialog
6. [ ] Feeling page records fatigue, satisfaction, and per-exercise notes
7. [ ] Plan management: create plan → add training days → add exercises → save
8. [ ] Plan editor supports both fixed and custom set modes
9. [ ] Exercise library browse and search work
10. [ ] Exercise detail page shows PR, progress chart, recent sessions
11. [ ] Progressive overload suggestions display correctly in workout page
12. [ ] All prototype pages render without crashes
13. [ ] Project builds successfully
14. [ ] All tests pass

## Reference Files

- design/tech-design.md — Integration specs, PRD Coverage Map
- ui/ui-design.md — All 8 component specs
- ui/prototype/ — All prototype HTML files
- Phase 3 task records — `records/3.*.md`

## Acceptance Criteria

- [ ] All applicable verification checklist items pass
- [ ] Core training flow works end-to-end on simulator
- [ ] Any deviations from design are documented as decisions in the record
- [ ] Record created via `/record-task` with test evidence

## Implementation Notes

This is a verification-only task. No new feature code should be written.
Test the core user flow on a device/simulator to verify end-to-end integration.
