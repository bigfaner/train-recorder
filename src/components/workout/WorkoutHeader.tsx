/**
 * WorkoutHeader component for the workout execution page.
 *
 * Displays:
 * - Back button (with exit confirmation)
 * - Training type label (e.g. "推日")
 * - Progress indicator (completed/total exercises)
 */

import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import { formatExerciseProgress, getExitConfirmText } from "./workout-helpers";

export interface WorkoutHeaderProps {
  /** Training type label (e.g. "推日", "拉日", "蹲日") */
  trainingTypeLabel: string;
  /** Number of completed exercises */
  completedExercises: number;
  /** Total number of exercises */
  totalExercises: number;
  /** Callback when user confirms exit */
  onExit: () => void;
  /** Callback when back button pressed */
  onBackPress?: () => void;
}

export function WorkoutHeader({
  trainingTypeLabel,
  completedExercises,
  totalExercises,
  onExit,
  onBackPress,
}: WorkoutHeaderProps) {
  const progressText = formatExerciseProgress(
    completedExercises,
    totalExercises,
  );

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    const confirmText = getExitConfirmText(completedExercises, totalExercises);

    Alert.alert("", confirmText, [
      { text: "取消", style: "cancel" },
      {
        text: "确定结束",
        style: "destructive",
        onPress: onExit,
      },
    ]);
  }, [completedExercises, totalExercises, onExit, onBackPress]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleBackPress}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="返回"
        testID="back-btn"
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{trainingTypeLabel}</Text>
      <Text style={styles.progress}>{progressText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 44, // navBarHeight
    paddingHorizontal: Spacing.contentPadding,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: Spacing.touchTarget,
    height: Spacing.touchTarget,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backArrow: {
    fontSize: 22,
    color: Colors.accent,
  },
  title: {
    flex: 1,
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  progress: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textTertiary,
    letterSpacing: Typography.caption.letterSpacing,
  },
});
