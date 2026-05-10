/**
 * TrainingDayCard
 *
 * Displays a training day in the plan management view.
 * Shows day name, training type tag, and exercise summary.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { TrainingDay, PlanExercise } from "../../types";
import {
  getTrainingTypeDisplayLabel,
  buildExerciseSummary,
  formatDayCardTitle,
} from "./plan-helpers";
import { getTrainingTypeColor } from "../../utils/date";

export interface TrainingDayCardProps {
  day: TrainingDay;
  exercises: PlanExercise[];
  exerciseNameMap: Map<bigint, string>;
  index: number;
  onPress?: (day: TrainingDay) => void;
}

export function TrainingDayCard({
  day,
  exercises,
  exerciseNameMap,
  index,
  onPress,
}: TrainingDayCardProps) {
  const title = formatDayCardTitle(day, index);
  const summary = buildExerciseSummary(exercises, exerciseNameMap);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(day)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.dayTitle}>{title}</Text>
          <Tag
            label={getTrainingTypeDisplayLabel(day.training_type)}
            color={getTrainingTypeColor(day.training_type)}
          />
        </View>
        {summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
        ) : (
          <Text style={styles.emptySummary}>无动作</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.cardSpacing,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dayTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  summary: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  emptySummary: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
});
