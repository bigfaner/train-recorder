/**
 * DataImport Service
 *
 * Validates and imports JSON data exported by the DataExport service.
 * Supports conflict resolution strategies: 'skip' (keep existing) or
 * 'overwrite' (replace existing with imported).
 *
 * Import is wrapped in a database transaction and rolled back on error.
 */

import type { DatabaseAdapter } from "../db/database-adapter";
import type {
  DataImportService,
  ImportValidation,
  ImportResult,
} from "../types";

/** Expected entity tables in the import file */
const IMPORT_TABLES = [
  "training_plans",
  "training_days",
  "exercises",
  "plan_exercises",
  "workout_sessions",
  "workout_exercises",
  "workout_sets",
  "feelings",
  "exercise_feelings",
  "personal_records",
  "body_measurements",
  "other_sport_records",
  "sport_types",
  "sport_metrics",
  "sport_metric_values",
  "user_settings",
];

/** Tables that have a biz_key column for conflict detection */
const TABLES_WITH_BIZ_KEY = [
  "training_plans",
  "training_days",
  "exercises",
  "plan_exercises",
  "workout_sessions",
  "workout_exercises",
  "workout_sets",
  "feelings",
  "exercise_feelings",
  "personal_records",
  "body_measurements",
  "other_sport_records",
  "sport_types",
  "sport_metrics",
  "sport_metric_values",
  "user_settings",
];

/**
 * File system adapter for reading import files.
 */
export interface FileReaderAdapter {
  readAsStringAsync(path: string): Promise<string>;
}

/**
 * Validate a parsed JSON object against expected schema.
 */
function validateSchema(data: unknown): ImportValidation {
  const errors: string[] = [];
  const recordCounts: Record<string, number> = {};

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      isValid: false,
      errors: ["Invalid format: expected a JSON object with entity arrays"],
      recordCounts,
    };
  }

  const obj = data as Record<string, unknown>;

  // Check that at least one known table exists
  const knownTables = IMPORT_TABLES.filter((t) => t in obj);
  if (knownTables.length === 0) {
    errors.push(
      "No recognized entity tables found. Expected at least one of: " +
        IMPORT_TABLES.join(", "),
    );
  }

  // Validate each table
  for (const table of knownTables) {
    const value = obj[table];
    if (!Array.isArray(value)) {
      errors.push(`Table '${table}' must be an array`);
      recordCounts[table] = 0;
      continue;
    }

    recordCounts[table] = value.length;

    // Validate each record has required fields
    for (let i = 0; i < value.length; i++) {
      const record = value[i];
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        errors.push(`Table '${table}'[${i}]: record must be an object`);
        continue;
      }

      const rec = record as Record<string, unknown>;

      // Check for biz_key field (present in all entities)
      if (TABLES_WITH_BIZ_KEY.includes(table) && !("biz_key" in rec)) {
        errors.push(`Table '${table}'[${i}]: missing required field 'biz_key'`);
      }
    }
  }

  // Warn about unknown tables
  const unknownTables = Object.keys(obj).filter(
    (k) => !IMPORT_TABLES.includes(k),
  );
  if (unknownTables.length > 0) {
    errors.push(`Unknown tables will be ignored: ${unknownTables.join(", ")}`);
  }

  return {
    isValid: errors.filter((e) => !e.startsWith("Unknown tables")).length === 0,
    errors,
    recordCounts,
  };
}

/**
 * Detect conflicts between imported data and existing database data.
 * Returns a set of biz_keys that already exist in the database.
 */
function detectConflicts(
  db: DatabaseAdapter,
  data: Record<string, unknown[]>,
): Set<string> {
  const conflicts = new Set<string>();

  for (const table of TABLES_WITH_BIZ_KEY) {
    const records = data[table];
    if (!records || records.length === 0) continue;

    // Get existing biz_keys for this table
    const existingRows = db.getAllSync<{ biz_key: number }>(
      `SELECT biz_key FROM ${table}`,
    );
    const existingKeys = new Set(existingRows.map((r) => r.biz_key));

    for (const record of records) {
      const rec = record as Record<string, unknown>;
      if ("biz_key" in rec && existingKeys.has(Number(rec.biz_key))) {
        conflicts.add(`${table}:${rec.biz_key}`);
      }
    }
  }

  return conflicts;
}

/**
 * Insert or replace a record in the database.
 * Handles bigint conversion and column mapping.
 */
function upsertRecord(
  db: DatabaseAdapter,
  table: string,
  record: Record<string, unknown>,
  strategy: "skip" | "overwrite",
  existingBizKeys: Set<string>,
): { imported: boolean; skipped: boolean } {
  const bizKey = record.biz_key;
  const bizKeyStr = `${table}:${bizKey}`;
  const hasConflict = existingBizKeys.has(bizKeyStr);

  if (hasConflict && strategy === "skip") {
    return { imported: false, skipped: true };
  }

  // Get columns from the record (exclude 'id' to avoid PK conflicts)
  const columns = Object.keys(record).filter((k) => k !== "id");
  const values = columns.map((col) => {
    const val = record[col];
    if (typeof val === "bigint") return Number(val);
    return val;
  });

  if (hasConflict && strategy === "overwrite") {
    // Delete existing record first
    db.runSync(`DELETE FROM ${table} WHERE biz_key = ?`, [Number(bizKey)]);
  }

  // Insert the record
  const placeholders = columns.map(() => "?").join(", ");
  db.runSync(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return { imported: true, skipped: false };
}

/**
 * Create a DataImport service instance.
 */
export function createDataImportService(
  db: DatabaseAdapter,
  fileReader: FileReaderAdapter,
): DataImportService {
  return {
    async validateFile(filePath: string): Promise<ImportValidation> {
      const content = await fileReader.readAsStringAsync(filePath);

      let data: unknown;
      try {
        data = JSON.parse(content);
      } catch {
        return {
          isValid: false,
          errors: ["File is not valid JSON"],
          recordCounts: {},
        };
      }

      const validation = validateSchema(data);

      // Also detect conflicts
      if (
        validation.isValid &&
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {
        const conflicts = detectConflicts(
          db,
          data as Record<string, unknown[]>,
        );
        if (conflicts.size > 0) {
          validation.errors.push(
            `Found ${conflicts.size} conflicting records with existing data`,
          );
        }
      }

      return validation;
    },

    async importData(
      filePath: string,
      conflictStrategy: "skip" | "overwrite",
    ): Promise<ImportResult> {
      const content = await fileReader.readAsStringAsync(filePath);

      let data: Record<string, unknown[]>;
      try {
        data = JSON.parse(content) as Record<string, unknown[]>;
      } catch {
        return {
          imported: 0,
          skipped: 0,
          errors: ["File is not valid JSON"],
        };
      }

      // Validate first
      const validation = validateSchema(data);
      if (!validation.isValid) {
        return {
          imported: 0,
          skipped: 0,
          errors: validation.errors,
        };
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Pre-compute existing biz_keys for conflict detection
      const existingBizKeys = detectConflicts(db, data);

      try {
        // Wrap import in a transaction
        db.withTransactionSync(() => {
          // Import tables in order (respecting foreign key constraints)
          for (const table of IMPORT_TABLES) {
            const records = data[table];
            if (!records || !Array.isArray(records)) continue;

            for (let i = 0; i < records.length; i++) {
              const record = records[i] as Record<string, unknown>;
              try {
                const result = upsertRecord(
                  db,
                  table,
                  record,
                  conflictStrategy,
                  existingBizKeys,
                );
                if (result.imported) imported++;
                if (result.skipped) skipped++;
              } catch (err) {
                errors.push(
                  `${table}[${i}]: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            }
          }
        });
      } catch (err) {
        // Transaction rolled back on error
        return {
          imported: 0,
          skipped: 0,
          errors: [
            `Import failed and was rolled back: ${err instanceof Error ? err.message : String(err)}`,
          ],
        };
      }

      return { imported, skipped, errors };
    },

    async previewImport(filePath: string): Promise<ImportValidation> {
      // previewImport is the same as validateFile but with conflict detection
      return this.validateFile(filePath);
    },
  };
}
