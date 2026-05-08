/**
 * TrainingPlan repository with is_active toggle logic.
 * Extends base CRUD with plan-specific queries.
 */

import type { DatabaseAdapter } from '../database-adapter';
import type { TrainingPlan } from '../../types';
import { createBaseRepository, type BaseRepo } from './base.repository';

const TABLE_NAME = 'training_plans';
const COLUMNS = [
  'id', 'biz_key', 'plan_name', 'plan_mode', 'cycle_length', 'schedule_mode',
  'rest_days', 'weekly_config', 'is_active', 'created_at', 'updated_at',
];

export interface TrainingPlanRepo extends BaseRepo<TrainingPlan> {
  createPlan(data: Omit<TrainingPlan, 'id'>): TrainingPlan;
  activatePlan(id: number): TrainingPlan;
  deactivatePlan(id: number): TrainingPlan;
  findActive(): TrainingPlan | null;
}

export function createTrainingPlanRepo(db: DatabaseAdapter): TrainingPlanRepo {
  const base = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);

  return {
    ...base,

    createPlan(data: Omit<TrainingPlan, 'id'>): TrainingPlan {
      return base.create(data);
    },

    activatePlan(id: number): TrainingPlan {
      // Deactivate all plans first (single active plan constraint)
      db.runSync('UPDATE training_plans SET is_active = 0 WHERE is_active = 1');
      // Then activate the target plan
      db.runSync('UPDATE training_plans SET is_active = 1 WHERE id = ?', [id]);
      return base.findById(id)!;
    },

    deactivatePlan(id: number): TrainingPlan {
      db.runSync('UPDATE training_plans SET is_active = 0 WHERE id = ?', [id]);
      return base.findById(id)!;
    },

    findActive(): TrainingPlan | null {
      return db.getFirstSync<TrainingPlan>(
        `SELECT ${COLUMNS.join(', ')} FROM training_plans WHERE is_active = 1`,
      );
    },
  };
}
