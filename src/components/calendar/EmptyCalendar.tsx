/**
 * EmptyCalendar
 *
 * Shown when there is no active training plan.
 * Displays "创建你的第一个训练计划" prompt with a CTA button.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "../ui/Button";
import { Colors, Typography, Spacing } from "@utils/constants";

export interface EmptyCalendarProps {
  /** Navigate to plan creation */
  onCreatePlan: () => void;
}

export function EmptyCalendar({ onCreatePlan }: EmptyCalendarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📋</Text>
      <Text style={styles.title}>还没有训练计划</Text>
      <Text style={styles.subtitle}>
        创建你的第一个训练计划，开始记录你的训练旅程
      </Text>
      <View style={styles.buttonContainer}>
        <Button onPress={onCreatePlan}>创建训练计划</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.contentPadding * 2,
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
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 280,
  },
});
