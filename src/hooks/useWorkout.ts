/**
 * useWorkout hook
 *
 * Exposes workoutStore actions + computed progress (completed/total exercises and sets).
 * Components use this hook to interact with workout state.
 *
 * Usage:
 *   const { activeSession, exercises, startWorkout, recordSet, progress } = useWorkout(store);
 */

import { useStore } from "zustand";
import type { WorkoutStore } from "../stores/workout.store";

export interface WorkoutProgress {
  completedExercises: number;
  totalExercises: number;
  completedSets: number;
  totalSets: number;
  percentage: number; // 0-100
}

export interface UseWorkoutResult {
  // State
  activeSession: WorkoutStore["activeSession"];
  exercises: WorkoutStore["exercises"];
  setsByExercise: WorkoutStore["setsByExercise"];
  currentExerciseBizKey: WorkoutStore["currentExerciseBizKey"];
  isLoading: WorkoutStore["isLoading"];
  error: WorkoutStore["error"];

  // Computed
  progress: WorkoutProgress;

  // Actions
  startWorkout: WorkoutStore["startWorkout"];
  selectExercise: WorkoutStore["selectExercise"];
  recordSet: WorkoutStore["recordSet"];
  completeExercise: WorkoutStore["completeExercise"];
  completeWorkout: WorkoutStore["completeWorkout"];
  exitWorkout: WorkoutStore["exitWorkout"];
  restoreSession: WorkoutStore["restoreSession"];
  clearError: WorkoutStore["clearError"];
}

/**
 * Compute workout progress from store state.
 */
export function computeProgress(
  exercises: WorkoutStore["exercises"],
  setsByExercise: WorkoutStore["setsByExercise"],
): WorkoutProgress {
  const completedExercises = exercises.filter(
    (e) => e.exercise_status === "completed",
  ).length;
  const totalExercises = exercises.length;

  let completedSets = 0;
  let totalSets = 0;

  for (const ex of exercises) {
    totalSets += ex.target_sets;
    const sets = setsByExercise.get(ex.biz_key) ?? [];
    completedSets += sets.filter((s) => s.is_completed === 1).length;
  }

  const percentage =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return {
    completedExercises,
    totalExercises,
    completedSets,
    totalSets,
    percentage,
  };
}

/**
 * Hook to access workout store state and actions.
 * Takes a Zustand store instance (for testing, pass the result of createWorkoutStore()).
 */
export function useWorkout(
  store: ReturnType<
    typeof import("../stores/workout.store").createWorkoutStore
  >,
): UseWorkoutResult {
  const state = useStore(store);

  const progress = computeProgress(state.exercises, state.setsByExercise);

  return {
    activeSession: state.activeSession,
    exercises: state.exercises,
    setsByExercise: state.setsByExercise,
    currentExerciseBizKey: state.currentExerciseBizKey,
    isLoading: state.isLoading,
    error: state.error,
    progress,
    startWorkout: state.startWorkout,
    selectExercise: state.selectExercise,
    recordSet: state.recordSet,
    completeExercise: state.completeExercise,
    completeWorkout: state.completeWorkout,
    exitWorkout: state.exitWorkout,
    restoreSession: state.restoreSession,
    clearError: state.clearError,
  };
}
