/**
 * DataExport Service
 *
 * Exports all training data to a JSON file filtered by date range.
 * Uses expo-file-system for file writing and expo-sharing for share sheet.
 *
 * Export format: single JSON with entity arrays.
 * Date range filters on session_date / record_date fields.
 */

import type { DatabaseAdapter } from "../db/database-adapter";
import type { DataExportService, ExportRange, ExportResult } from "../types";

/** Entity tables to export, in order. Date column used for range filtering. */
const EXPORT_TABLES: Array<{ table: string; dateColumn: string | null }> = [
  { table: "training_plans", dateColumn: null },
  { table: "training_days", dateColumn: null },
  { table: "exercises", dateColumn: null },
  { table: "plan_exercises", dateColumn: null },
  { table: "workout_sessions", dateColumn: "session_date" },
  { table: "workout_exercises", dateColumn: null },
  { table: "workout_sets", dateColumn: null },
  { table: "feelings", dateColumn: null },
  { table: "exercise_feelings", dateColumn: null },
  { table: "personal_records", dateColumn: "pr_date" },
  { table: "body_measurements", dateColumn: "record_date" },
  { table: "other_sport_records", dateColumn: "record_date" },
  { table: "sport_types", dateColumn: null },
  { table: "sport_metrics", dateColumn: null },
  { table: "sport_metric_values", dateColumn: null },
  { table: "user_settings", dateColumn: null },
];

/**
 * Compute the date boundary for a given export range.
 * Returns null for "all" (no filter), or a YYYY-MM-DD string for the cutoff.
 */
function computeDateCutoff(range: ExportRange): string | null {
  if (range === "all") return null;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "3m") {
    cutoff.setMonth(cutoff.getMonth() - 3);
  } else if (range === "6m") {
    cutoff.setMonth(cutoff.getMonth() - 6);
  }
  return cutoff.toISOString().slice(0, 10);
}

/**
 * Query all data from the database, applying date range filters.
 * Returns a record mapping table names to arrays of row objects.
 */
function queryAllData(
  db: DatabaseAdapter,
  cutoffDate: string | null,
): Record<string, unknown[]> {
  const data: Record<string, unknown[]> = {};

  for (const { table, dateColumn } of EXPORT_TABLES) {
    let sql = `SELECT * FROM ${table}`;
    const params: unknown[] = [];

    if (cutoffDate && dateColumn) {
      sql += ` WHERE ${dateColumn} >= ?`;
      params.push(cutoffDate);
    }

    data[table] = db.getAllSync(sql, params);
  }

  return data;
}

/**
 * File system interface for testability.
 * In production, this wraps expo-file-system.
 */
export interface FileSystemAdapter {
  writeAsStringAsync(path: string, content: string): Promise<void>;
  getDocumentDirectory(): string | null;
  getInfoAsync(path: string): Promise<{ exists: boolean; size?: number }>;
}

/**
 * Share adapter for testability.
 * In production, this wraps expo-sharing or React Native Share API.
 */
export interface ShareAdapter {
  share(path: string): Promise<void>;
}

/**
 * Create a DataExport service instance.
 */
export function createDataExportService(
  db: DatabaseAdapter,
  fs: FileSystemAdapter,
  shareAdapter: ShareAdapter,
): DataExportService {
  return {
    async exportData(range: ExportRange): Promise<ExportResult> {
      const cutoffDate = computeDateCutoff(range);
      const data = queryAllData(db, cutoffDate);

      // Generate filename with current date
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const fileName = `train-recorder-export-${today}.json`;

      // Determine file path
      const docDir = fs.getDocumentDirectory();
      const filePath = docDir ? `${docDir}/${fileName}` : `/${fileName}`;

      // Count total records
      let recordCount = 0;
      for (const records of Object.values(data)) {
        recordCount += records.length;
      }

      // Serialize and write
      const json = JSON.stringify(
        data,
        (_key, value) => {
          // Convert bigint to number for JSON serialization
          if (typeof value === "bigint") {
            return Number(value);
          }
          return value;
        },
        2,
      );

      await fs.writeAsStringAsync(filePath, json);

      // Estimate file size
      const sizeBytes = new Blob([json]).size;
      const fileSizeKB = Math.round((sizeBytes / 1024) * 100) / 100;

      return {
        filePath,
        fileName,
        recordCount,
        fileSizeKB,
      };
    },

    async getEstimatedSize(range: ExportRange): Promise<number> {
      const cutoffDate = computeDateCutoff(range);
      const data = queryAllData(db, cutoffDate);

      // Estimate JSON size: rough calculation based on data
      const json = JSON.stringify(data, (_key, value) => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        return value;
      });

      const sizeBytes = new Blob([json]).size;
      return Math.round((sizeBytes / 1024) * 100) / 100;
    },

    async shareFile(filePath: string): Promise<void> {
      await shareAdapter.share(filePath);
    },
  };
}
