/**
 * Workout execution page.
 *
 * Full-screen immersive mode (tab bar hidden).
 * Uses WorkoutScreen component + workoutStore for state management.
 * Auto-navigates to feeling page when all exercises completed.
 */

import React, { useCallback } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { WorkoutScreen } from "@components/workout/WorkoutScreen";
import type { WorkoutExercise, WorkoutSet } from "../src/types";

// Placeholder exercise data for when no active session exists
const PLACEHOLDER_EXERCISE_BIZ_KEY = BigInt(1);
const PLACEHOLDER_EXERCISE: WorkoutExercise = {
  id: 1,
  biz_key: BigInt(100),
  workout_session_biz_key: BigInt(1),
  exercise_biz_key: PLACEHOLDER_EXERCISE_BIZ_KEY,
  order_index: 0,
  exercise_status: "in_progress",
  exercise_note: null,
  target_sets: 3,
  target_reps: 8,
  suggested_weight: 60,
  exercise_mode: "fixed",
  created_at: "2026-05-10T10:00:00Z",
};

const PLACEHOLDER_SETS: WorkoutSet[] = [
  {
    id: 1,
    biz_key: BigInt(200),
    workout_exercise_biz_key: BigInt(100),
    set_index: 0,
    target_weight: 60,
    target_reps: 8,
    actual_weight: 60,
    actual_reps: 8,
    is_completed: 1,
    completed_at: "2026-05-10T10:00:00Z",
    is_target_met: 1,
  },
];

const PLACEHOLDER_SETS_MAP = new Map<bigint, WorkoutSet[]>([
  [BigInt(100), PLACEHOLDER_SETS],
]);

const PLACEHOLDER_EXERCISE_NAMES = {
  get: (bizKey: bigint) =>
    bizKey === PLACEHOLDER_EXERCISE_BIZ_KEY ? "深蹲" : undefined,
};

const PLACEHOLDER_INCREMENTS = new Map<bigint, number>([
  [PLACEHOLDER_EXERCISE_BIZ_KEY, 2.5],
]);

export default function WorkoutPage() {
  // In production, these dependencies would come from a DI container.
  // For now, the workout page expects the store to be provided via context.
  // This is a placeholder that will be wired up when the full DI is implemented.
  return <WorkoutPlaceholder />;
}

/**
 * Placeholder screen for when store deps are not yet wired.
 * Will be replaced with the full implementation in integration.
 */
function WorkoutPlaceholder() {
  const router = useRouter();

  const handleExit = useCallback(() => {
    router.back();
  }, [router]);

  const handleAllCompleted = useCallback(() => {
    router.replace("/feeling");
  }, [router]);

  return (
    <View testID="workout-page">
      <WorkoutScreen
        trainingTypeLabel="推日"
        exercises={[PLACEHOLDER_EXERCISE]}
        setsByExercise={PLACEHOLDER_SETS_MAP}
        currentExerciseBizKey={PLACEHOLDER_EXERCISE.biz_key}
        exerciseNames={PLACEHOLDER_EXERCISE_NAMES}
        exerciseIncrements={PLACEHOLDER_INCREMENTS}
        completedExercises={0}
        totalExercises={1}
        onRecordSet={() => {}}
        onCompleteExercise={() => {}}
        onExit={handleExit}
        onAllCompleted={handleAllCompleted}
        onSelectExercise={() => {}}
      />
    </View>
  );
}
