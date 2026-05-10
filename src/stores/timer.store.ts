/**
 * Timer Store (Zustand)
 *
 * Wraps TimerService with reactive state management.
 * UI components subscribe to this store for real-time timer updates.
 *
 * State:
 *   - isActive: whether timer is currently counting down
 *   - remainingSeconds: seconds left in countdown
 *   - totalDuration: total duration of current timer
 *   - exerciseBizKey: which exercise the timer is for
 *
 * Actions delegate to TimerService and sync state on each tick.
 */

import { create } from "zustand";
import type { TimerService } from "../types";

// ============================================================
// State Shape
// ============================================================

export interface TimerStoreState {
  isActive: boolean;
  remainingSeconds: number;
  totalDuration: number;
  exerciseBizKey: bigint | null;
  isPaused: boolean;
}

export interface TimerStoreActions {
  /** Start a timer for the given duration */
  start(durationSeconds: number, exerciseBizKey?: bigint): void;

  /** Pause the active timer */
  pause(): void;

  /** Resume a paused timer */
  resume(): void;

  /** Skip the timer entirely */
  skip(): void;

  /** Adjust remaining time by delta seconds */
  adjust(deltaSeconds: number): void;

  /** Recover timer state after background/force-close */
  recoverState(): Promise<void>;

  /** Persist timer state for recovery */
  persistState(): Promise<void>;
}

export type TimerStore = TimerStoreState & TimerStoreActions;

// ============================================================
// Dependencies
// ============================================================

export interface TimerStoreDeps {
  timerService: TimerService;
}

// ============================================================
// Default State
// ============================================================

const initialState: TimerStoreState = {
  isActive: false,
  remainingSeconds: 0,
  totalDuration: 0,
  exerciseBizKey: null,
  isPaused: false,
};

// ============================================================
// Store Factory
// ============================================================

export function createTimerStore(deps: TimerStoreDeps) {
  const { timerService } = deps;

  // Register tick callback - placeholder for future real-time sync

  timerService.onTick((_remaining) => {
    // State sync handled by getState() calls in actions
    // For real-time UI, consumers poll or subscribe via the hook
  });

  return create<TimerStore>((set) => ({
    ...initialState,

    start(durationSeconds, exerciseBizKey) {
      timerService.start(durationSeconds, exerciseBizKey);

      const state = timerService.getState();
      set({
        isActive: state.isActive,
        remainingSeconds: state.remainingSeconds,
        totalDuration: state.totalDuration,
        exerciseBizKey: state.exerciseBizKey,
        isPaused: false,
      });
    },

    pause() {
      timerService.pause();
      set({ isPaused: true, isActive: false });
    },

    resume() {
      timerService.resume();
      const state = timerService.getState();
      set({
        isActive: state.isActive,
        remainingSeconds: state.remainingSeconds,
        isPaused: false,
      });
    },

    skip() {
      timerService.skip();
      set(initialState);
    },

    adjust(deltaSeconds) {
      timerService.adjust(deltaSeconds);
      const state = timerService.getState();
      set({
        remainingSeconds: state.remainingSeconds,
        totalDuration: state.totalDuration,
      });
    },

    async recoverState() {
      try {
        const recovered = await timerService.recoverState();
        if (recovered) {
          set({
            isActive: recovered.isActive,
            remainingSeconds: recovered.remainingSeconds,
            totalDuration: recovered.totalDuration,
            exerciseBizKey: recovered.exerciseBizKey,
            isPaused: false,
          });
        } else {
          set(initialState);
        }
      } catch {
        set(initialState);
      }
    },

    async persistState() {
      await timerService.persistState();
    },
  }));
}
