---
id: "4.gate"
title: "Phase 4 Exit Gate"
priority: "P0"
estimated_time: "1h"
dependencies: ["4.summary"]
status: pending
breaking: true
---

# 4.gate: Phase 4 Exit Gate

## Description

Exit verification gate for Phase 4. Final gate before test tasks begin. Confirms all features are complete and the full app works as designed.

## Verification Checklist

1. [ ] History page: all 4 segments render correctly with chart data
2. [ ] Stats page: hero card, four-grid, bar chart, PR list, heatmap all populated
3. [ ] Settings page: all toggles save, export/import/clear work
4. [ ] Body data page: recording, trend chart, history list work
5. [ ] Other sport page: preset types, custom types, dynamic metrics work
6. [ ] Onboarding page: welcome → template → create plan flow works
7. [ ] Unit switching (kg↔lbs) updates all displays globally
8. [ ] Data export produces valid JSON; import merges correctly
9. [ ] All 5 tab pages render without crashes
10. [ ] Full app navigation flow works: all push pages accessible and returnable
11. [ ] Project builds successfully
12. [ ] All tests pass (`just test`)
13. [ ] No deviations from design spec (or deviations are documented)

## Reference Files

- design/tech-design.md — PRD Coverage Map (all remaining items)
- Phase 4 task records — `records/4.*.md`

## Acceptance Criteria

- [ ] All applicable verification checklist items pass
- [ ] Full app is functional on device/simulator
- [ ] Any deviations from design are documented as decisions in the record
- [ ] Record created via `/record-task` with test evidence

## Implementation Notes

This is a verification-only task. No new feature code should be written.
This is the final gate before e2e testing begins.
