/**
 * Pure helper functions for the post-workout feeling page.
 *
 * Extracted from components for testability:
 * - Total volume calculation from completed exercise sets
 * - Training summary formatting (type label + volume)
 * - Warning detection (high fatigue + low satisfaction)
 * - Exercise filtering (completed only) and summary formatting
 */

import type { WorkoutExercise, WorkoutSet } from "../../types";

/**
 * Warning message shown when fatigue is high and satisfaction is low.
 */
export const WARNING_MESSAGE = "建议下次降低强度";

/**
 * Map training_type enum to Chinese display labels.
 */
const TRAINING_TYPE_LABELS: Record<string, string> = {
  push: "推日",
  pull: "拉日",
  legs: "蹲日",
  custom: "自定义",
} as const;

/**
 * Get the Chinese display label for a training type.
 *
 * @param trainingType - The training type enum value
 * @returns Display label like "推日"
 */
export function getTrainingTypeLabel(
  trainingType: "push" | "pull" | "legs" | "custom",
): string {
  return TRAINING_TYPE_LABELS[trainingType] ?? "自定义";
}

/**
 * Compute total volume from all completed sets.
 * Volume = sum of (actual_weight * actual_reps) for each completed set.
 *
 * @param allSets - All workout sets across all exercises
 * @returns Total volume in kg
 */
export function computeTotalVolume(allSets: WorkoutSet[]): number {
  return allSets
    .filter(
      (s) =>
        s.is_completed === 1 &&
        s.actual_weight !== null &&
        s.actual_reps !== null,
    )
    .reduce((sum, s) => sum + (s.actual_weight ?? 0) * (s.actual_reps ?? 0), 0);
}

/**
 * Format a number with comma separators (e.g. 8400 -> "8,400").
 */
function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Format the training summary line shown at the top of the feeling page.
 *
 * @param trainingType - The training type enum value
 * @param totalVolume - Total volume in kg
 * @returns Formatted string like "推日 · 总容量 8,400kg"
 */
export function formatTrainingSummary(
  trainingType: "push" | "pull" | "legs" | "custom",
  totalVolume: number,
): string {
  const label = getTrainingTypeLabel(trainingType);
  return `${label} · 总容量 ${formatNumber(totalVolume)}kg`;
}

/**
 * Determine whether to show the warning state.
 * Warning is shown when fatigue >= 8 AND satisfaction <= 4.
 *
 * @param fatigue - Fatigue level (1-10)
 * @param satisfaction - Satisfaction level (1-10)
 * @returns true if warning should be shown
 */
export function shouldShowWarning(
  fatigue: number,
  satisfaction: number,
): boolean {
  return fatigue >= 8 && satisfaction <= 4;
}

/**
 * Filter exercises to only show completed ones (skipped/excluded).
 * Per-exercise note cards only appear for completed exercises.
 *
 * @param exercises - All workout exercises
 * @returns Only exercises with exercise_status === 'completed'
 */
export function getCompletedExercises(
  exercises: WorkoutExercise[],
): WorkoutExercise[] {
  return exercises.filter((e) => e.exercise_status === "completed");
}

/**
 * Format the exercise summary line for a per-exercise note card.
 * Shows exercise name + weight × reps × sets (e.g., "卧推 60kg×5×3").
 *
 * For mixed weights, shows each: "卧推 60kg×5, 65kg×3"
 *
 * @param exerciseName - Display name of the exercise
 * @param sets - Completed sets for this exercise
 * @returns Formatted summary string
 */
export function formatExerciseSummary(
  exerciseName: string,
  sets: WorkoutSet[],
): string {
  const completedSets = sets.filter((s) => s.is_completed === 1);
  if (completedSets.length === 0) {
    return exerciseName;
  }

  // Group sets by weight
  const weightGroups = new Map<number, number[]>();
  for (const set of completedSets) {
    const weight = set.actual_weight ?? set.target_weight ?? 0;
    const reps = set.actual_reps ?? set.target_reps;
    const existing = weightGroups.get(weight);
    if (existing) {
      existing.push(reps);
    } else {
      weightGroups.set(weight, [reps]);
    }
  }

  // If all same weight and same reps, show compact format: "name Wkg×R×S"
  if (weightGroups.size === 1) {
    const [weight, repsList] = weightGroups.entries().next().value as [
      number,
      number[],
    ];
    const allSameReps = repsList.every((r) => r === repsList[0]);
    if (allSameReps) {
      return `${exerciseName} ${weight}kg×${repsList[0]}×${repsList.length}`;
    }
    // Same weight, different reps
    const repsStr = repsList.join(", ");
    return `${exerciseName} ${weight}kg×${repsStr}`;
  }

  // Multiple weights
  const parts: string[] = [];
  for (const [weight, repsList] of weightGroups) {
    const repsStr = repsList.join(", ");
    parts.push(`${weight}kg×${repsStr}`);
  }
  return `${exerciseName} ${parts.join(", ")}`;
}
