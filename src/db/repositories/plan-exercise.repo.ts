/**
 * PlanExercise repository with findByTrainingDayBizKey.
 * sets_config is stored as JSON VARCHAR(2048); parse on read, stringify on write.
 */

import type { DatabaseAdapter } from '../database-adapter';
import type { PlanExercise } from '../../types';
import { createBaseRepository, type BaseRepo } from './base.repository';

const TABLE_NAME = 'plan_exercises';
const COLUMNS = [
  'id', 'biz_key', 'training_day_biz_key', 'exercise_biz_key',
  'sets_config', 'order_index', 'exercise_note', 'created_at', 'updated_at',
];

export interface PlanExerciseRepo extends BaseRepo<PlanExercise> {
  createPlanExercise(data: Omit<PlanExercise, 'id'>): PlanExercise;
  findByTrainingDayBizKey(trainingDayBizKey: bigint): PlanExercise[];
}

export function createPlanExerciseRepo(db: DatabaseAdapter): PlanExerciseRepo {
  const base = createBaseRepository<PlanExercise>(db, TABLE_NAME, COLUMNS);

  return {
    ...base,

    createPlanExercise(data: Omit<PlanExercise, 'id'>): PlanExercise {
      return base.create(data);
    },

    findByTrainingDayBizKey(trainingDayBizKey: bigint): PlanExercise[] {
      return db.getAllSync<PlanExercise>(
        `SELECT ${COLUMNS.join(', ')} FROM plan_exercises WHERE training_day_biz_key = ? ORDER BY order_index ASC`,
        [trainingDayBizKey],
      );
    },
  };
}
