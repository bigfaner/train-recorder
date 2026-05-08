/**
 * Unit tests for timer panel helpers and component.
 *
 * Tests pure helper logic for:
 * - Timer panel phase determination
 * - Circular progress calculation
 * - Notification text formatting
 * - Timer text color
 * - Next set button visibility
 * - Timer panel visibility
 * - TimerPanel component rendering and exports
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// Mock React Native before any imports
jest.mock("react-native", () => {
  const React = require("react");
  const mockComponent = (name: string) => {
    const fn = (props: Record<string, unknown>) =>
      React.createElement(name, props, props.children as string);
    fn.displayName = name;
    return fn;
  };
  return {
    Text: mockComponent("Text"),
    View: mockComponent("View"),
    TextInput: mockComponent("TextInput"),
    TouchableOpacity: mockComponent("TouchableOpacity"),
    ScrollView: mockComponent("ScrollView"),
    Animated: {
      View: mockComponent("Animated.View"),
      Value: jest.fn(() => ({
        interpolate: jest.fn(),
        setValue: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn((cb?: (result: { finished: boolean }) => void) => {
          cb?.({ finished: true });
        }),
      })),
      spring: jest.fn(() => ({
        start: jest.fn((cb?: (result: { finished: boolean }) => void) => {
          cb?.({ finished: true });
        }),
      })),
    },
    StyleSheet: {
      create: (styles: Record<string, object>) => styles,
      hairlineWidth: 1,
    },
    Vibration: {
      vibrate: jest.fn(),
    },
  };
});

// ============================================================
// Helper Function Tests
// ============================================================

// --- getTimerPanelPhase ---

describe("getTimerPanelPhase", () => {
  const {
    getTimerPanelPhase,
  } = require("../../../src/components/workout/timer-helpers");

  it("returns 'hidden' when timer is not active and not paused", () => {
    expect(getTimerPanelPhase(false, 0, false)).toBe("hidden");
  });

  it("returns 'hidden' when timer is not active with remaining time", () => {
    expect(getTimerPanelPhase(false, 30, false)).toBe("hidden");
  });

  it("returns 'counting' when timer is active with remaining time", () => {
    expect(getTimerPanelPhase(true, 90, false)).toBe("counting");
  });

  it("returns 'counting' when timer is paused", () => {
    expect(getTimerPanelPhase(false, 45, true)).toBe("counting");
  });

  it("returns 'completed' when timer is active but remaining is 0", () => {
    expect(getTimerPanelPhase(true, 0, false)).toBe("completed");
  });

  it("returns 'completed' when timer is active but remaining is negative", () => {
    expect(getTimerPanelPhase(true, -5, false)).toBe("completed");
  });

  it("returns 'expired' when wasExpiredOnRecover is true", () => {
    expect(getTimerPanelPhase(false, 0, false, true)).toBe("expired");
  });

  it("returns 'expired' even when timer is active", () => {
    expect(getTimerPanelPhase(true, 30, false, true)).toBe("expired");
  });

  it("returns 'counting' for active timer with 1 second remaining", () => {
    expect(getTimerPanelPhase(true, 1, false)).toBe("counting");
  });
});

// --- computeTimerProgress ---

describe("computeTimerProgress", () => {
  const {
    computeTimerProgress,
  } = require("../../../src/components/workout/timer-helpers");

  it("returns 1 when timer just started (full duration remaining)", () => {
    expect(computeTimerProgress(90, 90)).toBe(1);
  });

  it("returns 0.5 when half the time has elapsed", () => {
    expect(computeTimerProgress(45, 90)).toBeCloseTo(0.5);
  });

  it("returns 0 when timer is complete", () => {
    expect(computeTimerProgress(0, 90)).toBe(0);
  });

  it("returns 0 for zero total duration", () => {
    expect(computeTimerProgress(0, 0)).toBe(0);
  });

  it("clamps remaining to 0 minimum", () => {
    expect(computeTimerProgress(-10, 90)).toBe(0);
  });

  it("clamps progress to 1 maximum", () => {
    expect(computeTimerProgress(120, 90)).toBe(1);
  });

  it("returns small progress for nearly done timer", () => {
    const progress = computeTimerProgress(5, 90);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(0.1);
  });
});

// --- formatNotificationText ---

describe("formatNotificationText", () => {
  const {
    formatNotificationText,
  } = require("../../../src/components/workout/timer-helpers");

  it("formats 90 seconds as 1:30", () => {
    expect(formatNotificationText(90)).toBe("组间休息 · 剩余 1:30");
  });

  it("formats 60 seconds as 1:00", () => {
    expect(formatNotificationText(60)).toBe("组间休息 · 剩余 1:00");
  });

  it("formats 30 seconds as 0:30", () => {
    expect(formatNotificationText(30)).toBe("组间休息 · 剩余 0:30");
  });

  it("formats 0 seconds as 0:00", () => {
    expect(formatNotificationText(0)).toBe("组间休息 · 剩余 0:00");
  });

  it("formats 150 seconds as 2:30", () => {
    expect(formatNotificationText(150)).toBe("组间休息 · 剩余 2:30");
  });

  it("formats 5 seconds with leading zero", () => {
    expect(formatNotificationText(5)).toBe("组间休息 · 剩余 0:05");
  });
});

// --- getTimerTextColor ---

describe("getTimerTextColor", () => {
  const {
    getTimerTextColor,
  } = require("../../../src/components/workout/timer-helpers");

  it("returns error color for completed phase", () => {
    expect(getTimerTextColor("completed")).toBe("#ff3b30");
  });

  it("returns error color for expired phase", () => {
    expect(getTimerTextColor("expired")).toBe("#ff3b30");
  });

  it("returns text primary color for counting phase", () => {
    expect(getTimerTextColor("counting")).toBe("#1d1d1f");
  });

  it("returns text primary color for hidden phase", () => {
    expect(getTimerTextColor("hidden")).toBe("#1d1d1f");
  });
});

// --- shouldShowNextSetButton ---

describe("shouldShowNextSetButton", () => {
  const {
    shouldShowNextSetButton,
  } = require("../../../src/components/workout/timer-helpers");

  it("returns true for completed phase", () => {
    expect(shouldShowNextSetButton("completed")).toBe(true);
  });

  it("returns true for expired phase", () => {
    expect(shouldShowNextSetButton("expired")).toBe(true);
  });

  it("returns false for counting phase", () => {
    expect(shouldShowNextSetButton("counting")).toBe(false);
  });

  it("returns false for hidden phase", () => {
    expect(shouldShowNextSetButton("hidden")).toBe(false);
  });
});

// --- getExpiredMessage ---

describe("getExpiredMessage", () => {
  const {
    getExpiredMessage,
  } = require("../../../src/components/workout/timer-helpers");

  it("returns the expected Chinese recovery message", () => {
    expect(getExpiredMessage()).toBe("休息时间已过，准备好了就开始下一组");
  });
});

// --- isTimerPanelVisible ---

describe("isTimerPanelVisible", () => {
  const {
    isTimerPanelVisible,
  } = require("../../../src/components/workout/timer-helpers");

  it("returns false for hidden phase", () => {
    expect(isTimerPanelVisible("hidden")).toBe(false);
  });

  it("returns true for counting phase", () => {
    expect(isTimerPanelVisible("counting")).toBe(true);
  });

  it("returns true for completed phase", () => {
    expect(isTimerPanelVisible("completed")).toBe(true);
  });

  it("returns true for expired phase", () => {
    expect(isTimerPanelVisible("expired")).toBe(true);
  });
});

// ============================================================
// Component Module Export Tests
// ============================================================

describe("Timer Panel Module Exports", () => {
  it("timer-helpers exports all functions", () => {
    const helpers = require("../../../src/components/workout/timer-helpers");
    expect(typeof helpers.getTimerPanelPhase).toBe("function");
    expect(typeof helpers.computeTimerProgress).toBe("function");
    expect(typeof helpers.formatNotificationText).toBe("function");
    expect(typeof helpers.getTimerTextColor).toBe("function");
    expect(typeof helpers.shouldShowNextSetButton).toBe("function");
    expect(typeof helpers.getExpiredMessage).toBe("function");
    expect(typeof helpers.isTimerPanelVisible).toBe("function");
  });

  it("TimerPanel exports component", () => {
    const mod = require("../../../src/components/workout/TimerPanel");
    expect(typeof mod.TimerPanel).toBe("function");
  });

  it("CircularProgress exports component", () => {
    const mod = require("../../../src/components/workout/CircularProgress");
    expect(typeof mod.CircularProgress).toBe("function");
  });

  it("workout barrel exports TimerPanel", () => {
    const barrel = require("../../../src/components/workout");
    expect(typeof barrel.TimerPanel).toBe("function");
  });
});
