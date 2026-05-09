/**
 * Onboarding Components
 *
 * Multi-step onboarding flow components:
 * - WelcomeSteps: 4 intro steps explaining core concepts
 * - TemplatePicker: Template selection cards (PPL, Upper/Lower, Full Body)
 * - PlanConfig: Review and confirm plan before creation
 * - StepIndicator: Progress dots for onboarding steps
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import type { PlanTemplate } from "../../types";

// ============================================================
// Step Indicator (progress dots)
// ============================================================

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View style={styles.stepIndicatorRow}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[styles.stepDot, i === currentStep && styles.stepDotActive]}
        />
      ))}
    </View>
  );
}

// ============================================================
// Welcome Steps
// ============================================================

const WELCOME_STEPS = [
  {
    title: "欢迎使用 Train Recorder",
    subtitle: "你的私人力量训练记录助手",
    description: "帮助你管理周期化训练计划，实时记录训练组数，追踪进步趋势。",
  },
  {
    title: "第一步：创建计划",
    subtitle: "Plan",
    description:
      "选择一个训练模板或自定义你的训练计划。支持固定周期和无限循环两种模式。",
  },
  {
    title: "第二步：开始训练",
    subtitle: "Workout",
    description:
      "按照计划执行训练，逐组记录重量和次数。系统会自动提供渐进超负荷建议。",
  },
  {
    title: "第三步：查看进步",
    subtitle: "Progress",
    description:
      "通过图表和数据分析你的训练进步。追踪个人最佳记录，调整训练策略。",
  },
] as const;

export interface WelcomeStepsProps {
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeSteps({
  currentStep,
  onNext,
  onSkip,
}: WelcomeStepsProps) {
  const step = WELCOME_STEPS[currentStep];
  const isLastStep = currentStep === WELCOME_STEPS.length - 1;

  return (
    <View
      style={styles.welcomeContainer}
      testID={`onboarding-step-${currentStep + 1}`}
    >
      <StepIndicator
        currentStep={currentStep}
        totalSteps={WELCOME_STEPS.length}
      />

      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeSubtitle}>{step.subtitle}</Text>
        <Text style={styles.welcomeTitle}>{step.title}</Text>
        <Text style={styles.welcomeDescription}>{step.description}</Text>
      </View>

      <View style={styles.welcomeActions}>
        <TouchableOpacity
          onPress={onNext}
          style={[styles.actionButton, styles.primaryButton]}
          accessibilityRole="button"
          testID={isLastStep ? "onboarding-finish-btn" : "onboarding-next-btn"}
        >
          <Text style={styles.primaryButtonText}>
            {isLastStep ? "选择模板" : "下一步"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          testID="onboarding-skip-btn"
        >
          <Text style={styles.skipButtonText}>跳过</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// Template Picker
// ============================================================

const TRAINING_TYPE_COLORS: Record<string, string> = {
  push: Colors.pushDay,
  pull: Colors.pullDay,
  legs: Colors.legDay,
  custom: Colors.accent,
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  push: "推",
  pull: "拉",
  legs: "腿",
  custom: "全身",
};

export interface TemplatePickerProps {
  templates: PlanTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
}

export function TemplatePicker({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onConfirm,
  onSkip,
}: TemplatePickerProps) {
  return (
    <View style={styles.templateContainer}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateHeaderTitle}>选择训练模板</Text>
        <Text style={styles.templateHeaderSubtitle}>
          推荐适合你的训练计划模板
        </Text>
      </View>

      <ScrollView
        style={styles.templateList}
        contentContainerStyle={styles.templateListContent}
        testID="template-list"
      >
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.templateId;
          return (
            <TouchableOpacity
              key={template.templateId}
              onPress={() => onSelectTemplate(template.templateId)}
              style={[
                styles.templateCard,
                isSelected && styles.templateCardSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              testID={`template-item-${template.templateId}`}
            >
              <Text style={styles.templateName}>{template.templateName}</Text>
              <Text style={styles.templateDescription}>
                {template.description}
              </Text>
              <View style={styles.templateDayTags}>
                {template.days.map((day, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dayTag,
                      {
                        backgroundColor:
                          TRAINING_TYPE_COLORS[day.trainingType] + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayTagText,
                        { color: TRAINING_TYPE_COLORS[day.trainingType] },
                      ]}
                    >
                      {day.dayName}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.templateExerciseCount}>
                {template.days.reduce((sum, d) => sum + d.exercises.length, 0)}{" "}
                个动作 / {template.days.length} 个训练日
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.templateActions}>
        <TouchableOpacity
          onPress={onConfirm}
          style={[
            styles.actionButton,
            styles.primaryButton,
            !selectedTemplateId && styles.disabledButton,
          ]}
          disabled={!selectedTemplateId}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>确认选择</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipButton}
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>跳过</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// Plan Config (review before creation)
// ============================================================

export interface PlanConfigProps {
  template: PlanTemplate;
  onComplete: () => void;
  onBack: () => void;
}

export function PlanConfig({ template, onComplete, onBack }: PlanConfigProps) {
  return (
    <View style={styles.planConfigContainer}>
      <View style={styles.planConfigHeader}>
        <Text style={styles.planConfigTitle}>{template.templateName}</Text>
        <Text style={styles.planConfigSubtitle}>确认训练计划内容</Text>
      </View>

      <ScrollView
        style={styles.planConfigList}
        contentContainerStyle={styles.planConfigListContent}
      >
        {template.days.map((day, dayIdx) => (
          <View key={dayIdx} style={styles.planDayCard}>
            <View style={styles.planDayHeader}>
              <View
                style={[
                  styles.planDayTypeTag,
                  {
                    backgroundColor:
                      TRAINING_TYPE_COLORS[day.trainingType] + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.planDayTypeText,
                    { color: TRAINING_TYPE_COLORS[day.trainingType] },
                  ]}
                >
                  {TRAINING_TYPE_LABELS[day.trainingType] || day.trainingType}
                </Text>
              </View>
              <Text style={styles.planDayName}>{day.dayName}</Text>
            </View>

            {day.exercises.map((exercise, exIdx) => {
              const config = exercise.setsConfig;
              const isFixed = config.mode === "fixed";
              return (
                <View key={exIdx} style={styles.planExerciseRow}>
                  <Text style={styles.planExerciseName}>
                    {exercise.exerciseName}
                  </Text>
                  <Text style={styles.planExerciseSets}>
                    {isFixed
                      ? `${config.target_repeat}x${config.target_reps}`
                      : `${config.sets.length}组`}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.planConfigActions}>
        <TouchableOpacity
          onPress={onComplete}
          style={[styles.actionButton, styles.primaryButton]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>完成</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>返回选择</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  // Step indicator
  stepIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: Spacing.sectionSpacing,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },

  // Welcome steps
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.contentPadding,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: Typography.heading1.fontWeight as "600",
    color: Colors.textPrimary,
    textAlign: "center",
    marginTop: 12,
  },
  welcomeSubtitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.accent,
    letterSpacing: Typography.caption.letterSpacing,
    textTransform: "uppercase",
  },
  welcomeDescription: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  welcomeActions: {
    width: "100%",
    gap: 12,
    paddingBottom: 32,
  },

  // Template picker
  templateContainer: {
    flex: 1,
  },
  templateHeader: {
    paddingHorizontal: Spacing.contentPadding,
    paddingTop: Spacing.sectionSpacing,
    paddingBottom: Spacing.cardSpacing,
  },
  templateHeaderTitle: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight as "600",
    color: Colors.textPrimary,
  },
  templateHeaderSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  templateList: {
    flex: 1,
  },
  templateListContent: {
    paddingHorizontal: Spacing.contentPadding,
    gap: Spacing.cardSpacing,
  },
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
    borderWidth: 2,
    borderColor: "transparent",
  },
  templateCardSelected: {
    borderColor: Colors.accent,
  },
  templateName: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  templateDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
  templateDayTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  dayTag: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayTagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  templateExerciseCount: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    marginTop: 8,
  },
  templateActions: {
    paddingHorizontal: Spacing.contentPadding,
    gap: 12,
    paddingBottom: 32,
  },

  // Plan config
  planConfigContainer: {
    flex: 1,
  },
  planConfigHeader: {
    paddingHorizontal: Spacing.contentPadding,
    paddingTop: Spacing.sectionSpacing,
    paddingBottom: Spacing.cardSpacing,
  },
  planConfigTitle: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight as "600",
    color: Colors.textPrimary,
  },
  planConfigSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  planConfigList: {
    flex: 1,
  },
  planConfigListContent: {
    paddingHorizontal: Spacing.contentPadding,
    gap: Spacing.cardSpacing,
    paddingBottom: 16,
  },
  planDayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
  },
  planDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  planDayTypeTag: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planDayTypeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  planDayName: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  planExerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  planExerciseName: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
  },
  planExerciseSets: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  planConfigActions: {
    paddingHorizontal: Spacing.contentPadding,
    gap: 12,
    paddingBottom: 32,
  },

  // Shared action button styles
  actionButton: {
    height: ComponentSizes.buttonHeight,
    borderRadius: ComponentSizes.buttonBorderRadius,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  primaryButton: {
    backgroundColor: Colors.accent,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  skipButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 17,
    color: Colors.textTertiary,
  },
  backButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 17,
    color: Colors.accent,
  },
});
