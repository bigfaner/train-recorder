/**
 * BodyEntryForm
 *
 * Form for recording body measurement data.
 * Fields: date (default today), weight (required),
 * chest/waist/arm/thigh circumference (optional), note.
 *
 * Supports both "create new" and "edit existing" modes.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import {
  validateBodyEntry,
  createEmptyEntry,
  measurementToEntry,
  type BodyEntryData,
} from "./body-helpers";
import type { BodyMeasurement } from "../../types";

export interface BodyEntryFormProps {
  /** Existing measurement to edit (null for new entry) */
  editingMeasurement?: BodyMeasurement | null;
  /** Called when form is saved with valid data */
  onSave: (data: BodyEntryData) => void;
  /** Called when form is cancelled */
  onCancel: () => void;
}

export function BodyEntryForm({
  editingMeasurement,
  onSave,
  onCancel,
}: BodyEntryFormProps) {
  const [entry, setEntry] = useState<BodyEntryData>(
    editingMeasurement
      ? measurementToEntry(editingMeasurement)
      : createEmptyEntry(),
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Re-initialize when editing measurement changes
  useEffect(() => {
    if (editingMeasurement) {
      setEntry(measurementToEntry(editingMeasurement));
    }
  }, [editingMeasurement]);

  const updateField = <K extends keyof BodyEntryData>(
    key: K,
    value: BodyEntryData[K],
  ) => {
    setEntry((prev) => ({ ...prev, [key]: value }));
    setErrors([]);
  };

  const parseNumericInput = (text: string): number | null => {
    if (text === "") return null;
    const num = parseFloat(text);
    return isNaN(num) ? null : num;
  };

  const handleSave = () => {
    const validation = validateBodyEntry(entry);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    onSave(entry);
  };

  const formatDateInput = (text: string) => {
    // Basic date formatting: expect YYYY-MM-DD
    updateField("record_date", text);
  };

  const title = editingMeasurement ? "编辑身体数据" : "记录身体数据";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          testID="save-body-data-btn"
        >
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>日期</Text>
          <TextInput
            style={styles.input}
            value={entry.record_date}
            onChangeText={formatDateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textTertiary}
            testID="date-picker"
          />
        </View>

        {/* Weight field (required) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            体重 (kg) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={entry.body_weight !== null ? String(entry.body_weight) : ""}
            onChangeText={(text) =>
              updateField("body_weight", parseNumericInput(text))
            }
            placeholder="输入体重"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
            testID="weight-input"
          />
        </View>

        {/* Circumference fields (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>胸围 (cm)</Text>
          <TextInput
            style={styles.input}
            value={
              entry.chest_circumference !== null
                ? String(entry.chest_circumference)
                : ""
            }
            onChangeText={(text) =>
              updateField("chest_circumference", parseNumericInput(text))
            }
            placeholder="选填"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
            testID="chest-input"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>腰围 (cm)</Text>
          <TextInput
            style={styles.input}
            value={
              entry.waist_circumference !== null
                ? String(entry.waist_circumference)
                : ""
            }
            onChangeText={(text) =>
              updateField("waist_circumference", parseNumericInput(text))
            }
            placeholder="选填"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
            testID="waist-input"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>臂围 (cm)</Text>
          <TextInput
            style={styles.input}
            value={
              entry.arm_circumference !== null
                ? String(entry.arm_circumference)
                : ""
            }
            onChangeText={(text) =>
              updateField("arm_circumference", parseNumericInput(text))
            }
            placeholder="选填"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
            testID="arm-input"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>大腿围 (cm)</Text>
          <TextInput
            style={styles.input}
            value={
              entry.thigh_circumference !== null
                ? String(entry.thigh_circumference)
                : ""
            }
            onChangeText={(text) =>
              updateField("thigh_circumference", parseNumericInput(text))
            }
            placeholder="选填"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
            testID="thigh-input"
          />
        </View>

        {/* Note field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>备注</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={entry.body_note ?? ""}
            onChangeText={(text) => updateField("body_note", text || null)}
            placeholder="选填"
            placeholderTextColor={Colors.textTertiary}
            multiline
          />
        </View>

        {/* Errors */}
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                {error}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: ComponentSizes.navBarHeight,
    paddingHorizontal: Spacing.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  cancelText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  saveText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600" as const,
    color: Colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.contentPadding,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  input: {
    height: ComponentSizes.inputHeight,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: ComponentSizes.inputBorderRadius,
    paddingHorizontal: ComponentSizes.inputPaddingHorizontal,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  noteInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top" as const,
  },
  errorContainer: {
    backgroundColor: "#fff5f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.error,
    marginBottom: 4,
  },
});
