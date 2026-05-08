/**
 * Unit tests for post-workout feeling page.
 *
 * Tests pure helper logic and component rendering for:
 * - Total volume calculation from completed exercise sets
 * - Training summary formatting
 * - High fatigue + low satisfaction warning detection
 * - Exercise note card data extraction (only completed exercises)
 * - FeelingScreen component rendering and exports
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
    Alert: {
      alert: jest.fn(),
    },
    StyleSheet: {
      create: (styles: Record<string, object>) => styles,
      hairlineWidth: 1,
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

import type { WorkoutExercise, WorkoutSet } from "../../../src/types";

// Helper factory functions
function makeWorkoutExercise(
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return {
    id: 1,
    biz_key: 100n,
    workout_session_biz_key: 1n,
    exercise_biz_key: 200n,
    order_index: 0,
    exercise_status: "completed",
    exercise_note: null,
    suggested_weight: null,
    target_sets: 5,
    target_reps: 5,
    exercise_mode: "fixed",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeWorkoutSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 1,
    biz_key: 300n,
    workout_exercise_biz_key: 100n,
    set_index: 0,
    target_weight: 60,
    target_reps: 5,
    actual_weight: 60,
    actual_reps: 5,
    is_completed: 1,
    completed_at: "2026-01-01T00:00:00Z",
    is_target_met: 1,
    ...overrides,
  };
}

// Import helpers (will be created in TDD)
const {
  computeTotalVolume,
  formatTrainingSummary,
  shouldShowWarning,
  getCompletedExercises,
  formatExerciseSummary,
} = require("../../../src/components/feeling/feeling-helpers");

// ============================================================
// computeTotalVolume
// ============================================================

describe("computeTotalVolume", () => {
  it("returns 0 for empty sets", () => {
    expect(computeTotalVolume([])).toBe(0);
  });

  it("computes volume as sum of actual_weight * actual_reps for completed sets", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({
        actual_weight: 60,
        actual_reps: 5,
        workout_exercise_biz_key: 101n,
      }),
      makeWorkoutSet({
        actual_weight: 40,
        actual_reps: 8,
        workout_exercise_biz_key: 102n,
      }),
    ];
    // 60*5 + 60*5 + 40*8 = 300 + 300 + 320 = 920
    expect(computeTotalVolume(sets)).toBe(920);
  });

  it("skips sets with null actual_weight or actual_reps", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: null, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: 60, actual_reps: null }),
    ];
    // Only 60*5 = 300
    expect(computeTotalVolume(sets)).toBe(300);
  });

  it("skips sets that are not completed", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5, is_completed: 1 }),
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5, is_completed: 0 }),
    ];
    // Only first set: 60*5 = 300
    expect(computeTotalVolume(sets)).toBe(300);
  });
});

// ============================================================
// formatTrainingSummary
// ============================================================

describe("formatTrainingSummary", () => {
  it("formats push day summary with volume", () => {
    expect(formatTrainingSummary("push", 8400)).toBe("推日 · 总容量 8,400kg");
  });

  it("formats pull day summary", () => {
    expect(formatTrainingSummary("pull", 5000)).toBe("拉日 · 总容量 5,000kg");
  });

  it("formats legs day summary", () => {
    expect(formatTrainingSummary("legs", 12000)).toBe("蹲日 · 总容量 12,000kg");
  });

  it("formats custom training type", () => {
    expect(formatTrainingSummary("custom", 3000)).toBe(
      "自定义 · 总容量 3,000kg",
    );
  });

  it("formats volume with commas for large numbers", () => {
    expect(formatTrainingSummary("push", 1234567)).toBe(
      "推日 · 总容量 1,234,567kg",
    );
  });
});

// ============================================================
// shouldShowWarning
// ============================================================

describe("shouldShowWarning", () => {
  it("returns true when fatigue >= 8 and satisfaction <= 4", () => {
    expect(shouldShowWarning(8, 4)).toBe(true);
    expect(shouldShowWarning(10, 1)).toBe(true);
    expect(shouldShowWarning(9, 3)).toBe(true);
  });

  it("returns false when fatigue < 8", () => {
    expect(shouldShowWarning(7, 4)).toBe(false);
    expect(shouldShowWarning(5, 3)).toBe(false);
  });

  it("returns false when satisfaction > 4", () => {
    expect(shouldShowWarning(8, 5)).toBe(false);
    expect(shouldShowWarning(10, 7)).toBe(false);
  });

  it("returns false when both conditions are not met", () => {
    expect(shouldShowWarning(6, 6)).toBe(false);
    expect(shouldShowWarning(7, 5)).toBe(false);
  });

  it("returns the warning message", () => {
    const result = shouldShowWarning(8, 3);
    expect(result).toBe(true);
  });
});

// ============================================================
// getCompletedExercises
// ============================================================

describe("getCompletedExercises", () => {
  it("returns only exercises with completed status", () => {
    const exercises = [
      makeWorkoutExercise({
        exercise_status: "completed",
        exercise_biz_key: 1n,
      }),
      makeWorkoutExercise({
        exercise_status: "skipped",
        exercise_biz_key: 2n,
      }),
      makeWorkoutExercise({
        exercise_status: "completed",
        exercise_biz_key: 3n,
      }),
      makeWorkoutExercise({
        exercise_status: "in_progress",
        exercise_biz_key: 4n,
      }),
    ];
    const result = getCompletedExercises(exercises);
    expect(result).toHaveLength(2);
    expect(result[0].exercise_biz_key).toBe(1n);
    expect(result[1].exercise_biz_key).toBe(3n);
  });

  it("returns empty array when no exercises are completed", () => {
    const exercises = [
      makeWorkoutExercise({ exercise_status: "skipped" }),
      makeWorkoutExercise({ exercise_status: "pending" }),
    ];
    expect(getCompletedExercises(exercises)).toHaveLength(0);
  });
});

// ============================================================
// formatExerciseSummary
// ============================================================

describe("formatExerciseSummary", () => {
  it("formats exercise summary with weight, sets, and reps", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
    ];
    expect(formatExerciseSummary("卧推", sets)).toBe("卧推 60kg×5×3");
  });

  it("handles mixed weights across sets", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: 65, actual_reps: 3 }),
    ];
    // Multiple weights: show both
    expect(formatExerciseSummary("卧推", sets)).toBe("卧推 60kg×5, 65kg×3");
  });

  it("returns exercise name only when no completed sets", () => {
    const sets: WorkoutSet[] = [];
    expect(formatExerciseSummary("卧推", sets)).toBe("卧推");
  });
});

// ============================================================
// Component Import Tests
// ============================================================

describe("FeelingScreen component", () => {
  it("exports FeelingScreen component", () => {
    const {
      FeelingScreen,
    } = require("../../../src/components/feeling/FeelingScreen");
    expect(FeelingScreen).toBeDefined();
    expect(typeof FeelingScreen).toBe("function");
  });

  it("exports feeling-helpers functions", () => {
    const helpers = require("../../../src/components/feeling/feeling-helpers");
    expect(helpers.computeTotalVolume).toBeDefined();
    expect(helpers.formatTrainingSummary).toBeDefined();
    expect(helpers.shouldShowWarning).toBeDefined();
    expect(helpers.getCompletedExercises).toBeDefined();
    expect(helpers.formatExerciseSummary).toBeDefined();
    expect(helpers.getTrainingTypeLabel).toBeDefined();
    expect(helpers.WARNING_MESSAGE).toBeDefined();
  });

  it("exports index barrel", () => {
    const index = require("../../../src/components/feeling/index");
    expect(index.FeelingScreen).toBeDefined();
    expect(index.computeTotalVolume).toBeDefined();
  });
});
