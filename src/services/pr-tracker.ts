/**
 * PR Tracker Service
 *
 * Detects and tracks personal records (PRs) for exercises.
 * PR types:
 *   - 'weight': max single-set weight
 *   - 'volume': max weight * reps per set
 *
 * Epley formula for estimated 1RM: weight * (1 + reps / 30)
 *
 * Usage:
 *   - checkAndRecordPR: call after each set completion to detect new PRs
 *   - recalculatePR: rebuild PR records from scratch (used after workout deletion)
 *   - getPRList: retrieve all PR records for display
 *   - getEstimated1RM: calculate estimated one-rep max
 */

import type { PersonalRecordEntry, PRTracker } from "../types";
import type { DatabaseAdapter } from "../db/database-adapter";
import type { PersonalRecordRepo } from "../db/repositories/personal-record.repo";
import type { WorkoutExerciseRepo } from "../db/repositories/workout-exercise.repo";
import type { WorkoutSetRepo } from "../db/repositories/workout-set.repo";

export type PRTrackerServiceImpl = PRTracker;

export function createPRTrackerService(
  db: DatabaseAdapter,
  prRepo: PersonalRecordRepo,
  workoutExerciseRepo: WorkoutExerciseRepo,
  setRepo: WorkoutSetRepo,
): PRTrackerServiceImpl {
  /**
   * Get today's date as YYYY-MM-DD string.
   */
  function getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate a unique biz_key using timestamp + random offset.
   * This is a simplified approach for the service layer; the main
   * snowflake generator is used at the database layer.
   */
  function generateBizKey(): bigint {
    return (
      BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000))
    );
  }

  return {
    async checkAndRecordPR(
      exerciseBizKey: bigint,
      workoutSetBizKey: bigint,
      actualWeight: number,
      actualReps: number,
    ): Promise<PersonalRecordEntry | null> {
      const volume = actualWeight * actualReps;
      const today = getTodayDate();
      let newPR: PersonalRecordEntry | null = null;

      // Check weight PR
      const currentWeightPR = prRepo.findMaxByExercise(
        exerciseBizKey,
        "weight",
      );
      const currentMaxWeight = currentWeightPR
        ? Number(currentWeightPR.pr_value)
        : 0;

      if (actualWeight > currentMaxWeight) {
        prRepo.createRecord({
          biz_key: generateBizKey(),
          exercise_biz_key: exerciseBizKey,
          pr_type: "weight",
          pr_value: actualWeight,
          pr_date: today,
          workout_set_biz_key: workoutSetBizKey,
          created_at: new Date().toISOString(),
        });
        newPR = {
          exerciseBizKey,
          prType: "weight",
          prValue: actualWeight,
          prDate: today,
        };
      }

      // Check volume PR
      const currentVolumePR = prRepo.findMaxByExercise(
        exerciseBizKey,
        "volume",
      );
      const currentMaxVolume = currentVolumePR
        ? Number(currentVolumePR.pr_value)
        : 0;

      if (volume > currentMaxVolume) {
        prRepo.createRecord({
          biz_key: generateBizKey(),
          exercise_biz_key: exerciseBizKey,
          pr_type: "volume",
          pr_value: volume,
          pr_date: today,
          workout_set_biz_key: workoutSetBizKey,
          created_at: new Date().toISOString(),
        });
        // If no weight PR was set, use volume as the returned PR
        if (!newPR) {
          newPR = {
            exerciseBizKey,
            prType: "volume",
            prValue: volume,
            prDate: today,
          };
        }
      }

      return newPR;
    },

    async recalculatePR(exerciseBizKey: bigint): Promise<void> {
      // Delete all existing PRs for this exercise
      const existingPRs = prRepo.findByExerciseBizKey(exerciseBizKey);
      for (const pr of existingPRs) {
        prRepo.deleteById(pr.id);
      }

      // Find all workout exercises for this exercise
      const workoutExercises =
        workoutExerciseRepo.findByExerciseBizKey(exerciseBizKey);

      // Track max weight and max volume with their associated set data
      let maxWeight = 0;
      let maxWeightDate = "";
      let maxWeightSetBizKey: bigint | null = null;

      let maxVolume = 0;
      let maxVolumeDate = "";
      let maxVolumeSetBizKey: bigint | null = null;

      for (const we of workoutExercises) {
        // Skip skipped exercises
        if (we.exercise_status === "skipped") continue;

        // Get session date
        const session = db.getFirstSync<{ session_date: string }>(
          "SELECT session_date FROM workout_sessions WHERE biz_key = ?",
          [Number(we.workout_session_biz_key)],
        );
        if (!session) continue;

        const sessionDate = session.session_date;

        // Get all sets for this workout exercise
        const sets = setRepo.findByWorkoutExerciseBizKey(we.biz_key);

        for (const set of sets) {
          const weight = set.actual_weight ?? 0;
          const reps = set.actual_reps ?? 0;

          if (weight > maxWeight) {
            maxWeight = weight;
            maxWeightDate = sessionDate;
            maxWeightSetBizKey = set.biz_key;
          }

          const volume = weight * reps;
          if (volume > maxVolume) {
            maxVolume = volume;
            maxVolumeDate = sessionDate;
            maxVolumeSetBizKey = set.biz_key;
          }
        }
      }

      // Create new PR records
      const now = new Date().toISOString();

      if (maxWeight > 0) {
        prRepo.createRecord({
          biz_key: generateBizKey(),
          exercise_biz_key: exerciseBizKey,
          pr_type: "weight",
          pr_value: maxWeight,
          pr_date: maxWeightDate,
          workout_set_biz_key: maxWeightSetBizKey,
          created_at: now,
        });
      }

      if (maxVolume > 0) {
        prRepo.createRecord({
          biz_key: generateBizKey(),
          exercise_biz_key: exerciseBizKey,
          pr_type: "volume",
          pr_value: maxVolume,
          pr_date: maxVolumeDate,
          workout_set_biz_key: maxVolumeSetBizKey,
          created_at: now,
        });
      }
    },

    async getPRList(): Promise<PersonalRecordEntry[]> {
      // Get all PR records
      const allPRs = prRepo.findAll(undefined, "pr_date DESC");

      return allPRs.map((pr) => ({
        exerciseBizKey: pr.exercise_biz_key,
        prType: pr.pr_type,
        prValue: Number(pr.pr_value),
        prDate: pr.pr_date,
      }));
    },

    getEstimated1RM(weight: number, reps: number): number {
      // Epley formula: weight * (1 + reps / 30)
      // Only accurate for reps <= 10 per spec, but we compute for any input
      return weight * (1 + reps / 30);
    },
  };
}
