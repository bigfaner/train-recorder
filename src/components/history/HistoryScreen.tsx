/**
 * HistoryScreen
 *
 * Main screen for Tab 3 (History) with 4-segment control:
 * 历史/进步/容量/PR with animated transitions.
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
  Alert,
} from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import { HISTORY_SEGMENTS } from "./history-helpers";
import type { HistorySegment } from "./history-helpers";
import {
  formatHistoryCardDate,
  computeSessionTotalVolume,
  formatVolume,
  getTrainingTypeLabel,
  getExercisesWithPR,
  filterSessionsByType,
  sortSessionsByDateDescending,
  isBacklogSession,
  formatSatisfaction,
} from "./history-helpers";
import type { VolumeDataPoint, VolumeSummary } from "./history-helpers";
import { HistoryCard } from "./HistoryCard";
import type { ExerciseSummary } from "./HistoryCard";
import { EmptyHistory } from "./EmptyHistory";
import { ProgressPanel } from "./ProgressPanel";
import type { ExerciseOption } from "./ProgressPanel";
import { VolumePanel } from "./VolumePanel";
import { PRPanel } from "./PRPanel";
import type { PRCardData } from "./PRPanel";
import { CalendarFilterTabs } from "../calendar/CalendarFilterTabs";
import type { FilterType } from "../calendar/CalendarFilterTabs";
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  PersonalRecordEntry,
  Feeling,
  Exercise,
} from "../../types";

// ============================================================
// Props Interface (injected-props pattern)
// ============================================================

export interface HistoryScreenProps {
  /** All completed/partial workout sessions */
  sessions: WorkoutSession[];
  /** Workout exercises grouped by session biz_key */
  exercisesBySession: Map<bigint, WorkoutExercise[]>;
  /** Workout sets grouped by workout exercise biz_key */
  setsByExercise: Map<bigint, WorkoutSet[]>;
  /** All PR entries */
  prs: PersonalRecordEntry[];
  /** Feelings grouped by session biz_key */
  feelingsBySession: Map<bigint, Feeling>;
  /** All exercises (for name lookup) */
  exercises: Exercise[];
  /** Progress chart data */
  progressData: Array<{
    date: string;
    value: number;
    isPR: boolean;
  }>;
  /** Exercises available for progress selector */
  progressExercises: ExerciseOption[];
  /** Volume chart data */
  volumeData: VolumeDataPoint[];
  /** Volume summary */
  volumeSummary: VolumeSummary;
  /** Formatted week change string */
  volumeWeekChange: string;
  /** PR cards for PR panel */
  prCards: PRCardData[];
  /** Navigate to workout detail edit */
  onEditSession: (sessionBizKey: bigint) => void;
  /** Delete session handler */
  onDeleteSession: (sessionBizKey: bigint) => void;
  /** Exercise selected for progress panel */
  selectedExerciseBizKey: bigint | null;
  /** Callback when exercise selected in progress panel */
  onExerciseSelect: (bizKey: bigint) => void;
}

// ============================================================
// Component
// ============================================================

export function HistoryScreen({
  sessions,
  exercisesBySession,
  setsByExercise,
  prs,
  feelingsBySession,
  exercises,
  progressData,
  progressExercises,
  volumeData,
  volumeSummary,
  volumeWeekChange,
  prCards,
  onEditSession,
  onDeleteSession,
  selectedExerciseBizKey,
  onExerciseSelect,
}: HistoryScreenProps) {
  const [activeSegment, setActiveSegment] =
    useState<HistorySegment["key"]>("history");
  const [typeFilter, setTypeFilter] = useState<FilterType>(null);

  // Exercise name lookup
  const exerciseNameMap = new Map<bigint, string>();
  for (const ex of exercises) {
    exerciseNameMap.set(ex.biz_key, ex.exercise_name);
  }

  // Filter and sort sessions for history panel
  const filteredSessions = sortSessionsByDateDescending(
    filterSessionsByType(sessions, typeFilter),
  );

  // Determine selected exercise name for progress chart title
  const selectedExerciseName = selectedExerciseBizKey
    ? (exerciseNameMap.get(selectedExerciseBizKey) ?? "")
    : "";

  // Empty state
  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <Text style={styles.navTitle}>训练记录</Text>
        </View>
        <EmptyHistory />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>训练记录</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Control */}
        <View style={styles.segmented}>
          {HISTORY_SEGMENTS.map((segment) => (
            <TouchableOpacity
              key={segment.key}
              style={[
                styles.segOption,
                activeSegment === segment.key && styles.segOptionActive,
              ]}
              onPress={() => setActiveSegment(segment.key)}
              activeOpacity={0.7}
              testID={`${segment.key}-tab`}
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

        {/* Panel Content */}
        {activeSegment === "history" && (
          <View testID="history-list">
            {/* Training type filter */}
            <CalendarFilterTabs
              activeFilter={typeFilter}
              onFilterChange={setTypeFilter}
              testID="type-filter-btn"
            />

            {filteredSessions.length === 0 ? (
              <View style={styles.emptyFilter}>
                <Text style={styles.emptyFilterText}>没有匹配的训练记录</Text>
              </View>
            ) : (
              filteredSessions.map((session) => {
                const sessionExercises =
                  exercisesBySession.get(session.biz_key) ?? [];
                const feeling = feelingsBySession.get(session.biz_key);
                const prExercises = getExercisesWithPR(
                  prs,
                  session.session_date,
                );

                // Build exercise summaries
                const exerciseSummaries: ExerciseSummary[] =
                  sessionExercises.map((we) => {
                    const sets = setsByExercise.get(we.biz_key) ?? [];
                    const completedSets = sets.filter(
                      (s) => s.is_completed === 1,
                    );
                    const weight =
                      completedSets.length > 0
                        ? (completedSets[0].actual_weight ?? 0)
                        : (we.suggested_weight ?? 0);
                    const reps =
                      completedSets.length > 0
                        ? (completedSets[0].actual_reps ?? we.target_reps)
                        : we.target_reps;

                    return {
                      exerciseName:
                        exerciseNameMap.get(we.exercise_biz_key) ?? "",
                      weight,
                      reps,
                      sets: completedSets.length || we.target_sets,
                      isPR: prExercises.has(we.exercise_biz_key),
                    };
                  });

                // Compute volume
                let totalVolume = 0;
                for (const we of sessionExercises) {
                  const sets = setsByExercise.get(we.biz_key) ?? [];
                  totalVolume += computeSessionTotalVolume(sets);
                }

                return (
                  <HistoryCard
                    key={String(session.biz_key)}
                    testID={`history-record-${session.biz_key.toString()}`}
                    formattedDate={formatHistoryCardDate(session.session_date)}
                    typeLabel={getTrainingTypeLabel(session.training_type)}
                    trainingType={session.training_type}
                    exercises={exerciseSummaries}
                    volume={formatVolume(totalVolume)}
                    satisfaction={
                      feeling ? formatSatisfaction(feeling.satisfaction) : ""
                    }
                    isBacklog={isBacklogSession(session)}
                    onEdit={() => onEditSession(session.biz_key)}
                    onDelete={() =>
                      confirmDelete(session.biz_key, onDeleteSession)
                    }
                    onPress={() => onEditSession(session.biz_key)}
                  />
                );
              })
            )}
          </View>
        )}

        {activeSegment === "progress" && (
          <ProgressPanel
            exercises={progressExercises}
            selectedExerciseBizKey={selectedExerciseBizKey}
            onExerciseSelect={onExerciseSelect}
            progressData={progressData}
            chartTitle={`${selectedExerciseName}重量趋势`}
            chartSubtitle={`近${progressData.length}次训练`}
          />
        )}

        {activeSegment === "volume" && (
          <VolumePanel
            volumeData={volumeData}
            summary={volumeSummary}
            weekChange={volumeWeekChange}
          />
        )}

        {activeSegment === "pr" && <PRPanel prCards={prCards} />}
      </ScrollView>
    </View>
  );
}

/**
 * Confirm delete dialog.
 */
function confirmDelete(
  sessionBizKey: bigint,
  onDelete: (bizKey: bigint) => void,
) {
  Alert.alert(
    "删除训练记录",
    "确定要删除这条训练记录吗？相关的个人记录将被重新计算。",
    [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => onDelete(sessionBizKey),
      },
    ],
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
  emptyFilter: {
    paddingVertical: Spacing.sectionSpacing * 2,
    alignItems: "center",
  },
  emptyFilterText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
  },
});
