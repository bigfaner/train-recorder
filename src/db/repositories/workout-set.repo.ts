/**
 * WorkoutSet repository with is_target_met computation and
 * query by workout_exercise_biz_key.
 *
 * is_target_met: 1 if actual_reps >= target_reps, else 0.
 * Computed on create when actual_reps is provided.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { WorkoutSet } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "workout_sets";
const COLUMNS = [
  "id",
  "biz_key",
  "workout_exercise_biz_key",
  "set_index",
  "target_weight",
  "target_reps",
  "actual_weight",
  "actual_reps",
  "is_completed",
  "completed_at",
  "is_target_met",
];

function computeIsTargetMet(
  actualReps: number | null,
  targetReps: number,
): 0 | 1 | null {
  if (actualReps === null || actualReps === undefined) {
    return null;
  }
  return actualReps >= targetReps ? 1 : 0;
}

export interface WorkoutSetCreateData
  extends Omit<WorkoutSet, "id" | "is_target_met"> {
  is_target_met?: 0 | 1 | null;
}

export interface WorkoutSetRepo extends BaseRepo<WorkoutSet> {
  createSet(data: WorkoutSetCreateData): WorkoutSet;
  findByWorkoutExerciseBizKey(workoutExerciseBizKey: bigint): WorkoutSet[];
}

export function createWorkoutSetRepo(db: DatabaseAdapter): WorkoutSetRepo {
  const base = createBaseRepository<WorkoutSet>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  return {
    ...base,

    createSet(data: WorkoutSetCreateData): WorkoutSet {
      // Compute is_target_met if not explicitly provided
      if (data.is_target_met === undefined) {
        data = {
          ...data,
          is_target_met: computeIsTargetMet(data.actual_reps, data.target_reps),
        };
      }
      return base.create(data as Omit<WorkoutSet, "id">);
    },

    findByWorkoutExerciseBizKey(workoutExerciseBizKey: bigint): WorkoutSet[] {
      return db.getAllSync<WorkoutSet>(
        `SELECT ${columnsStr} FROM workout_sets WHERE workout_exercise_biz_key = ? ORDER BY set_index ASC`,
        [Number(workoutExerciseBizKey)],
      );
    },
  };
}
