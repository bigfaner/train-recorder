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
        exercises={[]}
        setsByExercise={new Map()}
        currentExerciseBizKey={null}
        exerciseNames={{ get: () => undefined }}
        exerciseIncrements={new Map()}
        completedExercises={0}
        totalExercises={0}
        onRecordSet={() => {}}
        onCompleteExercise={() => {}}
        onExit={handleExit}
        onAllCompleted={handleAllCompleted}
        onSelectExercise={() => {}}
      />
    </View>
  );
}
