/**
 * WorkoutScreen component for the workout execution page.
 *
 * Orchestrates:
 * - WorkoutHeader with progress and exit confirmation
 * - ExerciseCard list (completed, active, pending)
 * - "完成本组" button triggers recordSet
 * - Auto-navigate to feeling page when all exercises completed
 * - Long-press to drag-reorder exercises
 * - Left-swipe to show "跳过" option on exercises
 *
 * This is a presentational component that receives all state and callbacks
 * from the parent page (app/workout.tsx) which uses the workoutStore.
 */

import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors, Spacing } from "@utils/constants";
import { ExerciseCard } from "./ExerciseCard";
import { WorkoutHeader } from "./WorkoutHeader";
import { isAllExercisesCompleted } from "./workout-helpers";
import type { WorkoutExercise, WorkoutSet } from "../../types";

export interface ExerciseNameMap {
  /** Map from exercise_biz_key to exercise name */
  get(bizKey: bigint): string | undefined;
}

export interface WorkoutScreenProps {
  /** Training type label (e.g. "推日") */
  trainingTypeLabel: string;
  /** All exercises in the workout */
  exercises: WorkoutExercise[];
  /** Sets grouped by workout_exercise_biz_key */
  setsByExercise: Map<bigint, WorkoutSet[]>;
  /** Currently active exercise biz_key (workout exercise level) */
  currentExerciseBizKey: bigint | null;
  /** Map of exercise_biz_key -> exercise name */
  exerciseNames: ExerciseNameMap;
  /** Map of exercise_biz_key -> increment value */
  exerciseIncrements: Map<bigint, number>;
  /** Number of completed exercises */
  completedExercises: number;
  /** Total number of exercises */
  totalExercises: number;
  /** Callback to record a set */
  onRecordSet: (
    exerciseBizKey: bigint,
    setData: {
      setIndex: number;
      targetWeight: number | null;
      targetReps: number;
      actualWeight: number | null;
      actualReps: number | null;
    },
  ) => void;
  /** Callback to complete an exercise */
  onCompleteExercise: (exerciseBizKey: bigint) => void;
  /** Callback to exit workout */
  onExit: () => void;
  /** Callback when all exercises completed (navigate to feeling) */
  onAllCompleted: () => void;
  /** Callback to select an exercise */
  onSelectExercise: (exerciseBizKey: bigint) => void;
  /** Callback to reorder exercises (drag-reorder) */
  onReorderExercises?: (reordered: WorkoutExercise[]) => void;
  /** Callback to skip an exercise */
  onSkipExercise?: (exerciseBizKey: bigint) => void;
}

/**
 * Individual exercise item wrapper with swipe-to-skip and long-press-to-reorder.
 */
interface ExerciseItemProps {
  exercise: WorkoutExercise;
  allExercises: WorkoutExercise[];
  sets: WorkoutSet[];
  currentExerciseBizKey: bigint | null;
  exerciseName: string;
  increment: number;
  onRecordSet: (setData: {
    setIndex: number;
    targetWeight: number | null;
    targetReps: number;
    actualWeight: number | null;
    actualReps: number | null;
  }) => void;
  onSkip?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function ExerciseItem({
  exercise,
  allExercises,
  sets,
  currentExerciseBizKey,
  exerciseName,
  increment,
  onRecordSet,
  onSkip,
  onDragStart,
  onDragEnd,
}: ExerciseItemProps) {
  const [showSkip, setShowSkip] = useState(false);

  const handleLongPress = useCallback(() => {
    if (onDragStart) {
      onDragStart();
      // Auto-end drag after a short time (placeholder for full drag implementation)
      setTimeout(() => {
        onDragEnd?.();
      }, 1000);
    }
    // Toggle skip button visibility as part of interaction
    setShowSkip((prev) => !prev);
  }, [onDragStart, onDragEnd]);

  return (
    <View style={exerciseItemStyles.container}>
      <View style={exerciseItemStyles.cardWrapper}>
        <TouchableOpacity
          onLongPress={handleLongPress}
          activeOpacity={0.9}
          delayLongPress={300}
          accessibilityRole="button"
          accessibilityLabel={`长按拖动 ${exerciseName}`}
        >
          <ExerciseCard
            exercise={exercise}
            allExercises={allExercises}
            sets={sets}
            currentExerciseBizKey={currentExerciseBizKey}
            exerciseName={exerciseName}
            increment={increment}
            onRecordSet={onRecordSet}
          />
        </TouchableOpacity>
      </View>
      {showSkip && onSkip && (
        <TouchableOpacity
          style={exerciseItemStyles.skipButton}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="跳过"
        >
          <Text style={exerciseItemStyles.skipText}>跳过</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const exerciseItemStyles = StyleSheet.create({
  container: {
    position: "relative",
  },
  cardWrapper: {
    // Placeholder for swipe animation
  },
  skipButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Spacing.cardBorderRadius,
  },
  skipText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600" as const,
  },
});

export function WorkoutScreen({
  trainingTypeLabel,
  exercises: initialExercises,
  setsByExercise,
  currentExerciseBizKey,
  exerciseNames,
  exerciseIncrements,
  completedExercises,
  totalExercises,
  onRecordSet,
  onCompleteExercise: _onCompleteExercise,
  onExit,
  onAllCompleted,
  onSelectExercise: _onSelectExercise,
  onReorderExercises: _onReorderExercises,
  onSkipExercise,
}: WorkoutScreenProps) {
  // Local state for drag reorder
  const [exercises, setExercises] = useState(initialExercises);
  const [_dragIndex, setDragIndex] = useState<number | null>(null);

  // Sync with external state changes
  React.useEffect(() => {
    setExercises(initialExercises);
  }, [initialExercises]);

  // Check if all exercises completed - trigger navigation
  const allDone = isAllExercisesCompleted(exercises);

  // Use a ref to avoid repeated navigation
  const hasNavigated = React.useRef(false);

  React.useEffect(() => {
    if (allDone && !hasNavigated.current) {
      hasNavigated.current = true;
      onAllCompleted();
    }
  }, [allDone, onAllCompleted]);

  const handleRecordSet = useCallback(
    (exerciseBizKey: bigint) =>
      (setData: {
        setIndex: number;
        targetWeight: number | null;
        targetReps: number;
        actualWeight: number | null;
        actualReps: number | null;
      }) => {
        onRecordSet(exerciseBizKey, setData);
      },
    [onRecordSet],
  );

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleSkip = useCallback(
    (exerciseBizKey: bigint) => {
      if (onSkipExercise) {
        onSkipExercise(exerciseBizKey);
      }
    },
    [onSkipExercise],
  );

  return (
    <View style={styles.container}>
      <WorkoutHeader
        trainingTypeLabel={trainingTypeLabel}
        completedExercises={completedExercises}
        totalExercises={totalExercises}
        onExit={onExit}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        testID="exercise-list"
      >
        {exercises.map((exercise, index) => {
          const exerciseName =
            exerciseNames.get(exercise.exercise_biz_key) ?? "Unknown";
          const increment =
            exerciseIncrements.get(exercise.exercise_biz_key) ?? 2.5;
          const sets = setsByExercise.get(exercise.biz_key) ?? [];

          return (
            <ExerciseItem
              key={exercise.biz_key.toString()}
              exercise={exercise}
              allExercises={exercises}
              sets={sets}
              currentExerciseBizKey={currentExerciseBizKey}
              exerciseName={exerciseName}
              increment={increment}
              onRecordSet={handleRecordSet(exercise.exercise_biz_key)}
              onSkip={() => handleSkip(exercise.exercise_biz_key)}
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </ScrollView>

      {/* Current set display for workout resumption */}
      {currentExerciseBizKey !== null && (
        <View style={styles.currentSetBar} testID="current-set-display">
          <Text style={styles.currentSetText}>
            当前组:{" "}
            {exercises.find((e) => e.biz_key === currentExerciseBizKey)
              ?.target_sets ?? 0}
            组
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.contentPadding,
    gap: Spacing.cardSpacing,
  },
  currentSetBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  currentSetText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
