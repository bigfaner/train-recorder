/**
 * Exercise Library page — browse/search exercises grouped by category.
 *
 * Supports two modes:
 * - Browse mode (default): tap exercise row to navigate to detail page
 * - Selection mode: activated via route param `selectionMode=true` from plan editor
 *
 * Route params:
 *   - selectionMode: "true" | undefined — enables multi-select checkboxes
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "@utils/constants";
import { ExerciseLibraryScreen } from "@components/exercise/ExerciseLibraryScreen";
import type { Exercise } from "../src/types";

// TODO: Replace with actual database-driven data when DB layer is wired up
// For now, exercises are loaded from the repository via a provider/hook
// that will be implemented in a future integration task.

// Placeholder data for initial render — will be replaced by real DB data
const PLACEHOLDER_EXERCISES: Exercise[] = [];

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectionMode?: string }>();
  const isSelectionMode = params.selectionMode === "true";

  const [exercises] = useState<Exercise[]>(PLACEHOLDER_EXERCISES);
  const [selectedBizKeys, setSelectedBizKeys] = useState<bigint[]>([]);

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      router.push({
        pathname: "/exercise-detail",
        params: { exerciseBizKey: exercise.biz_key.toString() },
      });
    },
    [router],
  );

  const handleSelectionChange = useCallback((selected: Exercise[]) => {
    setSelectedBizKeys(selected.map((e) => e.biz_key));
  }, []);

  const handleCompleteSelection = useCallback(
    (_selected: Exercise[]) => {
      // Navigate back to plan editor with selected exercises
      // The plan editor will read the selection from navigation state
      router.back();
    },
    [router],
  );

  const handleCreateCustom = useCallback(() => {
    // Navigate to custom exercise creation form
    // Will be implemented as part of the custom exercise flow
  }, []);

  return (
    <View style={styles.container}>
      <ExerciseLibraryScreen
        exercises={exercises}
        selectionMode={isSelectionMode}
        selectedBizKeys={selectedBizKeys}
        onExercisePress={handleExercisePress}
        onSelectionChange={handleSelectionChange}
        onCompleteSelection={handleCompleteSelection}
        onCreateCustom={handleCreateCustom}
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
