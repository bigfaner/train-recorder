/**
 * useTimer hook
 *
 * Exposes timerStore state + formatted display time.
 * Components use this hook for real-time timer display.
 *
 * Usage:
 *   const { isActive, remainingSeconds, displayTime, start, pause } = useTimer(store);
 */

import { useStore } from "zustand";
import type { TimerStore } from "../stores/timer.store";

/**
 * Format remaining seconds to MM:SS display string.
 */
export function formatDisplayTime(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export interface UseTimerResult {
  // State
  isActive: boolean;
  remainingSeconds: number;
  totalDuration: number;
  exerciseBizKey: bigint | null;
  isPaused: boolean;

  // Computed
  displayTime: string;

  // Actions
  start: TimerStore["start"];
  pause: TimerStore["pause"];
  resume: TimerStore["resume"];
  skip: TimerStore["skip"];
  adjust: TimerStore["adjust"];
  recoverState: TimerStore["recoverState"];
  persistState: TimerStore["persistState"];
}

/**
 * Hook to access timer store state and actions.
 */
export function useTimer(
  store: ReturnType<typeof import("../stores/timer.store").createTimerStore>,
): UseTimerResult {
  const state = useStore(store);

  return {
    isActive: state.isActive,
    remainingSeconds: state.remainingSeconds,
    totalDuration: state.totalDuration,
    exerciseBizKey: state.exerciseBizKey,
    isPaused: state.isPaused,
    displayTime: formatDisplayTime(state.remainingSeconds),
    start: state.start,
    pause: state.pause,
    resume: state.resume,
    skip: state.skip,
    adjust: state.adjust,
    recoverState: state.recoverState,
    persistState: state.persistState,
  };
}
