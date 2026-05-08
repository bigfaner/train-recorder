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

// Placeholder hook — the real useCalendar requires DB deps.
// In production, inject via context or a provider.
// For now, this page manages its own state and accepts injected props.
export interface CalendarScreenProps {
  /** Active training plan */
  plan: TrainingPlan | null;
  /** Training days for the plan */
  trainingDays: TrainingDay[];
  /** Calendar computation hook result */
  calendarDays: CalendarDay[];
  /** Compute month callback */
  computeMonth: (year: number, month: number) => Promise<void>;
  /** Skip training day */
  skipTrainingDay: (date: string) => Promise<void>;
  /** Unskip training day */
  unskipTrainingDay: (date: string) => Promise<void>;
  /** Loading state */
  isLoading: boolean;
}

export default function CalendarScreen({
  plan,
  trainingDays: _trainingDays,
  calendarDays,
  computeMonth,
  skipTrainingDay,
  unskipTrainingDay,
  isLoading: isLoadingProp,
}: CalendarScreenProps) {
  const router = useRouter();

  // Current viewed month (defaults to today)
  const today = useMemo(() => parseISODate(getTodayISO()), []);
  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);

  // Selected date for detail card
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter type
  const [filterType, setFilterType] = useState<FilterType>(null);

  // Load calendar data on month change
  useEffect(() => {
    if (plan) {
      computeMonth(viewYear, viewMonth);
    }
  }, [viewYear, viewMonth, plan, computeMonth]);

  // Get selected calendar day
  const selectedDay = useMemo(() => {
    if (!selectedDate) return null;
    return calendarDays.find((d) => d.date === selectedDate) ?? null;
  }, [selectedDate, calendarDays]);

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

  // Skip/Unskip
  const handleSkipDay = useCallback(
    async (date: string) => {
      Alert.alert("跳过训练", "确定要跳过这一天的训练吗？", [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          style: "destructive",
          onPress: async () => {
            await skipTrainingDay(date);
            // Refresh calendar
            computeMonth(viewYear, viewMonth);
          },
        },
      ]);
    },
    [skipTrainingDay, computeMonth, viewYear, viewMonth],
  );

  const handleUnskipDay = useCallback(
    async (date: string) => {
      await unskipTrainingDay(date);
      computeMonth(viewYear, viewMonth);
    },
    [unskipTrainingDay, computeMonth, viewYear, viewMonth],
  );

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
      {isLoadingProp ? (
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
