/**
 * WorkoutExercise repository with queries by session and exercise biz_key.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { WorkoutExercise } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "workout_exercises";
const COLUMNS = [
  "id",
  "biz_key",
  "workout_session_biz_key",
  "exercise_biz_key",
  "order_index",
  "exercise_status",
  "exercise_note",
  "suggested_weight",
  "target_sets",
  "target_reps",
  "exercise_mode",
  "created_at",
];

export interface WorkoutExerciseRepo extends BaseRepo<WorkoutExercise> {
  createExercise(data: Omit<WorkoutExercise, "id">): WorkoutExercise;
  findBySessionBizKey(sessionBizKey: bigint): WorkoutExercise[];
  findByExerciseBizKey(exerciseBizKey: bigint): WorkoutExercise[];
}

export function createWorkoutExerciseRepo(
  db: DatabaseAdapter,
): WorkoutExerciseRepo {
  const base = createBaseRepository<WorkoutExercise>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  return {
    ...base,

    createExercise(data: Omit<WorkoutExercise, "id">): WorkoutExercise {
      return base.create(data);
    },

    findBySessionBizKey(sessionBizKey: bigint): WorkoutExercise[] {
      return db.getAllSync<WorkoutExercise>(
        `SELECT ${columnsStr} FROM workout_exercises WHERE workout_session_biz_key = ? ORDER BY order_index ASC`,
        [Number(sessionBizKey)],
      );
    },

    findByExerciseBizKey(exerciseBizKey: bigint): WorkoutExercise[] {
      return db.getAllSync<WorkoutExercise>(
        `SELECT ${columnsStr} FROM workout_exercises WHERE exercise_biz_key = ? ORDER BY created_at DESC`,
        [Number(exerciseBizKey)],
      );
    },
  };
}
