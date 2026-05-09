import { defineConfig } from "@playwright/test";

// E2E_FEATURE=1 disables testIgnore so `just test-e2e --feature <slug>` can run
// staging area tests. Without it, testIgnore excludes features/ from the regression suite.
const featureMode = !!process.env.E2E_FEATURE;

export default defineConfig({
  testDir: ".",
  testIgnore: featureMode ? [] : /^features\//,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalTimeout: 600_000,
  retries: Number(process.env.E2E_RETRIES ?? "0"),
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "results/test-results.json" }]],
  use: {
    baseURL: "http://localhost:8081",
    headless: true,
    screenshot: "only-on-failure",
  },
  outputDir: "results/",
  webServer: {
    command: "npx expo start --web --port 8081",
    port: 8081,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});
