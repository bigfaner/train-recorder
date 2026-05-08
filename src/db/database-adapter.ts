/**
 * Database adapter interface.
 * Abstracts expo-sqlite sync API so repositories can work with
 * both expo-sqlite (production) and sql.js (testing).
 */

export interface DatabaseAdapter {
  getFirstSync<T>(sql: string, params?: unknown[]): T | null;
  getAllSync<T>(sql: string, params?: unknown[]): T[];
  runSync(sql: string, params?: unknown[]): { lastInsertRowId: number; changes: number };
  withTransactionSync<T>(fn: () => T): T;
  execSync(sql: string): void;
}
