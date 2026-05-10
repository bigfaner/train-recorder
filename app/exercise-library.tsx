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

import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "@utils/constants";
import { ExerciseLibraryScreen } from "@components/exercise/ExerciseLibraryScreen";
import type { Exercise } from "../src/types";
import { getDatabase } from "../src/db/database";
import type { DatabaseAdapter } from "../src/db/database-adapter";
import { createExerciseRepo } from "../src/db/repositories/exercise.repo";

function getDbAdapter(): DatabaseAdapter {
  return getDatabase() as unknown as DatabaseAdapter;
}

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectionMode?: string }>();
  const isSelectionMode = params.selectionMode === "true";

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedBizKeys, setSelectedBizKeys] = useState<bigint[]>([]);

  useEffect(() => {
    try {
      const db = getDbAdapter();
      const exerciseRepo = createExerciseRepo(db);
      setExercises(exerciseRepo.findAllActive());
    } catch {
      // DB not available - keep empty list
    }
  }, []);

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
      router.back();
    },
    [router],
  );

  const handleCreateCustom = useCallback(() => {
    // Navigate to custom exercise creation form
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
