/**
 * EmptyBodyState
 *
 * Empty state for body data page when no measurements exist.
 * Shows a prompt to record the first body measurement.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";

export interface EmptyBodyStateProps {
  onRecord: () => void;
}

export function EmptyBodyState({ onRecord }: EmptyBodyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📏</Text>
      <Text style={styles.title}>还没有身体数据</Text>
      <Text style={styles.subtitle}>记录你的第一次身体数据</Text>
      <Text style={styles.hint} onPress={onRecord}>
        点击 "+ 记录数据" 开始记录
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sectionSpacing * 2,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  hint: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.accent,
  },
});
