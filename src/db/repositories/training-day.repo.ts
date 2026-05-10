/**
 * TrainingDay repository with findByPlanBizKey for querying days of a plan.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { TrainingDay } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "training_days";
const COLUMNS = [
  "id",
  "biz_key",
  "plan_biz_key",
  "day_name",
  "training_type",
  "order_index",
  "created_at",
  "updated_at",
];

export interface TrainingDayRepo extends BaseRepo<TrainingDay> {
  createDay(data: Omit<TrainingDay, "id">): TrainingDay;
  findByPlanBizKey(planBizKey: bigint): TrainingDay[];
}

export function createTrainingDayRepo(db: DatabaseAdapter): TrainingDayRepo {
  const base = createBaseRepository<TrainingDay>(db, TABLE_NAME, COLUMNS);

  return {
    ...base,

    createDay(data: Omit<TrainingDay, "id">): TrainingDay {
      return base.create(data);
    },

    findByPlanBizKey(planBizKey: bigint): TrainingDay[] {
      return db.getAllSync<TrainingDay>(
        `SELECT ${COLUMNS.join(", ")} FROM training_days WHERE plan_biz_key = ? ORDER BY order_index ASC`,
        [planBizKey],
      );
    },
  };
}
