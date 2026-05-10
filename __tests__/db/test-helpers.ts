/**
 * Test helper: sql.js adapter implementing DatabaseAdapter interface.
 * Provides in-memory SQLite for integration testing of repositories.
 */

import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import { CREATE_TABLE_STATEMENTS, CREATE_INDEXES } from "../../src/db/schema";

/**
 * Sql.js based adapter for testing.
 */
class SqlJsAdapter implements DatabaseAdapter {
  private db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  getFirstSync<T>(sql: string, params?: unknown[]): T | null {
    const stmt = this.db.prepare(sql);
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
  }

  getAllSync<T>(sql: string, params?: unknown[]): T[] {
    const stmt = this.db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params as (string | number | null | Uint8Array)[]);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }

  runSync(
    sql: string,
    params?: unknown[],
  ): { lastInsertRowId: number; changes: number } {
    this.db.run(sql, params as (string | number | null | Uint8Array)[]);
    const result = this.getFirstSync<{
      last_insert_rowid: number;
      changes: number;
    }>("SELECT last_insert_rowid() as last_insert_rowid, changes() as changes");
    return {
      lastInsertRowId: result?.last_insert_rowid ?? 0,
      changes: result?.changes ?? 0,
    };
  }

  withTransactionSync<T>(fn: () => T): T {
    this.db.run("BEGIN TRANSACTION");
    try {
      const result = fn();
      this.db.run("COMMIT");
      return result;
    } catch (e) {
      this.db.run("ROLLBACK");
      throw e;
    }
  }

  execSync(sql: string): void {
    this.db.exec(sql);
  }
}

/**
 * Create an in-memory test database with schema initialized.
 */
export async function createTestDb(): Promise<DatabaseAdapter> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  const adapter = new SqlJsAdapter(db);

  // Create all tables
  for (const stmt of CREATE_TABLE_STATEMENTS) {
    adapter.execSync(stmt);
  }
  // Create all indexes
  for (const stmt of CREATE_INDEXES) {
    adapter.execSync(stmt);
  }

  return adapter;
}
