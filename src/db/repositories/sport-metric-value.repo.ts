/**
 * SportMetricValue repository with query by sport_record_biz_key.
 * Composite reference: sport_record_biz_key + sport_metric_biz_key.
 */

import type { DatabaseAdapter } from '../database-adapter';
import type { SportMetricValue } from '../../types';
import { createBaseRepository, type BaseRepo } from './base.repository';

const TABLE_NAME = 'sport_metric_values';
const COLUMNS = [
  'id', 'biz_key', 'sport_record_biz_key', 'sport_metric_biz_key', 'metric_value',
];

export interface SportMetricValueRepo extends BaseRepo<SportMetricValue> {
  createValue(data: Omit<SportMetricValue, 'id'>): SportMetricValue;
  findBySportRecordBizKey(sportRecordBizKey: bigint): SportMetricValue[];
}

export function createSportMetricValueRepo(db: DatabaseAdapter): SportMetricValueRepo {
  const base = createBaseRepository<SportMetricValue>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(', ');

  return {
    ...base,

    createValue(data: Omit<SportMetricValue, 'id'>): SportMetricValue {
      return base.create(data);
    },

    findBySportRecordBizKey(sportRecordBizKey: bigint): SportMetricValue[] {
      return db.getAllSync<SportMetricValue>(
        `SELECT ${columnsStr} FROM sport_metric_values WHERE sport_record_biz_key = ?`,
        [Number(sportRecordBizKey)],
      );
    },
  };
}
