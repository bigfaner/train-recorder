---
id: "3.summary"
title: "Phase 3 Summary"
priority: "P0"
estimated_time: "15min"
dependencies: ["3.x"]
status: pending
---

# 3.summary: Phase 3 Summary

## Description

Generate a structured summary of all completed tasks in this phase. This summary is read by subsequent phase tasks to maintain cross-phase consistency.

## Instructions

### Step 1: Read all phase task records

Read each record file from `docs/features/train-recorder/tasks/records/` whose filename starts with `3.` and does NOT contain `.summary`.

### Step 2: Extract structured data into the summary field

<HARD-RULE>
The `summary` field in `record.json` MUST follow this exact template:
</HARD-RULE>

```
## Tasks Completed
- 3.1: {{one-line summary}}
- 3.2: {{one-line summary}}
- 3.3: {{one-line summary}}
- 3.4: {{one-line summary}}
- 3.5: {{one-line summary}}
- 3.6: {{one-line summary}}
- 3.7: {{one-line summary}}

## Key Decisions
- {{each keyDecision from all records, prefixed with task ID}}

## Types & Interfaces Changed
| Name | Change | Affects |
|------|--------|---------|
| {{type/interface name}} | {{added/modified/removed}} | {{affected tasks}} |

## Conventions Established
- {{each convention, prefixed with task ID}}

## Deviations from Design
- {{each deviation, or "None"}}
```

### Step 3: Populate remaining record.json fields

```json
{
  "taskId": "3.summary",
  "status": "completed",
  "summary": "<filled from Step 2>",
  "filesCreated": [],
  "filesModified": [],
  "keyDecisions": [],
  "testsPassed": 0,
  "testsFailed": 0,
  "coverage": -1.0,
  "acceptanceCriteria": [
    { "criterion": "All phase task records read and analyzed", "met": true },
    {
      "criterion": "Summary follows the exact template with all 5 sections",
      "met": true
    },
    {
      "criterion": "Types & Interfaces table lists every changed type",
      "met": true
    }
  ]
}
```

## Reference Files

- All phase task records: `docs/features/train-recorder/tasks/records/3.*.md`
- Design reference: `docs/features/train-recorder/design/tech-design.md`

## Acceptance Criteria

- [ ] All phase task records have been read
- [ ] Summary follows the exact 5-section template above
- [ ] Types & Interfaces Changed table is populated
- [ ] Record created via `/record-task` with `coverage: -1.0`

## Implementation Notes

This is a documentation-only task. No code should be written.
