/**
 * Web-compatible database initialization module.
 * Uses sql.js (WASM SQLite) instead of expo-sqlite native module.
 *
 * On web, expo-sqlite has no native implementation and throws:
 *   "Cannot find native module 'ExpoSQLite'"
 * This module provides a sql.js-based fallback so the app renders on web.
 */

import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import type { DatabaseAdapter } from "./database-adapter";
import { CREATE_TABLE_STATEMENTS, CREATE_INDEXES, TABLE_NAMES } from "./schema";
import {
  createSnowflakeGenerator,
  type SnowflakeIdGenerator,
} from "../services/snowflake";

export const DATABASE_NAME = "train_recorder.db";
export const CURRENT_SCHEMA_VERSION = 1;

/** Singleton database instance */
let _db: SqlJsDatabase | null = null;
let _adapter: SqlJsAdapter | null = null;
let _snowflake: SnowflakeIdGenerator | null = null;

/**
 * sql.js adapter implementing DatabaseAdapter interface.
 * Same pattern as __tests__/db/test-helpers.ts.
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
 * Initialize sql.js WASM module.
 * Called internally before any database operation.
 */
async function ensureDb(): Promise<SqlJsAdapter> {
  if (_adapter !== null) {
    return _adapter;
  }
  const SQL = await initSqlJs();
  _db = new SQL.Database();
  _adapter = new SqlJsAdapter(_db);
  return _adapter;
}

/**
 * Get or create the database adapter.
 * On web, returns a sql.js-based adapter.
 * Lazily initializes sql.js WASM on first call.
 */
export function getDatabase(): DatabaseAdapter {
  // Synchronous access - must have been initialized already
  if (_adapter === null) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first.",
    );
  }
  return _adapter;
}

/**
 * Get the snowflake generator singleton.
 */
export function getSnowflakeGenerator(): SnowflakeIdGenerator {
  if (_snowflake === null) {
    _snowflake = createSnowflakeGenerator();
  }
  return _snowflake;
}

/**
 * Initialize the database: create tables, indexes.
 * Idempotent - safe to call multiple times.
 *
 * On web, this is async because sql.js WASM loads asynchronously.
 * Returns a promise that resolves to the schema version.
 */
export async function initializeDatabase(): Promise<number> {
  const adapter = await ensureDb();

  // Create all tables and indexes (IF NOT EXISTS)
  adapter.withTransactionSync(() => {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      adapter.execSync(stmt);
    }
    for (const stmt of CREATE_INDEXES) {
      adapter.execSync(stmt);
    }
  });

  return CURRENT_SCHEMA_VERSION;
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (_db !== null) {
    _db.close();
    _db = null;
  }
  _adapter = null;
  _snowflake = null;
}

/**
 * Reset the database singleton (for testing purposes).
 */
export function resetDatabaseSingleton(): void {
  closeDatabase();
}

/**
 * Verify all expected tables exist in the database.
 */
export function verifyTables(db: DatabaseAdapter): string[] {
  const rows = db.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  const existingSet = new Set(rows.map((r) => r.name));
  return TABLE_NAMES.filter((name: string) => !existingSet.has(name));
}

/**
 * Get the count of records in a table.
 */
export function getTableCount(db: DatabaseAdapter, tableName: string): number {
  const result = db.getFirstSync<{ count: number }>(
    `SELECT count(*) as count FROM ${tableName}`,
  );
  return result?.count ?? 0;
}
