/**
 * SportType repository with findAllIncludingCustom.
 * Returns all sport types regardless of is_custom flag.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { SportType } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "sport_types";
const COLUMNS = [
  "id",
  "biz_key",
  "sport_name",
  "icon",
  "is_custom",
  "created_at",
];

export interface SportTypeRepo extends BaseRepo<SportType> {
  createSportType(data: Omit<SportType, "id">): SportType;
  findAllIncludingCustom(): SportType[];
}

export function createSportTypeRepo(db: DatabaseAdapter): SportTypeRepo {
  const base = createBaseRepository<SportType>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(", ");

  return {
    ...base,

    createSportType(data: Omit<SportType, "id">): SportType {
      return base.create(data);
    },

    findAllIncludingCustom(): SportType[] {
      return db.getAllSync<SportType>(
        `SELECT ${columnsStr} FROM sport_types ORDER BY is_custom ASC, sport_name ASC`,
      );
    },
  };
}
