/**
 * Schema definitions for Train Recorder database.
 * All 15 CREATE TABLE statements and 15 CREATE INDEX statements
 * matching design/schema.sql exactly.
 *
 * Conventions:
 *   id        INTEGER PRIMARY KEY AUTOINCREMENT (PK)
 *   biz_key   INTEGER NOT NULL UNIQUE (snowflake ID, application-layer bigint)
 *   No FK constraints (application-layer integrity)
 *   DATETIME stored as TEXT in SQLite
 */

// ============================================================
// CREATE TABLE statements (15 tables)
// ============================================================

export const CREATE_TRAINING_PLANS = `
CREATE TABLE IF NOT EXISTS training_plans (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    plan_name       VARCHAR(100)    NOT NULL,
    plan_mode       VARCHAR(20)     NOT NULL DEFAULT 'infinite_loop',
    cycle_length    INT             NULL,
    schedule_mode   VARCHAR(20)     NOT NULL DEFAULT 'weekly_fixed',
    rest_days       INT             NOT NULL DEFAULT 1,
    weekly_config   TEXT            NULL,
    is_active       TINYINT         NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_TRAINING_DAYS = `
CREATE TABLE IF NOT EXISTS training_days (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    plan_biz_key    INTEGER         NOT NULL,
    day_name        VARCHAR(50)     NOT NULL,
    training_type   VARCHAR(20)     NOT NULL DEFAULT 'custom',
    order_index     INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_EXERCISES = `
CREATE TABLE IF NOT EXISTS exercises (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    exercise_name   VARCHAR(100)    NOT NULL UNIQUE,
    category        VARCHAR(30)     NOT NULL DEFAULT 'custom',
    increment       DECIMAL(6,2)    NOT NULL DEFAULT 2.50,
    default_rest    INT             NOT NULL DEFAULT 180,
    is_custom       TINYINT         NOT NULL DEFAULT 0,
    is_deleted      TINYINT         NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_PLAN_EXERCISES = `
CREATE TABLE IF NOT EXISTS plan_exercises (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    training_day_biz_key INTEGER   NOT NULL,
    exercise_biz_key    INTEGER    NOT NULL,
    sets_config         VARCHAR(2048) NOT NULL,
    order_index     INT             NOT NULL DEFAULT 0,
    exercise_note   VARCHAR(100)    NULL,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_WORKOUT_SESSIONS = `
CREATE TABLE IF NOT EXISTS workout_sessions (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    session_date    VARCHAR(10)     NOT NULL,
    training_type   VARCHAR(20)     NOT NULL DEFAULT 'custom',
    session_status  VARCHAR(20)     NOT NULL DEFAULT 'in_progress',
    started_at      DATETIME        NOT NULL,
    ended_at        DATETIME        NULL,
    is_backlog      TINYINT         NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_WORKOUT_EXERCISES = `
CREATE TABLE IF NOT EXISTS workout_exercises (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    workout_session_biz_key INTEGER NOT NULL,
    exercise_biz_key        INTEGER NOT NULL,
    order_index     INT             NOT NULL DEFAULT 0,
    exercise_status VARCHAR(20)     NOT NULL DEFAULT 'pending',
    exercise_note   VARCHAR(100)    NULL,
    suggested_weight DECIMAL(6,2)   NULL,
    target_sets     INT             NOT NULL,
    target_reps     INT             NOT NULL,
    exercise_mode   VARCHAR(20)     NOT NULL DEFAULT 'fixed',
    created_at      DATETIME        NOT NULL
);`;

export const CREATE_WORKOUT_SETS = `
CREATE TABLE IF NOT EXISTS workout_sets (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    workout_exercise_biz_key INTEGER NOT NULL,
    set_index       INT             NOT NULL DEFAULT 0,
    target_weight   DECIMAL(6,2)    NULL,
    target_reps     INT             NOT NULL,
    actual_weight   DECIMAL(6,2)    NULL,
    actual_reps     INT             NULL,
    is_completed    TINYINT         NOT NULL DEFAULT 0,
    completed_at    DATETIME        NULL,
    is_target_met   TINYINT         NULL
);`;

export const CREATE_FEELINGS = `
CREATE TABLE IF NOT EXISTS feelings (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    workout_session_biz_key INTEGER NOT NULL,
    fatigue_level   INT             NOT NULL DEFAULT 5,
    satisfaction    INT             NOT NULL DEFAULT 5,
    overall_note    VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_EXERCISE_FEELINGS = `
CREATE TABLE IF NOT EXISTS exercise_feelings (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    feeling_biz_key INTEGER         NOT NULL,
    exercise_biz_key INTEGER        NOT NULL,
    workout_exercise_biz_key INTEGER NOT NULL,
    feeling_note    VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL
);`;

export const CREATE_PERSONAL_RECORDS = `
CREATE TABLE IF NOT EXISTS personal_records (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    exercise_biz_key INTEGER        NOT NULL,
    pr_type         VARCHAR(20)     NOT NULL DEFAULT 'weight',
    pr_value        DECIMAL(10,2)   NOT NULL,
    pr_date         VARCHAR(10)     NOT NULL,
    workout_set_biz_key INTEGER     NULL,
    created_at      DATETIME        NOT NULL
);`;

export const CREATE_BODY_MEASUREMENTS = `
CREATE TABLE IF NOT EXISTS body_measurements (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    record_date     VARCHAR(10)     NOT NULL,
    body_weight     DECIMAL(5,1)    NULL,
    chest_circumference DECIMAL(5,1) NULL,
    waist_circumference DECIMAL(5,1) NULL,
    arm_circumference DECIMAL(5,1)  NULL,
    thigh_circumference DECIMAL(5,1) NULL,
    body_note       VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_OTHER_SPORT_RECORDS = `
CREATE TABLE IF NOT EXISTS other_sport_records (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    record_date     VARCHAR(10)     NOT NULL,
    sport_type_biz_key INTEGER      NOT NULL,
    sport_note      VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

export const CREATE_SPORT_TYPES = `
CREATE TABLE IF NOT EXISTS sport_types (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    sport_name      VARCHAR(50)     NOT NULL UNIQUE,
    icon            VARCHAR(50)     NULL,
    is_custom       TINYINT         NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL
);`;

export const CREATE_SPORT_METRICS = `
CREATE TABLE IF NOT EXISTS sport_metrics (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    sport_type_biz_key INTEGER      NOT NULL,
    metric_name     VARCHAR(50)     NOT NULL,
    metric_unit     VARCHAR(20)     NULL,
    is_custom       TINYINT         NOT NULL DEFAULT 0,
    order_index     INT             NOT NULL DEFAULT 0
);`;

export const CREATE_SPORT_METRIC_VALUES = `
CREATE TABLE IF NOT EXISTS sport_metric_values (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    sport_record_biz_key INTEGER    NOT NULL,
    sport_metric_biz_key INTEGER    NOT NULL,
    metric_value    DECIMAL(10,2)   NOT NULL
);`;

export const CREATE_USER_SETTINGS = `
CREATE TABLE IF NOT EXISTS user_settings (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    setting_key     VARCHAR(50)     NOT NULL UNIQUE,
    setting_value   VARCHAR(500)    NOT NULL,
    updated_at      DATETIME        NOT NULL
);`;

// ============================================================
// All CREATE TABLE statements in dependency order
// ============================================================

export const CREATE_TABLE_STATEMENTS: string[] = [
  CREATE_TRAINING_PLANS,
  CREATE_TRAINING_DAYS,
  CREATE_EXERCISES,
  CREATE_PLAN_EXERCISES,
  CREATE_WORKOUT_SESSIONS,
  CREATE_WORKOUT_EXERCISES,
  CREATE_WORKOUT_SETS,
  CREATE_FEELINGS,
  CREATE_EXERCISE_FEELINGS,
  CREATE_PERSONAL_RECORDS,
  CREATE_BODY_MEASUREMENTS,
  CREATE_OTHER_SPORT_RECORDS,
  CREATE_SPORT_TYPES,
  CREATE_SPORT_METRICS,
  CREATE_SPORT_METRIC_VALUES,
  CREATE_USER_SETTINGS,
];

// ============================================================
// CREATE INDEX statements (15 indexes)
// ============================================================

export const CREATE_INDEXES: string[] = [
  'CREATE INDEX IF NOT EXISTS idx_ws_date ON workout_sessions(session_date);',
  'CREATE INDEX IF NOT EXISTS idx_ws_type ON workout_sessions(training_type);',
  'CREATE INDEX IF NOT EXISTS idx_we_session ON workout_exercises(workout_session_biz_key);',
  'CREATE INDEX IF NOT EXISTS idx_we_exercise ON workout_exercises(exercise_biz_key);',
  'CREATE INDEX IF NOT EXISTS idx_wset_exercise ON workout_sets(workout_exercise_biz_key);',
  'CREATE INDEX IF NOT EXISTS idx_pr_exercise_type ON personal_records(exercise_biz_key, pr_type);',
  'CREATE INDEX IF NOT EXISTS idx_pr_date ON personal_records(pr_date);',
  'CREATE INDEX IF NOT EXISTS idx_bm_date ON body_measurements(record_date);',
  'CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);',
  'CREATE INDEX IF NOT EXISTS idx_exercises_deleted ON exercises(is_deleted);',
  'CREATE INDEX IF NOT EXISTS idx_pe_day ON plan_exercises(training_day_biz_key);',
  'CREATE INDEX IF NOT EXISTS idx_td_plan ON training_days(plan_biz_key);',
  'CREATE INDEX IF NOT EXISTS idx_tp_active ON training_plans(is_active);',
  'CREATE INDEX IF NOT EXISTS idx_osr_date ON other_sport_records(record_date);',
  'CREATE INDEX IF NOT EXISTS idx_smv_record ON sport_metric_values(sport_record_biz_key);',
];

// ============================================================
// Built-in exercises seed data (PRD 5.5)
// ============================================================

export interface BuiltinExercise {
  exercise_name: string;
  category: string;
  increment: number;
  default_rest: number;
}

export const BUILTIN_EXERCISES: BuiltinExercise[] = [
  // 核心力量举 (core_powerlifting)
  { exercise_name: '深蹲', category: 'core_powerlifting', increment: 2.5, default_rest: 300 },
  { exercise_name: '卧推', category: 'core_powerlifting', increment: 2.5, default_rest: 300 },
  { exercise_name: '硬拉', category: 'core_powerlifting', increment: 2.5, default_rest: 300 },
  { exercise_name: '推举', category: 'core_powerlifting', increment: 2.5, default_rest: 300 },
  // 上肢推 (upper_push)
  { exercise_name: '上斜卧推', category: 'upper_push', increment: 2.5, default_rest: 240 },
  { exercise_name: '哑铃卧推', category: 'upper_push', increment: 2.5, default_rest: 240 },
  { exercise_name: '双杠臂屈伸', category: 'upper_push', increment: 2.5, default_rest: 240 },
  // 上肢拉 (upper_pull)
  { exercise_name: '杠铃划船', category: 'upper_pull', increment: 2.5, default_rest: 240 },
  { exercise_name: '引体向上', category: 'upper_pull', increment: 2.5, default_rest: 240 },
  { exercise_name: '高位下拉', category: 'upper_pull', increment: 2.5, default_rest: 240 },
  { exercise_name: '哑铃划船', category: 'upper_pull', increment: 2.5, default_rest: 240 },
  // 下肢 (lower)
  { exercise_name: '前蹲', category: 'lower', increment: 2.5, default_rest: 300 },
  { exercise_name: '腿举', category: 'lower', increment: 5.0, default_rest: 240 },
  { exercise_name: '罗马尼亚硬拉', category: 'lower', increment: 2.5, default_rest: 300 },
  { exercise_name: '腿弯举', category: 'lower', increment: 2.5, default_rest: 180 },
  // 核心 (core)
  { exercise_name: '卷腹', category: 'core', increment: 2.5, default_rest: 120 },
  { exercise_name: '平板支撑', category: 'core', increment: 5.0, default_rest: 120 },
  { exercise_name: '健腹轮', category: 'core', increment: 2.5, default_rest: 120 },
  // 肩部 (shoulder)
  { exercise_name: '侧平举', category: 'shoulder', increment: 1.25, default_rest: 120 },
  { exercise_name: '面拉', category: 'shoulder', increment: 2.5, default_rest: 120 },
  { exercise_name: '推举（哑铃）', category: 'shoulder', increment: 2.5, default_rest: 180 },
];

// ============================================================
// Table name list for verification
// ============================================================

export const TABLE_NAMES = [
  'training_plans',
  'training_days',
  'exercises',
  'plan_exercises',
  'workout_sessions',
  'workout_exercises',
  'workout_sets',
  'feelings',
  'exercise_feelings',
  'personal_records',
  'body_measurements',
  'other_sport_records',
  'sport_types',
  'sport_metrics',
  'sport_metric_values',
  'user_settings',
] as const;

export type TableName = (typeof TABLE_NAMES)[number];
