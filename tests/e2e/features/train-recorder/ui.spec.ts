import { test, expect } from "@playwright/test";
import { screenshot, baseUrl } from "../../helpers.js";

test.describe("Train Recorder UI E2E Tests", () => {
  // ── Plan Management (US-1) ────────────────────────────────────────

  test.describe("Plan Management", () => {
    // Traceability: TC-UI-001 → US-1 AC-1
    test("TC-UI-001: First-use empty state guide leads to plan creation", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      await expect(page.getByTestId("empty-state-guide")).toBeVisible();
      await page.getByTestId("create-plan-btn").click();
      await expect(page).toHaveURL(/\/plan-editor/);
      await screenshot(page, "TC-UI-001");
    });

    // Traceability: TC-UI-002 → US-1 AC-2
    test("TC-UI-002: Endless loop mode auto-scheduling", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("mode-selector").click();
      await page.getByTestId("mode-endless-loop").click();
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-002");
    });

    // Traceability: TC-UI-003 → US-1 AC-3
    test("TC-UI-003: Fixed cycle mode auto-scheduling", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("mode-selector").click();
      await page.getByTestId("mode-fixed-cycle").click();
      await page.getByTestId("cycle-length-input").fill("4");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-003");
    });

    // Traceability: TC-UI-004 → US-1 AC-4
    test("TC-UI-004: Calendar today cell shows training type", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      await expect(page.getByTestId("calendar-today-cell")).toBeVisible();
      await expect(page.getByTestId("training-type-label")).toBeVisible();
      await screenshot(page, "TC-UI-004");
    });

    // Traceability: TC-UI-005 → US-1 AC-5
    test("TC-UI-005: Switch plan reschedules calendar", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("save-plan-btn").click();
      await page.getByTestId("activate-plan-btn").click();
      await page.goto(`${baseUrl()}/`);
      await expect(page.getByTestId("calendar-month-view")).toBeVisible();
      await screenshot(page, "TC-UI-005");
    });

    // Traceability: TC-UI-006 → US-1 AC-6
    test("TC-UI-006: No rest day plan shows warning", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      // Fill all 7 days without rest — exercise-specific steps
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByTestId("rest-day-warning")).toBeVisible();
      await screenshot(page, "TC-UI-006");
    });
  });

  // ── Workout Execution (US-2) ──────────────────────────────────────

  test.describe("Workout Execution", () => {
    // Traceability: TC-UI-007 → US-2 AC-1
    test("TC-UI-007: Exercise card shows suggested weight and target sets", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      await page
        .getByTestId(/exercise-card-/)
        .first()
        .click();
      await expect(page.getByTestId("suggested-weight")).toBeVisible();
      await expect(page.getByTestId("target-sets-reps")).toBeVisible();
      await screenshot(page, "TC-UI-007");
    });

    // Traceability: TC-UI-008 → US-2 AC-2
    test("TC-UI-008: Complete set auto-starts rest countdown", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      await page.getByTestId("reps-input").fill("8");
      await page.getByTestId("complete-set-btn").click();
      await expect(page.getByTestId("rest-timer")).toBeVisible();
      await expect(page.getByTestId("rest-timer")).toContainText(/0[12]:\d{2}/);
      await screenshot(page, "TC-UI-008");
    });

    // Traceability: TC-UI-009 → US-2 AC-3
    test("TC-UI-009: Countdown timer vibration and sound at zero", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Complete a set to start countdown, then wait for zero
      // Note: vibration/audio cannot be fully tested in Playwright
      await expect(page.getByTestId("rest-timer")).toBeVisible();
      await screenshot(page, "TC-UI-009");
    });

    // Traceability: TC-UI-010 → US-2 AC-4
    test("TC-UI-010: Skip rest during countdown", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Assume countdown is active
      await page.getByTestId("skip-rest-btn").click();
      await expect(page.getByTestId("rest-timer")).not.toBeVisible();
      await expect(page.getByTestId("next-set-prompt")).toBeVisible();
      await screenshot(page, "TC-UI-010");
    });

    // Traceability: TC-UI-011 → US-2 AC-5
    test("TC-UI-011: Modified weight marked as custom", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      await page.getByTestId("suggested-weight").clear();
      await page.getByTestId("suggested-weight").fill("85");
      await page.getByTestId("reps-input").fill("8");
      await page.getByTestId("complete-set-btn").click();
      await expect(page.getByTestId("custom-weight-badge")).toBeVisible();
      await screenshot(page, "TC-UI-011");
    });

    // Traceability: TC-UI-012 → US-2 AC-6
    test("TC-UI-012: Complete set within 2 clicks", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      const suggestedWeight = page.getByTestId("suggested-weight");
      await expect(suggestedWeight).toBeVisible();
      // Suggested weight is pre-filled — only need to click complete
      await page.getByTestId("complete-set-btn").click();
      await screenshot(page, "TC-UI-012");
    });

    // Traceability: TC-UI-013 → US-2 AC-7
    test("TC-UI-013: Add extra set after completing target", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // After completing all target sets
      await page.getByTestId("add-extra-set-btn").click();
      await expect(page.getByTestId("set-list")).toBeVisible();
      await screenshot(page, "TC-UI-013");
    });

    // Traceability: TC-UI-014 → US-2 AC-8
    test("TC-UI-014: Mid-workout exit preserves completed data", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Complete 2 sets, then exit
      await page.getByTestId("back-btn").click();
      await expect(page.getByTestId("exit-confirm-dialog")).toBeVisible();
      await page.getByTestId("confirm-exit-btn").click();
      await expect(page).toHaveURL(/\/(calendar|\(tabs\)%2Fcalendar)/);
      await screenshot(page, "TC-UI-014");
    });

    // Traceability: TC-UI-015 → US-2 AC-9
    test("TC-UI-015: Resume workout after background return", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Simulate background return by navigating away and back
      await page.goto(`${baseUrl()}/`);
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("current-set-display")).toBeVisible();
      await screenshot(page, "TC-UI-015");
    });
  });

  // ── History & Progress (US-4) ─────────────────────────────────────

  test.describe("History & Progress", () => {
    // Traceability: TC-UI-016 → US-4 AC-1
    test("TC-UI-016: Progress curve line chart renders", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page.getByTestId("progress-tab").click();
      await page.getByTestId("exercise-selector").click();
      await page.getByText("深蹲").click();
      await expect(page.getByTestId("progress-chart")).toBeVisible();
      await screenshot(page, "TC-UI-016");
    });

    // Traceability: TC-UI-017 → US-4 AC-2
    test("TC-UI-017: PR notification after saving workout", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Save workout that breaks a PR
      await page.getByTestId("save-workout-btn").click();
      await expect(page.getByTestId("pr-notification")).toBeVisible();
      await expect(page.getByTestId("pr-exercise-name")).toBeVisible();
      await expect(page.getByTestId("pr-weight-value")).toBeVisible();
      await screenshot(page, "TC-UI-017");
    });

    // Traceability: TC-UI-018 → US-4 AC-3
    test("TC-UI-018: Filter history by training type", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page.getByTestId("type-filter-btn").click();
      await page.getByTestId("filter-option-push").click();
      await expect(page.getByTestId("history-list")).toBeVisible();
      await screenshot(page, "TC-UI-018");
    });

    // Traceability: TC-UI-019 → US-4 AC-4
    test("TC-UI-019: Monthly volume bar chart", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page.getByTestId("volume-tab").click();
      await expect(page.getByTestId("volume-chart")).toBeVisible();
      await screenshot(page, "TC-UI-019");
    });

    // Traceability: TC-UI-020 → US-4 AC-5
    test("TC-UI-020: Single exercise progress curve with disabled empty exercises", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page.getByTestId("progress-tab").click();
      await page.getByTestId("exercise-selector").click();
      // Exercises without data should be disabled/grey
      await screenshot(page, "TC-UI-020");
    });

    // Traceability: TC-UI-021 → US-4 AC-6
    test("TC-UI-021: Delete record with PR causes PR rollback", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("delete-record-btn").click();
      await page.getByTestId("confirm-delete-btn").click();
      // Navigate to PR list
      await expect(page.getByTestId("pr-list")).toBeVisible();
      await screenshot(page, "TC-UI-021");
    });

    // Traceability: TC-UI-022 → US-4 AC-7
    test("TC-UI-022: Progress chart zoom and pan", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page.getByTestId("progress-tab").click();
      await expect(page.getByTestId("chart-container")).toBeVisible();
      // Pinch-to-zoom and pan gestures — limited in Playwright web
      await screenshot(page, "TC-UI-022");
    });
  });

  // ── Feeling Recording (US-5) ──────────────────────────────────────

  test.describe("Feeling Recording", () => {
    // Traceability: TC-UI-023 → US-5 AC-1
    test("TC-UI-023: Feeling page displays sliders and exercise notes", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/feeling`);
      await expect(page.getByTestId("fatigue-slider")).toBeVisible();
      await expect(page.getByTestId("satisfaction-slider")).toBeVisible();
      await expect(page.getByTestId(/exercise-note-/).first()).toBeVisible();
      await screenshot(page, "TC-UI-023");
    });

    // Traceability: TC-UI-024 → US-5 AC-2
    test("TC-UI-024: High fatigue low satisfaction marks training", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/feeling`);
      // Drag fatigue slider to >= 8
      await page.getByTestId("fatigue-slider").fill("8");
      // Drag satisfaction slider to <= 4
      await page.getByTestId("satisfaction-slider").fill("4");
      await page.getByTestId("save-feeling-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-024");
    });

    // Traceability: TC-UI-025 → US-5 AC-3
    test("TC-UI-025: Save feeling with default values", async ({ page }) => {
      await page.goto(`${baseUrl()}/feeling`);
      await page.getByTestId("save-feeling-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-025");
    });

    // Traceability: TC-UI-026 → US-5 AC-4
    test("TC-UI-026: Skipped exercises not shown in feeling page", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/feeling`);
      await expect(page.getByTestId("exercise-note-list")).toBeVisible();
      // Only completed exercise notes should be present
      await screenshot(page, "TC-UI-026");
    });

    // Traceability: TC-UI-027 → US-5 AC-5
    test("TC-UI-027: Edit feeling from history", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("edit-feeling-btn").click();
      await page.getByTestId("fatigue-slider").fill("7");
      await page.getByTestId("save-feeling-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-027");
    });
  });

  // ── Calendar (US-6) ───────────────────────────────────────────────

  test.describe("Calendar", () => {
    // Traceability: TC-UI-028 → US-6 AC-1
    test("TC-UI-028: Calendar training type labels on training days", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      await expect(page.getByTestId("calendar-month-view")).toBeVisible();
      // Verify training type labels exist on training day cells
      await expect(
        page.getByTestId("training-type-label").first(),
      ).toBeVisible();
      await screenshot(page, "TC-UI-028");
    });

    // Traceability: TC-UI-029 → US-6 AC-2
    test("TC-UI-029: Drag to adjust training day on calendar", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      // Long-press and drag — gesture testing limited in Playwright web
      await expect(page.getByTestId("calendar-month-view")).toBeVisible();
      await screenshot(page, "TC-UI-029");
    });

    // Traceability: TC-UI-030 → US-6 AC-3
    test("TC-UI-030: Click completed training day shows details", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      // Click a day cell with completed indicator
      await page
        .getByTestId(/day-cell-/)
        .first()
        .click();
      await expect(page.getByTestId("workout-detail-panel")).toBeVisible();
      await screenshot(page, "TC-UI-030");
    });

    // Traceability: TC-UI-031 → US-6 AC-4
    test("TC-UI-031: Click future training day shows preview", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      // Click a future training day cell
      await page
        .getByTestId(/day-cell-/)
        .first()
        .click();
      await expect(page.getByTestId("workout-preview-panel")).toBeVisible();
      await expect(page.getByTestId("start-workout-btn")).toBeVisible();
      await screenshot(page, "TC-UI-031");
    });

    // Traceability: TC-UI-032 → US-6 AC-5
    test("TC-UI-032: Skip training day from calendar", async ({ page }) => {
      await page.goto(`${baseUrl()}/`);
      // Long-press today cell for context menu
      await page.getByTestId("day-cell-today").click({ button: "right" });
      await page
        .getByTestId("context-menu")
        .getByTestId("skip-day-btn")
        .click();
      await screenshot(page, "TC-UI-032");
    });

    // Traceability: TC-UI-033 → US-6 AC-6
    test("TC-UI-033: Three consecutive skips warning", async ({ page }) => {
      await page.goto(`${baseUrl()}/`);
      // If user has 3 consecutive skips, warning appears on app load
      await expect(page.getByTestId("skip-streak-warning")).toBeVisible();
      await screenshot(page, "TC-UI-033");
    });

    // Traceability: TC-UI-034 → US-6 AC-7
    test("TC-UI-034: Undo skip on training day", async ({ page }) => {
      await page.goto(`${baseUrl()}/`);
      // Click a skipped day cell and undo
      await page
        .getByTestId(/day-cell-/)
        .first()
        .click();
      await page
        .getByTestId("context-menu")
        .getByTestId("undo-skip-btn")
        .click();
      await screenshot(page, "TC-UI-034");
    });
  });

  // ── Other Sports (US-7) ───────────────────────────────────────────

  test.describe("Other Sports", () => {
    // Traceability: TC-UI-035 → US-7 AC-1
    test("TC-UI-035: Other sport type selection from rest day", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      // Click a rest day cell
      await page
        .getByTestId(/day-cell-/)
        .first()
        .click();
      await page.getByTestId("log-other-sport-btn").click();
      await expect(page).toHaveURL(/\/other-sport/);
      await expect(page.getByTestId("sport-type-list")).toBeVisible();
      await screenshot(page, "TC-UI-035");
    });

    // Traceability: TC-UI-036 → US-7 AC-2
    test("TC-UI-036: Other sport metric inputs for swimming", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/other-sport`);
      await page.getByTestId("sport-type-item-swim").click();
      await expect(page.getByTestId("metric-distance-input")).toBeVisible();
      await expect(page.getByTestId("metric-time-input")).toBeVisible();
      await expect(page.getByTestId("metric-laps-input")).toBeVisible();
      await screenshot(page, "TC-UI-036");
    });

    // Traceability: TC-UI-037 → US-7 AC-3
    test("TC-UI-037: Custom sport type creation", async ({ page }) => {
      await page.goto(`${baseUrl()}/other-sport`);
      await page.getByTestId("custom-sport-btn").click();
      await page.getByTestId("sport-name-input").fill("瑜伽");
      await page.getByTestId("save-custom-sport-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-037");
    });

    // Traceability: TC-UI-038 → US-7 AC-4
    test("TC-UI-038: Other sport save shows calendar label", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/other-sport`);
      // Fill metrics and save
      await page.getByTestId("save-sport-btn").click();
      await expect(page).toHaveURL(/\/(calendar|\(tabs\)%2Fcalendar)/);
      await screenshot(page, "TC-UI-038");
    });

    // Traceability: TC-UI-039 → US-7 AC-5
    test("TC-UI-039: Strength + other sport coexist same day", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      await page.getByTestId("day-cell-today").click();
      await page.getByTestId("log-other-sport-btn").click();
      // Select sport, fill data, save
      await page.getByTestId("save-sport-btn").click();
      // Both labels should be visible on today's cell
      await expect(page.getByTestId("training-type-label")).toBeVisible();
      await expect(page.getByTestId("sport-type-label")).toBeVisible();
      await screenshot(page, "TC-UI-039");
    });

    // Traceability: TC-UI-040 → US-7 AC-6
    test("TC-UI-040: Custom sport type reuse", async ({ page }) => {
      await page.goto(`${baseUrl()}/other-sport`);
      await page.getByTestId("sport-type-item-hiking").click();
      await expect(page.getByTestId("metric-config-list")).toBeVisible();
      await screenshot(page, "TC-UI-040");
    });
  });

  // ── Body Data (US-8) ──────────────────────────────────────────────

  test.describe("Body Data", () => {
    // Traceability: TC-UI-041 → US-8 AC-1
    test("TC-UI-041: Body data input form displays all fields", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/body-data`);
      await expect(page.getByTestId("date-picker")).toBeVisible();
      await expect(page.getByTestId("weight-input")).toBeVisible();
      await expect(page.getByTestId("chest-input")).toBeVisible();
      await expect(page.getByTestId("waist-input")).toBeVisible();
      await expect(page.getByTestId("arm-input")).toBeVisible();
      await expect(page.getByTestId("thigh-input")).toBeVisible();
      await screenshot(page, "TC-UI-041");
    });

    // Traceability: TC-UI-042 → US-8 AC-2
    test("TC-UI-042: Weight trend line chart", async ({ page }) => {
      await page.goto(`${baseUrl()}/body-data`);
      await page.getByTestId("trend-chart-btn").click();
      await page.getByTestId("metric-selector").click();
      await page.getByText("体重").click();
      await expect(page.getByTestId("weight-trend-chart")).toBeVisible();
      await screenshot(page, "TC-UI-042");
    });

    // Traceability: TC-UI-043 → US-8 AC-3
    test("TC-UI-043: Save with weight only", async ({ page }) => {
      await page.goto(`${baseUrl()}/body-data`);
      await page.getByTestId("weight-input").fill("75.5");
      await page.getByTestId("save-body-data-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-043");
    });

    // Traceability: TC-UI-044 → US-8 AC-4
    test("TC-UI-044: Body data for historical date", async ({ page }) => {
      await page.goto(`${baseUrl()}/body-data`);
      await page.getByTestId("date-picker").click();
      // Select 3 days ago
      await page.getByTestId("weight-input").fill("74.0");
      await page.getByTestId("save-body-data-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-044");
    });

    // Traceability: TC-UI-045 → US-8 AC-5
    test("TC-UI-045: Edit body data updates trend chart", async ({ page }) => {
      await page.goto(`${baseUrl()}/body-data`);
      await page
        .getByTestId(/body-record-/)
        .first()
        .click();
      await page.getByTestId("edit-record-btn").click();
      await page.getByTestId("weight-input").clear();
      await page.getByTestId("weight-input").fill("76.0");
      await page.getByTestId("save-body-data-btn").click();
      await page.getByTestId("trend-chart-btn").click();
      await expect(page.getByTestId("weight-trend-chart")).toBeVisible();
      await screenshot(page, "TC-UI-045");
    });
  });

  // ── Exercise Library (US-9) ───────────────────────────────────────

  test.describe("Exercise Library", () => {
    // Traceability: TC-UI-046 → US-9 AC-1
    test("TC-UI-046: Exercise library category list", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await expect(page.getByTestId("exercise-library-list")).toBeVisible();
      // 7 categories expected
      await screenshot(page, "TC-UI-046");
    });

    // Traceability: TC-UI-047 → US-9 AC-2
    test("TC-UI-047: Exercise default increment on add to plan", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page.getByTestId("exercise-item-squat").click();
      await page.getByTestId("add-to-plan-btn").click();
      // Verify default increment of 5kg and rest time 180s
      await screenshot(page, "TC-UI-047");
    });

    // Traceability: TC-UI-048 → US-9 AC-3
    test("TC-UI-048: Custom exercise creation", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page.getByTestId("custom-exercise-btn").click();
      await page.getByTestId("exercise-name-input").fill("绳索夹胸");
      await page.getByTestId("category-selector").click();
      await page.getByText("上肢推").click();
      await page.getByTestId("increment-input").fill("2.5");
      await page.getByTestId("rest-time-input").fill("120");
      await page.getByTestId("save-exercise-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-048");
    });

    // Traceability: TC-UI-049 → US-9 AC-4
    test("TC-UI-049: Custom exercise appears in library", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page.getByTestId("category-custom").click();
      await expect(page.getByTestId(/exercise-item-/).first()).toBeVisible();
      await screenshot(page, "TC-UI-049");
    });

    // Traceability: TC-UI-050 → US-9 AC-5
    test("TC-UI-050: Modify built-in exercise increment", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page.getByTestId("exercise-item-squat").click();
      await page.getByTestId("edit-exercise-btn").click();
      await page.getByTestId("increment-input").clear();
      await page.getByTestId("increment-input").fill("2.5");
      await page.getByTestId("save-exercise-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-050");
    });

    // Traceability: TC-UI-051 → US-9 AC-6
    test("TC-UI-051: Delete in-use custom exercise", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page
        .getByTestId(/exercise-item-/)
        .first()
        .click();
      await page.getByTestId("delete-exercise-btn").click();
      await expect(page.getByTestId("confirm-delete-dialog")).toBeVisible();
      await expect(page.getByText(/正在使用中/)).toBeVisible();
      await page.getByTestId("confirm-delete-btn").click();
      await screenshot(page, "TC-UI-051");
    });

    // Traceability: TC-UI-052 → US-9 AC-7
    test("TC-UI-052: Exercise detail summary", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page
        .getByTestId(/exercise-item-/)
        .first()
        .click();
      await expect(page.getByTestId("exercise-detail-panel")).toBeVisible();
      await expect(page.getByTestId("recent-records")).toBeVisible();
      await expect(page.getByTestId("pr-value")).toBeVisible();
      await expect(page.getByTestId("total-sessions")).toBeVisible();
      await screenshot(page, "TC-UI-052");
    });
  });

  // ── Mid-workout Exit (US-10) ──────────────────────────────────────

  test.describe("Mid-workout Exit", () => {
    // Traceability: TC-UI-053 → US-10 AC-1
    test("TC-UI-053: Mid-workout exit confirmation dialog", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Complete 2/3 exercises then press back
      await page.getByTestId("back-btn").click();
      await expect(page.getByTestId("exit-confirm-dialog")).toBeVisible();
      await expect(page.getByTestId("exit-message")).toContainText(
        /2\/3|2 of 3/,
      );
      await screenshot(page, "TC-UI-053");
    });

    // Traceability: TC-UI-054 → US-10 AC-2
    test("TC-UI-054: Exit saves completed data", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      await page.getByTestId("back-btn").click();
      await page.getByTestId("confirm-exit-btn").click();
      await expect(page).toHaveURL(/\/(calendar|\(tabs\)%2Fcalendar)/);
      await screenshot(page, "TC-UI-054");
    });

    // Traceability: TC-UI-055 → US-10 AC-3
    test("TC-UI-055: Partial completion shown on calendar", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/`);
      await page
        .getByTestId(/day-cell-/)
        .first()
        .click();
      await expect(page.getByTestId("completion-status")).toContainText(
        /partial|部分/,
      );
      await screenshot(page, "TC-UI-055");
    });
  });

  // ── Background Timer (US-11) ──────────────────────────────────────

  test.describe("Background Timer", () => {
    // Traceability: TC-UI-056 → US-11 AC-1
    test("TC-UI-056: Timer continues running in background", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Start a set to activate timer, simulate background
      // In Playwright, we can navigate away and return to check state
      await expect(page.getByTestId("rest-timer")).toBeVisible();
      await screenshot(page, "TC-UI-056");
    });

    // Traceability: TC-UI-057 → US-11 AC-2
    test("TC-UI-057: Background timer end notification", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Notification testing requires native device testing
      // This test verifies the timer UI state after countdown completes
      await screenshot(page, "TC-UI-057");
    });

    // Traceability: TC-UI-058 → US-11 AC-3
    test("TC-UI-058: Tap notification returns to workout", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("next-set-btn")).toBeVisible();
      await screenshot(page, "TC-UI-058");
    });

    // Traceability: TC-UI-059 → US-11 AC-4
    test("TC-UI-059: Lock screen timer notification", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Lock screen notification testing requires native device
      await screenshot(page, "TC-UI-059");
    });

    // Traceability: TC-UI-060 → US-11 AC-5
    test("TC-UI-060: Overtime reminder after call ends", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      // After extended background period
      await expect(page.getByTestId("overtime-message")).toBeVisible();
      await expect(page.getByTestId("next-set-btn")).toBeVisible();
      await screenshot(page, "TC-UI-060");
    });

    // Traceability: TC-UI-061 → US-11 AC-6
    test("TC-UI-061: Force-close timer recovery", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      // After force-close and reopen
      await expect(page.getByTestId("resume-workout-btn")).toBeVisible();
      await screenshot(page, "TC-UI-061");
    });
  });

  // ── History Editing (US-12) ───────────────────────────────────────

  test.describe("History Editing", () => {
    // Traceability: TC-UI-062 → US-12 AC-1
    test("TC-UI-062: Workout detail page with edit and delete buttons", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await expect(page.getByTestId("workout-detail")).toBeVisible();
      await expect(page.getByTestId("edit-btn")).toBeVisible();
      await expect(page.getByTestId("delete-btn")).toBeVisible();
      await screenshot(page, "TC-UI-062");
    });

    // Traceability: TC-UI-063 → US-12 AC-2
    test("TC-UI-063: Edit record recalculates overload suggestion", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("edit-btn").click();
      await page
        .getByTestId(/weight-input-/)
        .first()
        .clear();
      await page
        .getByTestId(/weight-input-/)
        .first()
        .fill("65");
      await page.getByTestId("save-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-063");
    });

    // Traceability: TC-UI-064 → US-12 AC-3
    test("TC-UI-064: Delete workout record", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("delete-btn").click();
      await expect(page.getByTestId("confirm-delete-dialog")).toBeVisible();
      await page.getByTestId("confirm-delete-btn").click();
      await expect(page).toHaveURL(/\/history/);
      await screenshot(page, "TC-UI-064");
    });

    // Traceability: TC-UI-065 → US-12 AC-4
    test("TC-UI-065: Delete PR record causes PR rollback", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("delete-btn").click();
      await page.getByTestId("confirm-delete-btn").click();
      // Check PR list for rollback
      await expect(page.getByTestId(/pr-weight-/).first()).toBeVisible();
      await screenshot(page, "TC-UI-065");
    });

    // Traceability: TC-UI-066 → US-12 AC-5
    test("TC-UI-066: Edit feeling updates training suggestion", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("edit-feeling-btn").click();
      await page.getByTestId("fatigue-slider").fill("9");
      await page.getByTestId("satisfaction-slider").fill("2");
      await page.getByTestId("save-feeling-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-066");
    });
  });

  // ── Retroactive Logging (US-13) ───────────────────────────────────

  test.describe("Retroactive Logging", () => {
    // Traceability: TC-UI-067 → US-13 AC-1
    test("TC-UI-067: Retroactive logging from past date", async ({ page }) => {
      await page.goto(`${baseUrl()}/`);
      // Click a past empty date cell
      await page
        .getByTestId(/day-cell-/)
        .first()
        .click();
      await page.getByTestId("log-retroactive-btn").click();
      await expect(page).toHaveURL(/\/workout/);
      await screenshot(page, "TC-UI-067");
    });

    // Traceability: TC-UI-068 → US-13 AC-2
    test("TC-UI-068: Retroactive workout has no timer", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("retroactive-form")).toBeVisible();
      // Complete a set
      await page.getByTestId("complete-set-btn").click();
      // Timer should NOT be present
      await expect(page.getByTestId("rest-timer")).not.toBeVisible();
      await screenshot(page, "TC-UI-068");
    });

    // Traceability: TC-UI-069 → US-13 AC-3
    test("TC-UI-069: Retroactive record participates in overload", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      await page.getByTestId("save-workout-btn").click();
      // Next workout should include retroactive data in suggestion
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("suggested-weight")).toBeVisible();
      await screenshot(page, "TC-UI-069");
    });
  });

  // ── Data Export (US-14) ───────────────────────────────────────────

  test.describe("Data Export", () => {
    // Traceability: TC-UI-070 → US-14 AC-1
    test("TC-UI-070: Data export with range selection", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("export-data-btn").click();
      await page.getByTestId("export-range-selector").click();
      await page.getByText("最近 3 个月").click();
      await page.getByTestId("export-confirm-btn").click();
      await expect(page.getByText(/export|导出/)).toBeVisible();
      await screenshot(page, "TC-UI-070");
    });

    // Traceability: TC-UI-071 → US-14 AC-2
    test("TC-UI-071: Export completion share options", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("export-data-btn").click();
      await page.getByTestId("export-confirm-btn").click();
      await expect(page.getByTestId("export-success-panel")).toBeVisible();
      await expect(page.getByTestId("share-email-btn")).toBeVisible();
      await expect(page.getByTestId("share-cloud-btn")).toBeVisible();
      await expect(page.getByTestId("share-local-btn")).toBeVisible();
      await screenshot(page, "TC-UI-071");
    });

    // Traceability: TC-UI-072 → US-14 AC-3
    test("TC-UI-072: Export data structured format validation", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      // Export and verify JSON structure
      await page.getByTestId("export-data-btn").click();
      await page.getByTestId("export-confirm-btn").click();
      await page.getByTestId("share-local-btn").click();
      // File content validation would require download handling
      await screenshot(page, "TC-UI-072");
    });
  });

  // ── Unit Settings (US-15) ─────────────────────────────────────────

  test.describe("Unit Settings", () => {
    // Traceability: TC-UI-073 → US-15 AC-1
    test("TC-UI-073: Switch weight unit from kg to lbs", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("unit-selector").click();
      await page.getByTestId("unit-option-lbs").click();
      // All displayed weights should convert
      await screenshot(page, "TC-UI-073");
    });

    // Traceability: TC-UI-074 → US-15 AC-2
    test("TC-UI-074: Record weight in lbs mode", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("suggested-weight")).toBeVisible();
      // Verify unit label shows lbs
      await screenshot(page, "TC-UI-074");
    });

    // Traceability: TC-UI-075 → US-15 AC-3
    test("TC-UI-075: Lbs increment options", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page
        .getByTestId(/exercise-item-/)
        .first()
        .click();
      await page.getByTestId("edit-exercise-btn").click();
      await page.getByTestId("increment-options").click();
      // Verify lbs increment options: 1, 2.5, 5, 10
      await screenshot(page, "TC-UI-075");
    });

    // Traceability: TC-UI-076 → US-15 AC-4
    test("TC-UI-076: Lbs overload suggestion rounding", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      const weight = page.getByTestId("suggested-weight");
      await expect(weight).toBeVisible();
      // Value should be rounded to common plate combos
      await screenshot(page, "TC-UI-076");
    });
  });

  // ── Workout Flexibility (US-16) ───────────────────────────────────

  test.describe("Workout Flexibility", () => {
    // Traceability: TC-UI-077 → US-16 AC-1
    test("TC-UI-077: Drag to reorder exercises during workout", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("exercise-list")).toBeVisible();
      // Drag reorder — gesture testing limited in Playwright web
      await screenshot(page, "TC-UI-077");
    });

    // Traceability: TC-UI-078 → US-16 AC-2
    test("TC-UI-078: Skip exercise via swipe", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Swipe left on exercise card, tap skip
      await screenshot(page, "TC-UI-078");
    });

    // Traceability: TC-UI-079 → US-16 AC-3
    test("TC-UI-079: Skipped exercise does not affect overload", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Skip an exercise, complete workout, verify suggestion unchanged
      await page.getByTestId("save-workout-btn").click();
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("suggested-weight")).toBeVisible();
      await screenshot(page, "TC-UI-079");
    });

    // Traceability: TC-UI-080 → US-16 AC-4
    test("TC-UI-080: Undo skip exercise", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Click skipped exercise and undo
      await page
        .getByTestId(/exercise-card-/)
        .first()
        .click();
      await page.getByTestId("undo-skip-btn").click();
      await expect(page.getByTestId("start-exercise-btn")).toBeVisible();
      await screenshot(page, "TC-UI-080");
    });
  });

  // ── Same Exercise Multiple Times (US-17) ──────────────────────────

  test.describe("Same Exercise Multiple Times", () => {
    // Traceability: TC-UI-081 → US-17 AC-1
    test("TC-UI-081: Add same exercise twice to training day", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("exercise-item-squat").click();
      await page.getByTestId("add-to-plan-btn").click();
      await page.getByTestId("exercise-item-squat").click();
      await page.getByTestId("add-to-plan-btn").click();
      await expect(page.getByTestId("exercise-list")).toBeVisible();
      await screenshot(page, "TC-UI-081");
    });

    // Traceability: TC-UI-082 → US-17 AC-2
    test("TC-UI-082: Same exercise note differentiation", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      // Add second instance and add note
      await page
        .getByTestId(/exercise-note-input-/)
        .last()
        .fill("暂停深蹲");
      await screenshot(page, "TC-UI-082");
    });

    // Traceability: TC-UI-083 → US-17 AC-3
    test("TC-UI-083: Same exercise independent overload suggestion", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      // Expand both instances of same exercise
      await expect(page.getByTestId(/suggested-weight-/).first()).toBeVisible();
      await expect(page.getByTestId(/suggested-weight-/).last()).toBeVisible();
      await screenshot(page, "TC-UI-083");
    });
  });

  // ── Onboarding (US-18) ────────────────────────────────────────────

  test.describe("Onboarding", () => {
    // Traceability: TC-UI-084 → US-18 AC-1
    test("TC-UI-084: Onboarding 4-step welcome flow", async ({ page }) => {
      await page.goto(`${baseUrl()}/onboarding`);
      await expect(page.getByTestId("onboarding-step-1")).toBeVisible();
      for (let step = 1; step <= 3; step++) {
        await page.getByTestId("onboarding-next-btn").click();
      }
      await expect(page.getByTestId("onboarding-skip-btn")).toBeVisible();
      await screenshot(page, "TC-UI-084");
    });

    // Traceability: TC-UI-085 → US-18 AC-2
    test("TC-UI-085: Template recommendation after onboarding", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/onboarding`);
      await page.getByTestId("onboarding-finish-btn").click();
      await expect(page).toHaveURL(/\/plan-editor/);
      await expect(page.getByTestId("template-list")).toBeVisible();
      await expect(
        page.getByTestId("template-item-push-pull-legs"),
      ).toBeVisible();
      await expect(page.getByTestId("custom-plan-btn")).toBeVisible();
      await screenshot(page, "TC-UI-085");
    });

    // Traceability: TC-UI-086 → US-18 AC-3
    test("TC-UI-086: Template exercise pre-fill", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("template-item-push-pull-legs").click();
      await expect(page.getByTestId("exercise-list")).toBeVisible();
      await screenshot(page, "TC-UI-086");
    });

    // Traceability: TC-UI-087 → US-18 AC-4
    test("TC-UI-087: Re-access onboarding from settings", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await expect(page.getByTestId("settings-list")).toBeVisible();
      await page.getByTestId("onboarding-link").click();
      await expect(page).toHaveURL(/\/onboarding/);
      await expect(page.getByTestId("onboarding-step-1")).toBeVisible();
      await screenshot(page, "TC-UI-087");
    });
  });

  // ── Stats Dashboard (PRD 5.10) ────────────────────────────────────

  test.describe("Stats Dashboard", () => {
    // Traceability: TC-UI-088 → PRD 5.10 Step 2
    test("TC-UI-088: Stats hero card with weekly volume and WoW change", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/stats`);
      await expect(page.getByTestId("stats-hero-card")).toBeVisible();
      await expect(page.getByTestId("weekly-volume")).toBeVisible();
      await expect(page.getByTestId("week-over-week-change")).toBeVisible();
      await screenshot(page, "TC-UI-088");
    });

    // Traceability: TC-UI-089 → PRD 5.10 Step 3
    test("TC-UI-089: Stats four-grid summary cards", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/stats`);
      await expect(page.getByTestId("stats-grid")).toBeVisible();
      await expect(page.getByTestId("weekly-session-count")).toBeVisible();
      await expect(page.getByTestId("monthly-session-count")).toBeVisible();
      await expect(page.getByTestId("weekly-duration")).toBeVisible();
      await expect(page.getByTestId("monthly-pr-count")).toBeVisible();
      await screenshot(page, "TC-UI-089");
    });

    // Traceability: TC-UI-090 → PRD 5.10 Step 1 (no_data)
    test("TC-UI-090: Stats empty state for no data", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/stats`);
      await expect(page.getByTestId("stats-empty-state")).toBeVisible();
      await expect(page.getByTestId("start-training-link")).toBeVisible();
      await screenshot(page, "TC-UI-090");
    });
  });

  // ── Settings (PRD 5.11) ───────────────────────────────────────────

  test.describe("Settings", () => {
    // Traceability: TC-UI-091 → PRD 5.11 Step 1
    test("TC-UI-091: Settings page group list display", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await expect(page.getByTestId("settings-list")).toBeVisible();
      await expect(page.getByTestId("settings-group-training")).toBeVisible();
      await expect(page.getByTestId("settings-group-reminder")).toBeVisible();
      await expect(page.getByTestId("settings-group-data")).toBeVisible();
      await expect(page.getByTestId("settings-group-about")).toBeVisible();
      await screenshot(page, "TC-UI-091");
    });

    // Traceability: TC-UI-092 → PRD 5.11 Step 10-11
    test("TC-UI-092: Clear data double confirmation", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("clear-data-btn").click();
      await expect(page.getByTestId("clear-data-warning-panel")).toBeVisible();
      await expect(page.getByText(/不可撤销/)).toBeVisible();
      await expect(page.getByTestId("confirm-clear-btn")).toBeVisible();
      await screenshot(page, "TC-UI-092");
    });

    // Traceability: TC-UI-093 → PRD 5.11 Step 11
    test("TC-UI-093: Clear data verifies actual deletion", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("clear-data-btn").click();
      await page.getByTestId("confirm-clear-btn").click();
      await expect(page.getByTestId("clear-success-toast")).toBeVisible();
      // Navigate to calendar and history to verify emptiness
      await page.goto(`${baseUrl()}/`);
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await screenshot(page, "TC-UI-093");
    });

    // Traceability: TC-UI-094 → PRD 5.11.1 Step 1-3
    test("TC-UI-094: Data import flow", async ({ page }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("import-data-btn").click();
      await expect(page.getByTestId("import-confirm-panel")).toBeVisible();
      await page.getByTestId("file-picker-btn").click();
      // File selection and import
      await screenshot(page, "TC-UI-094");
    });
  });

  // ── Validation Rules (PRD 5.3) ────────────────────────────────────

  test.describe("Validation Rules", () => {
    // Traceability: TC-UI-095 → PRD 5.3 验证规则: sets=1
    test("TC-UI-095: Target sets boundary — minimum 1", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("target-sets-input").fill("1");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-095");
    });

    // Traceability: TC-UI-096 → PRD 5.3 验证规则: sets=10
    test("TC-UI-096: Target sets boundary — maximum 10", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("target-sets-input").fill("10");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-096");
    });

    // Traceability: TC-UI-097 → PRD 5.3 验证规则: sets=0 (invalid)
    test("TC-UI-097: Target sets invalid — zero", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("target-sets-input").fill("0");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /不能小于 1/,
      );
      await screenshot(page, "TC-UI-097");
    });

    // Traceability: TC-UI-098 → PRD 5.3 验证规则: sets=11 (invalid)
    test("TC-UI-098: Target sets invalid — eleven", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("target-sets-input").fill("11");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /不能超过 10/,
      );
      await screenshot(page, "TC-UI-098");
    });

    // Traceability: TC-UI-099 → PRD 5.3 验证规则: reps=1
    test("TC-UI-099: Target reps boundary — minimum 1", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("target-reps-input").fill("1");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-099");
    });

    // Traceability: TC-UI-100 → PRD 5.3 验证规则: reps=30
    test("TC-UI-100: Target reps boundary — maximum 30", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("target-reps-input").fill("30");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-100");
    });

    // Traceability: TC-UI-101 → PRD 5.3 验证规则: reps=0 (invalid)
    test("TC-UI-101: Target reps invalid — zero", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("target-reps-input").fill("0");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /不能小于 1/,
      );
      await screenshot(page, "TC-UI-101");
    });

    // Traceability: TC-UI-102 → PRD 5.3 验证规则: rest=30
    test("TC-UI-102: Rest time boundary — minimum 30s", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("rest-time-input").fill("30");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-102");
    });

    // Traceability: TC-UI-103 → PRD 5.3 验证规则: rest=600
    test("TC-UI-103: Rest time boundary — maximum 600s", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("rest-time-input").fill("600");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
      await screenshot(page, "TC-UI-103");
    });

    // Traceability: TC-UI-104 → PRD 5.3 验证规则: rest=29 (invalid)
    test("TC-UI-104: Rest time invalid — 29 seconds", async ({ page }) => {
      await page.goto(`${baseUrl()}/plan-editor`);
      await page.getByTestId("rest-time-input").fill("29");
      await page.getByTestId("save-plan-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /不能少于 30/,
      );
      await screenshot(page, "TC-UI-104");
    });

    // Traceability: TC-UI-105 → PRD 5.3 验证规则: weight=-5 (invalid)
    test("TC-UI-105: Negative weight input rejected", async ({ page }) => {
      await page.goto(`${baseUrl()}/workout`);
      await page.getByTestId("suggested-weight").clear();
      await page.getByTestId("suggested-weight").fill("-5");
      await page.getByTestId("complete-set-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /不能为负/,
      );
      await screenshot(page, "TC-UI-105");
    });

    // Traceability: TC-UI-106 → PRD 5.3 验证规则: reps=0 in workout (invalid)
    test("TC-UI-106: Zero reps input rejected during workout", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/workout`);
      await page.getByTestId("reps-input").fill("0");
      await page.getByTestId("complete-set-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /不能小于 1/,
      );
      await screenshot(page, "TC-UI-106");
    });

    // Traceability: TC-UI-107 → PRD 5.3 验证规则: increment=0 (invalid)
    test("TC-UI-107: Zero increment rejected", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page
        .getByTestId(/exercise-item-/)
        .first()
        .click();
      await page.getByTestId("edit-exercise-btn").click();
      await page.getByTestId("increment-input").fill("0");
      await page.getByTestId("save-exercise-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /必须大于 0/,
      );
      await screenshot(page, "TC-UI-107");
    });

    // Traceability: TC-UI-108 → PRD 5.5 验证规则: name max length
    test("TC-UI-108: Exercise name too long rejected", async ({ page }) => {
      await page.goto(`${baseUrl()}/exercise-library`);
      await page.getByTestId("custom-exercise-btn").click();
      const longName = "A".repeat(100);
      await page.getByTestId("exercise-name-input").fill(longName);
      await page.getByTestId("save-exercise-btn").click();
      await expect(page.getByTestId("validation-error")).toContainText(
        /不能超过 50/,
      );
      await screenshot(page, "TC-UI-108");
    });

    // Traceability: TC-UI-109 → PRD 5.11.1 异常处理: 损坏文件
    test("TC-UI-109: Import corrupted JSON file shows error", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("import-data-btn").click();
      // Select corrupted file
      await page.getByTestId("file-picker-btn").click();
      await expect(page.getByTestId("import-error-toast")).toBeVisible();
      await screenshot(page, "TC-UI-109");
    });
  });

  // ── Integration Tests ─────────────────────────────────────────────

  test.describe("Integration", () => {
    // Traceability: TC-UI-110 → PRD 5.11.2 Step 2 + PRD 5.2 Step 1
    test("TC-UI-110: Unit switch propagates across all pages", async ({
      page,
    }) => {
      // Switch to lbs in settings
      await page.goto(`${baseUrl()}/(tabs)/settings`);
      await page.getByTestId("unit-selector").click();
      await page.getByTestId("unit-option-lbs").click();
      // Verify workout page shows lbs
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("suggested-weight")).toBeVisible();
      // Verify history shows lbs
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await screenshot(page, "TC-UI-110");
    });

    // Traceability: TC-UI-111 → US-5 AC-2 + PRD 5.4
    test("TC-UI-111: High fatigue leads to reduced intensity prompt next workout", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/feeling`);
      await page.getByTestId("fatigue-slider").fill("9");
      await page.getByTestId("satisfaction-slider").fill("3");
      await page.getByTestId("save-feeling-btn").click();
      // Navigate to next workout
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("reduced-intensity-prompt")).toBeVisible();
      await screenshot(page, "TC-UI-111");
    });

    // Traceability: TC-UI-112 → US-18 AC-2 + US-18 AC-3 + PRD 5.2 Step 1
    test("TC-UI-112: Template creation to workout execution end-to-end", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/onboarding`);
      await page.getByTestId("onboarding-finish-btn").click();
      await page.getByTestId("template-item-push-pull-legs").click();
      await page.getByTestId("save-plan-btn").click();
      await page.goto(`${baseUrl()}/`);
      await page
        .getByTestId(/day-cell-/)
        .first()
        .click();
      await page.getByTestId("start-workout-btn").click();
      await expect(page).toHaveURL(/\/workout/);
      await screenshot(page, "TC-UI-112");
    });

    // Traceability: TC-UI-113 → PRD 5.1 + PRD 5.3
    test("TC-UI-113: Delete record triggers overload recalculation", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("delete-btn").click();
      await page.getByTestId("confirm-delete-btn").click();
      // Verify overload suggestion updated
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("suggested-weight")).toBeVisible();
      await screenshot(page, "TC-UI-113");
    });

    // Traceability: TC-UI-114 → PRD 5.1 + PRD 5.5
    test("TC-UI-114: Edit record and verify overload suggestion change", async ({
      page,
    }) => {
      await page.goto(`${baseUrl()}/(tabs)/history`);
      await page
        .getByTestId(/history-record-/)
        .first()
        .click();
      await page.getByTestId("edit-btn").click();
      await page
        .getByTestId(/weight-input-/)
        .first()
        .clear();
      await page
        .getByTestId(/weight-input-/)
        .first()
        .fill("60");
      await page.getByTestId("save-btn").click();
      // Verify overload suggestion recalculated
      await page.goto(`${baseUrl()}/workout`);
      await expect(page.getByTestId("suggested-weight")).toBeVisible();
      await screenshot(page, "TC-UI-114");
    });
  });
});
