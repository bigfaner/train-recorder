/**
 * Unit tests for stats page components and helpers.
 *
 * Tests component rendering with mocked React Native primitives.
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

// Types imported for use in test data construction below

// ============================================================
// HeroCard formatVolume & formatChangePct Tests
// ============================================================

describe("HeroCard formatting", () => {
  const {
    formatVolume,
    formatChangePct,
  } = require("../../../src/components/stats/HeroCard");

  describe("formatVolume", () => {
    it("formats volume with locale string", () => {
      expect(formatVolume(18450)).toBe("18,450");
      expect(formatVolume(0)).toBe("0");
      expect(formatVolume(500)).toBe("500");
    });
  });

  describe("formatChangePct", () => {
    it("returns '--' for null", () => {
      expect(formatChangePct(null)).toBe("--");
    });

    it("formats positive change with + sign", () => {
      expect(formatChangePct(0.12)).toBe("+12%");
      expect(formatChangePct(0.05)).toBe("+5%");
    });

    it("formats negative change with - sign", () => {
      expect(formatChangePct(-0.08)).toBe("-8%");
      expect(formatChangePct(-0.25)).toBe("-25%");
    });

    it("formats zero change", () => {
      expect(formatChangePct(0)).toBe("+0%");
    });
  });
});

// ============================================================
// PRList formatWeight Tests
// ============================================================

describe("PRList formatting", () => {
  const { formatWeight } = require("../../../src/components/stats/PRList");

  describe("formatWeight", () => {
    it("formats integer weights without decimals", () => {
      expect(formatWeight(80)).toBe("80 kg");
      expect(formatWeight(120)).toBe("120 kg");
    });

    it("formats decimal weights with one decimal place", () => {
      expect(formatWeight(116.67)).toBe("116.7 kg");
      expect(formatWeight(80.5)).toBe("80.5 kg");
    });
  });
});

// ============================================================
// TrainingHeatmap getIntensityColor Tests
// ============================================================

describe("TrainingHeatmap intensity colors", () => {
  const {
    getIntensityColor,
  } = require("../../../src/components/stats/TrainingHeatmap");

  it("returns light grey for rest intensity", () => {
    expect(getIntensityColor(0.1)).toBe("#ebedf0");
  });

  it("returns light green for low intensity", () => {
    expect(getIntensityColor(0.4)).toBe("#9be9a8");
  });

  it("returns medium green for moderate intensity", () => {
    expect(getIntensityColor(0.6)).toBe("#40c463");
  });

  it("returns dark green for high intensity", () => {
    expect(getIntensityColor(0.8)).toBe("#30a14e");
  });

  it("returns darkest green for heavy intensity", () => {
    expect(getIntensityColor(0.9)).toBe("#216e39");
  });

  it("returns light grey for zero intensity", () => {
    expect(getIntensityColor(0)).toBe("#ebedf0");
  });
});

// ============================================================
// WeeklyVolumeChart formatCompact Tests
// ============================================================

describe("WeeklyVolumeChart formatting", () => {
  const {
    formatCompact,
  } = require("../../../src/components/stats/WeeklyVolumeChart");

  it("formats large values with k suffix", () => {
    expect(formatCompact(18450)).toBe("18k");
    expect(formatCompact(10000)).toBe("10k");
  });

  it("formats small values as-is", () => {
    expect(formatCompact(500)).toBe("500");
    expect(formatCompact(0)).toBe("0");
  });
});

// ============================================================
// Component Export Tests (verify modules can be imported)
// ============================================================

describe("Stats components export check", () => {
  it("exports HeroCard", () => {
    const { HeroCard } = require("../../../src/components/stats/HeroCard");
    expect(typeof HeroCard).toBe("function");
  });

  it("exports FourGridSummary", () => {
    const {
      FourGridSummary,
    } = require("../../../src/components/stats/FourGridSummary");
    expect(typeof FourGridSummary).toBe("function");
  });

  it("exports WeeklyVolumeChart", () => {
    const {
      WeeklyVolumeChart,
    } = require("../../../src/components/stats/WeeklyVolumeChart");
    expect(typeof WeeklyVolumeChart).toBe("function");
  });

  it("exports PRList", () => {
    const { PRList } = require("../../../src/components/stats/PRList");
    expect(typeof PRList).toBe("function");
  });

  it("exports TrainingHeatmap", () => {
    const {
      TrainingHeatmap,
    } = require("../../../src/components/stats/TrainingHeatmap");
    expect(typeof TrainingHeatmap).toBe("function");
  });

  it("exports EmptyStatsState", () => {
    const {
      EmptyStatsState,
    } = require("../../../src/components/stats/EmptyStatsState");
    expect(typeof EmptyStatsState).toBe("function");
  });
});

// ============================================================
// Stats Screen Integration Test
// ============================================================

describe("StatsScreen", () => {
  it("exports a default function component", () => {
    const StatsScreen = require("../../../app/(tabs)/stats").default;
    expect(typeof StatsScreen).toBe("function");
  });
});
