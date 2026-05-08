/**
 * WeeklyVolumeChart
 *
 * Bar chart showing the last 8 weeks of training volume.
 * Current week highlighted in accent color, last week with green border,
 * other weeks in grey.
 *
 * Uses @shopify/react-native-skia for rendering (BarChart approach).
 */

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { WeekVolume } from "@services/stats-service";

export interface WeeklyVolumeChartProps {
  data: WeekVolume[];
}

const BAR_WIDTH = 28;
const CHART_HEIGHT = 120;

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  const maxVolume = Math.max(...data.map((w) => w.volume), 1);
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - Spacing.contentPadding * 2;
  const barSpacing =
    (chartWidth - data.length * BAR_WIDTH) / (data.length - 1 || 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>周训练容量</Text>
      <View style={[styles.chartContainer, { height: CHART_HEIGHT + 20 }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{formatCompact(maxVolume)}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((week, index) => {
            const barHeight =
              week.volume > 0
                ? Math.max((week.volume / maxVolume) * CHART_HEIGHT, 4)
                : 2;
            const barColor = week.isCurrentWeek
              ? Colors.accent
              : week.isLastWeek
                ? Colors.success
                : Colors.border;

            return (
              <View
                key={index}
                style={[
                  styles.barWrapper,
                  { marginLeft: index === 0 ? 0 : barSpacing },
                ]}
              >
                <View style={[styles.barTrack, { height: CHART_HEIGHT }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: barColor,
                        borderWidth: week.isLastWeek ? 2 : 0,
                        borderColor: week.isLastWeek
                          ? Colors.success
                          : "transparent",
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    week.isCurrentWeek && styles.barLabelActive,
                  ]}
                >
                  {week.weekLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function formatCompact(value: number): string {
  if (value >= 10000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return String(Math.round(value));
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardSpacing,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: "row",
  },
  yAxis: {
    width: 36,
    justifyContent: "space-between",
    paddingRight: 4,
  },
  yLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: "right",
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  barWrapper: {
    alignItems: "center",
  },
  barTrack: {
    width: BAR_WIDTH,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: "center",
  },
  barLabelActive: {
    color: Colors.accent,
    fontWeight: "600" as const,
  },
});
