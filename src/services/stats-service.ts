/**
 * Stats Service
 *
 * Computes all statistics for the Stats dashboard (Tab 4).
 * Data sources: WorkoutSession + WorkoutSet + PersonalRecord + Exercise repos.
 *
 * Sections:
 *   1. Hero card: weekly volume with week-over-week change percentage
 *   2. Four-grid summary cards
 *   3. Weekly volume bar chart (last 8 weeks)
 *   4. PR list (top 4 exercises with estimated 1RM)
 *   5. Training frequency heatmap (28-day grid)
 */

import type { DatabaseAdapter } from "../db/database-adapter";
import type { WorkoutSession } from "../types";
import type { WorkoutSessionRepo } from "../db/repositories/workout-session.repo";
import type { WorkoutSetRepo } from "../db/repositories/workout-set.repo";
import type { WorkoutExerciseRepo } from "../db/repositories/workout-exercise.repo";
import type { PersonalRecordRepo } from "../db/repositories/personal-record.repo";
import type { ExerciseRepo } from "../db/repositories/exercise.repo";
import type { TrainingPlanRepo } from "../db/repositories/training-plan.repo";
import type { TrainingDayRepo } from "../db/repositories/training-day.repo";

// ============================================================
// Types
// ============================================================

export interface HeroCardData {
  weeklyVolume: number;
  weeklyChangePct: number | null; // null means "--" (no prior data)
}

export interface FourGridData {
  weeklySessions: number;
  weeklyTarget: number;
  monthlySessions: number;
  consecutiveWeeks: number;
  weeklyDurationHours: number;
  monthlyPRCount: number;
}

export interface WeekVolume {
  weekLabel: string; // e.g. "5/12"
  volume: number;
  isCurrentWeek: boolean;
  isLastWeek: boolean;
}

export interface PRListEntry {
  exerciseName: string;
  estimated1RM: number;
  date: string;
}

export interface HeatmapDay {
  date: string;
  intensity: number; // 0.1=rest, 0.4-0.6=light, 0.7-0.8=moderate, 0.9+=heavy
  isPlanned: boolean;
}

export interface StatsData {
  hasData: boolean;
  heroCard: HeroCardData;
  fourGrid: FourGridData;
  weeklyVolumes: WeekVolume[];
  prRecords: PRListEntry[];
  frequencyHeatmap: HeatmapDay[];
}

// ============================================================
// Helper: date range calculations (ISO weeks: Monday-Sunday)
// ============================================================

/**
 * Get the Monday of the week containing the given date.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // JS: Sunday=0, Monday=1, ..., Saturday=6
  // ISO week starts on Monday
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a date as 'YYYY-MM-DD'.
 */
function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get week label like "M/D" from a date (the Monday of that week).
 */
function getWeekLabel(monday: Date): string {
  return `${monday.getMonth() + 1}/${monday.getDate()}`;
}

/**
 * Compute the training intensity for a session based on sets.
 * Intensity formula: total volume / (target_volume if available, else actual volume).
 * Simplified: based on total volume relative to a baseline.
 *
 * Per spec:
 *   rest=0.1, light=0.4-0.6, moderate=0.7-0.8, heavy=0.9+
 */
function computeIntensity(totalVolume: number): number {
  if (totalVolume === 0) return 0.1;
  if (totalVolume < 2000) return 0.4;
  if (totalVolume < 5000) return 0.6;
  if (totalVolume < 10000) return 0.7;
  if (totalVolume < 20000) return 0.8;
  return 0.9;
}

// ============================================================
// Service implementation
// ============================================================

export interface StatsService {
  getStatsData(): StatsData;
}

export function createStatsService(
  db: DatabaseAdapter,
  sessionRepo: WorkoutSessionRepo,
  setRepo: WorkoutSetRepo,
  workoutExerciseRepo: WorkoutExerciseRepo,
  prRepo: PersonalRecordRepo,
  exerciseRepo: ExerciseRepo,
  planRepo: TrainingPlanRepo,
  dayRepo: TrainingDayRepo,
): StatsService {
  /**
   * Calculate the volume for a single session (sum of weight * reps for all completed sets).
   */
  function getSessionVolume(sessionBizKey: bigint): number {
    const exercises = workoutExerciseRepo.findBySessionBizKey(sessionBizKey);
    let total = 0;
    for (const ex of exercises) {
      const sets = setRepo.findByWorkoutExerciseBizKey(ex.biz_key);
      for (const s of sets) {
        if (
          s.is_completed &&
          s.actual_weight !== null &&
          s.actual_reps !== null
        ) {
          total += s.actual_weight * s.actual_reps;
        }
      }
    }
    return total;
  }

  /**
   * Get all sessions in a date range with their volumes.
   */
  function getSessionsWithVolume(
    startDate: string,
    endDate: string,
  ): Array<{ session: WorkoutSession; volume: number }> {
    const sessions = sessionRepo.findByDateRange(startDate, endDate);
    return sessions.map((session) => ({
      session,
      volume: getSessionVolume(session.biz_key),
    }));
  }

  /**
   * Count sessions in a date range (completed or partial).
   */
  function countSessions(startDate: string, endDate: string): number {
    const sessions = sessionRepo.findByDateRange(startDate, endDate);
    return sessions.filter(
      (s) =>
        s.session_status === "completed" ||
        s.session_status === "completed_partial",
    ).length;
  }

  /**
   * Sum duration (hours) of sessions in a date range.
   */
  function sumDurationHours(startDate: string, endDate: string): number {
    const sessions = sessionRepo.findByDateRange(startDate, endDate);
    let totalMs = 0;
    for (const s of sessions) {
      if (s.ended_at) {
        const start = new Date(s.started_at).getTime();
        const end = new Date(s.ended_at).getTime();
        totalMs += end - start;
      }
    }
    return totalMs / (1000 * 60 * 60);
  }

  /**
   * Count consecutive weeks with at least 1 session, counting back from current week.
   */
  function countConsecutiveWeeks(today: Date): number {
    let count = 0;
    const currentWeekStart = getWeekStart(today);
    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() - 7 * i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const sessions = sessionRepo.findByDateRange(
        toISODate(weekStart),
        toISODate(weekEnd),
      );
      const completedSessions = sessions.filter(
        (s) =>
          s.session_status === "completed" ||
          s.session_status === "completed_partial",
      );
      if (completedSessions.length > 0) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Get weekly target from the active plan.
   */
  function getWeeklyTarget(): number {
    const plan = planRepo.findActive();
    if (!plan || !plan.weekly_config) return 0;
    try {
      const config = JSON.parse(plan.weekly_config) as Record<string, unknown>;
      return Object.keys(config).length;
    } catch {
      return 0;
    }
  }

  /**
   * Count PRs in current month.
   */
  function countMonthlyPRs(today: Date): number {
    const year = today.getFullYear();
    const month = today.getMonth();
    const startDate = toISODate(new Date(year, month, 1));
    const endDate = toISODate(new Date(year, month + 1, 0));
    const allPRs = prRepo.findAll(undefined, "pr_date DESC");
    return allPRs.filter(
      (pr) => pr.pr_date >= startDate && pr.pr_date <= endDate,
    ).length;
  }

  /**
   * Build the hero card data.
   */
  function buildHeroCard(today: Date): HeroCardData {
    const currentWeekStart = getWeekStart(today);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

    const thisWeekSessions = getSessionsWithVolume(
      toISODate(currentWeekStart),
      toISODate(currentWeekEnd),
    );
    const lastWeekSessions = getSessionsWithVolume(
      toISODate(lastWeekStart),
      toISODate(lastWeekEnd),
    );

    const weeklyVolume = thisWeekSessions.reduce((sum, s) => sum + s.volume, 0);
    const lastWeekVolume = lastWeekSessions.reduce(
      (sum, s) => sum + s.volume,
      0,
    );

    let weeklyChangePct: number | null = null;
    if (lastWeekVolume > 0) {
      weeklyChangePct = weeklyVolume / lastWeekVolume - 1;
    }

    return { weeklyVolume, weeklyChangePct };
  }

  /**
   * Build the four-grid summary data.
   */
  function buildFourGrid(today: Date): FourGridData {
    const currentWeekStart = getWeekStart(today);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

    const year = today.getFullYear();
    const month = today.getMonth();
    const monthStart = toISODate(new Date(year, month, 1));
    const monthEnd = toISODate(new Date(year, month + 1, 0));

    return {
      weeklySessions: countSessions(
        toISODate(currentWeekStart),
        toISODate(currentWeekEnd),
      ),
      weeklyTarget: getWeeklyTarget(),
      monthlySessions: countSessions(monthStart, monthEnd),
      consecutiveWeeks: countConsecutiveWeeks(today),
      weeklyDurationHours: sumDurationHours(
        toISODate(currentWeekStart),
        toISODate(currentWeekEnd),
      ),
      monthlyPRCount: countMonthlyPRs(today),
    };
  }

  /**
   * Build the weekly volume bar chart data (last 8 weeks).
   */
  function buildWeeklyVolumes(today: Date): WeekVolume[] {
    const currentWeekStart = getWeekStart(today);
    const result: WeekVolume[] = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() - 7 * i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const sessions = getSessionsWithVolume(
        toISODate(weekStart),
        toISODate(weekEnd),
      );
      const volume = sessions.reduce((sum, s) => sum + s.volume, 0);

      result.push({
        weekLabel: getWeekLabel(weekStart),
        volume,
        isCurrentWeek: i === 0,
        isLastWeek: i === 1,
      });
    }

    return result;
  }

  /**
   * Build the PR list (top 4 exercises with estimated 1RM).
   * Uses the Epley formula: weight * (1 + reps / 30)
   * Based on the heaviest set per exercise.
   */
  function buildPRList(): PRListEntry[] {
    const allPRs = prRepo.findAll(undefined, "pr_value DESC");
    const seenExercises = new Set<number>();
    const result: PRListEntry[] = [];

    for (const pr of allPRs) {
      if (pr.pr_type !== "weight") continue;
      const exBizKey = Number(pr.exercise_biz_key);
      if (seenExercises.has(exBizKey)) continue;

      const exercise = exerciseRepo.findByBizKey(pr.exercise_biz_key);
      if (!exercise || exercise.is_deleted) continue;

      seenExercises.add(exBizKey);

      // For 1RM estimation, we need the weight and reps from the PR set
      // The pr_value for "weight" type is the actual weight.
      // We need to find the corresponding set to get reps.
      // Since we track weight PRs, we look up the set to find reps.
      let estimated1RM = pr.pr_value; // fallback to raw weight
      if (pr.workout_set_biz_key) {
        const set = db.getFirstSync<{
          actual_weight: number | null;
          actual_reps: number | null;
        }>(
          "SELECT actual_weight, actual_reps FROM workout_sets WHERE biz_key = ?",
          [Number(pr.workout_set_biz_key)],
        );
        if (set && set.actual_weight && set.actual_reps) {
          estimated1RM = set.actual_weight * (1 + set.actual_reps / 30);
        }
      }

      result.push({
        exerciseName: exercise.exercise_name,
        estimated1RM,
        date: pr.pr_date,
      });

      if (result.length >= 4) break;
    }

    return result;
  }

  /**
   * Build the training frequency heatmap (28 days).
   */
  function buildHeatmap(today: Date): HeatmapDay[] {
    const result: HeatmapDay[] = [];

    // Get active plan for checking planned dates
    const activePlan = planRepo.findActive();
    const plannedDates = new Set<string>();

    if (activePlan) {
      dayRepo.findByPlanBizKey(activePlan.biz_key);

      // Calculate planned dates for the next 28 days
      // Use weekly_config to determine which weekdays are training days
      if (activePlan.weekly_config) {
        try {
          const config = JSON.parse(activePlan.weekly_config) as Record<
            string,
            unknown
          >;
          // weekday mapping: "1"=Monday, "2"=Tuesday, ..., "7"=Sunday
          const trainingWeekdays = new Set(
            Object.keys(config).map((k) => Number(k)),
          );

          // Look at 28 days ending today
          for (let i = 27; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const jsDay = d.getDay();
            const isoDay = jsDay === 0 ? 7 : jsDay;
            if (trainingWeekdays.has(isoDay) && d > today) {
              plannedDates.add(toISODate(d));
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    // Build 28-day heatmap
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toISODate(d);

      // Get sessions for this date
      const sessions = sessionRepo.findByDate(dateStr);
      const completedSessions = sessions.filter(
        (s) =>
          s.session_status === "completed" ||
          s.session_status === "completed_partial",
      );

      let totalVolume = 0;
      for (const session of completedSessions) {
        totalVolume += getSessionVolume(session.biz_key);
      }

      const isPlanned =
        plannedDates.has(dateStr) && completedSessions.length === 0;
      const intensity =
        completedSessions.length > 0 ? computeIntensity(totalVolume) : 0.1;

      result.push({
        date: dateStr,
        intensity,
        isPlanned,
      });
    }

    return result;
  }

  return {
    getStatsData(): StatsData {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if there's any data at all
      const allSessions = sessionRepo.findAll(
        undefined,
        "session_date DESC",
        1,
      );
      const hasData = allSessions.length > 0;

      return {
        hasData,
        heroCard: buildHeroCard(today),
        fourGrid: buildFourGrid(today),
        weeklyVolumes: buildWeeklyVolumes(today),
        prRecords: buildPRList(),
        frequencyHeatmap: buildHeatmap(today),
      };
    },
  };
}
