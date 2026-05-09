/**
 * CustomSportEditor
 *
 * Push page for creating custom sport types.
 * Allows user to name a sport and select/create metrics.
 * Saves a SportType (is_custom=1) + SportMetric entries.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import type { CustomSportData } from "./sport-helpers";
import {
  PRESET_METRICS,
  validateCustomSport,
  createEmptyCustomSport,
} from "./sport-helpers";

// ============================================================
// Props
// ============================================================

export interface CustomSportEditorProps {
  /** Initial data for editing (null for new) */
  initialData?: CustomSportData | null;
  /** Called when custom sport is saved */
  onSave: (data: CustomSportData) => void;
  /** Navigate back */
  onBack: () => void;
}

// ============================================================
// Component
// ============================================================

export function CustomSportEditor({
  initialData,
  onSave,
  onBack,
}: CustomSportEditorProps) {
  const [data, setData] = useState<CustomSportData>(
    initialData || createEmptyCustomSport(),
  );
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomUnit, setNewCustomUnit] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const togglePresetMetric = (metricName: string) => {
    setData((prev) => {
      const selected = prev.selectedPresetMetrics.includes(metricName)
        ? prev.selectedPresetMetrics.filter((m) => m !== metricName)
        : [...prev.selectedPresetMetrics, metricName];
      return { ...prev, selectedPresetMetrics: selected };
    });
  };

  const addCustomMetric = () => {
    if (!newCustomName.trim()) return;
    setData((prev) => ({
      ...prev,
      customMetrics: [
        ...prev.customMetrics,
        { name: newCustomName.trim(), unit: newCustomUnit.trim() || "值" },
      ],
    }));
    setNewCustomName("");
    setNewCustomUnit("");
  };

  const removeCustomMetric = (index: number) => {
    setData((prev) => ({
      ...prev,
      customMetrics: prev.customMetrics.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    const result = validateCustomSport(data);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    onSave(data);
  };

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.navBack}>
          <Text style={styles.navBackText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>自定义运动</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sport name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>运动名称</Text>
          <TextInput
            style={styles.input}
            value={data.sportName}
            onChangeText={(text) =>
              setData((prev) => ({ ...prev, sportName: text }))
            }
            placeholder="如：瑜伽、篮球"
            placeholderTextColor={Colors.textTertiary}
            maxLength={20}
            testID="sport-name-input"
          />
        </View>

        {/* Preset metrics selection */}
        <Text style={styles.label}>记录指标（多选）</Text>
        <View style={styles.metricList}>
          {PRESET_METRICS.map((metric) => {
            const isSelected = data.selectedPresetMetrics.includes(
              metric.metric_name,
            );
            return (
              <TouchableOpacity
                key={metric.metric_name}
                style={[
                  styles.metricItem,
                  isSelected && styles.metricItemSelected,
                ]}
                onPress={() => togglePresetMetric(metric.metric_name)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.metricItemText,
                    isSelected && styles.metricItemTextSelected,
                  ]}
                >
                  {isSelected ? "☑ " : "☐ "}
                  {metric.metric_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom metric input */}
        <Text style={[styles.label, { marginTop: 16 }]}>自定义指标</Text>
        {data.customMetrics.map((cm, index) => (
          <View key={index} style={styles.customMetricRow}>
            <View style={styles.customMetricTag}>
              <Text style={styles.customMetricTagText}>
                {cm.name}
                {cm.unit ? ` (${cm.unit})` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeCustomMetric(index)}>
              <Text style={styles.removeBtn}>x</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.customMetricInput}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newCustomName}
            onChangeText={setNewCustomName}
            placeholder="指标名称"
            placeholderTextColor={Colors.textTertiary}
            maxLength={15}
          />
          <TextInput
            style={[styles.input, { flex: 0.5, marginLeft: 8 }]}
            value={newCustomUnit}
            onChangeText={setNewCustomUnit}
            placeholder="单位"
            placeholderTextColor={Colors.textTertiary}
            maxLength={10}
          />
          <TouchableOpacity
            style={styles.addMetricBtn}
            onPress={addCustomMetric}
          >
            <Text style={styles.addMetricBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Validation errors */}
        {errors.length > 0 && (
          <View style={styles.errorBox}>
            {errors.map((err, i) => (
              <Text key={i} style={styles.errorText}>
                {err}
              </Text>
            ))}
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.7}
          testID="save-custom-sport-btn"
        >
          <Text style={styles.saveBtnText}>保存</Text>
        </TouchableOpacity>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: Typography.caption.letterSpacing,
    marginBottom: 8,
  },
  input: {
    height: ComponentSizes.inputHeight,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: ComponentSizes.inputBorderRadius,
    paddingHorizontal: ComponentSizes.inputPaddingHorizontal,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  metricList: {
    // metrics rendered as flat list items
  },
  metricItem: {
    height: Spacing.touchTarget,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center" as const,
  },
  metricItemSelected: {
    backgroundColor: "rgba(0, 113, 227, 0.08)",
  },
  metricItemText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  metricItemTextSelected: {
    color: Colors.accent,
    fontWeight: "500" as const,
  },
  customMetricRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  customMetricTag: {
    backgroundColor: "rgba(175, 82, 222, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  customMetricTagText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.otherSport,
    fontWeight: "500" as const,
  },
  removeBtn: {
    fontSize: 18,
    color: Colors.error,
    fontWeight: "600" as const,
    paddingHorizontal: 8,
  },
  customMetricInput: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginTop: 8,
    marginBottom: 16,
  },
  addMetricBtn: {
    width: ComponentSizes.inputHeight,
    height: ComponentSizes.inputHeight,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginLeft: 8,
  },
  addMetricBtnText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600" as const,
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
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: Typography.body.fontSize,
    fontWeight: "600" as const,
  },
});
