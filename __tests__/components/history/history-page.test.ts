/**
 * Unit tests for history page components and helpers.
 *
 * Tests pure helper logic, module exports, and component rendering
 * with mocked React Native primitives.
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
    FlatList: mockComponent("FlatList"),
    ActivityIndicator: mockComponent("ActivityIndicator"),
    Alert: {
      alert: jest.fn(),
    },
    StyleSheet: {
      create: (styles: Record<string, object>) => styles,
      hairlineWidth: 1,
    },
    Animated: {
      Value: jest.fn(() => ({
        interpolate: jest.fn(),
        setValue: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(),
      })),
      View: mockComponent("AnimatedView"),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 390, height: 844 })),
    },
    PanResponder: {
      create: jest.fn(() => ({ panHandlers: {} })),
    },
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// ============================================================
// Helper Function Tests
// ============================================================

import type {
  WorkoutSession,
  WorkoutSet,
  PersonalRecordEntry,
} from "../../../src/types";

// Helper factory functions
function makeWorkoutSession(
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession {
  return {
    id: 1,
    biz_key: 5001n,
    session_date: "2026-05-07",
    training_type: "push",
    session_status: "completed",
    started_at: "2026-05-07T10:00:00.000Z",
    ended_at: "2026-05-07T11:00:00.000Z",
    is_backlog: 0,
    created_at: "2026-05-07T10:00:00.000Z",
    updated_at: "2026-05-07T11:00:00.000Z",
    ...overrides,
  };
}

function makeWorkoutSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 1,
    biz_key: 7001n,
    workout_exercise_biz_key: 6001n,
    set_index: 0,
    target_weight: 60,
    target_reps: 5,
    actual_weight: 60,
    actual_reps: 5,
    is_completed: 1,
    completed_at: "2026-05-07T10:05:00.000Z",
    is_target_met: 1,
    ...overrides,
  };
}

function makePR(
  overrides: Partial<PersonalRecordEntry> = {},
): PersonalRecordEntry {
  return {
    exerciseBizKey: 1001n,
    prType: "weight",
    prValue: 100,
    prDate: "2026-05-05",
    ...overrides,
  };
}

// ============================================================
// Segment Type Tests
// ============================================================

describe("HISTORY_SEGMENTS", () => {
  const { HISTORY_SEGMENTS } = require("@components/history/history-helpers");

  it("has 4 segments: history/progress/volume/PR", () => {
    expect(HISTORY_SEGMENTS).toHaveLength(4);
  });

  it("contains correct segment keys and labels", () => {
    const keys = HISTORY_SEGMENTS.map((s: { key: string }) => s.key);
    expect(keys).toEqual(["history", "progress", "volume", "pr"]);
    const labels = HISTORY_SEGMENTS.map((s: { label: string }) => s.label);
    expect(labels).toEqual(["历史", "进步", "容量", "PR"]);
  });
});

// ============================================================
// History Card Data Formatting Tests
// ============================================================

describe("formatHistoryCardDate", () => {
  const {
    formatHistoryCardDate,
  } = require("@components/history/history-helpers");

  it("formats date in Chinese format with weekday", () => {
    // 2026-05-07 is a Thursday
    expect(formatHistoryCardDate("2026-05-07")).toBe("5月7日 周四");
  });

  it("formats another date correctly", () => {
    // 2026-05-05 is a Tuesday
    expect(formatHistoryCardDate("2026-05-05")).toBe("5月5日 周二");
  });

  it("handles single-digit month and day", () => {
    // 2026-01-03 is a Saturday
    expect(formatHistoryCardDate("2026-01-03")).toBe("1月3日 周六");
  });
});

describe("computeSessionTotalVolume", () => {
  const {
    computeSessionTotalVolume,
  } = require("@components/history/history-helpers");

  it("computes total volume from workout sets", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
    ];
    // 60 * 5 * 3 = 900
    expect(computeSessionTotalVolume(sets)).toBe(900);
  });

  it("handles sets with null actual values", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: null, actual_reps: null }),
    ];
    // 60 * 5 + 0 * 0 = 300
    expect(computeSessionTotalVolume(sets)).toBe(300);
  });

  it("returns 0 for empty sets", () => {
    expect(computeSessionTotalVolume([])).toBe(0);
  });
});

describe("formatVolume", () => {
  const { formatVolume } = require("@components/history/history-helpers");

  it("formats volume with comma separators and kg unit", () => {
    expect(formatVolume(8400)).toBe("8,400 kg");
  });

  it("formats small volume", () => {
    expect(formatVolume(500)).toBe("500 kg");
  });

  it("formats large volume", () => {
    expect(formatVolume(12500)).toBe("12,500 kg");
  });
});

describe("getTrainingTypeLabel", () => {
  const {
    getTrainingTypeLabel,
  } = require("@components/history/history-helpers");

  it("returns correct labels for each type", () => {
    expect(getTrainingTypeLabel("push")).toBe("推日");
    expect(getTrainingTypeLabel("pull")).toBe("拉日");
    expect(getTrainingTypeLabel("legs")).toBe("蹲日");
    expect(getTrainingTypeLabel("custom")).toBe("自定义");
  });
});

describe("getTrainingTypeColor", () => {
  const {
    getTrainingTypeColor,
  } = require("@components/history/history-helpers");

  it("returns correct colors for each type", () => {
    expect(getTrainingTypeColor("push")).toBe("#0071e3");
    expect(getTrainingTypeColor("pull")).toBe("#30d158");
    expect(getTrainingTypeColor("legs")).toBe("#ff9500");
    expect(getTrainingTypeColor("custom")).toBe("#af52de");
  });
});

describe("formatExerciseLine", () => {
  const { formatExerciseLine } = require("@components/history/history-helpers");

  it("formats exercise with weight x reps x sets", () => {
    expect(formatExerciseLine("卧推", 60, 5, 5)).toBe("卧推 60kg x 5 x 5");
  });

  it("formats exercise with BW (bodyweight)", () => {
    expect(formatExerciseLine("引体向上", 0, 10, 3)).toBe(
      "引体向上 BW x 10 x 3",
    );
  });

  it("formats exercise with decimal weight", () => {
    expect(formatExerciseLine("卧推", 57.5, 5, 5)).toBe("卧推 57.5kg x 5 x 5");
  });
});

// ============================================================
// PR Badge Detection Tests
// ============================================================

describe("getExercisesWithPR", () => {
  const { getExercisesWithPR } = require("@components/history/history-helpers");

  it("returns set of exercise biz_keys that have PRs on given date", () => {
    const prs = [
      makePR({
        exerciseBizKey: 1001n,
        prDate: "2026-05-05",
        prType: "weight",
      }),
      makePR({
        exerciseBizKey: 1002n,
        prDate: "2026-05-03",
        prType: "weight",
      }),
    ];
    const result = getExercisesWithPR(prs, "2026-05-05");
    expect(result).toContain(1001n);
    expect(result).not.toContain(1002n);
  });

  it("returns empty set when no PRs match date", () => {
    const prs = [makePR({ exerciseBizKey: 1001n, prDate: "2026-05-03" })];
    const result = getExercisesWithPR(prs, "2026-05-05");
    expect(result.size).toBe(0);
  });

  it("returns empty set for empty PRs list", () => {
    const result = getExercisesWithPR([], "2026-05-05");
    expect(result.size).toBe(0);
  });
});

// ============================================================
// Volume Chart Data Tests
// ============================================================

describe("buildVolumeChartData", () => {
  const {
    buildVolumeChartData,
  } = require("@components/history/history-helpers");

  it("builds weekly volume data from sessions", () => {
    const sessions = [
      makeWorkoutSession({
        session_date: "2026-04-06",
        biz_key: 1n,
      }),
      makeWorkoutSession({
        session_date: "2026-04-08",
        biz_key: 2n,
      }),
      makeWorkoutSession({
        session_date: "2026-04-15",
        biz_key: 3n,
      }),
    ];
    const volumeMap = new Map<bigint, number>([
      [1n, 10000],
      [2n, 8000],
      [3n, 12000],
    ]);

    const data = buildVolumeChartData(sessions, volumeMap, 6);
    expect(data.length).toBeGreaterThan(0);
    // Should have weekly buckets
    expect(data[0].label).toBeTruthy();
    expect(typeof data[0].value).toBe("number");
  });

  it("returns empty array for no sessions", () => {
    const data = buildVolumeChartData([], new Map<bigint, number>(), 6);
    expect(data).toHaveLength(0);
  });
});

// ============================================================
// Volume Summary Tests
// ============================================================

describe("computeVolumeSummary", () => {
  const {
    computeVolumeSummary,
  } = require("@components/history/history-helpers");

  it("computes weekly, change, and monthly summary", () => {
    const weeklyVolumes = [
      { label: "W1", value: 18000 },
      { label: "W2", value: 22000 },
      { label: "W3", value: 25000 },
      { label: "W4", value: 28000 },
      { label: "W5", value: 32000 },
      { label: "W6", value: 12500 },
    ];

    const summary = computeVolumeSummary(weeklyVolumes);
    expect(summary.currentWeek).toBe(12500);
    expect(summary.lastWeek).toBe(32000);
    expect(summary.monthlyTotal).toBe(
      18000 + 22000 + 25000 + 28000 + 32000 + 12500,
    );
  });

  it("handles empty data", () => {
    const summary = computeVolumeSummary([]);
    expect(summary.currentWeek).toBe(0);
    expect(summary.lastWeek).toBe(0);
    expect(summary.monthlyTotal).toBe(0);
  });
});

describe("formatWeekChange", () => {
  const { formatWeekChange } = require("@components/history/history-helpers");

  it("formats positive change with up arrow", () => {
    expect(formatWeekChange(10000, 8000)).toBe("+25%");
  });

  it("formats negative change with down arrow", () => {
    expect(formatWeekChange(8000, 10000)).toBe("-20%");
  });

  it("returns N/A when last week is 0", () => {
    expect(formatWeekChange(10000, 0)).toBe("N/A");
  });
});

// ============================================================
// PR Panel Formatting Tests
// ============================================================

describe("groupPRsByExercise", () => {
  const { groupPRsByExercise } = require("@components/history/history-helpers");

  it("groups PRs by exercise biz_key", () => {
    const prs = [
      makePR({
        exerciseBizKey: 1001n,
        prType: "weight",
        prValue: 100,
      }),
      makePR({
        exerciseBizKey: 1001n,
        prType: "volume",
        prValue: 2500,
      }),
      makePR({
        exerciseBizKey: 1002n,
        prType: "weight",
        prValue: 60,
      }),
    ];

    const grouped = groupPRsByExercise(prs);
    expect(grouped.size).toBe(2);
    const squatPRs = grouped.get(1001n);
    expect(squatPRs).toBeDefined();
    expect(squatPRs!.weight).toBe(100);
    expect(squatPRs!.volume).toBe(2500);
  });

  it("returns empty map for empty PRs", () => {
    const grouped = groupPRsByExercise([]);
    expect(grouped.size).toBe(0);
  });

  it("updates weight PR when a higher value is found for same exercise", () => {
    const prs = [
      makePR({
        exerciseBizKey: 1001n,
        prType: "weight",
        prValue: 80,
        prDate: "2026-04-01",
      }),
      makePR({
        exerciseBizKey: 1001n,
        prType: "weight",
        prValue: 100,
        prDate: "2026-05-05",
      }),
    ];

    const grouped = groupPRsByExercise(prs);
    expect(grouped.get(1001n)!.weight).toBe(100);
    expect(grouped.get(1001n)!.weightDate).toBe("2026-05-05");
  });
});

describe("formatPRDate", () => {
  const { formatPRDate } = require("@components/history/history-helpers");

  it("formats PR date for display", () => {
    expect(formatPRDate("2026-05-05")).toBe("2026-05-05");
  });
});

// ============================================================
// History Filter Tests
// ============================================================

describe("filterSessionsByType", () => {
  const {
    filterSessionsByType,
  } = require("@components/history/history-helpers");

  const sessions = [
    makeWorkoutSession({
      session_date: "2026-05-07",
      training_type: "push",
      biz_key: 1n,
    }),
    makeWorkoutSession({
      session_date: "2026-05-05",
      training_type: "legs",
      biz_key: 2n,
    }),
    makeWorkoutSession({
      session_date: "2026-05-03",
      training_type: "pull",
      biz_key: 3n,
    }),
  ];

  it("returns all sessions when filter is null", () => {
    expect(filterSessionsByType(sessions, null)).toHaveLength(3);
  });

  it("filters by push type", () => {
    const filtered = filterSessionsByType(sessions, "push");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].training_type).toBe("push");
  });

  it("filters by legs type", () => {
    const filtered = filterSessionsByType(sessions, "legs");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].training_type).toBe("legs");
  });

  it("returns empty when no match", () => {
    const filtered = filterSessionsByType(sessions, "custom");
    expect(filtered).toHaveLength(0);
  });
});

describe("sortSessionsByDateDescending", () => {
  const {
    sortSessionsByDateDescending,
  } = require("@components/history/history-helpers");

  it("sorts sessions by date descending", () => {
    const sessions = [
      makeWorkoutSession({ session_date: "2026-05-03", biz_key: 1n }),
      makeWorkoutSession({ session_date: "2026-05-07", biz_key: 2n }),
      makeWorkoutSession({ session_date: "2026-05-05", biz_key: 3n }),
    ];

    const sorted = sortSessionsByDateDescending(sessions);
    expect(sorted[0].session_date).toBe("2026-05-07");
    expect(sorted[1].session_date).toBe("2026-05-05");
    expect(sorted[2].session_date).toBe("2026-05-03");
  });

  it("handles same-date sessions sorted by started_at descending", () => {
    const sessions = [
      makeWorkoutSession({
        session_date: "2026-05-07",
        started_at: "2026-05-07T08:00:00.000Z",
        biz_key: 1n,
      }),
      makeWorkoutSession({
        session_date: "2026-05-07",
        started_at: "2026-05-07T16:00:00.000Z",
        biz_key: 2n,
      }),
    ];

    const sorted = sortSessionsByDateDescending(sessions);
    expect(sorted[0].started_at).toBe("2026-05-07T16:00:00.000Z");
    expect(sorted[1].started_at).toBe("2026-05-07T08:00:00.000Z");
  });
});

// ============================================================
// Backlog Detection Tests
// ============================================================

describe("isBacklogSession", () => {
  const { isBacklogSession } = require("@components/history/history-helpers");

  it("returns true for backlog session", () => {
    const session = makeWorkoutSession({ is_backlog: 1 });
    expect(isBacklogSession(session)).toBe(true);
  });

  it("returns false for normal session", () => {
    const session = makeWorkoutSession({ is_backlog: 0 });
    expect(isBacklogSession(session)).toBe(false);
  });
});

// ============================================================
// Satisfaction Display Tests
// ============================================================

describe("formatSatisfaction", () => {
  const { formatSatisfaction } = require("@components/history/history-helpers");

  it("formats satisfaction with star", () => {
    expect(formatSatisfaction(7)).toBe("★ 7/10");
  });

  it("formats low satisfaction", () => {
    expect(formatSatisfaction(3)).toBe("★ 3/10");
  });
});

// ============================================================
// Component Module Export Tests
// ============================================================

describe("History Component Modules", () => {
  it("HistoryScreen module exports component", () => {
    const module = require("@components/history/HistoryScreen");
    expect(typeof module.HistoryScreen).toBe("function");
  });

  it("HistoryCard module exports component", () => {
    const module = require("@components/history/HistoryCard");
    expect(typeof module.HistoryCard).toBe("function");
  });

  it("ProgressPanel module exports component", () => {
    const module = require("@components/history/ProgressPanel");
    expect(typeof module.ProgressPanel).toBe("function");
  });

  it("VolumePanel module exports component", () => {
    const module = require("@components/history/VolumePanel");
    expect(typeof module.VolumePanel).toBe("function");
  });

  it("PRPanel module exports component", () => {
    const module = require("@components/history/PRPanel");
    expect(typeof module.PRPanel).toBe("function");
  });

  it("EmptyHistory module exports component", () => {
    const module = require("@components/history/EmptyHistory");
    expect(typeof module.EmptyHistory).toBe("function");
  });

  it("history barrel exports all components and helpers", () => {
    const barrel = require("@components/history");
    // Components
    expect(typeof barrel.HistoryScreen).toBe("function");
    expect(typeof barrel.HistoryCard).toBe("function");
    expect(typeof barrel.ProgressPanel).toBe("function");
    expect(typeof barrel.VolumePanel).toBe("function");
    expect(typeof barrel.PRPanel).toBe("function");
    expect(typeof barrel.EmptyHistory).toBe("function");
    // Helpers
    expect(typeof barrel.formatHistoryCardDate).toBe("function");
    expect(typeof barrel.computeSessionTotalVolume).toBe("function");
    expect(typeof barrel.formatVolume).toBe("function");
    expect(typeof barrel.getTrainingTypeLabel).toBe("function");
    expect(typeof barrel.getTrainingTypeColor).toBe("function");
    expect(typeof barrel.formatExerciseLine).toBe("function");
    expect(typeof barrel.getExercisesWithPR).toBe("function");
    expect(typeof barrel.buildVolumeChartData).toBe("function");
    expect(typeof barrel.computeVolumeSummary).toBe("function");
    expect(typeof barrel.formatWeekChange).toBe("function");
    expect(typeof barrel.groupPRsByExercise).toBe("function");
    expect(typeof barrel.formatPRDate).toBe("function");
    expect(typeof barrel.filterSessionsByType).toBe("function");
    expect(typeof barrel.sortSessionsByDateDescending).toBe("function");
    expect(typeof barrel.isBacklogSession).toBe("function");
    expect(typeof barrel.formatSatisfaction).toBe("function");
    expect(Array.isArray(barrel.HISTORY_SEGMENTS)).toBe(true);
  });
});

// ============================================================
// Page Module Tests
// ============================================================

describe("History Page Module", () => {
  it("history tab page exports default function", () => {
    const module = require("../../../app/(tabs)/history");
    expect(typeof module.default).toBe("function");
  });
});
