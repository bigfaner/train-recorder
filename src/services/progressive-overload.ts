/**
 * ProgressiveOverload Service
 *
 * Calculates weight recommendations for each exercise based on
 * historical performance. Operates per WorkoutExercise.biz_key
 * to handle same-exercise-multiple-times (US-17).
 *
 * Rules (PRD 5.3):
 *   - All sets met → direction='increase', suggestedWeight = previousWeight + increment
 *   - Some sets missed → direction='maintain', suggestedWeight = previousWeight
 *   - Consecutive 2 sessions missed → direction='decrease', suggestedWeight = previousWeight * 0.9
 *   - Consecutive 3 sessions completed → UI hint "考虑加大增量？" (no auto-modify)
 *   - No history → suggestedWeight = null, reason explains first-time input needed
 *
 * Excludes:
 *   - Skipped exercises (US-16)
 *   - Exercises in in_progress sessions (US-10)
 */

import type {
  OverloadSuggestion,
  ProgressiveOverload,
  WorkoutSet,
  WorkoutExercise,
} from "../types";
import type { DatabaseAdapter } from "../db/database-adapter";
import type { WorkoutExerciseRepo } from "../db/repositories/workout-exercise.repo";
import type { WorkoutSetRepo } from "../db/repositories/workout-set.repo";
import type { ExerciseRepo } from "../db/repositories/exercise.repo";

/** Round a value to the nearest multiple of `step`. */
function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Determine whether all sets in a session were met (all is_target_met = 1).
 * Sets with is_target_met = null (no actual data) are treated as not met.
 */
function isSessionAllMet(sets: WorkoutSet[]): boolean {
  if (sets.length === 0) return false;
  return sets.every((s) => s.is_target_met === 1);
}

/**
 * Get the weight used in the most recent set (actual_weight or target_weight).
 */
function getSessionWeight(sets: WorkoutSet[]): number | null {
  if (sets.length === 0) return null;
  // Use the target_weight from the first set as the session's working weight
  const first = sets[0];
  return first.actual_weight ?? first.target_weight ?? null;
}

export interface ProgressiveOverloadServiceImpl extends ProgressiveOverload {
  /**
   * Calculate suggestion for a specific WorkoutExercise instance.
   * Used for same-exercise-multiple-times (US-17) to get independent overload chains.
   */
  calculateSuggestionForWorkoutExercise(
    workoutExerciseBizKey: bigint,
    targetReps: number,
  ): Promise<OverloadSuggestion>;
}

export function createProgressiveOverloadService(
  db: DatabaseAdapter,
  workoutExerciseRepo: WorkoutExerciseRepo,
  setRepo: WorkoutSetRepo,
  exerciseRepo: ExerciseRepo,
): ProgressiveOverloadServiceImpl {
  /**
   * Get completed workout exercises for an exercise_biz_key,
   * ordered by session date descending. Excludes skipped and
   * exercises from in_progress sessions.
   */
  function getCompletedWorkoutExercises(exerciseBizKey: bigint): Array<{
    we: WorkoutExercise;
    sessionDate: string;
    sessionStatus: string;
  }> {
    const allWe = workoutExerciseRepo.findByExerciseBizKey(exerciseBizKey);

    const results: Array<{
      we: WorkoutExercise;
      sessionDate: string;
      sessionStatus: string;
    }> = [];

    for (const we of allWe) {
      // Skip skipped exercises (US-16)
      if (we.exercise_status === "skipped") continue;

      // Get session info to check status
      const session = db.getFirstSync<{
        session_date: string;
        session_status: string;
      }>(
        `SELECT session_date, session_status FROM workout_sessions WHERE biz_key = ?`,
        [Number(we.workout_session_biz_key)],
      );
      if (!session) continue;

      // Exclude in_progress sessions (US-10)
      if (session.session_status === "in_progress") continue;

      results.push({
        we,
        sessionDate: session.session_date,
        sessionStatus: session.session_status,
      });
    }

    // Sort by session_date descending (most recent first)
    results.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    return results;
  }

  /**
   * Build session history for a given exercise: list of sessions
   * with their sets, ordered most recent first.
   */
  function buildSessionHistory(exerciseBizKey: bigint): Array<{
    sets: WorkoutSet[];
    sessionDate: string;
    weight: number | null;
    allMet: boolean;
  }> {
    const completedExercises = getCompletedWorkoutExercises(exerciseBizKey);

    return completedExercises.map(({ we }) => {
      const sets = setRepo.findByWorkoutExerciseBizKey(we.biz_key);
      const weight = getSessionWeight(sets);
      const allMet = isSessionAllMet(sets);
      return { sets, sessionDate: "", weight, allMet };
    });
  }

  /**
   * Calculate consecutive counts from session history (most recent first).
   * Returns { consecutiveCompleted, consecutiveMissed } from the most recent session.
   */
  function calculateConsecutiveCounts(history: Array<{ allMet: boolean }>): {
    consecutiveCompleted: number;
    consecutiveMissed: number;
  } {
    let consecutiveCompleted = 0;
    let consecutiveMissed = 0;

    if (history.length === 0) {
      return { consecutiveCompleted: 0, consecutiveMissed: 0 };
    }

    // Count from most recent session
    const mostRecentMet = history[0].allMet;

    if (mostRecentMet) {
      for (const h of history) {
        if (h.allMet) {
          consecutiveCompleted++;
        } else {
          break;
        }
      }
    } else {
      for (const h of history) {
        if (!h.allMet) {
          consecutiveMissed++;
        } else {
          break;
        }
      }
    }

    return { consecutiveCompleted, consecutiveMissed };
  }

  /**
   * Calculate overload suggestion from session history.
   */
  function calculateFromHistory(
    history: Array<{ weight: number | null; allMet: boolean }>,
    increment: number,
  ): OverloadSuggestion {
    const { consecutiveCompleted, consecutiveMissed } =
      calculateConsecutiveCounts(history);

    const previousWeight = history.length > 0 ? history[0].weight : null;

    if (previousWeight === null) {
      return {
        suggestedWeight: null,
        previousWeight: null,
        increment,
        direction: "increase",
        reason: "首次训练该动作，请手动输入重量",
        consecutiveCompleted: 0,
        consecutiveMissed: 0,
      };
    }

    // Determine direction based on most recent session
    const mostRecentMet = history[0].allMet;

    if (consecutiveMissed >= 2) {
      // Consecutive 2 sessions missed → decrease 10%
      const decreased = previousWeight * 0.9;
      const rounded = roundToNearest(decreased, increment);
      return {
        suggestedWeight: rounded,
        previousWeight,
        increment,
        direction: "decrease",
        reason: `连续 ${consecutiveMissed} 次未达标，建议减重至 ${rounded}kg`,
        consecutiveCompleted,
        consecutiveMissed,
      };
    }

    if (mostRecentMet) {
      // All sets met → increase
      const newWeight = previousWeight + increment;
      let reason = `所有组达标，建议加重 ${increment}kg`;

      if (consecutiveCompleted >= 3) {
        reason += " — 考虑加大增量？";
      }

      return {
        suggestedWeight: newWeight,
        previousWeight,
        increment,
        direction: "increase",
        reason,
        consecutiveCompleted,
        consecutiveMissed,
      };
    }

    // Some sets missed → maintain
    return {
      suggestedWeight: previousWeight,
      previousWeight,
      increment,
      direction: "maintain",
      reason: "部分组未达标，保持当前重量",
      consecutiveCompleted,
      consecutiveMissed,
    };
  }

  return {
    async calculateSuggestion(
      exerciseBizKey: bigint,

      _targetReps: number,
    ): Promise<OverloadSuggestion> {
      // Get exercise increment
      const exercise = exerciseRepo.findByBizKey(exerciseBizKey);
      const increment = exercise?.increment ?? 2.5;

      // Build session history for this exercise
      const history = buildSessionHistory(exerciseBizKey);

      return calculateFromHistory(history, increment);
    },

    async calculateSuggestionForWorkoutExercise(
      workoutExerciseBizKey: bigint,

      _targetReps: number,
    ): Promise<OverloadSuggestion> {
      // First find the WorkoutExercise to get its exercise_biz_key
      const we = workoutExerciseRepo.findByBizKey(workoutExerciseBizKey);
      if (!we) {
        return {
          suggestedWeight: null,
          previousWeight: null,
          increment: 2.5,
          direction: "increase",
          reason: "未找到训练动作记录",
          consecutiveCompleted: 0,
          consecutiveMissed: 0,
        };
      }

      const exercise = exerciseRepo.findByBizKey(we.exercise_biz_key);
      const increment = exercise?.increment ?? 2.5;

      // Get the current workout exercise's session date
      const currentSession = db.getFirstSync<{ session_date: string }>(
        `SELECT session_date FROM workout_sessions WHERE biz_key = ?`,
        [Number(we.workout_session_biz_key)],
      );
      const currentDate = currentSession?.session_date ?? "";

      // Get all completed exercises for this exercise_biz_key
      const completedExercises = getCompletedWorkoutExercises(
        we.exercise_biz_key,
      );

      // Filter to only exercises from sessions BEFORE the current session
      const priorExercises = completedExercises.filter(
        (e) => e.sessionDate < currentDate,
      );

      const history = priorExercises.map(({ we: exerciseWe }) => {
        const sets = setRepo.findByWorkoutExerciseBizKey(exerciseWe.biz_key);
        const weight = getSessionWeight(sets);
        const allMet = isSessionAllMet(sets);
        return { weight, allMet };
      });

      return calculateFromHistory(history, increment);
    },

    async recordResult(
      _exerciseBizKey: bigint,

      _sets: WorkoutSet[],
    ): Promise<void> {
      // recordResult is a hook for post-computation actions.
      // The consecutive counts are computed on-the-fly from history,
      // so no persistent state needs updating. Future extensions could
      // trigger PR checks, notifications, etc.
    },

    async recalculateChain(
      _exerciseBizKey: bigint,

      _fromDate: string,
    ): Promise<void> {
      // Since consecutive counts are computed on-the-fly from the
      // WorkoutSet history, recalculateChain is a no-op for the
      // current implementation. If we add cached suggestion state
      // in the future, this would rebuild from fromDate forward.
    },
  };
}
