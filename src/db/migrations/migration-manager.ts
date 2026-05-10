/**
 * Migration manager for schema version management.
 *
 * Tracks the schema version in user_settings table (setting_key = 'schema_version').
 * Applies migrations in order, skipping already-applied ones.
 * Re-running is idempotent (no errors, no data loss).
 */

import type { SQLiteDatabase } from "expo-sqlite";

export interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => void;
}

export const SCHEMA_VERSION_KEY = "schema_version";
export const INITIAL_VERSION = 0;

/**
 * Get the current schema version from user_settings.
 * Returns INITIAL_VERSION (0) if no version is recorded.
 */
export function getCurrentVersion(db: SQLiteDatabase): number {
  const result = db.getFirstSync<{ setting_value: string }>(
    "SELECT setting_value FROM user_settings WHERE setting_key = ?",
    [SCHEMA_VERSION_KEY],
  );
  if (result === null) {
    return INITIAL_VERSION;
  }
  return parseInt(result.setting_value, 10);
}

/**
 * Set the schema version in user_settings.
 * Uses INSERT OR REPLACE to handle both insert and update.
 */
export function setSchemaVersion(
  db: SQLiteDatabase,
  version: number,
  bizKey: number,
): void {
  const now = new Date().toISOString();
  db.runSync(
    "INSERT OR REPLACE INTO user_settings (biz_key, setting_key, setting_value, updated_at) VALUES (?, ?, ?, ?)",
    [bizKey, SCHEMA_VERSION_KEY, String(version), now],
  );
}

/**
 * Apply pending migrations in order.
 * Only runs migrations with version > currentVersion.
 * Returns the number of migrations applied.
 */
export function applyMigrations(
  db: SQLiteDatabase,
  migrations: Migration[],
  generateBizKey: () => number,
): number {
  const currentVersion = getCurrentVersion(db);
  let applied = 0;

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    db.withTransactionSync(() => {
      migration.up(db);
      setSchemaVersion(db, migration.version, generateBizKey());
    });
    applied++;
  }

  return applied;
}

/**
 * Check if the database has been initialized (has tables).
 * Used to determine if this is a fresh install.
 */
export function isDatabaseInitialized(db: SQLiteDatabase): boolean {
  const result = db.getFirstSync<{ count: number }>(
    "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='user_settings'",
  );
  return result !== null && result.count > 0;
}
