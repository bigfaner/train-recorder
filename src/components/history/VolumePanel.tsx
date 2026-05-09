/**
 * VolumePanel
 *
 * Shows bar chart (date vs total volume) with summary card
 * (weekly/monthly totals and week-over-week change).
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { VolumeDataPoint, VolumeSummary } from "./history-helpers";

export interface VolumePanelProps {
  /** Weekly volume data points for the bar chart */
  volumeData: VolumeDataPoint[];
  /** Volume summary statistics */
  summary: VolumeSummary;
  /** Formatted week-over-week change string */
  weekChange: string;
}

export function VolumePanel({
  volumeData,
  summary,
  weekChange,
}: VolumePanelProps) {
  return (
    <View>
      {/* Bar Chart */}
      <View style={styles.chartContainer} testID="volume-chart">
        <Text style={styles.chartTitle}>每周总容量</Text>
        <Text style={styles.chartSubtitle}>近{volumeData.length}周</Text>

        {volumeData.length > 0 ? (
          <View style={styles.chartArea}>{renderBarChart(volumeData)}</View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>暂无数据</Text>
          </View>
        )}
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>本周容量</Text>
          <Text style={styles.summaryValue}>
            {formatVolumeDisplay(summary.currentWeek)}
          </Text>
        </View>
        <View style={[styles.summaryRow, { marginTop: 8 }]}>
          <Text style={styles.summaryLabel}>上周对比</Text>
          <Text
            style={[
              styles.summaryChange,
              weekChange.startsWith("+") && styles.summaryChangePositive,
              weekChange.startsWith("-") && styles.summaryChangeNegative,
            ]}
          >
            {weekChange}
          </Text>
        </View>
        <View style={[styles.summaryRow, { marginTop: 8 }]}>
          <Text style={styles.summaryLabel}>月累计</Text>
          <Text style={styles.summaryTotal}>
            {formatVolumeDisplay(summary.monthlyTotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatVolumeDisplay(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(volume % 1000 === 0 ? 0 : 1)}k kg`;
  }
  return `${volume} kg`;
}

function renderBarChart(data: VolumeDataPoint[]): React.ReactNode {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 160;

  return (
    <View style={barStyles.container}>
      {data.map((point, index) => {
        const heightPercent = point.value / maxValue;
        const barHeight = Math.max(4, heightPercent * chartHeight);
        const isLatest = index === data.length - 1;
        const opacity = isLatest ? 0.45 : 0.5 + (index / data.length) * 0.5;

        return (
          <View key={index} style={barStyles.barWrapper}>
            <Text style={barStyles.barValue}>
              {point.value >= 1000
                ? `${Math.round(point.value / 1000)}k`
                : String(point.value)}
            </Text>
            <View
              style={[
                barStyles.bar,
                {
                  height: barHeight,
                  opacity,
                },
              ]}
            />
            <Text style={barStyles.barLabel}>{point.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  chartTitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    marginBottom: 16,
  },
  chartArea: {
    minHeight: 160,
  },
  emptyChart: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
    marginTop: Spacing.cardSpacing,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  summaryChange: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  summaryChangePositive: {
    color: Colors.success,
  },
  summaryChangeNegative: {
    color: Colors.error,
  },
  summaryTotal: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
});

const barStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 200,
    paddingBottom: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    maxWidth: 50,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
