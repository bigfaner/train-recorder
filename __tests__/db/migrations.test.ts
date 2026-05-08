/**
 * Tests for the migration manager.
 * Uses a mock SQLiteDatabase to test version tracking and migration logic.
 */

import {
  getCurrentVersion,
  setSchemaVersion,
  applyMigrations,
  isDatabaseInitialized,
  SCHEMA_VERSION_KEY,
  INITIAL_VERSION,
} from '../../src/db/migrations/migration-manager';
import type { Migration } from '../../src/db/migrations/migration-manager';

// ============================================================
// Mock SQLiteDatabase
// ============================================================

interface MockRow {
  [key: string]: string | number | null;
}

function createMockDatabase() {
  const settings: Map<string, { setting_value: string; updated_at: string }> = new Map();
  const tables: Set<string> = new Set();
  let settingsTableCreated = false;

  const db = {
    _settings: settings,
    _tables: tables,

    getFirstSync<T extends MockRow>(sql: string, params?: unknown[]): T | null {
      if (sql.includes('sqlite_master')) {
        if (sql.includes('user_settings')) {
          return settingsTableCreated
            ? ({ count: 1 } as unknown as T)
            : ({ count: 0 } as unknown as T);
        }
        return null;
      }
      if (sql.includes('setting_value') && sql.includes('setting_key')) {
        const key = params?.[0] as string;
        const entry = settings.get(key);
        if (entry) {
          return { setting_value: entry.setting_value } as unknown as T;
        }
        return null;
      }
      if (sql.includes('count(*)') && sql.includes('exercises')) {
        return { count: 0 } as unknown as T;
      }
      return null;
    },

    runSync(sql: string, params?: unknown[]): { lastInsertRowId: number; changes: number } {
      if (sql.includes('INSERT OR REPLACE INTO user_settings')) {
        const bizKey = params?.[0] as number;
        const key = params?.[1] as string;
        const value = params?.[2] as string;
        const updatedAt = params?.[3] as string;
        settings.set(key, { setting_value: value, updated_at: updatedAt });
        settingsTableCreated = true;
        return { lastInsertRowId: 1, changes: 1 };
      }
      if (sql.includes('CREATE TABLE')) {
        const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (match) {
          tables.add(match[1]);
        }
        settingsTableCreated = settingsTableCreated || sql.includes('user_settings');
        return { lastInsertRowId: 1, changes: 1 };
      }
      return { lastInsertRowId: 1, changes: 1 };
    },

    execSync(sql: string): void {
      // Parse CREATE TABLE statements to register tables
      const tableMatches = sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi);
      for (const match of tableMatches) {
        tables.add(match[1]);
        if (match[1] === 'user_settings') {
          settingsTableCreated = true;
        }
      }
    },

    withTransactionSync(task: () => void): void {
      task();
    },

    closeSync(): void {
      // no-op
    },

    eachSync<T>(): IterableIterator<T> {
      return [][Symbol.iterator]();
    },
  };

  return db;
}

type MockDatabase = ReturnType<typeof createMockDatabase>;

// ============================================================
// Tests
// ============================================================

describe('Migration Manager - Constants', () => {
  it('should use setting_key schema_version for version tracking', () => {
    expect(SCHEMA_VERSION_KEY).toBe('schema_version');
  });

  it('should have initial version of 0', () => {
    expect(INITIAL_VERSION).toBe(0);
  });
});

describe('Migration Manager - getCurrentVersion', () => {
  it('should return 0 when no version is set', () => {
    const db = createMockDatabase();
    const version = getCurrentVersion(db as unknown as import('expo-sqlite').SQLiteDatabase);
    expect(version).toBe(0);
  });

  it('should return the stored version number', () => {
    const db = createMockDatabase();
    // Simulate a version being set
    db._settings.set(SCHEMA_VERSION_KEY, { setting_value: '3', updated_at: new Date().toISOString() });
    const version = getCurrentVersion(db as unknown as import('expo-sqlite').SQLiteDatabase);
    expect(version).toBe(3);
  });
});

describe('Migration Manager - setSchemaVersion', () => {
  it('should store the version in user_settings', () => {
    const db = createMockDatabase();
    setSchemaVersion(db as unknown as import('expo-sqlite').SQLiteDatabase, 5, 12345);
    const entry = db._settings.get(SCHEMA_VERSION_KEY);
    expect(entry).toBeDefined();
    expect(entry!.setting_value).toBe('5');
  });
});

describe('Migration Manager - applyMigrations', () => {
  it('should apply no migrations when list is empty', () => {
    const db = createMockDatabase();
    let bizKeyCounter = 100;
    const applied = applyMigrations(
      db as unknown as import('expo-sqlite').SQLiteDatabase,
      [],
      () => bizKeyCounter++,
    );
    expect(applied).toBe(0);
  });

  it('should apply all migrations when starting from version 0', () => {
    const db = createMockDatabase();
    let bizKeyCounter = 100;
    const executionOrder: number[] = [];

    const migrations: Migration[] = [
      { version: 1, description: 'initial', up: () => { executionOrder.push(1); } },
      { version: 2, description: 'add indexes', up: () => { executionOrder.push(2); } },
      { version: 3, description: 'add column', up: () => { executionOrder.push(3); } },
    ];

    const applied = applyMigrations(
      db as unknown as import('expo-sqlite').SQLiteDatabase,
      migrations,
      () => bizKeyCounter++,
    );

    expect(applied).toBe(3);
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('should only apply pending migrations', () => {
    const db = createMockDatabase();
    // Simulate being at version 2
    db._settings.set(SCHEMA_VERSION_KEY, { setting_value: '2', updated_at: new Date().toISOString() });

    let bizKeyCounter = 100;
    const executionOrder: number[] = [];

    const migrations: Migration[] = [
      { version: 1, description: 'initial', up: () => { executionOrder.push(1); } },
      { version: 2, description: 'add indexes', up: () => { executionOrder.push(2); } },
      { version: 3, description: 'add column', up: () => { executionOrder.push(3); } },
      { version: 4, description: 'add table', up: () => { executionOrder.push(4); } },
    ];

    const applied = applyMigrations(
      db as unknown as import('expo-sqlite').SQLiteDatabase,
      migrations,
      () => bizKeyCounter++,
    );

    expect(applied).toBe(2);
    expect(executionOrder).toEqual([3, 4]);
  });

  it('should update schema version after each migration', () => {
    const db = createMockDatabase();
    let bizKeyCounter = 100;

    const migrations: Migration[] = [
      { version: 1, description: 'initial', up: () => {} },
      { version: 2, description: 'add column', up: () => {} },
    ];

    applyMigrations(
      db as unknown as import('expo-sqlite').SQLiteDatabase,
      migrations,
      () => bizKeyCounter++,
    );

    const entry = db._settings.get(SCHEMA_VERSION_KEY);
    expect(entry).toBeDefined();
    expect(entry!.setting_value).toBe('2');
  });

  it('should apply migrations in version order regardless of input order', () => {
    const db = createMockDatabase();
    let bizKeyCounter = 100;
    const executionOrder: number[] = [];

    const migrations: Migration[] = [
      { version: 3, description: 'third', up: () => { executionOrder.push(3); } },
      { version: 1, description: 'first', up: () => { executionOrder.push(1); } },
      { version: 2, description: 'second', up: () => { executionOrder.push(2); } },
    ];

    const applied = applyMigrations(
      db as unknown as import('expo-sqlite').SQLiteDatabase,
      migrations,
      () => bizKeyCounter++,
    );

    expect(applied).toBe(3);
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('should be idempotent - re-running with same migrations does nothing', () => {
    const db = createMockDatabase();
    let bizKeyCounter = 100;

    const migrations: Migration[] = [
      { version: 1, description: 'initial', up: () => {} },
      { version: 2, description: 'second', up: () => {} },
    ];

    // First run
    const applied1 = applyMigrations(
      db as unknown as import('expo-sqlite').SQLiteDatabase,
      migrations,
      () => bizKeyCounter++,
    );
    expect(applied1).toBe(2);

    // Second run - should skip all
    const applied2 = applyMigrations(
      db as unknown as import('expo-sqlite').SQLiteDatabase,
      migrations,
      () => bizKeyCounter++,
    );
    expect(applied2).toBe(0);
  });
});

describe('Migration Manager - isDatabaseInitialized', () => {
  it('should return false when user_settings table does not exist', () => {
    const db = createMockDatabase();
    // user_settings not created yet
    const result = isDatabaseInitialized(db as unknown as import('expo-sqlite').SQLiteDatabase);
    expect(result).toBe(false);
  });
});
