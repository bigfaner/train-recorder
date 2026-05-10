/**
 * TimerService implementation.
 *
 * Provides a timestamp-based countdown timer that works reliably
 * across app lifecycle (foreground, background, force-close recovery).
 *
 * Key design decisions:
 * - Uses Date.now() timestamps (not relative countdown) for reliability
 * - remaining = totalDuration - (now - startedAt) / 1000
 * - persistState() saves to user_settings with key 'active_timer_state'
 * - recoverState() restores from persisted state, computes elapsed time
 *
 * Background support:
 * - expo-background-fetch keeps timer alive when app is backgrounded
 * - expo-notifications schedules local notification on timer completion
 * - These are handled at the integration layer; this service provides
 *   the core timer logic that those integrations consume.
 */

import type { TimerState, TimerService } from "../types";
import { TimerError } from "../types";
import type { UserSettingsRepo } from "../db/repositories/user-settings.repo";

const TICK_INTERVAL_MS = 1000;
const PERSIST_KEY = "active_timer_state";

type TimerPhase = "idle" | "running" | "paused";

interface InternalState {
  phase: TimerPhase;
  startedAt: number | null; // Date.now() when timer was started
  totalDuration: number;
  remainingSeconds: number;
  exerciseBizKey: bigint | null;
  pausedAtRemaining: number | null; // remaining seconds when paused
  pausedAtTimestamp: number | null; // Date.now() when paused (for resume calculation)
}

interface PersistedTimerState {
  startedAt: number | null;
  totalDuration: number;
  exerciseBizKey: string | null; // BigInt serialized as string
  isPaused: boolean;
  remainingAtPause: number | null; // remaining seconds when paused
}

export interface TimerServiceImpl extends TimerService {
  destroy(): void;
}

export function createTimerService(
  userSettingsRepo: UserSettingsRepo,
): TimerServiceImpl {
  let internal: InternalState = {
    phase: "idle",
    startedAt: null,
    totalDuration: 0,
    remainingSeconds: 0,
    exerciseBizKey: null,
    pausedAtRemaining: null,
    pausedAtTimestamp: null,
  };

  let tickInterval: ReturnType<typeof setInterval> | null = null;
  const tickCallbacks: Set<(remaining: number) => void> = new Set();
  const completeCallbacks: Set<() => void> = new Set();

  // ============================================================
  // Private helpers
  // ============================================================

  function computeRemaining(): number {
    if (internal.phase === "paused" && internal.pausedAtRemaining !== null) {
      return internal.pausedAtRemaining;
    }
    if (internal.startedAt === null) {
      return internal.remainingSeconds;
    }
    const elapsed = (Date.now() - internal.startedAt) / 1000;
    const remaining = internal.totalDuration - elapsed;
    return Math.max(0, remaining);
  }

  function startTickInterval(): void {
    stopTickInterval();
    tickInterval = setInterval(() => {
      const remaining = computeRemaining();
      internal.remainingSeconds = remaining;

      // Notify tick callbacks
      for (const cb of tickCallbacks) {
        cb(remaining);
      }

      // Timer completed
      if (remaining <= 0) {
        internal.phase = "idle";
        internal.startedAt = null;
        internal.remainingSeconds = 0;
        stopTickInterval();
        for (const cb of completeCallbacks) {
          cb();
        }
      }
    }, TICK_INTERVAL_MS);
  }

  function stopTickInterval(): void {
    if (tickInterval !== null) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  function toPublicState(): TimerState {
    return {
      isActive: internal.phase === "running",
      remainingSeconds: Math.round(computeRemaining()),
      totalDuration: internal.totalDuration,
      startedAt: internal.startedAt,
      exerciseBizKey: internal.exerciseBizKey,
    };
  }

  // ============================================================
  // Public API
  // ============================================================

  function start(durationSeconds: number, exerciseBizKey?: bigint): void {
    if (durationSeconds <= 0) {
      throw new TimerError("Timer duration must be positive");
    }

    // Stop any existing timer
    stopTickInterval();

    const now = Date.now();
    internal = {
      phase: "running",
      startedAt: now,
      totalDuration: durationSeconds,
      remainingSeconds: durationSeconds,
      exerciseBizKey: exerciseBizKey ?? null,
      pausedAtRemaining: null,
      pausedAtTimestamp: null,
    };

    startTickInterval();
  }

  function pause(): void {
    if (internal.phase !== "running") {
      return;
    }

    const remaining = computeRemaining();
    internal.phase = "paused";
    internal.pausedAtRemaining = remaining;
    internal.pausedAtTimestamp = Date.now();
    internal.remainingSeconds = remaining;
    stopTickInterval();
  }

  function resume(): void {
    if (internal.phase !== "paused") {
      return;
    }

    // When resuming, recalculate startedAt so that remaining = pausedAtRemaining
    // remaining = totalDuration - (now - startedAt) / 1000 = pausedAtRemaining
    // => startedAt = now - (totalDuration - pausedAtRemaining) * 1000
    const pausedRemaining = internal.pausedAtRemaining ?? 0;
    const now = Date.now();
    internal.startedAt =
      now - (internal.totalDuration - pausedRemaining) * 1000;
    internal.phase = "running";
    internal.pausedAtRemaining = null;
    internal.pausedAtTimestamp = null;
    internal.remainingSeconds = pausedRemaining;

    startTickInterval();
  }

  function skip(): void {
    if (internal.phase === "idle") {
      return;
    }

    internal.phase = "idle";
    internal.startedAt = null;
    internal.remainingSeconds = 0;
    internal.pausedAtRemaining = null;
    internal.pausedAtTimestamp = null;
    stopTickInterval();

    for (const cb of completeCallbacks) {
      cb();
    }
  }

  function adjust(deltaSeconds: number): void {
    if (internal.phase === "idle") {
      throw new TimerError("No active timer to adjust");
    }

    const currentRemaining = computeRemaining();
    const newRemaining = currentRemaining + deltaSeconds;

    if (newRemaining <= 0) {
      // Clamp to 1 second minimum remaining
      const clampedRemaining = 1;
      const elapsed = internal.totalDuration - currentRemaining;
      internal.totalDuration = elapsed + clampedRemaining;
      internal.startedAt = Date.now() - elapsed * 1000;
      internal.remainingSeconds = clampedRemaining;
      if (internal.phase === "paused") {
        internal.pausedAtRemaining = clampedRemaining;
      }
    } else {
      const elapsed = internal.totalDuration - currentRemaining;
      internal.totalDuration = elapsed + newRemaining;
      // Adjust startedAt to reflect new totalDuration
      internal.startedAt = Date.now() - elapsed * 1000;
      internal.remainingSeconds = newRemaining;
      if (internal.phase === "paused") {
        internal.pausedAtRemaining = newRemaining;
      }
    }
  }

  function getState(): TimerState {
    return toPublicState();
  }

  async function persistState(): Promise<void> {
    const persisted: PersistedTimerState = {
      startedAt: internal.startedAt,
      totalDuration: internal.totalDuration,
      exerciseBizKey: internal.exerciseBizKey?.toString() ?? null,
      isPaused: internal.phase === "paused",
      remainingAtPause:
        internal.phase === "paused" ? internal.pausedAtRemaining : null,
    };

    userSettingsRepo.setValue(PERSIST_KEY, JSON.stringify(persisted));
  }

  async function recoverState(): Promise<TimerState | null> {
    const raw = userSettingsRepo.getValue(PERSIST_KEY);
    if (!raw) {
      return null;
    }

    let persisted: PersistedTimerState;
    try {
      persisted = JSON.parse(raw) as PersistedTimerState;
    } catch {
      // Corrupt state - clear and return null
      userSettingsRepo.setValue(PERSIST_KEY, JSON.stringify(null));
      return null;
    }

    if (!persisted.startedAt && !persisted.isPaused) {
      return null;
    }

    stopTickInterval();

    const now = Date.now();
    const exerciseBizKey = persisted.exerciseBizKey
      ? BigInt(persisted.exerciseBizKey)
      : null;

    if (persisted.isPaused && persisted.remainingAtPause !== null) {
      // Timer was paused - resume from paused remaining
      internal = {
        phase: "running",
        startedAt:
          now - (persisted.totalDuration - persisted.remainingAtPause) * 1000,
        totalDuration: persisted.totalDuration,
        remainingSeconds: persisted.remainingAtPause,
        exerciseBizKey,
        pausedAtRemaining: null,
        pausedAtTimestamp: null,
      };
      startTickInterval();

      // Clear persisted state
      userSettingsRepo.setValue(PERSIST_KEY, JSON.stringify(null));

      return toPublicState();
    }

    // Timer was running - compute remaining from timestamp
    if (persisted.startedAt === null) {
      return null;
    }

    const elapsed = (now - persisted.startedAt) / 1000;
    const remaining = persisted.totalDuration - elapsed;

    if (remaining <= 0) {
      // Timer already completed while app was in background / force-closed
      internal = {
        phase: "idle",
        startedAt: null,
        totalDuration: persisted.totalDuration,
        remainingSeconds: 0,
        exerciseBizKey,
        pausedAtRemaining: null,
        pausedAtTimestamp: null,
      };

      // Clear persisted state
      userSettingsRepo.setValue(PERSIST_KEY, JSON.stringify(null));

      // Notify that timer completed (for "rest time has passed" alert)
      for (const cb of completeCallbacks) {
        cb();
      }

      return toPublicState();
    }

    // Timer still running - resume
    internal = {
      phase: "running",
      startedAt: persisted.startedAt,
      totalDuration: persisted.totalDuration,
      remainingSeconds: Math.round(remaining),
      exerciseBizKey,
      pausedAtRemaining: null,
      pausedAtTimestamp: null,
    };

    startTickInterval();

    // Clear persisted state
    userSettingsRepo.setValue(PERSIST_KEY, JSON.stringify(null));

    return toPublicState();
  }

  function onTick(callback: (remaining: number) => void): () => void {
    tickCallbacks.add(callback);
    return () => {
      tickCallbacks.delete(callback);
    };
  }

  function onComplete(callback: () => void): () => void {
    completeCallbacks.add(callback);
    return () => {
      completeCallbacks.delete(callback);
    };
  }

  function destroy(): void {
    stopTickInterval();
    tickCallbacks.clear();
    completeCallbacks.clear();
    internal = {
      phase: "idle",
      startedAt: null,
      totalDuration: 0,
      remainingSeconds: 0,
      exerciseBizKey: null,
      pausedAtRemaining: null,
      pausedAtTimestamp: null,
    };
  }

  return {
    start,
    pause,
    resume,
    skip,
    adjust,
    getState,
    persistState,
    recoverState,
    onTick,
    onComplete,
    destroy,
  };
}
