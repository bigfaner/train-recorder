/**
 * Feeling repository with findByWorkoutSessionBizKey query.
 * Each WorkoutSession has at most one Feeling (one-to-one).
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { Feeling } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "feelings";
const COLUMNS = [
  "id",
  "biz_key",
  "workout_session_biz_key",
  "fatigue_level",
  "satisfaction",
  "overall_note",
  "created_at",
  "updated_at",
];

export interface FeelingRepo extends BaseRepo<Feeling> {
  createFeeling(data: Omit<Feeling, "id">): Feeling;
  findByWorkoutSessionBizKey(workoutSessionBizKey: bigint): Feeling | null;
}

export function createFeelingRepo(db: DatabaseAdapter): FeelingRepo {
  const base = createBaseRepository<Feeling>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  return {
    ...base,

    createFeeling(data: Omit<Feeling, "id">): Feeling {
      return base.create(data);
    },

    findByWorkoutSessionBizKey(workoutSessionBizKey: bigint): Feeling | null {
      return db.getFirstSync<Feeling>(
        `SELECT ${columnsStr} FROM feelings WHERE workout_session_biz_key = ?`,
        [Number(workoutSessionBizKey)],
      );
    },
  };
}
