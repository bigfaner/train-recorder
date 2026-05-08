/**
 * Unit tests for stats service.
 *
 * Tests pure computation logic for the stats dashboard.
 * Uses sql.js in-memory database for integration testing.
 */

import { createTestDb } from "../db/test-helpers";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import { createWorkoutSessionRepo } from "../../src/db/repositories/workout-session.repo";
import { createWorkoutSetRepo } from "../../src/db/repositories/workout-set.repo";
import { createWorkoutExerciseRepo } from "../../src/db/repositories/workout-exercise.repo";
import { createPersonalRecordRepo } from "../../src/db/repositories/personal-record.repo";
import { createExerciseRepo } from "../../src/db/repositories/exercise.repo";
import { createTrainingPlanRepo } from "../../src/db/repositories/training-plan.repo";
import { createTrainingDayRepo } from "../../src/db/repositories/training-day.repo";
import { createStatsService } from "../../src/services/stats-service";

let db: DatabaseAdapter;

function generateBizKey(): bigint {
  return BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
}

beforeEach(async () => {
  db = await createTestDb();
});

afterEach(() => {
  // Cleanup handled by GC for sql.js
});

// ============================================================
// Helper to create test data
// ============================================================

function createExercise(name: string, bizKey?: bigint) {
  const repo = createExerciseRepo(db);
  return repo.createExercise({
    biz_key: bizKey ?? generateBizKey(),
    exercise_name: name,
    category: "core_powerlifting",
    increment: 2.5,
    default_rest: 300,
    is_custom: 0,
    is_deleted: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

function createSession(
  date: string,
  startedAt: string,
  endedAt: string | null,
  status: "in_progress" | "completed" | "completed_partial" = "completed",
  bizKey?: bigint,
) {
  const repo = createWorkoutSessionRepo(db);
  return repo.createSession({
    biz_key: bizKey ?? generateBizKey(),
    session_date: date,
    training_type: "push",
    session_status: status,
    started_at: startedAt,
    ended_at: endedAt,
    is_backlog: 0,
    created_at: startedAt,
    updated_at: endedAt ?? startedAt,
  });
}

function createWorkoutExercise(
  sessionBizKey: bigint,
  exerciseBizKey: bigint,
  bizKey?: bigint,
) {
  const repo = createWorkoutExerciseRepo(db);
  return repo.createExercise({
    biz_key: bizKey ?? generateBizKey(),
    workout_session_biz_key: sessionBizKey,
    exercise_biz_key: exerciseBizKey,
    order_index: 0,
    exercise_status: "completed",
    exercise_note: null,
    suggested_weight: null,
    target_sets: 3,
    target_reps: 5,
    exercise_mode: "fixed",
    created_at: new Date().toISOString(),
  });
}

function createSet(
  workoutExerciseBizKey: bigint,
  weight: number,
  reps: number,
  completed = true,
  bizKey?: bigint,
) {
  const repo = createWorkoutSetRepo(db);
  return repo.createSet({
    biz_key: bizKey ?? generateBizKey(),
    workout_exercise_biz_key: workoutExerciseBizKey,
    set_index: 0,
    target_weight: weight,
    target_reps: reps,
    actual_weight: weight,
    actual_reps: reps,
    is_completed: completed ? 1 : 0,
    completed_at: completed ? new Date().toISOString() : null,
  });
}

function createPR(
  exerciseBizKey: bigint,
  prType: "weight" | "volume",
  value: number,
  date: string,
  setBizKey?: bigint,
) {
  const repo = createPersonalRecordRepo(db);
  return repo.createRecord({
    biz_key: generateBizKey(),
    exercise_biz_key: exerciseBizKey,
    pr_type: prType,
    pr_value: value,
    pr_date: date,
    workout_set_biz_key: setBizKey ?? null,
    created_at: new Date().toISOString(),
  });
}

function createActivePlan(weeklyConfig: Record<string, unknown> | null = null) {
  const planRepo = createTrainingPlanRepo(db);
  const plan = planRepo.createPlan({
    biz_key: generateBizKey(),
    plan_name: "Test Plan",
    plan_mode: "infinite_loop",
    cycle_length: null,
    schedule_mode: "weekly_fixed",
    rest_days: 1,
    weekly_config: weeklyConfig ? JSON.stringify(weeklyConfig) : null,
    is_active: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return planRepo.activatePlan(plan.id);
}

// ============================================================
// Tests
// ============================================================

describe("StatsService - empty state", () => {
  it("returns hasData=false when no sessions exist", () => {
    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.hasData).toBe(false);
  });

  it("returns zero values for all fields when no data", () => {
    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.heroCard.weeklyVolume).toBe(0);
    expect(data.heroCard.weeklyChangePct).toBeNull();
    expect(data.fourGrid.weeklySessions).toBe(0);
    expect(data.fourGrid.monthlySessions).toBe(0);
    expect(data.fourGrid.weeklyDurationHours).toBe(0);
    expect(data.fourGrid.monthlyPRCount).toBe(0);
    expect(data.weeklyVolumes).toHaveLength(8);
    expect(data.prRecords).toHaveLength(0);
    expect(data.frequencyHeatmap).toHaveLength(28);
  });
});

describe("StatsService - hero card", () => {
  it("computes weekly volume from completed sets", () => {
    const sessionRepo = createWorkoutSessionRepo(db);
    const ex = createExercise("深蹲");
    const session = createSession(
      "2026-05-04", // Monday of current week (if today is in this week)
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    const we = createWorkoutExercise(session.biz_key, ex.biz_key);
    createSet(we.biz_key, 100, 5);

    const service = createStatsService(
      db,
      sessionRepo,
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.hasData).toBe(true);
    // Volume = 100 * 5 = 500
    expect(data.heroCard.weeklyVolume).toBe(500);
  });

  it("shows null change percentage when last week has no data", () => {
    const session = createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    const ex = createExercise("深蹲");
    const we = createWorkoutExercise(session.biz_key, ex.biz_key);
    createSet(we.biz_key, 80, 5);

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.heroCard.weeklyChangePct).toBeNull();
  });

  it("computes week-over-week change: thisWeek/lastWeek - 1", () => {
    const sessionRepo = createWorkoutSessionRepo(db);
    const ex = createExercise("深蹲");

    // Last week session
    const lastWeekSession = createSession(
      "2026-04-27",
      "2026-04-27T10:00:00.000Z",
      "2026-04-27T11:00:00.000Z",
    );
    const we1 = createWorkoutExercise(lastWeekSession.biz_key, ex.biz_key);
    createSet(we1.biz_key, 80, 5); // volume = 400

    // This week session (higher volume)
    const thisWeekSession = createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    const we2 = createWorkoutExercise(thisWeekSession.biz_key, ex.biz_key);
    createSet(we2.biz_key, 100, 5); // volume = 500

    const service = createStatsService(
      db,
      sessionRepo,
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    // 500 / 400 - 1 = 0.25 (25% increase)
    expect(data.heroCard.weeklyChangePct).toBeCloseTo(0.25, 2);
  });
});

describe("StatsService - four grid", () => {
  it("counts weekly sessions correctly", () => {
    createExercise("深蹲");
    // Create two completed sessions this week
    createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    createSession(
      "2026-05-06",
      "2026-05-06T10:00:00.000Z",
      "2026-05-06T11:00:00.000Z",
    );
    // In-progress session should not count
    createSession(
      "2026-05-07",
      "2026-05-07T10:00:00.000Z",
      null,
      "in_progress",
    );

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.fourGrid.weeklySessions).toBe(2);
  });

  it("counts monthly sessions correctly", () => {
    createExercise("深蹲");
    // Create sessions in current month
    createSession(
      "2026-05-01",
      "2026-05-01T10:00:00.000Z",
      "2026-05-01T11:00:00.000Z",
    );
    createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.fourGrid.monthlySessions).toBe(2);
  });

  it("computes weekly duration from started_at/ended_at", () => {
    createExercise("深蹲");
    // 1 hour session
    createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    // 30 min session
    createSession(
      "2026-05-06",
      "2026-05-06T14:00:00.000Z",
      "2026-05-06T14:30:00.000Z",
    );

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.fourGrid.weeklyDurationHours).toBeCloseTo(1.5, 2);
  });

  it("counts monthly PRs correctly", () => {
    const ex = createExercise("深蹲");
    createPR(ex.biz_key, "weight", 100, "2026-05-05");
    createPR(ex.biz_key, "volume", 500, "2026-05-03");

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.fourGrid.monthlyPRCount).toBe(2);
  });

  it("gets weekly target from active plan", () => {
    // Create active plan with 3 training days per week
    createActivePlan({ "1": "day1", "3": "day2", "5": "day3" });

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.fourGrid.weeklyTarget).toBe(3);
  });
});

describe("StatsService - weekly volumes", () => {
  it("returns 8 weeks of volume data", () => {
    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.weeklyVolumes).toHaveLength(8);
  });

  it("marks current week and last week correctly", () => {
    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    const volumes = data.weeklyVolumes;
    // Last entry should be current week
    expect(volumes[7].isCurrentWeek).toBe(true);
    expect(volumes[7].isLastWeek).toBe(false);
    // Second to last should be last week
    expect(volumes[6].isCurrentWeek).toBe(false);
    expect(volumes[6].isLastWeek).toBe(true);
  });
});

describe("StatsService - PR list", () => {
  it("returns top 4 exercises with estimated 1RM", () => {
    const squat = createExercise("深蹲");
    const bench = createExercise("卧推");
    const deadlift = createExercise("硬拉");
    const press = createExercise("推举");
    const extra = createExercise("额外动作");

    // Create weight PRs
    createPR(squat.biz_key, "weight", 120, "2026-05-02");
    createPR(bench.biz_key, "weight", 80, "2026-05-05");
    createPR(deadlift.biz_key, "weight", 140, "2026-04-28");
    createPR(press.biz_key, "weight", 60, "2026-05-01");
    createPR(extra.biz_key, "weight", 50, "2026-05-03");

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.prRecords).toHaveLength(4);
    // Should be ordered by pr_value DESC (since we query with that order)
    const names = data.prRecords.map((r) => r.exerciseName);
    expect(names).toContain("深蹲");
    expect(names).toContain("卧推");
    expect(names).toContain("硬拉");
    expect(names).toContain("推举");
  });

  it("computes estimated 1RM with Epley formula", () => {
    const squat = createExercise("深蹲");

    // Create a workout set with known weight and reps
    const session = createSession(
      "2026-05-02",
      "2026-05-02T10:00:00.000Z",
      "2026-05-02T11:00:00.000Z",
    );
    const we = createWorkoutExercise(session.biz_key, squat.biz_key);
    const set = createSet(we.biz_key, 100, 5);

    // Create a weight PR pointing to this set
    createPR(squat.biz_key, "weight", 100, "2026-05-02", set.biz_key);

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.prRecords).toHaveLength(1);
    // Epley: 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
    expect(data.prRecords[0].estimated1RM).toBeCloseTo(116.67, 1);
    expect(data.prRecords[0].exerciseName).toBe("深蹲");
    expect(data.prRecords[0].date).toBe("2026-05-02");
  });
});

describe("StatsService - heatmap", () => {
  it("returns 28 days of heatmap data", () => {
    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.frequencyHeatmap).toHaveLength(28);
  });

  it("assigns rest intensity (0.1) for days with no sessions", () => {
    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    // All days should have 0.1 intensity since no sessions
    for (const day of data.frequencyHeatmap) {
      expect(day.intensity).toBe(0.1);
    }
  });

  it("assigns higher intensity for days with sessions", () => {
    const ex = createExercise("深蹲");
    const session = createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    const we = createWorkoutExercise(session.biz_key, ex.biz_key);
    createSet(we.biz_key, 100, 5);

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    // Find the day that has the session
    const sessionDay = data.frequencyHeatmap.find(
      (d) => d.date === "2026-05-04",
    );
    expect(sessionDay).toBeDefined();
    expect(sessionDay!.intensity).toBeGreaterThan(0.1);
  });
});

describe("StatsService - consecutive weeks", () => {
  it("counts consecutive weeks with sessions", () => {
    createExercise("深蹲");

    // Create sessions in multiple consecutive weeks
    // Week 1: May 4 (current week)
    createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    // Week 2: Apr 27
    createSession(
      "2026-04-27",
      "2026-04-27T10:00:00.000Z",
      "2026-04-27T11:00:00.000Z",
    );
    // Week 3: Apr 20
    createSession(
      "2026-04-20",
      "2026-04-20T10:00:00.000Z",
      "2026-04-20T11:00:00.000Z",
    );

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    expect(data.fourGrid.consecutiveWeeks).toBeGreaterThanOrEqual(3);
  });
});

describe("StatsService - 1RM estimation formula", () => {
  it("uses weight * (1 + reps / 30) formula", () => {
    // This is tested via PR list but let's be explicit
    const ex = createExercise("深蹲");
    const session = createSession(
      "2026-05-04",
      "2026-05-04T10:00:00.000Z",
      "2026-05-04T11:00:00.000Z",
    );
    const we = createWorkoutExercise(session.biz_key, ex.biz_key);
    const set = createSet(we.biz_key, 60, 10);

    createPR(ex.biz_key, "weight", 60, "2026-05-04", set.biz_key);

    const service = createStatsService(
      db,
      createWorkoutSessionRepo(db),
      createWorkoutSetRepo(db),
      createWorkoutExerciseRepo(db),
      createPersonalRecordRepo(db),
      createExerciseRepo(db),
      createTrainingPlanRepo(db),
      createTrainingDayRepo(db),
    );
    const data = service.getStatsData();
    // 60 * (1 + 10/30) = 60 * 1.333 = 80
    expect(data.prRecords[0].estimated1RM).toBeCloseTo(80, 1);
  });
});
