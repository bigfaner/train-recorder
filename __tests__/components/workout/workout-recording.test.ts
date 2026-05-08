/**
 * Unit tests for workout recording UI components.
 *
 * Tests pure helper logic and component rendering for:
 * - Exercise display name logic (same exercise distinction)
 * - Weight label logic (suggested vs custom)
 * - Progress formatting
 * - Set summary formatting
 * - Exit confirmation text
 * - Exercise card state determination
 * - Component rendering and exports
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

jest.mock("@hooks/useWorkout", () => ({
  useWorkout: jest.fn(() => ({
    activeSession: null,
    exercises: [],
    setsByExercise: new Map(),
    currentExerciseBizKey: null,
    isLoading: false,
    error: null,
    progress: {
      completedExercises: 0,
      totalExercises: 0,
      completedSets: 0,
      totalSets: 0,
      percentage: 0,
    },
    startWorkout: jest.fn(),
    selectExercise: jest.fn(),
    recordSet: jest.fn(),
    completeExercise: jest.fn(),
    completeWorkout: jest.fn(),
    exitWorkout: jest.fn(),
    restoreSession: jest.fn(),
    clearError: jest.fn(),
  })),
  computeProgress: jest.fn(() => ({
    completedExercises: 0,
    totalExercises: 0,
    completedSets: 0,
    totalSets: 0,
    percentage: 0,
  })),
}));

jest.mock("@stores/workout.store", () => ({
  createWorkoutStore: jest.fn(),
}));

jest.mock("zustand", () => ({
  useStore: jest.fn(),
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
    exercise_status: "pending",
    exercise_note: null,
    suggested_weight: null,
    target_sets: 3,
    target_reps: 5,
    exercise_mode: "fixed",
    created_at: "2026-05-01T00:00:00Z",
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
    completed_at: "2026-05-01T00:00:00Z",
    is_target_met: 1,
    ...overrides,
  };
}

// --- getExerciseDisplayName ---

describe("getExerciseDisplayName", () => {
  const {
    getExerciseDisplayName,
  } = require("../../../src/components/workout/workout-helpers");

  it("returns plain name when exercise appears once", () => {
    const exercises = [
      makeWorkoutExercise({ biz_key: 1n, exercise_biz_key: 10n }),
    ];
    // Pass the workout exercise biz_key (1n)
    expect(getExerciseDisplayName(1n, "深蹲", exercises)).toBe("深蹲");
  });

  it("appends #1 for first duplicate", () => {
    const exercises = [
      makeWorkoutExercise({ biz_key: 1n, exercise_biz_key: 10n }),
      makeWorkoutExercise({ biz_key: 2n, exercise_biz_key: 10n }),
    ];
    expect(getExerciseDisplayName(1n, "深蹲", exercises)).toBe("深蹲 #1");
  });

  it("appends #2 for second duplicate without note", () => {
    const exercises = [
      makeWorkoutExercise({ biz_key: 1n, exercise_biz_key: 10n }),
      makeWorkoutExercise({ biz_key: 2n, exercise_biz_key: 10n }),
    ];
    expect(getExerciseDisplayName(2n, "深蹲", exercises)).toBe("深蹲 #2");
  });

  it("appends #2 - note for second duplicate with note", () => {
    const exercises = [
      makeWorkoutExercise({ biz_key: 1n, exercise_biz_key: 10n }),
      makeWorkoutExercise({
        biz_key: 2n,
        exercise_biz_key: 10n,
        exercise_note: "暂停深蹲",
      }),
    ];
    expect(getExerciseDisplayName(2n, "深蹲", exercises)).toBe(
      "深蹲 #2 - 暂停深蹲",
    );
  });

  it("returns plain name for non-existent biz_key", () => {
    const exercises = [
      makeWorkoutExercise({ biz_key: 1n, exercise_biz_key: 10n }),
    ];
    expect(getExerciseDisplayName(999n, "深蹲", exercises)).toBe("深蹲");
  });
});

// --- isCustomWeight ---

describe("isCustomWeight", () => {
  const {
    isCustomWeight,
  } = require("../../../src/components/workout/workout-helpers");

  it("returns false when suggested is null", () => {
    expect(isCustomWeight(null, 60)).toBe(false);
  });

  it("returns false when actual is null", () => {
    expect(isCustomWeight(60, null)).toBe(false);
  });

  it("returns false when weights match", () => {
    expect(isCustomWeight(60, 60)).toBe(false);
  });

  it("returns true when weights differ", () => {
    expect(isCustomWeight(60, 65)).toBe(true);
  });
});

// --- getWeightLabelType ---

describe("getWeightLabelType", () => {
  const {
    getWeightLabelType,
  } = require("../../../src/components/workout/workout-helpers");

  it("returns 'suggested' when no actual weight but suggestion exists", () => {
    expect(getWeightLabelType(60, null)).toBe("suggested");
  });

  it("returns 'none' when both are null", () => {
    expect(getWeightLabelType(null, null)).toBe("none");
  });

  it("returns 'none' when no suggestion", () => {
    expect(getWeightLabelType(null, 60)).toBe("none");
  });

  it("returns 'suggested' when weights match", () => {
    expect(getWeightLabelType(60, 60)).toBe("suggested");
  });

  it("returns 'custom' when weights differ", () => {
    expect(getWeightLabelType(60, 65)).toBe("custom");
  });
});

// --- formatWeightWithIncrement ---

describe("formatWeightWithIncrement", () => {
  const {
    formatWeightWithIncrement,
  } = require("../../../src/components/workout/workout-helpers");

  it("formats weight with positive increment", () => {
    expect(formatWeightWithIncrement(60, 2.5)).toBe("60kg (+2.5)");
  });

  it("formats weight with zero increment", () => {
    expect(formatWeightWithIncrement(60, 0)).toBe("60kg");
  });

  it("formats weight with large increment", () => {
    expect(formatWeightWithIncrement(100, 5)).toBe("100kg (+5)");
  });
});

// --- formatExerciseProgress ---

describe("formatExerciseProgress", () => {
  const {
    formatExerciseProgress,
  } = require("../../../src/components/workout/workout-helpers");

  it("formats progress text", () => {
    expect(formatExerciseProgress(2, 5)).toBe("完成 2/5");
  });

  it("formats zero progress", () => {
    expect(formatExerciseProgress(0, 5)).toBe("完成 0/5");
  });

  it("formats full progress", () => {
    expect(formatExerciseProgress(5, 5)).toBe("完成 5/5");
  });
});

// --- formatSetProgress ---

describe("formatSetProgress", () => {
  const {
    formatSetProgress,
  } = require("../../../src/components/workout/workout-helpers");

  it("formats set progress", () => {
    expect(formatSetProgress(3, 5)).toBe("3/5组");
  });
});

// --- formatSetSummary ---

describe("formatSetSummary", () => {
  const {
    formatSetSummary,
  } = require("../../../src/components/workout/workout-helpers");

  it("returns empty string for no sets", () => {
    expect(formatSetSummary([])).toBe("");
  });

  it("formats single weight, uniform reps", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 100, actual_reps: 5 }),
      makeWorkoutSet({ actual_weight: 100, actual_reps: 5 }),
    ];
    expect(formatSetSummary(sets)).toBe("100kg × 5, 5");
  });

  it("formats multiple weights", () => {
    const sets = [
      makeWorkoutSet({ actual_weight: 60, actual_reps: 8 }),
      makeWorkoutSet({ actual_weight: 65, actual_reps: 8 }),
    ];
    expect(formatSetSummary(sets)).toBe("60kg × 8 | 65kg × 8");
  });

  it("uses target weight/reps when actual is null", () => {
    const sets = [
      makeWorkoutSet({
        actual_weight: null,
        actual_reps: null,
        target_weight: 60,
        target_reps: 5,
      }),
    ];
    expect(formatSetSummary(sets)).toBe("60kg × 5");
  });
});

// --- getExitConfirmText ---

describe("getExitConfirmText", () => {
  const {
    getExitConfirmText,
  } = require("../../../src/components/workout/workout-helpers");

  it("formats exit confirmation text", () => {
    expect(getExitConfirmText(2, 5)).toBe("已完成 2/5 动作，确定结束？");
  });

  it("formats exit confirmation for zero completed", () => {
    expect(getExitConfirmText(0, 5)).toBe("已完成 0/5 动作，确定结束？");
  });
});

// --- getExerciseCardState ---

describe("getExerciseCardState", () => {
  const {
    getExerciseCardState,
  } = require("../../../src/components/workout/workout-helpers");

  it("returns 'completed' for completed exercise", () => {
    const exercise = makeWorkoutExercise({ exercise_status: "completed" });
    expect(getExerciseCardState(exercise, null)).toBe("completed");
  });

  it("returns 'active' when exercise matches current", () => {
    const exercise = makeWorkoutExercise({
      biz_key: 100n,
      exercise_status: "pending",
    });
    expect(getExerciseCardState(exercise, 100n)).toBe("active");
  });

  it("returns 'active' for in_progress exercise", () => {
    const exercise = makeWorkoutExercise({
      biz_key: 100n,
      exercise_status: "in_progress",
    });
    expect(getExerciseCardState(exercise, null)).toBe("active");
  });

  it("returns 'pending' for non-current pending exercise", () => {
    const exercise = makeWorkoutExercise({
      biz_key: 100n,
      exercise_status: "pending",
    });
    expect(getExerciseCardState(exercise, 999n)).toBe("pending");
  });

  it("returns 'pending' for skipped exercise", () => {
    const exercise = makeWorkoutExercise({
      biz_key: 100n,
      exercise_status: "skipped",
    });
    expect(getExerciseCardState(exercise, 999n)).toBe("pending");
  });
});

// --- getCompletedSetCount ---

describe("getCompletedSetCount", () => {
  const {
    getCompletedSetCount,
  } = require("../../../src/components/workout/workout-helpers");

  it("counts completed sets", () => {
    const sets = [
      makeWorkoutSet({ is_completed: 1 }),
      makeWorkoutSet({ is_completed: 1 }),
      makeWorkoutSet({ is_completed: 0 }),
    ];
    expect(getCompletedSetCount(sets)).toBe(2);
  });

  it("returns 0 for no sets", () => {
    expect(getCompletedSetCount([])).toBe(0);
  });
});

// --- isAllExercisesCompleted ---

describe("isAllExercisesCompleted", () => {
  const {
    isAllExercisesCompleted,
  } = require("../../../src/components/workout/workout-helpers");

  it("returns false for empty list", () => {
    expect(isAllExercisesCompleted([])).toBe(false);
  });

  it("returns true when all completed", () => {
    const exercises = [
      makeWorkoutExercise({ exercise_status: "completed" }),
      makeWorkoutExercise({ exercise_status: "completed" }),
    ];
    expect(isAllExercisesCompleted(exercises)).toBe(true);
  });

  it("returns false when some are not completed", () => {
    const exercises = [
      makeWorkoutExercise({ exercise_status: "completed" }),
      makeWorkoutExercise({ exercise_status: "pending" }),
    ];
    expect(isAllExercisesCompleted(exercises)).toBe(false);
  });
});

// --- getNextSetIndex ---

describe("getNextSetIndex", () => {
  const {
    getNextSetIndex,
  } = require("../../../src/components/workout/workout-helpers");

  it("returns 0 for empty sets", () => {
    expect(getNextSetIndex([])).toBe(0);
  });

  it("returns length of sets array", () => {
    const sets = [makeWorkoutSet(), makeWorkoutSet()];
    expect(getNextSetIndex(sets)).toBe(2);
  });
});

// ============================================================
// Component Module Export Tests
// ============================================================

describe("Workout Component Modules", () => {
  it("workout-helpers exports all functions", () => {
    const helpers = require("../../../src/components/workout/workout-helpers");
    expect(typeof helpers.getExerciseDisplayName).toBe("function");
    expect(typeof helpers.isCustomWeight).toBe("function");
    expect(typeof helpers.getWeightLabelType).toBe("function");
    expect(typeof helpers.formatWeightWithIncrement).toBe("function");
    expect(typeof helpers.formatExerciseProgress).toBe("function");
    expect(typeof helpers.formatSetProgress).toBe("function");
    expect(typeof helpers.formatSetSummary).toBe("function");
    expect(typeof helpers.getExitConfirmText).toBe("function");
    expect(typeof helpers.getExerciseCardState).toBe("function");
    expect(typeof helpers.getCompletedSetCount).toBe("function");
    expect(typeof helpers.isAllExercisesCompleted).toBe("function");
    expect(typeof helpers.getNextSetIndex).toBe("function");
  });

  it("ExerciseCard exports component", () => {
    const mod = require("../../../src/components/workout/ExerciseCard");
    expect(typeof mod.ExerciseCard).toBe("function");
  });

  it("WorkoutHeader exports component", () => {
    try {
      const mod = require("../../../src/components/workout/WorkoutHeader");
      expect(typeof mod.WorkoutHeader).toBe("function");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`WorkoutHeader import failed: ${msg}`, { cause: e });
    }
  });

  it("WorkoutScreen exports screen component", () => {
    try {
      const mod = require("../../../src/components/workout/WorkoutScreen");
      expect(typeof mod.WorkoutScreen).toBe("function");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`WorkoutScreen import failed: ${msg}`, { cause: e });
    }
  });

  it("workout barrel exports all components", () => {
    try {
      const barrel = require("../../../src/components/workout");
      expect(typeof barrel.ExerciseCard).toBe("function");
      expect(typeof barrel.WorkoutHeader).toBe("function");
      expect(typeof barrel.WorkoutScreen).toBe("function");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Barrel import failed: ${msg}`, { cause: e });
    }
  });
});
