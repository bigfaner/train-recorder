/**
 * useCalendar hook
 *
 * Wraps CalendarComputer for month/day computation with plan data.
 * Provides reactive calendar state for the calendar tab.
 *
 * Usage:
 *   const { calendarDays, computeMonth, computeDay } = useCalendar(calendarComputer, plan, days);
 */

import { useState, useCallback } from "react";
import type {
  CalendarComputer,
  CalendarDay,
  TrainingPlan,
  TrainingDay,
} from "../types";

export interface UseCalendarResult {
  /** Calendar days for the currently loaded month */
  calendarDays: CalendarDay[];
  /** Compute all days for a given month */
  computeMonth: (year: number, month: number) => Promise<void>;
  /** Compute a single day */
  computeDay: (date: string) => Promise<CalendarDay>;
  /** Get today's plan */
  getTodayPlan: () => Promise<CalendarDay>;
  /** Skip a training day */
  skipTrainingDay: (date: string) => Promise<void>;
  /** Unskip a training day */
  unskipTrainingDay: (date: string) => Promise<void>;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook for calendar computation.
 */
export function useCalendar(
  calendarComputer: CalendarComputer,
  plan: TrainingPlan | null,
  days: TrainingDay[],
): UseCalendarResult {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const computeMonth = useCallback(
    async (year: number, month: number) => {
      if (!plan) {
        setCalendarDays([]);
        return;
      }
      setIsLoading(true);
      try {
        const result = await calendarComputer.computeMonth(
          year,
          month,
          plan,
          days,
        );
        setCalendarDays(result);
      } finally {
        setIsLoading(false);
      }
    },
    [calendarComputer, plan, days],
  );

  const computeDay = useCallback(
    async (date: string) => {
      if (!plan) {
        throw new Error("No active plan");
      }
      return calendarComputer.computeDay(date, plan, days);
    },
    [calendarComputer, plan, days],
  );

  const getTodayPlan = useCallback(async () => {
    if (!plan) {
      throw new Error("No active plan");
    }
    return calendarComputer.getTodayPlan(plan, days);
  }, [calendarComputer, plan, days]);

  const skipTrainingDay = useCallback(
    async (date: string) => {
      if (!plan) return;
      await calendarComputer.skipTrainingDay(date, plan.biz_key);
    },
    [calendarComputer, plan],
  );

  const unskipTrainingDay = useCallback(
    async (date: string) => {
      if (!plan) return;
      await calendarComputer.unskipTrainingDay(date, plan.biz_key);
    },
    [calendarComputer, plan],
  );

  return {
    calendarDays,
    computeMonth,
    computeDay,
    getTodayPlan,
    skipTrainingDay,
    unskipTrainingDay,
    isLoading,
  };
}
