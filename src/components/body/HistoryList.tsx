/**
 * HistoryList
 *
 * List of body measurement records sorted by date descending.
 * Each item shows date, weight, and available circumference values.
 * Supports edit and delete via press actions.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { BodyMeasurement } from "../../types";
import {
  sortByDateDesc,
  formatWeightValue,
  formatBodyDate,
} from "./body-helpers";

export interface HistoryListProps {
  measurements: BodyMeasurement[];
  onEdit: (measurement: BodyMeasurement) => void;
  onDelete: (id: number) => void;
}

export function HistoryList({
  measurements,
  onEdit,
  onDelete,
}: HistoryListProps) {
  const sorted = sortByDateDesc(measurements);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {sorted.map((m) => (
        <HistoryItem
          key={m.id}
          measurement={m}
          onEdit={() => onEdit(m)}
          onDelete={() => confirmDelete(m.id, onDelete)}
        />
      ))}
    </ScrollView>
  );
}

// ============================================================
// HistoryItem
// ============================================================

interface HistoryItemProps {
  measurement: BodyMeasurement;
  onEdit: () => void;
  onDelete: () => void;
}

function HistoryItem({ measurement, onEdit, onDelete }: HistoryItemProps) {
  const dateDisplay = formatBodyDate(measurement.record_date);
  const weightDisplay = formatWeightValue(measurement.body_weight);

  // Show circumference values that are present
  const circumferenceLabels: string[] = [];
  if (measurement.chest_circumference !== null) {
    circumferenceLabels.push(`胸 ${measurement.chest_circumference}`);
  }
  if (measurement.waist_circumference !== null) {
    circumferenceLabels.push(`腰 ${measurement.waist_circumference}`);
  }
  if (measurement.arm_circumference !== null) {
    circumferenceLabels.push(`臂 ${measurement.arm_circumference}`);
  }
  if (measurement.thigh_circumference !== null) {
    circumferenceLabels.push(`腿 ${measurement.thigh_circumference}`);
  }

  return (
    <View style={itemStyles.card}>
      <TouchableOpacity
        onPress={onEdit}
        activeOpacity={0.7}
        style={itemStyles.content}
      >
        <View style={itemStyles.left}>
          <Text style={itemStyles.date}>{dateDisplay}</Text>
          {measurement.body_note && (
            <Text style={itemStyles.note} numberOfLines={1}>
              {measurement.body_note}
            </Text>
          )}
        </View>
        <View style={itemStyles.right}>
          <View style={itemStyles.weightRow}>
            <Text style={itemStyles.weight}>{weightDisplay}</Text>
            <Text style={itemStyles.unit}>kg</Text>
          </View>
          {circumferenceLabels.length > 0 && (
            <Text style={itemStyles.circumference}>
              {circumferenceLabels.join(" | ")} cm
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <View style={itemStyles.actions}>
        <TouchableOpacity onPress={onDelete} activeOpacity={0.7}>
          <Text style={itemStyles.deleteText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// Delete confirmation
// ============================================================

function confirmDelete(id: number, onDelete: (id: number) => void) {
  Alert.alert("删除记录", "确定要删除这条身体数据记录吗？", [
    { text: "取消", style: "cancel" },
    {
      text: "删除",
      style: "destructive",
      onPress: () => onDelete(id),
    },
  ]);
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const itemStyles = StyleSheet.create({
  card: {
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
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flex: 1,
  },
  date: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500" as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  note: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
  },
  right: {
    alignItems: "flex-end",
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  weight: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  circumference: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundAlt,
  },
  deleteText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.error,
  },
});
