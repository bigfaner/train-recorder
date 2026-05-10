/**
 * Unit tests for other sport page components and helpers.
 *
 * Tests helper functions, validation, formatting, and component exports.
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
  SportType,
  SportMetric,
  SportMetricValue,
} from "../../../src/types";
import {
  validateSportEntry,
  validateCustomSport,
  formatMetricValue,
  getSportIcon,
  buildMetricInputs,
  groupSportTypes,
  createEmptySportEntry,
  createEmptyCustomSport,
  formatSportDate,
  PRESET_SPORT_ICONS,
  PRESET_METRICS,
  DEFAULT_METRICS_BY_SPORT,
} from "../../../src/components/sport/sport-helpers";

// ============================================================
// Test Factories
// ============================================================

function makeSportType(overrides: Partial<SportType> = {}): SportType {
  return {
    id: 1,
    biz_key: 100n,
    sport_name: "游泳",
    icon: "swim",
    is_custom: 0,
    created_at: "2026-05-01T00:00:00",
    ...overrides,
  };
}

function makeSportMetric(overrides: Partial<SportMetric> = {}): SportMetric {
  return {
    id: 1,
    biz_key: 200n,
    sport_type_biz_key: 100n,
    metric_name: "距离",
    metric_unit: "m",
    is_custom: 0,
    order_index: 1,
    ...overrides,
  };
}

function makeSportMetricValue(
  overrides: Partial<SportMetricValue> = {},
): SportMetricValue {
  return {
    id: 1,
    biz_key: 300n,
    sport_record_biz_key: 400n,
    sport_metric_biz_key: 200n,
    metric_value: 1500,
    ...overrides,
  };
}

// ============================================================
// PRESET Constants Tests
// ============================================================

describe("PRESET constants", () => {
  it("has 4 preset sport icons", () => {
    expect(Object.keys(PRESET_SPORT_ICONS)).toHaveLength(4);
    expect(PRESET_SPORT_ICONS["游泳"]).toBe("swim");
    expect(PRESET_SPORT_ICONS["跑步"]).toBe("run");
    expect(PRESET_SPORT_ICONS["骑行"]).toBe("bike");
    expect(PRESET_SPORT_ICONS["瑜伽"]).toBe("yoga");
  });

  it("has 6 preset metrics", () => {
    expect(PRESET_METRICS).toHaveLength(6);
    const names = PRESET_METRICS.map((m) => m.metric_name);
    expect(names).toContain("距离");
    expect(names).toContain("时间");
    expect(names).toContain("趟数");
    expect(names).toContain("配速");
    expect(names).toContain("心率");
    expect(names).toContain("卡路里");
  });

  it("has default metrics for each preset sport", () => {
    expect(DEFAULT_METRICS_BY_SPORT["游泳"]).toHaveLength(3);
    expect(DEFAULT_METRICS_BY_SPORT["跑步"]).toHaveLength(5);
    expect(DEFAULT_METRICS_BY_SPORT["骑行"]).toHaveLength(4);
    expect(DEFAULT_METRICS_BY_SPORT["瑜伽"]).toHaveLength(2);
  });
});

// ============================================================
// Validation Tests
// ============================================================

describe("validateSportEntry", () => {
  it("rejects missing sport type", () => {
    const result = validateSportEntry({
      sportTypeBizKey: null,
      recordDate: "2026-05-08",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "1500",
          isCustom: 0,
        },
      ],
      note: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请选择运动类型");
  });

  it("rejects missing date", () => {
    const result = validateSportEntry({
      sportTypeBizKey: 100n,
      recordDate: "",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "1500",
          isCustom: 0,
        },
      ],
      note: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请选择日期");
  });

  it("rejects future date", () => {
    const result = validateSportEntry({
      sportTypeBizKey: 100n,
      recordDate: "2099-01-01",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "1500",
          isCustom: 0,
        },
      ],
      note: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("日期不能超过今天");
  });

  it("rejects when no metrics filled", () => {
    const result = validateSportEntry({
      sportTypeBizKey: 100n,
      recordDate: "2026-05-08",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "",
          isCustom: 0,
        },
      ],
      note: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请至少填写一项运动指标");
  });

  it("rejects invalid metric values (negative)", () => {
    const result = validateSportEntry({
      sportTypeBizKey: 100n,
      recordDate: "2026-05-08",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "-5",
          isCustom: 0,
        },
      ],
      note: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("距离数值无效");
  });

  it("rejects NaN metric values", () => {
    const result = validateSportEntry({
      sportTypeBizKey: 100n,
      recordDate: "2026-05-08",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "abc",
          isCustom: 0,
        },
      ],
      note: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("距离数值无效");
  });

  it("accepts valid entry with filled metrics", () => {
    const result = validateSportEntry({
      sportTypeBizKey: 100n,
      recordDate: "2026-01-01",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "1500",
          isCustom: 0,
        },
        {
          metricBizKey: 201n,
          metricName: "时间",
          metricUnit: "min",
          value: "45",
          isCustom: 0,
        },
      ],
      note: "Great swim",
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts zero as valid metric value", () => {
    const result = validateSportEntry({
      sportTypeBizKey: 100n,
      recordDate: "2026-01-01",
      metrics: [
        {
          metricBizKey: 200n,
          metricName: "距离",
          metricUnit: "m",
          value: "0",
          isCustom: 0,
        },
      ],
      note: "",
    });
    expect(result.isValid).toBe(true);
  });
});

describe("validateCustomSport", () => {
  it("rejects empty name", () => {
    const result = validateCustomSport({
      sportName: "",
      selectedPresetMetrics: ["时间"],
      customMetrics: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请输入运动名称");
  });

  it("rejects name longer than 20 chars", () => {
    const result = validateCustomSport({
      sportName: "a".repeat(21),
      selectedPresetMetrics: ["时间"],
      customMetrics: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("运动名称不能超过20个字符");
  });

  it("rejects when no metrics selected", () => {
    const result = validateCustomSport({
      sportName: "篮球",
      selectedPresetMetrics: [],
      customMetrics: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("请至少选择一项记录指标");
  });

  it("rejects custom metric with empty name", () => {
    const result = validateCustomSport({
      sportName: "篮球",
      selectedPresetMetrics: [],
      customMetrics: [{ name: "", unit: "分" }],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("自定义指标名称不能为空");
  });

  it("rejects custom metric name longer than 15 chars", () => {
    const result = validateCustomSport({
      sportName: "篮球",
      selectedPresetMetrics: [],
      customMetrics: [{ name: "a".repeat(16), unit: "分" }],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("指标名称不能超过15个字符");
  });

  it("accepts valid custom sport with preset metrics", () => {
    const result = validateCustomSport({
      sportName: "篮球",
      selectedPresetMetrics: ["时间", "卡路里"],
      customMetrics: [],
    });
    expect(result.isValid).toBe(true);
  });

  it("accepts valid custom sport with custom metrics", () => {
    const result = validateCustomSport({
      sportName: "攀岩",
      selectedPresetMetrics: [],
      customMetrics: [{ name: "高度", unit: "m" }],
    });
    expect(result.isValid).toBe(true);
  });
});

// ============================================================
// Formatting Tests
// ============================================================

describe("formatMetricValue", () => {
  it("returns empty for empty string", () => {
    expect(formatMetricValue("")).toBe("");
  });

  it("formats integer values without decimals", () => {
    expect(formatMetricValue("1500")).toBe("1500");
  });

  it("formats decimal values with 1 decimal place", () => {
    expect(formatMetricValue("3.14159")).toBe("3.1");
  });

  it("returns non-numeric strings as-is", () => {
    expect(formatMetricValue("abc")).toBe("abc");
  });
});

describe("formatSportDate", () => {
  it("formats ISO date to Chinese display", () => {
    expect(formatSportDate("2026-05-08")).toBe("2026年05月08日");
  });

  it("handles single digit month/day", () => {
    expect(formatSportDate("2026-01-09")).toBe("2026年01月09日");
  });
});

// ============================================================
// Sport Icon Tests
// ============================================================

describe("getSportIcon", () => {
  it("returns sport icon if set", () => {
    const sport = makeSportType({ icon: "swim" });
    expect(getSportIcon(sport)).toBe("swim");
  });

  it("falls back to PRESET_SPORT_ICONS by name", () => {
    const sport = makeSportType({ icon: null, sport_name: "跑步" });
    expect(getSportIcon(sport)).toBe("run");
  });

  it("falls back to 'custom' for unknown", () => {
    const sport = makeSportType({ icon: null, sport_name: "篮球" });
    expect(getSportIcon(sport)).toBe("custom");
  });
});

// ============================================================
// buildMetricInputs Tests
// ============================================================

describe("buildMetricInputs", () => {
  it("builds inputs from metric definitions", () => {
    const metrics = [
      makeSportMetric({
        biz_key: 200n,
        metric_name: "距离",
        metric_unit: "m",
        is_custom: 0,
      }),
      makeSportMetric({
        biz_key: 201n,
        metric_name: "时间",
        metric_unit: "min",
        is_custom: 0,
      }),
    ];
    const inputs = buildMetricInputs(metrics);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].metricBizKey).toBe(200n);
    expect(inputs[0].metricName).toBe("距离");
    expect(inputs[0].metricUnit).toBe("m");
    expect(inputs[0].value).toBe("");
  });

  it("pre-fills from existing values", () => {
    const metrics = [
      makeSportMetric({ biz_key: 200n, metric_name: "距离", metric_unit: "m" }),
    ];
    const values = [
      makeSportMetricValue({ sport_metric_biz_key: 200n, metric_value: 1500 }),
    ];
    const inputs = buildMetricInputs(metrics, values);
    expect(inputs[0].value).toBe("1500");
  });

  it("handles empty metrics", () => {
    expect(buildMetricInputs([])).toEqual([]);
  });
});

// ============================================================
// groupSportTypes Tests
// ============================================================

describe("groupSportTypes", () => {
  it("separates presets and custom types", () => {
    const types = [
      makeSportType({ id: 1, biz_key: 100n, sport_name: "游泳", is_custom: 0 }),
      makeSportType({ id: 2, biz_key: 101n, sport_name: "跑步", is_custom: 0 }),
      makeSportType({ id: 3, biz_key: 102n, sport_name: "篮球", is_custom: 1 }),
    ];
    const { presets, customs } = groupSportTypes(types);
    expect(presets).toHaveLength(2);
    expect(customs).toHaveLength(1);
    expect(customs[0].sport_name).toBe("篮球");
  });

  it("handles empty list", () => {
    const { presets, customs } = groupSportTypes([]);
    expect(presets).toHaveLength(0);
    expect(customs).toHaveLength(0);
  });
});

// ============================================================
// Factory Tests
// ============================================================

describe("createEmptySportEntry", () => {
  it("creates entry with today's date when no date given", () => {
    const entry = createEmptySportEntry();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(entry.recordDate).toBe(todayStr);
  });

  it("creates entry with provided date", () => {
    const entry = createEmptySportEntry("2026-05-01");
    expect(entry.recordDate).toBe("2026-05-01");
  });

  it("has null sport type and empty metrics", () => {
    const entry = createEmptySportEntry();
    expect(entry.sportTypeBizKey).toBeNull();
    expect(entry.metrics).toEqual([]);
    expect(entry.note).toBe("");
  });
});

describe("createEmptyCustomSport", () => {
  it("creates empty custom sport data", () => {
    const data = createEmptyCustomSport();
    expect(data.sportName).toBe("");
    expect(data.selectedPresetMetrics).toEqual([]);
    expect(data.customMetrics).toEqual([]);
  });
});

// ============================================================
// Component Export Tests (ensure modules are importable)
// ============================================================

describe("Component exports", () => {
  it("OtherSportScreen is importable", () => {
    const mod = require("../../../src/components/sport/OtherSportScreen");
    expect(mod.OtherSportScreen).toBeDefined();
    expect(typeof mod.OtherSportScreen).toBe("function");
  });

  it("SportTypeGrid is importable", () => {
    const mod = require("../../../src/components/sport/SportTypeGrid");
    expect(mod.SportTypeGrid).toBeDefined();
    expect(typeof mod.SportTypeGrid).toBe("function");
  });

  it("MetricInputForm is importable", () => {
    const mod = require("../../../src/components/sport/MetricInputForm");
    expect(mod.MetricInputForm).toBeDefined();
    expect(typeof mod.MetricInputForm).toBe("function");
  });

  it("CustomSportEditor is importable", () => {
    const mod = require("../../../src/components/sport/CustomSportEditor");
    expect(mod.CustomSportEditor).toBeDefined();
    expect(typeof mod.CustomSportEditor).toBe("function");
  });

  it("barrel export contains all components and helpers", () => {
    const mod = require("../../../src/components/sport");
    expect(mod.OtherSportScreen).toBeDefined();
    expect(mod.SportTypeGrid).toBeDefined();
    expect(mod.MetricInputForm).toBeDefined();
    expect(mod.CustomSportEditor).toBeDefined();
    expect(mod.validateSportEntry).toBeDefined();
    expect(mod.validateCustomSport).toBeDefined();
    expect(mod.formatMetricValue).toBeDefined();
    expect(mod.getSportIcon).toBeDefined();
    expect(mod.buildMetricInputs).toBeDefined();
    expect(mod.groupSportTypes).toBeDefined();
    expect(mod.createEmptySportEntry).toBeDefined();
    expect(mod.createEmptyCustomSport).toBeDefined();
    expect(mod.formatSportDate).toBeDefined();
  });
});
