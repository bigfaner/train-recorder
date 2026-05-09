---
id: "disc-1"
title: "Fix: Install Expo web dependencies for e2e testing"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: Install Expo web dependencies for e2e testing

## Root Cause

All 128 e2e tests fail because the Expo web server cannot start. Missing dependencies: react-dom and react-native-web. Run: npx expo install react-dom react-native-web. Also fix api.spec.ts to use baseUrl() for page.goto() calls instead of relative URLs.

## Reference Files

- Source: package.json
- Test script: tests/e2e/features/train-recorder/ui.spec.ts
- Test results: tests/e2e/features/train-recorder/results/latest.md

## Verification

After fixing, verify the fix works:

1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task T-test-3 is automatically restored to pending if all its dependencies are completed.
