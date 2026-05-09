/**
 * CalendarDetailCard
 *
 * Bottom detail card shown when a date is selected.
 * Displays different content based on the day type:
 * - training: plan preview + "开始训练" button
 * - completed: green checkmark + summary
 * - completed_partial: semi-transparent checkmark + "部分完成" label
 * - rest: "今天没有训练安排" message
 * - skipped: skip info
 * - other_sport: other sport info
 *
 * Also shows "补录训练" for past dates without records.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { CalendarDay } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Tag } from "../ui/Tag";
import { Colors, Typography, Spacing } from "@utils/constants";
import {
  isPast,
  isToday,
  getTrainingTypeColor,
  getTrainingTypeLabel,
} from "../../utils/date";

export interface CalendarDetailCardProps {
  /** The selected calendar day */
  calendarDay: CalendarDay | null;
  /** Navigate to workout page */
  onStartWorkout: (date: string) => void;
  /** Navigate to other-sport page */
  onRecordOtherSport: (date: string) => void;
  /** Navigate to backlog workout entry */
  onBacklogWorkout: (date: string) => void;
  /** Skip this training day */
  onSkipDay?: (date: string) => void;
  /** Unskip this training day */
  onUnskipDay?: (date: string) => void;
}

export function CalendarDetailCard({
  calendarDay,
  onStartWorkout,
  onRecordOtherSport,
  onBacklogWorkout,
  onSkipDay,
  onUnskipDay,
}: CalendarDetailCardProps) {
  if (!calendarDay) return null;

  const { date, trainingDay, consecutiveSkips } = calendarDay;
  const past = isPast(date) && !isToday(date);
  const today = isToday(date);
  const showConsecutiveWarning = consecutiveSkips >= 3;

  return (
    <Card style={styles.card} testID="workout-detail-panel">
      {/* Date header */}
      <View style={styles.header}>
        <Text style={styles.dateLabel}>{formatDateDisplay(date)}</Text>
        {trainingDay && (
          <Tag
            label={getTrainingTypeLabel(trainingDay.training_type)}
            color={getTrainingTypeColor(trainingDay.training_type)}
          />
        )}
      </View>

      {/* Content based on day type */}
      {renderContent(
        calendarDay,
        past,
        today,
        onStartWorkout,
        onRecordOtherSport,
        onBacklogWorkout,
        onSkipDay,
        onUnskipDay,
      )}

      {/* Consecutive skip warning */}
      {showConsecutiveWarning && (
        <View style={styles.warningBanner} testID="skip-streak-warning">
          <Text style={styles.warningText}>
            已连续跳过 {consecutiveSkips} 次训练，是否调整计划？
          </Text>
        </View>
      )}
    </Card>
  );
}

function renderContent(
  day: CalendarDay,
  past: boolean,
  today: boolean,
  onStartWorkout: (date: string) => void,
  onRecordOtherSport: (date: string) => void,
  onBacklogWorkout: (date: string) => void,
  onSkipDay?: (date: string) => void,
  onUnskipDay?: (date: string) => void,
) {
  const { date, dayType, trainingDay, workoutSession } = day;

  switch (dayType) {
    case "completed":
      return (
        <View style={styles.contentBlock}>
          <View style={styles.completedRow}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.completedLabel}>已完成</Text>
          </View>
          {workoutSession && <Text style={styles.summaryText}>训练已记录</Text>}
          {/* Past completed days could show more detail */}
        </View>
      );

    case "completed_partial":
      return (
        <View style={styles.contentBlock}>
          <View style={styles.completedRow}>
            <Text style={[styles.checkIcon, styles.checkIconPartial]}>◐</Text>
            <Text style={styles.completedLabel}>部分完成</Text>
          </View>
          {workoutSession && (
            <Text style={styles.summaryText}>训练已部分记录</Text>
          )}
        </View>
      );

    case "skipped":
      return (
        <View style={styles.contentBlock}>
          <Text style={styles.skippedLabel}>已跳过</Text>
          {trainingDay && (
            <Text style={styles.planPreview}>
              原计划: {trainingDay.day_name}
            </Text>
          )}
          {onUnskipDay && (
            <Button
              variant="secondary"
              onPress={() => onUnskipDay(date)}
              testID="undo-skip-btn"
            >
              恢复训练
            </Button>
          )}
        </View>
      );

    case "training":
      return (
        <View style={styles.contentBlock}>
          {trainingDay && (
            <Text style={styles.planPreview}>{trainingDay.day_name}</Text>
          )}
          {past ? (
            // Past training day without record - show backlog option
            <View style={styles.buttonRow}>
              <Button
                onPress={() => onBacklogWorkout(date)}
                testID="log-retroactive-btn"
              >
                补录训练
              </Button>
              <View style={styles.buttonSpacer} />
              <Button
                variant="secondary"
                onPress={() => onRecordOtherSport(date)}
                testID="log-other-sport-btn"
              >
                记录其他运动
              </Button>
            </View>
          ) : (
            // Future/today training day
            <View style={styles.buttonRow}>
              <Button
                onPress={() => onStartWorkout(date)}
                testID="start-workout-btn"
              >
                开始训练
              </Button>
              <View style={styles.buttonSpacer} />
              <Button
                variant="secondary"
                onPress={() => onRecordOtherSport(date)}
                testID="log-other-sport-btn"
              >
                记录其他运动
              </Button>
            </View>
          )}
          {today && onSkipDay && (
            <TouchableOpacityWrapper onPress={() => onSkipDay(date)}>
              <Text style={styles.skipLink}>跳过今日训练</Text>
            </TouchableOpacityWrapper>
          )}
        </View>
      );

    case "other_sport":
      return (
        <View style={styles.contentBlock}>
          <Text style={styles.restMessage}>其他运动记录</Text>
          <Button variant="secondary" onPress={() => onRecordOtherSport(date)}>
            记录其他运动
          </Button>
        </View>
      );

    case "rest":
    default:
      return (
        <View style={styles.contentBlock}>
          <Text style={styles.restMessage}>今天没有训练安排</Text>
          <Button variant="secondary" onPress={() => onRecordOtherSport(date)}>
            记录其他运动
          </Button>
        </View>
      );
  }
}

/** Format date for display: M月D日 */
function formatDateDisplay(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m!, 10)}月${parseInt(d!, 10)}日`;
}

/** Minimal touchable wrapper for inline text links */
function TouchableOpacityWrapper({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  // Use a simple Text with onPress for inline links
  return (
    <View style={styles.skipLinkContainer}>
      <Text style={styles.skipLink} onPress={onPress}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.cardSpacing,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  contentBlock: {
    gap: 10,
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    fontSize: 18,
    color: Colors.success,
    fontWeight: "700",
  },
  checkIconPartial: {
    opacity: 0.6,
  },
  completedLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.success,
    fontWeight: "500",
  },
  summaryText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  planPreview: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  skippedLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  restMessage: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  buttonSpacer: {
    width: 10,
  },
  skipLinkContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  skipLink: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textTertiary,
    textDecorationLine: "underline",
  },
  warningBanner: {
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  warningText: {
    fontSize: Typography.bodySmall.fontSize,
    color: "#856404",
    fontWeight: "500",
  },
});
