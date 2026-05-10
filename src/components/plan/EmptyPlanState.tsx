/**
 * EmptyPlanState
 *
 * Empty state shown when there are no training plans.
 * Shows a prompt to create the first plan.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "../ui/Button";
import { Colors, Typography, Spacing } from "@utils/constants";

export interface EmptyPlanStateProps {
  onCreatePlan: () => void;
}

export function EmptyPlanState({ onCreatePlan }: EmptyPlanStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📋</Text>
      <Text style={styles.title}>创建你的第一个训练计划</Text>
      <Text style={styles.subtitle}>制定训练计划，开始你的力量训练之旅</Text>
      <View style={styles.buttonContainer}>
        <Button onPress={onCreatePlan}>新建计划</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.contentPadding,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight as "600",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
});
