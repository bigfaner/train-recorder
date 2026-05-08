/**
 * OtherSportScreen
 *
 * Main screen for other sport recording page.
 * Shows sport type grid, dynamic metric input form,
 * and handles saving OtherSportRecord + SportMetricValue entries.
 *
 * Follows the injected-props pattern for testability.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import type { SportType, SportMetric, SportMetricValue } from "../../types";
import {
  buildMetricInputs,
  createEmptySportEntry,
  validateSportEntry,
  formatSportDate,
  type SportEntryData,
  type CustomSportData,
} from "./sport-helpers";
import { SportTypeGrid } from "./SportTypeGrid";
import { MetricInputForm } from "./MetricInputForm";
import { CustomSportEditor } from "./CustomSportEditor";

// ============================================================
// Props Interface (injected-props pattern)
// ============================================================

export interface OtherSportScreenProps {
  /** All available sport types */
  sportTypes: SportType[];
  /** Metrics for currently selected sport type */
  currentMetrics: SportMetric[];
  /** Existing metric values for editing (empty for new record) */
  existingValues?: SportMetricValue[];
  /** Date passed from calendar (default today) */
  date?: string;
  /** Called when sport record should be saved */
  onSave: (data: SportEntryData) => void;
  /** Called when custom sport type is created */
  onCreateCustomSport: (data: CustomSportData) => void;
  /** Navigate back */
  onBack?: () => void;
}

// ============================================================
// Component
// ============================================================

export function OtherSportScreen({
  sportTypes,
  currentMetrics,
  existingValues: _existingValues,
  date,
  onSave,
  onCreateCustomSport,
  onBack,
}: OtherSportScreenProps) {
  const [entryData, setEntryData] = useState<SportEntryData>(
    createEmptySportEntry(date),
  );
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // When sport type is selected, update entry data and build metric inputs
  const handleSportSelect = useCallback(
    (sportType: SportType) => {
      const metrics = buildMetricInputs(currentMetrics);
      setEntryData((prev) => ({
        ...prev,
        sportTypeBizKey: sportType.biz_key,
        metrics,
      }));
      setErrors([]);
    },
    [currentMetrics],
  );

  const handleMetricChange = useCallback(
    (metricBizKey: bigint, value: string) => {
      setEntryData((prev) => ({
        ...prev,
        metrics: prev.metrics.map((m) =>
          m.metricBizKey === metricBizKey ? { ...m, value } : m,
        ),
      }));
    },
    [],
  );

  const handleNoteChange = useCallback((note: string) => {
    setEntryData((prev) => ({ ...prev, note }));
  }, []);

  const handleSave = useCallback(() => {
    const result = validateSportEntry(entryData);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    onSave(entryData);
  }, [entryData, onSave]);

  const handleCustomSportSave = useCallback(
    (data: CustomSportData) => {
      onCreateCustomSport(data);
      setShowCustomEditor(false);
    },
    [onCreateCustomSport],
  );

  const handleCustomSportBack = useCallback(() => {
    setShowCustomEditor(false);
  }, []);

  // Show custom sport editor as overlay
  if (showCustomEditor) {
    return (
      <CustomSportEditor
        onSave={handleCustomSportSave}
        onBack={handleCustomSportBack}
      />
    );
  }

  const hasSelectedSport = entryData.sportTypeBizKey !== null;

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.navBack}>
          <Text style={styles.navBackText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>记录其他运动</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date display */}
        <Text style={styles.dateText}>
          {formatSportDate(entryData.recordDate)}
        </Text>

        {/* Sport type grid */}
        <SportTypeGrid
          sportTypes={sportTypes}
          selectedBizKey={entryData.sportTypeBizKey}
          onSportSelect={handleSportSelect}
          onCustomSport={() => setShowCustomEditor(true)}
        />

        {/* Dynamic metric form (shown after sport type selection) */}
        {hasSelectedSport && (
          <MetricInputForm
            entryData={entryData}
            onMetricChange={handleMetricChange}
            onNoteChange={handleNoteChange}
            onSave={handleSave}
          />
        )}

        {/* Top-level validation errors (when no sport selected) */}
        {!hasSelectedSport && errors.length > 0 && (
          <View style={styles.errorBox}>
            {errors.map((err, i) => (
              <Text key={i} style={styles.errorText}>
                {err}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    height: ComponentSizes.navBarHeight,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: Spacing.contentPadding,
  },
  navBack: {
    padding: 8,
  },
  navBackText: {
    fontSize: Typography.body.fontSize,
    color: Colors.accent,
  },
  navTitle: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  navSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.contentPadding,
    paddingBottom: Spacing.sectionSpacing,
  },
  dateText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
    marginBottom: Spacing.cardSpacing,
  },
  errorBox: {
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.error,
    marginBottom: 2,
  },
});
