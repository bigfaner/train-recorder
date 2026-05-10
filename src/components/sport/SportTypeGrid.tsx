/**
 * SportTypeGrid
 *
 * Displays a 2x2 grid of preset sport type cards plus a "自定义运动" button.
 * Selecting a sport type highlights it and triggers the onSportSelect callback.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import type { SportType } from "../../types";
import { getSportIcon, groupSportTypes } from "./sport-helpers";

// ============================================================
// Props
// ============================================================

export interface SportTypeGridProps {
  /** All available sport types (presets + custom) */
  sportTypes: SportType[];
  /** Currently selected sport type biz_key, or null */
  selectedBizKey: bigint | null;
  /** Called when a sport type is selected */
  onSportSelect: (sportType: SportType) => void;
  /** Called when "自定义运动" button is pressed */
  onCustomSport: () => void;
}

// ============================================================
// Icon rendering
// ============================================================

const ICON_LABELS: Record<string, string> = {
  swim: "🏊",
  run: "🏃",
  bike: "🚴",
  yoga: "🧘",
  hiking: "🥾",
  custom: "⭐",
};

// ============================================================
// Component
// ============================================================

export function SportTypeGrid({
  sportTypes,
  selectedBizKey,
  onSportSelect,
  onCustomSport,
}: SportTypeGridProps) {
  const { presets, customs } = groupSportTypes(sportTypes);
  const allTypes = [...presets, ...customs];

  return (
    <View testID="sport-type-list">
      <Text style={styles.sectionTitle}>选择运动类型</Text>
      <View style={styles.grid}>
        {allTypes.map((sport) => {
          const isSelected = selectedBizKey === sport.biz_key;
          const icon = getSportIcon(sport);
          const emoji = ICON_LABELS[icon] || ICON_LABELS.custom;
          const testIdSuffix = ICON_LABELS[icon] ? icon : "custom";

          return (
            <TouchableOpacity
              key={String(sport.biz_key)}
              style={[styles.sportCard, isSelected && styles.sportCardSelected]}
              onPress={() => onSportSelect(sport)}
              activeOpacity={0.7}
              testID={`sport-type-item-${testIdSuffix}`}
            >
              <View
                style={[
                  styles.sportIcon,
                  isSelected && styles.sportIconSelected,
                ]}
              >
                <Text style={styles.sportEmoji}>{emoji}</Text>
              </View>
              <Text
                style={[
                  styles.sportName,
                  isSelected && styles.sportNameSelected,
                ]}
              >
                {sport.sport_name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.customBtn}
        onPress={onCustomSport}
        activeOpacity={0.7}
        testID="custom-sport-btn"
      >
        <Text style={styles.customBtnText}>+ 自定义运动</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: Typography.caption.letterSpacing,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    marginBottom: Spacing.cardSpacing,
  },
  sportCard: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: 20,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  sportCardSelected: {
    borderColor: Colors.accent,
    shadowOpacity: 0.12,
  },
  sportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundAlt,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  sportIconSelected: {
    backgroundColor: "rgba(0, 113, 227, 0.1)",
  },
  sportEmoji: {
    fontSize: 24,
  },
  sportName: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  sportNameSelected: {
    color: Colors.accent,
  },
  customBtn: {
    height: ComponentSizes.buttonHeight,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: Spacing.cardBorderRadius,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: Spacing.sectionSpacing,
  },
  customBtnText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "500" as const,
    color: Colors.accent,
  },
});
