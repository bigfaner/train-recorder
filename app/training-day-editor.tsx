/**
 * Training Day Editor Screen (Push page)
 *
 * Edit a training day within a plan. Provides:
 * - Training type selector (推/拉/蹲/自定义)
 * - Exercise list with add/remove
 * - Per-exercise: mode toggle (固定/自定义)
 * - Fixed mode: sets × reps × weight inputs
 * - Custom mode: per-set weight × reps
 * - Save training day
 */

import React, { useState, useCallback } from "react";
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
import type {
  TrainingDay,
  PlanExercise,
  Exercise,
  SetsConfig,
} from "../src/types";
import {
  TRAINING_TYPES,
  parseSetsConfig,
  createFixedSetsConfig,
  createCustomSetsConfig,
} from "../src/components/plan";
import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";

// ============================================================
// Types
// ============================================================

interface ExerciseDraft {
  tempId: string;
  exerciseBizKey: bigint;
  exerciseName: string;
  setsConfig: SetsConfig;
  exerciseNote: string | null;
}

interface TrainingDayEditorState {
  dayName: string;
  trainingType: "push" | "pull" | "legs" | "custom";
  exercises: ExerciseDraft[];
}

export interface TrainingDayEditorScreenProps {
  /** Existing day data for editing */
  existingDay: TrainingDay | null;
  /** Existing exercises for this day */
  existingExercises: PlanExercise[];
  /** Exercise name lookup */
  exerciseNameMap: Map<bigint, string>;
  /** All exercises available for adding */
  availableExercises: Exercise[];
  /** Save callback */
  onSave: (data: {
    dayName: string;
    trainingType: "push" | "pull" | "legs" | "custom";
    exercises: ExerciseDraft[];
  }) => Promise<void>;
}

export default function TrainingDayEditorScreen({
  existingDay,
  existingExercises,
  exerciseNameMap,
  availableExercises,
  onSave,
}: TrainingDayEditorScreenProps) {
  const router = useRouter();

  const [state, setState] = useState<TrainingDayEditorState>(() => ({
    dayName: existingDay?.day_name ?? "训练日",
    trainingType: existingDay?.training_type ?? "custom",
    exercises: existingExercises.map((pe) => ({
      tempId: String(pe.biz_key),
      exerciseBizKey: BigInt(pe.exercise_biz_key),
      exerciseName:
        exerciseNameMap.get(BigInt(pe.exercise_biz_key)) ?? "未知动作",
      setsConfig: parseSetsConfig(pe.sets_config),
      exerciseNote: pe.exercise_note,
    })),
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // ============================================================
  // Handlers
  // ============================================================

  const handleDayNameChange = useCallback((text: string) => {
    setState((s) => ({ ...s, dayName: text }));
  }, []);

  const handleTrainingTypeChange = useCallback(
    (type: "push" | "pull" | "legs" | "custom") => {
      setState((s) => ({ ...s, trainingType: type }));
    },
    [],
  );

  const handleToggleExerciseMode = useCallback((tempId: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.map((e) => {
        if (e.tempId !== tempId) return e;
        if (e.setsConfig.mode === "fixed") {
          // Switch to custom: create 3 sets from current fixed values
          const fixed = e.setsConfig;
          return {
            ...e,
            setsConfig: createCustomSetsConfig(
              Array.from({ length: fixed.target_repeat }, () => ({
                target_reps: fixed.target_reps,
                target_weight: fixed.target_weight,
              })),
            ),
          };
        }
        // Switch to fixed: use first set's values
        const custom = e.setsConfig;
        const firstSet = custom.sets[0];
        return {
          ...e,
          setsConfig: createFixedSetsConfig(
            firstSet?.target_reps ?? 5,
            firstSet?.target_weight ?? null,
            custom.sets.length,
          ),
        };
      }),
    }));
  }, []);

  const handleFixedSetsChange = useCallback(
    (
      tempId: string,
      field: "target_reps" | "target_weight" | "target_repeat",
      value: string,
    ) => {
      setState((s) => ({
        ...s,
        exercises: s.exercises.map((e) => {
          if (e.tempId !== tempId || e.setsConfig.mode !== "fixed") return e;
          const num = value === "" ? 0 : parseFloat(value);
          return {
            ...e,
            setsConfig: { ...e.setsConfig, [field]: num },
          };
        }),
      }));
    },
    [],
  );

  const handleCustomSetChange = useCallback(
    (
      tempId: string,
      setIndex: number,
      field: "target_reps" | "target_weight",
      value: string,
    ) => {
      setState((s) => ({
        ...s,
        exercises: s.exercises.map((e) => {
          if (e.tempId !== tempId || e.setsConfig.mode !== "custom") return e;
          const num = value === "" ? 0 : parseFloat(value);
          const newSets = [...e.setsConfig.sets];
          newSets[setIndex] = { ...newSets[setIndex]!, [field]: num };
          return { ...e, setsConfig: { ...e.setsConfig, sets: newSets } };
        }),
      }));
    },
    [],
  );

  const handleAddCustomSet = useCallback((tempId: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.map((e) => {
        if (e.tempId !== tempId || e.setsConfig.mode !== "custom") return e;
        const lastSet = e.setsConfig.sets[e.setsConfig.sets.length - 1];
        return {
          ...e,
          setsConfig: {
            ...e.setsConfig,
            sets: [
              ...e.setsConfig.sets,
              { target_reps: lastSet?.target_reps ?? 5, target_weight: null },
            ],
          },
        };
      }),
    }));
  }, []);

  const handleRemoveExercise = useCallback((tempId: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.filter((e) => e.tempId !== tempId),
    }));
  }, []);

  const handleExerciseNoteChange = useCallback(
    (tempId: string, note: string) => {
      setState((s) => ({
        ...s,
        exercises: s.exercises.map((e) =>
          e.tempId === tempId ? { ...e, exerciseNote: note || null } : e,
        ),
      }));
    },
    [],
  );

  // ============================================================
  // Exercise picker
  // ============================================================

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    setState((s) => ({
      ...s,
      exercises: [
        ...s.exercises,
        {
          tempId: `new-${Date.now()}-${String(exercise.biz_key)}`,
          exerciseBizKey: BigInt(exercise.biz_key),
          exerciseName: exercise.exercise_name,
          setsConfig: createFixedSetsConfig(5, null, 4),
          exerciseNote: null,
        },
      ],
    }));
    setShowExercisePicker(false);
  }, []);

  // ============================================================
  // Save
  // ============================================================

  const handleSave = useCallback(async () => {
    if (!state.dayName.trim()) {
      Alert.alert("保存失败", "请输入训练日名称");
      return;
    }
    if (state.exercises.length === 0) {
      Alert.alert("保存失败", "至少需要 1 个动作");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        dayName: state.dayName,
        trainingType: state.trainingType,
        exercises: state.exercises,
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.pageTitle}>
          {existingDay ? existingDay.day_name : "新建训练日"}
        </Text>

        {/* Day Name */}
        <Text style={styles.fieldLabel}>日名称</Text>
        <TextInput
          style={styles.textInput}
          value={state.dayName}
          onChangeText={handleDayNameChange}
          placeholder="例如：推日"
          placeholderTextColor={Colors.textTertiary}
        />

        {/* Training Type */}
        <Text style={styles.fieldLabel}>训练类型</Text>
        <View style={styles.typeRow}>
          {TRAINING_TYPES.map((t) => (
            <TypeButton
              key={t.value}
              label={t.label}
              active={state.trainingType === t.value}
              onPress={() => handleTrainingTypeChange(t.value)}
            />
          ))}
        </View>

        {/* Exercise List */}
        <Text style={styles.fieldLabel}>动作列表</Text>
        {state.exercises.map((exercise) => (
          <Card key={exercise.tempId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              <Text
                style={styles.removeButton}
                onPress={() => handleRemoveExercise(exercise.tempId)}
              >
                ×
              </Text>
            </View>

            {/* Exercise note */}
            <TextInput
              style={styles.noteInput}
              value={exercise.exerciseNote ?? ""}
              onChangeText={(text) =>
                handleExerciseNoteChange(exercise.tempId, text)
              }
              placeholder="备注（如：暂停深蹲）"
              placeholderTextColor={Colors.textTertiary}
            />

            {/* Mode toggle */}
            <View style={styles.modeRow}>
              <ModeButton
                label="固定"
                active={exercise.setsConfig.mode === "fixed"}
                onPress={() => handleToggleExerciseMode(exercise.tempId)}
              />
              <ModeButton
                label="自定义"
                active={exercise.setsConfig.mode === "custom"}
                onPress={() => handleToggleExerciseMode(exercise.tempId)}
              />
            </View>

            {/* Fixed mode inputs */}
            {exercise.setsConfig.mode === "fixed" && (
              <View style={styles.configRow}>
                <View style={styles.configField}>
                  <Text style={styles.configLabel}>组数</Text>
                  <TextInput
                    style={styles.configInput}
                    value={String(exercise.setsConfig.target_repeat)}
                    onChangeText={(v) =>
                      handleFixedSetsChange(exercise.tempId, "target_repeat", v)
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.configField}>
                  <Text style={styles.configLabel}>次数</Text>
                  <TextInput
                    style={styles.configInput}
                    value={String(exercise.setsConfig.target_reps)}
                    onChangeText={(v) =>
                      handleFixedSetsChange(exercise.tempId, "target_reps", v)
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.configField}>
                  <Text style={styles.configLabel}>重量(kg)</Text>
                  <TextInput
                    style={styles.configInput}
                    value={
                      exercise.setsConfig.target_weight !== null
                        ? String(exercise.setsConfig.target_weight)
                        : ""
                    }
                    onChangeText={(v) =>
                      handleFixedSetsChange(exercise.tempId, "target_weight", v)
                    }
                    keyboardType="decimal-pad"
                    placeholder="未设置"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>
            )}

            {/* Custom mode inputs */}
            {exercise.setsConfig.mode === "custom" && (
              <View>
                {exercise.setsConfig.sets.map((set, si) => (
                  <View key={si} style={styles.customSetRow}>
                    <Text style={styles.setIndex}>第{si + 1}组</Text>
                    <View style={styles.configField}>
                      <Text style={styles.configLabel}>次数</Text>
                      <TextInput
                        style={styles.configInput}
                        value={String(set.target_reps)}
                        onChangeText={(v) =>
                          handleCustomSetChange(
                            exercise.tempId,
                            si,
                            "target_reps",
                            v,
                          )
                        }
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.configField}>
                      <Text style={styles.configLabel}>重量(kg)</Text>
                      <TextInput
                        style={styles.configInput}
                        value={
                          set.target_weight !== null
                            ? String(set.target_weight)
                            : ""
                        }
                        onChangeText={(v) =>
                          handleCustomSetChange(
                            exercise.tempId,
                            si,
                            "target_weight",
                            v,
                          )
                        }
                        keyboardType="decimal-pad"
                        placeholder="未设置"
                        placeholderTextColor={Colors.textTertiary}
                      />
                    </View>
                  </View>
                ))}
                <Button
                  variant="secondary"
                  onPress={() => handleAddCustomSet(exercise.tempId)}
                >
                  + 加一组
                </Button>
              </View>
            )}
          </Card>
        ))}

        {/* Add exercise */}
        <Button variant="secondary" onPress={() => setShowExercisePicker(true)}>
          + 从动作库添加
        </Button>

        {/* Simple exercise picker (inline) */}
        {showExercisePicker && (
          <Card style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>选择动作</Text>
            {availableExercises.length === 0 && (
              <Text style={styles.emptyText}>无可用动作</Text>
            )}
            {availableExercises.map((ex) => (
              <Text
                key={String(ex.biz_key)}
                style={styles.pickerItem}
                onPress={() => handleSelectExercise(ex)}
              >
                {ex.exercise_name}
              </Text>
            ))}
            <Button
              variant="secondary"
              onPress={() => setShowExercisePicker(false)}
            >
              取消
            </Button>
          </Card>
        )}

        {/* Save */}
        <View style={styles.saveContainer}>
          <Button onPress={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// Sub-components
// ============================================================

function TypeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.typeButton, active && styles.typeButtonActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {active ? `● ${label}` : label}
    </Text>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {label}
    </Text>
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
  typeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  typeButton: {
    paddingHorizontal: 14,
    height: 36,
    lineHeight: 36,
    textAlign: "center",
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 8,
    overflow: "hidden",
  },
  typeButtonActive: {
    backgroundColor: Colors.accent,
    color: "#ffffff",
    fontWeight: "600",
  },
  exerciseCard: {
    marginBottom: Spacing.cardSpacing,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  removeButton: {
    fontSize: 24,
    color: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  noteInput: {
    height: 36,
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 4,
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  modeButton: {
    paddingHorizontal: 12,
    height: 32,
    lineHeight: 32,
    textAlign: "center",
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 8,
    overflow: "hidden",
  },
  modeButtonActive: {
    backgroundColor: Colors.accent,
    color: "#ffffff",
    fontWeight: "600",
  },
  configRow: {
    flexDirection: "row",
    gap: 10,
  },
  configField: {
    flex: 1,
  },
  configLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  configInput: {
    height: 36,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
  },
  customSetRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  setIndex: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    width: 40,
    lineHeight: 36,
  },
  pickerCard: {
    marginTop: Spacing.cardSpacing,
    maxHeight: 300,
  },
  pickerTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  pickerItem: {
    fontSize: Typography.body.fontSize,
    color: Colors.accent,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: 20,
  },
  saveContainer: {
    marginTop: Spacing.sectionSpacing,
  },
});
