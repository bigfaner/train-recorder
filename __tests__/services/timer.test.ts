/**
 * Unit tests for TimerService.
 * Tests timer state transitions, timestamp-based countdown,
 * pause/resume, adjust, skip, persistState, and recoverState.
 *
 * Uses vi (jest) fake timers to control Date.now() and setInterval.
 */

import {
  createTimerService,
  type TimerServiceImpl,
} from "../../src/services/timer";
import type { UserSettingsRepo } from "../../src/db/repositories/user-settings.repo";

// ============================================================
// Mock UserSettingsRepo
// ============================================================

function createMockUserSettingsRepo(): jest.Mocked<UserSettingsRepo> {
  const store = new Map<string, string>();

  return {
    getValue: jest.fn((key: string) => store.get(key) ?? null),
    setValue: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return {
        id: 1,
        biz_key: 1n,
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      };
    }),
    // Base repo methods - not used but needed for interface
    findById: jest.fn(),
    findByBizKey: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<UserSettingsRepo>;
}

// ============================================================
// Helpers
// ============================================================

describe("TimerService", () => {
  let timerService: TimerServiceImpl;
  let mockRepo: jest.Mocked<UserSettingsRepo>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockRepo = createMockUserSettingsRepo();
    timerService = createTimerService(mockRepo);
  });

  afterEach(() => {
    timerService.destroy();
    jest.useRealTimers();
  });

  // ============================================================
  // start(durationSeconds)
  // ============================================================

  describe("start", () => {
    it("should start a countdown with isActive=true", () => {
      timerService.start(60);

      const state = timerService.getState();
      expect(state.isActive).toBe(true);
      expect(state.totalDuration).toBe(60);
      expect(state.remainingSeconds).toBe(60);
      expect(state.startedAt).toBe(Date.now());
    });

    it("should accept exerciseBizKey parameter", () => {
      timerService.start(90, 12345n);

      const state = timerService.getState();
      expect(state.exerciseBizKey).toBe(12345n);
    });

    it("should reset previous timer when starting a new one", () => {
      timerService.start(60);
      jest.advanceTimersByTime(30000);

      timerService.start(120);

      const state = timerService.getState();
      expect(state.totalDuration).toBe(120);
      expect(state.remainingSeconds).toBe(120);
      expect(state.isActive).toBe(true);
    });

    it("should throw TimerError for non-positive duration", () => {
      expect(() => timerService.start(0)).toThrow();
      expect(() => timerService.start(-10)).toThrow();
    });
  });

  // ============================================================
  // Timestamp-based countdown: remaining = totalDuration - (now - startedAt) / 1000
  // ============================================================

  describe("timestamp-based countdown", () => {
    it("should compute remaining time based on elapsed real time", () => {
      timerService.start(60);

      jest.advanceTimersByTime(10000);

      const state = timerService.getState();
      expect(state.remainingSeconds).toBe(50);
    });

    it("should count down to 0 via onTick callbacks", () => {
      const tickCallback = jest.fn();
      timerService.onTick(tickCallback);

      timerService.start(5);
      jest.advanceTimersByTime(5000);

      // Should have ticked multiple times, final remaining = 0
      const lastTick =
        tickCallback.mock.calls[tickCallback.mock.calls.length - 1];
      expect(lastTick[0]).toBe(0);
    });

    it("should fire onComplete when timer reaches 0", () => {
      const completeCallback = jest.fn();
      timerService.onComplete(completeCallback);

      timerService.start(5);
      jest.advanceTimersByTime(5000);

      expect(completeCallback).toHaveBeenCalledTimes(1);
    });

    it("should set isActive=false after completion", () => {
      timerService.start(3);
      jest.advanceTimersByTime(3000);

      expect(timerService.getState().isActive).toBe(false);
      expect(timerService.getState().remainingSeconds).toBe(0);
    });
  });

  // ============================================================
  // pause() / resume()
  // ============================================================

  describe("pause", () => {
    it("should pause the timer and stop countdown", () => {
      timerService.start(60);
      jest.advanceTimersByTime(10000);

      timerService.pause();

      const stateAtPause = timerService.getState();
      expect(stateAtPause.isActive).toBe(false);
      expect(stateAtPause.remainingSeconds).toBe(50);

      // Advance more time - remaining should not change
      jest.advanceTimersByTime(10000);
      expect(timerService.getState().remainingSeconds).toBe(50);
    });

    it("should not throw if no timer is active", () => {
      expect(() => timerService.pause()).not.toThrow();
    });
  });

  describe("resume", () => {
    it("should resume a paused timer from where it left off", () => {
      timerService.start(60);
      jest.advanceTimersByTime(10000);
      timerService.pause();

      // Resume
      timerService.resume();
      expect(timerService.getState().isActive).toBe(true);

      jest.advanceTimersByTime(5000);
      expect(timerService.getState().remainingSeconds).toBe(45);
    });

    it("should not throw if no timer is paused", () => {
      expect(() => timerService.resume()).not.toThrow();
    });

    it("should resume with correct remaining after long pause", () => {
      timerService.start(60);
      jest.advanceTimersByTime(10000);
      timerService.pause();

      // Simulate a long pause (real time passes but timer is paused)
      jest.advanceTimersByTime(60000);

      timerService.resume();
      // After resume, remaining should continue from 50
      jest.advanceTimersByTime(5000);
      expect(timerService.getState().remainingSeconds).toBe(45);
    });
  });

  // ============================================================
  // skip()
  // ============================================================

  describe("skip", () => {
    it("should immediately complete the timer", () => {
      const completeCallback = jest.fn();
      timerService.onComplete(completeCallback);

      timerService.start(60);
      jest.advanceTimersByTime(10000);

      timerService.skip();

      expect(timerService.getState().isActive).toBe(false);
      expect(timerService.getState().remainingSeconds).toBe(0);
      expect(completeCallback).toHaveBeenCalled();
    });

    it("should not throw if no timer is active", () => {
      expect(() => timerService.skip()).not.toThrow();
    });
  });

  // ============================================================
  // adjust(deltaSeconds)
  // ============================================================

  describe("adjust", () => {
    it("should extend the remaining time with positive delta", () => {
      timerService.start(60);
      jest.advanceTimersByTime(10000);

      timerService.adjust(30);

      // remaining was 50, now should be 80
      expect(timerService.getState().remainingSeconds).toBe(80);
      expect(timerService.getState().totalDuration).toBe(90);
    });

    it("should shorten the remaining time with negative delta", () => {
      timerService.start(60);
      jest.advanceTimersByTime(10000);

      timerService.adjust(-20);

      // remaining was 50, now should be 30
      expect(timerService.getState().remainingSeconds).toBe(30);
      expect(timerService.getState().totalDuration).toBe(40);
    });

    it("should clamp adjust so remaining does not go below 0", () => {
      timerService.start(60);
      jest.advanceTimersByTime(10000);

      timerService.adjust(-100);

      // remaining was 50, trying to subtract 100 -> clamped to 1
      expect(timerService.getState().remainingSeconds).toBe(1);
    });

    it("should throw if no timer is active", () => {
      expect(() => timerService.adjust(10)).toThrow();
    });
  });

  // ============================================================
  // onTick / onComplete callbacks
  // ============================================================

  describe("onTick", () => {
    it("should return unsubscribe function", () => {
      const tickCallback = jest.fn();
      const unsubscribe = timerService.onTick(tickCallback);

      timerService.start(10);
      jest.advanceTimersByTime(1000);

      expect(tickCallback).toHaveBeenCalled();

      tickCallback.mockClear();
      unsubscribe();

      jest.advanceTimersByTime(2000);
      expect(tickCallback).not.toHaveBeenCalled();
    });
  });

  describe("onComplete", () => {
    it("should return unsubscribe function", () => {
      const completeCallback = jest.fn();
      const unsubscribe = timerService.onComplete(completeCallback);

      timerService.start(3);
      jest.advanceTimersByTime(3000);

      expect(completeCallback).toHaveBeenCalledTimes(1);

      completeCallback.mockClear();
      unsubscribe();

      timerService.start(3);
      jest.advanceTimersByTime(3000);

      expect(completeCallback).not.toHaveBeenCalled();
    });

    it("should support multiple onComplete callbacks", () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      timerService.onComplete(cb1);
      timerService.onComplete(cb2);

      timerService.start(3);
      jest.advanceTimersByTime(3000);

      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });
  });

  // ============================================================
  // getState()
  // ============================================================

  describe("getState", () => {
    it("should return initial idle state", () => {
      const state = timerService.getState();
      expect(state.isActive).toBe(false);
      expect(state.remainingSeconds).toBe(0);
      expect(state.totalDuration).toBe(0);
      expect(state.startedAt).toBeNull();
      expect(state.exerciseBizKey).toBeNull();
    });
  });

  // ============================================================
  // persistState()
  // ============================================================

  describe("persistState", () => {
    it("should save timer state to user_settings with key 'active_timer_state'", async () => {
      timerService.start(60, 12345n);
      jest.advanceTimersByTime(10000);

      await timerService.persistState();

      expect(mockRepo.setValue).toHaveBeenCalledWith(
        "active_timer_state",
        expect.any(String),
      );

      const savedJson = mockRepo.setValue.mock.calls[0][1];
      const saved = JSON.parse(savedJson);
      expect(saved.totalDuration).toBe(60);
      expect(saved.exerciseBizKey).toBe("12345");
      expect(saved.startedAt).toBe(Date.now() - 10000);
    });

    it("should save null startedAt when timer is idle", async () => {
      await timerService.persistState();

      expect(mockRepo.setValue).toHaveBeenCalledWith(
        "active_timer_state",
        expect.any(String),
      );

      const savedJson = mockRepo.setValue.mock.calls[0][1];
      const saved = JSON.parse(savedJson);
      expect(saved.startedAt).toBeNull();
    });

    it("should persist paused state with pausedAt timestamp", async () => {
      timerService.start(60);
      jest.advanceTimersByTime(10000);
      timerService.pause();

      await timerService.persistState();

      const savedJson = mockRepo.setValue.mock.calls[0][1];
      const saved = JSON.parse(savedJson);
      expect(saved.isPaused).toBe(true);
      expect(saved.remainingAtPause).toBe(50);
    });
  });

  // ============================================================
  // recoverState()
  // ============================================================

  describe("recoverState", () => {
    it("should return null when no persisted state exists", async () => {
      mockRepo.getValue = jest.fn().mockReturnValue(null);

      const state = await timerService.recoverState();

      expect(state).toBeNull();
    });

    it("should recover active timer and compute remaining time", async () => {
      const startedAt = Date.now() - 10000; // started 10s ago
      mockRepo.getValue = jest.fn().mockReturnValue(
        JSON.stringify({
          startedAt,
          totalDuration: 60,
          exerciseBizKey: "12345",
          isPaused: false,
          remainingAtPause: null,
        }),
      );

      const state = await timerService.recoverState();

      expect(state).not.toBeNull();
      expect(state!.isActive).toBe(true);
      expect(state!.totalDuration).toBe(60);
      expect(state!.remainingSeconds).toBe(50);
      expect(state!.exerciseBizKey).toBe(12345n);
    });

    it("should return completed state when elapsed exceeds totalDuration", async () => {
      const startedAt = Date.now() - 120000; // started 120s ago
      mockRepo.getValue = jest.fn().mockReturnValue(
        JSON.stringify({
          startedAt,
          totalDuration: 60,
          exerciseBizKey: null,
          isPaused: false,
          remainingAtPause: null,
        }),
      );

      const completeCallback = jest.fn();
      timerService.onComplete(completeCallback);

      const state = await timerService.recoverState();

      // Timer already completed
      expect(state).not.toBeNull();
      expect(state!.isActive).toBe(false);
      expect(state!.remainingSeconds).toBe(0);
      // onComplete should fire to indicate "rest time has passed"
      expect(completeCallback).toHaveBeenCalled();
    });

    it("should recover paused timer with remainingAtPause", async () => {
      mockRepo.getValue = jest.fn().mockReturnValue(
        JSON.stringify({
          startedAt: Date.now() - 100000,
          totalDuration: 60,
          exerciseBizKey: null,
          isPaused: true,
          remainingAtPause: 30,
        }),
      );

      const state = await timerService.recoverState();

      expect(state).not.toBeNull();
      expect(state!.isActive).toBe(true);
      expect(state!.remainingSeconds).toBe(30);
    });

    it("should clear persisted state after recovery", async () => {
      mockRepo.getValue = jest.fn().mockReturnValue(
        JSON.stringify({
          startedAt: Date.now() - 10000,
          totalDuration: 60,
          exerciseBizKey: null,
          isPaused: false,
          remainingAtPause: null,
        }),
      );

      await timerService.recoverState();

      // Should clear the persisted state (set to null-like or clear)
      expect(mockRepo.setValue).toHaveBeenCalledWith(
        "active_timer_state",
        expect.any(String),
      );
    });

    it("should handle corrupt persisted state gracefully", async () => {
      mockRepo.getValue = jest.fn().mockReturnValue("not-json");

      const state = await timerService.recoverState();

      expect(state).toBeNull();
    });
  });

  // ============================================================
  // Full lifecycle: start -> tick -> pause -> resume -> complete
  // ============================================================

  describe("full lifecycle", () => {
    it("start -> tick -> pause -> resume -> complete", () => {
      const ticks: number[] = [];
      timerService.onTick((remaining) => ticks.push(remaining));
      const completeCallback = jest.fn();
      timerService.onComplete(completeCallback);

      // Start 10s timer
      timerService.start(10);
      expect(timerService.getState().remainingSeconds).toBe(10);

      // 3s pass
      jest.advanceTimersByTime(3000);
      expect(timerService.getState().remainingSeconds).toBe(7);

      // Pause at 7s remaining
      timerService.pause();
      expect(timerService.getState().remainingSeconds).toBe(7);
      expect(timerService.getState().isActive).toBe(false);

      // Time passes while paused (should not affect)
      jest.advanceTimersByTime(5000);
      expect(timerService.getState().remainingSeconds).toBe(7);

      // Resume
      timerService.resume();
      expect(timerService.getState().isActive).toBe(true);

      // Remaining 7s pass
      jest.advanceTimersByTime(7000);

      expect(timerService.getState().isActive).toBe(false);
      expect(timerService.getState().remainingSeconds).toBe(0);
      expect(completeCallback).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // destroy()
  // ============================================================

  describe("destroy", () => {
    it("should stop all timers and clear callbacks", () => {
      const tickCallback = jest.fn();
      timerService.onTick(tickCallback);

      timerService.start(60);
      timerService.destroy();

      jest.advanceTimersByTime(5000);
      expect(tickCallback).not.toHaveBeenCalled();

      expect(timerService.getState().isActive).toBe(false);
    });
  });
});
