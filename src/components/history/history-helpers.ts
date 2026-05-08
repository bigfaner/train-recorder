/**
 * Pure helper functions for history page (Tab 3).
 *
 * Extracted from components for testability:
 * - Segment control metadata
 * - History card data formatting (date, volume, type labels)
 * - PR badge detection
 * - Volume chart data aggregation (weekly buckets)
 * - PR panel grouping
 * - History filter and sorting
 * - Backlog and satisfaction display
 */

import type {
  WorkoutSession,
  WorkoutSet,
  PersonalRecordEntry,
} from "../../types";
import { Colors } from "@utils/constants";

// ============================================================
// Segment Control
// ============================================================

export interface HistorySegment {
  key: "history" | "progress" | "volume" | "pr";
  label: string;
}

export const HISTORY_SEGMENTS: HistorySegment[] = [
  { key: "history", label: "历史" },
  { key: "progress", label: "进步" },
  { key: "volume", label: "容量" },
  { key: "pr", label: "PR" },
];

// ============================================================
// History Card Date Formatting
// ============================================================

/**
 * Format a session date for history card display (e.g., "5月7日 周四").
 */
export function formatHistoryCardDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 周${weekday}`;
}

// ============================================================
// Volume Computation
// ============================================================

/**
 * Compute total volume (sum of actual_weight * actual_reps) for workout sets.
 * Treats null actual values as 0.
 */
export function computeSessionTotalVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, set) => {
    const weight = set.actual_weight ?? 0;
    const reps = set.actual_reps ?? 0;
    return sum + weight * reps;
  }, 0);
}

/**
 * Format volume with comma separators and kg unit.
 */
export function formatVolume(volume: number): string {
  return `${volume.toLocaleString("en-US")} kg`;
}

// ============================================================
// Training Type Labels & Colors
// ============================================================

/**
 * Get the display label for a training type.
 */
export function getTrainingTypeLabel(
  type: WorkoutSession["training_type"],
): string {
  const labels: Record<WorkoutSession["training_type"], string> = {
    push: "推日",
    pull: "拉日",
    legs: "蹲日",
    custom: "自定义",
  };
  return labels[type];
}

/**
 * Get the color for a training type.
 */
export function getTrainingTypeColor(
  type: WorkoutSession["training_type"],
): string {
  const colorMap: Record<WorkoutSession["training_type"], string> = {
    push: Colors.pushDay,
    pull: Colors.pullDay,
    legs: Colors.legDay,
    custom: Colors.otherSport,
  };
  return colorMap[type];
}

// ============================================================
// Exercise Line Formatting
// ============================================================

/**
 * Format an exercise line for history card display.
 * Shows "BW" for bodyweight (weight=0) exercises.
 */
export function formatExerciseLine(
  name: string,
  weight: number,
  reps: number,
  sets: number,
): string {
  const weightStr = weight === 0 ? "BW" : `${weight}kg`;
  return `${name} ${weightStr} x ${reps} x ${sets}`;
}

// ============================================================
// PR Badge Detection
// ============================================================

/**
 * Get the set of exercise biz_keys that achieved a PR on the given date.
 */
export function getExercisesWithPR(
  prs: PersonalRecordEntry[],
  date: string,
): Set<bigint> {
  const result = new Set<bigint>();
  for (const pr of prs) {
    if (pr.prDate === date) {
      result.add(pr.exerciseBizKey);
    }
  }
  return result;
}

// ============================================================
// Volume Chart Data
// ============================================================

export interface VolumeDataPoint {
  label: string;
  value: number;
  weekStart: string;
}

/**
 * Build weekly volume chart data from sessions and their volumes.
 * Groups sessions into weekly buckets (Mon-Sun).
 * @param sessions Workout sessions sorted by date ascending
 * @param volumeMap Map from session biz_key to computed volume
 * @param weekCount Number of recent weeks to include
 */
export function buildVolumeChartData(
  sessions: WorkoutSession[],
  volumeMap: Map<bigint, number>,
  weekCount: number,
): VolumeDataPoint[] {
  if (sessions.length === 0) return [];

  // Group sessions by week (ISO week: Mon-Sun)
  const weekBuckets = new Map<string, number>();

  for (const session of sessions) {
    const date = new Date(session.session_date + "T00:00:00");
    // Get Monday of the week
    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday is the first day
    const monday = new Date(date);
    monday.setDate(monday.getDate() - diff);
    const weekKey = monday.toISOString().slice(0, 10);

    const volume = volumeMap.get(session.biz_key) ?? 0;
    weekBuckets.set(weekKey, (weekBuckets.get(weekKey) ?? 0) + volume);
  }

  // Sort by week start date, take most recent weekCount weeks
  const sortedWeeks = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-weekCount);

  return sortedWeeks.map(([weekStart, value], index) => ({
    label: `W${index + 1}`,
    value,
    weekStart,
  }));
}

// ============================================================
// Volume Summary
// ============================================================

export interface VolumeSummary {
  currentWeek: number;
  lastWeek: number;
  monthlyTotal: number;
}

/**
 * Compute volume summary from weekly data points.
 */
export function computeVolumeSummary(
  weeklyData: VolumeDataPoint[],
): VolumeSummary {
  if (weeklyData.length === 0) {
    return { currentWeek: 0, lastWeek: 0, monthlyTotal: 0 };
  }

  const currentWeek = weeklyData[weeklyData.length - 1].value;
  const lastWeek =
    weeklyData.length >= 2 ? weeklyData[weeklyData.length - 2].value : 0;
  const monthlyTotal = weeklyData.reduce((sum, d) => sum + d.value, 0);

  return { currentWeek, lastWeek, monthlyTotal };
}

/**
 * Format the week-over-week change percentage.
 */
export function formatWeekChange(
  currentWeek: number,
  lastWeek: number,
): string {
  if (lastWeek === 0) return "N/A";
  const change = ((currentWeek - lastWeek) / lastWeek) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${Math.round(change)}%`;
}

// ============================================================
// PR Panel Formatting
// ============================================================

export interface PRGroup {
  weight: number;
  volume: number;
  weightDate: string;
  volumeDate: string;
}

/**
 * Group PRs by exercise biz_key.
 * For each exercise, tracks max weight and max volume PRs.
 */
export function groupPRsByExercise(
  prs: PersonalRecordEntry[],
): Map<bigint, PRGroup> {
  const grouped = new Map<bigint, PRGroup>();

  for (const pr of prs) {
    const existing = grouped.get(pr.exerciseBizKey);
    if (!existing) {
      grouped.set(pr.exerciseBizKey, {
        weight: pr.prType === "weight" ? pr.prValue : 0,
        volume: pr.prType === "volume" ? pr.prValue : 0,
        weightDate: pr.prType === "weight" ? pr.prDate : "",
        volumeDate: pr.prType === "volume" ? pr.prDate : "",
      });
    } else {
      if (pr.prType === "weight" && pr.prValue > existing.weight) {
        existing.weight = pr.prValue;
        existing.weightDate = pr.prDate;
      }
      if (pr.prType === "volume" && pr.prValue > existing.volume) {
        existing.volume = pr.prValue;
        existing.volumeDate = pr.prDate;
      }
    }
  }

  return grouped;
}

/**
 * Format a PR date for display.
 */
export function formatPRDate(dateStr: string): string {
  return dateStr;
}

// ============================================================
// History Filter & Sort
// ============================================================

/**
 * Filter sessions by training type.
 * Returns all sessions when type is null.
 */
export function filterSessionsByType(
  sessions: WorkoutSession[],
  type: WorkoutSession["training_type"] | null,
): WorkoutSession[] {
  if (type === null) return sessions;
  return sessions.filter((s) => s.training_type === type);
}

/**
 * Sort sessions by date descending (most recent first).
 * For same-date sessions, sort by started_at descending.
 */
export function sortSessionsByDateDescending(
  sessions: WorkoutSession[],
): WorkoutSession[] {
  return [...sessions].sort((a, b) => {
    const dateCompare = b.session_date.localeCompare(a.session_date);
    if (dateCompare !== 0) return dateCompare;
    return b.started_at.localeCompare(a.started_at);
  });
}

// ============================================================
// Backlog & Satisfaction
// ============================================================

/**
 * Check if a session is a backlog workout.
 */
export function isBacklogSession(session: WorkoutSession): boolean {
  return session.is_backlog === 1;
}

/**
 * Format satisfaction rating for display.
 */
export function formatSatisfaction(satisfaction: number): string {
  return `★ ${satisfaction}/10`;
}
