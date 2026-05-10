# Decision: E2E Testing Strategy Migration

**Date:** 2026-05-10
**Status:** Decided
**Context:** Train Recorder (Expo SDK 54 + React Native 0.81)

## Decision

Adopt a three-layer testing strategy: **Jest unit tests + @testing-library/react-native component tests + Maestro E2E**. Deprecate and remove the current Playwright-based web E2E setup.

## Background

### Previous Approach: Playwright on Expo Web

The project used Playwright to test the Expo React Native app running on web (`expo start` → Metro dev server → `localhost:8081`). This approach had fundamental issues:

| Problem | Root Cause | Impact |
|---------|-----------|--------|
| **Extremely slow** | Metro dev server real-time bundling + WASM loading (sql.js ~2MB, Skia ~4MB) + single worker serial execution | 128 tests take 20+ minutes |
| **Frequent crashes** | Native modules (expo-sqlite, react-native-gesture-handler, expo-notifications, expo-background-fetch) have no web implementation, require per-module shims | Every native module is a potential crash point requiring a fix task |
| **Fix chain escalation** | Each e2e failure generates a fix task; fixes address surface symptoms (missing testID, missing shim) while underlying incompatibility keeps surfacing | Dispatcher loop runs 2+ hours without converging |
| **Unreliable results** | Many tests cover native-only features (background timer, notifications, gestures) that cannot pass on web | False negatives mask real issues |

### Evidence: Dispatcher Session 2026-05-10

A single `/run-tasks` session ran for ~2 hours (13:28–15:30) executing this chain:

```
fix-3 (plan-editor save) → fix-4 (missing testIDs) → fix-5 (data seeding)
  → T-test-3 attempt 1 (ExpoSQLite crash) → fix-6 (web DB shim)
  → T-test-3 attempt 2 (26 failures) → fix-7 (wire pages to DB)
  → T-test-3 attempt 3 (interrupted by user)
```

Each cycle: dispatch subagent → subagent runs e2e → failures → creates fix → dispatcher claims fix → repeat. The dispatcher has no convergence detection or budget limit.

## New Strategy

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Maestro E2E (Android emulator / iOS sim)      │
│  10-20 critical user paths, run in CI/CD or on-demand   │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Component Integration Tests (RNTL)             │
│  @testing-library/react-native + in-memory SQLite        │
│  Page interactions, navigation, state transitions         │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Unit Tests (Jest) ← existing, 991 tests ✅     │
│  services, stores, repos, hooks, utils                   │
└─────────────────────────────────────────────────────────┘
```

### Layer 1: Unit Tests (Unchanged)

Current state: 35 suites, 991 tests. Covers services, stores, repositories, hooks, and utils. Fast and stable.

### Layer 2: Component Integration Tests (New)

**Tool:** `@testing-library/react-native` + Expo Router testing utilities

**Why this replaces most Playwright tests:**

- **No web runtime dependency** — renders React components in Jest process
- **No native module shims needed** — mock at JS level, no WASM loading
- **Fast** — milliseconds per test, no Metro bundling
- **Reliable** — deterministic, no flaky element selection from a real DOM
- **Broad coverage** — page navigation, form interactions, data flow, state changes

**Scope:** Covers ~80% of what the current 128 Playwright tests attempt:
- Page rendering and navigation
- Form input and validation
- Data display (lists, charts, stats)
- User flow (create plan → record workout → view history)
- State transitions (workout states, timer states)

**Does NOT cover (needs Maestro):**
- Actual native module behavior (SQLite on device, notifications, background tasks)
- Real gesture interactions (swipe, long press)
- Performance on device
- Platform-specific rendering differences

### Layer 3: Maestro E2E (New)

**Tool:** [Maestro](https://maestro.dev/) — YAML-based mobile UI testing

**Why Maestro over Detox/Appium:**

| Criteria | Maestro | Detox | Appium |
|----------|---------|-------|--------|
| Expo managed workflow | Works with Expo Go | Requires native build | Possible but complex |
| Setup complexity | Low (YAML flows) | Medium-High | High |
| Windows support | Android emulator | Android emulator | Android emulator |
| CI integration | [EAS Workflows](https://docs.expo.dev/eas/workflows/examples/e2e-tests/), Maestro Cloud | Requires native CI setup | Requires Appium server |
| Test authoring | YAML (non-programmer friendly) | JavaScript | Multiple languages |
| Maintenance | Low | Medium | High |

**Scope:** 10-20 critical user paths only:
1. Create training plan → add exercises → save
2. Start workout from calendar → record sets → complete
3. Mid-workout timer (start/pause/resume)
4. View workout history → filter by date
5. Personal record detection → notification
6. Settings change (unit system, rest timer)
7. Retroactive workout logging
8. Onboarding flow

### What Gets Removed

```
tests/e2e/                          ← entire directory (Playwright-based)
  playwright.config.ts
  package.json                      ← @playwright/test dependency
  helpers.ts
  config.yaml
  features/train-recorder/
    ui.spec.ts                      ← 151 test cases → migrate to RNTL
    api.spec.ts                     ← 25 test cases → migrate to RNTL
    results/
```

**Justfile changes:**
- Remove: `e2e-setup`, `test-e2e`, `probe` recipes
- Add: `test-maestro` recipe (run Maestro flows)
- Keep: `test` recipe (unit + component tests)

## Migration Plan

### Phase 1: Add RNTL Component Tests (no removal)

1. Install `@testing-library/react-native` and Expo Router test utilities
2. Create component test infrastructure (render helpers, navigation mocks, DB fixtures)
3. Migrate high-value Playwright test cases to RNTL tests:
   - US-1: Calendar view and day selection
   - US-2: Plan creation and editing
   - US-3: Workout recording flow
   - US-4: Timer panel interaction
   - US-5: Feeling submission
   - US-6: History browsing
   - US-7: Stats display
4. Run both test suites in parallel until RNTL coverage is sufficient

### Phase 2: Add Maestro Core Flows

1. Install Maestro CLI (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
2. Create `.maestro/` directory with YAML flows for 10-20 critical paths
3. Configure Android emulator for local testing
4. Set up EAS Workflows for CI execution

### Phase 3: Remove Playwright

1. Delete `tests/e2e/` directory
2. Remove Playwright-related justfile recipes
3. Remove `sql.js` WASM dependency (only needed for web SQLite shim)
4. Remove web-specific platform shims (`database.web.ts` etc.)
5. Update forge conventions: remove e2e-app-health-first, e2e-server-lifecycle, e2e-fix-task-boundaries
6. Update forge T-test pipeline to use RNTL + Maestro instead of Playwright

## Forge Implications

### Changes Needed in Forge Skills

1. **`/gen-test-scripts`** — Should generate RNTL component tests + Maestro YAML flows instead of Playwright `.spec.ts` files
2. **`/run-e2e-tests`** — Should run `just test` (RNTL) + `just test-maestro` instead of Playwright
3. **`/graduate-tests`** — Graduated tests go to `__tests__/integration/` (RNTL) or `.maestro/` (Maestro) instead of `tests/e2e/`
4. **`/gen-test-cases`** — Should classify tests as `component` (RNTL) or `native-e2e` (Maestro) instead of `UI/API/CLI`
5. **T-test pipeline** — T-test-1 through T-test-4.5 need updated to reflect new tooling
6. **Breaking task gate** — Step 5b should run `just test` (which now includes component tests) instead of `just test-e2e`
7. **Justfile template** — Remove `e2e-setup`, `probe`, `test-e2e`; add `test-maestro`

### Dispatcher Improvements

The 2-hour loop revealed dispatcher weaknesses that apply regardless of testing tool:

1. **Budget limit** — Add max iterations (e.g., 10 tasks) or max time (e.g., 90 min) per dispatcher session
2. **Convergence detection** — If the same task (T-test-3) is blocked → unblocked → re-blocked 3 times, stop and escalate
3. **Fix chain depth limit** — Max 3 fix tasks per source task before requiring human intervention
4. **No fix-task hoarding** — When a fix task completes and re-unblocks the source, the dispatcher should evaluate whether the fix actually addresses the root cause before re-running the source task

### Convention Updates

Remove:
- `docs/conventions/e2e-app-health-first.md` (Playwright-specific)
- `docs/conventions/e2e-server-lifecycle.md` (Metro/Playwright-specific)
- `docs/conventions/e2e-fix-task-boundaries.md` (Playwright fix patterns)

Add:
- `docs/conventions/component-testing.md` (RNTL patterns, render helpers, mocking strategy)
- `docs/conventions/maestro-testing.md` (YAML flow patterns, emulator setup, CI config)

## References

- [Expo Router Testing Docs](https://docs.expo.dev/router/reference/testing/) — official RNTL + Expo Router testing utilities
- [Maestro QuickStart](https://docs.maestro.dev/get-started/quickstart) — getting started with Maestro
- [EAS Workflows + Maestro E2E](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) — CI integration
- [Maestro vs Detox Comparison](https://maestro.dev/insights/best-react-native-testing-frameworks) — tool selection rationale
- [Expo + MSW Example](https://github.com/firasrg/expo-msw) — API mocking in Expo tests
