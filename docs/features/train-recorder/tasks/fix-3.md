---
id: "fix-3"
title: "Fix: plan-editor.tsx save button broken — controlled component without prop injection"
priority: "P0"
estimated_time: "1h"
dependencies: []
status: pending
breaking: true
sourceTaskID: "T-test-3"
---

# Fix: plan-editor.tsx save button broken

## Root Cause

`app/plan-editor.tsx` exports `PlanEditorScreen` as an expo-router page (line 72: `export default function`), but the component is designed as a **controlled component** requiring three props:

- `existingPlan: TrainingPlan | null` — always `undefined`
- `existingDays: TrainingDay[]` — always `undefined`
- `onSave: (...) => Promise<void>` — always `undefined`

When user clicks "Save":

1. `validatePlan()` runs → validation may fail (empty planName)
2. Even if validation passes, `onSave()` is called → `undefined()` throws silently (caught by try-catch)
3. Result: **save button does nothing** — no navigation, no DB write, no feedback

## Scope

Refactor `PlanEditorScreen` to work as a self-contained expo-router page:

1. Remove `PlanEditorScreenProps` dependency from the default export
2. Add internal save logic using DB repos (same as plan management tab does)
3. Call `router.back()` or `router.replace('/')` after successful save
4. Keep the controlled-component API available as a named export for reuse within tabs

## Reference Files

- `app/plan-editor.tsx` — the broken page (line 55-76: props interface + default export)
- `src/components/plan/` — plan-related utilities (validatePlan, TRAINING_TYPES, etc.)
- `src/db/repositories/` — PlanRepo, TrainingDayRepo for DB writes
- `docs/features/train-recorder/tasks/records/3.6-plan-pages.md` — original task record for plan pages

## Verification

After fixing:

1. `just test` — unit tests must pass
2. `just test-e2e --feature train-recorder` — TC-UI-003 (save plan) should progress past save
3. Manual: navigate to `/plan-editor`, fill form, click save → should save to DB and navigate back
