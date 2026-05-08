/**
 * TrendChart
 *
 * Line chart showing a selected body metric over time.
 * Uses a simplified View-based chart rendering (no native chart
 * dependency for testability). Metric selector at top.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { BodyMeasurement } from "../../types";
import {
  BODY_METRICS,
  buildTrendData,
  formatBodyDate,
  type BodyMetricKey,
} from "./body-helpers";

export interface TrendChartProps {
  measurements: BodyMeasurement[];
  selectedMetric?: BodyMetricKey;
  onMetricChange?: (key: BodyMetricKey) => void;
}

const CHART_HEIGHT = 160;
const CHART_PADDING = 20;

export function TrendChart({
  measurements,
  selectedMetric: externalMetric,
  onMetricChange,
}: TrendChartProps) {
  const [internalMetric, setInternalMetric] =
    useState<BodyMetricKey>("body_weight");
  const metricKey = externalMetric ?? internalMetric;

  const handleMetricChange = (key: BodyMetricKey) => {
    if (onMetricChange) {
      onMetricChange(key);
    } else {
      setInternalMetric(key);
    }
  };

  const data = buildTrendData(measurements, metricKey);

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>趋势图</Text>
        <MetricSelector selected={metricKey} onSelect={handleMetricChange} />
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>暂无数据</Text>
        </View>
      </View>
    );
  }

  const values = data.map((d) => d.value as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - Spacing.contentPadding * 2 - CHART_PADDING;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>趋势图</Text>
      <MetricSelector selected={metricKey} onSelect={handleMetricChange} />

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Y axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{maxVal.toFixed(1)}</Text>
          <Text style={styles.yLabel}>{minVal.toFixed(1)}</Text>
        </View>

        {/* Line chart with dots */}
        <View style={[styles.chartContent, { height: CHART_HEIGHT }]}>
          {data.map((point, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * chartWidth;
            const y =
              CHART_HEIGHT -
              ((point.value! - minVal) / range) * (CHART_HEIGHT - 20) -
              10;

            return (
              <View
                key={point.date}
                style={[styles.dot, { left: x - 3, top: y - 3 }]}
              />
            );
          })}
          {/* Line connecting dots (simplified as a horizontal guide) */}
          {data.length > 1 && <View style={styles.chartLine} />}
        </View>
      </View>

      {/* X axis labels (first, mid, last) */}
      <View style={styles.xAxis}>
        {data.length > 0 && (
          <Text style={styles.xLabel}>{formatBodyDate(data[0].date)}</Text>
        )}
        {data.length > 2 && (
          <Text style={styles.xLabel}>
            {formatBodyDate(data[Math.floor(data.length / 2)].date)}
          </Text>
        )}
        {data.length > 1 && (
          <Text style={styles.xLabel}>
            {formatBodyDate(data[data.length - 1].date)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================================
// MetricSelector sub-component
// ============================================================

interface MetricSelectorProps {
  selected: BodyMetricKey;
  onSelect: (key: BodyMetricKey) => void;
}

function MetricSelector({ selected, onSelect }: MetricSelectorProps) {
  return (
    <View style={metricStyles.container}>
      {BODY_METRICS.map((metric) => (
        <TouchableOpacity
          key={metric.key}
          style={[
            metricStyles.option,
            selected === metric.key && metricStyles.optionActive,
          ]}
          onPress={() => onSelect(metric.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              metricStyles.optionText,
              selected === metric.key && metricStyles.optionTextActive,
            ]}
          >
            {metric.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

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
  chartArea: {
    flexDirection: "row",
    marginTop: 12,
  },
  yAxis: {
    width: 36,
    justifyContent: "space-between",
    paddingRight: 4,
    paddingVertical: 10,
  },
  yLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: "right",
  },
  chartContent: {
    flex: 1,
    position: "relative" as const,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chartLine: {
    position: "absolute" as const,
    top: "50%" as unknown as number,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  dot: {
    position: "absolute" as const,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 36,
    marginTop: 4,
  },
  xLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
  },
});

const metricStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.backgroundAlt,
  },
  optionActive: {
    backgroundColor: Colors.accent,
  },
  optionText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: "#ffffff",
  },
});
