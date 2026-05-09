/**
 * FeelingScreen component for the post-workout feeling page.
 *
 * Displays after workout completion:
 * - Training summary (type + total volume)
 * - Fatigue slider (1-10, default 6)
 * - Satisfaction slider (1-10, default 7)
 * - Per-exercise note cards (completed exercises only)
 * - Overall note text input
 * - Save / Skip buttons
 * - Warning state when high fatigue + low satisfaction
 *
 * This is a presentational component that receives all state and callbacks
 * from the parent page which manages the feeling data persistence.
 */

import React, { useState, useCallback } from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@utils/constants";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Slider } from "../ui/Slider";
import {
  formatTrainingSummary,
  shouldShowWarning,
  getCompletedExercises,
  formatExerciseSummary,
  computeTotalVolume,
  WARNING_MESSAGE,
} from "./feeling-helpers";
import type { WorkoutExercise, WorkoutSet } from "../../types";

/** Map from exercise_biz_key to exercise display name */
export interface ExerciseNameMap {
  get(bizKey: bigint): string | undefined;
}

export interface FeelingScreenProps {
  /** Training type for summary label */
  trainingType: "push" | "pull" | "legs" | "custom";
  /** All exercises from the workout */
  exercises: WorkoutExercise[];
  /** Sets grouped by workout_exercise_biz_key */
  setsByExercise: Map<bigint, WorkoutSet[]>;
  /** Map of exercise_biz_key -> exercise name */
  exerciseNames: ExerciseNameMap;
  /** Callback when user saves feeling data */
  onSave: (data: {
    fatigue: number;
    satisfaction: number;
    overallNote: string;
    exerciseNotes: Map<bigint, string>;
  }) => void;
  /** Callback when user skips feeling recording */
  onSkip: () => void;
}

export function FeelingScreen({
  trainingType,
  exercises,
  setsByExercise,
  exerciseNames,
  onSave,
  onSkip,
}: FeelingScreenProps) {
  const [fatigue, setFatigue] = useState(6);
  const [satisfaction, setSatisfaction] = useState(7);
  const [overallNote, setOverallNote] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState<Map<bigint, string>>(
    new Map(),
  );

  // Compute all completed sets for volume
  const allSets: WorkoutSet[] = [];
  for (const sets of setsByExercise.values()) {
    allSets.push(...sets);
  }
  const totalVolume = computeTotalVolume(allSets);

  // Get completed exercises for per-exercise notes
  const completedExercises = getCompletedExercises(exercises);

  // Warning state
  const showWarning = shouldShowWarning(fatigue, satisfaction);

  const handleExerciseNoteChange = useCallback(
    (exerciseBizKey: bigint, note: string) => {
      setExerciseNotes((prev) => {
        const next = new Map(prev);
        next.set(exerciseBizKey, note);
        return next;
      });
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSave({
      fatigue,
      satisfaction,
      overallNote,
      exerciseNotes,
    });
  }, [fatigue, satisfaction, overallNote, exerciseNotes, onSave]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.title}>训练完成！</Text>
        <Text style={styles.summary}>
          {formatTrainingSummary(trainingType, totalVolume)}
        </Text>

        {/* Fatigue Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>整体疲劳度</Text>
          <Slider
            value={fatigue}
            minimumValue={1}
            maximumValue={10}
            onValueChange={setFatigue}
            minLabel="轻松"
            maxLabel="筋疲力尽"
            testID="fatigue-slider"
          />
          {showWarning && (
            <Text style={[styles.sliderValue, styles.warningText]}>
              {fatigue}
            </Text>
          )}
        </View>

        {/* Satisfaction Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>训练满意度</Text>
          <Slider
            value={satisfaction}
            minimumValue={1}
            maximumValue={10}
            onValueChange={setSatisfaction}
            minLabel="很差"
            maxLabel="完美"
            testID="satisfaction-slider"
          />
          {showWarning && (
            <Text style={[styles.sliderValue, styles.warningText]}>
              {satisfaction}
            </Text>
          )}
        </View>

        {/* Warning */}
        {showWarning && (
          <View style={styles.warningCard}>
            <Text style={styles.warningMessage}>{WARNING_MESSAGE}</Text>
          </View>
        )}

        {/* Per-exercise notes */}
        {completedExercises.length > 0 && (
          <View style={styles.section} testID="exercise-note-list">
            <Text style={styles.sectionTitle}>动作感受</Text>
            {completedExercises.map((exercise) => {
              const name =
                exerciseNames.get(exercise.exercise_biz_key) ?? "Unknown";
              const sets = setsByExercise.get(exercise.biz_key) ?? [];
              const summary = formatExerciseSummary(name, sets);
              const note = exerciseNotes.get(exercise.exercise_biz_key) ?? "";

              return (
                <Card
                  key={exercise.biz_key.toString()}
                  style={styles.noteCard}
                  testID={`exercise-note-${exercise.exercise_biz_key.toString()}`}
                >
                  <Text style={styles.exerciseSummary}>{summary}</Text>
                  <Input
                    value={note}
                    onChangeText={(text: string) =>
                      handleExerciseNoteChange(exercise.exercise_biz_key, text)
                    }
                    placeholder="感受..."
                    style={styles.noteInput}
                    testID={`exercise-note-input-${exercise.exercise_biz_key.toString()}`}
                  />
                </Card>
              );
            })}
          </View>
        )}

        {/* Overall note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>整体备注</Text>
          <Input
            value={overallNote}
            onChangeText={setOverallNote}
            placeholder="今天训练的整体感受..."
            style={styles.overallNoteInput}
          />
        </View>

        {/* Save button */}
        <View style={styles.buttonSection}>
          <Button onPress={handleSave} testID="save-feeling-btn">
            保存
          </Button>
          <View style={styles.skipSpacer} />
          <Button onPress={onSkip} variant="secondary">
            跳过
          </Button>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: Typography.heading1.fontWeight as "600",
    color: Colors.textPrimary,
    letterSpacing: Typography.heading1.letterSpacing,
  },
  summary: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    letterSpacing: Typography.heading3.letterSpacing,
    marginBottom: 4,
  },
  sliderValue: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    textAlign: "center",
    marginTop: 4,
  },
  warningText: {
    color: "#ff9500",
  },
  warningCard: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  warningMessage: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#ff9500",
    textAlign: "center",
  },
  noteCard: {
    marginBottom: 8,
  },
  exerciseSummary: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  noteInput: {
    height: 44,
  },
  overallNoteInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  buttonSection: {
    gap: 12,
    marginTop: 8,
  },
  skipSpacer: {
    height: 4,
  },
});
