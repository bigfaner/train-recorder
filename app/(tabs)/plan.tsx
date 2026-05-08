/**
 * Plan Screen (Tab 2)
 *
 * Training plan management view. Shows the active plan with training day cards,
 * or an empty state prompting to create the first plan.
 *
 * Uses injected props pattern matching calendar.tsx.
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing } from "@utils/constants";
import type { TrainingPlan, TrainingDay, PlanExercise } from "../../src/types";
import {
  ActivePlanCard,
  TrainingDayCard,
  EmptyPlanState,
} from "../../src/components/plan";
import { Button } from "../../src/components/ui/Button";

export interface PlanScreenProps {
  /** Active training plan */
  activePlan: TrainingPlan | null;
  /** Training days for the active plan */
  trainingDays: TrainingDay[];
  /** Plan exercises grouped by training day biz_key */
  exercisesByDay: Map<bigint, PlanExercise[]>;
  /** Exercise name lookup map */
  exerciseNameMap: Map<bigint, string>;
  /** All plans for switching */
  allPlans: TrainingPlan[];
  /** Loading state */
  isLoading: boolean;
  /** Activate a plan */
  onActivatePlan: (planBizKey: bigint) => Promise<void>;
}

export default function PlanScreen({
  activePlan,
  trainingDays,
  exercisesByDay,
  exerciseNameMap,
  allPlans,
  isLoading,
  onActivatePlan,
}: PlanScreenProps) {
  const router = useRouter();

  const handleCreatePlan = useCallback(() => {
    router.push("/plan-editor");
  }, [router]);

  const handleEditPlan = useCallback(() => {
    if (activePlan) {
      router.push({
        pathname: "/plan-editor",
        params: { planBizKey: String(activePlan.biz_key) },
      });
    }
  }, [router, activePlan]);

  const handleDayPress = useCallback(
    (day: TrainingDay) => {
      router.push({
        pathname: "/training-day-editor",
        params: { dayBizKey: String(day.biz_key) },
      });
    },
    [router],
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Empty state — no plans at all
  if (!activePlan) {
    return (
      <View style={styles.container}>
        <EmptyPlanState onCreatePlan={handleCreatePlan} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Page header */}
        <Text style={styles.pageTitle}>训练计划</Text>

        {/* Active plan card */}
        <ActivePlanCard plan={activePlan} />

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <View style={styles.actionButton}>
            <Button onPress={handleEditPlan}>编辑计划</Button>
          </View>
          <View style={styles.actionSpacer} />
          <View style={styles.actionButton}>
            <Button variant="secondary" onPress={handleCreatePlan}>
              新建计划
            </Button>
          </View>
        </View>

        {/* Training day list */}
        <Text style={styles.sectionTitle}>训练日列表</Text>
        {trainingDays.map((day, index) => {
          const dayExercises = exercisesByDay.get(BigInt(day.biz_key)) ?? [];
          return (
            <TrainingDayCard
              key={String(day.biz_key)}
              day={day}
              exercises={dayExercises}
              exerciseNameMap={exerciseNameMap}
              index={index}
              onPress={handleDayPress}
            />
          );
        })}

        {/* Other plans (inactive) */}
        {allPlans.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>其他计划</Text>
            {allPlans
              .filter((p) => p.biz_key !== activePlan.biz_key)
              .map((plan) => (
                <View key={String(plan.biz_key)} style={styles.inactivePlanRow}>
                  <Text style={styles.inactivePlanName}>{plan.plan_name}</Text>
                  <Button
                    variant="secondary"
                    onPress={() => onActivatePlan(BigInt(plan.biz_key))}
                  >
                    激活
                  </Button>
                </View>
              ))}
          </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.contentPadding,
    paddingBottom: 100, // Tab bar space
  },
  pageTitle: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: Typography.heading1.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sectionSpacing,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: Spacing.cardSpacing,
    marginBottom: Spacing.sectionSpacing,
  },
  actionButton: {
    flex: 1,
  },
  actionSpacer: {
    width: 10,
  },
  sectionTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.cardSpacing,
  },
  inactivePlanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    marginBottom: Spacing.cardSpacing,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  inactivePlanName: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
});
