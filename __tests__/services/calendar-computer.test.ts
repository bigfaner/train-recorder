/**
 * Integration tests for CalendarComputer service.
 * Tests real-time calendar computation from plan config + workout records + skip list.
 */

import { createTestDb } from "../db/test-helpers";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import {
  createWorkoutSessionRepo,
  type WorkoutSessionRepo,
} from "../../src/db/repositories/workout-session.repo";
import {
  createUserSettingsRepo,
  type UserSettingsRepo,
} from "../../src/db/repositories/user-settings.repo";
import {
  createOtherSportRepo,
  type OtherSportRepo,
} from "../../src/db/repositories/other-sport.repo";
import {
  createCalendarComputerService,
  type CalendarComputerServiceImpl,
} from "../../src/services/calendar-computer";
import type {
  TrainingPlan,
  TrainingDay,
  WorkoutSession,
  OtherSportRecord,
} from "../../src/types";

let db: DatabaseAdapter;
let sessionRepo: WorkoutSessionRepo;
let userSettingsRepo: UserSettingsRepo;
let otherSportRepo: OtherSportRepo;
let calendarService: CalendarComputerServiceImpl;

beforeEach(async () => {
  db = await createTestDb();
  sessionRepo = createWorkoutSessionRepo(db);
  userSettingsRepo = createUserSettingsRepo(db);
  otherSportRepo = createOtherSportRepo(db);
  calendarService = createCalendarComputerService(
    db,
    sessionRepo,
    userSettingsRepo,
    otherSportRepo,
  );
});

// ============================================================
// Helpers
// ============================================================

const PLAN_BIZ_KEY = 5000n;
const now = new Date().toISOString();

let bizKeyCounter = 50000n;
function nextBizKey(): bigint {
  bizKeyCounter += 1n;
  return bizKeyCounter;
}

function createPlan(
  overrides: Partial<Omit<TrainingPlan, "id">> = {},
): TrainingPlan {
  const plan = {
    biz_key: PLAN_BIZ_KEY,
    plan_name: "Test Plan",
    plan_mode: "infinite_loop" as const,
    cycle_length: null,
    schedule_mode: "weekly_fixed" as const,
    rest_days: 1,
    weekly_config: null,
    is_active: 1 as const,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
  db.runSync(
    `INSERT INTO training_plans (biz_key, plan_name, plan_mode, cycle_length, schedule_mode, rest_days, weekly_config, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(plan.biz_key),
      plan.plan_name,
      plan.plan_mode,
      plan.cycle_length,
      plan.schedule_mode,
      plan.rest_days,
      plan.weekly_config,
      plan.is_active,
      plan.created_at,
      plan.updated_at,
    ],
  );
  return db.getFirstSync<TrainingPlan>(
    `SELECT * FROM training_plans WHERE biz_key = ?`,
    [Number(plan.biz_key)],
  )!;
}

function createTrainingDay(
  overrides: Partial<Omit<TrainingDay, "id">> = {},
): TrainingDay {
  const day = {
    biz_key: nextBizKey(),
    plan_biz_key: PLAN_BIZ_KEY,
    day_name: "Push Day",
    training_type: "push" as const,
    order_index: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
  db.runSync(
    `INSERT INTO training_days (biz_key, plan_biz_key, day_name, training_type, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(day.biz_key),
      Number(day.plan_biz_key),
      day.day_name,
      day.training_type,
      day.order_index,
      day.created_at,
      day.updated_at,
    ],
  );
  return db.getFirstSync<TrainingDay>(
    `SELECT * FROM training_days WHERE biz_key = ?`,
    [Number(day.biz_key)],
  )!;
}

function createWorkoutSession(
  overrides: Partial<Omit<WorkoutSession, "id">> = {},
): WorkoutSession {
  return sessionRepo.createSession({
    biz_key: nextBizKey(),
    session_date: "2026-05-09",
    training_type: "push",
    session_status: "completed",
    started_at: now,
    ended_at: now,
    is_backlog: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  });
}

function createOtherSportRecord(
  overrides: Partial<Omit<OtherSportRecord, "id">> = {},
): OtherSportRecord {
  return otherSportRepo.createRecord({
    biz_key: nextBizKey(),
    record_date: "2026-05-09",
    sport_type_biz_key: 100n,
    sport_note: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  });
}

// ============================================================
// weekly_fixed mode
// ============================================================

describe("CalendarComputer - weekly_fixed mode", () => {
  it("should map weekday to training_day from weekly_config", async () => {
    const pushDay = createTrainingDay({
      biz_key: 101n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });
    const pullDay = createTrainingDay({
      biz_key: 102n,
      day_name: "Pull",
      training_type: "pull",
      order_index: 1,
    });
    const legsDay = createTrainingDay({
      biz_key: 103n,
      day_name: "Legs",
      training_type: "legs",
      order_index: 2,
    });

    // Mon=push(101), Wed=pull(102), Fri=legs(103), rest days Tue/Thu/Sat/Sun
    const weeklyConfig = JSON.stringify({
      1: 101, // Monday -> Push
      3: 102, // Wednesday -> Pull
      5: 103, // Friday -> Legs
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: weeklyConfig,
    });

    const days = [pushDay, pullDay, legsDay];
    // May 2026: 1st is Friday
    const result = await calendarService.computeMonth(2026, 5, plan, days);

    expect(result).toHaveLength(31);

    // Friday May 1 = legs day
    expect(result[0].date).toBe("2026-05-01");
    expect(result[0].dayType).toBe("training");
    expect(result[0].trainingDay?.day_name).toBe("Legs");

    // Saturday May 2 = rest
    expect(result[1].date).toBe("2026-05-02");
    expect(result[1].dayType).toBe("rest");
    expect(result[1].trainingDay).toBeNull();

    // Monday May 4 = push
    expect(result[3].date).toBe("2026-05-04");
    expect(result[3].dayType).toBe("training");
    expect(result[3].trainingDay?.day_name).toBe("Push");
  });

  it("should return all rest days when no weekly_config", async () => {
    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: null,
    });

    const result = await calendarService.computeMonth(2026, 5, plan, []);

    expect(result).toHaveLength(31);
    for (const day of result) {
      expect(day.dayType).toBe("rest");
    }
  });
});

// ============================================================
// fixed_interval mode
// ============================================================

describe("CalendarComputer - fixed_interval mode", () => {
  it("should cycle through training days with rest_days gaps", async () => {
    const pushDay = createTrainingDay({
      biz_key: 201n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });
    const pullDay = createTrainingDay({
      biz_key: 202n,
      day_name: "Pull",
      training_type: "pull",
      order_index: 1,
    });

    // 1 rest day between each training day
    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 1,
      weekly_config: null,
    });

    const days = [pushDay, pullDay];
    const result = await calendarService.computeMonth(2026, 5, plan, days);

    expect(result).toHaveLength(31);

    // Day 1: Push, Day 2: Rest, Day 3: Pull, Day 4: Rest, Day 5: Push, ...
    expect(result[0].dayType).toBe("training");
    expect(result[0].trainingDay?.day_name).toBe("Push");

    expect(result[1].dayType).toBe("rest");

    expect(result[2].dayType).toBe("training");
    expect(result[2].trainingDay?.day_name).toBe("Pull");

    expect(result[3].dayType).toBe("rest");

    expect(result[4].dayType).toBe("training");
    expect(result[4].trainingDay?.day_name).toBe("Push");
  });

  it("should handle 0 rest_days (consecutive training)", async () => {
    const pushDay = createTrainingDay({
      biz_key: 301n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });
    const pullDay = createTrainingDay({
      biz_key: 302n,
      day_name: "Pull",
      training_type: "pull",
      order_index: 1,
    });

    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 0,
      weekly_config: null,
    });

    const days = [pushDay, pullDay];
    const result = await calendarService.computeMonth(2026, 5, plan, days);

    // No rest days: Push, Pull, Push, Pull, ...
    expect(result[0].trainingDay?.day_name).toBe("Push");
    expect(result[1].trainingDay?.day_name).toBe("Pull");
    expect(result[2].trainingDay?.day_name).toBe("Push");
    expect(result[3].trainingDay?.day_name).toBe("Pull");
  });

  it("should handle 2 rest_days between training", async () => {
    const pushDay = createTrainingDay({
      biz_key: 401n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 2,
      weekly_config: null,
    });

    const days = [pushDay];
    const result = await calendarService.computeMonth(2026, 5, plan, days);

    // Day 1: Push, Day 2-3: Rest, Day 4: Push, Day 5-6: Rest, Day 7: Push
    expect(result[0].trainingDay?.day_name).toBe("Push");
    expect(result[1].dayType).toBe("rest");
    expect(result[2].dayType).toBe("rest");
    expect(result[3].trainingDay?.day_name).toBe("Push");
    expect(result[4].dayType).toBe("rest");
    expect(result[5].dayType).toBe("rest");
    expect(result[6].trainingDay?.day_name).toBe("Push");
  });

  it("should return all rest days when no training days", async () => {
    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 1,
      weekly_config: null,
    });

    const result = await calendarService.computeMonth(2026, 5, plan, []);

    expect(result).toHaveLength(31);
    for (const day of result) {
      expect(day.dayType).toBe("rest");
    }
  });
});

// ============================================================
// Past date with WorkoutSession
// ============================================================

describe("CalendarComputer - past dates with sessions", () => {
  it("should show completed status for past dates with completed session", async () => {
    const pushDay = createTrainingDay({
      biz_key: 501n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 501 }), // Monday = Push
    });

    // Create a completed session on Monday May 4
    createWorkoutSession({
      session_date: "2026-05-04",
      training_type: "push",
      session_status: "completed",
    });

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may4 = result.find((d) => d.date === "2026-05-04")!;
    expect(may4.dayType).toBe("completed");
    expect(may4.workoutSession).not.toBeNull();
    expect(may4.workoutSession?.session_status).toBe("completed");
  });

  it("should show completed_partial status for past dates", async () => {
    const pushDay = createTrainingDay({
      biz_key: 502n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 502 }),
    });

    createWorkoutSession({
      session_date: "2026-05-04",
      training_type: "push",
      session_status: "completed_partial",
    });

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may4 = result.find((d) => d.date === "2026-05-04")!;
    expect(may4.dayType).toBe("completed_partial");
  });

  it("should show training for past date without session but plan has training (user skipped)", async () => {
    const pushDay = createTrainingDay({
      biz_key: 503n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 503 }),
    });

    // No session created for May 4 (Monday)
    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may4 = result.find((d) => d.date === "2026-05-04")!;
    // Since May 4 is a past date and the session is missing, it should still be 'training'
    // (the UI layer will show the "补录训练" option for past dates with no session)
    expect(may4.dayType).toBe("training");
    expect(may4.workoutSession).toBeNull();
  });
});

// ============================================================
// Other sport records on correct dates
// ============================================================

describe("CalendarComputer - other sport records", () => {
  it("should show other_sport on correct dates", async () => {
    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 101 }),
    });
    const pushDay = createTrainingDay({
      biz_key: 601n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    // Create other sport on May 2 (Saturday, rest day)
    createOtherSportRecord({
      record_date: "2026-05-02",
      sport_type_biz_key: 100n,
    });

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may2 = result.find((d) => d.date === "2026-05-02")!;
    expect(may2.otherSport).not.toBeNull();
    expect(Number(may2.otherSport?.sport_type_biz_key)).toBe(100);
    // Rest day with other sport should show other_sport type
    expect(may2.dayType).toBe("other_sport");
  });
});

// ============================================================
// skipTrainingDay / unskipTrainingDay
// ============================================================

describe("CalendarComputer - skip/unskip", () => {
  it("should skip a training day and mark it as skipped", async () => {
    const pushDay = createTrainingDay({
      biz_key: 701n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 701 }), // Monday = Push
    });

    // Skip Monday May 4
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may4 = result.find((d) => d.date === "2026-05-04")!;
    expect(may4.isSkipped).toBe(true);
    expect(may4.dayType).toBe("skipped");
  });

  it("should unskip a training day and restore assignment", async () => {
    const pushDay = createTrainingDay({
      biz_key: 702n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 702 }),
    });

    // Skip then unskip
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);
    await calendarService.unskipTrainingDay("2026-05-04", PLAN_BIZ_KEY);

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may4 = result.find((d) => d.date === "2026-05-04")!;
    expect(may4.isSkipped).toBe(false);
    expect(may4.dayType).toBe("training");
  });

  it("should persist skipped dates in user_settings", async () => {
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);
    await calendarService.skipTrainingDay("2026-05-11", PLAN_BIZ_KEY);

    const skipped = await calendarService.getSkippedDates(PLAN_BIZ_KEY);
    expect(skipped).toContain("2026-05-04");
    expect(skipped).toContain("2026-05-11");
  });

  it("should remove date from skipped list on unskip", async () => {
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);
    await calendarService.skipTrainingDay("2026-05-11", PLAN_BIZ_KEY);
    await calendarService.unskipTrainingDay("2026-05-04", PLAN_BIZ_KEY);

    const skipped = await calendarService.getSkippedDates(PLAN_BIZ_KEY);
    expect(skipped).not.toContain("2026-05-04");
    expect(skipped).toContain("2026-05-11");
  });
});

// ============================================================
// getConsecutiveSkips
// ============================================================

describe("CalendarComputer - consecutive skips", () => {
  it("should return 0 when no skips", async () => {
    const count = await calendarService.getConsecutiveSkips(
      PLAN_BIZ_KEY,
      "2026-05-10",
    );
    expect(count).toBe(0);
  });

  it("should count consecutive skips before a date", async () => {
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);
    await calendarService.skipTrainingDay("2026-05-05", PLAN_BIZ_KEY);
    await calendarService.skipTrainingDay("2026-05-06", PLAN_BIZ_KEY);

    // Check consecutive skips before May 7
    const count = await calendarService.getConsecutiveSkips(
      PLAN_BIZ_KEY,
      "2026-05-07",
    );
    expect(count).toBe(3);
  });

  it("should break consecutive count on non-skipped date", async () => {
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);
    // May 5 not skipped
    await calendarService.skipTrainingDay("2026-05-06", PLAN_BIZ_KEY);
    await calendarService.skipTrainingDay("2026-05-07", PLAN_BIZ_KEY);

    const count = await calendarService.getConsecutiveSkips(
      PLAN_BIZ_KEY,
      "2026-05-08",
    );
    // Only May 6 and 7 are consecutive before May 8 (May 5 breaks the chain)
    expect(count).toBe(2);
  });

  it("should count only dates strictly before the given date", async () => {
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);
    await calendarService.skipTrainingDay("2026-05-05", PLAN_BIZ_KEY);

    const count = await calendarService.getConsecutiveSkips(
      PLAN_BIZ_KEY,
      "2026-05-05",
    );
    // Only May 4 is strictly before May 5
    expect(count).toBe(1);
  });
});

// ============================================================
// computeDay
// ============================================================

describe("CalendarComputer - computeDay", () => {
  it("should compute a single day correctly", async () => {
    const pushDay = createTrainingDay({
      biz_key: 801n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 801 }), // Monday = Push
    });

    // Monday May 4, 2026
    const result = await calendarService.computeDay("2026-05-04", plan, [
      pushDay,
    ]);

    expect(result.date).toBe("2026-05-04");
    expect(result.dayType).toBe("training");
    expect(result.trainingDay?.day_name).toBe("Push");
  });

  it("should compute a rest day correctly", async () => {
    const pushDay = createTrainingDay({
      biz_key: 802n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 802 }), // Monday = Push
    });

    // Tuesday May 5 = rest
    const result = await calendarService.computeDay("2026-05-05", plan, [
      pushDay,
    ]);

    expect(result.date).toBe("2026-05-05");
    expect(result.dayType).toBe("rest");
  });
});

// ============================================================
// getTodayPlan
// ============================================================

describe("CalendarComputer - getTodayPlan", () => {
  it("should compute today's plan", async () => {
    const pushDay = createTrainingDay({
      biz_key: 901n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 901 }),
    });

    const result = await calendarService.getTodayPlan(plan, [pushDay]);

    // Just verify it returns a valid CalendarDay
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.consecutiveSkips).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Edge cases
// ============================================================

describe("CalendarComputer - edge cases", () => {
  it("should handle February correctly (28 days)", async () => {
    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 0,
      weekly_config: null,
    });
    const pushDay = createTrainingDay({
      biz_key: 1001n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const result = await calendarService.computeMonth(2026, 2, plan, [pushDay]);
    expect(result).toHaveLength(28);
  });

  it("should handle leap year February (29 days)", async () => {
    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 0,
      weekly_config: null,
    });
    const pushDay = createTrainingDay({
      biz_key: 1002n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    // 2028 is a leap year
    const result = await calendarService.computeMonth(2028, 2, plan, [pushDay]);
    expect(result).toHaveLength(29);
  });

  it("should handle month with 31 days", async () => {
    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 1,
      weekly_config: null,
    });
    const pushDay = createTrainingDay({
      biz_key: 1003n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const result = await calendarService.computeMonth(2026, 1, plan, [pushDay]);
    expect(result).toHaveLength(31);
  });

  it("should handle completed session on a rest day", async () => {
    const pushDay = createTrainingDay({
      biz_key: 1004n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 1004 }), // Monday only
    });

    // Session on a Tuesday (rest day in plan)
    createWorkoutSession({
      session_date: "2026-05-05", // Tuesday
      training_type: "push",
      session_status: "completed",
    });

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may5 = result.find((d) => d.date === "2026-05-05")!;
    // Has a session on a rest day, but the session overrides
    expect(may5.workoutSession).not.toBeNull();
    expect(may5.dayType).toBe("completed");
  });

  it("should prioritize completed session over skipped", async () => {
    const pushDay = createTrainingDay({
      biz_key: 1005n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "weekly_fixed",
      weekly_config: JSON.stringify({ 1: 1005 }),
    });

    // Skip May 4
    await calendarService.skipTrainingDay("2026-05-04", PLAN_BIZ_KEY);

    // But also create a completed session (user un-skipped and did workout)
    createWorkoutSession({
      session_date: "2026-05-04",
      training_type: "push",
      session_status: "completed",
    });

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may4 = result.find((d) => d.date === "2026-05-04")!;
    // Session takes priority over skip
    expect(may4.dayType).toBe("completed");
  });

  it("should handle skipped date on fixed_interval mode", async () => {
    const pushDay = createTrainingDay({
      biz_key: 1006n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });

    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 1,
      weekly_config: null,
    });

    // Skip May 1 (first training day)
    await calendarService.skipTrainingDay("2026-05-01", PLAN_BIZ_KEY);

    const result = await calendarService.computeMonth(2026, 5, plan, [pushDay]);

    const may1 = result.find((d) => d.date === "2026-05-01")!;
    expect(may1.isSkipped).toBe(true);
    expect(may1.dayType).toBe("skipped");
  });

  it("should handle multiple training days cycling in fixed_interval", async () => {
    const pushDay = createTrainingDay({
      biz_key: 1101n,
      day_name: "Push",
      training_type: "push",
      order_index: 0,
    });
    const pullDay = createTrainingDay({
      biz_key: 1102n,
      day_name: "Pull",
      training_type: "pull",
      order_index: 1,
    });
    const legsDay = createTrainingDay({
      biz_key: 1103n,
      day_name: "Legs",
      training_type: "legs",
      order_index: 2,
    });

    const plan = createPlan({
      schedule_mode: "fixed_interval",
      rest_days: 1,
      weekly_config: null,
    });

    const days = [pushDay, pullDay, legsDay];
    const result = await calendarService.computeMonth(2026, 5, plan, days);

    // Push, Rest, Pull, Rest, Legs, Rest, Push, Rest, Pull, ...
    expect(result[0].trainingDay?.day_name).toBe("Push");
    expect(result[1].dayType).toBe("rest");
    expect(result[2].trainingDay?.day_name).toBe("Pull");
    expect(result[3].dayType).toBe("rest");
    expect(result[4].trainingDay?.day_name).toBe("Legs");
    expect(result[5].dayType).toBe("rest");
    expect(result[6].trainingDay?.day_name).toBe("Push");
    expect(result[7].dayType).toBe("rest");
    expect(result[8].trainingDay?.day_name).toBe("Pull");
  });
});
