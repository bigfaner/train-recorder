/**
 * PRPanel
 *
 * Per-exercise cards showing max weight + date + volume record.
 * Trophy icon + exercise name + weight PR + volume PR.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";

export interface PRCardData {
  exerciseName: string;
  weightPR: number;
  weightPRDate: string;
  volumePR: number;
  volumePRDate: string;
}

export interface PRPanelProps {
  /** PR card data sorted by exercise */
  prCards: PRCardData[];
}

export function PRPanel({ prCards }: PRPanelProps) {
  if (prCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无个人记录</Text>
      </View>
    );
  }

  return (
    <View testID="pr-list">
      <Text style={styles.sectionTitle}>个人最佳记录</Text>
      {prCards.map((card, index) => (
        <View key={index} style={styles.prCard}>
          <View style={styles.prHeader}>
            <Text style={styles.prTrophy}>&#127942;</Text>
            <View>
              <Text style={styles.prExercise}>{card.exerciseName}</Text>
            </View>
          </View>
          <Text style={styles.prWeight}>{formatPRWeight(card.weightPR)}</Text>
          <Text style={styles.prDate}>{card.weightPRDate}</Text>
          <View style={styles.prDivider} />
          <Text style={styles.prVolume}>
            容量: {formatPRVolume(card.volumePR)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function formatPRWeight(value: number): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${formatted} kg`;
}

function formatPRVolume(value: number): string {
  return `${value.toLocaleString("en-US")} kg`;
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.sectionSpacing * 2,
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
  },
  sectionTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  prCard: {
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
  prHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  prTrophy: {
    fontSize: 28,
  },
  prExercise: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  prWeight: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.success,
    marginBottom: 4,
  },
  prDate: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
  },
  prDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    marginVertical: 10,
  },
  prVolume: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
});
