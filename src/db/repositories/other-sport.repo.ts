/**
 * OtherSportRecord repository with queries by date and sport_type_biz_key.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { OtherSportRecord } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "other_sport_records";
const COLUMNS = [
  "id",
  "biz_key",
  "record_date",
  "sport_type_biz_key",
  "sport_note",
  "created_at",
  "updated_at",
];

export interface OtherSportRepo extends BaseRepo<OtherSportRecord> {
  createRecord(data: Omit<OtherSportRecord, "id">): OtherSportRecord;
  findByDate(recordDate: string): OtherSportRecord[];
  findByDateRange(startDate: string, endDate: string): OtherSportRecord[];
  findBySportTypeBizKey(sportTypeBizKey: bigint): OtherSportRecord[];
}

export function createOtherSportRepo(db: DatabaseAdapter): OtherSportRepo {
  const base = createBaseRepository<OtherSportRecord>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  return {
    ...base,

    createRecord(data: Omit<OtherSportRecord, "id">): OtherSportRecord {
      return base.create(data);
    },

    findByDate(recordDate: string): OtherSportRecord[] {
      return db.getAllSync<OtherSportRecord>(
        `SELECT ${columnsStr} FROM other_sport_records WHERE record_date = ?`,
        [recordDate],
      );
    },

    findByDateRange(startDate: string, endDate: string): OtherSportRecord[] {
      return db.getAllSync<OtherSportRecord>(
        `SELECT ${columnsStr} FROM other_sport_records WHERE record_date >= ? AND record_date <= ? ORDER BY record_date ASC`,
        [startDate, endDate],
      );
    },

    findBySportTypeBizKey(sportTypeBizKey: bigint): OtherSportRecord[] {
      return db.getAllSync<OtherSportRecord>(
        `SELECT ${columnsStr} FROM other_sport_records WHERE sport_type_biz_key = ? ORDER BY record_date DESC`,
        [Number(sportTypeBizKey)],
      );
    },
  };
}
