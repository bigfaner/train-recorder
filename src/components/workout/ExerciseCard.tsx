/**
 * ExerciseCard component for the workout execution page.
 *
 * Three visual states:
 * - Active (expanded): weight/reps input, "完成本组" button
 * - Completed (collapsed): ✓ checkmark, actual weight×reps summary
 * - Pending (muted grey): "待进行" label
 *
 * Supports same exercise distinction (e.g. "深蹲 #1", "深蹲 #2 - 暂停深蹲").
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { WorkoutExercise, WorkoutSet } from "../../types";
import {
  getExerciseDisplayName,
  getWeightLabelType,
  formatWeightWithIncrement,
  formatSetProgress,
  formatSetSummary,
  getCompletedSetCount,
  getNextSetIndex,
  getExerciseCardState,
} from "./workout-helpers";

export interface ExerciseCardProps {
  /** The workout exercise data */
  exercise: WorkoutExercise;
  /** All exercises in the workout (for duplicate detection) */
  allExercises: WorkoutExercise[];
  /** Completed sets for this exercise */
  sets: WorkoutSet[];
  /** Currently active exercise biz_key */
  currentExerciseBizKey: bigint | null;
  /** Exercise name from library */
  exerciseName: string;
  /** Increment value from exercise library */
  increment: number;
  /** Callback when "完成本组" is pressed */
  onRecordSet: (setData: {
    setIndex: number;
    targetWeight: number | null;
    targetReps: number;
    actualWeight: number | null;
    actualReps: number | null;
  }) => void;
  /** Callback when "加一组" is pressed */
  onAddExtraSet?: () => void;
  /** Optional style override */
  style?: ViewStyle;
}

export function ExerciseCard({
  exercise,
  allExercises,
  sets,
  currentExerciseBizKey,
  exerciseName,
  increment,
  onRecordSet,
  onAddExtraSet,
  style,
}: ExerciseCardProps) {
  const cardState = getExerciseCardState(exercise, currentExerciseBizKey);
  const displayName = getExerciseDisplayName(
    exercise.biz_key,
    exerciseName,
    allExercises,
  );

  if (cardState === "completed") {
    return (
      <CompletedCard
        displayName={displayName}
        sets={sets}
        style={style}
        exerciseBizKey={exercise.exercise_biz_key.toString()}
      />
    );
  }

  if (cardState === "active") {
    return (
      <ActiveCard
        exercise={exercise}
        displayName={displayName}
        sets={sets}
        increment={increment}
        onRecordSet={onRecordSet}
        onAddExtraSet={onAddExtraSet}
        style={style}
      />
    );
  }

  return <PendingCard displayName={displayName} style={style} />;
}

// --- Completed (collapsed) Card ---

interface CompletedCardProps {
  displayName: string;
  sets: WorkoutSet[];
  style?: ViewStyle;
  exerciseBizKey?: string;
}

function CompletedCard({
  displayName,
  sets,
  style,
  exerciseBizKey,
}: CompletedCardProps) {
  const summary = formatSetSummary(sets);

  return (
    <View
      style={[styles.card, styles.completedCard, style]}
      testID={exerciseBizKey ? `exercise-card-${exerciseBizKey}` : undefined}
    >
      <View style={styles.completedHeader}>
        <Text style={styles.completedCheck}>✓</Text>
        <Text style={styles.completedName}>{displayName}</Text>
      </View>
      {summary ? <Text style={styles.completedSummary}>{summary}</Text> : null}
    </View>
  );
}

// --- Active (expanded) Card ---

interface ActiveCardProps {
  exercise: WorkoutExercise;
  displayName: string;
  sets: WorkoutSet[];
  increment: number;
  onRecordSet: (setData: {
    setIndex: number;
    targetWeight: number | null;
    targetReps: number;
    actualWeight: number | null;
    actualReps: number | null;
  }) => void;
  onAddExtraSet?: () => void;
  style?: ViewStyle;
}

function ActiveCard({
  exercise,
  displayName,
  sets,
  increment,
  onRecordSet,
  onAddExtraSet,
  style,
}: ActiveCardProps) {
  const completedCount = getCompletedSetCount(sets);
  const nextSetIndex = getNextSetIndex(sets);

  // Determine initial weight (suggested or from last set)
  const lastCompletedSet = [...sets]
    .reverse()
    .find((s) => s.is_completed === 1);
  const suggestedWeight = exercise.suggested_weight;
  const initialWeight =
    lastCompletedSet?.actual_weight ?? suggestedWeight ?? null;

  const [weightInput, setWeightInput] = useState<string>(
    initialWeight !== null ? String(initialWeight) : "",
  );
  // setRepsInput will be used when reps editing is wired up
  const [repsInput, _setRepsInput] = useState<string>(
    String(exercise.target_reps),
  );

  const weightLabelType = getWeightLabelType(
    suggestedWeight,
    weightInput !== "" ? Number(weightInput) : null,
  );

  const handleCompleteSet = useCallback(() => {
    const actualWeight = weightInput !== "" ? Number(weightInput) : null;
    const actualReps = repsInput !== "" ? Number(repsInput) : null;

    onRecordSet({
      setIndex: nextSetIndex,
      targetWeight: suggestedWeight,
      targetReps: exercise.target_reps,
      actualWeight,
      actualReps,
    });

    // Pre-fill for next set with same weight
    if (actualWeight !== null) {
      setWeightInput(String(actualWeight));
    }
  }, [
    weightInput,
    repsInput,
    nextSetIndex,
    suggestedWeight,
    exercise.target_reps,
    onRecordSet,
  ]);

  const setProgressText = formatSetProgress(
    completedCount,
    exercise.target_sets,
  );

  return (
    <View
      style={[styles.card, styles.activeCard, style]}
      testID={`exercise-card-${exercise.exercise_biz_key.toString()}`}
    >
      {/* Header: name + set progress */}
      <View style={styles.activeHeader}>
        <Text style={styles.activeName}>{displayName}</Text>
        <Text style={styles.setProgress}>{setProgressText}</Text>
      </View>

      {/* Suggestion label */}
      {suggestedWeight !== null && (
        <View style={styles.suggestionRow}>
          {weightLabelType === "suggested" ? (
            <Text style={styles.suggestionText} testID="suggested-weight">
              建议: {formatWeightWithIncrement(suggestedWeight, increment)}
            </Text>
          ) : weightLabelType === "custom" ? (
            <Text style={styles.customLabel} testID="custom-weight-badge">
              自定义
            </Text>
          ) : null}
        </View>
      )}

      {/* Weight + Reps inputs */}
      <View style={styles.inputRow}>
        <View style={styles.weightInputContainer}>
          <Text style={styles.weightDisplay} testID="weight-display">
            {weightInput || "0"}
          </Text>
          <Text style={styles.inputUnit}> kg</Text>
        </View>
        <View style={styles.repsInputContainer}>
          <Text style={styles.repsDisplay} testID="reps-display">
            {repsInput}
          </Text>
          <Text style={styles.inputUnit}> 次</Text>
        </View>
      </View>

      {/* Target sets/reps display */}
      <View style={styles.targetRow}>
        <Text style={styles.targetText} testID="target-sets-reps">
          目标: {exercise.target_sets}组 x {exercise.target_reps}次
        </Text>
      </View>

      {/* Complete set button */}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={handleCompleteSet}
        accessibilityRole="button"
        accessibilityLabel="完成本组"
        testID="complete-set-btn"
      >
        <Text style={styles.completeButtonText}>完成本组</Text>
      </TouchableOpacity>

      {/* Add extra set (when all planned sets done) */}
      {completedCount >= exercise.target_sets && onAddExtraSet && (
        <TouchableOpacity
          style={styles.extraSetButton}
          onPress={onAddExtraSet}
          accessibilityRole="button"
          accessibilityLabel="加一组"
          testID="add-extra-set-btn"
        >
          <Text style={styles.extraSetButtonText}>加一组</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// --- Pending (muted) Card ---

interface PendingCardProps {
  displayName: string;
  style?: ViewStyle;
}

function PendingCard({ displayName, style }: PendingCardProps) {
  return (
    <View style={[styles.card, styles.pendingCard, style]}>
      <Text style={styles.pendingName}>{displayName}</Text>
      <Text style={styles.pendingLabel}>待进行</Text>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
    // shadow 0 2px 12px rgba(0,0,0,0.06)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  // Completed card
  completedCard: {
    opacity: 0.8,
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completedCheck: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.success,
  },
  completedName: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    flex: 1,
  },
  completedSummary: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  // Active card
  activeCard: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeName: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  setProgress: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    fontWeight: Typography.caption.fontWeight as "500",
  },
  suggestionRow: {
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.accent,
    fontWeight: "500" as const,
  },
  customLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  targetRow: {
    marginBottom: 12,
  },
  targetText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
  },
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
  },
  weightDisplay: {
    fontSize: Typography.weightDisplay.fontSize,
    fontWeight: Typography.weightDisplay.fontWeight as "700",
    letterSpacing: Typography.weightDisplay.letterSpacing,
    color: Colors.textPrimary,
  },
  repsDisplay: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  repsInputContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  inputUnit: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  completeButton: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#ffffff",
    textAlign: "center",
  },
  extraSetButton: {
    marginTop: 8,
    justifyContent: "center",
    alignItems: "center",
    height: 44,
  },
  extraSetButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.accent,
    fontWeight: "500" as const,
  },

  // Pending card
  pendingCard: {
    opacity: 0.5,
  },
  pendingName: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
  },
  pendingLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
