/**
 * ExerciseFeeling repository with queries by feeling_biz_key and
 * workout_exercise_biz_key. Each WorkoutExercise has at most one
 * ExerciseFeeling (one-to-one via workout_exercise_biz_key).
 */

import type { DatabaseAdapter } from '../database-adapter';
import type { ExerciseFeeling } from '../../types';
import { createBaseRepository, type BaseRepo } from './base.repository';

const TABLE_NAME = 'exercise_feelings';
const COLUMNS = [
  'id', 'biz_key', 'feeling_biz_key', 'exercise_biz_key',
  'workout_exercise_biz_key', 'feeling_note', 'created_at',
];

export interface ExerciseFeelingRepo extends BaseRepo<ExerciseFeeling> {
  createExerciseFeeling(data: Omit<ExerciseFeeling, 'id'>): ExerciseFeeling;
  findByFeelingBizKey(feelingBizKey: bigint): ExerciseFeeling[];
  findByWorkoutExerciseBizKey(workoutExerciseBizKey: bigint): ExerciseFeeling | null;
}

export function createExerciseFeelingRepo(db: DatabaseAdapter): ExerciseFeelingRepo {
  const base = createBaseRepository<ExerciseFeeling>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(', ');

  return {
    ...base,

    createExerciseFeeling(data: Omit<ExerciseFeeling, 'id'>): ExerciseFeeling {
      return base.create(data);
    },

    findByFeelingBizKey(feelingBizKey: bigint): ExerciseFeeling[] {
      return db.getAllSync<ExerciseFeeling>(
        `SELECT ${columnsStr} FROM exercise_feelings WHERE feeling_biz_key = ?`,
        [Number(feelingBizKey)],
      );
    },

    findByWorkoutExerciseBizKey(workoutExerciseBizKey: bigint): ExerciseFeeling | null {
      return db.getFirstSync<ExerciseFeeling>(
        `SELECT ${columnsStr} FROM exercise_feelings WHERE workout_exercise_biz_key = ?`,
        [Number(workoutExerciseBizKey)],
      );
    },
  };
}
