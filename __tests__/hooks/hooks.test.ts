/**
 * Unit tests for hook utility functions.
 * Tests pure computation functions exported from hooks.
 *
 * For hooks that wrap React state, we test the exported helper functions
 * directly rather than using renderHook (which requires React Native setup).
 */

import { computeProgress } from "../../src/hooks/useWorkout";
import { formatDisplayTime } from "../../src/hooks/useTimer";
import type { WorkoutExercise } from "../../src/types";

// ============================================================
// computeProgress tests
// ============================================================

describe("computeProgress", () => {
  const makeExercise = (
    overrides: Partial<WorkoutExercise> = {},
  ): WorkoutExercise => ({
    id: 1,
    biz_key: 101n,
    workout_session_biz_key: 500n,
    exercise_biz_key: 1001n,
    order_index: 0,
    exercise_status: "completed",
    exercise_note: null,
    suggested_weight: 100,
    target_sets: 3,
    target_reps: 5,
    exercise_mode: "fixed",
    created_at: new Date().toISOString(),
    ...overrides,
  });

  it("should return zero progress with empty exercises", () => {
    const result = computeProgress([], new Map());
    expect(result.completedExercises).toBe(0);
    expect(result.totalExercises).toBe(0);
    expect(result.completedSets).toBe(0);
    expect(result.totalSets).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("should compute completed exercises", () => {
    const exercises = [
      makeExercise({ biz_key: 101n, exercise_status: "completed" }),
      makeExercise({ biz_key: 102n, exercise_status: "in_progress" }),
      makeExercise({ biz_key: 103n, exercise_status: "pending" }),
    ];

    const result = computeProgress(exercises, new Map());
    expect(result.completedExercises).toBe(1);
    expect(result.totalExercises).toBe(3);
  });

  it("should compute completed sets", () => {
    const exercises = [makeExercise({ biz_key: 101n, target_sets: 3 })];

    const setsMap = new Map();
    setsMap.set(101n, [
      { is_completed: 1 as const },
      { is_completed: 1 as const },
      { is_completed: 0 as const },
    ]);

    const result = computeProgress(exercises, setsMap);
    expect(result.completedSets).toBe(2);
    expect(result.totalSets).toBe(3);
    expect(result.percentage).toBe(67); // Math.round(2/3 * 100) = 67
  });

  it("should compute 100% when all sets completed", () => {
    const exercises = [
      makeExercise({ biz_key: 101n, target_sets: 2 }),
      makeExercise({ biz_key: 102n, target_sets: 3, id: 2 }),
    ];

    const setsMap = new Map();
    setsMap.set(101n, [{ is_completed: 1 }, { is_completed: 1 }]);
    setsMap.set(102n, [
      { is_completed: 1 },
      { is_completed: 1 },
      { is_completed: 1 },
    ]);

    const result = computeProgress(exercises, setsMap);
    expect(result.completedSets).toBe(5);
    expect(result.totalSets).toBe(5);
    expect(result.percentage).toBe(100);
  });

  it("should handle exercises with no recorded sets", () => {
    const exercises = [makeExercise({ biz_key: 101n, target_sets: 3 })];

    const result = computeProgress(exercises, new Map());
    expect(result.completedSets).toBe(0);
    expect(result.totalSets).toBe(3);
    expect(result.percentage).toBe(0);
  });
});

// ============================================================
// formatDisplayTime tests
// ============================================================

describe("formatDisplayTime", () => {
  it("should format 0 seconds as 00:00", () => {
    expect(formatDisplayTime(0)).toBe("00:00");
  });

  it("should format 90 seconds as 01:30", () => {
    expect(formatDisplayTime(90)).toBe("01:30");
  });

  it("should format 60 seconds as 01:00", () => {
    expect(formatDisplayTime(60)).toBe("01:00");
  });

  it("should format 30 seconds as 00:30", () => {
    expect(formatDisplayTime(30)).toBe("00:30");
  });

  it("should format 5 seconds as 00:05", () => {
    expect(formatDisplayTime(5)).toBe("00:05");
  });

  it("should format 600 seconds as 10:00", () => {
    expect(formatDisplayTime(600)).toBe("10:00");
  });

  it("should format 3661 seconds as 61:01", () => {
    expect(formatDisplayTime(3661)).toBe("61:01");
  });
});
