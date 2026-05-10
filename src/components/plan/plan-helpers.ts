/**
 * Plan helper functions — pure logic for plan management.
 *
 * Handles validation, formatting, schedule config parsing,
 * and data transformation for plan pages.
 */

import type {
  TrainingDay,
  PlanExercise,
  SetsConfig,
  FixedSetsConfig,
  CustomSetsConfig,
} from "../../types";

// ============================================================
// Validation
// ============================================================

export interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a plan before saving.
 * - name must not be empty
 * - at least 1 training day
 * - each day must have at least 1 exercise (unless skipExerciseCheck)
 * - warn if >= 7 training days with no rest days
 */
export function validatePlan(
  data: {
    planName: string;
    planMode: "fixed_cycle" | "infinite_loop";
    scheduleMode: "weekly_fixed" | "fixed_interval";
    cycleLength: number | null;
    restDays: number;
    trainingDays: {
      dayName: string;
      trainingType: "push" | "pull" | "legs" | "custom";
      exercises: PlanExercise[];
    }[];
  },
  options?: { skipExerciseCheck?: boolean },
): PlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  if (!data.planName.trim()) {
    errors.push("请输入计划名称");
  }

  // At least 1 training day
  if (data.trainingDays.length === 0) {
    errors.push("至少需要 1 个训练日");
  }

  // Each day must have at least 1 exercise (unless skipped for plan-editor flow)
  if (!options?.skipExerciseCheck) {
    data.trainingDays.forEach((day, i) => {
      if (day.exercises.length === 0) {
        errors.push(`${day.dayName || `Day ${i + 1}`} 需要至少 1 个动作`);
      }
    });
  }

  // Fixed cycle needs cycle_length
  if (data.planMode === "fixed_cycle") {
    if (!data.cycleLength || data.cycleLength <= 0) {
      errors.push("固定周期模式需要设置周期长度");
    }
  }

  // Warning: >= 7 training days with no rest days (for weekly_fixed)
  if (data.scheduleMode === "weekly_fixed" && data.trainingDays.length >= 7) {
    warnings.push("7 个训练日无休息日，建议至少安排 1 天休息");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================
// SetsConfig helpers
// ============================================================

/**
 * Parse sets_config JSON string into SetsConfig object.
 */
export function parseSetsConfig(json: string): SetsConfig {
  const parsed = JSON.parse(json) as SetsConfig;
  return parsed;
}

/**
 * Create a fixed sets config.
 */
export function createFixedSetsConfig(
  targetReps: number,
  targetWeight: number | null,
  targetRepeat: number,
): FixedSetsConfig {
  return {
    mode: "fixed",
    target_reps: targetReps,
    target_weight: targetWeight,
    target_repeat: targetRepeat,
  };
}

/**
 * Create a custom sets config.
 */
export function createCustomSetsConfig(
  sets: Array<{ target_reps: number; target_weight: number | null }>,
): CustomSetsConfig {
  return {
    mode: "custom",
    sets,
  };
}

/**
 * Serialize SetsConfig to JSON string.
 */
export function serializeSetsConfig(config: SetsConfig): string {
  return JSON.stringify(config);
}

/**
 * Format sets display string.
 * Fixed: "5×5" (sets × reps)
 * Custom: "3 组" (number of sets)
 */
export function formatSetsDisplay(config: SetsConfig): string {
  if (config.mode === "fixed") {
    return `${config.target_repeat}×${config.target_reps}`;
  }
  return `${config.sets.length} 组`;
}

/**
 * Format weight display string.
 */
export function formatWeightDisplay(
  weight: number | null,
  unit: "kg" | "lbs" = "kg",
): string {
  if (weight === null) return "--";
  return `${weight}${unit}`;
}

// ============================================================
// Weekly config helpers
// ============================================================

export interface WeeklyConfig {
  [weekday: string]: string; // weekday (1-7) -> training_day_biz_key (as string)
}

/**
 * Parse weekly_config JSON.
 */
export function parseWeeklyConfig(json: string | null): WeeklyConfig {
  if (!json) return {};
  return JSON.parse(json) as WeeklyConfig;
}

/**
 * Serialize weekly config to JSON.
 */
export function serializeWeeklyConfig(config: WeeklyConfig): string {
  return JSON.stringify(config);
}

/**
 * Get weekday label for display.
 */
export function getWeekdayLabel(weekday: number): string {
  const labels = ["一", "二", "三", "四", "五", "六", "日"];
  return labels[weekday - 1] ?? String(weekday);
}

// ============================================================
// Training type helpers
// ============================================================

export const TRAINING_TYPES = [
  { value: "push" as const, label: "推" },
  { value: "pull" as const, label: "拉" },
  { value: "legs" as const, label: "蹲" },
  { value: "custom" as const, label: "自定义" },
];

/**
 * Get training type label.
 */
export function getTrainingTypeDisplayLabel(
  type: "push" | "pull" | "legs" | "custom",
): string {
  return TRAINING_TYPES.find((t) => t.value === type)?.label ?? "其他";
}

// ============================================================
// Plan display helpers
// ============================================================

/**
 * Format plan mode for display.
 */
export function formatPlanMode(mode: "fixed_cycle" | "infinite_loop"): string {
  return mode === "infinite_loop" ? "无限循环" : "固定周期";
}

/**
 * Format schedule mode for display.
 */
export function formatScheduleMode(
  mode: "weekly_fixed" | "fixed_interval",
): string {
  return mode === "weekly_fixed" ? "每周固定日" : "固定间隔";
}

/**
 * Build exercise summary for a training day card.
 * e.g. "卧推 4×8 | 推举 3×10"
 */
export function buildExerciseSummary(
  exercises: PlanExercise[],
  exerciseNameMap: Map<bigint, string>,
): string {
  return exercises
    .map((pe) => {
      const name = exerciseNameMap.get(BigInt(pe.exercise_biz_key)) ?? "未知";
      const config = parseSetsConfig(pe.sets_config);
      return `${name} ${formatSetsDisplay(config)}`;
    })
    .join(" | ");
}

/**
 * Get day display name with training type.
 * e.g. "Day 1 · 推日"
 */
export function formatDayCardTitle(day: TrainingDay, _index: number): string {
  const typeLabel = getTrainingTypeDisplayLabel(day.training_type);
  return `${day.day_name} · ${typeLabel}日`;
}
