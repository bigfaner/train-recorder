/**
 * PersonalRecord repository with queries by exercise_biz_key,
 * pr_type, and findMaxByExercise for PR tracking.
 *
 * pr_type: 'weight' or 'volume'
 * findMaxByExercise: returns highest pr_value for given exercise and type.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { PersonalRecord } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "personal_records";
const COLUMNS = [
  "id",
  "biz_key",
  "exercise_biz_key",
  "pr_type",
  "pr_value",
  "pr_date",
  "workout_set_biz_key",
  "created_at",
];

export interface PersonalRecordRepo extends BaseRepo<PersonalRecord> {
  createRecord(data: Omit<PersonalRecord, "id">): PersonalRecord;
  findByExerciseBizKey(exerciseBizKey: bigint): PersonalRecord[];
  findByType(
    exerciseBizKey: bigint,
    prType: PersonalRecord["pr_type"],
  ): PersonalRecord[];
  findMaxByExercise(
    exerciseBizKey: bigint,
    prType: PersonalRecord["pr_type"],
  ): PersonalRecord | null;
}

export function createPersonalRecordRepo(
  db: DatabaseAdapter,
): PersonalRecordRepo {
  const base = createBaseRepository<PersonalRecord>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  return {
    ...base,

    createRecord(data: Omit<PersonalRecord, "id">): PersonalRecord {
      return base.create(data);
    },

    findByExerciseBizKey(exerciseBizKey: bigint): PersonalRecord[] {
      return db.getAllSync<PersonalRecord>(
        `SELECT ${columnsStr} FROM personal_records WHERE exercise_biz_key = ? ORDER BY pr_date DESC`,
        [Number(exerciseBizKey)],
      );
    },

    findByType(
      exerciseBizKey: bigint,
      prType: PersonalRecord["pr_type"],
    ): PersonalRecord[] {
      return db.getAllSync<PersonalRecord>(
        `SELECT ${columnsStr} FROM personal_records WHERE exercise_biz_key = ? AND pr_type = ? ORDER BY pr_date DESC`,
        [Number(exerciseBizKey), prType],
      );
    },

    findMaxByExercise(
      exerciseBizKey: bigint,
      prType: PersonalRecord["pr_type"],
    ): PersonalRecord | null {
      return db.getFirstSync<PersonalRecord>(
        `SELECT ${columnsStr} FROM personal_records WHERE exercise_biz_key = ? AND pr_type = ? ORDER BY pr_value DESC LIMIT 1`,
        [Number(exerciseBizKey), prType],
      );
    },
  };
}
