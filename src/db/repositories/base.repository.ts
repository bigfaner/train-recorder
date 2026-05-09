/**
 * Base repository implementation providing generic CRUD operations.
 * Uses DatabaseAdapter for database access, enabling both
 * expo-sqlite (production) and sql.js (testing) backends.
 *
 * Conventions:
 *   - `id` is auto-increment, excluded from INSERT
 *   - `bigint` values (biz_key, *_biz_key) are stored as INTEGER in SQLite,
 *     converted to/from number at the boundary
 */

import type { DatabaseAdapter } from "../database-adapter";

/**
 * Convert bigint values to number for SQLite storage.
 * SQLite stores all integers as 64-bit INTEGER, and both
 * expo-sqlite and sql.js work with JS numbers for INTEGER columns.
 */
function toDbValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
}

/**
 * Create a base repository for a given table and columns.
 */
export function createBaseRepository<T extends { id: number; biz_key: bigint }>(
  db: DatabaseAdapter,
  tableName: string,
  allColumns: string[],
) {
  // Columns for SELECT (includes id)
  const selectColumnsStr = allColumns.join(", ");
  // Columns for INSERT (excludes id, which is auto-increment)
  const insertColumns = allColumns.filter((c) => c !== "id");
  const insertColumnsStr = insertColumns.join(", ");
  const insertPlaceholders = insertColumns.map(() => "?").join(", ");

  return {
    findById(id: number): T | null {
      return db.getFirstSync<T>(
        `SELECT ${selectColumnsStr} FROM ${tableName} WHERE id = ?`,
        [id],
      );
    },

    findByBizKey(bizKey: bigint): T | null {
      return db.getFirstSync<T>(
        `SELECT ${selectColumnsStr} FROM ${tableName} WHERE biz_key = ?`,
        [Number(bizKey)],
      );
    },

    findAll(filter?: Partial<T>, orderBy?: string, limit?: number): T[] {
      let sql = `SELECT ${selectColumnsStr} FROM ${tableName}`;
      const params: unknown[] = [];

      if (filter && Object.keys(filter).length > 0) {
        const clauses: string[] = [];
        for (const [key, value] of Object.entries(filter)) {
          if (value !== undefined) {
            clauses.push(`${key} = ?`);
            params.push(toDbValue(value));
          }
        }
        if (clauses.length > 0) {
          sql += " WHERE " + clauses.join(" AND ");
        }
      }

      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }
      if (limit !== undefined) {
        sql += ` LIMIT ${limit}`;
      }

      return db.getAllSync<T>(sql, params);
    },

    create(data: Omit<T, "id"> & { id?: never }): T {
      const values = insertColumns.map((col) =>
        toDbValue((data as Record<string, unknown>)[col]),
      );
      const result = db.runSync(
        `INSERT INTO ${tableName} (${insertColumnsStr}) VALUES (${insertPlaceholders})`,
        values,
      );
      return db.getFirstSync<T>(
        `SELECT ${selectColumnsStr} FROM ${tableName} WHERE id = ?`,
        [result.lastInsertRowId],
      )!;
    },

    update(id: number, data: Partial<T>): T {
      const entries = Object.entries(data as Record<string, unknown>).filter(
        ([, v]) => v !== undefined,
      );
      if (entries.length === 0) {
        return db.getFirstSync<T>(
          `SELECT ${selectColumnsStr} FROM ${tableName} WHERE id = ?`,
          [id],
        )!;
      }

      const setClauses = entries.map(([key]) => `${key} = ?`);
      const values = entries.map(([, value]) => toDbValue(value));
      values.push(id);

      db.runSync(
        `UPDATE ${tableName} SET ${setClauses.join(", ")} WHERE id = ?`,
        values,
      );
      return db.getFirstSync<T>(
        `SELECT ${selectColumnsStr} FROM ${tableName} WHERE id = ?`,
        [id],
      )!;
    },

    deleteById(id: number): void {
      db.runSync(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    },
  };
}

export type BaseRepo<T extends { id: number; biz_key: bigint }> = ReturnType<
  typeof createBaseRepository<T>
>;
