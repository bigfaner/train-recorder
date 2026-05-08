/**
 * Integration tests for ExerciseHistoryService.
 * Tests exercise summary, recent sessions, and session aggregation.
 */

import { createTestDb } from "../db/test-helpers";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import {
  createWorkoutSessionRepo,
  type WorkoutSessionRepo,
} from "../../src/db/repositories/workout-session.repo";
import {
  createWorkoutExerciseRepo,
  type WorkoutExerciseRepo,
} from "../../src/db/repositories/workout-exercise.repo";
import {
  createWorkoutSetRepo,
  type WorkoutSetRepo,
} from "../../src/db/repositories/workout-set.repo";
import {
  createExerciseRepo,
  type ExerciseRepo,
} from "../../src/db/repositories/exercise.repo";
import {
  createPersonalRecordRepo,
  type PersonalRecordRepo,
} from "../../src/db/repositories/personal-record.repo";
import {
  createExerciseHistoryService,
  type ExerciseHistoryServiceImpl,
} from "../../src/services/exercise-history";
import {
  createPRTrackerService,
  type PRTrackerServiceImpl,
} from "../../src/services/pr-tracker";
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  Exercise,
} from "../../src/types";

let db: DatabaseAdapter;
let sessionRepo: WorkoutSessionRepo;
let workoutExerciseRepo: WorkoutExerciseRepo;
let setRepo: WorkoutSetRepo;
let exerciseRepo: ExerciseRepo;
let prRepo: PersonalRecordRepo;
let prTracker: PRTrackerServiceImpl;
let historyService: ExerciseHistoryServiceImpl;

beforeEach(async () => {
  db = await createTestDb();
  sessionRepo = createWorkoutSessionRepo(db);
  workoutExerciseRepo = createWorkoutExerciseRepo(db);
  setRepo = createWorkoutSetRepo(db);
  exerciseRepo = createExerciseRepo(db);
  prRepo = createPersonalRecordRepo(db);
  prTracker = createPRTrackerService(db, prRepo, workoutExerciseRepo, setRepo);
  historyService = createExerciseHistoryService(
    db,
    workoutExerciseRepo,
    setRepo,
    exerciseRepo,
    prRepo,
  );
});

// ============================================================
// Helpers
// ============================================================

const EXERCISE_BIZ_KEY = 1000n;

let bizKeyCounter = 10000n;
function nextBizKey(): bigint {
  bizKeyCounter += 1n;
  return bizKeyCounter;
}

function createExercise(
  overrides: Partial<Omit<Exercise, "id">> = {},
): Exercise {
  const now = new Date().toISOString();
  return exerciseRepo.createExercise({
    biz_key: EXERCISE_BIZ_KEY,
    exercise_name: "深蹲",
    category: "core_powerlifting",
    increment: 2.5,
    default_rest: 300,
    is_custom: 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  });
}

function createSession(
  overrides: Partial<Omit<WorkoutSession, "id">> = {},
): WorkoutSession {
  const now = new Date().toISOString();
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

function createWorkoutExercise(
  overrides: Partial<Omit<WorkoutExercise, "id">> = {},
): WorkoutExercise {
  const now = new Date().toISOString();
  return workoutExerciseRepo.createExercise({
    biz_key: nextBizKey(),
    workout_session_biz_key: 1n,
    exercise_biz_key: EXERCISE_BIZ_KEY,
    order_index: 0,
    exercise_status: "completed",
    exercise_note: null,
    suggested_weight: null,
    target_sets: 3,
    target_reps: 5,
    exercise_mode: "fixed",
    created_at: now,
    ...overrides,
  });
}

function createSet(
  overrides: Partial<Omit<WorkoutSet, "id" | "is_target_met">> = {},
): WorkoutSet {
  return setRepo.createSet({
    biz_key: nextBizKey(),
    workout_exercise_biz_key: 1n,
    set_index: 0,
    target_weight: 80.0,
    target_reps: 5,
    actual_weight: null,
    actual_reps: null,
    is_completed: 0,
    completed_at: null,
    ...overrides,
  });
}

function createSessionWithSets(
  sessionDate: string,
  exerciseBizKey: bigint,
  targetWeight: number,
  targetReps: number,
  actualData: Array<{ weight: number; reps: number }>,
  options: {
    sessionStatus?: WorkoutSession["session_status"];
    exerciseStatus?: WorkoutExercise["exercise_status"];
  } = {},
): { session: WorkoutSession; we: WorkoutExercise; sets: WorkoutSet[] } {
  const { sessionStatus = "completed", exerciseStatus = "completed" } = options;
  const now = new Date().toISOString();

  const session = createSession({
    session_date: sessionDate,
    session_status: sessionStatus,
  });

  const we = createWorkoutExercise({
    workout_session_biz_key: session.biz_key,
    exercise_biz_key: exerciseBizKey,
    exercise_status: exerciseStatus,
    target_reps: targetReps,
    suggested_weight: targetWeight,
  });

  const sets: WorkoutSet[] = actualData.map((d, i) =>
    createSet({
      workout_exercise_biz_key: we.biz_key,
      set_index: i,
      target_weight: targetWeight,
      target_reps: targetReps,
      actual_weight: d.weight,
      actual_reps: d.reps,
      is_completed: 1,
      completed_at: now,
    }),
  );

  return { session, we, sets };
}

// ============================================================
// getRecentSessions
// ============================================================

describe("ExerciseHistoryService - getRecentSessions", () => {
  it("should return empty array when no sessions exist", async () => {
    createExercise();

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );
    expect(sessions).toEqual([]);
  });

  it("should return recent sessions sorted by date descending", async () => {
    createExercise();

    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [
      { weight: 80, reps: 5 },
      { weight: 80, reps: 5 },
    ]);

    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 85, 5, [
      { weight: 85, reps: 5 },
    ]);

    createSessionWithSets("2026-05-05", EXERCISE_BIZ_KEY, 90, 5, [
      { weight: 90, reps: 5 },
      { weight: 90, reps: 3 },
    ]);

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(sessions).toHaveLength(3);
    expect(sessions[0].sessionDate).toBe("2026-05-05");
    expect(sessions[1].sessionDate).toBe("2026-05-03");
    expect(sessions[2].sessionDate).toBe("2026-05-01");
  });

  it("should respect the limit parameter", async () => {
    createExercise();

    for (let i = 1; i <= 7; i++) {
      const date = `2026-05-${String(i).padStart(2, "0")}`;
      createSessionWithSets(date, EXERCISE_BIZ_KEY, 80, 5, [
        { weight: 80, reps: 5 },
      ]);
    }

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      3,
    );
    expect(sessions).toHaveLength(3);
  });

  it("should return session summaries with correct set details", async () => {
    createExercise();

    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [
      { weight: 80, reps: 5 },
      { weight: 80, reps: 4 },
      { weight: 80, reps: 5 },
    ]);

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].sets).toHaveLength(3);
    expect(sessions[0].sets[0].weight).toBe(80);
    expect(sessions[0].sets[0].reps).toBe(5);
    expect(sessions[0].sets[0].isTargetMet).toBe(true);
    expect(sessions[0].sets[1].reps).toBe(4);
    expect(sessions[0].sets[1].isTargetMet).toBe(false);
    expect(sessions[0].sets[2].isTargetMet).toBe(true);
  });

  it("should return session with workout session biz_key", async () => {
    createExercise();

    const { session } = createSessionWithSets(
      "2026-05-01",
      EXERCISE_BIZ_KEY,
      80,
      5,
      [{ weight: 80, reps: 5 }],
    );

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].workoutSessionBizKey).toBe(session.biz_key);
  });

  it("should exclude skipped exercises", async () => {
    createExercise();

    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [
      { weight: 80, reps: 5 },
    ]);

    createSessionWithSets(
      "2026-05-03",
      EXERCISE_BIZ_KEY,
      85,
      5,
      [{ weight: 85, reps: 5 }],
      { exerciseStatus: "skipped" },
    );

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionDate).toBe("2026-05-01");
  });

  it("should include exercises from in_progress sessions", async () => {
    createExercise();

    createSessionWithSets(
      "2026-05-01",
      EXERCISE_BIZ_KEY,
      80,
      5,
      [{ weight: 80, reps: 5 }],
      { sessionStatus: "in_progress" },
    );

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );

    // in_progress sessions should be included in history
    expect(sessions).toHaveLength(1);
  });

  it("should handle multiple exercises per session", async () => {
    createExercise();

    const session = createSession({ session_date: "2026-05-01" });

    // First exercise instance
    const we1 = createWorkoutExercise({
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: EXERCISE_BIZ_KEY,
    });
    createSet({
      workout_exercise_biz_key: we1.biz_key,
      set_index: 0,
      actual_weight: 80,
      actual_reps: 5,
      is_completed: 1,
      completed_at: new Date().toISOString(),
    });

    // Second exercise instance (same exercise, same session)
    const we2 = createWorkoutExercise({
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: EXERCISE_BIZ_KEY,
    });
    createSet({
      workout_exercise_biz_key: we2.biz_key,
      set_index: 0,
      actual_weight: 90,
      actual_reps: 3,
      is_completed: 1,
      completed_at: new Date().toISOString(),
    });

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );

    // Both instances should appear (grouped per workout_exercise)
    expect(sessions).toHaveLength(2);
  });
});

// ============================================================
// getExerciseSummary
// ============================================================

describe("ExerciseHistoryService - getExerciseSummary", () => {
  it("should return summary with zero counts when no history exists", async () => {
    createExercise();

    const summary = await historyService.getExerciseSummary(EXERCISE_BIZ_KEY);

    expect(summary.exerciseBizKey).toBe(EXERCISE_BIZ_KEY);
    expect(summary.exerciseName).toBe("深蹲");
    expect(summary.recentSessions).toEqual([]);
    expect(summary.personalRecords).toEqual([]);
    expect(summary.totalSessionCount).toBe(0);
  });

  it("should return recent 5 sessions", async () => {
    createExercise();

    for (let i = 1; i <= 7; i++) {
      const date = `2026-05-${String(i).padStart(2, "0")}`;
      createSessionWithSets(date, EXERCISE_BIZ_KEY, 80, 5, [
        { weight: 80, reps: 5 },
      ]);
    }

    const summary = await historyService.getExerciseSummary(EXERCISE_BIZ_KEY);

    expect(summary.recentSessions).toHaveLength(5);
    // Most recent first
    expect(summary.recentSessions[0].sessionDate).toBe("2026-05-07");
    expect(summary.recentSessions[4].sessionDate).toBe("2026-05-03");
  });

  it("should return total session count including all sessions", async () => {
    createExercise();

    for (let i = 1; i <= 7; i++) {
      const date = `2026-05-${String(i).padStart(2, "0")}`;
      createSessionWithSets(date, EXERCISE_BIZ_KEY, 80, 5, [
        { weight: 80, reps: 5 },
      ]);
    }

    const summary = await historyService.getExerciseSummary(EXERCISE_BIZ_KEY);

    expect(summary.totalSessionCount).toBe(7);
  });

  it("should include personal records in summary", async () => {
    createExercise();

    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 100, 5, [
      { weight: 100, reps: 5 },
    ]);

    // Create PRs
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);

    const summary = await historyService.getExerciseSummary(EXERCISE_BIZ_KEY);

    expect(summary.personalRecords.length).toBeGreaterThan(0);
  });

  it("should return exercise name from exercise record", async () => {
    createExercise({ exercise_name: "卧推" });

    const summary = await historyService.getExerciseSummary(EXERCISE_BIZ_KEY);

    expect(summary.exerciseName).toBe("卧推");
  });

  it("should handle exercise not found gracefully", async () => {
    const summary = await historyService.getExerciseSummary(99999n);

    expect(summary.exerciseBizKey).toBe(99999n);
    expect(summary.exerciseName).toBe("Unknown Exercise");
    expect(summary.totalSessionCount).toBe(0);
  });

  it("should count sessions correctly with skipped exercises excluded", async () => {
    createExercise();

    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [
      { weight: 80, reps: 5 },
    ]);

    createSessionWithSets(
      "2026-05-03",
      EXERCISE_BIZ_KEY,
      85,
      5,
      [{ weight: 85, reps: 5 }],
      { exerciseStatus: "skipped" },
    );

    createSessionWithSets("2026-05-05", EXERCISE_BIZ_KEY, 90, 5, [
      { weight: 90, reps: 5 },
    ]);

    const summary = await historyService.getExerciseSummary(EXERCISE_BIZ_KEY);

    // Skipped exercise should not be counted
    expect(summary.totalSessionCount).toBe(2);
    expect(summary.recentSessions).toHaveLength(2);
  });
});

// ============================================================
// Edge cases
// ============================================================

describe("ExerciseHistoryService - edge cases", () => {
  it("should handle sets with null actual values", async () => {
    createExercise();

    const session = createSession({ session_date: "2026-05-01" });
    const we = createWorkoutExercise({
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: EXERCISE_BIZ_KEY,
    });

    createSet({
      workout_exercise_biz_key: we.biz_key,
      set_index: 0,
      actual_weight: null,
      actual_reps: null,
      is_completed: 0,
    });

    const sessions = await historyService.getRecentSessions(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0].sets).toHaveLength(1);
    // Null values should be handled
    expect(sessions[0].sets[0].weight).toBe(0);
    expect(sessions[0].sets[0].reps).toBe(0);
  });

  it("should handle large number of sessions efficiently", async () => {
    createExercise();

    for (let i = 1; i <= 20; i++) {
      const date = `2026-04-${String(i).padStart(2, "0")}`;
      createSessionWithSets(date, EXERCISE_BIZ_KEY, 80, 5, [
        { weight: 80, reps: 5 },
      ]);
    }

    const summary = await historyService.getExerciseSummary(EXERCISE_BIZ_KEY);

    expect(summary.totalSessionCount).toBe(20);
    expect(summary.recentSessions).toHaveLength(5);
  });
});
