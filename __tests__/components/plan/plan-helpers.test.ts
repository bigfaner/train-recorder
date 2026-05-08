/**
 * Unit tests for plan helper functions.
 */

import type { PlanExercise, TrainingDay } from "../../../src/types";
import {
  validatePlan,
  parseSetsConfig,
  createFixedSetsConfig,
  createCustomSetsConfig,
  serializeSetsConfig,
  formatSetsDisplay,
  formatWeightDisplay,
  parseWeeklyConfig,
  serializeWeeklyConfig,
  getWeekdayLabel,
  getTrainingTypeDisplayLabel,
  formatPlanMode,
  formatScheduleMode,
  buildExerciseSummary,
  formatDayCardTitle,
} from "@components/plan/plan-helpers";

/** Helper: create a minimal PlanExercise for validation tests */
function makeExercise(config?: Partial<PlanExercise>): PlanExercise {
  return {
    id: 1,
    biz_key: 100n,
    training_day_biz_key: 10n,
    exercise_biz_key: 200n,
    sets_config:
      '{"mode":"fixed","target_reps":5,"target_weight":50,"target_repeat":5}',
    order_index: 0,
    exercise_note: null,
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-01T00:00:00",
    ...config,
  };
}

/** Helper: create a minimal TrainingDay for display tests */
function makeDay(
  overrides: Partial<Pick<TrainingDay, "day_name" | "training_type">>,
): TrainingDay {
  return {
    id: 1,
    biz_key: 10n,
    plan_biz_key: 1n,
    day_name: overrides.day_name ?? "Day 1",
    training_type: overrides.training_type ?? "custom",
    order_index: 0,
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-01T00:00:00",
  };
}

describe("plan-helpers", () => {
  // ============================================================
  // Validation
  // ============================================================

  describe("validatePlan", () => {
    it("returns valid for a complete plan", () => {
      const result = validatePlan({
        planName: "推拉蹲",
        planMode: "infinite_loop",
        scheduleMode: "weekly_fixed",
        cycleLength: null,
        restDays: 1,
        trainingDays: [
          {
            dayName: "推日",
            trainingType: "push",
            exercises: [makeExercise()],
          },
        ],
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns error for empty plan name", () => {
      const result = validatePlan({
        planName: "",
        planMode: "infinite_loop",
        scheduleMode: "weekly_fixed",
        cycleLength: null,
        restDays: 1,
        trainingDays: [
          {
            dayName: "推日",
            trainingType: "push",
            exercises: [makeExercise()],
          },
        ],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("请输入计划名称");
    });

    it("returns error for whitespace-only plan name", () => {
      const result = validatePlan({
        planName: "   ",
        planMode: "infinite_loop",
        scheduleMode: "weekly_fixed",
        cycleLength: null,
        restDays: 1,
        trainingDays: [
          {
            dayName: "推日",
            trainingType: "push",
            exercises: [makeExercise()],
          },
        ],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("请输入计划名称");
    });

    it("returns error for no training days", () => {
      const result = validatePlan({
        planName: "test",
        planMode: "infinite_loop",
        scheduleMode: "weekly_fixed",
        cycleLength: null,
        restDays: 1,
        trainingDays: [],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("至少需要 1 个训练日");
    });

    it("returns error for training day with no exercises", () => {
      const result = validatePlan({
        planName: "test",
        planMode: "infinite_loop",
        scheduleMode: "weekly_fixed",
        cycleLength: null,
        restDays: 1,
        trainingDays: [
          {
            dayName: "推日",
            trainingType: "push",
            exercises: [],
          },
        ],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("需要至少 1 个动作"))).toBe(
        true,
      );
    });

    it("returns error for fixed_cycle without cycle_length", () => {
      const result = validatePlan({
        planName: "test",
        planMode: "fixed_cycle",
        scheduleMode: "weekly_fixed",
        cycleLength: null,
        restDays: 1,
        trainingDays: [
          {
            dayName: "推日",
            trainingType: "push",
            exercises: [makeExercise()],
          },
        ],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("固定周期模式需要设置周期长度");
    });

    it("returns error for fixed_cycle with zero cycle_length", () => {
      const result = validatePlan({
        planName: "test",
        planMode: "fixed_cycle",
        scheduleMode: "weekly_fixed",
        cycleLength: 0,
        restDays: 1,
        trainingDays: [
          {
            dayName: "推日",
            trainingType: "push",
            exercises: [makeExercise()],
          },
        ],
      });
      expect(result.isValid).toBe(false);
    });

    it("returns warning for 7+ training days with weekly_fixed and no rest", () => {
      const days = Array.from({ length: 7 }, (_, i) => ({
        dayName: `Day ${i + 1}`,
        trainingType: "custom" as const,
        exercises: [makeExercise()],
      }));
      const result = validatePlan({
        planName: "test",
        planMode: "infinite_loop",
        scheduleMode: "weekly_fixed",
        cycleLength: null,
        restDays: 0,
        trainingDays: days,
      });
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("7 个训练日");
    });

    it("no warning for fixed_interval with 7+ days", () => {
      const days = Array.from({ length: 7 }, (_, i) => ({
        dayName: `Day ${i + 1}`,
        trainingType: "custom" as const,
        exercises: [makeExercise()],
      }));
      const result = validatePlan({
        planName: "test",
        planMode: "infinite_loop",
        scheduleMode: "fixed_interval",
        cycleLength: null,
        restDays: 1,
        trainingDays: days,
      });
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ============================================================
  // SetsConfig
  // ============================================================

  describe("parseSetsConfig", () => {
    it("parses fixed mode config", () => {
      const config = parseSetsConfig(
        '{"mode":"fixed","target_reps":5,"target_weight":50,"target_repeat":5}',
      );
      expect(config.mode).toBe("fixed");
      if (config.mode === "fixed") {
        expect(config.target_reps).toBe(5);
        expect(config.target_weight).toBe(50);
        expect(config.target_repeat).toBe(5);
      }
    });

    it("parses custom mode config", () => {
      const config = parseSetsConfig(
        '{"mode":"custom","sets":[{"target_reps":5,"target_weight":80},{"target_reps":3,"target_weight":90}]}',
      );
      expect(config.mode).toBe("custom");
      if (config.mode === "custom") {
        expect(config.sets).toHaveLength(2);
        expect(config.sets[0]!.target_reps).toBe(5);
        expect(config.sets[1]!.target_weight).toBe(90);
      }
    });
  });

  describe("createFixedSetsConfig", () => {
    it("creates a fixed config", () => {
      const config = createFixedSetsConfig(5, 50, 5);
      expect(config).toEqual({
        mode: "fixed",
        target_reps: 5,
        target_weight: 50,
        target_repeat: 5,
      });
    });

    it("creates a fixed config with null weight", () => {
      const config = createFixedSetsConfig(8, null, 4);
      expect(config.target_weight).toBeNull();
    });
  });

  describe("createCustomSetsConfig", () => {
    it("creates a custom config", () => {
      const config = createCustomSetsConfig([
        { target_reps: 5, target_weight: 80 },
        { target_reps: 3, target_weight: 90 },
      ]);
      expect(config.mode).toBe("custom");
      expect(config.sets).toHaveLength(2);
    });
  });

  describe("serializeSetsConfig", () => {
    it("serializes fixed config to JSON", () => {
      const config = createFixedSetsConfig(5, 50, 5);
      const json = serializeSetsConfig(config);
      expect(JSON.parse(json)).toEqual(config);
    });

    it("serializes custom config to JSON", () => {
      const config = createCustomSetsConfig([
        { target_reps: 5, target_weight: 80 },
      ]);
      const json = serializeSetsConfig(config);
      expect(JSON.parse(json)).toEqual(config);
    });
  });

  describe("formatSetsDisplay", () => {
    it("formats fixed mode as '5×5'", () => {
      expect(formatSetsDisplay(createFixedSetsConfig(5, 50, 5))).toBe("5×5");
    });

    it("formats fixed mode as '4×8'", () => {
      expect(formatSetsDisplay(createFixedSetsConfig(8, 40, 4))).toBe("4×8");
    });

    it("formats custom mode as '3 组'", () => {
      const config = createCustomSetsConfig([
        { target_reps: 5, target_weight: 80 },
        { target_reps: 3, target_weight: 90 },
        { target_reps: 1, target_weight: 100 },
      ]);
      expect(formatSetsDisplay(config)).toBe("3 组");
    });
  });

  describe("formatWeightDisplay", () => {
    it("formats null weight as '--'", () => {
      expect(formatWeightDisplay(null)).toBe("--");
    });

    it("formats weight with kg unit", () => {
      expect(formatWeightDisplay(50)).toBe("50kg");
    });

    it("formats weight with lbs unit", () => {
      expect(formatWeightDisplay(110, "lbs")).toBe("110lbs");
    });
  });

  // ============================================================
  // Weekly config
  // ============================================================

  describe("parseWeeklyConfig", () => {
    it("parses weekly config JSON", () => {
      const config = parseWeeklyConfig('{"1":"123","3":"456","5":"789"}');
      expect(config["1"]).toBe("123");
      expect(config["3"]).toBe("456");
      expect(config["5"]).toBe("789");
    });

    it("returns empty object for null input", () => {
      expect(parseWeeklyConfig(null)).toEqual({});
    });
  });

  describe("serializeWeeklyConfig", () => {
    it("serializes weekly config to JSON", () => {
      const json = serializeWeeklyConfig({ "1": "123", "3": "456" });
      expect(JSON.parse(json)).toEqual({ "1": "123", "3": "456" });
    });
  });

  describe("getWeekdayLabel", () => {
    it("returns correct labels for weekdays 1-7", () => {
      expect(getWeekdayLabel(1)).toBe("一");
      expect(getWeekdayLabel(2)).toBe("二");
      expect(getWeekdayLabel(3)).toBe("三");
      expect(getWeekdayLabel(4)).toBe("四");
      expect(getWeekdayLabel(5)).toBe("五");
      expect(getWeekdayLabel(6)).toBe("六");
      expect(getWeekdayLabel(7)).toBe("日");
    });
  });

  // ============================================================
  // Display helpers
  // ============================================================

  describe("getTrainingTypeDisplayLabel", () => {
    it("returns correct labels", () => {
      expect(getTrainingTypeDisplayLabel("push")).toBe("推");
      expect(getTrainingTypeDisplayLabel("pull")).toBe("拉");
      expect(getTrainingTypeDisplayLabel("legs")).toBe("蹲");
      expect(getTrainingTypeDisplayLabel("custom")).toBe("自定义");
    });
  });

  describe("formatPlanMode", () => {
    it("formats infinite_loop", () => {
      expect(formatPlanMode("infinite_loop")).toBe("无限循环");
    });

    it("formats fixed_cycle", () => {
      expect(formatPlanMode("fixed_cycle")).toBe("固定周期");
    });
  });

  describe("formatScheduleMode", () => {
    it("formats weekly_fixed", () => {
      expect(formatScheduleMode("weekly_fixed")).toBe("每周固定日");
    });

    it("formats fixed_interval", () => {
      expect(formatScheduleMode("fixed_interval")).toBe("固定间隔");
    });
  });

  describe("buildExerciseSummary", () => {
    it("builds summary from exercises", () => {
      const exercises: PlanExercise[] = [
        makeExercise({
          exercise_biz_key: 1n,
          sets_config:
            '{"mode":"fixed","target_reps":8,"target_weight":50,"target_repeat":4}',
        }),
        makeExercise({
          exercise_biz_key: 2n,
          sets_config:
            '{"mode":"fixed","target_reps":10,"target_weight":30,"target_repeat":3}',
        }),
      ];
      const nameMap = new Map<bigint, string>([
        [1n, "卧推"],
        [2n, "推举"],
      ]);
      const result = buildExerciseSummary(exercises, nameMap);
      expect(result).toBe("卧推 4×8 | 推举 3×10");
    });

    it("returns empty string for no exercises", () => {
      expect(buildExerciseSummary([], new Map())).toBe("");
    });
  });

  describe("formatDayCardTitle", () => {
    it("formats day card title", () => {
      const day = makeDay({ day_name: "Day 1", training_type: "push" });
      expect(formatDayCardTitle(day, 0)).toBe("Day 1 · 推日");
    });

    it("formats custom type", () => {
      const day = makeDay({ day_name: "全身", training_type: "custom" });
      expect(formatDayCardTitle(day, 0)).toBe("全身 · 自定义日");
    });
  });
});
