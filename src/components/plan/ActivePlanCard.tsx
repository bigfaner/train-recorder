/**
 * ActivePlanCard
 *
 * Displays the active training plan with plan name, mode, and status indicator.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";
import { Colors, Typography } from "@utils/constants";
import type { TrainingPlan } from "../../types";
import { formatPlanMode, formatScheduleMode } from "./plan-helpers";

export interface ActivePlanCardProps {
  plan: TrainingPlan;
  onPress?: () => void;
}

export function ActivePlanCard({ plan }: ActivePlanCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.planName}>{plan.plan_name}</Text>
        <Tag label="活跃中" color={Colors.success} />
      </View>
      <View style={styles.details}>
        <Text style={styles.detailText}>{formatPlanMode(plan.plan_mode)}</Text>
        <Text style={styles.detailSeparator}>·</Text>
        <Text style={styles.detailText}>
          {formatScheduleMode(plan.schedule_mode)}
        </Text>
        {plan.plan_mode === "fixed_cycle" && plan.cycle_length !== null && (
          <>
            <Text style={styles.detailSeparator}>·</Text>
            <Text style={styles.detailText}>{plan.cycle_length} 周</Text>
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  detailSeparator: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
  },
});
