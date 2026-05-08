/**
 * Onboarding Screen
 *
 * First-time onboarding flow with:
 * 1. Welcome steps (4 intro steps explaining core concepts)
 * 2. Template selection (PPL, Upper/Lower, Full Body)
 * 3. Plan configuration (review and create plan)
 *
 * "完成" creates plan from template and navigates to calendar.
 * "跳过" skips onboarding entirely and navigates to calendar.
 * Onboarding only shows on first use (checks OnboardingService.isOnboardingComplete).
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@utils/constants";
import { TEMPLATES } from "../src/services/onboarding";
import {
  WelcomeSteps,
  TemplatePicker,
  PlanConfig,
} from "../src/components/onboarding";
import type { PlanTemplate } from "../src/types";

/**
 * Onboarding screen props interface.
 * In production, these will be injected via store/context.
 */
export interface OnboardingScreenProps {
  /** Callback to create a plan from template */
  onCreatePlanFromTemplate: (template: PlanTemplate) => void;
  /** Callback to mark onboarding as complete */
  onMarkOnboardingComplete: () => void;
  /** Callback to skip onboarding */
  onSkipOnboarding: () => void;
}

/**
 * Multi-step onboarding flow.
 *
 * Steps:
 * 0: Welcome intro steps (internal sub-steps 0-3)
 * 1: Template selection
 * 2: Plan configuration & creation
 */
export default function OnboardingScreen({
  onCreatePlanFromTemplate,
  onMarkOnboardingComplete,
  onSkipOnboarding,
}: OnboardingScreenProps) {
  const router = useRouter();

  // Top-level step: 0=welcome, 1=template_select, 2=plan_config
  const [flowStep, setFlowStep] = useState(0);

  // Welcome sub-step (0-3)
  const [welcomeStep, setWelcomeStep] = useState(0);

  // Selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  // Get the selected template object
  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return TEMPLATES.find((t) => t.templateId === selectedTemplateId) ?? null;
  }, [selectedTemplateId]);

  // Welcome step handlers
  const handleWelcomeNext = useCallback(() => {
    if (welcomeStep < 3) {
      setWelcomeStep((s) => s + 1);
    } else {
      // Last welcome step -> go to template selection
      setFlowStep(1);
    }
  }, [welcomeStep]);

  const handleWelcomeSkip = useCallback(() => {
    onSkipOnboarding();
    router.replace("/(tabs)/calendar");
  }, [onSkipOnboarding, router]);

  // Template selection handlers
  const handleSelectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
  }, []);

  const handleTemplateConfirm = useCallback(() => {
    if (selectedTemplateId) {
      setFlowStep(2);
    }
  }, [selectedTemplateId]);

  const handleTemplateSkip = useCallback(() => {
    onSkipOnboarding();
    router.replace("/(tabs)/calendar");
  }, [onSkipOnboarding, router]);

  // Plan config handlers
  const handlePlanComplete = useCallback(() => {
    if (selectedTemplate) {
      onCreatePlanFromTemplate(selectedTemplate);
      onMarkOnboardingComplete();
      router.replace("/(tabs)/calendar");
    }
  }, [
    selectedTemplate,
    onCreatePlanFromTemplate,
    onMarkOnboardingComplete,
    router,
  ]);

  const handlePlanBack = useCallback(() => {
    setFlowStep(1);
  }, []);

  return (
    <View style={styles.container}>
      {flowStep === 0 && (
        <WelcomeSteps
          currentStep={welcomeStep}
          onNext={handleWelcomeNext}
          onSkip={handleWelcomeSkip}
        />
      )}

      {flowStep === 1 && (
        <TemplatePicker
          templates={TEMPLATES}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={handleSelectTemplate}
          onConfirm={handleTemplateConfirm}
          onSkip={handleTemplateSkip}
        />
      )}

      {flowStep === 2 && selectedTemplate && (
        <PlanConfig
          template={selectedTemplate}
          onComplete={handlePlanComplete}
          onBack={handlePlanBack}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
