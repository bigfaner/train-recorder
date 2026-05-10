-- ============================================================
-- Schema: Train Recorder
-- Generated from: design/er-diagram.md
-- Target: SQLite (via SQLDelight, KMP)
-- Note: No SQL foreign keys — referential integrity maintained at application layer
-- ============================================================

-- [NEW] UserSettings
-- 全局用户偏好, 单行表
CREATE TABLE user_settings (
    id                          TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    weight_unit                 TEXT    NOT NULL DEFAULT 'kg',   -- 重量单位: kg / lb
    default_rest_seconds        INTEGER NOT NULL DEFAULT 180,    -- 默认组间休息(秒): 90/120/180/240/300
    training_reminder_enabled   INTEGER NOT NULL DEFAULT 1,      -- 训练日提醒 0=关 1=开
    vibration_enabled           INTEGER NOT NULL DEFAULT 1,      -- 休息结束振动 0/1
    sound_enabled               INTEGER NOT NULL DEFAULT 0,      -- 休息结束提示音 0/1
    onboarding_completed        INTEGER NOT NULL DEFAULT 0,      -- 是否完成首次引导 0/1
    updated_at                  TEXT    NOT NULL                 -- ISO 8601 更新时间
);

-- [NEW] Exercise
-- 动作库, 预置+自定义动作
CREATE TABLE exercise (
    id              TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    display_name    TEXT    NOT NULL UNIQUE,          -- 动作名称 (唯一)
    category        TEXT    NOT NULL,                 -- 分类: core/upper_push/upper_pull/lower/abs_core/shoulder/custom
    weight_increment REAL   NOT NULL,                 -- 加重增量(kg)
    default_rest    INTEGER NOT NULL,                 -- 默认组间休息(秒), 30-600
    is_custom       INTEGER NOT NULL DEFAULT 0,       -- 0=预置动作, 1=用户自定义
    created_at      TEXT    NOT NULL,                 -- ISO 8601 创建时间
    updated_at      TEXT    NOT NULL                  -- ISO 8601 更新时间
);

-- [NEW] TrainingPlan
-- 训练计划, 同一时间只有一个 is_active=1
CREATE TABLE training_plan (
    id              TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    display_name    TEXT    NOT NULL,                 -- 计划名称
    plan_mode       TEXT    NOT NULL,                 -- 计划模式: infinite_loop / fixed_cycle
    cycle_length    INTEGER,                          -- 周期长度(周), 仅 fixed_cycle 模式
    schedule_mode   TEXT    NOT NULL,                 -- 排期方式: weekly_fixed / fixed_interval
    interval_days   INTEGER,                          -- 训练间隔天数(0-6), 仅 fixed_interval 模式
    is_active       INTEGER NOT NULL DEFAULT 0,       -- 当前激活计划 0/1
    created_at      TEXT    NOT NULL,                 -- ISO 8601
    updated_at      TEXT    NOT NULL                  -- ISO 8601
);

-- [NEW] TrainingDay
-- 训练日定义, 属于某个训练计划
CREATE TABLE training_day (
    id          TEXT    PRIMARY KEY NOT NULL,         -- 主键 UUID
    plan_id     TEXT    NOT NULL,                     -- 所属训练计划 ID
    display_name TEXT   NOT NULL,                     -- 训练日名称(推日/拉日/蹲日/自定义)
    day_type    TEXT    NOT NULL,                     -- 训练类型: push/pull/legs/custom
    order_index INTEGER NOT NULL,                     -- 训练日顺序(从1开始)
    created_at  TEXT    NOT NULL,                     -- ISO 8601
    updated_at  TEXT    NOT NULL                      -- ISO 8601
);

-- [NEW] TrainingDayExercise
-- 训练日中的动作配置, 每个动作的加重增量从 exercise 继承但可覆盖
CREATE TABLE training_day_exercise (
    id                  TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    training_day_id     TEXT    NOT NULL,             -- 所属训练日 ID
    exercise_id         TEXT    NOT NULL,             -- 关联动作 ID
    order_index         INTEGER NOT NULL,             -- 动作顺序(从1开始)
    exercise_mode       TEXT    NOT NULL DEFAULT 'fixed', -- fixed=统一参数 / custom=逐组设置
    target_sets         INTEGER NOT NULL,             -- 目标组数(1-10)
    target_reps         INTEGER NOT NULL,             -- 目标次数(1-30), fixed 模式使用
    start_weight        REAL,                          -- 初始重量(kg), 首次训练时使用
    note                TEXT,                          -- 备注, 如"暂停深蹲"用于区分同动作多次出现
    rest_seconds        INTEGER NOT NULL,             -- 组间休息(秒)
    weight_increment    REAL    NOT NULL,             -- 加重增量(kg), 创建时从 exercise 继承
    created_at          TEXT    NOT NULL,             -- ISO 8601
    updated_at          TEXT    NOT NULL              -- ISO 8601
);

-- [NEW] TrainingDaySetConfig
-- 自定义模式的逐组参数, 仅 exercise_mode='custom' 时存在
CREATE TABLE training_day_set_config (
    id                  TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    day_exercise_id     TEXT    NOT NULL,             -- 所属训练日动作 ID
    set_index           INTEGER NOT NULL,             -- 组序号(0-based)
    target_reps         INTEGER NOT NULL,             -- 该组目标次数
    target_weight       REAL    NOT NULL              -- 该组目标重量(kg)
);

-- [NEW] WorkoutSession
-- 一次训练会话(实际执行或补录)
CREATE TABLE workout_session (
    id                  TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    plan_id             TEXT,                          -- 所属训练计划 ID, 补录可为空
    training_day_id     TEXT,                          -- 训练日定义 ID
    record_date         TEXT    NOT NULL,              -- 训练日期(yyyy-MM-dd)
    training_type       TEXT    NOT NULL,              -- 训练类型: push/pull/legs/other
    workout_status      TEXT    NOT NULL DEFAULT 'in_progress', -- in_progress/completed/completed_partial
    started_at          TEXT,                          -- 开始时间 ISO 8601, 补录为空
    ended_at            TEXT,                          -- 结束时间 ISO 8601
    is_backfill         INTEGER NOT NULL DEFAULT 0,    -- 是否补录 0/1
    created_at          TEXT    NOT NULL,              -- ISO 8601
    updated_at          TEXT    NOT NULL               -- ISO 8601
);

-- [NEW] WorkoutExercise
-- 训练会话中的动作实例, 每条对应计划中的一个动作
CREATE TABLE workout_exercise (
    id                  TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    workout_session_id  TEXT    NOT NULL,             -- 所属训练会话 ID
    exercise_id         TEXT    NOT NULL,             -- 关联动作 ID
    order_index         INTEGER NOT NULL,             -- 执行顺序
    note                TEXT,                          -- 备注
    suggested_weight    REAL,                          -- 建议重量(kg), 从 weight_suggestion 读取
    is_custom_weight    INTEGER NOT NULL DEFAULT 0,    -- 用户是否修改了建议重量 0/1
    target_sets         INTEGER NOT NULL,              -- 目标组数
    target_reps         INTEGER NOT NULL,              -- 目标次数(fixed 模式)
    exercise_mode       TEXT    NOT NULL DEFAULT 'fixed', -- fixed / custom
    exercise_status     TEXT    NOT NULL DEFAULT 'pending', -- pending/in_progress/completed/skipped
    created_at          TEXT    NOT NULL,              -- ISO 8601
    updated_at          TEXT    NOT NULL               -- ISO 8601
);

-- [NEW] ExerciseSet
-- 每组训练记录, 重量和次数
CREATE TABLE exercise_set (
    id                      TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    workout_exercise_id     TEXT    NOT NULL,             -- 所属训练动作 ID
    set_index               INTEGER NOT NULL,             -- 组序号(0-based)
    target_weight           REAL    NOT NULL,              -- 目标重量(kg)
    actual_weight           REAL    NOT NULL,              -- 实际重量(kg)
    target_reps             INTEGER NOT NULL,              -- 目标次数
    actual_reps             INTEGER,                       -- 实际完成次数, NULL=未完成
    is_completed            INTEGER NOT NULL DEFAULT 0,    -- 0=未完成, 1=已完成
    rest_started_at         TEXT,                          -- 休息开始时间 ISO 8601
    rest_duration           INTEGER,                       -- 休息时长(秒)
    created_at              TEXT    NOT NULL,              -- ISO 8601
    updated_at              TEXT    NOT NULL               -- ISO 8601
);

-- [NEW] WorkoutFeeling
-- 训练后感受, 与 workout_session 一对一
CREATE TABLE workout_feeling (
    id                  TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    workout_session_id  TEXT    NOT NULL UNIQUE,       -- 所属训练会话 ID (一对一)
    fatigue_level       INTEGER NOT NULL DEFAULT 5,    -- 疲劳度(1-10), 默认 5
    satisfaction_level  INTEGER NOT NULL DEFAULT 5,    -- 满意度(1-10), 默认 5
    notes               TEXT,                          -- 整体备注, 最大 500 字
    created_at          TEXT    NOT NULL,              -- ISO 8601
    updated_at          TEXT    NOT NULL               -- ISO 8601
);

-- [NEW] ExerciseFeeling
-- 各动作的独立感受备注
CREATE TABLE exercise_feeling (
    id                  TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    workout_feeling_id  TEXT    NOT NULL,             -- 所属训练感受 ID
    exercise_id         TEXT    NOT NULL,             -- 关联动作 ID
    notes               TEXT,                          -- 动作备注, 最大 200 字
    created_at          TEXT    NOT NULL,              -- ISO 8601
    updated_at          TEXT    NOT NULL               -- ISO 8601
);

-- [NEW] PersonalRecord
-- 每个动作一条记录, 追踪最高重量和最高容量
CREATE TABLE personal_record (
    id                      TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    exercise_id             TEXT    NOT NULL UNIQUE,       -- 关联动作 ID (每动作一条)
    max_weight              REAL    NOT NULL,              -- 最高重量(kg)
    max_volume              REAL    NOT NULL,              -- 最高容量(kg) = max(Σ weight × reps)
    max_weight_date         TEXT    NOT NULL,              -- 最高重量达成日期(yyyy-MM-dd)
    max_volume_date         TEXT    NOT NULL,              -- 最高容量达成日期(yyyy-MM-dd)
    max_weight_session_id   TEXT    NOT NULL,              -- 最高重量对应的训练会话 ID
    max_volume_session_id   TEXT    NOT NULL,              -- 最高容量对应的训练会话 ID
    created_at              TEXT    NOT NULL,              -- ISO 8601
    updated_at              TEXT    NOT NULL               -- ISO 8601
);

-- [NEW] WeightSuggestion
-- 加重建议缓存, 训练完成/编辑/删除时从 exercise_set 历史重算
CREATE TABLE weight_suggestion (
    id                      TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    exercise_id             TEXT    NOT NULL UNIQUE,       -- 关联动作 ID (每动作一条缓存)
    suggested_weight        REAL,                          -- 建议重量(kg), NULL=无历史首次训练
    based_on_session_id     TEXT,                          -- 计算依据的训练会话 ID
    consecutive_completions INTEGER NOT NULL DEFAULT 0,    -- 连续完成次数(用于"状态不错"提示)
    consecutive_failures    INTEGER NOT NULL DEFAULT 0,    -- 连续未完成次数(用于10%减重)
    last_calculated_at      TEXT    NOT NULL,              -- 最后计算时间 ISO 8601
    created_at              TEXT    NOT NULL,              -- ISO 8601
    updated_at              TEXT    NOT NULL               -- ISO 8601
);

-- [NEW] BodyMeasurement
-- 身体数据记录(体重、围度)
CREATE TABLE body_measurement (
    id              TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    record_date     TEXT    NOT NULL,                 -- 记录日期(yyyy-MM-dd)
    body_weight     REAL,                              -- 体重(kg), 精确到 0.1
    chest           REAL,                              -- 胸围(cm)
    waist           REAL,                              -- 腰围(cm)
    arm             REAL,                              -- 臂围(cm)
    thigh           REAL,                              -- 大腿围(cm)
    notes           TEXT,                              -- 备注, 最大 200 字
    created_at      TEXT    NOT NULL,                 -- ISO 8601
    updated_at      TEXT    NOT NULL                  -- ISO 8601
);

-- [NEW] OtherSportType
-- 其他运动类型, 预设(游泳/跑步/骑行/瑜伽) + 自定义
CREATE TABLE other_sport_type (
    id              TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    display_name    TEXT    NOT NULL UNIQUE,          -- 运动名称(唯一)
    is_custom       INTEGER NOT NULL DEFAULT 0,       -- 0=预设, 1=自定义
    created_at      TEXT    NOT NULL,                 -- ISO 8601
    updated_at      TEXT    NOT NULL                  -- ISO 8601
);

-- [NEW] OtherSportMetric
-- 运动类型的记录指标配置
CREATE TABLE other_sport_metric (
    id              TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    sport_type_id   TEXT    NOT NULL,                 -- 所属运动类型 ID
    metric_name     TEXT    NOT NULL,                 -- 指标显示名称(距离/时间/配速/...)
    metric_key      TEXT    NOT NULL,                 -- 指标程序键(distance/time/pace/laps/hr/calories/custom)
    input_type      TEXT    NOT NULL DEFAULT 'number', -- 输入类型: number / text
    is_required     INTEGER NOT NULL DEFAULT 0,       -- 是否必填 0/1
    unit            TEXT,                              -- 单位(m/km/min/bpm/kcal)
    created_at      TEXT    NOT NULL,                 -- ISO 8601
    updated_at      TEXT    NOT NULL                  -- ISO 8601
);

-- [NEW] OtherSportRecord
-- 其他运动的具体记录
CREATE TABLE other_sport_record (
    id              TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    sport_type_id   TEXT    NOT NULL,                 -- 运动类型 ID
    record_date     TEXT    NOT NULL,                 -- 记录日期(yyyy-MM-dd)
    notes           TEXT,                              -- 备注
    created_at      TEXT    NOT NULL,                 -- ISO 8601
    updated_at      TEXT    NOT NULL                  -- ISO 8601
);

-- [NEW] OtherSportMetricValue
-- 运动记录的各指标值
CREATE TABLE other_sport_metric_value (
    id              TEXT    PRIMARY KEY NOT NULL,     -- 主键 UUID
    sport_record_id TEXT    NOT NULL,                 -- 所属运动记录 ID
    metric_id       TEXT    NOT NULL,                 -- 指标定义 ID
    metric_value    TEXT    NOT NULL,                 -- 指标值(统一存为文本, 按需解析)
    created_at      TEXT    NOT NULL,                 -- ISO 8601
    updated_at      TEXT    NOT NULL                  -- ISO 8601
);

-- [NEW] TimerState
-- 训练计时器状态, 仅在训练期间存在, 训练结束后删除
CREATE TABLE timer_state (
    id                      TEXT    PRIMARY KEY NOT NULL, -- 主键 UUID
    workout_session_id      TEXT    NOT NULL,             -- 当前训练会话 ID
    start_timestamp         TEXT    NOT NULL,             -- 计时开始时刻 ISO 8601
    total_duration_seconds  INTEGER NOT NULL,              -- 总倒计时时长(秒)
    is_running              INTEGER NOT NULL DEFAULT 1,    -- 是否正在运行 0/1
    updated_at              TEXT    NOT NULL               -- ISO 8601
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_training_day_plan ON training_day(plan_id);
CREATE INDEX idx_day_exercise_day ON training_day_exercise(training_day_id);
CREATE INDEX idx_day_exercise_exercise ON training_day_exercise(exercise_id);
CREATE INDEX idx_set_config_exercise ON training_day_set_config(day_exercise_id);

CREATE INDEX idx_workout_date ON workout_session(record_date);
CREATE INDEX idx_workout_type_date ON workout_session(training_type, record_date);
CREATE INDEX idx_workout_plan ON workout_session(plan_id);
CREATE INDEX idx_workout_status ON workout_session(workout_status);

CREATE INDEX idx_workout_exercise_session ON workout_exercise(workout_session_id);
CREATE INDEX idx_workout_exercise_exercise ON workout_exercise(exercise_id);

CREATE INDEX idx_set_workout_exercise ON exercise_set(workout_exercise_id, set_index);

CREATE INDEX idx_feeling_session ON workout_feeling(workout_session_id);
CREATE INDEX idx_exercise_feeling ON exercise_feeling(workout_feeling_id);

CREATE INDEX idx_pr_exercise ON personal_record(exercise_id);
CREATE INDEX idx_suggestion_exercise ON weight_suggestion(exercise_id);

CREATE INDEX idx_body_date ON body_measurement(record_date);

CREATE INDEX idx_sport_record_date ON other_sport_record(record_date);
CREATE INDEX idx_sport_record_type ON other_sport_record(sport_type_id);
CREATE INDEX idx_sport_metric_type ON other_sport_metric(sport_type_id);

-- ============================================================
-- Seed Data Reference
-- ============================================================
-- 预置动作在 App 首次启动时通过代码插入, 此处列出参考数据:

-- 核心力量举: 深蹲(weight_increment=5.0, default_rest=180), 卧推(2.5, 180), 硬拉(5.0, 180), 推举(2.5, 180)
-- 上肢推: 上斜卧推(2.5, 120), 哑铃卧推(2.5, 90), 双杠臂屈伸(2.5, 120)
-- 上肢拉: 杠铃划船(2.5, 120), 引体向上(2.5, 150), 高位下拉(2.5, 90), 哑铃划船(2.5, 90)
-- 下肢: 前蹲(2.5, 150), 腿举(5.0, 120), 罗马尼亚硬拉(2.5, 120), 腿弯举(2.5, 60)
-- 核心: 卷腹(2.5, 60), 平板支撑(5.0, 60), 健腹轮(2.5, 90)
-- 肩部: 侧平举(1.0, 60), 面拉(1.0, 60), 推举哑铃(2.5, 90)

-- 预设其他运动类型: 游泳(距离/时间/趟数), 跑步(距离/时间/配速/心率), 骑行(距离/时间/心率), 瑜伽(时长)
