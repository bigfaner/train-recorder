/**
 * Exercise repository with soft-delete (is_deleted flag) and findByCategory.
 * findAll filters is_deleted=0 by default.
 */

import type { DatabaseAdapter } from "../database-adapter";
import type { Exercise } from "../../types";
import { createBaseRepository, type BaseRepo } from "./base.repository";

const TABLE_NAME = "exercises";
const COLUMNS = [
  "id",
  "biz_key",
  "exercise_name",
  "category",
  "increment",
  "default_rest",
  "is_custom",
  "is_deleted",
  "created_at",
  "updated_at",
];

export interface ExerciseRepo extends BaseRepo<Exercise> {
  createExercise(data: Omit<Exercise, "id">): Exercise;
  softDelete(id: number): Exercise;
  findAllActive(): Exercise[];
  findByCategory(category: string): Exercise[];
}

export function createExerciseRepo(db: DatabaseAdapter): ExerciseRepo {
  const base = createBaseRepository<Exercise>(db, TABLE_NAME, COLUMNS);

  return {
    ...base,

    createExercise(data: Omit<Exercise, "id">): Exercise {
      return base.create(data);
    },

    softDelete(id: number): Exercise {
      db.runSync("UPDATE exercises SET is_deleted = 1 WHERE id = ?", [id]);
      return base.findById(id)!;
    },

    findAllActive(): Exercise[] {
      return db.getAllSync<Exercise>(
        `SELECT ${COLUMNS.join(", ")} FROM exercises WHERE is_deleted = 0 ORDER BY exercise_name ASC`,
      );
    },

    findByCategory(category: string): Exercise[] {
      return db.getAllSync<Exercise>(
        `SELECT ${COLUMNS.join(", ")} FROM exercises WHERE category = ? AND is_deleted = 0 ORDER BY exercise_name ASC`,
        [category],
      );
    },
  };
}
