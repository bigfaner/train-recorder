/**
 * Calendar Screen (Tab 1)
 *
 * Training calendar with month-view grid, training type indicators,
 * day detail card, and training start flow.
 *
 * Uses useCalendar hook for data and CalendarComputer for computation.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing } from "@utils/constants";
import type { CalendarDay, TrainingPlan, TrainingDay } from "../../src/types";
import {
  CalendarMonthGrid,
  CalendarMonthHeader,
  CalendarFilterTabs,
  CalendarDetailCard,
  EmptyCalendar,
} from "../../src/components/calendar";
import type { FilterType } from "../../src/components/calendar/CalendarFilterTabs";
import { getTodayISO, parseISODate } from "../../src/utils/date";
import { getDatabase } from "../../src/db/database";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import { createTrainingPlanRepo } from "../../src/db/repositories/training-plan.repo";
import { createTrainingDayRepo } from "../../src/db/repositories/training-day.repo";
import { createWorkoutSessionRepo } from "../../src/db/repositories/workout-session.repo";

function getDbAdapter(): DatabaseAdapter {
  return getDatabase() as unknown as DatabaseAdapter;
}

/**
 * Build CalendarDay[] for a given month from DB data.
 */
function buildCalendarDays(
  year: number,
  month: number,
  plan: TrainingPlan,
  trainingDays: TrainingDay[],
): CalendarDay[] {
  const db = getDbAdapter();
  const sessionRepo = createWorkoutSessionRepo(db);
  const todayStr = getTodayISO();

  // Build weekday -> training type map from plan's weekly_config
  const weeklyConfig: Record<string, string | null> = (() => {
    try {
      return plan.weekly_config ? JSON.parse(plan.weekly_config) : {};
    } catch {
      return {};
    }
  })();

  // Get total days in month
  const totalDays = new Date(year, month, 0).getDate();
  const days: CalendarDay[] = [];

  // Get sessions for this month range
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(totalDays).padStart(2, "0")}`;
  const sessions = sessionRepo.findByDateRange(startDate, endDate);

  // Build session map by date
  const sessionMap = new Map<string, (typeof sessions)[0]>();
  for (const s of sessions) {
    sessionMap.set(s.session_date, s);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    // Convert Sunday=0 to ISO weekday (Mon=1...Sun=7)
    const isoWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;

    const session = sessionMap.get(dateStr) ?? null;
    const trainingType = weeklyConfig[String(isoWeekday)] ?? null;

    // Find matching training day
    const matchingDay = trainingType
      ? (trainingDays.find((td) => td.training_type === trainingType) ?? null)
      : null;

    // Determine day type
    let dayType: CalendarDay["dayType"] = "rest";
    const isSkipped = false;

    if (session) {
      if (session.session_status === "completed") {
        dayType = "completed";
      } else if (session.session_status === "completed_partial") {
        dayType = "completed_partial";
      }
    } else if (trainingType) {
      dayType = "training";
    }

    // Check if past training day was skipped
    if (trainingType && !session && dateStr < todayStr) {
      // A training day in the past without a session could be considered skipped
      // but for now we leave it as "training" (the UI shows "补录训练")
    }

    days.push({
      date: dateStr,
      trainingDay: matchingDay
        ? {
            ...matchingDay,
            training_type: trainingType as "push" | "pull" | "legs" | "custom",
          }
        : null,
      workoutSession: session,
      otherSport: null,
      isSkipped,
      consecutiveSkips: 0,
      dayType,
    });
  }

  return days;
}

export default function CalendarScreen() {
  const router = useRouter();

  // Current viewed month (defaults to today)
  const today = useMemo(() => parseISODate(getTodayISO()), []);
  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);

  // Selected date for detail card
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter type
  const [filterType, setFilterType] = useState<FilterType>(null);

  // Load plan and calendar data from DB
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load plan on mount
  useEffect(() => {
    try {
      const db = getDbAdapter();
      const planRepo = createTrainingPlanRepo(db);
      const dayRepo = createTrainingDayRepo(db);

      const activePlan = planRepo.findActive();
      if (activePlan) {
        setPlan(activePlan);
        const days = dayRepo.findByPlanBizKey(activePlan.biz_key);
        setTrainingDays(days);
      }
    } catch {
      // DB not available (e.g. during SSR or before DB init)
    }
    setIsLoading(false);
  }, []);

  // Load calendar days when month changes or plan loads
  useEffect(() => {
    if (plan) {
      const days = buildCalendarDays(viewYear, viewMonth, plan, trainingDays);
      setCalendarDays(days);
    }
  }, [viewYear, viewMonth, plan, trainingDays]);

  // Month navigation
  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [viewMonth]);

  // Date selection
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  }, []);

  // Get selected calendar day
  const selectedDay = useMemo(() => {
    if (!selectedDate) return null;
    return calendarDays.find((d) => d.date === selectedDate) ?? null;
  }, [selectedDate, calendarDays]);

  // Navigation handlers
  const handleStartWorkout = useCallback(
    (date: string) => {
      router.push({
        pathname: "/workout",
        params: { date },
      });
    },
    [router],
  );

  const handleRecordOtherSport = useCallback(
    (date: string) => {
      router.push({
        pathname: "/other-sport",
        params: { date },
      });
    },
    [router],
  );

  const handleBacklogWorkout = useCallback(
    (date: string) => {
      router.push({
        pathname: "/workout",
        params: { date, backlog: "true" },
      });
    },
    [router],
  );

  const handleCreatePlan = useCallback(() => {
    router.push("/plan-editor");
  }, [router]);

  const handleSkipDay = useCallback(async (date: string) => {
    Alert.alert("跳过训练", "确定要跳过这一天的训练吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "确定",
        style: "destructive",
        onPress: () => {
          // Mark as skipped in calendar days
          setCalendarDays((prev) =>
            prev.map((d) =>
              d.date === date
                ? { ...d, isSkipped: true, dayType: "skipped" as const }
                : d,
            ),
          );
        },
      },
    ]);
  }, []);

  const handleUnskipDay = useCallback(async (date: string) => {
    setCalendarDays((prev) =>
      prev.map((d) =>
        d.date === date
          ? {
              ...d,
              isSkipped: false,
              dayType: d.trainingDay
                ? ("training" as const)
                : ("rest" as const),
            }
          : d,
      ),
    );
  }, []);

  // No plan - show empty state
  if (!plan) {
    return (
      <View style={styles.container}>
        <EmptyCalendar onCreatePlan={handleCreatePlan} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month header with navigation */}
      <CalendarMonthHeader
        year={viewYear}
        month={viewMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Training type filter tabs */}
      <CalendarFilterTabs
        activeFilter={filterType}
        onFilterChange={setFilterType}
      />

      {/* Month grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <CalendarMonthGrid
          year={viewYear}
          month={viewMonth}
          calendarDays={calendarDays}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          filterType={filterType}
        />
      )}

      {/* Detail card for selected date */}
      <CalendarDetailCard
        calendarDay={selectedDay}
        onStartWorkout={handleStartWorkout}
        onRecordOtherSport={handleRecordOtherSport}
        onBacklogWorkout={handleBacklogWorkout}
        onSkipDay={handleSkipDay}
        onUnskipDay={handleUnskipDay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.contentPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
