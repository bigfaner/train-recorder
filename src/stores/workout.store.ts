/**
 * Workout Store (Zustand)
 *
 * Manages active workout session state: current session, exercises, sets,
 * loading/error states. Bridges the service layer to the UI layer.
 *
 * Actions:
 *   - startWorkout: creates WorkoutSession + WorkoutExercises from plan data
 *   - selectExercise: sets current exercise for set recording
 *   - recordSet: creates WorkoutSet, triggers ProgressiveOverload + TimerService
 *   - completeExercise: marks exercise as completed
 *   - completeWorkout: finalizes session with 'completed' status
 *   - exitWorkout: saves partial completion, marks 'completed_partial'
 *   - restoreSession: recovers session after background/force-close
 */

import { create } from "zustand";
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  WorkoutExercise as WorkoutExerciseType,
} from "../types";
import type { SnowflakeIdGenerator } from "../services/snowflake";
import type { WorkoutSessionRepo } from "../db/repositories/workout-session.repo";
import type { WorkoutExerciseRepo } from "../db/repositories/workout-exercise.repo";
import type { WorkoutSetRepo } from "../db/repositories/workout-set.repo";
import type { PlanExerciseRepo } from "../db/repositories/plan-exercise.repo";
import type { ProgressiveOverload } from "../types";
import type { PRTracker } from "../types";
import type { TimerService } from "../types";
import type { ExerciseRepo } from "../db/repositories/exercise.repo";
import type { SetsConfig } from "../types";

// ============================================================
// State Shape
// ============================================================

export interface WorkoutState {
  /** Current active session, null when no workout is active */
  activeSession: WorkoutSession | null;
  /** Exercises for the active session */
  exercises: WorkoutExercise[];
  /** Sets grouped by workout_exercise_biz_key */
  setsByExercise: Map<bigint, WorkoutSet[]>;
  /** Currently selected exercise biz_key */
  currentExerciseBizKey: bigint | null;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if operation failed */
  error: string | null;
}

export interface WorkoutActions {
  /** Start a new workout from plan data */
  startWorkout(
    sessionDate: string,
    trainingType: WorkoutSession["training_type"],
    trainingDayBizKey: bigint,
  ): Promise<void>;

  /** Select an exercise for set recording */
  selectExercise(exerciseBizKey: bigint): void;

  /** Record a completed set */
  recordSet(
    exerciseBizKey: bigint,
    setData: {
      setIndex: number;
      targetWeight: number | null;
      targetReps: number;
      actualWeight: number | null;
      actualReps: number | null;
    },
  ): Promise<void>;

  /** Mark an exercise as completed */
  completeExercise(exerciseBizKey: bigint): void;

  /** Complete the entire workout */
  completeWorkout(): Promise<void>;

  /** Exit workout early with partial completion */
  exitWorkout(): Promise<void>;

  /** Restore a previously active session */
  restoreSession(): Promise<void>;

  /** Clear error state */
  clearError(): void;

  /** Reset store to initial state */
  reset(): void;
}

export type WorkoutStore = WorkoutState & WorkoutActions;

// ============================================================
// Default State
// ============================================================

const initialState: WorkoutState = {
  activeSession: null,
  exercises: [],
  setsByExercise: new Map(),
  currentExerciseBizKey: null,
  isLoading: false,
  error: null,
};

// ============================================================
// Dependencies
// ============================================================

export interface WorkoutStoreDeps {
  snowflake: SnowflakeIdGenerator;
  sessionRepo: WorkoutSessionRepo;
  exerciseRepo: WorkoutExerciseRepo;
  setRepo: WorkoutSetRepo;
  planExerciseRepo: PlanExerciseRepo;
  exerciseLibRepo: ExerciseRepo;
  overloadService: ProgressiveOverload;
  prTracker: PRTracker;
  timerService: TimerService;
}

// ============================================================
// Store Factory
// ============================================================

export function createWorkoutStore(deps: WorkoutStoreDeps) {
  return create<WorkoutStore>((set, get) => ({
    ...initialState,

    async startWorkout(sessionDate, trainingType, trainingDayBizKey) {
      const state = get();
      if (state.activeSession) {
        set({ error: "A workout is already in progress" });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        // Check for existing in_progress session
        const existing = deps.sessionRepo.findActive();
        if (existing) {
          set({
            error: "An active workout session already exists",
            isLoading: false,
          });
          return;
        }

        const sessionBizKey = deps.snowflake.generate();
        const now = new Date().toISOString();

        // Create WorkoutSession
        const session = deps.sessionRepo.createSession({
          biz_key: sessionBizKey,
          session_date: sessionDate,
          training_type: trainingType,
          session_status: "in_progress",
          started_at: now,
          ended_at: null,
          is_backlog: 0,
          created_at: now,
          updated_at: now,
        });

        // Get plan exercises for the training day
        const planExercises =
          deps.planExerciseRepo.findByTrainingDayBizKey(trainingDayBizKey);

        // Create WorkoutExercises from plan data
        const exercises: WorkoutExercise[] = [];
        for (const pe of planExercises) {
          const weBizKey = deps.snowflake.generate();

          // Parse sets_config
          let setsConfig: SetsConfig;
          try {
            setsConfig = JSON.parse(pe.sets_config) as SetsConfig;
          } catch {
            setsConfig = {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 3,
            };
          }

          const targetSets =
            setsConfig.mode === "fixed"
              ? setsConfig.target_repeat
              : setsConfig.sets.length;
          const targetReps =
            setsConfig.mode === "fixed"
              ? setsConfig.target_reps
              : (setsConfig.sets[0]?.target_reps ?? 5);

          // Get suggested weight from progressive overload
          let suggestedWeight: number | null = null;
          try {
            const suggestion = await deps.overloadService.calculateSuggestion(
              pe.exercise_biz_key,
              targetReps,
            );
            suggestedWeight = suggestion.suggestedWeight;
          } catch {
            // Leave null if suggestion fails
          }

          const we = deps.exerciseRepo.createExercise({
            biz_key: weBizKey,
            workout_session_biz_key: sessionBizKey,
            exercise_biz_key: pe.exercise_biz_key,
            order_index: pe.order_index,
            exercise_status: "pending",
            exercise_note: pe.exercise_note,
            suggested_weight: suggestedWeight,
            target_sets: targetSets,
            target_reps: targetReps,
            exercise_mode: setsConfig.mode,
            created_at: now,
          });

          exercises.push(we);
        }

        // Select first exercise by default
        const firstExerciseBizKey =
          exercises.length > 0 ? exercises[0].exercise_biz_key : null;

        set({
          activeSession: session,
          exercises,
          setsByExercise: new Map(),
          currentExerciseBizKey: firstExerciseBizKey,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to start workout",
        });
      }
    },

    selectExercise(exerciseBizKey) {
      set({ currentExerciseBizKey: exerciseBizKey });
    },

    async recordSet(exerciseBizKey, setData) {
      const state = get();
      if (!state.activeSession) {
        set({ error: "No active workout session" });
        return;
      }

      // Find the workout exercise
      const we = state.exercises.find(
        (e) => e.exercise_biz_key === exerciseBizKey,
      );
      if (!we) {
        set({ error: "Exercise not found in current workout" });
        return;
      }

      try {
        const setBizKey = deps.snowflake.generate();
        const now = new Date().toISOString();

        // Compute is_target_met
        const isTargetMet =
          setData.actualReps !== null &&
          setData.actualReps >= setData.targetReps
            ? 1
            : setData.actualReps !== null
              ? 0
              : null;

        // Create the WorkoutSet
        const workoutSet = deps.setRepo.createSet({
          biz_key: setBizKey,
          workout_exercise_biz_key: we.biz_key,
          set_index: setData.setIndex,
          target_weight: setData.targetWeight,
          target_reps: setData.targetReps,
          actual_weight: setData.actualWeight,
          actual_reps: setData.actualReps,
          is_completed: setData.actualReps !== null ? 1 : 0,
          completed_at: setData.actualReps !== null ? now : null,
          is_target_met: isTargetMet,
        });

        // Update setsByExercise
        const currentSets = state.setsByExercise.get(we.biz_key) ?? [];
        const newSetsMap = new Map(state.setsByExercise);
        newSetsMap.set(we.biz_key, [...currentSets, workoutSet]);

        // Update exercise status to in_progress if it was pending
        let updatedExercises = state.exercises;
        if (we.exercise_status === "pending") {
          deps.exerciseRepo.update(we.id, {
            exercise_status: "in_progress",
          } as Partial<WorkoutExerciseType>);
          updatedExercises = state.exercises.map((e) =>
            e.id === we.id ? { ...e, exercise_status: "in_progress" } : e,
          );
        }

        set({
          setsByExercise: newSetsMap,
          exercises: updatedExercises,
          error: null,
        });

        // Trigger ProgressiveOverload recording
        try {
          const allSets = newSetsMap.get(we.biz_key) ?? [];
          await deps.overloadService.recordResult(exerciseBizKey, allSets);
        } catch {
          // Non-critical: overload recording failure should not block set recording
        }

        // Check for PR
        if (
          setData.actualWeight !== null &&
          setData.actualReps !== null &&
          setData.actualReps > 0
        ) {
          try {
            await deps.prTracker.checkAndRecordPR(
              exerciseBizKey,
              setBizKey,
              setData.actualWeight,
              setData.actualReps,
            );
          } catch {
            // Non-critical: PR check failure should not block set recording
          }
        }

        // Start rest timer if exercise has a default rest
        if (setData.actualReps !== null) {
          try {
            const exercise = deps.exerciseLibRepo.findByBizKey(exerciseBizKey);
            if (exercise?.default_rest) {
              deps.timerService.start(exercise.default_rest, exerciseBizKey);
            }
          } catch {
            // Non-critical: timer start failure should not block set recording
          }
        }
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : "Failed to record set",
        });
      }
    },

    completeExercise(exerciseBizKey) {
      const state = get();
      if (!state.activeSession) return;

      const we = state.exercises.find(
        (e) => e.exercise_biz_key === exerciseBizKey,
      );
      if (!we) return;

      deps.exerciseRepo.update(we.id, {
        exercise_status: "completed",
      } as Partial<WorkoutExerciseType>);

      const updatedExercises: WorkoutExercise[] = state.exercises.map((e) =>
        e.id === we.id ? { ...e, exercise_status: "completed" as const } : e,
      );

      // Move to next pending exercise
      const currentIdx = updatedExercises.findIndex(
        (e) => e.exercise_biz_key === exerciseBizKey,
      );
      const nextExercise = updatedExercises
        .slice(currentIdx + 1)
        .find(
          (e) =>
            e.exercise_status === "pending" ||
            e.exercise_status === "in_progress",
        );

      set({
        exercises: updatedExercises,
        currentExerciseBizKey:
          nextExercise?.exercise_biz_key ?? state.currentExerciseBizKey,
      });
    },

    async completeWorkout() {
      const state = get();
      if (!state.activeSession) {
        set({ error: "No active workout session" });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        // Complete all pending/in_progress exercises
        const updatedExercises = state.exercises.map((e) => {
          if (
            e.exercise_status === "pending" ||
            e.exercise_status === "in_progress"
          ) {
            deps.exerciseRepo.update(e.id, {
              exercise_status: "completed",
            } as Partial<WorkoutExerciseType>);
            return { ...e, exercise_status: "completed" as const };
          }
          return e;
        });

        // Complete the session
        const completedSession = deps.sessionRepo.completeSession(
          state.activeSession.id,
        );

        // Stop any active timer
        deps.timerService.skip();

        set({
          activeSession: completedSession,
          exercises: updatedExercises,
          isLoading: false,
        });
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error ? err.message : "Failed to complete workout",
        });
      }
    },

    async exitWorkout() {
      const state = get();
      if (!state.activeSession) {
        set({ error: "No active workout session" });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        // Mark in_progress exercises as skipped (they were not completed)
        const updatedExercises = state.exercises.map((e) => {
          if (
            e.exercise_status === "pending" ||
            e.exercise_status === "in_progress"
          ) {
            deps.exerciseRepo.update(e.id, {
              exercise_status: "skipped",
            } as Partial<WorkoutExerciseType>);
            return { ...e, exercise_status: "skipped" as const };
          }
          return e;
        });

        // Partial complete the session
        const partialSession = deps.sessionRepo.partialCompleteSession(
          state.activeSession.id,
        );

        // Stop timer
        deps.timerService.skip();

        // Persist timer state for recovery
        try {
          await deps.timerService.persistState();
        } catch {
          // Non-critical
        }

        set({
          activeSession: partialSession,
          exercises: updatedExercises,
          isLoading: false,
        });
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to exit workout",
        });
      }
    },

    async restoreSession() {
      set({ isLoading: true, error: null });

      try {
        // Find active session
        const activeSession = deps.sessionRepo.findActive();
        if (!activeSession) {
          set({ ...initialState, isLoading: false });
          return;
        }

        // Load exercises for the session
        const exercises = deps.exerciseRepo.findBySessionBizKey(
          activeSession.biz_key,
        );

        // Load sets for each exercise
        const setsByExercise = new Map<bigint, WorkoutSet[]>();
        for (const we of exercises) {
          const sets = deps.setRepo.findByWorkoutExerciseBizKey(we.biz_key);
          setsByExercise.set(we.biz_key, sets);
        }

        // Find current exercise (first non-completed)
        const currentExercise =
          exercises.find(
            (e) =>
              e.exercise_status === "in_progress" ||
              e.exercise_status === "pending",
          ) ?? exercises[0];

        set({
          activeSession,
          exercises,
          setsByExercise,
          currentExerciseBizKey: currentExercise?.exercise_biz_key ?? null,
          isLoading: false,
          error: null,
        });

        // Also restore timer state
        try {
          await deps.timerService.recoverState();
        } catch {
          // Non-critical: timer recovery failure should not block session restore
        }
      } catch (err) {
        set({
          ...initialState,
          isLoading: false,
          error:
            err instanceof Error ? err.message : "Failed to restore session",
        });
      }
    },

    clearError() {
      set({ error: null });
    },

    reset() {
      set(initialState);
    },
  }));
}
