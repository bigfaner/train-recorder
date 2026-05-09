# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features/train-recorder/ui.spec.ts >> Train Recorder UI E2E Tests >> Plan Management >> TC-UI-003: Fixed cycle mode auto-scheduling
- Location: features/train-recorder/ui.spec.ts:30:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('mode-selector')

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { screenshot, baseUrl } from "../../helpers.js";
  3   | 
  4   | test.describe("Train Recorder UI E2E Tests", () => {
  5   |   // ── Plan Management (US-1) ────────────────────────────────────────
  6   | 
  7   |   test.describe("Plan Management", () => {
  8   |     // Traceability: TC-UI-001 → US-1 AC-1
  9   |     test("TC-UI-001: First-use empty state guide leads to plan creation", async ({
  10  |       page,
  11  |     }) => {
  12  |       await page.goto(`${baseUrl()}/`);
  13  |       await expect(page.getByTestId("empty-state-guide")).toBeVisible();
  14  |       await page.getByTestId("create-plan-btn").click();
  15  |       await expect(page).toHaveURL(/\/plan-editor/);
  16  |       await screenshot(page, "TC-UI-001");
  17  |     });
  18  | 
  19  |     // Traceability: TC-UI-002 → US-1 AC-2
  20  |     test("TC-UI-002: Endless loop mode auto-scheduling", async ({ page }) => {
  21  |       await page.goto(`${baseUrl()}/plan-editor`);
  22  |       await page.getByTestId("mode-selector").click();
  23  |       await page.getByTestId("mode-endless-loop").click();
  24  |       await page.getByTestId("save-plan-btn").click();
  25  |       await expect(page.getByText(/saved|success/i)).toBeVisible();
  26  |       await screenshot(page, "TC-UI-002");
  27  |     });
  28  | 
  29  |     // Traceability: TC-UI-003 → US-1 AC-3
  30  |     test("TC-UI-003: Fixed cycle mode auto-scheduling", async ({ page }) => {
  31  |       await page.goto(`${baseUrl()}/plan-editor`);
> 32  |       await page.getByTestId("mode-selector").click();
      |                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  33  |       await page.getByTestId("mode-fixed-cycle").click();
  34  |       await page.getByTestId("cycle-length-input").fill("4");
  35  |       await page.getByTestId("save-plan-btn").click();
  36  |       await expect(page.getByText(/saved|success/i)).toBeVisible();
  37  |       await screenshot(page, "TC-UI-003");
  38  |     });
  39  | 
  40  |     // Traceability: TC-UI-004 → US-1 AC-4
  41  |     test("TC-UI-004: Calendar today cell shows training type", async ({
  42  |       page,
  43  |     }) => {
  44  |       await page.goto(`${baseUrl()}/`);
  45  |       await expect(page.getByTestId("calendar-today-cell")).toBeVisible();
  46  |       await expect(page.getByTestId("training-type-label")).toBeVisible();
  47  |       await screenshot(page, "TC-UI-004");
  48  |     });
  49  | 
  50  |     // Traceability: TC-UI-005 → US-1 AC-5
  51  |     test("TC-UI-005: Switch plan reschedules calendar", async ({ page }) => {
  52  |       await page.goto(`${baseUrl()}/plan-editor`);
  53  |       await page.getByTestId("save-plan-btn").click();
  54  |       await page.getByTestId("activate-plan-btn").click();
  55  |       await page.goto(`${baseUrl()}/`);
  56  |       await expect(page.getByTestId("calendar-month-view")).toBeVisible();
  57  |       await screenshot(page, "TC-UI-005");
  58  |     });
  59  | 
  60  |     // Traceability: TC-UI-006 → US-1 AC-6
  61  |     test("TC-UI-006: No rest day plan shows warning", async ({ page }) => {
  62  |       await page.goto(`${baseUrl()}/plan-editor`);
  63  |       // Fill all 7 days without rest — exercise-specific steps
  64  |       await page.getByTestId("save-plan-btn").click();
  65  |       await expect(page.getByTestId("rest-day-warning")).toBeVisible();
  66  |       await screenshot(page, "TC-UI-006");
  67  |     });
  68  |   });
  69  | 
  70  |   // ── Workout Execution (US-2) ──────────────────────────────────────
  71  | 
  72  |   test.describe("Workout Execution", () => {
  73  |     // Traceability: TC-UI-007 → US-2 AC-1
  74  |     test("TC-UI-007: Exercise card shows suggested weight and target sets", async ({
  75  |       page,
  76  |     }) => {
  77  |       await page.goto(`${baseUrl()}/workout`);
  78  |       await page
  79  |         .getByTestId(/exercise-card-/)
  80  |         .first()
  81  |         .click();
  82  |       await expect(page.getByTestId("suggested-weight")).toBeVisible();
  83  |       await expect(page.getByTestId("target-sets-reps")).toBeVisible();
  84  |       await screenshot(page, "TC-UI-007");
  85  |     });
  86  | 
  87  |     // Traceability: TC-UI-008 → US-2 AC-2
  88  |     test("TC-UI-008: Complete set auto-starts rest countdown", async ({
  89  |       page,
  90  |     }) => {
  91  |       await page.goto(`${baseUrl()}/workout`);
  92  |       await page.getByTestId("reps-input").fill("8");
  93  |       await page.getByTestId("complete-set-btn").click();
  94  |       await expect(page.getByTestId("rest-timer")).toBeVisible();
  95  |       await expect(page.getByTestId("rest-timer")).toContainText(/0[12]:\d{2}/);
  96  |       await screenshot(page, "TC-UI-008");
  97  |     });
  98  | 
  99  |     // Traceability: TC-UI-009 → US-2 AC-3
  100 |     test("TC-UI-009: Countdown timer vibration and sound at zero", async ({
  101 |       page,
  102 |     }) => {
  103 |       await page.goto(`${baseUrl()}/workout`);
  104 |       // Complete a set to start countdown, then wait for zero
  105 |       // Note: vibration/audio cannot be fully tested in Playwright
  106 |       await expect(page.getByTestId("rest-timer")).toBeVisible();
  107 |       await screenshot(page, "TC-UI-009");
  108 |     });
  109 | 
  110 |     // Traceability: TC-UI-010 → US-2 AC-4
  111 |     test("TC-UI-010: Skip rest during countdown", async ({ page }) => {
  112 |       await page.goto(`${baseUrl()}/workout`);
  113 |       // Assume countdown is active
  114 |       await page.getByTestId("skip-rest-btn").click();
  115 |       await expect(page.getByTestId("rest-timer")).not.toBeVisible();
  116 |       await expect(page.getByTestId("next-set-prompt")).toBeVisible();
  117 |       await screenshot(page, "TC-UI-010");
  118 |     });
  119 | 
  120 |     // Traceability: TC-UI-011 → US-2 AC-5
  121 |     test("TC-UI-011: Modified weight marked as custom", async ({ page }) => {
  122 |       await page.goto(`${baseUrl()}/workout`);
  123 |       await page.getByTestId("suggested-weight").clear();
  124 |       await page.getByTestId("suggested-weight").fill("85");
  125 |       await page.getByTestId("reps-input").fill("8");
  126 |       await page.getByTestId("complete-set-btn").click();
  127 |       await expect(page.getByTestId("custom-weight-badge")).toBeVisible();
  128 |       await screenshot(page, "TC-UI-011");
  129 |     });
  130 | 
  131 |     // Traceability: TC-UI-012 → US-2 AC-6
  132 |     test("TC-UI-012: Complete set within 2 clicks", async ({ page }) => {
```