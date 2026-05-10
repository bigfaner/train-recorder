/**
 * PRList
 *
 * Top 4 exercises with estimated 1RM and date.
 * "查看全部" link to history PR panel.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { PRListEntry } from "@services/stats-service";

export interface PRListProps {
  records: PRListEntry[];
  onViewAll?: () => void;
}

export function PRList({ records, onViewAll }: PRListProps) {
  if (records.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>个人记录</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>查看全部</Text>
        </TouchableOpacity>
      </View>
      {records.map((record, index) => (
        <View key={index} style={styles.prRow}>
          <View style={styles.prInfo}>
            <Text style={styles.prName}>{record.exerciseName}</Text>
            <Text style={styles.prDate}>{record.date}</Text>
          </View>
          <View style={styles.prValue}>
            <Text style={styles.prWeight}>
              {formatWeight(record.estimated1RM)}
            </Text>
            <Text style={styles.prLabel}>1RM</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function formatWeight(value: number): string {
  if (Number.isInteger(value)) return `${value} kg`;
  return `${value.toFixed(1)} kg`;
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: Typography.caption.fontSize,
    color: Colors.accent,
  },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    fontWeight: "500" as const,
  },
  prDate: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  prValue: {
    alignItems: "flex-end",
  },
  prWeight: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: "700" as const,
    color: Colors.success,
  },
  prLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
