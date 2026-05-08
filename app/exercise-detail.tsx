/**
 * Exercise Detail page — shows exercise info, PRs, progress chart, and recent sessions.
 *
 * Route params:
 *   - exerciseBizKey: string — the biz_key of the exercise to display
 *
 * Data loading:
 *   - Exercise info from exercise repository
 *   - Summary data from useExerciseHistory hook (PRs, sessions, total count)
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@utils/constants";
import { ExerciseDetailScreen } from "@components/exercise/ExerciseDetailScreen";
import type { Exercise } from "../src/types";

// TODO: Replace with actual database-driven data when DB layer is wired up
// For now, this page demonstrates the component structure and data flow.

export default function ExerciseDetailPage() {
  const params = useLocalSearchParams<{ exerciseBizKey?: string }>();
  const _exerciseBizKey = params.exerciseBizKey
    ? BigInt(params.exerciseBizKey)
    : null;

  // TODO: Load exercise from repository and fetch summary via useExerciseHistory
  // when the DB integration layer is complete.
  // For now, renders empty state. Real data will come from exercise repository.
  const exercise: Exercise | null = null;
  const isLoading = false;

  if (!exercise) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ExerciseDetailScreen
        exercise={exercise}
        summary={null}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
