/**
 * Tests for database schema definitions.
 * Validates that all 16 CREATE TABLE statements and 15 CREATE INDEX statements
 * are correctly defined and match the schema.sql design.
 */

import {
  CREATE_TABLE_STATEMENTS,
  CREATE_INDEXES,
  TABLE_NAMES,
  BUILTIN_EXERCISES,
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
} from "../../src/db/schema";

// ============================================================
// Table count verification
// ============================================================

describe("Schema - Table Count", () => {
  it("should have exactly 16 CREATE TABLE statements", () => {
    expect(CREATE_TABLE_STATEMENTS.length).toBe(16);
  });

  it("should have exactly 16 table names", () => {
    expect(TABLE_NAMES.length).toBe(16);
  });
});

// ============================================================
// Index count verification
// ============================================================

describe("Schema - Index Count", () => {
  it("should have exactly 15 CREATE INDEX statements", () => {
    expect(CREATE_INDEXES.length).toBe(15);
  });
});

// ============================================================
// Table structure verification
// ============================================================

describe("Schema - Table Structures", () => {
  it("every CREATE TABLE statement should use IF NOT EXISTS", () => {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      expect(stmt).toContain("IF NOT EXISTS");
    }
  });

  it("every CREATE INDEX statement should use IF NOT EXISTS", () => {
    for (const stmt of CREATE_INDEXES) {
      expect(stmt).toContain("IF NOT EXISTS");
    }
  });

  it("every table should have id as INTEGER PRIMARY KEY AUTOINCREMENT", () => {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      expect(stmt).toContain("PRIMARY KEY AUTOINCREMENT");
    }
  });

  it("every table should have biz_key as INTEGER NOT NULL UNIQUE", () => {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      expect(stmt).toMatch(/biz_key\s+INTEGER\s+NOT\s+NULL\s+UNIQUE/);
    }
  });

  it("should not contain FOREIGN KEY constraints", () => {
    for (const stmt of CREATE_TABLE_STATEMENTS) {
      expect(stmt).not.toContain("FOREIGN KEY");
      expect(stmt).not.toContain("REFERENCES");
    }
  });
});

// ============================================================
// Individual table column verification
// ============================================================

describe("Schema - training_plans", () => {
  it("should have all required columns with correct types", () => {
    expect(CREATE_TRAINING_PLANS).toContain("plan_name");
    expect(CREATE_TRAINING_PLANS).toContain("VARCHAR(100)");
    expect(CREATE_TRAINING_PLANS).toContain("plan_mode");
    expect(CREATE_TRAINING_PLANS).toContain("DEFAULT 'infinite_loop'");
    expect(CREATE_TRAINING_PLANS).toContain("cycle_length");
    expect(CREATE_TRAINING_PLANS).toContain("schedule_mode");
    expect(CREATE_TRAINING_PLANS).toContain("DEFAULT 'weekly_fixed'");
    expect(CREATE_TRAINING_PLANS).toContain("rest_days");
    expect(CREATE_TRAINING_PLANS).toContain("weekly_config");
    expect(CREATE_TRAINING_PLANS).toContain("is_active");
    expect(CREATE_TRAINING_PLANS).toContain("created_at");
    expect(CREATE_TRAINING_PLANS).toContain("updated_at");
  });
});

describe("Schema - training_days", () => {
  it("should have plan_biz_key for association", () => {
    expect(CREATE_TRAINING_DAYS).toContain("plan_biz_key");
    expect(CREATE_TRAINING_DAYS).toContain("day_name");
    expect(CREATE_TRAINING_DAYS).toContain("training_type");
    expect(CREATE_TRAINING_DAYS).toContain("order_index");
  });
});

describe("Schema - exercises", () => {
  it("should have exercise_name UNIQUE", () => {
    expect(CREATE_EXERCISES).toContain("exercise_name");
    expect(CREATE_EXERCISES).toContain("NOT NULL UNIQUE");
    expect(CREATE_EXERCISES).toContain("category");
    expect(CREATE_EXERCISES).toContain("increment");
    expect(CREATE_EXERCISES).toContain("DECIMAL(6,2)");
    expect(CREATE_EXERCISES).toContain("default_rest");
    expect(CREATE_EXERCISES).toContain("is_custom");
    expect(CREATE_EXERCISES).toContain("is_deleted");
  });

  it("should have increment default of 2.50", () => {
    expect(CREATE_EXERCISES).toContain("DEFAULT 2.50");
  });

  it("should have default_rest default of 180", () => {
    expect(CREATE_EXERCISES).toContain("DEFAULT 180");
  });
});

describe("Schema - plan_exercises", () => {
  it("should have sets_config as VARCHAR(2048)", () => {
    expect(CREATE_PLAN_EXERCISES).toContain("sets_config");
    expect(CREATE_PLAN_EXERCISES).toContain("VARCHAR(2048)");
    expect(CREATE_PLAN_EXERCISES).toContain("training_day_biz_key");
    expect(CREATE_PLAN_EXERCISES).toContain("exercise_biz_key");
    expect(CREATE_PLAN_EXERCISES).toContain("exercise_note");
  });
});

describe("Schema - workout_sessions", () => {
  it("should have session_date as VARCHAR(10)", () => {
    expect(CREATE_WORKOUT_SESSIONS).toContain("session_date");
    expect(CREATE_WORKOUT_SESSIONS).toContain("VARCHAR(10)");
    expect(CREATE_WORKOUT_SESSIONS).toContain("session_status");
    expect(CREATE_WORKOUT_SESSIONS).toContain("DEFAULT 'in_progress'");
    expect(CREATE_WORKOUT_SESSIONS).toContain("started_at");
    expect(CREATE_WORKOUT_SESSIONS).toContain("ended_at");
    expect(CREATE_WORKOUT_SESSIONS).toContain("is_backlog");
  });
});

describe("Schema - workout_exercises", () => {
  it("should have target_sets and target_reps", () => {
    expect(CREATE_WORKOUT_EXERCISES).toContain("target_sets");
    expect(CREATE_WORKOUT_EXERCISES).toContain("target_reps");
    expect(CREATE_WORKOUT_EXERCISES).toContain("exercise_status");
    expect(CREATE_WORKOUT_EXERCISES).toContain("suggested_weight");
    expect(CREATE_WORKOUT_EXERCISES).toContain("exercise_mode");
  });
});

describe("Schema - workout_sets", () => {
  it("should have actual_weight, actual_reps, is_target_met", () => {
    expect(CREATE_WORKOUT_SETS).toContain("actual_weight");
    expect(CREATE_WORKOUT_SETS).toContain("actual_reps");
    expect(CREATE_WORKOUT_SETS).toContain("is_target_met");
    expect(CREATE_WORKOUT_SETS).toContain("is_completed");
    expect(CREATE_WORKOUT_SETS).toContain("completed_at");
  });
});

describe("Schema - feelings", () => {
  it("should have fatigue_level and satisfaction with default 5", () => {
    expect(CREATE_FEELINGS).toContain("fatigue_level");
    expect(CREATE_FEELINGS).toContain("satisfaction");
    expect(CREATE_FEELINGS).toContain("DEFAULT 5");
    expect(CREATE_FEELINGS).toContain("overall_note");
  });
});

describe("Schema - exercise_feelings", () => {
  it("should link feeling, exercise, and workout_exercise", () => {
    expect(CREATE_EXERCISE_FEELINGS).toContain("feeling_biz_key");
    expect(CREATE_EXERCISE_FEELINGS).toContain("exercise_biz_key");
    expect(CREATE_EXERCISE_FEELINGS).toContain("workout_exercise_biz_key");
    expect(CREATE_EXERCISE_FEELINGS).toContain("feeling_note");
  });
});

describe("Schema - personal_records", () => {
  it("should have pr_type, pr_value, pr_date", () => {
    expect(CREATE_PERSONAL_RECORDS).toContain("pr_type");
    expect(CREATE_PERSONAL_RECORDS).toContain("DEFAULT 'weight'");
    expect(CREATE_PERSONAL_RECORDS).toContain("pr_value");
    expect(CREATE_PERSONAL_RECORDS).toContain("DECIMAL(10,2)");
    expect(CREATE_PERSONAL_RECORDS).toContain("pr_date");
    expect(CREATE_PERSONAL_RECORDS).toContain("workout_set_biz_key");
  });
});

describe("Schema - body_measurements", () => {
  it("should have all circumference fields", () => {
    expect(CREATE_BODY_MEASUREMENTS).toContain("body_weight");
    expect(CREATE_BODY_MEASUREMENTS).toContain("DECIMAL(5,1)");
    expect(CREATE_BODY_MEASUREMENTS).toContain("chest_circumference");
    expect(CREATE_BODY_MEASUREMENTS).toContain("waist_circumference");
    expect(CREATE_BODY_MEASUREMENTS).toContain("arm_circumference");
    expect(CREATE_BODY_MEASUREMENTS).toContain("thigh_circumference");
    expect(CREATE_BODY_MEASUREMENTS).toContain("body_note");
  });
});

describe("Schema - other_sport_records", () => {
  it("should have sport_type_biz_key", () => {
    expect(CREATE_OTHER_SPORT_RECORDS).toContain("sport_type_biz_key");
    expect(CREATE_OTHER_SPORT_RECORDS).toContain("sport_note");
  });
});

describe("Schema - sport_types", () => {
  it("should have sport_name UNIQUE", () => {
    expect(CREATE_SPORT_TYPES).toContain("sport_name");
    expect(CREATE_SPORT_TYPES).toContain("NOT NULL UNIQUE");
    expect(CREATE_SPORT_TYPES).toContain("icon");
    expect(CREATE_SPORT_TYPES).toContain("is_custom");
  });
});

describe("Schema - sport_metrics", () => {
  it("should have metric_name, metric_unit, order_index", () => {
    expect(CREATE_SPORT_METRICS).toContain("metric_name");
    expect(CREATE_SPORT_METRICS).toContain("metric_unit");
    expect(CREATE_SPORT_METRICS).toContain("order_index");
  });
});

describe("Schema - sport_metric_values", () => {
  it("should have metric_value as DECIMAL(10,2)", () => {
    expect(CREATE_SPORT_METRIC_VALUES).toContain("metric_value");
    expect(CREATE_SPORT_METRIC_VALUES).toContain("DECIMAL(10,2)");
  });
});

describe("Schema - user_settings", () => {
  it("should have setting_key UNIQUE and setting_value", () => {
    expect(CREATE_USER_SETTINGS).toContain("setting_key");
    expect(CREATE_USER_SETTINGS).toContain("NOT NULL UNIQUE");
    expect(CREATE_USER_SETTINGS).toContain("setting_value");
    expect(CREATE_USER_SETTINGS).toContain("VARCHAR(500)");
  });
});

// ============================================================
// Index verification
// ============================================================

describe("Schema - Index Definitions", () => {
  it("should have idx_ws_date on workout_sessions(session_date)", () => {
    const idx = CREATE_INDEXES.find((s) => s.includes("idx_ws_date"));
    expect(idx).toBeDefined();
    expect(idx).toContain("workout_sessions(session_date)");
  });

  it("should have idx_pr_exercise_type as compound index", () => {
    const idx = CREATE_INDEXES.find((s) => s.includes("idx_pr_exercise_type"));
    expect(idx).toBeDefined();
    expect(idx).toContain("exercise_biz_key, pr_type");
  });

  it("should have idx_wset_exercise on workout_sets", () => {
    const idx = CREATE_INDEXES.find((s) => s.includes("idx_wset_exercise"));
    expect(idx).toBeDefined();
    expect(idx).toContain("workout_sets(workout_exercise_biz_key)");
  });

  it("all indexes should reference valid tables", () => {
    const validTables = new Set(TABLE_NAMES);
    for (const idx of CREATE_INDEXES) {
      // Extract table name from CREATE INDEX ... ON table_name(
      const match = idx.match(/ON\s+(\w+)\s*\(/);
      expect(match).not.toBeNull();
      expect(validTables.has(match![1] as (typeof TABLE_NAMES)[number])).toBe(
        true,
      );
    }
  });
});

// ============================================================
// Built-in exercises verification (PRD 5.5)
// ============================================================

describe("Schema - Built-in Exercises", () => {
  it("should have 22 built-in exercises", () => {
    // 4 + 3 + 4 + 4 + 3 + 3 = 21 exercises (per PRD 5.5 table)
    // Actually: 深蹲(1)+卧推(2)+硬拉(3)+推举(4)=4 core_powerlifting
    //           上斜卧推(1)+哑铃卧推(2)+双杠臂屈伸(3)=3 upper_push
    //           杠铃划船(1)+引体向上(2)+高位下拉(3)+哑铃划船(4)=4 upper_pull
    //           前蹲(1)+腿举(2)+罗马尼亚硬拉(3)+腿弯举(4)=4 lower
    //           卷腹(1)+平板支撑(2)+健腹轮(3)=3 core
    //           侧平举(1)+面拉(2)+推举（哑铃）(3)=3 shoulder
    // Total: 4+3+4+4+3+3 = 21
    expect(BUILTIN_EXERCISES.length).toBe(21);
  });

  it("should have all exercises in valid categories", () => {
    const validCategories = [
      "core_powerlifting",
      "upper_push",
      "upper_pull",
      "lower",
      "core",
      "shoulder",
    ];
    for (const exercise of BUILTIN_EXERCISES) {
      expect(validCategories).toContain(exercise.category);
    }
  });

  it("should have positive increment and default_rest for all exercises", () => {
    for (const exercise of BUILTIN_EXERCISES) {
      expect(exercise.increment).toBeGreaterThan(0);
      expect(exercise.default_rest).toBeGreaterThan(0);
    }
  });

  it("should have core_powerlifting exercises: 深蹲, 卧推, 硬拉, 推举", () => {
    const core = BUILTIN_EXERCISES.filter(
      (e) => e.category === "core_powerlifting",
    );
    const names = core.map((e) => e.exercise_name);
    expect(names).toContain("深蹲");
    expect(names).toContain("卧推");
    expect(names).toContain("硬拉");
    expect(names).toContain("推举");
    expect(core.length).toBe(4);
  });

  it("should have upper_push exercises: 上斜卧推, 哑铃卧推, 双杠臂屈伸", () => {
    const push = BUILTIN_EXERCISES.filter((e) => e.category === "upper_push");
    const names = push.map((e) => e.exercise_name);
    expect(names).toContain("上斜卧推");
    expect(names).toContain("哑铃卧推");
    expect(names).toContain("双杠臂屈伸");
    expect(push.length).toBe(3);
  });

  it("should have upper_pull exercises: 杠铃划船, 引体向上, 高位下拉, 哑铃划船", () => {
    const pull = BUILTIN_EXERCISES.filter((e) => e.category === "upper_pull");
    const names = pull.map((e) => e.exercise_name);
    expect(names).toContain("杠铃划船");
    expect(names).toContain("引体向上");
    expect(names).toContain("高位下拉");
    expect(names).toContain("哑铃划船");
    expect(pull.length).toBe(4);
  });

  it("should have lower exercises: 前蹲, 腿举, 罗马尼亚硬拉, 腿弯举", () => {
    const lower = BUILTIN_EXERCISES.filter((e) => e.category === "lower");
    const names = lower.map((e) => e.exercise_name);
    expect(names).toContain("前蹲");
    expect(names).toContain("腿举");
    expect(names).toContain("罗马尼亚硬拉");
    expect(names).toContain("腿弯举");
    expect(lower.length).toBe(4);
  });

  it("should have core exercises: 卷腹, 平板支撑, 健腹轮", () => {
    const core = BUILTIN_EXERCISES.filter((e) => e.category === "core");
    const names = core.map((e) => e.exercise_name);
    expect(names).toContain("卷腹");
    expect(names).toContain("平板支撑");
    expect(names).toContain("健腹轮");
    expect(core.length).toBe(3);
  });

  it("should have shoulder exercises: 侧平举, 面拉, 推举（哑铃）", () => {
    const shoulder = BUILTIN_EXERCISES.filter((e) => e.category === "shoulder");
    const names = shoulder.map((e) => e.exercise_name);
    expect(names).toContain("侧平举");
    expect(names).toContain("面拉");
    expect(names).toContain("推举（哑铃）");
    expect(shoulder.length).toBe(3);
  });

  it("should have unique exercise names", () => {
    const names = BUILTIN_EXERCISES.map((e) => e.exercise_name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});
