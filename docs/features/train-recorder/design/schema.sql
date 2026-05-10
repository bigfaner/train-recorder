-- ============================================================
-- Schema: Train Recorder (SQLite / expo-sqlite)
-- Generated from: design/er-diagram.md
-- Conventions:
--   id        INTEGER PRIMARY KEY AUTOINCREMENT (PK, SQLite auto-64-bit)
--   biz_key   INTEGER NOT NULL UNIQUE (雪花算法，应用层生成 bigint，SQLite 存为 INTEGER)
--   No FK constraints (应用层保证关联正确性)
--   Avoid SQL reserved keywords in column names
--   Calendar schedule computed from plan config + workout records (no schedule table)
-- Note: SQLite 将所有整数存为 64-bit INTEGER，语义等同于 INTEGER
-- ============================================================

-- Training Plans: 训练计划定义
CREATE TABLE training_plans (
    -- 雪花算法业务键 (应用层 bigint)
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 计划名称，如"推拉蹲 3日循环"
    plan_name       VARCHAR(100)    NOT NULL,
    -- fixed_cycle 或 infinite_loop
    plan_mode       VARCHAR(20)     NOT NULL DEFAULT 'infinite_loop',
    -- 周期周数，仅 fixed_cycle 模式
    cycle_length    INT             NULL,
    -- weekly_fixed 或 fixed_interval
    schedule_mode   VARCHAR(20)     NOT NULL DEFAULT 'weekly_fixed',
    -- 固定间隔模式的休息天数 (0-6)
    rest_days       INT             NOT NULL DEFAULT 1,
    -- JSON: 星期→training_day_biz_key 映射
    weekly_config   TEXT            NULL,
    -- 同一时间只有一个激活计划
    is_active       TINYINT         NOT NULL DEFAULT 0,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Training Days: 计划中的训练日类型
CREATE TABLE training_days (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 TrainingPlan.biz_key
    plan_biz_key    INTEGER         NOT NULL,
    -- 显示名称，如"推日"
    day_name        VARCHAR(50)     NOT NULL,
    -- push / pull / legs / custom
    training_type   VARCHAR(20)     NOT NULL DEFAULT 'custom',
    -- 循环顺序 (0-based)
    order_index     INT             NOT NULL DEFAULT 0,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Exercises (Library): 动作库（内置 + 用户自定义）
CREATE TABLE exercises (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 动作名称
    exercise_name   VARCHAR(100)    NOT NULL UNIQUE,
    -- core_powerlifting / upper_push / upper_pull / lower / core / shoulder / custom
    category        VARCHAR(30)     NOT NULL DEFAULT 'custom',
    -- 默认加重增量 (kg)
    increment       DECIMAL(6,2)    NOT NULL DEFAULT 2.50,
    -- 默认组间休息 (秒, 30-600)
    default_rest    INT             NOT NULL DEFAULT 180,
    -- 用户自定义 vs 内置
    is_custom       TINYINT         NOT NULL DEFAULT 0,
    -- 软删除标记
    is_deleted      TINYINT         NOT NULL DEFAULT 0,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Plan Exercises: 训练日中的动作配置
-- sets_config: VARCHAR(2048) JSON 对象，通过 mode 字段区分格式
--   固定模式: {"mode":"fixed","target_reps":5,"target_weight":50.0,"target_repeat":5}
--   自定义模式: {"mode":"custom","sets":[{"target_reps":5,"target_weight":80.0},...]}
CREATE TABLE plan_exercises (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 TrainingDay.biz_key
    training_day_biz_key INTEGER   NOT NULL,
    -- 关联 Exercise.biz_key
    exercise_biz_key    INTEGER    NOT NULL,
    -- JSON: 固定模式含 mode/target_reps/target_weight/target_repeat; 自定义模式含 mode/sets[]
    sets_config         VARCHAR(2048) NOT NULL,
    -- 执行顺序
    order_index     INT             NOT NULL DEFAULT 0,
    -- 区分备注，如"暂停深蹲"
    exercise_note   VARCHAR(100)    NULL,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Workout Sessions: 实际训练记录
-- duration 由 ended_at - started_at 计算，不存储
CREATE TABLE workout_sessions (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 训练日期 YYYY-MM-DD
    session_date    VARCHAR(10)     NOT NULL,
    -- push / pull / legs / custom
    training_type   VARCHAR(20)     NOT NULL DEFAULT 'custom',
    -- in_progress / completed / completed_partial
    session_status  VARCHAR(20)     NOT NULL DEFAULT 'in_progress',
    -- 开始时间
    started_at      DATETIME        NOT NULL,
    -- 结束时间
    ended_at        DATETIME        NULL,
    -- 补录标记
    is_backlog      TINYINT         NOT NULL DEFAULT 0,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Workout Exercises: 训练中的动作记录
CREATE TABLE workout_exercises (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 WorkoutSession.biz_key
    workout_session_biz_key INTEGER NOT NULL,
    -- 关联 Exercise.biz_key
    exercise_biz_key        INTEGER NOT NULL,
    -- 执行顺序（可能与计划不同）
    order_index     INT             NOT NULL DEFAULT 0,
    -- pending / in_progress / completed / skipped
    exercise_status VARCHAR(20)     NOT NULL DEFAULT 'pending',
    -- 本次备注
    exercise_note   VARCHAR(100)    NULL,
    -- 算法建议重量 (kg)
    suggested_weight DECIMAL(6,2)   NULL,
    -- 计划总组数
    target_sets     INT             NOT NULL,
    -- 目标次数
    target_reps     INT             NOT NULL,
    -- fixed / custom
    exercise_mode   VARCHAR(20)     NOT NULL DEFAULT 'fixed',
    -- 创建时间
    created_at      DATETIME        NOT NULL
);

-- Workout Sets: 训练中每组的记录
CREATE TABLE workout_sets (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 WorkoutExercise.biz_key
    workout_exercise_biz_key INTEGER NOT NULL,
    -- 组序号 (0-based)
    set_index       INT             NOT NULL DEFAULT 0,
    -- 计划重量 (kg)
    target_weight   DECIMAL(6,2)    NULL,
    -- 计划次数
    target_reps     INT             NOT NULL,
    -- 实际重量 (kg)
    actual_weight   DECIMAL(6,2)    NULL,
    -- 实际次数
    actual_reps     INT             NULL,
    -- 是否已完成
    is_completed    TINYINT         NOT NULL DEFAULT 0,
    -- 完成时间
    completed_at    DATETIME        NULL,
    -- 1=达标 (actual_reps >= target_reps)，0=未达标
    is_target_met   TINYINT         NULL
);

-- Feelings: 训练后感受记录
CREATE TABLE feelings (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 WorkoutSession.biz_key
    workout_session_biz_key INTEGER NOT NULL,
    -- 疲劳度 1-10
    fatigue_level   INT             NOT NULL DEFAULT 5,
    -- 满意度 1-10
    satisfaction    INT             NOT NULL DEFAULT 5,
    -- 整体备注
    overall_note    VARCHAR(500)    NULL,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Exercise Feelings: 训练中各动作的独立感受
CREATE TABLE exercise_feelings (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 Feeling.biz_key
    feeling_biz_key INTEGER         NOT NULL,
    -- 关联 Exercise.biz_key
    exercise_biz_key INTEGER        NOT NULL,
    -- 关联 WorkoutExercise.biz_key
    workout_exercise_biz_key INTEGER NOT NULL,
    -- 该动作感受备注
    feeling_note    VARCHAR(500)    NULL,
    -- 创建时间
    created_at      DATETIME        NOT NULL
);

-- Personal Records: 个人记录追踪
CREATE TABLE personal_records (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 Exercise.biz_key
    exercise_biz_key INTEGER        NOT NULL,
    -- weight 或 volume
    pr_type         VARCHAR(20)     NOT NULL DEFAULT 'weight',
    -- PR 值 (kg 或 kg×reps)
    pr_value        DECIMAL(10,2)   NOT NULL,
    -- 达成日期 YYYY-MM-DD
    pr_date         VARCHAR(10)     NOT NULL,
    -- 关联 WorkoutSet.biz_key
    workout_set_biz_key INTEGER     NULL,
    -- 创建时间
    created_at      DATETIME        NOT NULL
);

-- Body Measurements: 身体数据记录
CREATE TABLE body_measurements (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 记录日期 YYYY-MM-DD
    record_date     VARCHAR(10)     NOT NULL,
    -- 体重 (kg)
    body_weight     DECIMAL(5,1)    NULL,
    -- 胸围 (cm)
    chest_circumference DECIMAL(5,1) NULL,
    -- 腰围 (cm)
    waist_circumference DECIMAL(5,1) NULL,
    -- 臂围 (cm)
    arm_circumference DECIMAL(5,1)  NULL,
    -- 大腿围 (cm)
    thigh_circumference DECIMAL(5,1) NULL,
    -- 备注
    body_note       VARCHAR(500)    NULL,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Other Sport Records: 其他运动记录
CREATE TABLE other_sport_records (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 记录日期 YYYY-MM-DD
    record_date     VARCHAR(10)     NOT NULL,
    -- 关联 SportType.biz_key
    sport_type_biz_key INTEGER      NOT NULL,
    -- 备注
    sport_note      VARCHAR(500)    NULL,
    -- 创建时间
    created_at      DATETIME        NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- Sport Types: 运动类型定义（预设 + 用户自定义）
CREATE TABLE sport_types (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 运动名称
    sport_name      VARCHAR(50)     NOT NULL UNIQUE,
    -- 图标标识
    icon            VARCHAR(50)     NULL,
    -- 用户自定义 vs 预设
    is_custom       TINYINT         NOT NULL DEFAULT 0,
    -- 创建时间
    created_at      DATETIME        NOT NULL
);

-- Sport Metrics: 运动类型的指标定义
CREATE TABLE sport_metrics (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 SportType.biz_key
    sport_type_biz_key INTEGER      NOT NULL,
    -- 指标名称，如"距离"
    metric_name     VARCHAR(50)     NOT NULL,
    -- 单位，如"m""min"
    metric_unit     VARCHAR(20)     NULL,
    -- 用户自定义 vs 预设
    is_custom       TINYINT         NOT NULL DEFAULT 0,
    -- 显示顺序
    order_index     INT             NOT NULL DEFAULT 0
);

-- Sport Metric Values: 其他运动记录的指标值
CREATE TABLE sport_metric_values (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 关联 OtherSportRecord.biz_key
    sport_record_biz_key INTEGER    NOT NULL,
    -- 关联 SportMetric.biz_key
    sport_metric_biz_key INTEGER    NOT NULL,
    -- 数值
    metric_value    DECIMAL(10,2)   NOT NULL
);

-- User Settings: 应用设置和偏好
CREATE TABLE user_settings (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    -- 雪花算法业务键
    biz_key         INTEGER         NOT NULL UNIQUE,
    -- 设置键
    setting_key     VARCHAR(50)     NOT NULL UNIQUE,
    -- 设置值 (JSON 序列化)
    setting_value   VARCHAR(500)    NOT NULL,
    -- 更新时间
    updated_at      DATETIME        NOT NULL
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_ws_date ON workout_sessions(session_date);
CREATE INDEX idx_ws_type ON workout_sessions(training_type);
CREATE INDEX idx_we_session ON workout_exercises(workout_session_biz_key);
CREATE INDEX idx_we_exercise ON workout_exercises(exercise_biz_key);
CREATE INDEX idx_wset_exercise ON workout_sets(workout_exercise_biz_key);
CREATE INDEX idx_pr_exercise_type ON personal_records(exercise_biz_key, pr_type);
CREATE INDEX idx_pr_date ON personal_records(pr_date);
CREATE INDEX idx_bm_date ON body_measurements(record_date);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_deleted ON exercises(is_deleted);
CREATE INDEX idx_pe_day ON plan_exercises(training_day_biz_key);
CREATE INDEX idx_td_plan ON training_days(plan_biz_key);
CREATE INDEX idx_tp_active ON training_plans(is_active);
CREATE INDEX idx_osr_date ON other_sport_records(record_date);
CREATE INDEX idx_smv_record ON sport_metric_values(sport_record_biz_key);
