/**
 * UserSettings repository with get/setValue (upsert) pattern.
 * findByKey(key) -> exists ? update : create.
 * setting_key is UNIQUE, enabling upsert by key.
 */

import type { DatabaseAdapter } from '../database-adapter';
import type { UserSettings } from '../../types';
import { createBaseRepository, type BaseRepo } from './base.repository';

const TABLE_NAME = 'user_settings';
const COLUMNS = [
  'id', 'biz_key', 'setting_key', 'setting_value', 'updated_at',
];

export interface UserSettingsRepo extends BaseRepo<UserSettings> {
  getValue(key: string): string | null;
  setValue(key: string, value: string): UserSettings;
}

export function createUserSettingsRepo(db: DatabaseAdapter): UserSettingsRepo {
  const base = createBaseRepository<UserSettings>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(', ');

  let bizKeyCounter = 1n;

  return {
    ...base,

    getValue(key: string): string | null {
      const row = db.getFirstSync<UserSettings>(
        `SELECT ${columnsStr} FROM user_settings WHERE setting_key = ?`,
        [key],
      );
      return row ? row.setting_value : null;
    },

    setValue(key: string, value: string): UserSettings {
      const now = new Date().toISOString();
      const existing = db.getFirstSync<UserSettings>(
        `SELECT ${columnsStr} FROM user_settings WHERE setting_key = ?`,
        [key],
      );

      if (existing) {
        // Update existing
        db.runSync(
          `UPDATE user_settings SET setting_value = ?, updated_at = ? WHERE id = ?`,
          [value, now, existing.id],
        );
        return db.getFirstSync<UserSettings>(
          `SELECT ${columnsStr} FROM user_settings WHERE id = ?`,
          [existing.id],
        )!;
      }

      // Create new
      const bizKey = BigInt(Date.now()) * 1000n + bizKeyCounter;
      bizKeyCounter += 1n;
      db.runSync(
        `INSERT INTO user_settings (biz_key, setting_key, setting_value, updated_at) VALUES (?, ?, ?, ?)`,
        [Number(bizKey), key, value, now],
      );
      return db.getFirstSync<UserSettings>(
        `SELECT ${columnsStr} FROM user_settings WHERE setting_key = ?`,
        [key],
      )!;
    },
  };
}
