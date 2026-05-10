/**
 * Integration tests for core repositories.
 * Uses sql.js in-memory SQLite to test CRUD operations.
 */

import { createTestDb } from "../test-helpers";
import type { DatabaseAdapter } from "../../../src/db/database-adapter";
import { createBaseRepository } from "../../../src/db/repositories/base.repository";
import { createTrainingPlanRepo } from "../../../src/db/repositories/training-plan.repo";
import { createTrainingDayRepo } from "../../../src/db/repositories/training-day.repo";
import { createExerciseRepo } from "../../../src/db/repositories/exercise.repo";
import { createPlanExerciseRepo } from "../../../src/db/repositories/plan-exercise.repo";
import type { TrainingPlan } from "../../../src/types";

let db: DatabaseAdapter;

beforeEach(async () => {
  db = await createTestDb();
});

// ============================================================
// BaseRepository
// ============================================================

describe("BaseRepository", () => {
  const TABLE_NAME = "training_plans";
  // Columns for the training_plans table (excluding auto-managed fields)
  const COLUMNS = [
    "id",
    "biz_key",
    "plan_name",
    "plan_mode",
    "cycle_length",
    "schedule_mode",
    "rest_days",
    "weekly_config",
    "is_active",
    "created_at",
    "updated_at",
  ];

  it("should create and find by id", () => {
    const repo = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);
    const now = new Date().toISOString();
    const plan = repo.create({
      biz_key: 1001n,
      plan_name: "Test Plan",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });

    expect(plan.id).toBeDefined();
    expect(plan.plan_name).toBe("Test Plan");

    const found = repo.findById(plan.id);
    expect(found).not.toBeNull();
    expect(found!.plan_name).toBe("Test Plan");
  });

  it("should find by biz_key", () => {
    const repo = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);
    const now = new Date().toISOString();
    const bizKey = 2001n;
    repo.create({
      biz_key: bizKey,
      plan_name: "BizKey Test",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });

    const found = repo.findByBizKey(bizKey);
    expect(found).not.toBeNull();
    expect(Number(found!.biz_key)).toBe(Number(bizKey));
  });

  it("should return null for non-existent id", () => {
    const repo = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);
    expect(repo.findById(999)).toBeNull();
  });

  it("should return null for non-existent biz_key", () => {
    const repo = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);
    expect(repo.findByBizKey(999n)).toBeNull();
  });

  it("should find all records", () => {
    const repo = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);
    const now = new Date().toISOString();
    repo.create({
      biz_key: 3001n,
      plan_name: "Plan A",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });
    repo.create({
      biz_key: 3002n,
      plan_name: "Plan B",
      plan_mode: "fixed_cycle",
      cycle_length: 8,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });

    const all = repo.findAll();
    expect(all.length).toBe(2);
  });

  it("should update a record", () => {
    const repo = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);
    const now = new Date().toISOString();
    const plan = repo.create({
      biz_key: 4001n,
      plan_name: "Original",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });

    const updated = repo.update(plan.id, { plan_name: "Updated" });
    expect(updated.plan_name).toBe("Updated");
  });

  it("should delete a record", () => {
    const repo = createBaseRepository<TrainingPlan>(db, TABLE_NAME, COLUMNS);
    const now = new Date().toISOString();
    const plan = repo.create({
      biz_key: 5001n,
      plan_name: "To Delete",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });

    repo.deleteById(plan.id);
    expect(repo.findById(plan.id)).toBeNull();
  });
});

// ============================================================
// TrainingPlan Repository
// ============================================================

describe("TrainingPlanRepository", () => {
  it("should create a plan", () => {
    const repo = createTrainingPlanRepo(db);
    const plan = repo.createPlan({
      biz_key: 100n,
      plan_name: "Push Pull Legs",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(plan.id).toBeGreaterThan(0);
    expect(plan.plan_name).toBe("Push Pull Legs");
    expect(plan.plan_mode).toBe("infinite_loop");
  });

  it("should activate a plan and deactivate others", () => {
    const repo = createTrainingPlanRepo(db);
    const now = new Date().toISOString();

    const planA = repo.createPlan({
      biz_key: 101n,
      plan_name: "Plan A",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 1,
      created_at: now,
      updated_at: now,
    });
    const planB = repo.createPlan({
      biz_key: 102n,
      plan_name: "Plan B",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });

    // Activate plan B should deactivate plan A
    repo.activatePlan(planB.id);

    const foundA = repo.findById(planA.id);
    const foundB = repo.findById(planB.id);
    expect(foundA!.is_active).toBe(0);
    expect(foundB!.is_active).toBe(1);
  });

  it("should find the active plan", () => {
    const repo = createTrainingPlanRepo(db);
    const now = new Date().toISOString();

    repo.createPlan({
      biz_key: 103n,
      plan_name: "Inactive",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 0,
      created_at: now,
      updated_at: now,
    });
    repo.createPlan({
      biz_key: 104n,
      plan_name: "Active",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 1,
      created_at: now,
      updated_at: now,
    });

    const active = repo.findActive();
    expect(active).not.toBeNull();
    expect(active!.plan_name).toBe("Active");
  });

  it("should return null when no active plan exists", () => {
    const repo = createTrainingPlanRepo(db);
    expect(repo.findActive()).toBeNull();
  });

  it("should deactivate a plan", () => {
    const repo = createTrainingPlanRepo(db);
    const now = new Date().toISOString();

    const plan = repo.createPlan({
      biz_key: 105n,
      plan_name: "Active Plan",
      plan_mode: "infinite_loop",
      cycle_length: null,
      schedule_mode: "weekly_fixed",
      rest_days: 1,
      weekly_config: null,
      is_active: 1,
      created_at: now,
      updated_at: now,
    });

    repo.deactivatePlan(plan.id);
    const found = repo.findById(plan.id);
    expect(found!.is_active).toBe(0);
  });
});

// ============================================================
// TrainingDay Repository
// ============================================================

describe("TrainingDayRepository", () => {
  it("should create a training day", () => {
    const repo = createTrainingDayRepo(db);
    const now = new Date().toISOString();
    const day = repo.createDay({
      biz_key: 200n,
      plan_biz_key: 100n,
      day_name: "Push Day",
      training_type: "push",
      order_index: 0,
      created_at: now,
      updated_at: now,
    });

    expect(day.id).toBeGreaterThan(0);
    expect(day.day_name).toBe("Push Day");
    expect(day.training_type).toBe("push");
  });

  it("should find days by plan_biz_key", () => {
    const repo = createTrainingDayRepo(db);
    const now = new Date().toISOString();
    const planBizKey = 101n;

    repo.createDay({
      biz_key: 201n,
      plan_biz_key: planBizKey,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
      created_at: now,
      updated_at: now,
    });
    repo.createDay({
      biz_key: 202n,
      plan_biz_key: planBizKey,
      day_name: "Pull",
      training_type: "pull",
      order_index: 1,
      created_at: now,
      updated_at: now,
    });
    repo.createDay({
      biz_key: 203n,
      plan_biz_key: 999n,
      day_name: "Other",
      training_type: "custom",
      order_index: 0,
      created_at: now,
      updated_at: now,
    });

    const days = repo.findByPlanBizKey(planBizKey);
    expect(days.length).toBe(2);
    expect(days[0].order_index).toBeLessThanOrEqual(days[1].order_index);
  });

  it("should return empty array for plan with no days", () => {
    const repo = createTrainingDayRepo(db);
    const days = repo.findByPlanBizKey(999n);
    expect(days).toEqual([]);
  });

  it("should update a training day", () => {
    const repo = createTrainingDayRepo(db);
    const now = new Date().toISOString();
    const day = repo.createDay({
      biz_key: 204n,
      plan_biz_key: 100n,
      day_name: "Original",
      training_type: "push",
      order_index: 0,
      created_at: now,
      updated_at: now,
    });

    const updated = repo.update(day.id, { day_name: "Updated Day" });
    expect(updated.day_name).toBe("Updated Day");
  });
});

// ============================================================
// Exercise Repository
// ============================================================

describe("ExerciseRepository", () => {
  it("should create an exercise", () => {
    const repo = createExerciseRepo(db);
    const now = new Date().toISOString();
    const exercise = repo.createExercise({
      biz_key: 300n,
      exercise_name: "Barbell Squat",
      category: "core_powerlifting",
      increment: 2.5,
      default_rest: 300,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });

    expect(exercise.id).toBeGreaterThan(0);
    expect(exercise.exercise_name).toBe("Barbell Squat");
    expect(exercise.category).toBe("core_powerlifting");
  });

  it("should soft-delete an exercise (set is_deleted=1)", () => {
    const repo = createExerciseRepo(db);
    const now = new Date().toISOString();
    const exercise = repo.createExercise({
      biz_key: 301n,
      exercise_name: "Bench Press",
      category: "core_powerlifting",
      increment: 2.5,
      default_rest: 300,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });

    repo.softDelete(exercise.id);
    const found = repo.findById(exercise.id);
    expect(found!.is_deleted).toBe(1);
  });

  it("should findAll exclude soft-deleted exercises by default", () => {
    const repo = createExerciseRepo(db);
    const now = new Date().toISOString();

    repo.createExercise({
      biz_key: 302n,
      exercise_name: "Active",
      category: "core_powerlifting",
      increment: 2.5,
      default_rest: 300,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });
    const deleted = repo.createExercise({
      biz_key: 303n,
      exercise_name: "Deleted",
      category: "core_powerlifting",
      increment: 2.5,
      default_rest: 300,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });
    repo.softDelete(deleted.id);

    const active = repo.findAllActive();
    expect(active.length).toBe(1);
    expect(active[0].exercise_name).toBe("Active");
  });

  it("should find exercises by category", () => {
    const repo = createExerciseRepo(db);
    const now = new Date().toISOString();

    repo.createExercise({
      biz_key: 304n,
      exercise_name: "Squat",
      category: "core_powerlifting",
      increment: 2.5,
      default_rest: 300,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });
    repo.createExercise({
      biz_key: 305n,
      exercise_name: "Pull-up",
      category: "upper_pull",
      increment: 2.5,
      default_rest: 240,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });

    const core = repo.findByCategory("core_powerlifting");
    expect(core.length).toBe(1);
    expect(core[0].exercise_name).toBe("Squat");
  });

  it("findByCategory should exclude soft-deleted", () => {
    const repo = createExerciseRepo(db);
    const now = new Date().toISOString();

    const ex = repo.createExercise({
      biz_key: 306n,
      exercise_name: "Deadlift",
      category: "core_powerlifting",
      increment: 2.5,
      default_rest: 300,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });
    repo.softDelete(ex.id);

    const core = repo.findByCategory("core_powerlifting");
    expect(core.length).toBe(0);
  });

  it("should update an exercise", () => {
    const repo = createExerciseRepo(db);
    const now = new Date().toISOString();
    const exercise = repo.createExercise({
      biz_key: 307n,
      exercise_name: "OHP",
      category: "shoulder",
      increment: 2.5,
      default_rest: 180,
      is_custom: 0,
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    });

    const updated = repo.update(exercise.id, { increment: 5.0 });
    expect(updated.increment).toBe(5.0);
  });
});

// ============================================================
// PlanExercise Repository
// ============================================================

describe("PlanExerciseRepository", () => {
  it("should create a plan exercise", () => {
    const repo = createPlanExerciseRepo(db);
    const now = new Date().toISOString();
    const setsConfig = JSON.stringify({
      mode: "fixed",
      target_reps: 5,
      target_weight: 80.0,
      target_repeat: 5,
    });

    const pe = repo.createPlanExercise({
      biz_key: 400n,
      training_day_biz_key: 200n,
      exercise_biz_key: 300n,
      sets_config: setsConfig,
      order_index: 0,
      exercise_note: null,
      created_at: now,
      updated_at: now,
    });

    expect(pe.id).toBeGreaterThan(0);
    expect(pe.sets_config).toBe(setsConfig);
  });

  it("should find by training_day_biz_key", () => {
    const repo = createPlanExerciseRepo(db);
    const now = new Date().toISOString();
    const dayBizKey = 201n;

    repo.createPlanExercise({
      biz_key: 401n,
      training_day_biz_key: dayBizKey,
      exercise_biz_key: 300n,
      sets_config:
        '{"mode":"fixed","target_reps":5,"target_weight":80,"target_repeat":5}',
      order_index: 0,
      exercise_note: null,
      created_at: now,
      updated_at: now,
    });
    repo.createPlanExercise({
      biz_key: 402n,
      training_day_biz_key: dayBizKey,
      exercise_biz_key: 301n,
      sets_config:
        '{"mode":"fixed","target_reps":8,"target_weight":60,"target_repeat":3}',
      order_index: 1,
      exercise_note: null,
      created_at: now,
      updated_at: now,
    });
    repo.createPlanExercise({
      biz_key: 403n,
      training_day_biz_key: 999n,
      exercise_biz_key: 302n,
      sets_config:
        '{"mode":"fixed","target_reps":5,"target_weight":100,"target_repeat":5}',
      order_index: 0,
      exercise_note: null,
      created_at: now,
      updated_at: now,
    });

    const exercises = repo.findByTrainingDayBizKey(dayBizKey);
    expect(exercises.length).toBe(2);
  });

  it("should serialize sets_config on write and preserve on read", () => {
    const repo = createPlanExerciseRepo(db);
    const now = new Date().toISOString();
    const config = {
      mode: "custom" as const,
      sets: [
        { target_reps: 5, target_weight: 100 },
        { target_reps: 3, target_weight: 120 },
      ],
    };

    const pe = repo.createPlanExercise({
      biz_key: 404n,
      training_day_biz_key: 202n,
      exercise_biz_key: 303n,
      sets_config: JSON.stringify(config),
      order_index: 0,
      exercise_note: "Pause squat",
      created_at: now,
      updated_at: now,
    });

    const found = repo.findById(pe.id);
    const parsed = JSON.parse(found!.sets_config);
    expect(parsed.mode).toBe("custom");
    expect(parsed.sets.length).toBe(2);
    expect(parsed.sets[0].target_weight).toBe(100);
  });

  it("should update a plan exercise", () => {
    const repo = createPlanExerciseRepo(db);
    const now = new Date().toISOString();
    const pe = repo.createPlanExercise({
      biz_key: 405n,
      training_day_biz_key: 203n,
      exercise_biz_key: 304n,
      sets_config:
        '{"mode":"fixed","target_reps":5,"target_weight":80,"target_repeat":5}',
      order_index: 0,
      exercise_note: null,
      created_at: now,
      updated_at: now,
    });

    const newConfig = JSON.stringify({
      mode: "fixed",
      target_reps: 3,
      target_weight: 100,
      target_repeat: 5,
    });
    const updated = repo.update(pe.id, {
      sets_config: newConfig,
      exercise_note: "Heavy day",
    });
    expect(updated.exercise_note).toBe("Heavy day");
    const parsed = JSON.parse(updated.sets_config);
    expect(parsed.target_weight).toBe(100);
  });

  it("should return empty array for day with no exercises", () => {
    const repo = createPlanExerciseRepo(db);
    const exercises = repo.findByTrainingDayBizKey(999n);
    expect(exercises).toEqual([]);
  });
});
