/**
 * CalendarMonthGrid
 *
 * Renders a 7-column month grid with weekday headers.
 * Each day cell shows a colored dot indicating training type.
 * Supports selecting a date to show the detail card.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { CalendarDay } from "../../types";
import { Colors, Typography } from "@utils/constants";
import {
  WEEKDAY_LABELS_SHORT,
  getDaysInMonth,
  getFirstDayWeekday,
  formatDateISO,
  isToday,
  getTrainingTypeColor,
} from "../../utils/date";

export interface CalendarMonthGridProps {
  /** Year (e.g. 2026) */
  year: number;
  /** Month, 1-indexed (1=January) */
  month: number;
  /** Calendar day data for the month */
  calendarDays: CalendarDay[];
  /** Currently selected date (YYYY-MM-DD) */
  selectedDate: string | null;
  /** Called when a date is tapped */
  onDateSelect: (date: string) => void;
  /** Optional filter for training type (null = show all) */
  filterType: "push" | "pull" | "legs" | "custom" | null;
}

/** Map of dayType to display indicator */
function getDayIndicator(day: CalendarDay): {
  dotColor: string | null;
  isCheck: boolean;
  isPartial: boolean;
  isSkipped: boolean;
  isOtherSport: boolean;
} {
  switch (day.dayType) {
    case "completed":
      return {
        dotColor: null,
        isCheck: true,
        isPartial: false,
        isSkipped: false,
        isOtherSport: false,
      };
    case "completed_partial":
      return {
        dotColor: null,
        isCheck: true,
        isPartial: true,
        isSkipped: false,
        isOtherSport: false,
      };
    case "skipped":
      return {
        dotColor: null,
        isCheck: false,
        isPartial: false,
        isSkipped: true,
        isOtherSport: false,
      };
    case "other_sport":
      return {
        dotColor: Colors.otherSport,
        isCheck: false,
        isPartial: false,
        isSkipped: false,
        isOtherSport: true,
      };
    case "training":
      return {
        dotColor: day.trainingDay
          ? getTrainingTypeColor(day.trainingDay.training_type)
          : Colors.accent,
        isCheck: false,
        isPartial: false,
        isSkipped: false,
        isOtherSport: false,
      };
    case "rest":
    default:
      return {
        dotColor: null,
        isCheck: false,
        isPartial: false,
        isSkipped: false,
        isOtherSport: false,
      };
  }
}

export function CalendarMonthGrid({
  year,
  month,
  calendarDays,
  selectedDate,
  onDateSelect,
  filterType,
}: CalendarMonthGridProps) {
  const totalDays = getDaysInMonth(year, month);
  const firstWeekday = getFirstDayWeekday(year, month);

  // Build a lookup map for calendar days
  const dayMap = new Map<string, CalendarDay>();
  for (const cd of calendarDays) {
    dayMap.set(cd.date, cd);
  }

  // Build grid cells: empty cells for offset, then day cells
  const cells: Array<{
    type: "empty" | "day";
    date?: string;
    day?: number;
    calendarDay?: CalendarDay;
  }> = [];

  // Offset: firstWeekday is 1=Monday, so offset = firstWeekday - 1
  for (let i = 0; i < firstWeekday - 1; i++) {
    cells.push({ type: "empty" });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = formatDateISO(year, month, d);
    cells.push({
      type: "day",
      date: dateStr,
      day: d,
      calendarDay: dayMap.get(dateStr),
    });
  }

  // Check if a day should be dimmed by filter
  function isDimmed(calendarDay?: CalendarDay): boolean {
    if (!filterType || !calendarDay) return false;
    if (calendarDay.dayType === "rest") return false;
    return (
      calendarDay.trainingDay?.training_type !== filterType &&
      calendarDay.dayType !== "other_sport"
    );
  }

  return (
    <View style={styles.grid}>
      {/* Weekday headers */}
      <View style={styles.headerRow}>
        {WEEKDAY_LABELS_SHORT.map((label) => (
          <View key={label} style={styles.headerCell}>
            <Text style={styles.headerText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day rows */}
      {buildRows(cells).map((row, rowIdx) => (
        <View key={rowIdx} style={styles.weekRow}>
          {row.map((cell, cellIdx) => {
            if (cell.type === "empty") {
              return <View key={`empty-${cellIdx}`} style={styles.dayCell} />;
            }

            const dateStr = cell.date!;
            const dayNum = cell.day!;
            const calendarDay = cell.calendarDay;
            const selected = dateStr === selectedDate;
            const today = isToday(dateStr);
            const indicator = calendarDay
              ? getDayIndicator(calendarDay)
              : {
                  dotColor: null,
                  isCheck: false,
                  isPartial: false,
                  isSkipped: false,
                  isOtherSport: false,
                };
            const dimmed = isDimmed(calendarDay);

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  selected && styles.dayCellSelected,
                  today && styles.dayCellToday,
                ]}
                onPress={() => onDateSelect(dateStr)}
                activeOpacity={0.6}
                accessibilityLabel={`${month}月${dayNum}日`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.dayText,
                    today && styles.dayTextToday,
                    selected && styles.dayTextSelected,
                    dimmed && styles.dayTextDimmed,
                  ]}
                >
                  {dayNum}
                </Text>

                {/* Training type dot */}
                {indicator.dotColor && !dimmed && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: indicator.dotColor },
                    ]}
                  />
                )}

                {/* Completed checkmark */}
                {indicator.isCheck && !dimmed && (
                  <View
                    style={[
                      styles.checkDot,
                      indicator.isPartial && styles.checkDotPartial,
                    ]}
                  >
                    <Text style={styles.checkMark}>
                      {indicator.isPartial ? "◐" : "✓"}
                    </Text>
                  </View>
                )}

                {/* Skipped indicator */}
                {indicator.isSkipped && !dimmed && (
                  <View style={styles.skippedDash} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * Split cells array into rows of 7.
 */
function buildRows<T>(cells: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  // Pad last row if needed
  const lastRow = rows[rows.length - 1];
  if (lastRow && lastRow.length < 7) {
    while (lastRow.length < 7) {
      lastRow.push({ type: "empty" } as T);
    }
  }
  return rows;
}

const DAY_CELL_SIZE = 44;

const styles = StyleSheet.create({
  grid: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 28,
  },
  headerText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textTertiary,
    letterSpacing: Typography.caption.letterSpacing,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: DAY_CELL_SIZE,
    borderRadius: DAY_CELL_SIZE / 2,
  },
  dayCellSelected: {
    backgroundColor: Colors.accent,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textPrimary,
  },
  dayTextToday: {
    fontWeight: "600",
    color: Colors.accent,
  },
  dayTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  dayTextDimmed: {
    opacity: 0.3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    bottom: 4,
  },
  checkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 3,
  },
  checkDotPartial: {
    opacity: 0.6,
  },
  checkMark: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  skippedDash: {
    width: 8,
    height: 1.5,
    backgroundColor: Colors.textTertiary,
    borderStyle: "dashed",
    position: "absolute",
    bottom: 7,
  },
});
