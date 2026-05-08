---
id: "T-test-5"
title: "Consolidate Specs"
priority: "P2"
estimated_time: "20min"
dependencies: ["T-test-4.5"]
status: pending
---

# Consolidate Specs

## Description

Call `/consolidate-specs` skill to extract business rules and technical specifications from feature documents into `specs/` directory.

## Reference Files

- `docs/features/train-recorder/prd/prd-spec.md` — Source for business rules
- `docs/features/train-recorder/prd/prd-user-stories.md` — Source for business context
- `docs/features/train-recorder/design/tech-design.md` — Source for technical specs

## Acceptance Criteria

- [ ] `docs/features/train-recorder/specs/biz-specs.md` exists with extracted business rules
- [ ] `docs/features/train-recorder/specs/tech-specs.md` exists with extracted technical specs
- [ ] If any `[CROSS]` items exist: `docs/features/train-recorder/specs/review-choices.md` exists
- [ ] `docs/features/train-recorder/specs/.integrated` marker exists

## User Stories

No direct user story mapping. This is a standard knowledge consolidation task.

## Implementation Notes

**Step 1**: Verify prerequisites (feature documents exist)
**Step 2**: Run `/consolidate-specs` skill
**Step 3**: If ALL items are [LOCAL], skip integration (early exit)
**Step 4**: If CROSS items exist, present to user for review
**Step 5**: Integrate approved items and record completion
