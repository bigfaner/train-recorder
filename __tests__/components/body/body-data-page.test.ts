/**
 * Unit tests for body data page components and helpers.
 *
 * Tests helper functions, formatting, validation, and component exports.
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

import type { BodyMeasurement } from "../../../src/types";

function makeMeasurement(
  overrides: Partial<BodyMeasurement> = {},
): BodyMeasurement {
  return {
    id: 1,
    biz_key: 100n,
    record_date: "2026-05-01",
    body_weight: 75.0,
    chest_circumference: null,
    waist_circumference: null,
    arm_circumference: null,
    thigh_circumference: null,
    body_note: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

// ============================================================
// computeWeightChange Tests
// ============================================================

describe("computeWeightChange", () => {
  const {
    computeWeightChange,
  } = require("../../../src/components/body/body-helpers");

  it("returns null direction when no previous record", () => {
    const latest = makeMeasurement({ body_weight: 75.0 });
    const result = computeWeightChange(latest, null);
    expect(result.change).toBeNull();
    expect(result.direction).toBeNull();
    expect(result.arrow).toBe("");
  });

  it("returns null when latest weight is null", () => {
    const latest = makeMeasurement({ body_weight: null });
    const previous = makeMeasurement({ body_weight: 76.0 });
    const result = computeWeightChange(latest, previous);
    expect(result.change).toBeNull();
    expect(result.direction).toBeNull();
  });

  it("returns null when previous weight is null", () => {
    const latest = makeMeasurement({ body_weight: 75.0 });
    const previous = makeMeasurement({ body_weight: null });
    const result = computeWeightChange(latest, previous);
    expect(result.change).toBeNull();
    expect(result.direction).toBeNull();
  });

  it("detects weight increase (red arrow)", () => {
    const latest = makeMeasurement({ body_weight: 76.0 });
    const previous = makeMeasurement({ body_weight: 75.0 });
    const result = computeWeightChange(latest, previous);
    expect(result.change).toBe(1.0);
    expect(result.direction).toBe("up");
    expect(result.color).toBe("#ff3b30");
    expect(result.arrow).toBe(" ↑");
  });

  it("detects weight decrease (green arrow)", () => {
    const latest = makeMeasurement({ body_weight: 74.0 });
    const previous = makeMeasurement({ body_weight: 75.0 });
    const result = computeWeightChange(latest, previous);
    expect(result.change).toBe(-1.0);
    expect(result.direction).toBe("down");
    expect(result.color).toBe("#30d158");
    expect(result.arrow).toBe(" ↓");
  });

  it("detects same weight (no change)", () => {
    const latest = makeMeasurement({ body_weight: 75.0 });
    const previous = makeMeasurement({ body_weight: 75.0 });
    const result = computeWeightChange(latest, previous);
    expect(result.change).toBe(0);
    expect(result.direction).toBe("same");
    expect(result.color).toBe("#86868b");
    expect(result.arrow).toBe(" →");
  });

  it("handles small weight diff as same", () => {
    const latest = makeMeasurement({ body_weight: 75.02 });
    const previous = makeMeasurement({ body_weight: 75.0 });
    const result = computeWeightChange(latest, previous);
    expect(result.change).toBe(0);
    expect(result.direction).toBe("same");
  });
});

// ============================================================
// Formatting Tests
// ============================================================

describe("formatWeightValue", () => {
  const {
    formatWeightValue,
  } = require("../../../src/components/body/body-helpers");

  it("returns '--' for null", () => {
    expect(formatWeightValue(null)).toBe("--");
  });

  it("formats with 1 decimal place", () => {
    expect(formatWeightValue(75.0)).toBe("75.0");
    expect(formatWeightValue(80.5)).toBe("80.5");
  });
});

describe("formatWeightChange", () => {
  const {
    formatWeightChange,
  } = require("../../../src/components/body/body-helpers");

  it("returns '--' for null", () => {
    expect(formatWeightChange(null)).toBe("--");
  });

  it("formats zero change", () => {
    expect(formatWeightChange(0)).toBe("0.0 kg");
  });

  it("formats positive change with + sign", () => {
    expect(formatWeightChange(1.5)).toBe("+1.5 kg");
  });

  it("formats negative change without sign", () => {
    expect(formatWeightChange(-0.8)).toBe("-0.8 kg");
  });
});

describe("formatBodyDate", () => {
  const {
    formatBodyDate,
  } = require("../../../src/components/body/body-helpers");

  it("formats date as MM/DD", () => {
    expect(formatBodyDate("2026-05-01")).toBe("05/01");
    expect(formatBodyDate("2026-12-25")).toBe("12/25");
  });
});

describe("formatFormDate", () => {
  const {
    formatFormDate,
  } = require("../../../src/components/body/body-helpers");

  it("formats date as YYYY年MM月DD日", () => {
    expect(formatFormDate("2026-05-01")).toBe("2026年05月01日");
  });
});

// ============================================================
// buildTrendData Tests
// ============================================================

describe("buildTrendData", () => {
  const {
    buildTrendData,
  } = require("../../../src/components/body/body-helpers");

  it("builds trend data for body_weight", () => {
    const measurements = [
      makeMeasurement({ record_date: "2026-05-01", body_weight: 75.0 }),
      makeMeasurement({
        id: 2,
        record_date: "2026-05-02",
        body_weight: 74.5,
      }),
      makeMeasurement({
        id: 3,
        record_date: "2026-05-03",
        body_weight: null,
      }),
    ];

    const result = buildTrendData(measurements, "body_weight");
    expect(result).toEqual([
      { date: "2026-05-01", value: 75.0 },
      { date: "2026-05-02", value: 74.5 },
    ]);
  });

  it("filters out null values for circumference metrics", () => {
    const measurements = [
      makeMeasurement({
        record_date: "2026-05-01",
        chest_circumference: 95.0,
      }),
      makeMeasurement({
        id: 2,
        record_date: "2026-05-02",
        chest_circumference: null,
      }),
    ];

    const result = buildTrendData(measurements, "chest_circumference");
    expect(result).toEqual([{ date: "2026-05-01", value: 95.0 }]);
  });

  it("returns empty array for empty measurements", () => {
    const result = buildTrendData([], "body_weight");
    expect(result).toEqual([]);
  });
});

// ============================================================
// Validation Tests
// ============================================================

describe("validateBodyEntry", () => {
  const {
    validateBodyEntry,
  } = require("../../../src/components/body/body-helpers");

  it("validates a valid entry", () => {
    const result = validateBodyEntry({
      record_date: "2026-05-01",
      body_weight: 75.0,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects empty date", () => {
    const result = validateBodyEntry({
      record_date: "",
      body_weight: 75.0,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请选择日期");
  });

  it("rejects future date", () => {
    const result = validateBodyEntry({
      record_date: "2099-12-31",
      body_weight: 75.0,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("日期不能超过今天");
  });

  it("rejects null body weight", () => {
    const result = validateBodyEntry({
      record_date: "2026-05-01",
      body_weight: null,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请输入有效的体重");
  });

  it("rejects zero body weight", () => {
    const result = validateBodyEntry({
      record_date: "2026-05-01",
      body_weight: 0,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(false);
  });

  it("rejects body weight over 500", () => {
    const result = validateBodyEntry({
      record_date: "2026-05-01",
      body_weight: 600,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("体重数值异常");
  });

  it("rejects negative circumference values", () => {
    const result = validateBodyEntry({
      record_date: "2026-05-01",
      body_weight: 75.0,
      chest_circumference: -5,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("胸围数值无效");
  });

  it("accepts null circumference fields", () => {
    const result = validateBodyEntry({
      record_date: "2026-05-01",
      body_weight: 75.0,
      chest_circumference: null,
      waist_circumference: null,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
    });
    expect(result.isValid).toBe(true);
  });

  it("accepts positive circumference values", () => {
    const result = validateBodyEntry({
      record_date: "2026-05-01",
      body_weight: 75.0,
      chest_circumference: 95.0,
      waist_circumference: 80.0,
      arm_circumference: 32.0,
      thigh_circumference: 55.0,
      body_note: "test note",
    });
    expect(result.isValid).toBe(true);
  });
});

// ============================================================
// sortByDateDesc Tests
// ============================================================

describe("sortByDateDesc", () => {
  const {
    sortByDateDesc,
  } = require("../../../src/components/body/body-helpers");

  it("sorts measurements by date descending", () => {
    const measurements = [
      makeMeasurement({ id: 1, record_date: "2026-05-01" }),
      makeMeasurement({ id: 2, record_date: "2026-05-03" }),
      makeMeasurement({ id: 3, record_date: "2026-05-02" }),
    ];

    const sorted = sortByDateDesc(measurements);
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });

  it("does not mutate original array", () => {
    const measurements = [
      makeMeasurement({ id: 1, record_date: "2026-05-01" }),
      makeMeasurement({ id: 2, record_date: "2026-05-03" }),
    ];

    const sorted = sortByDateDesc(measurements);
    expect(measurements[0].id).toBe(1);
    expect(sorted[0].id).toBe(2);
  });
});

// ============================================================
// createEmptyEntry Tests
// ============================================================

describe("createEmptyEntry", () => {
  const {
    createEmptyEntry,
  } = require("../../../src/components/body/body-helpers");

  it("creates entry with today's date", () => {
    const entry = createEmptyEntry();
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(entry.record_date).toBe(expectedDate);
    expect(entry.body_weight).toBeNull();
    expect(entry.chest_circumference).toBeNull();
    expect(entry.waist_circumference).toBeNull();
    expect(entry.arm_circumference).toBeNull();
    expect(entry.thigh_circumference).toBeNull();
    expect(entry.body_note).toBeNull();
  });
});

// ============================================================
// measurementToEntry Tests
// ============================================================

describe("measurementToEntry", () => {
  const {
    measurementToEntry,
  } = require("../../../src/components/body/body-helpers");

  it("converts measurement to entry data", () => {
    const m = makeMeasurement({
      record_date: "2026-05-01",
      body_weight: 75.0,
      chest_circumference: 95.0,
      waist_circumference: null,
      arm_circumference: 32.0,
      thigh_circumference: null,
      body_note: "test",
    });

    const entry = measurementToEntry(m);
    expect(entry.record_date).toBe("2026-05-01");
    expect(entry.body_weight).toBe(75.0);
    expect(entry.chest_circumference).toBe(95.0);
    expect(entry.waist_circumference).toBeNull();
    expect(entry.arm_circumference).toBe(32.0);
    expect(entry.thigh_circumference).toBeNull();
    expect(entry.body_note).toBe("test");
  });
});

// ============================================================
// filterByDateRange Tests
// ============================================================

describe("filterByDateRange", () => {
  const {
    filterByDateRange,
  } = require("../../../src/components/body/body-helpers");

  it("filters measurements within date range", () => {
    const measurements = [
      makeMeasurement({ id: 1, record_date: "2026-04-28" }),
      makeMeasurement({ id: 2, record_date: "2026-05-01" }),
      makeMeasurement({ id: 3, record_date: "2026-05-05" }),
      makeMeasurement({ id: 4, record_date: "2026-05-10" }),
    ];

    const result = filterByDateRange(measurements, "2026-05-01", "2026-05-05");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(3);
  });

  it("includes boundary dates", () => {
    const measurements = [
      makeMeasurement({ id: 1, record_date: "2026-05-01" }),
      makeMeasurement({ id: 2, record_date: "2026-05-05" }),
    ];

    const result = filterByDateRange(measurements, "2026-05-01", "2026-05-05");
    expect(result).toHaveLength(2);
  });

  it("returns empty for no matches", () => {
    const measurements = [
      makeMeasurement({ id: 1, record_date: "2026-04-28" }),
    ];

    const result = filterByDateRange(measurements, "2026-05-01", "2026-05-05");
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// Component Export Tests
// ============================================================

describe("Body data component exports", () => {
  it("exports BodyDataScreen", () => {
    const {
      BodyDataScreen,
    } = require("../../../src/components/body/BodyDataScreen");
    expect(typeof BodyDataScreen).toBe("function");
  });

  it("exports LatestDataCard", () => {
    const {
      LatestDataCard,
    } = require("../../../src/components/body/LatestDataCard");
    expect(typeof LatestDataCard).toBe("function");
  });

  it("exports TrendChart", () => {
    const { TrendChart } = require("../../../src/components/body/TrendChart");
    expect(typeof TrendChart).toBe("function");
  });

  it("exports BodyEntryForm", () => {
    const {
      BodyEntryForm,
    } = require("../../../src/components/body/BodyEntryForm");
    expect(typeof BodyEntryForm).toBe("function");
  });

  it("exports HistoryList", () => {
    const { HistoryList } = require("../../../src/components/body/HistoryList");
    expect(typeof HistoryList).toBe("function");
  });

  it("exports EmptyBodyState", () => {
    const {
      EmptyBodyState,
    } = require("../../../src/components/body/EmptyBodyState");
    expect(typeof EmptyBodyState).toBe("function");
  });
});

// ============================================================
// Body Data Route Test
// ============================================================

describe("BodyDataScreen route", () => {
  it("exports a default function component", () => {
    const BodyDataRoute = require("../../../app/body-data").default;
    expect(typeof BodyDataRoute).toBe("function");
  });
});
