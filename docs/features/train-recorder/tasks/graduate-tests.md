---
id: "T-test-4"
title: "Graduate Test Scripts"
priority: "P1"
estimated_time: "30min"
dependencies: ["T-test-3"]
status: pending
---

# Graduate Test Scripts

## Description

Call `/graduate-tests` skill to migrate feature test scripts from `tests/e2e/features/train-recorder/` to the project-wide regression suite at `tests/e2e/`.

## Reference Files

- `tests/e2e/features/train-recorder/results/latest.md` — Must show PASS
- `tests/e2e/features/train-recorder/` — Source scripts
- `tests/e2e/` — Destination

## Acceptance Criteria

- [ ] `tests/e2e/features/train-recorder/results/latest.md` shows status = PASS
- [ ] `tests/e2e/.graduated/train-recorder` marker exists
- [ ] Spec files present in `tests/e2e/<module>/`

## User Stories

No direct user story mapping. This is a standard test graduation task.

## Implementation Notes

**Step 1**: Verify e2e passed (read latest.md)
**Step 2**: Run `/graduate-tests` skill
**Step 3**: Record completion
