/**
 * TrainingHeatmap
 *
 * 28-day grid showing training frequency with intensity shading.
 * Colors: rest=0.1, light=0.4-0.6, moderate=0.7-0.8, heavy=0.9+
 * Planned but incomplete dates: blue border.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { HeatmapDay } from "@services/stats-service";

export interface TrainingHeatmapProps {
  data: HeatmapDay[];
}

const CELL_SIZE = 36;
const CELLS_PER_ROW = 7;

export function TrainingHeatmap({ data }: TrainingHeatmapProps) {
  // Split into weeks (rows of 7)
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < data.length; i += CELLS_PER_ROW) {
    weeks.push(data.slice(i, i + CELLS_PER_ROW));
  }

  const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>训练频率</Text>

      {/* Weekday labels */}
      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label, index) => (
          <Text key={index} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {/* Heatmap grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <View
              key={dayIndex}
              style={[
                styles.cell,
                {
                  backgroundColor: getIntensityColor(day.intensity),
                  borderWidth: day.isPlanned ? 2 : 0,
                  borderColor: day.isPlanned ? Colors.accent : "transparent",
                },
              ]}
            />
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>少</Text>
        {[0.1, 0.4, 0.6, 0.8, 0.9].map((intensity, index) => (
          <View
            key={index}
            style={[
              styles.legendCell,
              { backgroundColor: getIntensityColor(intensity) },
            ]}
          />
        ))}
        <Text style={styles.legendLabel}>多</Text>
      </View>
    </View>
  );
}

export function getIntensityColor(intensity: number): string {
  if (intensity <= 0.1) return "#ebedf0";
  if (intensity <= 0.4) return "#9be9a8";
  if (intensity <= 0.6) return "#40c463";
  if (intensity <= 0.8) return "#30a14e";
  return "#216e39";
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
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 10,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    marginRight: 4,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
