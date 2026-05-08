/**
 * Exercise History Service
 *
 * Provides recent session summaries and exercise detail views.
 * Used by exercise-detail.tsx to show history, PRs, and progress.
 *
 * - getExerciseSummary: returns ExerciseDetailSummary with recent 5 sessions + PRs + total count
 * - getRecentSessions: returns session summaries with set details
 */

import type {
  ExerciseSessionSummary,
  ExerciseDetailSummary,
  ExerciseHistoryService,
  PersonalRecordEntry,
} from "../types";
import type { DatabaseAdapter } from "../db/database-adapter";
import type { WorkoutExerciseRepo } from "../db/repositories/workout-exercise.repo";
import type { WorkoutSetRepo } from "../db/repositories/workout-set.repo";
import type { ExerciseRepo } from "../db/repositories/exercise.repo";
import type { PersonalRecordRepo } from "../db/repositories/personal-record.repo";

export type ExerciseHistoryServiceImpl = ExerciseHistoryService;

export function createExerciseHistoryService(
  db: DatabaseAdapter,
  workoutExerciseRepo: WorkoutExerciseRepo,
  setRepo: WorkoutSetRepo,
  exerciseRepo: ExerciseRepo,
  prRepo: PersonalRecordRepo,
): ExerciseHistoryServiceImpl {
  /**
   * Build session summaries from workout exercises for a given exercise_biz_key.
   * Groups sets by workout_session_biz_key, sorted by session_date descending.
   * Excludes skipped exercises.
   */
  function buildSessionSummaries(
    exerciseBizKey: bigint,
    limit?: number,
  ): ExerciseSessionSummary[] {
    const allWorkoutExercises =
      workoutExerciseRepo.findByExerciseBizKey(exerciseBizKey);

    // Filter out skipped exercises and build session info
    const sessionData: Array<{
      workoutSessionBizKey: bigint;
      sessionDate: string;
      weBizKey: bigint;
    }> = [];

    for (const we of allWorkoutExercises) {
      // Skip skipped exercises
      if (we.exercise_status === "skipped") continue;

      // Get session date
      const session = db.getFirstSync<{
        session_date: string;
      }>("SELECT session_date FROM workout_sessions WHERE biz_key = ?", [
        Number(we.workout_session_biz_key),
      ]);
      if (!session) continue;

      sessionData.push({
        workoutSessionBizKey: we.workout_session_biz_key,
        sessionDate: session.session_date,
        weBizKey: we.biz_key,
      });
    }

    // Sort by session_date descending
    sessionData.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    // Apply limit if specified
    const limitedData = limit ? sessionData.slice(0, limit) : sessionData;

    // Build summaries
    return limitedData.map((sd) => {
      const sets = setRepo.findByWorkoutExerciseBizKey(sd.weBizKey);

      return {
        sessionDate: sd.sessionDate,
        workoutSessionBizKey: sd.workoutSessionBizKey,
        sets: sets.map((s) => ({
          weight: s.actual_weight ?? 0,
          reps: s.actual_reps ?? 0,
          isTargetMet: s.is_target_met === 1,
        })),
      };
    });
  }

  /**
   * Get distinct session count for an exercise.
   * Counts unique workout_session_biz_key values (excluding skipped).
   */
  function getDistinctSessionCount(exerciseBizKey: bigint): number {
    const allWorkoutExercises =
      workoutExerciseRepo.findByExerciseBizKey(exerciseBizKey);

    const sessionBizKeys = new Set<bigint>();
    for (const we of allWorkoutExercises) {
      if (we.exercise_status === "skipped") continue;
      sessionBizKeys.add(we.workout_session_biz_key);
    }

    return sessionBizKeys.size;
  }

  return {
    async getExerciseSummary(
      exerciseBizKey: bigint,
    ): Promise<ExerciseDetailSummary> {
      // Get exercise name
      const exercise = exerciseRepo.findByBizKey(exerciseBizKey);
      const exerciseName = exercise?.exercise_name ?? "Unknown Exercise";

      // Get recent 5 sessions
      const recentSessions = buildSessionSummaries(exerciseBizKey, 5);

      // Get personal records
      const prRecords = prRepo.findByExerciseBizKey(exerciseBizKey);
      const personalRecords: PersonalRecordEntry[] = prRecords.map((pr) => ({
        exerciseBizKey: pr.exercise_biz_key,
        prType: pr.pr_type,
        prValue: Number(pr.pr_value),
        prDate: pr.pr_date,
      }));

      // Get total session count
      const totalSessionCount = getDistinctSessionCount(exerciseBizKey);

      return {
        exerciseBizKey,
        exerciseName,
        recentSessions,
        personalRecords,
        totalSessionCount,
      };
    },

    async getRecentSessions(
      exerciseBizKey: bigint,
      limit: number,
    ): Promise<ExerciseSessionSummary[]> {
      return buildSessionSummaries(exerciseBizKey, limit);
    },
  };
}
