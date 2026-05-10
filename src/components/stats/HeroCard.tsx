/**
 * HeroCard
 *
 * Displays weekly training volume with week-over-week change percentage.
 * Green arrow for increase, red arrow for decrease.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { HeroCardData } from "@services/stats-service";

export interface HeroCardProps {
  data: HeroCardData;
}

export function HeroCard({ data }: HeroCardProps) {
  const { weeklyVolume, weeklyChangePct } = data;

  const formattedVolume = formatVolume(weeklyVolume);
  const changeDisplay = formatChangePct(weeklyChangePct);
  const changeColor =
    weeklyChangePct === null
      ? Colors.textTertiary
      : weeklyChangePct >= 0
        ? Colors.success
        : Colors.error;
  const changeArrow =
    weeklyChangePct === null ? "" : weeklyChangePct >= 0 ? " ↑" : " ↓";

  return (
    <View style={styles.card} testID="stats-hero-card">
      <Text style={styles.label}>本周训练容量</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value} testID="weekly-volume">
          {formattedVolume}
        </Text>
        <Text style={styles.unit}>kg</Text>
      </View>
      <Text
        style={[styles.change, { color: changeColor }]}
        testID="week-over-week-change"
      >
        周环比 {changeDisplay}
        {changeArrow}
      </Text>
    </View>
  );
}

export function formatVolume(volume: number): string {
  if (volume >= 10000) {
    return volume.toLocaleString("en-US");
  }
  return volume.toLocaleString("en-US");
}

export function formatChangePct(pct: number | null): string {
  if (pct === null) return "--";
  const absPct = Math.abs(pct * 100);
  const sign = pct >= 0 ? "+" : "-";
  return `${sign}${absPct.toFixed(0)}%`;
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
  change: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 8,
  },
});
