/**
 * EmptyHistory
 *
 * Shown when there are no workout sessions yet.
 * Displays "完成你的第一次训练" prompt.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";

export interface EmptyHistoryProps {
  /** Optional: navigate to start workout */
  onStartWorkout?: () => void;
}

export function EmptyHistory(_props: EmptyHistoryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏋️</Text>
      <Text style={styles.title}>还没有训练记录</Text>
      <Text style={styles.subtitle}>完成你的第一次训练，开始记录你的进步</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.contentPadding * 2,
    paddingVertical: Spacing.sectionSpacing * 2,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
