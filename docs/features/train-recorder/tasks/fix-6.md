---
id: "fix-6"
title: "Fix: ExpoSQLite web compatibility crash"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: ExpoSQLite web compatibility crash

## Root Cause

App crashes on web with 'Cannot find native module ExpoSQLite'. Every page shows Expo error overlay. All 128 e2e tests fail because the app never renders. Need to add web-compatible SQLite adapter or mock for expo-sqlite. The error comes from expo-modules/core/src/requireNativeModule.web.ts which has no web implementation for ExpoSQLite.

## Reference Files

- Source: app.config.ts, package.json, src/db/
- Test script: tests/e2e/features/train-recorder/
- Test results: tests/e2e/features/train-recorder/results/latest.md

## Verification

After fixing, verify the fix works:

1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task T-test-3 is automatically restored to pending if all its dependencies are completed.
