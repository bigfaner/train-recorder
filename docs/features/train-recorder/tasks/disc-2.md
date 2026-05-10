---
id: "disc-2"
title: "Fix: Add webServer config to playwright.config.ts"
priority: "P0"
estimated_time: "30min"
dependencies: []
status: pending
breaking: true
---

# Fix: Add webServer config to playwright.config.ts

## Root Cause

Playwright config is missing webServer section. Expo web server starts fine manually but e2e tests don't auto-start it. Add webServer config to playwright.config.ts with 'npx expo start --web --port 8081' command.

## Reference Files

- Source: tests/e2e/playwright.config.ts
- Test script: just test-e2e --feature train-recorder
- Test results: tests/e2e/features/train-recorder/results/latest.md

## Verification

After fixing, verify the fix works:

1. `just test [scope]` — must pass
2. If UI/page related: `just test-e2e --feature <slug>` — must also pass

When this task is recorded as completed via `task record`, the source task disc-1 is automatically restored to pending if all its dependencies are completed.
