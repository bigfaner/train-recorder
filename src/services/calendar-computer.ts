/**
 * CalendarComputer Service
 *
 * Real-time calendar computation that generates day-by-day training schedules
 * from plan configuration and workout records. No pre-generated schedule table.
 *
 * Modes:
 *   - weekly_fixed: maps weekday -> training_day_biz_key from plan.weekly_config
 *   - fixed_interval: cycles through training_days with rest_days gaps between
 *
 * Skip/restore mechanism: Skipped dates stored as JSON array in user_settings
 * under key `skipped_dates_{planBizKey}`.
 *
 * Priority for dayType:
 *   1. WorkoutSession exists → 'completed' | 'completed_partial'
 *   2. Date is skipped → 'skipped'
 *   3. OtherSportRecord exists on rest day → 'other_sport'
 *   4. Plan assigns training → 'training'
 *   5. Otherwise → 'rest'
 */

import type {
  CalendarDay,
  CalendarComputer,
  TrainingPlan,
  TrainingDay,
} from "../types";
import type { DatabaseAdapter } from "../db/database-adapter";
import type { WorkoutSessionRepo } from "../db/repositories/workout-session.repo";
import type { UserSettingsRepo } from "../db/repositories/user-settings.repo";
import type { OtherSportRepo } from "../db/repositories/other-sport.repo";

/**
 * Get the number of days in a given month (1-indexed).
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Format a date as 'YYYY-MM-DD'.
 */
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Get the day of the week (1=Monday, 7=Sunday) for a given date.
 */
function getWeekday(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  // JS: 0=Sunday, 1=Monday, ... 6=Saturday
  // We want: 1=Monday, ... 7=Sunday
  return d.getDay() === 0 ? 7 : d.getDay();
}

/**
 * Parse weekly_config JSON: { weekday: training_day_biz_key }.
 * Keys in JSON are strings, values are numbers (from JSON.parse).
 */
interface WeeklyConfig {
  [weekday: string]: number;
}

function parseWeeklyConfig(config: string | null): WeeklyConfig | null {
  if (!config) return null;
  try {
    return JSON.parse(config) as WeeklyConfig;
  } catch {
    return null;
  }
}

/**
 * Resolve training day for weekly_fixed mode.
 */
function resolveWeeklyFixed(
  dateStr: string,
  plan: TrainingPlan,
  days: TrainingDay[],
): TrainingDay | null {
  const config = parseWeeklyConfig(plan.weekly_config);
  if (!config) return null;

  const weekday = getWeekday(dateStr);
  const dayBizKey = config[String(weekday)];
  if (dayBizKey === undefined) return null;

  return days.find((d) => Number(d.biz_key) === dayBizKey) ?? null;
}

/**
 * Build fixed_interval assignments for all days in a month.
 * Returns a Map<dateStr, TrainingDay> with training day assignments.
 */
function buildFixedIntervalAssignments(
  year: number,
  month: number,
  plan: TrainingPlan,
  days: TrainingDay[],
): Map<string, TrainingDay> {
  const assignments = new Map<string, TrainingDay>();
  if (days.length === 0) return assignments;

  const totalDays = getDaysInMonth(year, month);
  const dayIndexCycle = days
    .filter((d) => d.order_index >= 0)
    .sort((a, b) => a.order_index - b.order_index);

  if (dayIndexCycle.length === 0) return assignments;

  let cycleIndex = 0;
  let restRemaining = 0;
  let isTraining = true; // Start with training

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDate(year, month, day);

    if (isTraining) {
      const trainingDay = dayIndexCycle[cycleIndex % dayIndexCycle.length];
      assignments.set(dateStr, trainingDay);
      cycleIndex++;
      // After training, start rest period
      restRemaining = plan.rest_days;
      if (restRemaining > 0) {
        isTraining = false;
      }
      // If rest_days is 0, next day is also training
    } else {
      // Rest day
      restRemaining--;
      if (restRemaining <= 0) {
        isTraining = true;
      }
    }
  }

  return assignments;
}

export type CalendarComputerServiceImpl = CalendarComputer;

export function createCalendarComputerService(
  db: DatabaseAdapter,
  sessionRepo: WorkoutSessionRepo,
  userSettingsRepo: UserSettingsRepo,
  otherSportRepo: OtherSportRepo,
): CalendarComputerServiceImpl {
  /**
   * Get the user_settings key for skipped dates of a plan.
   */
  function getSkipKey(planBizKey: bigint): string {
    return `skipped_dates_${planBizKey}`;
  }

  /**
   * Get skipped dates for a plan from user_settings.
   */
  async function getSkippedDatesList(planBizKey: bigint): Promise<string[]> {
    const value = userSettingsRepo.getValue(getSkipKey(planBizKey));
    if (!value) return [];
    try {
      return JSON.parse(value) as string[];
    } catch {
      return [];
    }
  }

  /**
   * Save skipped dates to user_settings.
   */
  function saveSkippedDates(planBizKey: bigint, dates: string[]): void {
    const sorted = [...dates].sort();
    userSettingsRepo.setValue(getSkipKey(planBizKey), JSON.stringify(sorted));
  }

  /**
   * Determine the effective dayType for a CalendarDay.
   * Priority: session > skipped > other_sport > training > rest
   */
  function determineDayType(
    hasSession: boolean,
    sessionStatus: string | null,
    isSkipped: boolean,
    hasOtherSport: boolean,
    hasTrainingDay: boolean,
  ): CalendarDay["dayType"] {
    // 1. WorkoutSession exists
    if (hasSession && sessionStatus) {
      if (sessionStatus === "completed") return "completed";
      if (sessionStatus === "completed_partial") return "completed_partial";
      // in_progress session on a past date still shows as the session status
      return "training"; // fallback
    }

    // 2. Skipped
    if (isSkipped) return "skipped";

    // 3. Other sport on a non-training day
    if (hasOtherSport && !hasTrainingDay) return "other_sport";

    // 4. Training day
    if (hasTrainingDay) return "training";

    // 5. Other sport on a training day - still training type
    if (hasOtherSport) return "other_sport";

    // 6. Rest
    return "rest";
  }

  return {
    async computeMonth(
      year: number,
      month: number,
      plan: TrainingPlan,
      days: TrainingDay[],
    ): Promise<CalendarDay[]> {
      const totalDays = getDaysInMonth(year, month);
      const skippedDates = await getSkippedDatesList(plan.biz_key);
      const skippedSet = new Set(skippedDates);

      // Pre-compute fixed_interval assignments if needed
      const fixedIntervalMap =
        plan.schedule_mode === "fixed_interval"
          ? buildFixedIntervalAssignments(year, month, plan, days)
          : null;

      // Batch-load sessions for the month
      const startDate = formatDate(year, month, 1);
      const endDate = formatDate(year, month, totalDays);
      const sessions = sessionRepo.findByDateRange(startDate, endDate);
      const sessionMap = new Map<string, (typeof sessions)[0]>();
      for (const s of sessions) {
        // Use the first session per date (there could be multiple)
        if (!sessionMap.has(s.session_date)) {
          sessionMap.set(s.session_date, s);
        }
      }

      // Batch-load other sport records for the month
      const otherSportRecords = otherSportRepo.findByDateRange(
        startDate,
        endDate,
      );
      const otherSportMap = new Map<string, (typeof otherSportRecords)[0]>();
      for (const r of otherSportRecords) {
        if (!otherSportMap.has(r.record_date)) {
          otherSportMap.set(r.record_date, r);
        }
      }

      // Compute consecutive skips for each day
      const sortedSkippedDates = [...skippedSet].sort();

      const result: CalendarDay[] = [];

      for (let day = 1; day <= totalDays; day++) {
        const dateStr = formatDate(year, month, day);

        // Resolve training day
        let trainingDay: TrainingDay | null = null;
        if (plan.schedule_mode === "weekly_fixed") {
          trainingDay = resolveWeeklyFixed(dateStr, plan, days);
        } else if (fixedIntervalMap) {
          trainingDay = fixedIntervalMap.get(dateStr) ?? null;
        }

        const session = sessionMap.get(dateStr) ?? null;
        const otherSport = otherSportMap.get(dateStr) ?? null;
        const isSkipped = skippedSet.has(dateStr);

        // Compute consecutive skips up to this date
        const consecutiveSkips = computeConsecutiveSkipsBefore(
          sortedSkippedDates,
          dateStr,
        );

        const dayType = determineDayType(
          session !== null,
          session?.session_status ?? null,
          isSkipped && !session, // skip only applies if no session
          otherSport !== null,
          trainingDay !== null,
        );

        result.push({
          date: dateStr,
          trainingDay,
          workoutSession: session,
          otherSport,
          isSkipped: isSkipped && !session, // isSkipped is false if there's a session
          consecutiveSkips,
          dayType,
        });
      }

      return result;
    },

    async computeDay(
      date: string,
      plan: TrainingPlan,
      days: TrainingDay[],
    ): Promise<CalendarDay> {
      const skippedDates = await getSkippedDatesList(plan.biz_key);
      const skippedSet = new Set(skippedDates);

      // Resolve training day
      let trainingDay: TrainingDay | null = null;
      if (plan.schedule_mode === "weekly_fixed") {
        trainingDay = resolveWeeklyFixed(date, plan, days);
      } else if (plan.schedule_mode === "fixed_interval") {
        // For fixed_interval, build the month map and extract
        const [yearStr, monthStr] = date.split("-");
        const year = parseInt(yearStr!, 10);
        const month = parseInt(monthStr!, 10);
        const fixedIntervalMap = buildFixedIntervalAssignments(
          year,
          month,
          plan,
          days,
        );
        trainingDay = fixedIntervalMap.get(date) ?? null;
      }

      const sessions = sessionRepo.findByDate(date);
      const session = sessions.length > 0 ? sessions[0] : null;

      const otherSports = otherSportRepo.findByDate(date);
      const otherSport = otherSports.length > 0 ? otherSports[0] : null;

      const isSkipped = skippedSet.has(date);

      const sortedSkippedDates = [...skippedSet].sort();
      const consecutiveSkips = computeConsecutiveSkipsBefore(
        sortedSkippedDates,
        date,
      );

      const dayType = determineDayType(
        session !== null,
        session?.session_status ?? null,
        isSkipped && !session,
        otherSport !== null,
        trainingDay !== null,
      );

      return {
        date,
        trainingDay,
        workoutSession: session,
        otherSport,
        isSkipped: isSkipped && !session,
        consecutiveSkips,
        dayType,
      };
    },

    async getTodayPlan(
      plan: TrainingPlan,
      days: TrainingDay[],
    ): Promise<CalendarDay> {
      const today = new Date();
      const dateStr = formatDate(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );
      return this.computeDay(dateStr, plan, days);
    },

    async skipTrainingDay(date: string, planBizKey: bigint): Promise<void> {
      const current = await getSkippedDatesList(planBizKey);
      if (!current.includes(date)) {
        current.push(date);
        saveSkippedDates(planBizKey, current);
      }
    },

    async unskipTrainingDay(date: string, planBizKey: bigint): Promise<void> {
      const current = await getSkippedDatesList(planBizKey);
      const updated = current.filter((d) => d !== date);
      saveSkippedDates(planBizKey, updated);
    },

    async getSkippedDates(planBizKey: bigint): Promise<string[]> {
      return getSkippedDatesList(planBizKey);
    },

    async getConsecutiveSkips(
      planBizKey: bigint,
      beforeDate: string,
    ): Promise<number> {
      const skippedDates = await getSkippedDatesList(planBizKey);
      const sorted = [...skippedDates].sort();
      return computeConsecutiveSkipsBefore(sorted, beforeDate);
    },
  };
}

/**
 * Compute consecutive skips strictly before a given date.
 * Walks backward from beforeDate counting consecutive skipped dates.
 */
function computeConsecutiveSkipsBefore(
  sortedSkippedDates: string[],
  beforeDate: string,
): number {
  // Filter to dates strictly before beforeDate
  const before = sortedSkippedDates.filter((d) => d < beforeDate);
  if (before.length === 0) return 0;

  // Count backwards from the latest date before `beforeDate`
  let count = 0;
  let prev: string | null = null;

  for (let i = before.length - 1; i >= 0; i--) {
    const current = before[i]!;
    if (prev === null) {
      // First iteration (most recent date before beforeDate)
      count = 1;
    } else {
      // Check if current is the day before prev
      const prevDate = new Date(prev + "T00:00:00");
      const curDate = new Date(current + "T00:00:00");
      const diffMs = prevDate.getTime() - curDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        count++;
      } else {
        break;
      }
    }
    prev = current;
  }

  return count;
}
