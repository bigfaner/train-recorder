/**
 * CalendarMonthHeader
 *
 * Month navigation header with year/month display and left/right arrows.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Typography } from "@utils/constants";
import { MONTH_LABELS } from "../../utils/date";

export interface CalendarMonthHeaderProps {
  /** Year (e.g. 2026) */
  year: number;
  /** Month, 1-indexed (1=January) */
  month: number;
  /** Navigate to previous month */
  onPrevMonth: () => void;
  /** Navigate to next month */
  onNextMonth: () => void;
}

export function CalendarMonthHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
}: CalendarMonthHeaderProps) {
  const monthLabel = MONTH_LABELS[month - 1] ?? String(month);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrevMonth}
        style={styles.arrowButton}
        accessibilityLabel="上一个月"
        accessibilityRole="button"
      >
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.labelContainer}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Text style={styles.yearLabel}>{year}</Text>
      </View>

      <TouchableOpacity
        onPress={onNextMonth}
        style={styles.arrowButton}
        accessibilityLabel="下一个月"
        accessibilityRole="button"
      >
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  arrowButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 28,
    fontWeight: "300",
    color: Colors.accent,
    lineHeight: 32,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  monthLabel: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight as "600",
    color: Colors.textPrimary,
  },
  yearLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
  },
});
