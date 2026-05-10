---
id: "fix-5"
title: "Fix: Add e2e data seeding mechanism — tests fail on empty state"
priority: "P0"
estimated_time: "2h"
dependencies: ["fix-3", "fix-4"]
status: pending
breaking: true
sourceTaskID: "T-test-3"
---

# Fix: Add e2e data seeding mechanism

## Root Cause

21+ tests fail because they require pre-existing data (plans, workout history, calendar entries, body measurements) that doesn't exist in the web standalone environment. The app starts with an empty SQLite database every time.

Tests affected:

- TC-UI-021, 022, 027: History page (need workout records)
- TC-UI-030, 031, 032, 034, 035, 039, 055, 067: Calendar page (need active plan + scheduled days)
- TC-UI-036, 038, 040: Other sport (need prior state)
- TC-UI-062~066: History detail (need workout records)
- TC-API-007~014: API tests that hit /workout (need plan + exercises)

## Approach

Two options (implement the simpler one):

**Option A: Seed via URL param or API endpoint**

- Add a `/seed` route or `?seed=test` query param that populates the database with test fixtures
- Tests call `page.goto(baseUrl() + '/seed')` or `page.goto(baseUrl() + '/?seed=test')` before navigation
- Fixtures: 1 training plan, 3-5 workout sessions, body measurements

**Option B: Seed in beforeEach via Playwright**

- Use Playwright `page.evaluate()` to call app's storage layer directly
- Requires exposing a seeding function on `window` during e2e mode

Prefer **Option A** — simpler, no window pollution.

## Seed Data Requirements

Minimum data to cover all failing tests:

1. **Training Plan**: "PPL 无限循环", infinite_loop mode, weekly_fixed schedule, 6 training days
2. **Workout Sessions**: 3-5 completed sessions with sets (squat, bench, deadlift)
3. **Calendar State**: Current week has scheduled days, some completed, some skipped
4. **Body Measurements**: 2-3 entries for weight/chest/waist
5. **Feeling Records**: 2-3 feeling entries linked to completed workouts

## Reference Files

- `tests/e2e/features/train-recorder/ui.spec.ts` — test expectations for pre-existing data
- `tests/e2e/helpers.ts` — test helper functions (add seedData helper here)
- `src/db/` — database layer for understanding schema
- `src/types.ts` — type definitions for seed data

## Verification

1. `just test` — must pass
2. `just test-e2e --feature train-recorder` — TC-UI-021+, TC-API-007+ should progress to testing actual behavior (not stuck on "element not found")
