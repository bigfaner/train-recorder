/**
 * Unit tests for WorkoutStore.
 * Tests state transitions, async actions, and error handling.
 *
 * Uses mock dependencies (repos, services) to isolate store logic.
 */

import {
  createWorkoutStore,
  type WorkoutStoreDeps,
} from "../../src/stores/workout.store";
import type { SnowflakeIdGenerator } from "../../src/services/snowflake";
import type { WorkoutSessionRepo } from "../../src/db/repositories/workout-session.repo";
import type { WorkoutExerciseRepo } from "../../src/db/repositories/workout-exercise.repo";
import type { WorkoutSetRepo } from "../../src/db/repositories/workout-set.repo";
import type { PlanExerciseRepo } from "../../src/db/repositories/plan-exercise.repo";
import type { ExerciseRepo } from "../../src/db/repositories/exercise.repo";
import type {
  ProgressiveOverload,
  PRTracker,
  TimerService,
} from "../../src/types";
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  PlanExercise,
} from "../../src/types";

// ============================================================
// Mock Factories
// ============================================================

function createMockSnowflake(): jest.Mocked<SnowflakeIdGenerator> {
  let counter = 100n;
  return {
    generate: jest.fn(() => {
      counter += 1n;
      return counter;
    }),
    generateBatch: jest.fn((count: number) => {
      const ids: bigint[] = [];
      for (let i = 0; i < count; i++) {
        counter += 1n;
        ids.push(counter);
      }
      return ids;
    }),
  };
}

function createMockSessionRepo(): jest.Mocked<WorkoutSessionRepo> {
  const sessions: WorkoutSession[] = [];
  let idCounter = 1;

  return {
    findActive: jest.fn(
      () => sessions.find((s) => s.session_status === "in_progress") ?? null,
    ),
    createSession: jest.fn((data) => {
      const session: WorkoutSession = { id: idCounter++, ...data };
      sessions.push(session);
      return session;
    }),
    completeSession: jest.fn((id: number) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        session.session_status = "completed";
        session.ended_at = new Date().toISOString();
      }
      return session!;
    }),
    partialCompleteSession: jest.fn((id: number) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        session.session_status = "completed_partial";
        session.ended_at = new Date().toISOString();
      }
      return session!;
    }),
    findByDate: jest.fn(),
    findByDateRange: jest.fn(() => []),
    findByStatus: jest.fn(() => []),
    findByTrainingType: jest.fn(() => []),
    findById: jest.fn(),
    findByBizKey: jest.fn(),
    findAll: jest.fn(() => []),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<WorkoutSessionRepo>;
}

function createMockExerciseRepo(): jest.Mocked<WorkoutExerciseRepo> {
  const exercises: WorkoutExercise[] = [];
  let idCounter = 1;

  return {
    createExercise: jest.fn((data) => {
      const we: WorkoutExercise = { id: idCounter++, ...data };
      exercises.push(we);
      return we;
    }),
    findBySessionBizKey: jest.fn((bizKey: bigint) =>
      exercises.filter((e) => e.workout_session_biz_key === bizKey),
    ),
    findByExerciseBizKey: jest.fn(() => []),
    update: jest.fn((id: number, data: Partial<WorkoutExercise>) => {
      const we = exercises.find((e) => e.id === id);
      if (we) Object.assign(we, data);
    }),
    findById: jest.fn(
      (id: number) => exercises.find((e) => e.id === id) ?? null,
    ),
    findByBizKey: jest.fn(),
    findAll: jest.fn(() => []),
    create: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<WorkoutExerciseRepo>;
}

function createMockSetRepo(): jest.Mocked<WorkoutSetRepo> {
  const sets: WorkoutSet[] = [];
  let idCounter = 1;

  return {
    createSet: jest.fn((data) => {
      const set: WorkoutSet = { id: idCounter++, ...data };
      if (set.is_target_met === undefined) {
        set.is_target_met = null;
      }
      sets.push(set);
      return set;
    }),
    findByWorkoutExerciseBizKey: jest.fn((bizKey: bigint) =>
      sets.filter((s) => s.workout_exercise_biz_key === bizKey),
    ),
    findById: jest.fn((id: number) => sets.find((s) => s.id === id) ?? null),
    findByBizKey: jest.fn(),
    findAll: jest.fn(() => []),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<WorkoutSetRepo>;
}

function createMockPlanExerciseRepo(): jest.Mocked<PlanExerciseRepo> {
  return {
    findByTrainingDayBizKey: jest.fn(() => []),
    createPlanExercise: jest.fn(),
    findById: jest.fn(),
    findByBizKey: jest.fn(),
    findAll: jest.fn(() => []),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<PlanExerciseRepo>;
}

function createMockExerciseLibRepo(): jest.Mocked<ExerciseRepo> {
  return {
    findByBizKey: jest.fn(() => ({
      id: 1,
      biz_key: 1001n,
      exercise_name: "Squat",
      category: "core_powerlifting" as const,
      increment: 2.5,
      default_rest: 120,
      is_custom: 0 as const,
      is_deleted: 0 as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    createExercise: jest.fn(),
    softDelete: jest.fn(),
    findAllActive: jest.fn(() => []),
    findByCategory: jest.fn(() => []),
    findById: jest.fn(),
    findAll: jest.fn(() => []),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<ExerciseRepo>;
}

function createMockOverloadService(): ProgressiveOverload {
  return {
    calculateSuggestion: jest.fn(async () => ({
      suggestedWeight: 100,
      previousWeight: 97.5,
      increment: 2.5,
      direction: "increase" as const,
      reason: "Test suggestion",
      consecutiveCompleted: 1,
      consecutiveMissed: 0,
    })),
    recordResult: jest.fn(async () => {}),
    recalculateChain: jest.fn(async () => {}),
  };
}

function createMockPRTracker(): PRTracker {
  return {
    checkAndRecordPR: jest.fn(async () => null),
    recalculatePR: jest.fn(async () => {}),
    getPRList: jest.fn(async () => []),
    getEstimated1RM: jest.fn(() => 100),
  };
}

function createMockTimerService(): TimerService {
  let state = {
    isActive: false,
    remainingSeconds: 0,
    totalDuration: 0,
    startedAt: null as number | null,
    exerciseBizKey: null as bigint | null,
  };

  return {
    start: jest.fn((duration: number, exerciseBizKey?: bigint) => {
      state = {
        isActive: true,
        remainingSeconds: duration,
        totalDuration: duration,
        startedAt: Date.now(),
        exerciseBizKey: exerciseBizKey ?? null,
      };
    }),
    pause: jest.fn(() => {
      state.isActive = false;
    }),
    resume: jest.fn(() => {
      state.isActive = true;
    }),
    skip: jest.fn(() => {
      state = {
        isActive: false,
        remainingSeconds: 0,
        totalDuration: 0,
        startedAt: null,
        exerciseBizKey: null,
      };
    }),
    adjust: jest.fn(),
    getState: jest.fn(() => ({ ...state })),
    persistState: jest.fn(async () => {}),
    recoverState: jest.fn(async () => null),
    onTick: jest.fn(() => () => {}),
    onComplete: jest.fn(() => () => {}),
  };
}

function createMockDeps(): WorkoutStoreDeps {
  return {
    snowflake: createMockSnowflake(),
    sessionRepo: createMockSessionRepo(),
    exerciseRepo: createMockExerciseRepo(),
    setRepo: createMockSetRepo(),
    planExerciseRepo: createMockPlanExerciseRepo(),
    exerciseLibRepo: createMockExerciseLibRepo(),
    overloadService: createMockOverloadService(),
    prTracker: createMockPRTracker(),
    timerService: createMockTimerService(),
  };
}

// ============================================================
// Tests
// ============================================================

describe("WorkoutStore", () => {
  let deps: WorkoutStoreDeps;
  let store: ReturnType<typeof createWorkoutStore>;

  beforeEach(() => {
    deps = createMockDeps();
    store = createWorkoutStore(deps);
  });

  describe("initial state", () => {
    it("should start with no active session", () => {
      const state = store.getState();
      expect(state.activeSession).toBeNull();
      expect(state.exercises).toEqual([]);
      expect(state.setsByExercise.size).toBe(0);
      expect(state.currentExerciseBizKey).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("startWorkout", () => {
    it("should create a new session with exercises from plan", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);

      await store.getState().startWorkout("2026-05-09", "push", 10n);

      const state = store.getState();
      expect(state.activeSession).not.toBeNull();
      expect(state.activeSession!.session_status).toBe("in_progress");
      expect(state.activeSession!.training_type).toBe("push");
      expect(state.exercises.length).toBe(1);
      expect(state.exercises[0].exercise_biz_key).toBe(1001n);
      expect(state.currentExerciseBizKey).toBe(1001n);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set error if a workout is already active", async () => {
      // Start first workout
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue([]);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      // Try to start second workout
      await store.getState().startWorkout("2026-05-09", "legs", 20n);

      expect(store.getState().error).toBe("A workout is already in progress");
    });

    it("should set error if existing in_progress session in repo", async () => {
      (deps.sessionRepo.findActive as jest.Mock).mockReturnValue({
        id: 99,
        biz_key: 999n,
        session_date: "2026-05-09",
        session_status: "in_progress",
      });

      await store.getState().startWorkout("2026-05-09", "push", 10n);

      expect(store.getState().error).toBe(
        "An active workout session already exists",
      );
    });

    it("should request overload suggestion for each exercise", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);

      await store.getState().startWorkout("2026-05-09", "push", 10n);

      expect(deps.overloadService.calculateSuggestion).toHaveBeenCalledWith(
        1001n,
        5,
      );
    });
  });

  describe("selectExercise", () => {
    it("should update currentExerciseBizKey", () => {
      store.getState().selectExercise(42n);
      expect(store.getState().currentExerciseBizKey).toBe(42n);
    });
  });

  describe("recordSet", () => {
    it("should record a set and update state", async () => {
      // Setup: start a workout first
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      // Record a set
      await store.getState().recordSet(1001n, {
        setIndex: 0,
        targetWeight: 100,
        targetReps: 5,
        actualWeight: 100,
        actualReps: 5,
      });

      const state = store.getState();
      const exerciseBizKey = state.exercises[0].biz_key;
      const sets = state.setsByExercise.get(exerciseBizKey);
      expect(sets).toBeDefined();
      expect(sets!.length).toBe(1);
      expect(sets![0].actual_weight).toBe(100);
      expect(sets![0].actual_reps).toBe(5);
    });

    it("should update exercise status to in_progress on first set", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      expect(store.getState().exercises[0].exercise_status).toBe("pending");

      await store.getState().recordSet(1001n, {
        setIndex: 0,
        targetWeight: 100,
        targetReps: 5,
        actualWeight: 100,
        actualReps: 5,
      });

      expect(store.getState().exercises[0].exercise_status).toBe("in_progress");
    });

    it("should trigger overload recording after set completion", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      await store.getState().recordSet(1001n, {
        setIndex: 0,
        targetWeight: 100,
        targetReps: 5,
        actualWeight: 100,
        actualReps: 5,
      });

      expect(deps.overloadService.recordResult).toHaveBeenCalled();
    });

    it("should start timer after recording set with actual reps", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      await store.getState().recordSet(1001n, {
        setIndex: 0,
        targetWeight: 100,
        targetReps: 5,
        actualWeight: 100,
        actualReps: 5,
      });

      expect(deps.timerService.start).toHaveBeenCalledWith(120, 1001n);
    });

    it("should check PR after recording set with actual data", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      await store.getState().recordSet(1001n, {
        setIndex: 0,
        targetWeight: 100,
        targetReps: 5,
        actualWeight: 100,
        actualReps: 5,
      });

      expect(deps.prTracker.checkAndRecordPR).toHaveBeenCalledWith(
        1001n,
        expect.any(BigInt),
        100,
        5,
      );
    });

    it("should set error when no active session", async () => {
      await store.getState().recordSet(1001n, {
        setIndex: 0,
        targetWeight: 100,
        targetReps: 5,
        actualWeight: 100,
        actualReps: 5,
      });

      expect(store.getState().error).toBe("No active workout session");
    });
  });

  describe("completeExercise", () => {
    it("should mark exercise as completed and advance to next", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          biz_key: 201n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1002n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 8,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 1,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      (deps.exerciseLibRepo.findByBizKey as jest.Mock).mockImplementation(
        (bizKey: bigint) => ({
          id: Number(bizKey),
          biz_key: bizKey,
          exercise_name: `Exercise ${bizKey}`,
          category: "core_powerlifting" as const,
          increment: 2.5,
          default_rest: 90,
          is_custom: 0 as const,
          is_deleted: 0 as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      );

      await store.getState().startWorkout("2026-05-09", "push", 10n);
      expect(store.getState().currentExerciseBizKey).toBe(1001n);

      store.getState().completeExercise(1001n);

      const state = store.getState();
      const firstEx = state.exercises.find((e) => e.exercise_biz_key === 1001n);
      expect(firstEx!.exercise_status).toBe("completed");
      expect(state.currentExerciseBizKey).toBe(1002n);
    });
  });

  describe("completeWorkout", () => {
    it("should complete session and mark all exercises completed", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      await store.getState().completeWorkout();

      const state = store.getState();
      expect(state.activeSession!.session_status).toBe("completed");
      expect(state.exercises[0].exercise_status).toBe("completed");
      expect(state.isLoading).toBe(false);
    });

    it("should stop timer on complete", async () => {
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue([]);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      await store.getState().completeWorkout();

      expect(deps.timerService.skip).toHaveBeenCalled();
    });
  });

  describe("exitWorkout", () => {
    it("should mark session as completed_partial and skip unfinished exercises", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      await store.getState().exitWorkout();

      const state = store.getState();
      expect(state.activeSession!.session_status).toBe("completed_partial");
      expect(state.exercises[0].exercise_status).toBe("skipped");
      expect(deps.timerService.skip).toHaveBeenCalled();
    });
  });

  describe("restoreSession", () => {
    it("should restore existing in_progress session", async () => {
      const mockSession: WorkoutSession = {
        id: 1,
        biz_key: 500n,
        session_date: "2026-05-09",
        training_type: "push",
        session_status: "in_progress",
        started_at: new Date().toISOString(),
        ended_at: null,
        is_backlog: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      (deps.sessionRepo.findActive as jest.Mock).mockReturnValue(mockSession);
      (deps.exerciseRepo.findBySessionBizKey as jest.Mock).mockReturnValue([
        {
          id: 1,
          biz_key: 101n,
          workout_session_biz_key: 500n,
          exercise_biz_key: 1001n,
          exercise_status: "in_progress",
        },
      ]);
      (deps.setRepo.findByWorkoutExerciseBizKey as jest.Mock).mockReturnValue(
        [],
      );

      await store.getState().restoreSession();

      const state = store.getState();
      expect(state.activeSession).toEqual(mockSession);
      expect(state.exercises.length).toBe(1);
      expect(state.currentExerciseBizKey).toBe(1001n);
    });

    it("should reset to initial state when no active session", async () => {
      (deps.sessionRepo.findActive as jest.Mock).mockReturnValue(null);

      await store.getState().restoreSession();

      const state = store.getState();
      expect(state.activeSession).toBeNull();
      expect(state.exercises).toEqual([]);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      // Trigger an error
      await store.getState().recordSet(1001n, {
        setIndex: 0,
        targetWeight: 100,
        targetReps: 5,
        actualWeight: 100,
        actualReps: 5,
      });
      expect(store.getState().error).not.toBeNull();

      store.getState().clearError();
      expect(store.getState().error).toBeNull();
    });
  });

  describe("reset", () => {
    it("should reset to initial state", async () => {
      const planExercises: PlanExercise[] = [
        {
          id: 1,
          biz_key: 200n,
          training_day_biz_key: 10n,
          exercise_biz_key: 1001n,
          sets_config: JSON.stringify({
            mode: "fixed",
            target_reps: 5,
            target_weight: null,
            target_repeat: 3,
          }),
          order_index: 0,
          exercise_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      (
        deps.planExerciseRepo.findByTrainingDayBizKey as jest.Mock
      ).mockReturnValue(planExercises);
      await store.getState().startWorkout("2026-05-09", "push", 10n);

      store.getState().reset();

      const state = store.getState();
      expect(state.activeSession).toBeNull();
      expect(state.exercises).toEqual([]);
      expect(state.setsByExercise.size).toBe(0);
      expect(state.currentExerciseBizKey).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
