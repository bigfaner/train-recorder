/**
 * Pure helper functions for exercise library and detail pages.
 *
 * Extracted from components for testability:
 * - Category metadata (display names, ordering)
 * - Exercise grouping by category
 * - Search filtering
 * - PR formatting
 * - Session history formatting
 * - Custom exercise validation
 */

import type {
  Exercise,
  PersonalRecordEntry,
  ExerciseSessionSummary,
} from "../../types";

// ============================================================
// Category Metadata
// ============================================================

export interface CategoryMeta {
  key: Exercise["category"];
  labelZh: string;
  labelEn: string;
  order: number;
}

/**
 * Ordered category metadata matching PRD §5.5 categories.
 * Order determines display order in the library.
 */
export const EXERCISE_CATEGORIES: CategoryMeta[] = [
  {
    key: "core_powerlifting",
    labelZh: "核心力量举",
    labelEn: "Core Powerlifting",
    order: 1,
  },
  { key: "upper_push", labelZh: "上肢推", labelEn: "Upper Push", order: 2 },
  { key: "upper_pull", labelZh: "上肢拉", labelEn: "Upper Pull", order: 3 },
  { key: "lower", labelZh: "下肢辅助", labelEn: "Leg Accessories", order: 4 },
  { key: "core", labelZh: "核心", labelEn: "Core", order: 5 },
  { key: "shoulder", labelZh: "肩部", labelEn: "Shoulder", order: 6 },
  { key: "custom", labelZh: "自定义", labelEn: "Custom", order: 7 },
];

/**
 * Get a category's display metadata by key.
 */
export function getCategoryMeta(categoryKey: string): CategoryMeta | undefined {
  return EXERCISE_CATEGORIES.find((c) => c.key === categoryKey);
}

// ============================================================
// Exercise Grouping
// ============================================================

export interface ExerciseGroup {
  category: CategoryMeta;
  exercises: Exercise[];
}

/**
 * Group exercises by category, ordered by EXERCISE_CATEGORIES.
 * Only includes categories that have at least one exercise.
 * Filters out soft-deleted exercises (is_deleted = 1).
 */
export function groupExercisesByCategory(
  exercises: Exercise[],
): ExerciseGroup[] {
  // Filter out deleted exercises
  const active = exercises.filter((e) => e.is_deleted === 0);

  // Group by category
  const grouped = new Map<string, Exercise[]>();
  for (const exercise of active) {
    const key = exercise.category;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(exercise);
    } else {
      grouped.set(key, [exercise]);
    }
  }

  // Build ordered result based on EXERCISE_CATEGORIES order
  const result: ExerciseGroup[] = [];
  for (const cat of EXERCISE_CATEGORIES) {
    const exercisesInCategory = grouped.get(cat.key);
    if (exercisesInCategory && exercisesInCategory.length > 0) {
      result.push({
        category: cat,
        exercises: exercisesInCategory.sort((a, b) =>
          a.exercise_name.localeCompare(b.exercise_name, "zh-CN"),
        ),
      });
    }
  }

  // Handle any categories not in our predefined list
  for (const [key, exercisesInCategory] of grouped) {
    if (!EXERCISE_CATEGORIES.find((c) => c.key === key)) {
      result.push({
        category: {
          key: key as Exercise["category"],
          labelZh: key,
          labelEn: key,
          order: 99,
        },
        exercises: exercisesInCategory.sort((a, b) =>
          a.exercise_name.localeCompare(b.exercise_name, "zh-CN"),
        ),
      });
    }
  }

  return result;
}

// ============================================================
// Search / Filter
// ============================================================

/**
 * Filter exercise groups by search query.
 * Matches exercise_name (case-insensitive, includes partial).
 * Returns only groups that have at least one matching exercise.
 */
export function filterExercisesByQuery(
  groups: ExerciseGroup[],
  query: string,
): ExerciseGroup[] {
  if (!query.trim()) return groups;

  const lowerQuery = query.trim().toLowerCase();

  return groups
    .map((group) => ({
      ...group,
      exercises: group.exercises.filter((e) =>
        e.exercise_name.toLowerCase().includes(lowerQuery),
      ),
    }))
    .filter((group) => group.exercises.length > 0);
}

// ============================================================
// PR Formatting
// ============================================================

/**
 * Format an increment value for display (e.g., "+2.5kg").
 * Shows integer without decimal if whole number.
 */
export function formatIncrement(increment: number): string {
  const formatted = Number.isInteger(increment)
    ? String(increment)
    : String(increment);
  return `+${formatted}kg`;
}

/**
 * Format rest time for display (e.g., "休180s" or "休3min").
 * Shows minutes when >= 60 and divisible by 60.
 */
export function formatRestTime(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `休${minutes}min`;
  }
  return `休${seconds}s`;
}

/**
 * Format weight with kg unit for PR display.
 */
export function formatPRWeight(value: number): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${formatted}kg`;
}

/**
 * Format volume with kg unit and comma separators.
 */
export function formatPRVolume(value: number): string {
  return `${value.toLocaleString("en-US")}kg`;
}

/**
 * Find the weight PR from a list of PR entries.
 */
export function findWeightPR(
  prs: PersonalRecordEntry[],
): PersonalRecordEntry | undefined {
  return prs.find((p) => p.prType === "weight");
}

/**
 * Find the volume PR from a list of PR entries.
 */
export function findVolumePR(
  prs: PersonalRecordEntry[],
): PersonalRecordEntry | undefined {
  return prs.find((p) => p.prType === "volume");
}

// ============================================================
// Session History Formatting
// ============================================================

/**
 * Format a session date for display (e.g., "5月5日 周一").
 */
export function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 周${weekday}`;
}

/**
 * Compute total volume for a session.
 */
export function computeSessionVolume(session: ExerciseSessionSummary): number {
  return session.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

/**
 * Format a set summary line (e.g., "100kg × 5").
 */
export function formatSetLine(
  sets: { weight: number; reps: number }[],
): string {
  if (sets.length === 0) return "";

  // Group by weight
  const weightGroups = new Map<number, number>();
  for (const s of sets) {
    weightGroups.set(s.weight, (weightGroups.get(s.weight) ?? 0) + 1);
  }

  // If all same weight and reps, show compact format
  if (weightGroups.size === 1) {
    const [weight, _count] = weightGroups.entries().next().value as [
      number,
      number,
    ];
    const reps = sets[0].reps;
    return `${weight}kg × ${reps}`;
  }

  // Multiple weights
  const parts: string[] = [];
  for (const [weight, _count] of weightGroups) {
    const reps = sets.find((s) => s.weight === weight)!.reps;
    parts.push(`${weight}kg × ${reps}`);
  }
  return parts.join(", ");
}

/**
 * Get the set count display (e.g., "5组" or "4/5组").
 */
export function formatSetCount(
  completedSets: number,
  totalSets: number,
): string {
  if (completedSets === totalSets) {
    return `${totalSets}组`;
  }
  return `${completedSets}/${totalSets}组`;
}

// ============================================================
// Custom Exercise Validation
// ============================================================

export interface CustomExerciseValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate custom exercise data before saving.
 */
export function validateCustomExercise(data: {
  exerciseName: string;
  category: string;
  increment: number;
  defaultRest: number;
}): CustomExerciseValidation {
  const errors: string[] = [];

  if (!data.exerciseName.trim()) {
    errors.push("请输入动作名称");
  }

  if (data.exerciseName.trim().length > 100) {
    errors.push("动作名称不能超过100个字符");
  }

  if (!data.category) {
    errors.push("请选择分类");
  }

  if (data.increment <= 0) {
    errors.push("增量必须大于0");
  }

  if (data.increment > 100) {
    errors.push("增量不能超过100kg");
  }

  if (data.defaultRest < 0) {
    errors.push("休息时间不能为负");
  }

  if (data.defaultRest > 600) {
    errors.push("休息时间不能超过600秒");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================
// Category Selection for Custom Exercise
// ============================================================

/**
 * Available categories for custom exercise creation.
 * Excludes "custom" since custom exercises are automatically placed there
 * when created by the user.
 */
export const CUSTOM_EXERCISE_CATEGORIES = EXERCISE_CATEGORIES.filter(
  (c) => c.key !== "custom",
);

// ============================================================
// Progress Chart Data
// ============================================================

export interface ProgressDataPoint {
  date: string;
  value: number;
  isPR: boolean;
}

/**
 * Build progress chart data from recent sessions.
 * Uses the max weight per session as the data point value.
 * Marks data points that match the weight PR value.
 */
export function buildProgressData(
  sessions: ExerciseSessionSummary[],
  weightPR: PersonalRecordEntry | undefined,
): ProgressDataPoint[] {
  const prValue = weightPR?.prValue ?? 0;

  return sessions
    .slice()
    .reverse() // chronological order (oldest first)
    .map((session) => {
      // Use max weight from sets
      const maxWeight = session.sets.reduce(
        (max, s) => Math.max(max, s.weight),
        0,
      );
      return {
        date: session.sessionDate,
        value: maxWeight,
        isPR: maxWeight >= prValue && prValue > 0,
      };
    });
}
