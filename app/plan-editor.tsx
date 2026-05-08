/**
 * Plan Editor Screen (Push page)
 *
 * Create or edit a training plan. Provides:
 * - Plan name input
 * - Plan mode selector (无限循环/固定周期)
 * - Schedule mode selector (每周固定日/固定间隔)
 * - Weekly fixed: weekday toggle buttons, assign training type per weekday
 * - Fixed interval: rest days stepper, training day order list
 * - Save validation
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import type { TrainingPlan, TrainingDay } from "../src/types";
import {
  validatePlan,
  TRAINING_TYPES,
  getWeekdayLabel,
  parseWeeklyConfig,
} from "../src/components/plan";
import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";

// ============================================================
// Types for editor state
// ============================================================

interface TrainingDayDraft {
  tempId: string;
  dayName: string;
  trainingType: "push" | "pull" | "legs" | "custom";
  orderIndex: number;
}

interface PlanEditorState {
  planName: string;
  planMode: "fixed_cycle" | "infinite_loop";
  cycleLength: number | null;
  scheduleMode: "weekly_fixed" | "fixed_interval";
  restDays: number;
  weeklyDayMap: Record<number, "push" | "pull" | "legs" | "custom" | null>;
  trainingDays: TrainingDayDraft[];
}

export interface PlanEditorScreenProps {
  /** Existing plan data for editing (null for new plan) */
  existingPlan: TrainingPlan | null;
  /** Existing training days for editing */
  existingDays: TrainingDay[];
  /** Save callback */
  onSave: (data: {
    planName: string;
    planMode: "fixed_cycle" | "infinite_loop";
    cycleLength: number | null;
    scheduleMode: "weekly_fixed" | "fixed_interval";
    restDays: number;
    weeklyConfig: string | null;
    trainingDays: TrainingDayDraft[];
  }) => Promise<void>;
}

export default function PlanEditorScreen({
  existingPlan,
  existingDays,
  onSave,
}: PlanEditorScreenProps) {
  const router = useRouter();

  // Initialize state from existing plan or defaults
  const [state, setState] = useState<PlanEditorState>(() => {
    if (existingPlan) {
      const _parsedConfig = parseWeeklyConfig(existingPlan.weekly_config);
      const weeklyDayMap: Record<
        number,
        "push" | "pull" | "legs" | "custom" | null
      > = {};
      for (let i = 1; i <= 7; i++) {
        weeklyDayMap[i] = null;
      }
      // We'll set the actual types from existingDays when available

      return {
        planName: existingPlan.plan_name,
        planMode: existingPlan.plan_mode,
        cycleLength: existingPlan.cycle_length,
        scheduleMode: existingPlan.schedule_mode,
        restDays: existingPlan.rest_days,
        weeklyDayMap,
        trainingDays:
          existingDays.length > 0
            ? existingDays.map((d, i) => ({
                tempId: String(d.biz_key),
                dayName: d.day_name,
                trainingType: d.training_type,
                orderIndex: i,
              }))
            : [],
      };
    }

    return {
      planName: "",
      planMode: "infinite_loop",
      cycleLength: null,
      scheduleMode: "weekly_fixed",
      restDays: 1,
      weeklyDayMap: {
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
        7: null,
      },
      trainingDays: [],
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  // ============================================================
  // Handlers
  // ============================================================

  const handlePlanNameChange = useCallback((text: string) => {
    setState((s) => ({ ...s, planName: text }));
  }, []);

  const handlePlanModeChange = useCallback(
    (mode: "fixed_cycle" | "infinite_loop") => {
      setState((s) => ({ ...s, planMode: mode }));
    },
    [],
  );

  const handleScheduleModeChange = useCallback(
    (mode: "weekly_fixed" | "fixed_interval") => {
      setState((s) => ({ ...s, scheduleMode: mode }));
    },
    [],
  );

  const handleCycleLengthChange = useCallback((text: string) => {
    const num = parseInt(text, 10);
    setState((s) => ({
      ...s,
      cycleLength: isNaN(num) ? null : Math.max(1, num),
    }));
  }, []);

  const handleRestDaysChange = useCallback((delta: number) => {
    setState((s) => ({
      ...s,
      restDays: Math.max(0, Math.min(6, s.restDays + delta)),
    }));
  }, []);

  const toggleWeekday = useCallback((weekday: number) => {
    setState((s) => {
      const current = s.weeklyDayMap[weekday];
      if (current === null) {
        // Assign default type
        return {
          ...s,
          weeklyDayMap: { ...s.weeklyDayMap, [weekday]: "custom" },
        };
      }
      // Deselect
      return {
        ...s,
        weeklyDayMap: { ...s.weeklyDayMap, [weekday]: null },
      };
    });
  }, []);

  const handleWeekdayTypeChange = useCallback(
    (weekday: number, type: "push" | "pull" | "legs" | "custom") => {
      setState((s) => ({
        ...s,
        weeklyDayMap: { ...s.weeklyDayMap, [weekday]: type },
      }));
    },
    [],
  );

  const handleAddTrainingDay = useCallback(() => {
    setState((s) => ({
      ...s,
      trainingDays: [
        ...s.trainingDays,
        {
          tempId: `new-${Date.now()}`,
          dayName: `Day ${s.trainingDays.length + 1}`,
          trainingType: "custom",
          orderIndex: s.trainingDays.length,
        },
      ],
    }));
  }, []);

  const handleRemoveTrainingDay = useCallback((tempId: string) => {
    setState((s) => ({
      ...s,
      trainingDays: s.trainingDays
        .filter((d) => d.tempId !== tempId)
        .map((d, i) => ({ ...d, orderIndex: i })),
    }));
  }, []);

  const handleDayNameChange = useCallback((tempId: string, name: string) => {
    setState((s) => ({
      ...s,
      trainingDays: s.trainingDays.map((d) =>
        d.tempId === tempId ? { ...d, dayName: name } : d,
      ),
    }));
  }, []);

  const handleDayTypeChange = useCallback(
    (tempId: string, type: "push" | "pull" | "legs" | "custom") => {
      setState((s) => ({
        ...s,
        trainingDays: s.trainingDays.map((d) =>
          d.tempId === tempId ? { ...d, trainingType: type } : d,
        ),
      }));
    },
    [],
  );

  // ============================================================
  // Save
  // ============================================================

  const handleSave = useCallback(async () => {
    const validation = validatePlan({
      planName: state.planName,
      planMode: state.planMode,
      scheduleMode: state.scheduleMode,
      cycleLength: state.cycleLength,
      restDays: state.restDays,
      trainingDays: state.trainingDays.map((d) => ({
        dayName: d.dayName,
        trainingType: d.trainingType,
        exercises: [], // Exercises are configured in training-day-editor
      })),
    });

    if (!validation.isValid) {
      Alert.alert("保存失败", validation.errors.join("\n"));
      return;
    }

    if (validation.warnings.length > 0) {
      Alert.alert("提示", validation.warnings.join("\n"));
    }

    // Build weekly_config from weeklyDayMap
    const weeklyConfig = buildWeeklyConfig(state);

    setIsSaving(true);
    try {
      await onSave({
        planName: state.planName,
        planMode: state.planMode,
        cycleLength: state.cycleLength,
        scheduleMode: state.scheduleMode,
        restDays: state.restDays,
        weeklyConfig,
        trainingDays: state.trainingDays,
      });
      router.back();
    } catch (e) {
      Alert.alert("保存失败", (e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [state, onSave, router]);

  // ============================================================
  // Render
  // ============================================================

  const selectedWeekdays = useMemo(() => {
    return Object.entries(state.weeklyDayMap)
      .filter(([, type]) => type !== null)
      .map(([day]) => parseInt(day, 10))
      .sort((a, b) => a - b);
  }, [state.weeklyDayMap]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.pageTitle}>
          {existingPlan ? "编辑计划" : "新建计划"}
        </Text>

        {/* Plan Name */}
        <Text style={styles.fieldLabel}>计划名称</Text>
        <TextInput
          style={styles.textInput}
          value={state.planName}
          onChangeText={handlePlanNameChange}
          placeholder="例如：推/拉/蹲 3日循环"
          placeholderTextColor={Colors.textTertiary}
        />

        {/* Plan Mode */}
        <Text style={styles.fieldLabel}>计划模式</Text>
        <View style={styles.segmentRow}>
          <SegmentButton
            label="无限循环"
            active={state.planMode === "infinite_loop"}
            onPress={() => handlePlanModeChange("infinite_loop")}
          />
          <View style={styles.segmentSpacer} />
          <SegmentButton
            label="固定周期"
            active={state.planMode === "fixed_cycle"}
            onPress={() => handlePlanModeChange("fixed_cycle")}
          />
        </View>

        {/* Cycle Length (only for fixed_cycle) */}
        {state.planMode === "fixed_cycle" && (
          <>
            <Text style={styles.fieldLabel}>周期长度（周）</Text>
            <TextInput
              style={styles.textInput}
              value={
                state.cycleLength !== null ? String(state.cycleLength) : ""
              }
              onChangeText={handleCycleLengthChange}
              placeholder="输入周数"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
            />
          </>
        )}

        {/* Schedule Mode */}
        <Text style={styles.fieldLabel}>排期方式</Text>
        <View style={styles.segmentRow}>
          <SegmentButton
            label="每周固定日"
            active={state.scheduleMode === "weekly_fixed"}
            onPress={() => handleScheduleModeChange("weekly_fixed")}
          />
          <View style={styles.segmentSpacer} />
          <SegmentButton
            label="固定间隔"
            active={state.scheduleMode === "fixed_interval"}
            onPress={() => handleScheduleModeChange("fixed_interval")}
          />
        </View>

        {/* Weekly Fixed Config */}
        {state.scheduleMode === "weekly_fixed" && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>选择训练日</Text>
            <View style={styles.weekdayRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((wd) => (
                <WeekdayToggle
                  key={wd}
                  label={getWeekdayLabel(wd)}
                  selected={state.weeklyDayMap[wd] !== null}
                  onPress={() => toggleWeekday(wd)}
                />
              ))}
            </View>

            {/* Type assignment for selected weekdays */}
            {selectedWeekdays.map((wd) => (
              <View key={wd} style={styles.weekdayTypeRow}>
                <Text style={styles.weekdayTypeLabel}>
                  周{getWeekdayLabel(wd)}
                </Text>
                <View style={styles.typeSelector}>
                  {TRAINING_TYPES.map((t) => (
                    <SegmentButton
                      key={t.value}
                      label={t.label}
                      active={state.weeklyDayMap[wd] === t.value}
                      onPress={() => handleWeekdayTypeChange(wd, t.value)}
                      compact
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Fixed Interval Config */}
        {state.scheduleMode === "fixed_interval" && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>训练间隔</Text>
            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>休息</Text>
              <StepperButton
                label="-"
                onPress={() => handleRestDaysChange(-1)}
                disabled={state.restDays <= 0}
              />
              <Text style={styles.stepperValue}>{state.restDays}</Text>
              <StepperButton
                label="+"
                onPress={() => handleRestDaysChange(1)}
                disabled={state.restDays >= 6}
              />
              <Text style={styles.stepperLabel}>天后训练</Text>
            </View>

            {/* Training day order list */}
            <Text style={styles.fieldLabel}>训练日顺序</Text>
            {state.trainingDays.map((day) => (
              <Card key={day.tempId} style={styles.dayCard}>
                <View style={styles.dayCardRow}>
                  <View style={styles.dayCardInfo}>
                    <TextInput
                      style={styles.dayNameInput}
                      value={day.dayName}
                      onChangeText={(text) =>
                        handleDayNameChange(day.tempId, text)
                      }
                      placeholder="日名称"
                      placeholderTextColor={Colors.textTertiary}
                    />
                    <View style={styles.dayTypeRow}>
                      {TRAINING_TYPES.map((t) => (
                        <SegmentButton
                          key={t.value}
                          label={t.label}
                          active={day.trainingType === t.value}
                          onPress={() =>
                            handleDayTypeChange(day.tempId, t.value)
                          }
                          compact
                        />
                      ))}
                    </View>
                  </View>
                  <Text
                    style={styles.removeDayButton}
                    onPress={() => handleRemoveTrainingDay(day.tempId)}
                  >
                    ×
                  </Text>
                </View>
              </Card>
            ))}
            <Button variant="secondary" onPress={handleAddTrainingDay}>
              + 添加训练日
            </Button>
          </View>
        )}

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <Button onPress={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存计划"}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SegmentButton({
  label,
  active,
  onPress,
  compact = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        compact ? styles.segmentCompact : styles.segmentButton,
        active && styles.segmentActive,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {active ? `● ${label}` : label}
    </Text>
  );
}

function WeekdayToggle({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.weekdayToggle, selected && styles.weekdayToggleSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {selected ? `${label}✓` : label}
    </Text>
  );
}

function StepperButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Text
      onPress={disabled ? undefined : onPress}
      style={[styles.stepperButton, disabled && styles.stepperDisabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {label}
    </Text>
  );
}

// ============================================================
// Helper
// ============================================================

function buildWeeklyConfig(state: PlanEditorState): string | null {
  if (state.scheduleMode !== "weekly_fixed") return null;

  const config: Record<string, string> = {};
  Object.entries(state.weeklyDayMap).forEach(([day, type]) => {
    if (type !== null) {
      // We use a placeholder — the actual biz_key will be set after save
      config[day] = type;
    }
  });
  return JSON.stringify(config);
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.contentPadding,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: Typography.heading1.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sectionSpacing,
  },
  fieldLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    height: ComponentSizes.inputHeight,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: ComponentSizes.inputBorderRadius,
    paddingHorizontal: ComponentSizes.inputPaddingHorizontal,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  segmentRow: {
    flexDirection: "row",
  },
  segmentSpacer: {
    width: 10,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    lineHeight: 40,
    textAlign: "center",
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    overflow: "hidden",
  },
  segmentActive: {
    backgroundColor: Colors.accent,
    color: "#ffffff",
    fontWeight: "600",
  },
  segmentCompact: {
    paddingHorizontal: 10,
    height: 32,
    lineHeight: 32,
    textAlign: "center",
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 6,
  },
  section: {
    marginTop: 8,
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  weekdayToggle: {
    width: 40,
    height: 36,
    lineHeight: 36,
    textAlign: "center",
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 8,
    overflow: "hidden",
  },
  weekdayToggleSelected: {
    backgroundColor: Colors.accent,
    color: "#ffffff",
    fontWeight: "600",
  },
  weekdayTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  weekdayTypeLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    fontWeight: "500",
    width: 50,
  },
  typeSelector: {
    flexDirection: "row",
    flex: 1,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepperLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  stepperValue: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: "700",
    color: Colors.textPrimary,
    minWidth: 30,
    textAlign: "center",
  },
  stepperButton: {
    width: 40,
    height: 40,
    lineHeight: 40,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: Colors.accent,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 8,
    overflow: "hidden",
  },
  stepperDisabled: {
    color: Colors.textTertiary,
  },
  dayCard: {
    marginBottom: Spacing.cardSpacing,
  },
  dayCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dayCardInfo: {
    flex: 1,
  },
  dayNameInput: {
    height: 36,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
    paddingVertical: 4,
  },
  dayTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  removeDayButton: {
    fontSize: 24,
    color: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  saveContainer: {
    marginTop: Spacing.sectionSpacing,
  },
});
