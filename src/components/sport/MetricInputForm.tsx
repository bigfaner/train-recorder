/**
 * MetricInputForm
 *
 * Dynamic form that renders input fields based on the selected sport type's
 * SportMetric definitions. Each metric gets a labeled input with optional unit suffix.
 */

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import type { SportEntryData } from "./sport-helpers";
import { validateSportEntry } from "./sport-helpers";

// ============================================================
// Props
// ============================================================

export interface MetricInputFormProps {
  /** Current sport entry data */
  entryData: SportEntryData;
  /** Called when a metric value changes */
  onMetricChange: (metricBizKey: bigint, value: string) => void;
  /** Called when the note changes */
  onNoteChange: (note: string) => void;
  /** Called when the save button is pressed */
  onSave: () => void;
}

// ============================================================
// Component
// ============================================================

export function MetricInputForm({
  entryData,
  onMetricChange,
  onNoteChange,
  onSave,
}: MetricInputFormProps) {
  const validation = validateSportEntry(entryData);

  return (
    <View style={styles.container}>
      <View style={styles.divider} />

      {entryData.metrics.map((metric) => (
        <View key={String(metric.metricBizKey)} style={styles.inputGroup}>
          <Text style={styles.label}>{metric.metricName}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={metric.value}
              onChangeText={(text) => onMetricChange(metric.metricBizKey, text)}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numeric"
            />
            {metric.metricUnit && (
              <Text style={styles.suffix}>{metric.metricUnit}</Text>
            )}
          </View>
        </View>
      ))}

      {/* Notes */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>备注</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={entryData.note}
          onChangeText={onNoteChange}
          placeholder="记录今天的训练感受..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Validation errors */}
      {!validation.isValid &&
        entryData.metrics.some((m) => m.value.trim() !== "") && (
          <View style={styles.errorBox}>
            {validation.errors.map((err, i) => (
              <Text key={i} style={styles.errorText}>
                {err}
              </Text>
            ))}
          </View>
        )}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, !validation.isValid && styles.saveBtnDisabled]}
        onPress={onSave}
        activeOpacity={0.7}
        disabled={!validation.isValid}
      >
        <Text style={styles.saveBtnText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sectionSpacing,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: Typography.caption.letterSpacing,
    marginBottom: 6,
  },
  inputRow: {
    position: "relative" as const,
  },
  input: {
    height: ComponentSizes.inputHeight,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: ComponentSizes.inputBorderRadius,
    paddingHorizontal: ComponentSizes.inputPaddingHorizontal,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  suffix: {
    position: "absolute" as const,
    right: 16,
    top: 13,
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
  },
  textArea: {
    height: 88,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top" as const,
  },
  errorBox: {
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.error,
    marginBottom: 2,
  },
  saveBtn: {
    height: ComponentSizes.buttonHeight,
    backgroundColor: Colors.accent,
    borderRadius: ComponentSizes.buttonBorderRadius,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: Typography.body.fontSize,
    fontWeight: "600" as const,
  },
});
