/**
 * Integration tests for auxiliary repositories:
 * Feeling, ExerciseFeeling, PersonalRecord, BodyMeasurement,
 * OtherSportRecord, SportType, SportMetric, SportMetricValue, UserSettings.
 *
 * Uses sql.js in-memory SQLite to test CRUD operations and domain-specific queries.
 */

import { createTestDb } from '../test-helpers';
import type { DatabaseAdapter } from '../../../src/db/database-adapter';
import { createFeelingRepo, type FeelingRepo } from '../../../src/db/repositories/feeling.repo';
import { createExerciseFeelingRepo, type ExerciseFeelingRepo } from '../../../src/db/repositories/exercise-feeling.repo';
import { createPersonalRecordRepo, type PersonalRecordRepo } from '../../../src/db/repositories/personal-record.repo';
import { createBodyMeasurementRepo, type BodyMeasurementRepo } from '../../../src/db/repositories/body-measurement.repo';
import { createOtherSportRepo, type OtherSportRepo } from '../../../src/db/repositories/other-sport.repo';
import { createSportTypeRepo, type SportTypeRepo } from '../../../src/db/repositories/sport-type.repo';
import { createSportMetricRepo, type SportMetricRepo } from '../../../src/db/repositories/sport-metric.repo';
import { createSportMetricValueRepo, type SportMetricValueRepo } from '../../../src/db/repositories/sport-metric-value.repo';
import { createUserSettingsRepo, type UserSettingsRepo } from '../../../src/db/repositories/user-settings.repo';
import type {
  Feeling, ExerciseFeeling, PersonalRecord, BodyMeasurement,
  OtherSportRecord, SportType, SportMetric, SportMetricValue, UserSettings,
} from '../../../src/types';

let db: DatabaseAdapter;
let feelingRepo: FeelingRepo;
let exerciseFeelingRepo: ExerciseFeelingRepo;
let personalRecordRepo: PersonalRecordRepo;
let bodyMeasurementRepo: BodyMeasurementRepo;
let otherSportRepo: OtherSportRepo;
let sportTypeRepo: SportTypeRepo;
let sportMetricRepo: SportMetricRepo;
let sportMetricValueRepo: SportMetricValueRepo;
let userSettingsRepo: UserSettingsRepo;

beforeEach(async () => {
  db = await createTestDb();
  feelingRepo = createFeelingRepo(db);
  exerciseFeelingRepo = createExerciseFeelingRepo(db);
  personalRecordRepo = createPersonalRecordRepo(db);
  bodyMeasurementRepo = createBodyMeasurementRepo(db);
  otherSportRepo = createOtherSportRepo(db);
  sportTypeRepo = createSportTypeRepo(db);
  sportMetricRepo = createSportMetricRepo(db);
  sportMetricValueRepo = createSportMetricValueRepo(db);
  userSettingsRepo = createUserSettingsRepo(db);
});

// ============================================================
// Feeling Repository
// ============================================================

describe('FeelingRepository', () => {
  let feelingBizKeyCounter = 1000n;
  function createTestFeeling(overrides: Partial<Omit<Feeling, 'id'>> = {}): Feeling {
    const now = new Date().toISOString();
    feelingBizKeyCounter += 1n;
    return feelingRepo.create({
      biz_key: feelingBizKeyCounter,
      workout_session_biz_key: 100n,
      fatigue_level: 5,
      satisfaction: 5,
      overall_note: null,
      created_at: now,
      updated_at: now,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create a feeling', () => {
      const feeling = createTestFeeling({ biz_key: 1001n });
      expect(feeling.id).toBeGreaterThan(0);
      expect(feeling.fatigue_level).toBe(5);
      expect(feeling.satisfaction).toBe(5);
    });

    it('should find by id', () => {
      const feeling = createTestFeeling({ biz_key: 1002n });
      const found = feelingRepo.findById(feeling.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(1002);
    });

    it('should find by biz_key', () => {
      const feeling = createTestFeeling({ biz_key: 1003n });
      const found = feelingRepo.findByBizKey(1003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(feeling.id);
    });

    it('should update a feeling', () => {
      const feeling = createTestFeeling({ biz_key: 1004n });
      const updated = feelingRepo.update(feeling.id, {
        fatigue_level: 8,
        satisfaction: 3,
        overall_note: 'Tough session',
      });
      expect(updated.fatigue_level).toBe(8);
      expect(updated.satisfaction).toBe(3);
      expect(updated.overall_note).toBe('Tough session');
    });

    it('should delete a feeling', () => {
      const feeling = createTestFeeling({ biz_key: 1005n });
      feelingRepo.deleteById(feeling.id);
      expect(feelingRepo.findById(feeling.id)).toBeNull();
    });

    it('should return null for non-existent id', () => {
      expect(feelingRepo.findById(99999)).toBeNull();
    });
  });

  describe('findByWorkoutSessionBizKey', () => {
    it('should find feeling by workout_session_biz_key', () => {
      createTestFeeling({ biz_key: 2001n, workout_session_biz_key: 5001n });
      createTestFeeling({ biz_key: 2002n, workout_session_biz_key: 5002n });

      const result = feelingRepo.findByWorkoutSessionBizKey(5001n);
      expect(result).not.toBeNull();
      expect(Number(result!.biz_key)).toBe(2001);
    });

    it('should return null when no feeling for session', () => {
      expect(feelingRepo.findByWorkoutSessionBizKey(9999n)).toBeNull();
    });
  });

  describe('fatigue_level and satisfaction ranges', () => {
    it('should store fatigue_level 1-10', () => {
      const feeling = createTestFeeling({ biz_key: 3001n, fatigue_level: 10, satisfaction: 1 });
      expect(feeling.fatigue_level).toBe(10);
      expect(feeling.satisfaction).toBe(1);
    });
  });
});

// ============================================================
// ExerciseFeeling Repository
// ============================================================

describe('ExerciseFeelingRepository', () => {
  let efBizKeyCounter = 4000n;
  function createTestExerciseFeeling(overrides: Partial<Omit<ExerciseFeeling, 'id'>> = {}): ExerciseFeeling {
    const now = new Date().toISOString();
    efBizKeyCounter += 1n;
    return exerciseFeelingRepo.create({
      biz_key: efBizKeyCounter,
      feeling_biz_key: 100n,
      exercise_biz_key: 200n,
      workout_exercise_biz_key: 300n,
      feeling_note: null,
      created_at: now,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create an exercise feeling', () => {
      const ef = createTestExerciseFeeling({ biz_key: 4001n });
      expect(ef.id).toBeGreaterThan(0);
      expect(ef.feeling_note).toBeNull();
    });

    it('should find by id', () => {
      const ef = createTestExerciseFeeling({ biz_key: 4002n });
      const found = exerciseFeelingRepo.findById(ef.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(4002);
    });

    it('should find by biz_key', () => {
      const ef = createTestExerciseFeeling({ biz_key: 4003n });
      const found = exerciseFeelingRepo.findByBizKey(4003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(ef.id);
    });

    it('should update an exercise feeling', () => {
      const ef = createTestExerciseFeeling({ biz_key: 4004n });
      const updated = exerciseFeelingRepo.update(ef.id, {
        feeling_note: 'Felt strong today',
      });
      expect(updated.feeling_note).toBe('Felt strong today');
    });

    it('should delete an exercise feeling', () => {
      const ef = createTestExerciseFeeling({ biz_key: 4005n });
      exerciseFeelingRepo.deleteById(ef.id);
      expect(exerciseFeelingRepo.findById(ef.id)).toBeNull();
    });
  });

  describe('findByFeelingBizKey', () => {
    it('should find exercise feelings by feeling_biz_key', () => {
      createTestExerciseFeeling({ biz_key: 4010n, feeling_biz_key: 5001n });
      createTestExerciseFeeling({ biz_key: 4011n, feeling_biz_key: 5001n });
      createTestExerciseFeeling({ biz_key: 4012n, feeling_biz_key: 5002n });

      const results = exerciseFeelingRepo.findByFeelingBizKey(5001n);
      expect(results.length).toBe(2);
    });

    it('should return empty array for feeling with no exercise feelings', () => {
      const results = exerciseFeelingRepo.findByFeelingBizKey(9999n);
      expect(results).toEqual([]);
    });
  });

  describe('findByWorkoutExerciseBizKey', () => {
    it('should find exercise feeling by workout_exercise_biz_key', () => {
      createTestExerciseFeeling({ biz_key: 4020n, workout_exercise_biz_key: 6001n });
      createTestExerciseFeeling({ biz_key: 4021n, workout_exercise_biz_key: 6002n });

      const result = exerciseFeelingRepo.findByWorkoutExerciseBizKey(6001n);
      expect(result).not.toBeNull();
      expect(Number(result!.biz_key)).toBe(4020);
    });

    it('should return null when no exercise feeling for workout exercise', () => {
      expect(exerciseFeelingRepo.findByWorkoutExerciseBizKey(9999n)).toBeNull();
    });
  });
});

// ============================================================
// PersonalRecord Repository
// ============================================================

describe('PersonalRecordRepository', () => {
  let prBizKeyCounter = 5000n;
  function createTestPR(overrides: Partial<Omit<PersonalRecord, 'id'>> = {}): PersonalRecord {
    const now = new Date().toISOString();
    prBizKeyCounter += 1n;
    return personalRecordRepo.create({
      biz_key: prBizKeyCounter,
      exercise_biz_key: 100n,
      pr_type: 'weight',
      pr_value: 100.0,
      pr_date: '2026-05-01',
      workout_set_biz_key: null,
      created_at: now,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create a personal record', () => {
      const pr = createTestPR({ biz_key: 5001n });
      expect(pr.id).toBeGreaterThan(0);
      expect(pr.pr_type).toBe('weight');
      expect(pr.pr_value).toBe(100.0);
    });

    it('should find by id', () => {
      const pr = createTestPR({ biz_key: 5002n });
      const found = personalRecordRepo.findById(pr.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(5002);
    });

    it('should find by biz_key', () => {
      const pr = createTestPR({ biz_key: 5003n });
      const found = personalRecordRepo.findByBizKey(5003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(pr.id);
    });

    it('should update a personal record', () => {
      const pr = createTestPR({ biz_key: 5004n });
      const updated = personalRecordRepo.update(pr.id, { pr_value: 110.0 });
      expect(updated.pr_value).toBe(110.0);
    });

    it('should delete a personal record', () => {
      const pr = createTestPR({ biz_key: 5005n });
      personalRecordRepo.deleteById(pr.id);
      expect(personalRecordRepo.findById(pr.id)).toBeNull();
    });
  });

  describe('findByExerciseBizKey', () => {
    it('should find PRs by exercise_biz_key ordered by pr_date desc', () => {
      createTestPR({ biz_key: 5010n, exercise_biz_key: 7001n, pr_date: '2026-04-01', pr_value: 90 });
      createTestPR({ biz_key: 5011n, exercise_biz_key: 7001n, pr_date: '2026-05-01', pr_value: 100 });
      createTestPR({ biz_key: 5012n, exercise_biz_key: 7002n, pr_date: '2026-05-01', pr_value: 80 });

      const results = personalRecordRepo.findByExerciseBizKey(7001n);
      expect(results.length).toBe(2);
      expect(results[0].pr_date).toBe('2026-05-01');
      expect(results[1].pr_date).toBe('2026-04-01');
    });

    it('should return empty array for exercise with no PRs', () => {
      expect(personalRecordRepo.findByExerciseBizKey(9999n)).toEqual([]);
    });
  });

  describe('findByType', () => {
    it('should find PRs by type (weight)', () => {
      createTestPR({ biz_key: 5020n, exercise_biz_key: 8001n, pr_type: 'weight', pr_value: 100 });
      createTestPR({ biz_key: 5021n, exercise_biz_key: 8001n, pr_type: 'volume', pr_value: 500 });
      createTestPR({ biz_key: 5022n, exercise_biz_key: 8001n, pr_type: 'weight', pr_value: 105 });

      const weightPRs = personalRecordRepo.findByType(8001n, 'weight');
      expect(weightPRs.length).toBe(2);
    });

    it('should find PRs by type (volume)', () => {
      createTestPR({ biz_key: 5030n, exercise_biz_key: 8002n, pr_type: 'volume', pr_value: 500 });

      const volumePRs = personalRecordRepo.findByType(8002n, 'volume');
      expect(volumePRs.length).toBe(1);
      expect(volumePRs[0].pr_type).toBe('volume');
    });

    it('should return empty array for type with no PRs', () => {
      expect(personalRecordRepo.findByType(9999n, 'weight')).toEqual([]);
    });
  });

  describe('findMaxByExercise', () => {
    it('should return highest pr_value for weight type', () => {
      createTestPR({ biz_key: 5040n, exercise_biz_key: 9001n, pr_type: 'weight', pr_value: 100 });
      createTestPR({ biz_key: 5041n, exercise_biz_key: 9001n, pr_type: 'weight', pr_value: 120 });
      createTestPR({ biz_key: 5042n, exercise_biz_key: 9001n, pr_type: 'weight', pr_value: 110 });

      const maxPR = personalRecordRepo.findMaxByExercise(9001n, 'weight');
      expect(maxPR).not.toBeNull();
      expect(maxPR!.pr_value).toBe(120);
    });

    it('should return highest pr_value for volume type', () => {
      createTestPR({ biz_key: 5050n, exercise_biz_key: 9002n, pr_type: 'volume', pr_value: 500 });
      createTestPR({ biz_key: 5051n, exercise_biz_key: 9002n, pr_type: 'volume', pr_value: 600 });

      const maxPR = personalRecordRepo.findMaxByExercise(9002n, 'volume');
      expect(maxPR).not.toBeNull();
      expect(maxPR!.pr_value).toBe(600);
    });

    it('should return null when no PRs exist for exercise', () => {
      expect(personalRecordRepo.findMaxByExercise(9999n, 'weight')).toBeNull();
    });
  });
});

// ============================================================
// BodyMeasurement Repository
// ============================================================

describe('BodyMeasurementRepository', () => {
  let bmBizKeyCounter = 6000n;
  function createTestBodyMeasurement(overrides: Partial<Omit<BodyMeasurement, 'id'>> = {}): BodyMeasurement {
    const now = new Date().toISOString();
    bmBizKeyCounter += 1n;
    return bodyMeasurementRepo.create({
      biz_key: bmBizKeyCounter,
      record_date: '2026-05-09',
      body_weight: 75.0,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
      created_at: now,
      updated_at: now,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create a body measurement', () => {
      const bm = createTestBodyMeasurement({ biz_key: 6001n });
      expect(bm.id).toBeGreaterThan(0);
      expect(bm.body_weight).toBe(75.0);
    });

    it('should find by id', () => {
      const bm = createTestBodyMeasurement({ biz_key: 6002n });
      const found = bodyMeasurementRepo.findById(bm.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(6002);
    });

    it('should find by biz_key', () => {
      const bm = createTestBodyMeasurement({ biz_key: 6003n });
      const found = bodyMeasurementRepo.findByBizKey(6003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(bm.id);
    });

    it('should update a body measurement', () => {
      const bm = createTestBodyMeasurement({ biz_key: 6004n });
      const updated = bodyMeasurementRepo.update(bm.id, {
        body_weight: 76.5,
        chest_circumference: 100.0,
      });
      expect(updated.body_weight).toBe(76.5);
      expect(updated.chest_circumference).toBe(100.0);
    });

    it('should delete a body measurement', () => {
      const bm = createTestBodyMeasurement({ biz_key: 6005n });
      bodyMeasurementRepo.deleteById(bm.id);
      expect(bodyMeasurementRepo.findById(bm.id)).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    it('should find measurements within date range inclusive', () => {
      createTestBodyMeasurement({ biz_key: 6010n, record_date: '2026-05-01' });
      createTestBodyMeasurement({ biz_key: 6011n, record_date: '2026-05-05' });
      createTestBodyMeasurement({ biz_key: 6012n, record_date: '2026-05-10' });
      createTestBodyMeasurement({ biz_key: 6013n, record_date: '2026-05-15' });

      const results = bodyMeasurementRepo.findByDateRange('2026-05-05', '2026-05-10');
      expect(results.length).toBe(2);
    });

    it('should return measurements ordered by record_date ASC', () => {
      createTestBodyMeasurement({ biz_key: 6020n, record_date: '2026-05-10' });
      createTestBodyMeasurement({ biz_key: 6021n, record_date: '2026-05-01' });

      const results = bodyMeasurementRepo.findByDateRange('2026-04-01', '2026-06-01');
      expect(results[0].record_date).toBe('2026-05-01');
      expect(results[1].record_date).toBe('2026-05-10');
    });

    it('should return empty array for range with no measurements', () => {
      expect(bodyMeasurementRepo.findByDateRange('2020-01-01', '2020-12-31')).toEqual([]);
    });
  });

  describe('findLatest', () => {
    it('should return the most recent body measurement', () => {
      createTestBodyMeasurement({ biz_key: 6030n, record_date: '2026-05-01', body_weight: 75.0 });
      createTestBodyMeasurement({ biz_key: 6031n, record_date: '2026-05-10', body_weight: 74.5 });
      createTestBodyMeasurement({ biz_key: 6032n, record_date: '2026-05-05', body_weight: 75.5 });

      const latest = bodyMeasurementRepo.findLatest();
      expect(latest).not.toBeNull();
      expect(latest!.record_date).toBe('2026-05-10');
      expect(latest!.body_weight).toBe(74.5);
    });

    it('should return null when no measurements exist', () => {
      expect(bodyMeasurementRepo.findLatest()).toBeNull();
    });
  });

  describe('nullable circumference fields', () => {
    it('should store partial measurement with null circumferences', () => {
      const bm = createTestBodyMeasurement({
        biz_key: 6040n,
        body_weight: 75.0,
        waist_circumference: 85.0,
        chest_circumference: null,
        arm_circumference: null,
        thigh_circumference: null,
      });
      expect(bm.waist_circumference).toBe(85.0);
      expect(bm.chest_circumference).toBeNull();
    });
  });
});

// ============================================================
// OtherSportRecord Repository
// ============================================================

describe('OtherSportRecordRepository', () => {
  let osrBizKeyCounter = 7000n;
  function createTestOtherSport(overrides: Partial<Omit<OtherSportRecord, 'id'>> = {}): OtherSportRecord {
    const now = new Date().toISOString();
    osrBizKeyCounter += 1n;
    return otherSportRepo.create({
      biz_key: osrBizKeyCounter,
      record_date: '2026-05-09',
      sport_type_biz_key: 100n,
      sport_note: null,
      created_at: now,
      updated_at: now,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create an other sport record', () => {
      const osr = createTestOtherSport({ biz_key: 7001n });
      expect(osr.id).toBeGreaterThan(0);
      expect(Number(osr.sport_type_biz_key)).toBe(100);
    });

    it('should find by id', () => {
      const osr = createTestOtherSport({ biz_key: 7002n });
      const found = otherSportRepo.findById(osr.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(7002);
    });

    it('should find by biz_key', () => {
      const osr = createTestOtherSport({ biz_key: 7003n });
      const found = otherSportRepo.findByBizKey(7003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(osr.id);
    });

    it('should update an other sport record', () => {
      const osr = createTestOtherSport({ biz_key: 7004n });
      const updated = otherSportRepo.update(osr.id, { sport_note: 'Great run' });
      expect(updated.sport_note).toBe('Great run');
    });

    it('should delete an other sport record', () => {
      const osr = createTestOtherSport({ biz_key: 7005n });
      otherSportRepo.deleteById(osr.id);
      expect(otherSportRepo.findById(osr.id)).toBeNull();
    });
  });

  describe('findByDate', () => {
    it('should find records by exact date', () => {
      createTestOtherSport({ biz_key: 7010n, record_date: '2026-05-09' });
      createTestOtherSport({ biz_key: 7011n, record_date: '2026-05-09' });
      createTestOtherSport({ biz_key: 7012n, record_date: '2026-05-10' });

      const results = otherSportRepo.findByDate('2026-05-09');
      expect(results.length).toBe(2);
    });

    it('should return empty array for date with no records', () => {
      expect(otherSportRepo.findByDate('2020-01-01')).toEqual([]);
    });
  });

  describe('findBySportTypeBizKey', () => {
    it('should find records by sport_type_biz_key', () => {
      createTestOtherSport({ biz_key: 7020n, sport_type_biz_key: 5001n });
      createTestOtherSport({ biz_key: 7021n, sport_type_biz_key: 5001n });
      createTestOtherSport({ biz_key: 7022n, sport_type_biz_key: 5002n });

      const results = otherSportRepo.findBySportTypeBizKey(5001n);
      expect(results.length).toBe(2);
    });

    it('should return empty array for sport type with no records', () => {
      expect(otherSportRepo.findBySportTypeBizKey(9999n)).toEqual([]);
    });
  });
});

// ============================================================
// SportType Repository
// ============================================================

describe('SportTypeRepository', () => {
  let stBizKeyCounter = 8000n;
  function createTestSportType(overrides: Partial<Omit<SportType, 'id'>> = {}): SportType {
    const now = new Date().toISOString();
    stBizKeyCounter += 1n;
    return sportTypeRepo.create({
      biz_key: stBizKeyCounter,
      sport_name: `Sport ${stBizKeyCounter}`,
      icon: null,
      is_custom: 0,
      created_at: now,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create a sport type', () => {
      const st = createTestSportType({ biz_key: 8001n, sport_name: 'Running' });
      expect(st.id).toBeGreaterThan(0);
      expect(st.sport_name).toBe('Running');
    });

    it('should find by id', () => {
      const st = createTestSportType({ biz_key: 8002n });
      const found = sportTypeRepo.findById(st.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(8002);
    });

    it('should find by biz_key', () => {
      const st = createTestSportType({ biz_key: 8003n });
      const found = sportTypeRepo.findByBizKey(8003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(st.id);
    });

    it('should update a sport type', () => {
      const st = createTestSportType({ biz_key: 8004n });
      const updated = sportTypeRepo.update(st.id, { icon: 'run' });
      expect(updated.icon).toBe('run');
    });

    it('should delete a sport type', () => {
      const st = createTestSportType({ biz_key: 8005n });
      sportTypeRepo.deleteById(st.id);
      expect(sportTypeRepo.findById(st.id)).toBeNull();
    });
  });

  describe('findAllIncludingCustom', () => {
    it('should return all sport types including custom', () => {
      createTestSportType({ biz_key: 8010n, sport_name: 'Running', is_custom: 0 });
      createTestSportType({ biz_key: 8011n, sport_name: 'Yoga', is_custom: 0 });
      createTestSportType({ biz_key: 8012n, sport_name: 'Custom Sport', is_custom: 1 });

      const all = sportTypeRepo.findAllIncludingCustom();
      expect(all.length).toBe(3);
    });

    it('should return empty array when no sport types', () => {
      expect(sportTypeRepo.findAllIncludingCustom()).toEqual([]);
    });
  });
});

// ============================================================
// SportMetric Repository
// ============================================================

describe('SportMetricRepository', () => {
  let smBizKeyCounter = 9000n;
  function createTestSportMetric(overrides: Partial<Omit<SportMetric, 'id'>> = {}): SportMetric {
    smBizKeyCounter += 1n;
    return sportMetricRepo.create({
      biz_key: smBizKeyCounter,
      sport_type_biz_key: 100n,
      metric_name: 'Distance',
      metric_unit: 'km',
      is_custom: 0,
      order_index: 0,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create a sport metric', () => {
      const sm = createTestSportMetric({ biz_key: 9001n });
      expect(sm.id).toBeGreaterThan(0);
      expect(sm.metric_name).toBe('Distance');
      expect(sm.metric_unit).toBe('km');
    });

    it('should find by id', () => {
      const sm = createTestSportMetric({ biz_key: 9002n });
      const found = sportMetricRepo.findById(sm.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(9002);
    });

    it('should find by biz_key', () => {
      const sm = createTestSportMetric({ biz_key: 9003n });
      const found = sportMetricRepo.findByBizKey(9003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(sm.id);
    });

    it('should update a sport metric', () => {
      const sm = createTestSportMetric({ biz_key: 9004n });
      const updated = sportMetricRepo.update(sm.id, { metric_unit: 'miles' });
      expect(updated.metric_unit).toBe('miles');
    });

    it('should delete a sport metric', () => {
      const sm = createTestSportMetric({ biz_key: 9005n });
      sportMetricRepo.deleteById(sm.id);
      expect(sportMetricRepo.findById(sm.id)).toBeNull();
    });
  });

  describe('findBySportTypeBizKey', () => {
    it('should find metrics by sport_type_biz_key ordered by order_index', () => {
      createTestSportMetric({ biz_key: 9010n, sport_type_biz_key: 5001n, order_index: 2 });
      createTestSportMetric({ biz_key: 9011n, sport_type_biz_key: 5001n, order_index: 0 });
      createTestSportMetric({ biz_key: 9012n, sport_type_biz_key: 5001n, order_index: 1 });
      createTestSportMetric({ biz_key: 9013n, sport_type_biz_key: 5002n, order_index: 0 });

      const results = sportMetricRepo.findBySportTypeBizKey(5001n);
      expect(results.length).toBe(3);
      expect(results[0].order_index).toBe(0);
      expect(results[1].order_index).toBe(1);
      expect(results[2].order_index).toBe(2);
    });

    it('should return empty array for sport type with no metrics', () => {
      expect(sportMetricRepo.findBySportTypeBizKey(9999n)).toEqual([]);
    });
  });
});

// ============================================================
// SportMetricValue Repository
// ============================================================

describe('SportMetricValueRepository', () => {
  let smvBizKeyCounter = 10000n;
  function createTestSportMetricValue(overrides: Partial<Omit<SportMetricValue, 'id'>> = {}): SportMetricValue {
    smvBizKeyCounter += 1n;
    return sportMetricValueRepo.create({
      biz_key: smvBizKeyCounter,
      sport_record_biz_key: 100n,
      sport_metric_biz_key: 200n,
      metric_value: 5.0,
      ...overrides,
    });
  }

  describe('CRUD', () => {
    it('should create a sport metric value', () => {
      const smv = createTestSportMetricValue({ biz_key: 10001n });
      expect(smv.id).toBeGreaterThan(0);
      expect(smv.metric_value).toBe(5.0);
    });

    it('should find by id', () => {
      const smv = createTestSportMetricValue({ biz_key: 10002n });
      const found = sportMetricValueRepo.findById(smv.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(10002);
    });

    it('should find by biz_key', () => {
      const smv = createTestSportMetricValue({ biz_key: 10003n });
      const found = sportMetricValueRepo.findByBizKey(10003n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(smv.id);
    });

    it('should update a sport metric value', () => {
      const smv = createTestSportMetricValue({ biz_key: 10004n });
      const updated = sportMetricValueRepo.update(smv.id, { metric_value: 10.5 });
      expect(updated.metric_value).toBe(10.5);
    });

    it('should delete a sport metric value', () => {
      const smv = createTestSportMetricValue({ biz_key: 10005n });
      sportMetricValueRepo.deleteById(smv.id);
      expect(sportMetricValueRepo.findById(smv.id)).toBeNull();
    });
  });

  describe('findBySportRecordBizKey', () => {
    it('should find metric values by sport_record_biz_key', () => {
      createTestSportMetricValue({ biz_key: 10010n, sport_record_biz_key: 7001n });
      createTestSportMetricValue({ biz_key: 10011n, sport_record_biz_key: 7001n });
      createTestSportMetricValue({ biz_key: 10012n, sport_record_biz_key: 7002n });

      const results = sportMetricValueRepo.findBySportRecordBizKey(7001n);
      expect(results.length).toBe(2);
    });

    it('should return empty array for record with no metric values', () => {
      expect(sportMetricValueRepo.findBySportRecordBizKey(9999n)).toEqual([]);
    });
  });
});

// ============================================================
// UserSettings Repository
// ============================================================

describe('UserSettingsRepository', () => {
  describe('getValue / setValue (upsert pattern)', () => {
    it('should create a new setting when key does not exist', () => {
      const setting = userSettingsRepo.setValue('weight_unit', '"kg"');
      expect(setting.id).toBeGreaterThan(0);
      expect(setting.setting_key).toBe('weight_unit');
      expect(setting.setting_value).toBe('"kg"');
    });

    it('should update existing setting when key exists', () => {
      const first = userSettingsRepo.setValue('weight_unit', '"kg"');
      const second = userSettingsRepo.setValue('weight_unit', '"lbs"');

      expect(second.id).toBe(first.id); // same row updated
      expect(second.setting_value).toBe('"lbs"');
    });

    it('should get a setting value by key', () => {
      userSettingsRepo.setValue('theme', '"dark"');

      const value = userSettingsRepo.getValue('theme');
      expect(value).toBe('"dark"');
    });

    it('should return null for non-existent key', () => {
      expect(userSettingsRepo.getValue('nonexistent')).toBeNull();
    });

    it('should handle JSON serialized values', () => {
      const jsonValue = JSON.stringify({ skipped_dates: ['2026-05-01', '2026-05-02'] });
      userSettingsRepo.setValue('skipped_dates_100', jsonValue);

      const retrieved = userSettingsRepo.getValue('skipped_dates_100');
      expect(JSON.parse(retrieved!)).toEqual({ skipped_dates: ['2026-05-01', '2026-05-02'] });
    });

    it('should handle multiple independent keys', () => {
      userSettingsRepo.setValue('weight_unit', '"kg"');
      userSettingsRepo.setValue('theme', '"dark"');
      userSettingsRepo.setValue('onboarding_completed', 'true');

      expect(userSettingsRepo.getValue('weight_unit')).toBe('"kg"');
      expect(userSettingsRepo.getValue('theme')).toBe('"dark"');
      expect(userSettingsRepo.getValue('onboarding_completed')).toBe('true');
    });
  });

  describe('CRUD via base repo', () => {
    it('should find setting by id', () => {
      const setting = userSettingsRepo.setValue('test_key', '"test_value"');
      const found = userSettingsRepo.findById(setting.id);
      expect(found).not.toBeNull();
      expect(found!.setting_key).toBe('test_key');
    });

    it('should find setting by biz_key', () => {
      const setting = userSettingsRepo.setValue('test_key2', '"test_value2"');
      const found = userSettingsRepo.findByBizKey(setting.biz_key);
      expect(found).not.toBeNull();
      expect(found!.setting_key).toBe('test_key2');
    });

    it('should delete a setting', () => {
      const setting = userSettingsRepo.setValue('to_delete', '"value"');
      userSettingsRepo.deleteById(setting.id);
      expect(userSettingsRepo.getValue('to_delete')).toBeNull();
    });
  });
});

// ============================================================
// Cross-entity integration: SportType -> SportMetric -> OtherSportRecord -> SportMetricValue
// ============================================================

describe('Other sport entity integration', () => {
  it('should support full other sport flow: type -> metric -> record -> values', () => {
    const now = new Date().toISOString();

    // 1. Create sport type
    const sportType = sportTypeRepo.create({
      biz_key: 11001n,
      sport_name: 'Swimming',
      icon: 'swim',
      is_custom: 0,
      created_at: now,
    });
    expect(sportType.sport_name).toBe('Swimming');

    // 2. Create sport metrics for the type
    const distanceMetric = sportMetricRepo.create({
      biz_key: 11101n,
      sport_type_biz_key: sportType.biz_key,
      metric_name: 'Distance',
      metric_unit: 'm',
      is_custom: 0,
      order_index: 0,
    });
    const timeMetric = sportMetricRepo.create({
      biz_key: 11102n,
      sport_type_biz_key: sportType.biz_key,
      metric_name: 'Time',
      metric_unit: 'min',
      is_custom: 0,
      order_index: 1,
    });

    // 3. Create an other sport record
    const record = otherSportRepo.create({
      biz_key: 11201n,
      record_date: '2026-05-09',
      sport_type_biz_key: sportType.biz_key,
      sport_note: 'Great swim session',
      created_at: now,
      updated_at: now,
    });

    // 4. Add metric values
    const distanceValue = sportMetricValueRepo.create({
      biz_key: 11301n,
      sport_record_biz_key: record.biz_key,
      sport_metric_biz_key: distanceMetric.biz_key,
      metric_value: 1500.0,
    });
    const timeValue = sportMetricValueRepo.create({
      biz_key: 11302n,
      sport_record_biz_key: record.biz_key,
      sport_metric_biz_key: timeMetric.biz_key,
      metric_value: 35.0,
    });

    // 5. Verify cross-entity queries
    const metrics = sportMetricRepo.findBySportTypeBizKey(sportType.biz_key);
    expect(metrics.length).toBe(2);

    const sportRecords = otherSportRepo.findBySportTypeBizKey(sportType.biz_key);
    expect(sportRecords.length).toBe(1);
    expect(sportRecords[0].sport_note).toBe('Great swim session');

    const metricValues = sportMetricValueRepo.findBySportRecordBizKey(record.biz_key);
    expect(metricValues.length).toBe(2);
  });
});
