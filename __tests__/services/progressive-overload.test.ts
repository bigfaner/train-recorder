/**
 * Integration tests for ProgressiveOverload service.
 * Tests the progressive overload suggestion algorithm that calculates
 * weight recommendations for each exercise based on historical performance.
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
  createProgressiveOverloadService,
  type ProgressiveOverloadServiceImpl,
} from "../../src/services/progressive-overload";
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
let overloadService: ProgressiveOverloadServiceImpl;

beforeEach(async () => {
  db = await createTestDb();
  sessionRepo = createWorkoutSessionRepo(db);
  workoutExerciseRepo = createWorkoutExerciseRepo(db);
  setRepo = createWorkoutSetRepo(db);
  exerciseRepo = createExerciseRepo(db);
  overloadService = createProgressiveOverloadService(
    db,
    workoutExerciseRepo,
    setRepo,
    exerciseRepo,
  );
});

// ============================================================
// Helpers
// ============================================================

const EXERCISE_BIZ_KEY = 1000n;
const EXERCISE_INCREMENT = 2.5;

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
    increment: EXERCISE_INCREMENT,
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
 * Returns the WorkoutExercise created.
 */
function createSessionWithSets(
  sessionDate: string,
  exerciseBizKey: bigint,
  targetWeight: number,
  targetReps: number,
  actualReps: number[], // per set, if element is null then set has no actual_reps
  options: {
    sessionStatus?: WorkoutSession["session_status"];
    exerciseStatus?: WorkoutExercise["exercise_status"];
    targetSets?: number;
  } = {},
): { session: WorkoutSession; we: WorkoutExercise; sets: WorkoutSet[] } {
  const {
    sessionStatus = "completed",
    exerciseStatus = "completed",
    targetSets = actualReps.length,
  } = options;
  const now = new Date().toISOString();

  const session = createSession({
    session_date: sessionDate,
    session_status: sessionStatus,
  });

  const we = createWorkoutExercise({
    workout_session_biz_key: session.biz_key,
    exercise_biz_key: exerciseBizKey,
    exercise_status: exerciseStatus,
    target_sets: targetSets,
    target_reps: targetReps,
    suggested_weight: targetWeight,
  });

  const sets: WorkoutSet[] = actualReps.map((reps, i) =>
    createSet({
      workout_exercise_biz_key: we.biz_key,
      set_index: i,
      target_weight: targetWeight,
      target_reps: targetReps,
      actual_weight: reps !== null ? targetWeight : null,
      actual_reps: reps,
      is_completed: reps !== null ? 1 : 0,
      completed_at: reps !== null ? now : null,
    }),
  );

  return { session, we, sets };
}

// ============================================================
// calculateSuggestion
// ============================================================

describe("ProgressiveOverload - calculateSuggestion", () => {
  it("should return no-history suggestion when no workout exercises exist", async () => {
    createExercise();

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.suggestedWeight).toBeNull();
    expect(suggestion.previousWeight).toBeNull();
    expect(suggestion.direction).toBe("increase");
    expect(suggestion.consecutiveCompleted).toBe(0);
    expect(suggestion.consecutiveMissed).toBe(0);
    expect(suggestion.reason).toContain("首次");
  });

  it("should return no-history suggestion when only skipped exercises exist", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5], {
      exerciseStatus: "skipped",
    });

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.suggestedWeight).toBeNull();
    expect(suggestion.consecutiveCompleted).toBe(0);
  });

  it("should suggest increase when all sets met", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("increase");
    expect(suggestion.suggestedWeight).toBe(82.5);
    expect(suggestion.previousWeight).toBe(80);
    expect(suggestion.increment).toBe(2.5);
    expect(suggestion.consecutiveCompleted).toBe(1);
    expect(suggestion.consecutiveMissed).toBe(0);
  });

  it("should suggest maintain when some sets missed", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 4, 3]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("maintain");
    expect(suggestion.suggestedWeight).toBe(80);
    expect(suggestion.previousWeight).toBe(80);
    expect(suggestion.consecutiveCompleted).toBe(0);
    expect(suggestion.consecutiveMissed).toBe(1);
  });

  it("should suggest decrease when 2 consecutive sessions missed", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [4, 3, 5]);
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 80, 5, [3, 4, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("decrease");
    // 80 * 0.9 = 72.0, Math.round(72.0 / 2.5) * 2.5 = 72.5
    expect(suggestion.suggestedWeight).toBe(72.5);
    expect(suggestion.previousWeight).toBe(80);
    expect(suggestion.consecutiveCompleted).toBe(0);
    expect(suggestion.consecutiveMissed).toBe(2);
    expect(suggestion.reason).toContain("减重");
  });

  it("should suggest increase after a successful session following misses", async () => {
    createExercise();
    // Session 1: missed
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [4, 3, 5]);
    // Session 2: all met - breaks the miss streak
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("increase");
    expect(suggestion.suggestedWeight).toBe(82.5);
    expect(suggestion.consecutiveCompleted).toBe(1);
    expect(suggestion.consecutiveMissed).toBe(0);
  });

  it("should show 3 consecutive completed hint", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 77.5, 5, [5, 5, 5]);
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);
    createSessionWithSets("2026-05-05", EXERCISE_BIZ_KEY, 82.5, 5, [5, 5, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("increase");
    expect(suggestion.consecutiveCompleted).toBe(3);
    expect(suggestion.reason).toContain("加大增量");
  });

  it("should use exercise.increment for weight increase", async () => {
    createExercise({ increment: 5.0 });
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("increase");
    expect(suggestion.suggestedWeight).toBe(85);
    expect(suggestion.increment).toBe(5.0);
  });

  it("should round decrease value to nearest plate combination", async () => {
    createExercise({ increment: 2.5 });
    // 81.25 * 0.9 = 73.125 -> rounded to nearest 2.5 = 72.5
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 81.25, 5, [4, 3, 5]);
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 81.25, 5, [3, 4, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("decrease");
    // 81.25 * 0.9 = 73.125, rounded to nearest 2.5 = 72.5
    expect(suggestion.suggestedWeight).toBe(72.5);
  });

  it("should exclude skipped exercises from overload (US-16)", async () => {
    createExercise();
    // Skipped exercise should be ignored
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5], {
      exerciseStatus: "skipped",
    });

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.suggestedWeight).toBeNull();
    expect(suggestion.consecutiveCompleted).toBe(0);
  });

  it("should exclude exercises from incomplete sessions (US-10)", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5], {
      sessionStatus: "in_progress",
    });

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    // In-progress session exercises should be excluded
    expect(suggestion.suggestedWeight).toBeNull();
  });

  it("should handle same exercise appearing multiple times independently (US-17)", async () => {
    createExercise();
    // Prior session with all met - gives a base history
    createSessionWithSets("2026-04-28", EXERCISE_BIZ_KEY, 77.5, 5, [5, 5, 5]);

    // Current session with same exercise twice
    // First occurrence - all met
    const { we: we1 } = createSessionWithSets(
      "2026-05-01",
      EXERCISE_BIZ_KEY,
      80,
      5,
      [5, 5, 5],
    );

    // Second occurrence in same session - some missed
    const session = createSession({
      session_date: "2026-05-01",
    });
    const now = new Date().toISOString();
    const we2 = createWorkoutExercise({
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: EXERCISE_BIZ_KEY,
      exercise_status: "completed",
      target_sets: 3,
      target_reps: 5,
      suggested_weight: 80,
    });
    for (let i = 0; i < 3; i++) {
      createSet({
        workout_exercise_biz_key: we2.biz_key,
        set_index: i,
        target_weight: 80,
        target_reps: 5,
        actual_weight: i < 2 ? 80 : 80,
        actual_reps: i < 2 ? 5 : 3,
        is_completed: 1,
        completed_at: now,
      });
    }

    // Calculate for first occurrence - prior session all met -> increase
    const suggestion1 =
      await overloadService.calculateSuggestionForWorkoutExercise(
        we1.biz_key,
        5,
      );
    expect(suggestion1.direction).toBe("increase");

    // Calculate for second occurrence - prior session all met -> increase
    // (both see the same prior history independently)
    const suggestion2 =
      await overloadService.calculateSuggestionForWorkoutExercise(
        we2.biz_key,
        5,
      );
    expect(suggestion2.direction).toBe("increase");
    expect(suggestion2.suggestedWeight).toBe(80);
  });

  it("should use most recent completed session for previousWeight", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 77.5, 5, [5, 5, 5]);
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);
    createSessionWithSets("2026-05-05", EXERCISE_BIZ_KEY, 82.5, 5, [5, 5, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.previousWeight).toBe(82.5);
    expect(suggestion.suggestedWeight).toBe(85);
  });

  it("should handle partial sessions (completed_partial) in overload", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5], {
      sessionStatus: "completed_partial",
    });

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    // completed_partial sessions should be included
    expect(suggestion.direction).toBe("increase");
    expect(suggestion.suggestedWeight).toBe(82.5);
  });

  it("should handle sessions out of order by date", async () => {
    createExercise();
    // Create later session first, earlier session second
    createSessionWithSets("2026-05-05", EXERCISE_BIZ_KEY, 82.5, 5, [5, 5, 5]);
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    // Should still use most recent (82.5) as previousWeight
    expect(suggestion.previousWeight).toBe(82.5);
    expect(suggestion.consecutiveCompleted).toBe(2);
  });
});

// ============================================================
// calculateSuggestionForWorkoutExercise (per WorkoutExercise.biz_key)
// ============================================================

describe("ProgressiveOverload - calculateSuggestionForWorkoutExercise", () => {
  it("should calculate overload per WorkoutExercise.biz_key", async () => {
    createExercise();
    // Prior session for history
    createSessionWithSets("2026-04-28", EXERCISE_BIZ_KEY, 77.5, 5, [5, 5, 5]);

    const { we } = createSessionWithSets(
      "2026-05-01",
      EXERCISE_BIZ_KEY,
      80,
      5,
      [5, 5, 5],
    );

    const suggestion =
      await overloadService.calculateSuggestionForWorkoutExercise(
        we.biz_key,
        5,
      );

    // Prior session had all met with weight 77.5
    expect(suggestion.direction).toBe("increase");
    expect(suggestion.suggestedWeight).toBe(80);
    expect(suggestion.previousWeight).toBe(77.5);
  });

  it("should return no-history for workout exercise with no prior sessions", async () => {
    createExercise();
    const session = createSession({ session_date: "2026-05-09" });
    const we = createWorkoutExercise({
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: EXERCISE_BIZ_KEY,
      exercise_status: "pending",
      target_reps: 5,
    });

    // No completed sets for this exercise yet
    const suggestion =
      await overloadService.calculateSuggestionForWorkoutExercise(
        we.biz_key,
        5,
      );

    expect(suggestion.suggestedWeight).toBeNull();
  });
});

// ============================================================
// recordResult
// ============================================================

describe("ProgressiveOverload - recordResult", () => {
  it("should update consecutive counts after recording results", async () => {
    createExercise();
    const { sets } = createSessionWithSets(
      "2026-05-01",
      EXERCISE_BIZ_KEY,
      80,
      5,
      [5, 5, 5],
    );

    await overloadService.recordResult(EXERCISE_BIZ_KEY, sets);

    // After recording, next calculation should reflect the recorded session
    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.consecutiveCompleted).toBe(1);
    expect(suggestion.direction).toBe("increase");
  });
});

// ============================================================
// recalculateChain
// ============================================================

describe("ProgressiveOverload - recalculateChain", () => {
  it("should rebuild suggestion chain from a given date", async () => {
    createExercise();
    // Session 1: all met
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);
    // Session 2: all met
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 82.5, 5, [5, 5, 5]);
    // Session 3: all met
    createSessionWithSets("2026-05-05", EXERCISE_BIZ_KEY, 85, 5, [5, 5, 5]);

    // Recalculate from session 2 (simulating an edit of session 1)
    await overloadService.recalculateChain(EXERCISE_BIZ_KEY, "2026-05-03");

    // The chain should be recalculated; suggestion should still work
    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );
    expect(suggestion.consecutiveCompleted).toBe(3);
    expect(suggestion.direction).toBe("increase");
  });

  it("should handle recalculateChain with no sessions after date", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);

    // Recalculate from a future date - should not error
    await expect(
      overloadService.recalculateChain(EXERCISE_BIZ_KEY, "2026-06-01"),
    ).resolves.not.toThrow();
  });
});

// ============================================================
// Edge cases
// ============================================================

describe("ProgressiveOverload - edge cases", () => {
  it("should handle exercise not found gracefully", async () => {
    // No exercise created - should still work but with default increment
    const suggestion = await overloadService.calculateSuggestion(99999n, 5);
    expect(suggestion.suggestedWeight).toBeNull();
  });

  it("should handle sessions with no actual_reps (all null)", async () => {
    createExercise();
    const session = createSession({ session_date: "2026-05-01" });
    const we = createWorkoutExercise({
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: EXERCISE_BIZ_KEY,
      exercise_status: "completed",
    });
    // Create sets with no actual values
    for (let i = 0; i < 3; i++) {
      createSet({
        workout_exercise_biz_key: we.biz_key,
        set_index: i,
        target_weight: 80,
        target_reps: 5,
        actual_weight: null,
        actual_reps: null,
        is_completed: 0,
      });
    }

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    // With no actual values, no sets were met -> should treat as missed
    expect(suggestion.direction).toBe("maintain");
    expect(suggestion.consecutiveMissed).toBe(1);
  });

  it("should handle single set exercises", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 80, 5, [5], {
      targetSets: 1,
    });

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("increase");
    expect(suggestion.suggestedWeight).toBe(82.5);
  });

  it("should track consecutive completed across multiple sessions correctly", async () => {
    createExercise();
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 77.5, 5, [5, 5, 5]);
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 80, 5, [5, 5, 5]);
    // Missed session
    createSessionWithSets("2026-05-05", EXERCISE_BIZ_KEY, 82.5, 5, [4, 5, 5]);
    // Back to all met
    createSessionWithSets("2026-05-07", EXERCISE_BIZ_KEY, 82.5, 5, [5, 5, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    // Last session all met, but only 1 consecutive (the one before was missed)
    expect(suggestion.consecutiveCompleted).toBe(1);
    expect(suggestion.consecutiveMissed).toBe(0);
    expect(suggestion.direction).toBe("increase");
  });

  it("should handle decrease weight rounding for various values", async () => {
    createExercise({ increment: 1.25 });
    // 82.5 * 0.9 = 74.25 -> round to nearest 1.25 = 73.75
    createSessionWithSets("2026-05-01", EXERCISE_BIZ_KEY, 82.5, 5, [4, 3, 5]);
    createSessionWithSets("2026-05-03", EXERCISE_BIZ_KEY, 82.5, 5, [3, 4, 5]);

    const suggestion = await overloadService.calculateSuggestion(
      EXERCISE_BIZ_KEY,
      5,
    );

    expect(suggestion.direction).toBe("decrease");
    // 82.5 * 0.9 = 74.25, round to nearest 1.25 = 73.75
    expect(suggestion.suggestedWeight).toBe(73.75);
  });
});
