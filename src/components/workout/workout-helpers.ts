/**
 * Pure helper functions for the workout recording UI.
 *
 * Extracted from components for testability:
 * - Exercise display name logic (same exercise distinction)
 * - Weight label logic (suggested vs custom)
 * - Progress formatting
 * - Set summary formatting
 * - Confirmation dialog text
 */

import type { WorkoutExercise, WorkoutSet } from "../../types";

/**
 * Build a display name for an exercise, handling duplicates.
 * If the same exercise appears multiple times, appends "#N" and optional note.
 *
 * @param workoutExerciseBizKey - The specific WorkoutExercise's biz_key
 * @param exerciseName - Base exercise name (e.g. "深蹲")
 * @param allExercises - All exercises in the workout
 * @returns Display name like "深蹲 #1" or "深蹲 #2 - 暂停深蹲"
 */
export function getExerciseDisplayName(
  workoutExerciseBizKey: bigint,
  exerciseName: string,
  allExercises: WorkoutExercise[],
): string {
  const currentExercise = allExercises.find(
    (e) => e.biz_key === workoutExerciseBizKey,
  );
  if (!currentExercise) {
    return exerciseName;
  }

  // Find all exercises with the same exercise_biz_key (same type)
  const sameTypeExercises = allExercises.filter(
    (e) => e.exercise_biz_key === currentExercise.exercise_biz_key,
  );

  // If only one instance, return plain name
  if (sameTypeExercises.length <= 1) {
    return exerciseName;
  }

  // Find the index of this exercise among duplicates
  const index = sameTypeExercises.findIndex(
    (e) => e.biz_key === workoutExerciseBizKey,
  );
  const ordinal = index + 1;

  const note = currentExercise.exercise_note;

  if (note) {
    return `${exerciseName} #${ordinal} - ${note}`;
  }
  return `${exerciseName} #${ordinal}`;
}

/**
 * Determine if the current weight is a custom override of the suggestion.
 *
 * @param suggestedWeight - Weight suggested by progressive overload
 * @param actualWeight - Weight entered by user
 * @returns true if user has overridden the suggestion
 */
export function isCustomWeight(
  suggestedWeight: number | null,
  actualWeight: number | null,
): boolean {
  if (suggestedWeight === null || actualWeight === null) {
    return false;
  }
  return actualWeight !== suggestedWeight;
}

/**
 * Get the weight label type for display.
 *
 * @param suggestedWeight - Suggested weight from overload
 * @param actualWeight - User-entered weight
 * @returns "suggested" | "custom" | "none"
 */
export function getWeightLabelType(
  suggestedWeight: number | null,
  actualWeight: number | null,
): "suggested" | "custom" | "none" {
  if (actualWeight === null || actualWeight === undefined) {
    return suggestedWeight !== null ? "suggested" : "none";
  }
  if (suggestedWeight === null) {
    return "none";
  }
  return actualWeight !== suggestedWeight ? "custom" : "suggested";
}

/**
 * Format weight display with increment indicator.
 *
 * @param weight - The weight value
 * @param increment - The increment value (e.g. 2.5)
 * @returns Formatted string like "60kg (+2.5)"
 */
export function formatWeightWithIncrement(
  weight: number,
  increment: number,
): string {
  if (increment > 0) {
    return `${weight}kg (+${increment})`;
  }
  return `${weight}kg`;
}

/**
 * Format exercise progress text.
 *
 * @param completed - Number of completed exercises
 * @param total - Total number of exercises
 * @returns Progress string like "完成 2/5"
 */
export function formatExerciseProgress(
  completed: number,
  total: number,
): string {
  return `完成 ${completed}/${total}`;
}

/**
 * Format set progress text.
 *
 * @param completed - Completed sets
 * @param total - Total sets
 * @returns Set progress string like "3/5组"
 */
export function formatSetProgress(completed: number, total: number): string {
  return `${completed}/${total}组`;
}

/**
 * Format completed set summary for collapsed cards.
 *
 * @param sets - Completed workout sets
 * @returns Summary like "100kg × 5×5" or "60kg × 8, 65kg × 8"
 */
export function formatSetSummary(sets: WorkoutSet[]): string {
  if (sets.length === 0) return "";

  // Group sets by weight
  const weightGroups = new Map<number, { weight: number; reps: number[] }>();
  for (const set of sets) {
    const w = set.actual_weight ?? set.target_weight ?? 0;
    const r = set.actual_reps ?? set.target_reps;
    const existing = weightGroups.get(w);
    if (existing) {
      existing.reps.push(r);
    } else {
      weightGroups.set(w, { weight: w, reps: [r] });
    }
  }

  const parts: string[] = [];
  for (const [, group] of weightGroups) {
    if (group.reps.length > 0) {
      const repsStr = group.reps.join(", ");
      parts.push(`${group.weight}kg × ${repsStr}`);
    }
  }

  return parts.join(" | ");
}

/**
 * Build confirmation dialog text for mid-workout exit.
 *
 * @param completed - Number of completed exercises
 * @param total - Total number of exercises
 * @returns Confirmation text like "已完成 2/5 动作，确定结束？"
 */
export function getExitConfirmText(completed: number, total: number): string {
  return `已完成 ${completed}/${total} 动作，确定结束？`;
}

/**
 * Determine the visual state of an exercise card.
 *
 * @param exercise - The workout exercise
 * @param currentExerciseBizKey - Currently active exercise biz_key
 * @returns "completed" | "active" | "pending"
 */
export function getExerciseCardState(
  exercise: WorkoutExercise,
  currentExerciseBizKey: bigint | null,
): "completed" | "active" | "pending" {
  if (exercise.exercise_status === "completed") {
    return "completed";
  }
  if (
    exercise.biz_key === currentExerciseBizKey ||
    exercise.exercise_status === "in_progress"
  ) {
    return "active";
  }
  return "pending";
}

/**
 * Compute completed sets count for an exercise.
 *
 * @param sets - The workout sets
 * @returns Number of completed sets
 */
export function getCompletedSetCount(sets: WorkoutSet[]): number {
  return sets.filter((s) => s.is_completed === 1).length;
}

/**
 * Check if all exercises are completed.
 *
 * @param exercises - All workout exercises
 * @returns true if every exercise is completed
 */
export function isAllExercisesCompleted(exercises: WorkoutExercise[]): boolean {
  if (exercises.length === 0) return false;
  return exercises.every((e) => e.exercise_status === "completed");
}

/**
 * Get the next set index for an exercise.
 *
 * @param sets - Current sets for the exercise
 * @returns Next set index (0-based)
 */
export function getNextSetIndex(sets: WorkoutSet[]): number {
  return sets.length;
}
