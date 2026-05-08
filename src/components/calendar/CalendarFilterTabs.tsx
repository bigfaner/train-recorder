/**
 * CalendarFilterTabs
 *
 * Training type filter tabs below the month header.
 * Options: 全部 / 推 / 拉 / 蹲 / 其他运动
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Typography } from "@utils/constants";

export type FilterType = "push" | "pull" | "legs" | "custom" | null;

export interface CalendarFilterTabsProps {
  /** Currently active filter (null = show all) */
  activeFilter: FilterType;
  /** Called when a filter is selected */
  onFilterChange: (filter: FilterType) => void;
}

const FILTER_OPTIONS: Array<{ key: FilterType; label: string }> = [
  { key: null, label: "全部" },
  { key: "push", label: "推" },
  { key: "pull", label: "拉" },
  { key: "legs", label: "蹲" },
  { key: "custom", label: "其他运动" },
];

export function CalendarFilterTabs({
  activeFilter,
  onFilterChange,
}: CalendarFilterTabsProps) {
  return (
    <View style={styles.container}>
      {FILTER_OPTIONS.map((option) => {
        const isActive =
          activeFilter === option.key ||
          (activeFilter === null && option.key === null);

        return (
          <TouchableOpacity
            key={option.key ?? "all"}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onFilterChange(option.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Colors.backgroundAlt,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#ffffff",
  },
});
