/**
 * Unit tests for TimerStore.
 * Tests timer state transitions via Zustand store wrapper.
 */

import { createTimerStore } from "../../src/stores/timer.store";
import type { TimerService, TimerState } from "../../src/types";

function createMockTimerService(): TimerService {
  let currentState: TimerState = {
    isActive: false,
    remainingSeconds: 0,
    totalDuration: 0,
    startedAt: null,
    exerciseBizKey: null,
  };

  return {
    start: jest.fn((duration: number, exerciseBizKey?: bigint) => {
      currentState = {
        isActive: true,
        remainingSeconds: duration,
        totalDuration: duration,
        startedAt: Date.now(),
        exerciseBizKey: exerciseBizKey ?? null,
      };
    }),
    pause: jest.fn(() => {
      currentState = { ...currentState, isActive: false };
    }),
    resume: jest.fn(() => {
      currentState = { ...currentState, isActive: true };
    }),
    skip: jest.fn(() => {
      currentState = {
        isActive: false,
        remainingSeconds: 0,
        totalDuration: 0,
        startedAt: null,
        exerciseBizKey: null,
      };
    }),
    adjust: jest.fn((delta: number) => {
      currentState = {
        ...currentState,
        remainingSeconds: Math.max(0, currentState.remainingSeconds + delta),
        totalDuration: currentState.totalDuration + delta,
      };
    }),
    getState: jest.fn(() => ({ ...currentState })),
    persistState: jest.fn(async () => {}),
    recoverState: jest.fn(async () => null),
    onTick: jest.fn(() => () => {}),
    onComplete: jest.fn(() => () => {}),
  };
}

describe("TimerStore", () => {
  let timerService: TimerService;
  let store: ReturnType<typeof createTimerStore>;

  beforeEach(() => {
    timerService = createMockTimerService();
    store = createTimerStore({ timerService });
  });

  describe("initial state", () => {
    it("should start inactive", () => {
      const state = store.getState();
      expect(state.isActive).toBe(false);
      expect(state.remainingSeconds).toBe(0);
      expect(state.totalDuration).toBe(0);
      expect(state.exerciseBizKey).toBeNull();
      expect(state.isPaused).toBe(false);
    });
  });

  describe("start", () => {
    it("should set isActive=true with correct duration", () => {
      store.getState().start(90, 1001n);

      const state = store.getState();
      expect(state.isActive).toBe(true);
      expect(state.remainingSeconds).toBe(90);
      expect(state.totalDuration).toBe(90);
      expect(state.exerciseBizKey).toBe(1001n);
      expect(state.isPaused).toBe(false);
      expect(timerService.start).toHaveBeenCalledWith(90, 1001n);
    });

    it("should work without exerciseBizKey", () => {
      store.getState().start(60);

      expect(store.getState().exerciseBizKey).toBeNull();
    });
  });

  describe("pause", () => {
    it("should set isPaused=true and isActive=false", () => {
      store.getState().start(90);
      store.getState().pause();

      const state = store.getState();
      expect(state.isPaused).toBe(true);
      expect(state.isActive).toBe(false);
      expect(timerService.pause).toHaveBeenCalled();
    });
  });

  describe("resume", () => {
    it("should set isActive=true and isPaused=false", () => {
      store.getState().start(90);
      store.getState().pause();
      store.getState().resume();

      const state = store.getState();
      expect(state.isActive).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(timerService.resume).toHaveBeenCalled();
    });
  });

  describe("skip", () => {
    it("should reset to initial state", () => {
      store.getState().start(90, 1001n);
      store.getState().skip();

      const state = store.getState();
      expect(state.isActive).toBe(false);
      expect(state.remainingSeconds).toBe(0);
      expect(state.totalDuration).toBe(0);
      expect(state.exerciseBizKey).toBeNull();
      expect(state.isPaused).toBe(false);
    });
  });

  describe("adjust", () => {
    it("should update remaining seconds and total duration", () => {
      store.getState().start(90);
      store.getState().adjust(30);

      const state = store.getState();
      expect(state.remainingSeconds).toBe(120);
      expect(state.totalDuration).toBe(120);
      expect(timerService.adjust).toHaveBeenCalledWith(30);
    });

    it("should handle negative delta", () => {
      store.getState().start(90);
      store.getState().adjust(-30);

      const state = store.getState();
      expect(state.remainingSeconds).toBe(60);
      expect(state.totalDuration).toBe(60);
    });
  });

  describe("recoverState", () => {
    it("should restore state from timer service", async () => {
      (timerService.recoverState as jest.Mock).mockResolvedValue({
        isActive: true,
        remainingSeconds: 45,
        totalDuration: 90,
        startedAt: Date.now(),
        exerciseBizKey: 1001n,
      });

      await store.getState().recoverState();

      const state = store.getState();
      expect(state.isActive).toBe(true);
      expect(state.remainingSeconds).toBe(45);
      expect(state.totalDuration).toBe(90);
      expect(state.exerciseBizKey).toBe(1001n);
    });

    it("should reset to initial state when no state to recover", async () => {
      store.getState().start(90);
      (timerService.recoverState as jest.Mock).mockResolvedValue(null);

      await store.getState().recoverState();

      const state = store.getState();
      expect(state.isActive).toBe(false);
      expect(state.remainingSeconds).toBe(0);
    });

    it("should handle recovery errors gracefully", async () => {
      (timerService.recoverState as jest.Mock).mockRejectedValue(
        new Error("Recovery failed"),
      );

      await store.getState().recoverState();

      const state = store.getState();
      expect(state.isActive).toBe(false);
      expect(state.remainingSeconds).toBe(0);
    });
  });

  describe("persistState", () => {
    it("should delegate to timer service", async () => {
      await store.getState().persistState();
      expect(timerService.persistState).toHaveBeenCalled();
    });
  });
});
