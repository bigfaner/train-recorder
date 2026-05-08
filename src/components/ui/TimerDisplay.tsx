import React from "react";
import { Text, StyleSheet } from "react-native";
import { Colors, Typography } from "@utils/constants";

export interface TimerDisplayProps {
  seconds: number;
}

/**
 * Format seconds to M:SS display string.
 */
export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TimerDisplay({ seconds }: TimerDisplayProps) {
  return (
    <Text style={styles.timer} accessibilityRole="text">
      {formatTimerDisplay(seconds)}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: Typography.timerDisplay.fontSize,
    fontWeight: Typography.timerDisplay.fontWeight,
    letterSpacing: Typography.timerDisplay.letterSpacing,
    color: Colors.textPrimary,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});
