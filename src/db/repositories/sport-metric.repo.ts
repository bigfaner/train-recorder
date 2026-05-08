/**
 * SportMetric repository with query by sport_type_biz_key.
 * Metrics are ordered by order_index.
 */

import type { DatabaseAdapter } from '../database-adapter';
import type { SportMetric } from '../../types';
import { createBaseRepository, type BaseRepo } from './base.repository';

const TABLE_NAME = 'sport_metrics';
const COLUMNS = [
  'id', 'biz_key', 'sport_type_biz_key', 'metric_name',
  'metric_unit', 'is_custom', 'order_index',
];

export interface SportMetricRepo extends BaseRepo<SportMetric> {
  createMetric(data: Omit<SportMetric, 'id'>): SportMetric;
  findBySportTypeBizKey(sportTypeBizKey: bigint): SportMetric[];
}

export function createSportMetricRepo(db: DatabaseAdapter): SportMetricRepo {
  const base = createBaseRepository<SportMetric>(db, TABLE_NAME, COLUMNS);
  const columnsStr = COLUMNS.join(', ');

  return {
    ...base,

    createMetric(data: Omit<SportMetric, 'id'>): SportMetric {
      return base.create(data);
    },

    findBySportTypeBizKey(sportTypeBizKey: bigint): SportMetric[] {
      return db.getAllSync<SportMetric>(
        `SELECT ${columnsStr} FROM sport_metrics WHERE sport_type_biz_key = ? ORDER BY order_index ASC`,
        [Number(sportTypeBizKey)],
      );
    },
  };
}
