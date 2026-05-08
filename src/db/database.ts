/**
 * Database initialization module.
 * Opens the expo-sqlite database connection and initializes schema.
 *
 * Uses expo-sqlite v15 API (openDatabaseSync).
 * All initialization is idempotent (IF NOT EXISTS).
 */

import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import {
  CREATE_TABLE_STATEMENTS,
  CREATE_INDEXES,
  BUILTIN_EXERCISES,
  TABLE_NAMES,
} from './schema';
import { applyMigrations, getCurrentVersion, isDatabaseInitialized, setSchemaVersion, type Migration } from './migrations';
import { createSnowflakeGenerator, type SnowflakeIdGenerator } from '../services/snowflake';

export const DATABASE_NAME = 'train_recorder.db';
export const CURRENT_SCHEMA_VERSION = 1;

/** Singleton database instance */
let _db: SQLiteDatabase | null = null;
let _snowflake: SnowflakeIdGenerator | null = null;

/**
 * Get or create the database connection singleton.
 * On first call, opens the database and initializes schema.
 */
export function getDatabase(): SQLiteDatabase {
  if (_db === null) {
    _db = openDatabaseSync(DATABASE_NAME);
  }
  return _db;
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
 * Initialize the database: create tables, indexes, and seed data.
 * Idempotent - safe to call multiple times.
 *
 * @returns The schema version after initialization.
 */
export function initializeDatabase(): number {
  const db = getDatabase();
  const snowflake = getSnowflakeGenerator();

  // Check if already initialized
  const alreadyInitialized = isDatabaseInitialized(db);

  // Create all tables and indexes (IF NOT EXISTS)
  db.withTransactionSync(() => {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      db.execSync(stmt);
    }
    for (const stmt of CREATE_INDEXES) {
      db.execSync(stmt);
    }
  });

  // Seed built-in exercises on first init
  if (!alreadyInitialized) {
    seedBuiltinExercises(db, snowflake);
  }

  // Run migrations
  const migrations: Migration[] = [];
  const version = applyMigrations(db, migrations, () =>
    Number(snowflake.generate()),
  );

  // If no migrations ran and this is fresh, set version to current
  if (version === 0 && getCurrentVersion(db) === 0) {
    db.withTransactionSync(() => {
      setSchemaVersion(db, CURRENT_SCHEMA_VERSION, Number(snowflake.generate()));
    });
  }

  return getCurrentVersion(db);
}

/**
 * Seed the exercises table with built-in exercises from PRD 5.5.
 * Only runs on first initialization (when exercises table is empty).
 */
function seedBuiltinExercises(db: SQLiteDatabase, snowflake: SnowflakeIdGenerator): void {
  // Check if exercises already exist
  const result = db.getFirstSync<{ count: number }>(
    'SELECT count(*) as count FROM exercises WHERE is_custom = 0',
  );
  if (result !== null && result.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const exercise of BUILTIN_EXERCISES) {
      const bizKey = Number(snowflake.generate());
      db.runSync(
        `INSERT OR IGNORE INTO exercises
          (biz_key, exercise_name, category, increment, default_rest, is_custom, is_deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
        [bizKey, exercise.exercise_name, exercise.category, exercise.increment, exercise.default_rest, now, now],
      );
    }
  });
}

/**
 * Close the database connection.
 * Useful for testing and cleanup.
 */
export function closeDatabase(): void {
  if (_db !== null) {
    _db.closeSync();
    _db = null;
  }
  _snowflake = null;
}

/**
 * Reset the database singleton (for testing purposes).
 * Closes existing connection and resets state.
 */
export function resetDatabaseSingleton(): void {
  closeDatabase();
}

/**
 * Verify all expected tables exist in the database.
 * @returns Array of missing table names, empty if all present.
 */
export function verifyTables(db: SQLiteDatabase): string[] {
  const rows = db.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  const existingSet = new Set(rows.map((r) => r.name));
  return TABLE_NAMES.filter((name) => !existingSet.has(name));
}

/**
 * Get the count of records in a table.
 */
export function getTableCount(db: SQLiteDatabase, tableName: string): number {
  const result = db.getFirstSync<{ count: number }>(
    `SELECT count(*) as count FROM ${tableName}`,
  );
  return result?.count ?? 0;
}
