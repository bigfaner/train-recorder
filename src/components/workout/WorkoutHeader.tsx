/**
 * WorkoutHeader component for the workout execution page.
 *
 * Displays:
 * - Back button (with exit confirmation)
 * - Training type label (e.g. "推日")
 * - Progress indicator (completed/total exercises)
 */

import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
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

  const [showExitDialog, setShowExitDialog] = useState(false);

  const confirmText = getExitConfirmText(completedExercises, totalExercises);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    setShowExitDialog(true);
  }, [onBackPress]);

  const handleConfirmExit = useCallback(() => {
    setShowExitDialog(false);
    onExit();
  }, [onExit]);

  const handleCancelExit = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  return (
    <>
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

      {/* Exit confirmation dialog */}
      <Modal
        visible={showExitDialog}
        transparent
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContent} testID="exit-confirm-dialog">
            <Text style={styles.dialogMessage} testID="exit-message">
              {confirmText}
            </Text>
            <View style={styles.dialogButtonRow}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                onPress={handleCancelExit}
              >
                <Text style={styles.dialogCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmButton}
                onPress={handleConfirmExit}
                testID="confirm-exit-btn"
              >
                <Text style={styles.dialogConfirmText}>确定结束</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialogContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 360,
  },
  dialogMessage: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  dialogButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dialogCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogCancelText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  dialogConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogConfirmText: {
    fontSize: Typography.body.fontSize,
    color: "#ffffff",
    fontWeight: "600" as const,
  },
});
