/**
 * Integration tests for WorkoutSession, WorkoutExercise, and WorkoutSet repositories.
 * Uses sql.js in-memory SQLite to test CRUD operations and domain-specific queries.
 */

import { createTestDb } from "../test-helpers";
import type { DatabaseAdapter } from "../../../src/db/database-adapter";
import {
  createWorkoutSessionRepo,
  type WorkoutSessionRepo,
} from "../../../src/db/repositories/workout-session.repo";
import {
  createWorkoutExerciseRepo,
  type WorkoutExerciseRepo,
} from "../../../src/db/repositories/workout-exercise.repo";
import {
  createWorkoutSetRepo,
  type WorkoutSetRepo,
} from "../../../src/db/repositories/workout-set.repo";
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
} from "../../../src/types";

let db: DatabaseAdapter;
let sessionRepo: WorkoutSessionRepo;
let exerciseRepo: WorkoutExerciseRepo;
let setRepo: WorkoutSetRepo;

beforeEach(async () => {
  db = await createTestDb();
  sessionRepo = createWorkoutSessionRepo(db);
  exerciseRepo = createWorkoutExerciseRepo(db);
  setRepo = createWorkoutSetRepo(db);
});

// Helper to create a session with defaults
let sessionBizKeyCounter = 1000n;
function createTestSession(
  overrides: Partial<Omit<WorkoutSession, "id">> = {},
): WorkoutSession {
  const now = new Date().toISOString();
  sessionBizKeyCounter += 1n;
  return sessionRepo.createSession({
    biz_key: sessionBizKeyCounter,
    session_date: "2026-05-09",
    training_type: "push",
    session_status: "in_progress",
    started_at: now,
    ended_at: null,
    is_backlog: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  });
}

// Helper to create a workout exercise with defaults
let exerciseBizKeyCounter = 100n;
function createTestExercise(
  overrides: Partial<Omit<WorkoutExercise, "id">> = {},
): WorkoutExercise {
  const now = new Date().toISOString();
  exerciseBizKeyCounter += 1n;
  return exerciseRepo.createExercise({
    biz_key: exerciseBizKeyCounter,
    workout_session_biz_key: 100n,
    exercise_biz_key: 200n,
    order_index: 0,
    exercise_status: "pending",
    exercise_note: null,
    suggested_weight: null,
    target_sets: 5,
    target_reps: 5,
    exercise_mode: "fixed",
    created_at: now,
    ...overrides,
  });
}

// ============================================================
// WorkoutSession Repository
// ============================================================

describe("WorkoutSessionRepository", () => {
  describe("CRUD", () => {
    it("should create a workout session", () => {
      const session = createTestSession();
      expect(session.id).toBeGreaterThan(0);
      expect(session.session_status).toBe("in_progress");
      expect(session.training_type).toBe("push");
    });

    it("should find a session by id", () => {
      const session = createTestSession({ biz_key: 1001n });
      const found = sessionRepo.findById(session.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(1001);
    });

    it("should find a session by biz_key", () => {
      const session = createTestSession({ biz_key: 1002n });
      const found = sessionRepo.findByBizKey(1002n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(session.id);
    });

    it("should update a session", () => {
      const session = createTestSession({ biz_key: 1003n });
      const updated = sessionRepo.update(session.id, { training_type: "pull" });
      expect(updated.training_type).toBe("pull");
    });

    it("should delete a session", () => {
      const session = createTestSession({ biz_key: 1004n });
      sessionRepo.deleteById(session.id);
      expect(sessionRepo.findById(session.id)).toBeNull();
    });

    it("should return null for non-existent id", () => {
      expect(sessionRepo.findById(99999)).toBeNull();
    });

    it("should return null for non-existent biz_key", () => {
      expect(sessionRepo.findByBizKey(99999n)).toBeNull();
    });
  });

  describe("findByDate", () => {
    it("should find sessions by exact date", () => {
      createTestSession({ biz_key: 2001n, session_date: "2026-05-09" });
      createTestSession({ biz_key: 2002n, session_date: "2026-05-09" });
      createTestSession({ biz_key: 2003n, session_date: "2026-05-10" });

      const results = sessionRepo.findByDate("2026-05-09");
      expect(results.length).toBe(2);
    });

    it("should return empty array for date with no sessions", () => {
      const results = sessionRepo.findByDate("2020-01-01");
      expect(results).toEqual([]);
    });
  });

  describe("findByDateRange", () => {
    it("should find sessions within date range inclusive", () => {
      createTestSession({ biz_key: 3001n, session_date: "2026-05-01" });
      createTestSession({ biz_key: 3002n, session_date: "2026-05-05" });
      createTestSession({ biz_key: 3003n, session_date: "2026-05-08" });
      createTestSession({ biz_key: 3004n, session_date: "2026-05-10" });
      createTestSession({ biz_key: 3005n, session_date: "2026-05-15" });

      const results = sessionRepo.findByDateRange("2026-05-05", "2026-05-10");
      expect(results.length).toBe(3);
    });

    it("should return sessions ordered by session_date ASC", () => {
      createTestSession({ biz_key: 3010n, session_date: "2026-05-10" });
      createTestSession({ biz_key: 3011n, session_date: "2026-05-05" });

      const results = sessionRepo.findByDateRange("2026-05-01", "2026-05-15");
      expect(results[0].session_date).toBe("2026-05-05");
      expect(results[1].session_date).toBe("2026-05-10");
    });

    it("should return empty array for range with no sessions", () => {
      const results = sessionRepo.findByDateRange("2020-01-01", "2020-01-31");
      expect(results).toEqual([]);
    });
  });

  describe("findByStatus", () => {
    it("should find sessions by status", () => {
      const s1 = createTestSession({
        biz_key: 4001n,
        session_status: "in_progress",
      });
      createTestSession({ biz_key: 4002n, session_status: "in_progress" });
      sessionRepo.completeSession(s1.id);

      const inProgress = sessionRepo.findByStatus("in_progress");
      const completed = sessionRepo.findByStatus("completed");
      expect(inProgress.length).toBe(1);
      expect(completed.length).toBe(1);
    });
  });

  describe("findByTrainingType", () => {
    it("should find sessions by training_type", () => {
      createTestSession({ biz_key: 5001n, training_type: "push" });
      createTestSession({ biz_key: 5002n, training_type: "push" });
      createTestSession({ biz_key: 5003n, training_type: "pull" });

      const pushSessions = sessionRepo.findByTrainingType("push");
      expect(pushSessions.length).toBe(2);
    });
  });

  describe("session_status state machine", () => {
    it("should transition in_progress -> completed", () => {
      const session = createTestSession({ biz_key: 6001n });
      expect(session.session_status).toBe("in_progress");

      const completed = sessionRepo.completeSession(session.id);
      expect(completed.session_status).toBe("completed");
      expect(completed.ended_at).not.toBeNull();
    });

    it("should transition in_progress -> completed_partial", () => {
      const session = createTestSession({ biz_key: 6002n });

      const partial = sessionRepo.partialCompleteSession(session.id);
      expect(partial.session_status).toBe("completed_partial");
      expect(partial.ended_at).not.toBeNull();
    });

    it("should reject transition completed -> completed", () => {
      const session = createTestSession({ biz_key: 6003n });
      sessionRepo.completeSession(session.id);

      expect(() => sessionRepo.completeSession(session.id)).toThrow(
        /Invalid status transition/,
      );
    });

    it("should reject transition completed_partial -> completed", () => {
      const session = createTestSession({ biz_key: 6004n });
      sessionRepo.partialCompleteSession(session.id);

      expect(() => sessionRepo.completeSession(session.id)).toThrow(
        /Invalid status transition/,
      );
    });

    it("should reject transition completed -> completed_partial", () => {
      const session = createTestSession({ biz_key: 6005n });
      sessionRepo.completeSession(session.id);

      expect(() => sessionRepo.partialCompleteSession(session.id)).toThrow(
        /Invalid status transition/,
      );
    });

    it("should reject transition for non-existent session", () => {
      expect(() => sessionRepo.completeSession(99999)).toThrow(/not found/);
    });
  });

  describe("findActive", () => {
    it("should find the active (in_progress) session", () => {
      createTestSession({ biz_key: 7001n, session_status: "in_progress" });
      const s2 = createTestSession({
        biz_key: 7002n,
        session_status: "in_progress",
      });
      sessionRepo.completeSession(s2.id);

      const active = sessionRepo.findActive();
      expect(active).not.toBeNull();
      expect(Number(active!.biz_key)).toBe(7001);
    });

    it("should return null when no active session exists", () => {
      expect(sessionRepo.findActive()).toBeNull();
    });
  });

  describe("is_backlog flag", () => {
    it("should create a backlog session", () => {
      const session = createTestSession({ biz_key: 8001n, is_backlog: 1 });
      expect(session.is_backlog).toBe(1);
    });
  });
});

// ============================================================
// WorkoutExercise Repository
// ============================================================

describe("WorkoutExerciseRepository", () => {
  describe("CRUD", () => {
    it("should create a workout exercise", () => {
      const we = createTestExercise({ biz_key: 101n });
      expect(we.id).toBeGreaterThan(0);
      expect(we.exercise_status).toBe("pending");
      expect(we.target_sets).toBe(5);
      expect(we.target_reps).toBe(5);
    });

    it("should find by id", () => {
      const we = createTestExercise({ biz_key: 102n });
      const found = exerciseRepo.findById(we.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(102);
    });

    it("should find by biz_key", () => {
      const we = createTestExercise({ biz_key: 103n });
      const found = exerciseRepo.findByBizKey(103n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(we.id);
    });

    it("should update a workout exercise", () => {
      const we = createTestExercise({ biz_key: 104n });
      const updated = exerciseRepo.update(we.id, {
        exercise_status: "completed",
        suggested_weight: 82.5,
      });
      expect(updated.exercise_status).toBe("completed");
      expect(updated.suggested_weight).toBe(82.5);
    });

    it("should delete a workout exercise", () => {
      const we = createTestExercise({ biz_key: 105n });
      exerciseRepo.deleteById(we.id);
      expect(exerciseRepo.findById(we.id)).toBeNull();
    });
  });

  describe("findBySessionBizKey", () => {
    it("should find exercises by session biz_key ordered by order_index", () => {
      const sessionBizKey = 5001n;
      createTestExercise({
        biz_key: 201n,
        workout_session_biz_key: sessionBizKey,
        order_index: 2,
      });
      createTestExercise({
        biz_key: 202n,
        workout_session_biz_key: sessionBizKey,
        order_index: 0,
      });
      createTestExercise({
        biz_key: 203n,
        workout_session_biz_key: sessionBizKey,
        order_index: 1,
      });
      createTestExercise({
        biz_key: 204n,
        workout_session_biz_key: 9999n,
        order_index: 0,
      });

      const results = exerciseRepo.findBySessionBizKey(sessionBizKey);
      expect(results.length).toBe(3);
      expect(results[0].order_index).toBe(0);
      expect(results[1].order_index).toBe(1);
      expect(results[2].order_index).toBe(2);
    });

    it("should return empty array for session with no exercises", () => {
      const results = exerciseRepo.findBySessionBizKey(9999n);
      expect(results).toEqual([]);
    });
  });

  describe("findByExerciseBizKey", () => {
    it("should find workout exercises by exercise biz_key", () => {
      const exerciseBizKey = 3001n;
      createTestExercise({ biz_key: 301n, exercise_biz_key: exerciseBizKey });
      createTestExercise({ biz_key: 302n, exercise_biz_key: exerciseBizKey });
      createTestExercise({ biz_key: 303n, exercise_biz_key: 9999n });

      const results = exerciseRepo.findByExerciseBizKey(exerciseBizKey);
      expect(results.length).toBe(2);
    });

    it("should return empty array for exercise with no workout records", () => {
      const results = exerciseRepo.findByExerciseBizKey(9999n);
      expect(results).toEqual([]);
    });
  });

  describe("exercise_status values", () => {
    it("should support all four exercise_status values", () => {
      const statuses: WorkoutExercise["exercise_status"][] = [
        "pending",
        "in_progress",
        "completed",
        "skipped",
      ];
      const bizKeys = [410n, 411n, 412n, 413n];
      for (let i = 0; i < statuses.length; i++) {
        const we = createTestExercise({
          biz_key: bizKeys[i],
          exercise_status: statuses[i],
        });
        expect(we.exercise_status).toBe(statuses[i]);
      }
    });
  });

  describe("exercise_mode values", () => {
    it("should support fixed and custom exercise_mode", () => {
      const fixed = createTestExercise({
        biz_key: 401n,
        exercise_mode: "fixed",
      });
      expect(fixed.exercise_mode).toBe("fixed");

      const custom = createTestExercise({
        biz_key: 402n,
        exercise_mode: "custom",
      });
      expect(custom.exercise_mode).toBe("custom");
    });
  });
});

// ============================================================
// WorkoutSet Repository
// ============================================================

describe("WorkoutSetRepository", () => {
  // Helper to create a workout set with defaults
  let setBizKeyCounter = 500n;
  function createTestSet(
    overrides: Partial<Omit<WorkoutSet, "id" | "is_target_met">> = {},
  ): WorkoutSet {
    setBizKeyCounter += 1n;
    return setRepo.createSet({
      biz_key: setBizKeyCounter,
      workout_exercise_biz_key: 100n,
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

  describe("CRUD", () => {
    it("should create a workout set", () => {
      const set = createTestSet({ biz_key: 501n });
      expect(set.id).toBeGreaterThan(0);
      expect(set.target_weight).toBe(80.0);
      expect(set.target_reps).toBe(5);
    });

    it("should find by id", () => {
      const set = createTestSet({ biz_key: 502n });
      const found = setRepo.findById(set.id);
      expect(found).not.toBeNull();
      expect(Number(found!.biz_key)).toBe(502);
    });

    it("should find by biz_key", () => {
      const set = createTestSet({ biz_key: 503n });
      const found = setRepo.findByBizKey(503n);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(set.id);
    });

    it("should update a workout set", () => {
      const set = createTestSet({ biz_key: 504n });
      const updated = setRepo.update(set.id, {
        actual_weight: 82.5,
        actual_reps: 5,
        is_completed: 1,
      });
      expect(updated.actual_weight).toBe(82.5);
      expect(updated.actual_reps).toBe(5);
      expect(updated.is_completed).toBe(1);
    });

    it("should delete a workout set", () => {
      const set = createTestSet({ biz_key: 505n });
      setRepo.deleteById(set.id);
      expect(setRepo.findById(set.id)).toBeNull();
    });
  });

  describe("is_target_met computation", () => {
    it("should compute is_target_met = 1 when actual_reps >= target_reps", () => {
      const set = createTestSet({
        biz_key: 601n,
        target_reps: 5,
        actual_reps: 5,
      });
      expect(set.is_target_met).toBe(1);
    });

    it("should compute is_target_met = 1 when actual_reps > target_reps", () => {
      const set = createTestSet({
        biz_key: 602n,
        target_reps: 5,
        actual_reps: 6,
      });
      expect(set.is_target_met).toBe(1);
    });

    it("should compute is_target_met = 0 when actual_reps < target_reps", () => {
      const set = createTestSet({
        biz_key: 603n,
        target_reps: 5,
        actual_reps: 4,
      });
      expect(set.is_target_met).toBe(0);
    });

    it("should compute is_target_met = 0 when actual_reps = 0", () => {
      const set = createTestSet({
        biz_key: 604n,
        target_reps: 5,
        actual_reps: 0,
      });
      expect(set.is_target_met).toBe(0);
    });

    it("should set is_target_met = null when actual_reps is null", () => {
      const set = createTestSet({
        biz_key: 605n,
        target_reps: 5,
        actual_reps: null,
      });
      expect(set.is_target_met).toBeNull();
    });
  });

  describe("findByWorkoutExerciseBizKey", () => {
    it("should find sets by workout exercise biz_key ordered by set_index", () => {
      const weBizKey = 7001n;
      createTestSet({
        biz_key: 701n,
        workout_exercise_biz_key: weBizKey,
        set_index: 2,
      });
      createTestSet({
        biz_key: 702n,
        workout_exercise_biz_key: weBizKey,
        set_index: 0,
      });
      createTestSet({
        biz_key: 703n,
        workout_exercise_biz_key: weBizKey,
        set_index: 1,
      });
      createTestSet({
        biz_key: 704n,
        workout_exercise_biz_key: 9999n,
        set_index: 0,
      });

      const results = setRepo.findByWorkoutExerciseBizKey(weBizKey);
      expect(results.length).toBe(3);
      expect(results[0].set_index).toBe(0);
      expect(results[1].set_index).toBe(1);
      expect(results[2].set_index).toBe(2);
    });

    it("should return empty array for exercise with no sets", () => {
      const results = setRepo.findByWorkoutExerciseBizKey(9999n);
      expect(results).toEqual([]);
    });
  });

  describe("complete set flow", () => {
    it("should record a completed set with actual values", () => {
      const set = createTestSet({
        biz_key: 801n,
        target_weight: 80.0,
        target_reps: 5,
        actual_weight: null,
        actual_reps: null,
      });

      const now = new Date().toISOString();
      const completed = setRepo.update(set.id, {
        actual_weight: 80.0,
        actual_reps: 5,
        is_completed: 1,
        completed_at: now,
        is_target_met: 1,
      });

      expect(completed.is_completed).toBe(1);
      expect(completed.completed_at).toBe(now);
      expect(completed.is_target_met).toBe(1);
    });
  });
});

// ============================================================
// Cross-entity integration: session -> exercise -> set
// ============================================================

describe("Workout entity integration", () => {
  it("should support full workout flow: session -> exercises -> sets", () => {
    // 1. Create a workout session
    const session = createTestSession({
      biz_key: 9001n,
      session_date: "2026-05-09",
      training_type: "push",
    });

    // 2. Add exercises to the session
    const exercise1 = createTestExercise({
      biz_key: 9101n,
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: 300n,
      order_index: 0,
      target_sets: 3,
      target_reps: 5,
    });
    createTestExercise({
      biz_key: 9102n,
      workout_session_biz_key: session.biz_key,
      exercise_biz_key: 301n,
      order_index: 1,
      target_sets: 4,
      target_reps: 8,
    });

    // 3. Add sets to exercise 1
    const set1 = setRepo.createSet({
      biz_key: 9201n,
      workout_exercise_biz_key: exercise1.biz_key,
      set_index: 0,
      target_weight: 80.0,
      target_reps: 5,
      actual_weight: 80.0,
      actual_reps: 5,
      is_completed: 1,
      completed_at: new Date().toISOString(),
    });
    const set2 = setRepo.createSet({
      biz_key: 9202n,
      workout_exercise_biz_key: exercise1.biz_key,
      set_index: 1,
      target_weight: 80.0,
      target_reps: 5,
      actual_weight: 80.0,
      actual_reps: 4,
      is_completed: 1,
      completed_at: new Date().toISOString(),
    });

    // Verify set-level data
    expect(set1.is_target_met).toBe(1);
    expect(set2.is_target_met).toBe(0);

    // 4. Verify queries work across entities
    const sessionExercises = exerciseRepo.findBySessionBizKey(session.biz_key);
    expect(sessionExercises.length).toBe(2);

    const exercise1Sets = setRepo.findByWorkoutExerciseBizKey(
      exercise1.biz_key,
    );
    expect(exercise1Sets.length).toBe(2);

    // 5. Complete the session
    const completedSession = sessionRepo.completeSession(session.id);
    expect(completedSession.session_status).toBe("completed");
    expect(completedSession.ended_at).not.toBeNull();
  });

  it("should support partial workout completion flow", () => {
    // Create session with exercises, complete only some
    const session = createTestSession({
      biz_key: 9002n,
      session_date: "2026-05-09",
    });
    createTestExercise({
      biz_key: 9103n,
      workout_session_biz_key: session.biz_key,
      exercise_status: "completed",
    });
    createTestExercise({
      biz_key: 9104n,
      workout_session_biz_key: session.biz_key,
      exercise_status: "skipped",
    });

    // Partial complete the session
    const partial = sessionRepo.partialCompleteSession(session.id);
    expect(partial.session_status).toBe("completed_partial");

    // Verify completed exercises are queryable
    const exercises = exerciseRepo.findBySessionBizKey(session.biz_key);
    const completed = exercises.filter(
      (e) => e.exercise_status === "completed",
    );
    const skipped = exercises.filter((e) => e.exercise_status === "skipped");
    expect(completed.length).toBe(1);
    expect(skipped.length).toBe(1);
  });

  it("should support backlog workout creation", () => {
    const session = createTestSession({
      biz_key: 9003n,
      session_date: "2026-05-01",
      is_backlog: 1,
      session_status: "completed",
    });

    expect(session.is_backlog).toBe(1);
    expect(session.session_status).toBe("completed");

    // Find backlog sessions
    const all = sessionRepo.findAll({
      is_backlog: 1,
    } as Partial<WorkoutSession>);
    expect(all.length).toBe(1);
    expect(all[0].session_date).toBe("2026-05-01");
  });
});
