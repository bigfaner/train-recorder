/**
 * BodyDataScreen
 *
 * Main screen for body measurement recording page.
 * Shows latest data card at top, segment selector (trend/history),
 * and content panel with trend chart or history list.
 *
 * Follows the injected-props pattern for testability:
 * receives all data via props instead of using hooks internally.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { BodyMeasurement } from "../../types";
import { BODY_SEGMENTS, type BodySegmentKey } from "./body-helpers";
import { LatestDataCard } from "./LatestDataCard";
import { TrendChart } from "./TrendChart";
import { HistoryList } from "./HistoryList";
import { EmptyBodyState } from "./EmptyBodyState";
import { BodyEntryForm } from "./BodyEntryForm";
import type { BodyEntryData } from "./body-helpers";

// ============================================================
// Props Interface (injected-props pattern)
// ============================================================

export interface BodyDataScreenProps {
  /** All body measurements */
  measurements: BodyMeasurement[];
  /** Latest measurement (null if no data) */
  latest: BodyMeasurement | null;
  /** Previous measurement for change calculation (null if no prior) */
  previous: BodyMeasurement | null;
  /** Called when new measurement is saved */
  onSave: (data: BodyEntryData) => void;
  /** Called when existing measurement is updated */
  onUpdate: (id: number, data: BodyEntryData) => void;
  /** Called when measurement is deleted */
  onDelete: (id: number) => void;
  /** Navigate back */
  onBack?: () => void;
}

// ============================================================
// Component
// ============================================================

export function BodyDataScreen({
  measurements,
  latest,
  previous,
  onSave,
  onUpdate,
  onDelete,
}: BodyDataScreenProps) {
  const [activeSegment, setActiveSegment] = useState<BodySegmentKey>("trend");
  const [showForm, setShowForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] =
    useState<BodyMeasurement | null>(null);

  const handleRecord = () => {
    setEditingMeasurement(null);
    setShowForm(true);
  };

  const handleEdit = (measurement: BodyMeasurement) => {
    setEditingMeasurement(measurement);
    setShowForm(true);
  };

  const handleFormSave = (data: BodyEntryData) => {
    if (editingMeasurement) {
      onUpdate(editingMeasurement.id, data);
    } else {
      onSave(data);
    }
    setShowForm(false);
    setEditingMeasurement(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMeasurement(null);
  };

  const handleDelete = (id: number) => {
    onDelete(id);
  };

  // Form is shown as overlay
  if (showForm) {
    return (
      <BodyEntryForm
        editingMeasurement={editingMeasurement}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  // Empty state
  if (measurements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <Text style={styles.navTitle}>身体数据</Text>
        </View>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleRecord}
          activeOpacity={0.7}
        >
          <Text style={styles.recordButtonText}>+ 记录数据</Text>
        </TouchableOpacity>
        <EmptyBodyState onRecord={handleRecord} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>身体数据</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Record button */}
        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleRecord}
          activeOpacity={0.7}
        >
          <Text style={styles.recordButtonText}>+ 记录数据</Text>
        </TouchableOpacity>

        {/* Latest data card */}
        {latest && <LatestDataCard latest={latest} previous={previous} />}

        {/* Segment selector */}
        <View style={styles.segmented}>
          {BODY_SEGMENTS.map((segment) => (
            <TouchableOpacity
              key={segment.key}
              style={[
                styles.segOption,
                activeSegment === segment.key && styles.segOptionActive,
              ]}
              onPress={() => setActiveSegment(segment.key)}
              activeOpacity={0.7}
              testID={
                segment.key === "trend" ? "trend-chart-btn" : "history-btn"
              }
            >
              <Text
                style={[
                  styles.segText,
                  activeSegment === segment.key && styles.segTextActive,
                ]}
              >
                {segment.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Panel content */}
        {activeSegment === "trend" && (
          <TrendChart measurements={measurements} />
        )}

        {activeSegment === "history" && (
          <HistoryList
            measurements={measurements}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.contentPadding,
  },
  navTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.contentPadding,
    paddingBottom: Spacing.sectionSpacing,
  },
  recordButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.cardSpacing,
  },
  recordButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600" as const,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segOption: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segOptionActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  segText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textSecondary,
  },
  segTextActive: {
    color: Colors.textPrimary,
  },
});
