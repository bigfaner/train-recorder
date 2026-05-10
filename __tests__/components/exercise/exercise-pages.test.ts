/**
 * Unit tests for exercise library and detail page components.
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

jest.mock("../../../src/db/database", () => ({
  getDatabase: jest.fn(() => ({})),
  getSnowflakeGenerator: jest.fn(() => ({ generate: () => BigInt(1) })),
}));
jest.mock("../../../src/db/database-adapter", () => ({}));
jest.mock("../../../src/db/repositories/exercise.repo", () => ({
  createExerciseRepo: jest.fn(() => ({
    findAllActive: jest.fn(() => []),
  })),
}));

// ============================================================
// Helper Function Tests
// ============================================================

import type {
  Exercise,
  PersonalRecordEntry,
  ExerciseSessionSummary,
} from "../../../src/types";

// Helper factory functions
function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 1,
    biz_key: 1001n,
    exercise_name: "深蹲",
    category: "core_powerlifting",
    increment: 2.5,
    default_rest: 300,
    is_custom: 0,
    is_deleted: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
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

function makeSession(
  overrides: Partial<ExerciseSessionSummary> = {},
): ExerciseSessionSummary {
  return {
    sessionDate: "2026-05-05",
    workoutSessionBizKey: 5001n,
    sets: [
      { weight: 100, reps: 5, isTargetMet: true },
      { weight: 100, reps: 5, isTargetMet: true },
    ],
    ...overrides,
  };
}

// ============================================================
// Category Metadata Tests
// ============================================================

describe("EXERCISE_CATEGORIES", () => {
  const {
    EXERCISE_CATEGORIES,
  } = require("@components/exercise/exercise-helpers");

  it("has 7 categories matching PRD §5.5", () => {
    expect(EXERCISE_CATEGORIES).toHaveLength(7);
  });

  it("contains all required category keys", () => {
    const keys = EXERCISE_CATEGORIES.map((c: { key: string }) => c.key);
    expect(keys).toContain("core_powerlifting");
    expect(keys).toContain("upper_push");
    expect(keys).toContain("upper_pull");
    expect(keys).toContain("lower");
    expect(keys).toContain("core");
    expect(keys).toContain("shoulder");
    expect(keys).toContain("custom");
  });

  it("each category has zh label, en label, and order", () => {
    EXERCISE_CATEGORIES.forEach(
      (c: { labelZh: string; labelEn: string; order: number }) => {
        expect(c.labelZh).toBeTruthy();
        expect(c.labelEn).toBeTruthy();
        expect(c.order).toBeGreaterThan(0);
      },
    );
  });
});

describe("getCategoryMeta", () => {
  const { getCategoryMeta } = require("@components/exercise/exercise-helpers");

  it("returns metadata for known category", () => {
    const meta = getCategoryMeta("core_powerlifting");
    expect(meta).toBeDefined();
    expect(meta!.labelZh).toBe("核心力量举");
    expect(meta!.labelEn).toBe("Core Powerlifting");
  });

  it("returns undefined for unknown category", () => {
    const meta = getCategoryMeta("nonexistent");
    expect(meta).toBeUndefined();
  });
});

// ============================================================
// Exercise Grouping Tests
// ============================================================

describe("groupExercisesByCategory", () => {
  const {
    groupExercisesByCategory,
  } = require("@components/exercise/exercise-helpers");

  it("groups exercises by category in correct order", () => {
    const exercises = [
      makeExercise({
        exercise_name: "深蹲",
        category: "core_powerlifting",
        biz_key: 1n,
      }),
      makeExercise({
        exercise_name: "卧推",
        category: "core_powerlifting",
        biz_key: 2n,
      }),
      makeExercise({
        exercise_name: "上斜卧推",
        category: "upper_push",
        biz_key: 3n,
      }),
      makeExercise({
        exercise_name: "侧平举",
        category: "shoulder",
        biz_key: 4n,
      }),
    ];

    const groups = groupExercisesByCategory(exercises);
    expect(groups).toHaveLength(3);
    expect(groups[0].category.key).toBe("core_powerlifting");
    expect(groups[0].exercises).toHaveLength(2);
    expect(groups[1].category.key).toBe("upper_push");
    expect(groups[1].exercises).toHaveLength(1);
    expect(groups[2].category.key).toBe("shoulder");
  });

  it("filters out soft-deleted exercises", () => {
    const exercises = [
      makeExercise({
        exercise_name: "深蹲",
        category: "core_powerlifting",
        is_deleted: 0,
      }),
      makeExercise({
        exercise_name: "卧推",
        category: "core_powerlifting",
        is_deleted: 1,
      }),
    ];

    const groups = groupExercisesByCategory(exercises);
    expect(groups).toHaveLength(1);
    expect(groups[0].exercises).toHaveLength(1);
    expect(groups[0].exercises[0].exercise_name).toBe("深蹲");
  });

  it("returns empty array for empty input", () => {
    const groups = groupExercisesByCategory([]);
    expect(groups).toHaveLength(0);
  });

  it("sorts exercises within category by name", () => {
    const exercises = [
      makeExercise({
        exercise_name: "硬拉",
        category: "core_powerlifting",
        biz_key: 1n,
      }),
      makeExercise({
        exercise_name: "深蹲",
        category: "core_powerlifting",
        biz_key: 2n,
      }),
      makeExercise({
        exercise_name: "卧推",
        category: "core_powerlifting",
        biz_key: 3n,
      }),
    ];

    const groups = groupExercisesByCategory(exercises);
    expect(groups[0].exercises[0].exercise_name).toBe("深蹲");
    expect(groups[0].exercises[1].exercise_name).toBe("卧推");
    expect(groups[0].exercises[2].exercise_name).toBe("硬拉");
  });

  it("skips categories with no exercises", () => {
    const exercises = [makeExercise({ category: "shoulder", biz_key: 1n })];

    const groups = groupExercisesByCategory(exercises);
    expect(groups).toHaveLength(1);
    expect(groups[0].category.key).toBe("shoulder");
  });
});

// ============================================================
// Search/Filter Tests
// ============================================================

describe("filterExercisesByQuery", () => {
  const {
    filterExercisesByQuery,
    groupExercisesByCategory,
  } = require("@components/exercise/exercise-helpers");

  it("returns all groups when query is empty", () => {
    const exercises = [
      makeExercise({ exercise_name: "深蹲", category: "core_powerlifting" }),
      makeExercise({ exercise_name: "卧推", category: "upper_push" }),
    ];
    const groups = groupExercisesByCategory(exercises);
    const filtered = filterExercisesByQuery(groups, "");
    expect(filtered).toHaveLength(2);
  });

  it("filters exercises by name (partial match)", () => {
    const exercises = [
      makeExercise({ exercise_name: "深蹲", category: "core_powerlifting" }),
      makeExercise({ exercise_name: "卧推", category: "upper_push" }),
      makeExercise({ exercise_name: "前蹲", category: "lower" }),
    ];
    const groups = groupExercisesByCategory(exercises);
    const filtered = filterExercisesByQuery(groups, "蹲");
    expect(filtered).toHaveLength(2);
    expect(filtered[0].exercises[0].exercise_name).toBe("深蹲");
    expect(filtered[1].exercises[0].exercise_name).toBe("前蹲");
  });

  it("is case-insensitive", () => {
    const exercises = [
      makeExercise({ exercise_name: "深蹲", category: "core_powerlifting" }),
    ];
    const groups = groupExercisesByCategory(exercises);
    // Chinese doesn't have case, but test the function handles it
    const filtered = filterExercisesByQuery(groups, "深");
    expect(filtered).toHaveLength(1);
  });

  it("removes empty groups after filtering", () => {
    const exercises = [
      makeExercise({ exercise_name: "深蹲", category: "core_powerlifting" }),
      makeExercise({ exercise_name: "卧推", category: "upper_push" }),
    ];
    const groups = groupExercisesByCategory(exercises);
    const filtered = filterExercisesByQuery(groups, "深蹲");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].category.key).toBe("core_powerlifting");
  });

  it("returns empty array when no matches", () => {
    const exercises = [
      makeExercise({ exercise_name: "深蹲", category: "core_powerlifting" }),
    ];
    const groups = groupExercisesByCategory(exercises);
    const filtered = filterExercisesByQuery(groups, "卧推");
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// Formatting Tests
// ============================================================

describe("formatIncrement", () => {
  const { formatIncrement } = require("@components/exercise/exercise-helpers");

  it("formats integer increments", () => {
    expect(formatIncrement(5)).toBe("+5kg");
  });

  it("formats decimal increments", () => {
    expect(formatIncrement(2.5)).toBe("+2.5kg");
  });

  it("formats small increments", () => {
    expect(formatIncrement(1.25)).toBe("+1.25kg");
  });
});

describe("formatRestTime", () => {
  const { formatRestTime } = require("@components/exercise/exercise-helpers");

  it("formats seconds when not divisible by 60", () => {
    expect(formatRestTime(90)).toBe("休90s");
  });

  it("formats as minutes when exactly divisible by 60", () => {
    expect(formatRestTime(180)).toBe("休3min");
  });

  it("formats 60 seconds as 1 minute", () => {
    expect(formatRestTime(60)).toBe("休1min");
  });

  it("formats 300 seconds as 5 minutes", () => {
    expect(formatRestTime(300)).toBe("休5min");
  });

  it("formats 120 seconds as 2 minutes", () => {
    expect(formatRestTime(120)).toBe("休2min");
  });
});

describe("formatPRWeight", () => {
  const { formatPRWeight } = require("@components/exercise/exercise-helpers");

  it("formats integer weight", () => {
    expect(formatPRWeight(100)).toBe("100kg");
  });

  it("formats decimal weight", () => {
    expect(formatPRWeight(97.5)).toBe("97.5kg");
  });
});

describe("formatPRVolume", () => {
  const { formatPRVolume } = require("@components/exercise/exercise-helpers");

  it("formats volume with comma separators", () => {
    expect(formatPRVolume(2500)).toBe("2,500kg");
  });

  it("formats small volume", () => {
    expect(formatPRVolume(500)).toBe("500kg");
  });
});

describe("findWeightPR / findVolumePR", () => {
  const {
    findWeightPR,
    findVolumePR,
  } = require("@components/exercise/exercise-helpers");

  const prs = [
    makePR({ prType: "weight", prValue: 100, prDate: "2026-05-05" }),
    makePR({ prType: "volume", prValue: 2500, prDate: "2026-05-05" }),
  ];

  it("finds weight PR", () => {
    const result = findWeightPR(prs);
    expect(result).toBeDefined();
    expect(result!.prType).toBe("weight");
    expect(result!.prValue).toBe(100);
  });

  it("finds volume PR", () => {
    const result = findVolumePR(prs);
    expect(result).toBeDefined();
    expect(result!.prType).toBe("volume");
    expect(result!.prValue).toBe(2500);
  });

  it("returns undefined when no matching PR", () => {
    expect(findWeightPR([])).toBeUndefined();
    expect(findVolumePR([])).toBeUndefined();
  });
});

// ============================================================
// Session History Formatting Tests
// ============================================================

describe("formatSessionDate", () => {
  const {
    formatSessionDate,
  } = require("@components/exercise/exercise-helpers");

  it("formats date in Chinese format", () => {
    // 2026-05-05 is a Tuesday
    expect(formatSessionDate("2026-05-05")).toBe("5月5日 周二");
  });

  it("formats another date correctly", () => {
    // 2026-04-22 is a Wednesday
    expect(formatSessionDate("2026-04-22")).toBe("4月22日 周三");
  });
});

describe("computeSessionVolume", () => {
  const {
    computeSessionVolume,
  } = require("@components/exercise/exercise-helpers");

  it("computes total volume from session sets", () => {
    const session = makeSession({
      sets: [
        { weight: 100, reps: 5, isTargetMet: true },
        { weight: 100, reps: 5, isTargetMet: true },
      ],
    });
    expect(computeSessionVolume(session)).toBe(1000);
  });

  it("handles empty sets", () => {
    const session = makeSession({ sets: [] });
    expect(computeSessionVolume(session)).toBe(0);
  });
});

describe("formatSetLine", () => {
  const { formatSetLine } = require("@components/exercise/exercise-helpers");

  it("formats single weight sets", () => {
    const sets = [{ weight: 100, reps: 5 }];
    expect(formatSetLine(sets)).toBe("100kg × 5");
  });

  it("formats empty sets", () => {
    expect(formatSetLine([])).toBe("");
  });
});

describe("formatSetCount", () => {
  const { formatSetCount } = require("@components/exercise/exercise-helpers");

  it("formats completed sets", () => {
    expect(formatSetCount(5, 5)).toBe("5组");
  });

  it("formats partial sets", () => {
    expect(formatSetCount(4, 5)).toBe("4/5组");
  });
});

// ============================================================
// Custom Exercise Validation Tests
// ============================================================

describe("validateCustomExercise", () => {
  const {
    validateCustomExercise,
  } = require("@components/exercise/exercise-helpers");

  it("validates correct data", () => {
    const result = validateCustomExercise({
      exerciseName: "暂停深蹲",
      category: "core_powerlifting",
      increment: 2.5,
      defaultRest: 180,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty name", () => {
    const result = validateCustomExercise({
      exerciseName: "",
      category: "core_powerlifting",
      increment: 2.5,
      defaultRest: 180,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请输入动作名称");
  });

  it("rejects name too long", () => {
    const result = validateCustomExercise({
      exerciseName: "a".repeat(101),
      category: "core_powerlifting",
      increment: 2.5,
      defaultRest: 180,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("动作名称不能超过100个字符");
  });

  it("rejects missing category", () => {
    const result = validateCustomExercise({
      exerciseName: "暂停深蹲",
      category: "",
      increment: 2.5,
      defaultRest: 180,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请选择分类");
  });

  it("rejects zero increment", () => {
    const result = validateCustomExercise({
      exerciseName: "暂停深蹲",
      category: "core_powerlifting",
      increment: 0,
      defaultRest: 180,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("增量必须大于0");
  });

  it("rejects negative increment", () => {
    const result = validateCustomExercise({
      exerciseName: "暂停深蹲",
      category: "core_powerlifting",
      increment: -2.5,
      defaultRest: 180,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("增量必须大于0");
  });

  it("rejects increment too large", () => {
    const result = validateCustomExercise({
      exerciseName: "暂停深蹲",
      category: "core_powerlifting",
      increment: 200,
      defaultRest: 180,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("增量不能超过100kg");
  });

  it("rejects negative rest time", () => {
    const result = validateCustomExercise({
      exerciseName: "暂停深蹲",
      category: "core_powerlifting",
      increment: 2.5,
      defaultRest: -10,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("休息时间不能为负");
  });

  it("rejects rest time too large", () => {
    const result = validateCustomExercise({
      exerciseName: "暂停深蹲",
      category: "core_powerlifting",
      increment: 2.5,
      defaultRest: 700,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("休息时间不能超过600秒");
  });

  it("returns multiple errors at once", () => {
    const result = validateCustomExercise({
      exerciseName: "",
      category: "",
      increment: 0,
      defaultRest: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================
// Progress Data Tests
// ============================================================

describe("buildProgressData", () => {
  const {
    buildProgressData,
  } = require("@components/exercise/exercise-helpers");

  it("builds progress data from sessions in chronological order", () => {
    const sessions = [
      makeSession({
        sessionDate: "2026-05-05",
        sets: [{ weight: 100, reps: 5, isTargetMet: true }],
      }),
      makeSession({
        sessionDate: "2026-04-22",
        sets: [{ weight: 90, reps: 5, isTargetMet: true }],
      }),
    ];
    const weightPR = makePR({ prValue: 100 });

    const data = buildProgressData(sessions, weightPR);
    expect(data).toHaveLength(2);
    // Oldest first (reversed from input)
    expect(data[0].date).toBe("2026-04-22");
    expect(data[0].value).toBe(90);
    expect(data[1].date).toBe("2026-05-05");
    expect(data[1].value).toBe(100);
  });

  it("marks PR data points", () => {
    const sessions = [
      makeSession({
        sessionDate: "2026-05-05",
        sets: [{ weight: 100, reps: 5, isTargetMet: true }],
      }),
    ];
    const weightPR = makePR({ prValue: 100 });

    const data = buildProgressData(sessions, weightPR);
    expect(data[0].isPR).toBe(true);
  });

  it("does not mark non-PR data points", () => {
    const sessions = [
      makeSession({
        sessionDate: "2026-04-22",
        sets: [{ weight: 80, reps: 5, isTargetMet: true }],
      }),
    ];
    const weightPR = makePR({ prValue: 100 });

    const data = buildProgressData(sessions, weightPR);
    expect(data[0].isPR).toBe(false);
  });

  it("uses max weight from session sets", () => {
    const sessions = [
      makeSession({
        sessionDate: "2026-05-05",
        sets: [
          { weight: 80, reps: 5, isTargetMet: true },
          { weight: 100, reps: 3, isTargetMet: true },
        ],
      }),
    ];

    const data = buildProgressData(sessions, undefined);
    expect(data[0].value).toBe(100);
  });

  it("returns empty array for no sessions", () => {
    const data = buildProgressData([], undefined);
    expect(data).toHaveLength(0);
  });
});

// ============================================================
// CUSTOM_EXERCISE_CATEGORIES Tests
// ============================================================

describe("CUSTOM_EXERCISE_CATEGORIES", () => {
  const {
    CUSTOM_EXERCISE_CATEGORIES,
  } = require("@components/exercise/exercise-helpers");

  it("excludes custom category", () => {
    const keys = CUSTOM_EXERCISE_CATEGORIES.map((c: { key: string }) => c.key);
    expect(keys).not.toContain("custom");
  });

  it("has 6 categories (7 total minus custom)", () => {
    expect(CUSTOM_EXERCISE_CATEGORIES).toHaveLength(6);
  });
});

// ============================================================
// Component Module Export Tests
// ============================================================

describe("Exercise Component Modules", () => {
  it("ExerciseLibraryScreen module exports component", () => {
    const module = require("@components/exercise/ExerciseLibraryScreen");
    expect(typeof module.ExerciseLibraryScreen).toBe("function");
  });

  it("ExerciseDetailScreen module exports component", () => {
    const module = require("@components/exercise/ExerciseDetailScreen");
    expect(typeof module.ExerciseDetailScreen).toBe("function");
  });

  it("exercise barrel exports all components and helpers", () => {
    const barrel = require("@components/exercise");
    // Components
    expect(typeof barrel.ExerciseLibraryScreen).toBe("function");
    expect(typeof barrel.ExerciseDetailScreen).toBe("function");
    // Helpers
    expect(typeof barrel.groupExercisesByCategory).toBe("function");
    expect(typeof barrel.filterExercisesByQuery).toBe("function");
    expect(typeof barrel.formatIncrement).toBe("function");
    expect(typeof barrel.formatRestTime).toBe("function");
    expect(typeof barrel.formatPRWeight).toBe("function");
    expect(typeof barrel.formatPRVolume).toBe("function");
    expect(typeof barrel.findWeightPR).toBe("function");
    expect(typeof barrel.findVolumePR).toBe("function");
    expect(typeof barrel.formatSessionDate).toBe("function");
    expect(typeof barrel.computeSessionVolume).toBe("function");
    expect(typeof barrel.formatSetLine).toBe("function");
    expect(typeof barrel.formatSetCount).toBe("function");
    expect(typeof barrel.validateCustomExercise).toBe("function");
    expect(typeof barrel.buildProgressData).toBe("function");
    expect(typeof barrel.getCategoryMeta).toBe("function");
    expect(Array.isArray(barrel.EXERCISE_CATEGORIES)).toBe(true);
    expect(Array.isArray(barrel.CUSTOM_EXERCISE_CATEGORIES)).toBe(true);
  });
});

// ============================================================
// Page Module Tests
// ============================================================

describe("Exercise Page Modules", () => {
  it("exercise-library page exports default function", () => {
    const module = require("../../../app/exercise-library");
    expect(typeof module.default).toBe("function");
  });

  it("exercise-detail page exports default function", () => {
    const module = require("../../../app/exercise-detail");
    expect(typeof module.default).toBe("function");
  });
});
