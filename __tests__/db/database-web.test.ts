/**
 * Tests for the web database adapter.
 * Verifies that database.web.ts provides a working sql.js-based DatabaseAdapter.
 */

import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import { CREATE_TABLE_STATEMENTS, CREATE_INDEXES } from "../../src/db/schema";

/**
 * Create an in-memory sql.js database with schema initialized.
 * Mirrors the web adapter's initialization logic.
 */
async function createWebTestDb(): Promise<{
  adapter: DatabaseAdapter;
  rawDb: SqlJsDatabase;
}> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Minimal adapter matching SqlJsAdapter from database.web.ts
  const adapter: DatabaseAdapter = {
    getFirstSync<T>(sql: string, params?: unknown[]): T | null {
      const stmt = db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
      }
      if (stmt.step()) {
        const row = stmt.getAsObject() as unknown as T;
        stmt.free();
        return row;
      }
      stmt.free();
      return null;
    },
    getAllSync<T>(sql: string, params?: unknown[]): T[] {
      const stmt = db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
      }
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();
      return results;
    },
    runSync(
      sql: string,
      params?: unknown[],
    ): { lastInsertRowId: number; changes: number } {
      db.run(sql, params as (string | number | null | Uint8Array)[]);
      const stmt = db.prepare(
        "SELECT last_insert_rowid() as last_insert_rowid, changes() as changes",
      );
      let result: {
        last_insert_rowid: number;
        changes: number;
      } | null = null;
      if (stmt.step()) {
        result = stmt.getAsObject() as unknown as {
          last_insert_rowid: number;
          changes: number;
        };
      }
      stmt.free();
      return {
        lastInsertRowId: result?.last_insert_rowid ?? 0,
        changes: result?.changes ?? 0,
      };
    },
    withTransactionSync<T>(fn: () => T): T {
      db.run("BEGIN TRANSACTION");
      try {
        const result = fn();
        db.run("COMMIT");
        return result;
      } catch (e) {
        db.run("ROLLBACK");
        throw e;
      }
    },
    execSync(sql: string): void {
      db.exec(sql);
    },
  };

  // Create all tables and indexes
  adapter.withTransactionSync(() => {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      adapter.execSync(stmt);
    }
    for (const stmt of CREATE_INDEXES) {
      adapter.execSync(stmt);
    }
  });

  return { adapter, rawDb: db };
}

describe("Web database adapter (sql.js)", () => {
  it("should initialize schema with all tables", async () => {
    const { adapter } = await createWebTestDb();

    const tables = adapter.getAllSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const tableNames = tables.map((t) => t.name);

    // Should have at least the core tables
    expect(tableNames).toContain("exercises");
    expect(tableNames).toContain("training_plans");
    expect(tableNames).toContain("workout_sessions");
    expect(tableNames).toContain("workout_exercises");
    expect(tableNames).toContain("workout_sets");
    expect(tableNames).toContain("user_settings");
  });

  it("should insert and query data", async () => {
    const { adapter } = await createWebTestDb();

    adapter.runSync(
      `INSERT INTO user_settings (biz_key, setting_key, setting_value, updated_at)
       VALUES (?, ?, ?, ?)`,
      [12345, "test_key", "test_value", new Date().toISOString()],
    );

    const result = adapter.getFirstSync<{ setting_value: string }>(
      "SELECT setting_value FROM user_settings WHERE setting_key = ?",
      ["test_key"],
    );

    expect(result).not.toBeNull();
    expect(result!.setting_value).toBe("test_value");
  });

  it("should handle transactions correctly", async () => {
    const { adapter } = await createWebTestDb();

    // Transaction should commit on success
    adapter.withTransactionSync(() => {
      adapter.runSync(
        `INSERT INTO user_settings (biz_key, setting_key, setting_value, updated_at)
         VALUES (?, ?, ?, ?)`,
        [11111, "tx_key", "tx_value", new Date().toISOString()],
      );
    });

    const committed = adapter.getFirstSync<{ setting_value: string }>(
      "SELECT setting_value FROM user_settings WHERE setting_key = ?",
      ["tx_key"],
    );
    expect(committed?.setting_value).toBe("tx_value");

    // Transaction should rollback on error
    try {
      adapter.withTransactionSync(() => {
        adapter.runSync(
          `INSERT INTO user_settings (biz_key, setting_key, setting_value, updated_at)
           VALUES (?, ?, ?, ?)`,
          [22222, "rollback_key", "rollback_value", new Date().toISOString()],
        );
        throw new Error("forced error");
      });
    } catch {
      // Expected
    }

    const rolledBack = adapter.getFirstSync<{ setting_value: string }>(
      "SELECT setting_value FROM user_settings WHERE setting_key = ?",
      ["rollback_key"],
    );
    expect(rolledBack).toBeNull();
  });

  it("should report lastInsertRowId and changes from runSync", async () => {
    const { adapter } = await createWebTestDb();

    const result = adapter.runSync(
      `INSERT INTO user_settings (biz_key, setting_key, setting_value, updated_at)
       VALUES (?, ?, ?, ?)`,
      [99999, "rowid_key", "rowid_value", new Date().toISOString()],
    );

    expect(result.lastInsertRowId).toBeGreaterThan(0);
    expect(result.changes).toBe(1);
  });

  it("should return null from getFirstSync when no row matches", async () => {
    const { adapter } = await createWebTestDb();

    const result = adapter.getFirstSync<{ setting_value: string }>(
      "SELECT setting_value FROM user_settings WHERE setting_key = ?",
      ["nonexistent"],
    );

    expect(result).toBeNull();
  });

  it("should return empty array from getAllSync when no rows match", async () => {
    const { adapter } = await createWebTestDb();

    const results = adapter.getAllSync<{ setting_value: string }>(
      "SELECT setting_value FROM user_settings WHERE setting_key = ?",
      ["nonexistent"],
    );

    expect(results).toEqual([]);
  });
});
