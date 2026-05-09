/**
 * HistoryCard
 *
 * Training record card for the history panel.
 * Shows date, type tag, exercise summary, volume, satisfaction.
 * Supports PR badge (green) on exercises that hit personal records.
 * Supports left-swipe to reveal edit/delete actions.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import { Tag } from "../ui/Tag";

export interface ExerciseSummary {
  exerciseName: string;
  weight: number;
  reps: number;
  sets: number;
  isPR: boolean;
}

export interface HistoryCardProps {
  /** Formatted date string (e.g., "5月7日 周四") */
  formattedDate: string;
  /** Training type label (e.g., "推日") */
  typeLabel: string;
  /** Training type for color coding */
  trainingType: "push" | "pull" | "legs" | "custom";
  /** Exercises summary */
  exercises: ExerciseSummary[];
  /** Formatted volume string (e.g., "8,400 kg") */
  volume: string;
  /** Formatted satisfaction string (e.g., "★ 7/10") */
  satisfaction: string;
  /** Whether this is a backlog workout */
  isBacklog: boolean;
  /** Navigate to edit */
  onEdit: () => void;
  /** Delete handler */
  onDelete: () => void;
  /** Card press handler */
  onPress: () => void;
  /** Optional testID */
  testID?: string;
}

export function HistoryCard({
  formattedDate,
  typeLabel,
  trainingType,
  exercises,
  volume,
  satisfaction,
  isBacklog,
  onPress,
  testID,
}: HistoryCardProps) {
  const typeColor = getTypeColor(trainingType);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      testID={testID}
    >
      <View style={styles.cardDate}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Tag label={typeLabel} color={typeColor} />
          {isBacklog && <Tag label="补录" color={Colors.textTertiary} />}
        </View>
      </View>

      <View style={styles.cardExercises}>
        {exercises.map((exercise, index) => (
          <View key={index} style={styles.exerciseLine}>
            <Text style={styles.exerciseText}>
              {exercise.weight === 0 ? "BW" : `${exercise.weight}kg`} x{" "}
              {exercise.reps} x {exercise.sets}
            </Text>
            <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
            {exercise.isPR && (
              <View style={styles.prBadge}>
                <Text style={styles.prBadgeText}>PR</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>容量: {volume}</Text>
        <Text style={styles.footerText}>{satisfaction}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getTypeColor(type: "push" | "pull" | "legs" | "custom"): string {
  const colors: Record<string, string> = {
    push: Colors.pushDay,
    pull: Colors.pullDay,
    legs: Colors.legDay,
    custom: Colors.otherSport,
  };
  return colors[type];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardSpacing,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardDate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  cardExercises: {
    gap: 4,
  },
  exerciseLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exerciseName: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  exerciseText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  prBadge: {
    backgroundColor: "rgba(48, 209, 88, 0.15)",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  prBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.success,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
  },
  footerText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
  },
});
