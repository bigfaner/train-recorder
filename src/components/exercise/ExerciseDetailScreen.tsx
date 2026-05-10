/**
 * ExerciseDetailScreen component — shows exercise details, PRs, progress, and recent sessions.
 *
 * Sections:
 * - Basic info card (name, category, increment, rest, total sessions)
 * - PR section (max weight + max volume with dates)
 * - Progress chart area (data points prepared for victory-native LineChart)
 * - Recent 5 sessions
 *
 * Receives data from parent page which manages the ExerciseHistoryService calls.
 */

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";
import { Card } from "../ui/Card";
import type { Exercise, ExerciseDetailSummary } from "../../types";
import {
  getCategoryMeta,
  formatIncrement,
  formatPRWeight,
  formatPRVolume,
  findWeightPR,
  findVolumePR,
  formatSessionDate,
  computeSessionVolume,
  formatSetLine,
  buildProgressData,
} from "./exercise-helpers";

export interface ExerciseDetailScreenProps {
  /** The exercise entity */
  exercise: Exercise;
  /** Exercise detail summary (from useExerciseHistory) */
  summary: ExerciseDetailSummary | null;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when edit button is pressed */
  onEdit?: () => void;
}

export function ExerciseDetailScreen({
  exercise,
  summary,
  isLoading = false,
  onEdit: _onEdit,
}: ExerciseDetailScreenProps) {
  const categoryMeta = getCategoryMeta(exercise.category);
  const totalSessions = summary?.totalSessionCount ?? 0;
  const recentSessions = summary?.recentSessions ?? [];
  const personalRecords = summary?.personalRecords ?? [];

  const weightPR = findWeightPR(personalRecords);
  const volumePR = findVolumePR(personalRecords);

  const progressData = buildProgressData(recentSessions, weightPR);

  return (
    <View style={styles.container} testID="exercise-detail-panel">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Basic Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.exerciseIcon}>🏋️</Text>
          <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryTag}>
              {categoryMeta?.labelZh ?? exercise.category}
            </Text>
            {categoryMeta?.labelEn && (
              <Text style={styles.categoryLabel}>{categoryMeta.labelEn}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>加重增量</Text>
              <Text style={styles.infoValue}>
                {formatIncrement(exercise.increment).replace("+", "")}
              </Text>
            </View>
            <View style={[styles.infoItem, styles.infoItemBorder]}>
              <Text style={styles.infoLabel}>默认休息</Text>
              <Text style={styles.infoValue}>
                {exercise.default_rest}
                <Text style={styles.infoUnit}>秒</Text>
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>总训练次数</Text>
              <Text style={styles.infoValue}>
                {totalSessions}
                <Text style={styles.infoUnit}>次</Text>
              </Text>
            </View>
          </View>
        </Card>

        {/* Loading State */}
        {isLoading && <Text style={styles.loadingText}>加载中...</Text>}

        {/* PR Section */}
        {!isLoading && (weightPR || volumePR) && (
          <>
            <Text style={styles.sectionTitle}>个人记录</Text>
            <View style={styles.prRow}>
              {weightPR && (
                <View style={[styles.prCard, styles.prWeightCard]}>
                  <Text style={styles.prIcon}>🏆</Text>
                  <Text style={styles.prLabel}>最高重量</Text>
                  <Text style={[styles.prValue, styles.prWeightValue]}>
                    {formatPRWeight(weightPR.prValue)}
                  </Text>
                  <Text style={styles.prDate}>{weightPR.prDate}</Text>
                </View>
              )}
              {volumePR && (
                <View style={[styles.prCard, styles.prVolumeCard]}>
                  <Text style={styles.prIcon}>📊</Text>
                  <Text style={styles.prLabel}>最高容量</Text>
                  <Text style={[styles.prValue, styles.prVolumeValue]}>
                    {formatPRVolume(volumePR.prValue)}
                  </Text>
                  <Text style={styles.prDate}>{volumePR.prDate}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Progress Chart Section */}
        {!isLoading && progressData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>进步曲线</Text>
            <Card style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {progressData.map((point) => (
                  <View key={point.date} style={styles.chartPointRow}>
                    <Text
                      style={[
                        styles.chartValue,
                        point.isPR && styles.chartValuePR,
                      ]}
                    >
                      {point.value}
                      {point.isPR ? " PR" : ""}
                    </Text>
                    <Text style={styles.chartDate}>{point.date.slice(5)}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Recent Sessions */}
        {!isLoading && recentSessions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              最近 {recentSessions.length} 次训练
            </Text>
            {recentSessions.map((session) => {
              const volume = computeSessionVolume(session);
              const isPRSession =
                weightPR && session.sessionDate === weightPR.prDate;

              return (
                <Card key={session.sessionDate} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View>
                      <Text style={styles.sessionDateText}>
                        {formatSessionDate(session.sessionDate)}
                      </Text>
                    </View>
                    {isPRSession && <Text style={styles.prBadge}>🏆 PR</Text>}
                  </View>
                  <Text style={styles.sessionSets}>
                    {formatSetLine(session.sets)}{" "}
                    <Text style={styles.sessionSetCount}>
                      {session.sets.length}组
                    </Text>
                  </Text>
                  <View style={styles.sessionFooter}>
                    <Text style={styles.sessionVolume}>
                      容量: {volume.toLocaleString("en-US")}kg
                    </Text>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !summary && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无训练记录</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// --- Styles ---

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
    paddingBottom: 24,
  },
  infoCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  exerciseIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: Typography.heading1.fontWeight as "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  categoryTag: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "500" as const,
    color: Colors.accent,
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    overflow: "hidden",
  },
  categoryLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundAlt,
    width: "100%",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: Colors.backgroundAlt,
    borderRightColor: Colors.backgroundAlt,
  },
  infoLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  infoUnit: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "400" as const,
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  prRow: {
    flexDirection: "row",
    gap: 16,
  },
  prCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  prWeightCard: {
    backgroundColor: "rgba(48, 209, 88, 0.06)",
  },
  prVolumeCard: {
    backgroundColor: "rgba(0, 113, 227, 0.06)",
  },
  prIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  prLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  prValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginTop: 4,
  },
  prWeightValue: {
    color: Colors.success,
  },
  prVolumeValue: {
    color: Colors.accent,
  },
  prDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  chartCard: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  chartContainer: {
    gap: 8,
  },
  chartPointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartValue: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
    fontWeight: "500" as const,
  },
  chartValuePR: {
    color: Colors.success,
    fontWeight: "600" as const,
  },
  chartDate: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
  },
  sessionCard: {
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionDateText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  prBadge: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600" as const,
    color: Colors.success,
    backgroundColor: "rgba(48, 209, 88, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  sessionSets: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  sessionSetCount: {
    color: Colors.textSecondary,
  },
  sessionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundAlt,
  },
  sessionVolume: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
  },
});
