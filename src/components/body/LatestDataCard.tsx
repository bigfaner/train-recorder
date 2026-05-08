/**
 * LatestDataCard
 *
 * Displays the most recent body weight with change trend arrow
 * and date. Shows green arrow for weight loss, red arrow for
 * weight gain.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { BodyMeasurement } from "../../types";
import {
  computeWeightChange,
  formatWeightValue,
  formatWeightChange,
  formatBodyDate,
} from "./body-helpers";

export interface LatestDataCardProps {
  latest: BodyMeasurement;
  previous: BodyMeasurement | null;
}

export function LatestDataCard({ latest, previous }: LatestDataCardProps) {
  const weightChange = computeWeightChange(latest, previous);
  const weightDisplay = formatWeightValue(latest.body_weight);
  const changeDisplay = formatWeightChange(weightChange.change);
  const dateDisplay = formatBodyDate(latest.record_date);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>最新体重</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{weightDisplay}</Text>
        <Text style={styles.unit}>kg</Text>
      </View>
      <View style={styles.changeRow}>
        <Text style={[styles.change, { color: weightChange.color }]}>
          {changeDisplay}
          {weightChange.arrow}
        </Text>
        <Text style={styles.date}>{dateDisplay}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding + 4,
    marginBottom: Spacing.cardSpacing,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  value: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    letterSpacing: -0.02,
  },
  unit: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  changeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  change: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "500" as const,
  },
  date: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
  },
});
