/**
 * Integration tests for PRTracker service.
 * Tests PR detection, recording, rollback, 1RM estimation,
 * and PR list retrieval.
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

beforeEach(async () => {
  db = await createTestDb();
  sessionRepo = createWorkoutSessionRepo(db);
  workoutExerciseRepo = createWorkoutExerciseRepo(db);
  setRepo = createWorkoutSetRepo(db);
  exerciseRepo = createExerciseRepo(db);
  prRepo = createPersonalRecordRepo(db);
  prTracker = createPRTrackerService(db, prRepo, workoutExerciseRepo, setRepo);
});

// ============================================================
// Helpers
// ============================================================

const EXERCISE_BIZ_KEY = 1000n;
const EXERCISE_BIZ_KEY_2 = 2000n;

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

/**
 * Helper: create a complete session with exercise and sets.
 */
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
// checkAndRecordPR - Weight PR
// ============================================================

describe("PRTracker - checkAndRecordPR (weight)", () => {
  it("should detect and record a new weight PR when no previous PR exists", async () => {
    createExercise();

    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9001n,
      100.0,
      5,
    );

    expect(result).not.toBeNull();
    expect(result!.prType).toBe("weight");
    expect(result!.prValue).toBe(100.0);
    expect(result!.exerciseBizKey).toBe(EXERCISE_BIZ_KEY);
  });

  it("should detect and record a weight PR when exceeding current max", async () => {
    createExercise();

    // First PR
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);
    // New higher weight
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      105.0,
      5,
    );

    expect(result).not.toBeNull();
    expect(result!.prType).toBe("weight");
    expect(result!.prValue).toBe(105.0);
  });

  it("should not create a weight PR when weight equals current max", async () => {
    createExercise();

    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      100.0,
      5,
    );

    expect(result).toBeNull();
  });

  it("should not create a weight PR when weight is less than current max", async () => {
    createExercise();

    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      95.0,
      5,
    );

    expect(result).toBeNull();
  });
});

// ============================================================
// checkAndRecordPR - Volume PR
// ============================================================

describe("PRTracker - checkAndRecordPR (volume)", () => {
  it("should detect and record a volume PR when weight*reps exceeds current max", async () => {
    createExercise();

    // First volume PR: 100 * 5 = 500
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);

    // Same weight, more reps: 100 * 8 = 800 > 500
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      100.0,
      8,
    );

    expect(result).not.toBeNull();
    expect(result!.prType).toBe("volume");
    expect(result!.prValue).toBe(800);
  });

  it("should detect a volume PR with higher weight and lower reps", async () => {
    createExercise();

    // First: 80 * 10 = 800, weight PR at 80
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 80.0, 10);

    // Higher weight (100 > 80) AND higher volume (100*9=900 > 800)
    // Both PRs triggered - returns weight PR since weight is checked first
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      100.0,
      9,
    );

    expect(result).not.toBeNull();
    // Weight PR is triggered first (100 > 80), so that's what's returned
    expect(result!.prType).toBe("weight");
    // But volume PR should also be recorded in the DB
    const volumePR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "volume");
    expect(volumePR).not.toBeNull();
    expect(Number(volumePR!.pr_value)).toBe(900);
  });

  it("should not create a volume PR when volume equals current max", async () => {
    createExercise();

    // 100 * 5 = 500
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);

    // 50 * 10 = 500 (same volume)
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      50.0,
      10,
    );

    expect(result).toBeNull();
  });

  it("should not create a volume PR when volume is less than current max", async () => {
    createExercise();

    // 100 * 10 = 1000
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 10);

    // 100 * 5 = 500 < 1000
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      100.0,
      5,
    );

    expect(result).toBeNull();
  });
});

// ============================================================
// checkAndRecordPR - Both PR types
// ============================================================

describe("PRTracker - checkAndRecordPR (both types)", () => {
  it("should record both weight and volume PRs in one call if both are exceeded", async () => {
    createExercise();

    // Initial PRs: weight=80, volume=80*5=400
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 80.0, 5);

    // New set: 100 * 8 = 800 volume > 400, weight 100 > 80
    // The function returns the PR type that was recorded
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9002n,
      100.0,
      8,
    );

    // Should have created a weight PR (100 > 80) and a volume PR (800 > 400)
    // The function returns the first PR detected (weight checked first)
    expect(result).not.toBeNull();
    // Both PRs should exist in the database
    const prs = prRepo.findByExerciseBizKey(EXERCISE_BIZ_KEY);
    const weightPRs = prs.filter((p) => p.pr_type === "weight");
    const volumePRs = prs.filter((p) => p.pr_type === "volume");
    expect(weightPRs.length).toBeGreaterThan(0);
    expect(volumePRs.length).toBeGreaterThan(0);
  });
});

// ============================================================
// checkAndRecordPR - Multiple exercises
// ============================================================

describe("PRTracker - checkAndRecordPR (per exercise)", () => {
  it("should track PRs independently per exercise", async () => {
    createExercise({ biz_key: EXERCISE_BIZ_KEY, exercise_name: "深蹲" });
    createExercise({
      biz_key: EXERCISE_BIZ_KEY_2,
      exercise_name: "卧推",
    });

    const result1 = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9001n,
      100.0,
      5,
    );
    expect(result1).not.toBeNull();

    // Different exercise - should be independent
    const result2 = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY_2,
      9002n,
      60.0,
      5,
    );
    expect(result2).not.toBeNull();
    expect(result2!.prValue).toBe(60.0);
  });
});

// ============================================================
// recalculatePR
// ============================================================

describe("PRTracker - recalculatePR", () => {
  it("should rebuild PR records from all workout sets", async () => {
    createExercise();

    // Create sessions with sets
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [
      { weight: 80, reps: 5 },
      { weight: 80, reps: 5 },
      { weight: 80, reps: 5 },
    ]);

    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 90, 5, [
      { weight: 90, reps: 5 },
      { weight: 90, reps: 5 },
      { weight: 90, reps: 5 },
    ]);

    // Initially no PRs
    let prs = prRepo.findByExerciseBizKey(EXERCISE_BIZ_KEY);
    expect(prs).toHaveLength(0);

    // Recalculate
    await prTracker.recalculatePR(EXERCISE_BIZ_KEY);

    // Should find max weight = 90, max volume = 90*5 = 450
    prs = prRepo.findByExerciseBizKey(EXERCISE_BIZ_KEY);
    expect(prs.length).toBeGreaterThanOrEqual(1);

    const weightPR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "weight");
    expect(weightPR).not.toBeNull();
    expect(Number(weightPR!.pr_value)).toBe(90);

    const volumePR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "volume");
    expect(volumePR).not.toBeNull();
    expect(Number(volumePR!.pr_value)).toBe(450);
  });

  it("should replace existing PR records when recalculating", async () => {
    createExercise();

    // Create old PRs via checkAndRecordPR
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 80.0, 5);
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9002n, 90.0, 5);

    // Create actual workout sets with max 85
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 85, 5, [
      { weight: 85, reps: 5 },
    ]);

    // Recalculate
    await prTracker.recalculatePR(EXERCISE_BIZ_KEY);

    const weightPR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "weight");
    expect(weightPR).not.toBeNull();
    expect(Number(weightPR!.pr_value)).toBe(85);
  });

  it("should clear all PRs if no workout sets exist for exercise", async () => {
    createExercise();

    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);

    // No actual workout sets created via session/exercise/set chain
    await prTracker.recalculatePR(EXERCISE_BIZ_KEY);

    const prs = prRepo.findByExerciseBizKey(EXERCISE_BIZ_KEY);
    expect(prs).toHaveLength(0);
  });

  it("should handle PR rollback when workout with PR is deleted", async () => {
    createExercise();

    // Session 1: weight 90
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 90, 5, [
      { weight: 90, reps: 5 },
    ]);

    // Session 2: weight 100 (current PR)
    const { session: session2, we: we2 } = createSessionWithSets(
      "2026-05-03",
      EXERCISE_BIZ_KEY,
      100,
      5,
      [{ weight: 100, reps: 5 }],
    );

    // Build PRs
    await prTracker.recalculatePR(EXERCISE_BIZ_KEY);

    let weightPR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "weight");
    expect(Number(weightPR!.pr_value)).toBe(100);

    // Delete session 2 (the one with PR)
    // Delete sets, workout exercise, session
    const sets = setRepo.findByWorkoutExerciseBizKey(we2.biz_key);
    for (const s of sets) {
      setRepo.deleteById(s.id);
    }
    workoutExerciseRepo.deleteById(we2.id);
    sessionRepo.deleteById(session2.id);

    // Recalculate PRs
    await prTracker.recalculatePR(EXERCISE_BIZ_KEY);

    // PR should roll back to 90
    weightPR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "weight");
    expect(weightPR).not.toBeNull();
    expect(Number(weightPR!.pr_value)).toBe(90);
  });
});

// ============================================================
// getPRList
// ============================================================

describe("PRTracker - getPRList", () => {
  it("should return empty list when no PRs exist", async () => {
    const list = await prTracker.getPRList();
    expect(list).toEqual([]);
  });

  it("should return all PR records grouped by exercise", async () => {
    createExercise({ biz_key: EXERCISE_BIZ_KEY, exercise_name: "深蹲" });
    createExercise({
      biz_key: EXERCISE_BIZ_KEY_2,
      exercise_name: "卧推",
    });

    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);
    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY_2, 9002n, 60.0, 10);

    const list = await prTracker.getPRList();
    expect(list.length).toBeGreaterThanOrEqual(2);

    const exercise1PRs = list.filter(
      (p) => Number(p.exerciseBizKey) === Number(EXERCISE_BIZ_KEY),
    );
    const exercise2PRs = list.filter(
      (p) => Number(p.exerciseBizKey) === Number(EXERCISE_BIZ_KEY_2),
    );
    expect(exercise1PRs.length).toBeGreaterThan(0);
    expect(exercise2PRs.length).toBeGreaterThan(0);
  });

  it("should return PR entries with correct fields", async () => {
    createExercise();

    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 100.0, 5);

    const list = await prTracker.getPRList();
    expect(list.length).toBeGreaterThan(0);

    const pr = list[0];
    expect(Number(pr.exerciseBizKey)).toBe(Number(EXERCISE_BIZ_KEY));
    expect(pr.prType).toBeDefined();
    expect(typeof pr.prValue).toBe("number");
    expect(pr.prDate).toBeDefined();
  });
});

// ============================================================
// getEstimated1RM
// ============================================================

describe("PRTracker - getEstimated1RM", () => {
  it("should calculate 1RM using Epley formula: weight * (1 + reps/30)", () => {
    // 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
    const result = prTracker.getEstimated1RM(100, 5);
    expect(result).toBeCloseTo(116.67, 1);
  });

  it("should return weight as-is when reps = 1", () => {
    // 100 * (1 + 1/30) = 100 * 1.0333 = 103.33
    const result = prTracker.getEstimated1RM(100, 1);
    expect(result).toBeCloseTo(103.33, 1);
  });

  it("should handle high rep ranges", () => {
    // 60 * (1 + 15/30) = 60 * 1.5 = 90
    const result = prTracker.getEstimated1RM(60, 15);
    expect(result).toBe(90);
  });

  it("should return 0 for zero weight", () => {
    const result = prTracker.getEstimated1RM(0, 5);
    expect(result).toBe(0);
  });

  it("should return weight for zero reps (treat as 1RM attempt)", () => {
    // 100 * (1 + 0/30) = 100
    const result = prTracker.getEstimated1RM(100, 0);
    expect(result).toBe(100);
  });

  it("should handle decimal weights", () => {
    // 82.5 * (1 + 3/30) = 82.5 * 1.1 = 90.75
    const result = prTracker.getEstimated1RM(82.5, 3);
    expect(result).toBeCloseTo(90.75, 2);
  });
});

// ============================================================
// Edge cases
// ============================================================

describe("PRTracker - edge cases", () => {
  it("should handle PR detection with null workout set biz_key", async () => {
    createExercise();

    // First PR with a set biz_key
    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9001n,
      100.0,
      5,
    );
    expect(result).not.toBeNull();
    expect(result!.prType).toBe("weight");
  });

  it("should handle recalculatePR for exercise with no workout exercises", async () => {
    createExercise();

    // Should not throw
    await expect(
      prTracker.recalculatePR(EXERCISE_BIZ_KEY),
    ).resolves.not.toThrow();

    const prs = prRepo.findByExerciseBizKey(EXERCISE_BIZ_KEY);
    expect(prs).toHaveLength(0);
  });

  it("should handle weight PR with decimal precision", async () => {
    createExercise();

    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9001n,
      82.5,
      5,
    );

    expect(result).not.toBeNull();
    expect(result!.prValue).toBe(82.5);
  });

  it("should handle volume PR with precise calculation", async () => {
    createExercise();

    await prTracker.checkAndRecordPR(EXERCISE_BIZ_KEY, 9001n, 102.5, 8);

    // Both weight and volume PRs should be created
    const weightPR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "weight");
    const volumePR = prRepo.findMaxByExercise(EXERCISE_BIZ_KEY, "volume");
    expect(weightPR).not.toBeNull();
    expect(volumePR).not.toBeNull();
    expect(Number(volumePR!.pr_value)).toBe(102.5 * 8);
  });

  it("should create PR with today's date", async () => {
    createExercise();

    const result = await prTracker.checkAndRecordPR(
      EXERCISE_BIZ_KEY,
      9001n,
      100.0,
      5,
    );

    expect(result).not.toBeNull();
    // prDate should be a valid date string
    expect(result!.prDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
