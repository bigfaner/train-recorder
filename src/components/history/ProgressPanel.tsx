/**
 * ProgressPanel
 *
 * Shows exercise selector dropdown + line chart (date vs weight)
 * with PR points highlighted green.
 * Uses View-based rendering for chart compatibility.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { ProgressDataPoint } from "../exercise/exercise-helpers";

export interface ExerciseOption {
  exerciseBizKey: bigint;
  exerciseName: string;
}

export interface ProgressPanelProps {
  /** Available exercises for the selector */
  exercises: ExerciseOption[];
  /** Currently selected exercise biz_key */
  selectedExerciseBizKey: bigint | null;
  /** Callback when exercise is selected */
  onExerciseSelect: (bizKey: bigint) => void;
  /** Progress data points for the selected exercise */
  progressData: ProgressDataPoint[];
  /** Chart title (e.g., "深蹲重量趋势") */
  chartTitle: string;
  /** Subtitle (e.g., "近4次训练") */
  chartSubtitle: string;
}

export function ProgressPanel({
  exercises,
  selectedExerciseBizKey,
  onExerciseSelect,
  progressData,
  chartTitle,
  chartSubtitle,
}: ProgressPanelProps) {
  return (
    <View>
      {/* Exercise selector */}
      <View style={styles.selectorWrapper} testID="exercise-selector">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {exercises.map((exercise) => {
            const isSelected =
              exercise.exerciseBizKey === selectedExerciseBizKey;
            return (
              <TouchableOpacity
                key={String(exercise.exerciseBizKey)}
                style={[
                  styles.selectorOption,
                  isSelected && styles.selectorOptionActive,
                ]}
                onPress={() => onExerciseSelect(exercise.exerciseBizKey)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorText,
                    isSelected && styles.selectorTextActive,
                  ]}
                >
                  {exercise.exerciseName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Progress Chart */}
      <View style={styles.chartContainer} testID="progress-chart">
        <Text style={styles.chartTitle}>{chartTitle}</Text>
        <Text style={styles.chartSubtitle}>{chartSubtitle}</Text>

        {progressData.length > 0 ? (
          <View style={styles.chartArea}>
            {/* Simplified chart rendering using Views */}
            {renderChart(progressData)}
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>暂无数据</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function renderChart(data: ProgressDataPoint[]): React.ReactNode {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;
  const chartHeight = 160;

  return (
    <View>
      {/* Data points as vertical bars */}
      <View style={chartStyles.container}>
        {data.map((point, index) => {
          const heightPercent = (point.value - minValue) / range;
          const barHeight = Math.max(4, heightPercent * chartHeight);
          const showLabel =
            index % Math.max(1, Math.floor(data.length / 4)) === 0;

          return (
            <View key={index} style={chartStyles.barWrapper}>
              <Text
                style={[
                  chartStyles.valueLabel,
                  point.isPR && chartStyles.valueLabelPR,
                ]}
              >
                {point.value}
              </Text>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: barHeight,
                    backgroundColor: point.isPR
                      ? Colors.success
                      : Colors.accent,
                  },
                ]}
              />
              {showLabel && (
                <Text style={chartStyles.dateLabel}>{point.date.slice(5)}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* PR legend */}
      {data.some((d) => d.isPR) && (
        <View style={chartStyles.legend}>
          <View style={chartStyles.legendDot} />
          <Text style={chartStyles.legendText}>PR</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selectorWrapper: {
    marginBottom: 16,
  },
  selectorOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Colors.backgroundAlt,
    marginRight: 8,
  },
  selectorOptionActive: {
    backgroundColor: Colors.accent,
  },
  selectorText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textSecondary,
  },
  selectorTextActive: {
    color: "#ffffff",
  },
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
});

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 180,
    paddingBottom: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    maxWidth: 60,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  valueLabelPR: {
    color: Colors.success,
  },
  dateLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    justifyContent: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.success,
  },
});
