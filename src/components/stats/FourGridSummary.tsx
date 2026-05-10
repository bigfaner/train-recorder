/**
 * FourGridSummary
 *
 * Displays four summary cards in a 2x2 grid:
 * - Card 1: Weekly sessions (current/target)
 * - Card 2: Monthly sessions (consecutive weeks)
 * - Card 3: Weekly total duration (hours)
 * - Card 4: Monthly new PRs
 */

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { FourGridData } from "@services/stats-service";

export interface FourGridSummaryProps {
  data: FourGridData;
}

export function FourGridSummary({ data }: FourGridSummaryProps) {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth =
    (screenWidth - Spacing.contentPadding * 2 - Spacing.cardSpacing) / 2;
  const {
    weeklySessions,
    weeklyTarget,
    monthlySessions,
    consecutiveWeeks,
    weeklyDurationHours,
    monthlyPRCount,
  } = data;

  const cards = [
    {
      label: "本周训练",
      value: String(weeklySessions),
      sublabel: weeklyTarget > 0 ? `目标 ${weeklyTarget} 次` : "",
    },
    {
      label: "本月训练",
      value: String(monthlySessions),
      sublabel: consecutiveWeeks > 0 ? `连续 ${consecutiveWeeks} 周` : "",
    },
    {
      label: "本周时长",
      value: weeklyDurationHours > 0 ? weeklyDurationHours.toFixed(1) : "0",
      sublabel: "小时",
    },
    {
      label: "本月 PR",
      value: String(monthlyPRCount),
      sublabel: "新增记录",
    },
  ];

  return (
    <View style={styles.grid} testID="stats-grid">
      {cards.map((card, index) => (
        <View
          key={index}
          style={[styles.card, { width: cardWidth }]}
          testID={
            [
              "weekly-session-count",
              "monthly-session-count",
              "weekly-duration",
              "monthly-pr-count",
            ][index]
          }
        >
          <Text style={styles.cardLabel}>{card.label}</Text>
          <Text style={styles.cardValue}>{card.value}</Text>
          {card.sublabel ? (
            <Text style={styles.cardSublabel}>{card.sublabel}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.cardSpacing,
    marginBottom: Spacing.cardSpacing,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  cardSublabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
