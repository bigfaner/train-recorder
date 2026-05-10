/**
 * BodyMeasurement repository with date range query and findLatest.
 * Nullable circumference fields; findLatest returns most recent
 * record_date entry.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { BodyMeasurement } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "body_measurements";
const COLUMNS = [
  "id",
  "biz_key",
  "record_date",
  "body_weight",
  "chest_circumference",
  "waist_circumference",
  "arm_circumference",
  "thigh_circumference",
  "body_note",
  "created_at",
  "updated_at",
];

export interface BodyMeasurementRepo extends BaseRepo<BodyMeasurement> {
  createMeasurement(data: Omit<BodyMeasurement, "id">): BodyMeasurement;
  findByDateRange(startDate: string, endDate: string): BodyMeasurement[];
  findLatest(): BodyMeasurement | null;
}

export function createBodyMeasurementRepo(
  db: DatabaseAdapter,
): BodyMeasurementRepo {
  const base = createBaseRepository<BodyMeasurement>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  return {
    ...base,

    createMeasurement(data: Omit<BodyMeasurement, "id">): BodyMeasurement {
      return base.create(data);
    },

    findByDateRange(startDate: string, endDate: string): BodyMeasurement[] {
      return db.getAllSync<BodyMeasurement>(
        `SELECT ${columnsStr} FROM body_measurements WHERE record_date >= ? AND record_date <= ? ORDER BY record_date ASC`,
        [startDate, endDate],
      );
    },

    findLatest(): BodyMeasurement | null {
      return db.getFirstSync<BodyMeasurement>(
        `SELECT ${columnsStr} FROM body_measurements ORDER BY record_date DESC LIMIT 1`,
      );
    },
  };
}
