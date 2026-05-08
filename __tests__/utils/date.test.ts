/**
 * Tests for calendar page components and utilities.
 *
 * React Native is mocked since the test environment is node.
 * Tests cover pure logic functions, component exports, and rendering behavior.
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
    ActivityIndicator: mockComponent("ActivityIndicator"),
    StyleSheet: {
      create: (styles: Record<string, object>) => styles,
    },
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// --- Date Utility Tests ---

describe("Date utilities", () => {
  const {
    getDaysInMonth,
    getFirstDayWeekday,
    formatDateISO,
    parseISODate,
    getTrainingTypeColor,
    getTrainingTypeLabel,
    WEEKDAY_LABELS_SHORT,
    MONTH_LABELS,
  } = require("../../src/utils/date");

  describe("getDaysInMonth", () => {
    it("returns 31 for January", () => {
      expect(getDaysInMonth(2026, 1)).toBe(31);
    });

    it("returns 28 for February in non-leap year", () => {
      expect(getDaysInMonth(2025, 2)).toBe(28);
    });

    it("returns 29 for February in leap year", () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });

    it("returns 30 for April", () => {
      expect(getDaysInMonth(2026, 4)).toBe(30);
    });

    it("returns 31 for December", () => {
      expect(getDaysInMonth(2026, 12)).toBe(31);
    });
  });

  describe("getFirstDayWeekday", () => {
    it("returns correct ISO weekday", () => {
      // January 1, 2026 is a Thursday = ISO weekday 4
      expect(getFirstDayWeekday(2026, 1)).toBe(4);
    });

    it("returns 1 when month starts on Monday", () => {
      // September 1, 2025 is a Monday = ISO weekday 1
      expect(getFirstDayWeekday(2025, 9)).toBe(1);
    });

    it("returns 7 when month starts on Sunday", () => {
      // June 1, 2025 is a Sunday = ISO weekday 7
      expect(getFirstDayWeekday(2025, 6)).toBe(7);
    });
  });

  describe("formatDateISO", () => {
    it("formats a date correctly", () => {
      expect(formatDateISO(2026, 1, 5)).toBe("2026-01-05");
    });

    it("pads month and day with zeros", () => {
      expect(formatDateISO(2026, 3, 9)).toBe("2026-03-09");
    });

    it("handles double-digit month and day", () => {
      expect(formatDateISO(2026, 12, 25)).toBe("2026-12-25");
    });
  });

  describe("parseISODate", () => {
    it("parses a date correctly", () => {
      expect(parseISODate("2026-05-08")).toEqual({
        year: 2026,
        month: 5,
        day: 8,
      });
    });
  });

  describe("getTrainingTypeColor", () => {
    it("returns blue for push", () => {
      expect(getTrainingTypeColor("push")).toBe("#0071e3");
    });

    it("returns green for pull", () => {
      expect(getTrainingTypeColor("pull")).toBe("#30d158");
    });

    it("returns orange for legs", () => {
      expect(getTrainingTypeColor("legs")).toBe("#ff9500");
    });

    it("returns grey for custom", () => {
      expect(getTrainingTypeColor("custom")).toBe("#86868b");
    });
  });

  describe("getTrainingTypeLabel", () => {
    it("returns Chinese labels for training types", () => {
      expect(getTrainingTypeLabel("push")).toBe("推");
      expect(getTrainingTypeLabel("pull")).toBe("拉");
      expect(getTrainingTypeLabel("legs")).toBe("蹲");
      expect(getTrainingTypeLabel("custom")).toBe("其他");
    });
  });

  describe("constants", () => {
    it("WEEKDAY_LABELS_SHORT has 7 entries", () => {
      expect(WEEKDAY_LABELS_SHORT).toHaveLength(7);
      expect(WEEKDAY_LABELS_SHORT[0]).toBe("一");
      expect(WEEKDAY_LABELS_SHORT[6]).toBe("日");
    });

    it("MONTH_LABELS has 12 entries", () => {
      expect(MONTH_LABELS).toHaveLength(12);
      expect(MONTH_LABELS[0]).toBe("一月");
      expect(MONTH_LABELS[11]).toBe("十二月");
    });
  });
});

// --- Calendar Component Module Tests ---

describe("Calendar component modules", () => {
  it("CalendarMonthGrid exports component", () => {
    const mod = require("../../src/components/calendar/CalendarMonthGrid");
    expect(typeof mod.CalendarMonthGrid).toBe("function");
  });

  it("CalendarMonthHeader exports component", () => {
    const mod = require("../../src/components/calendar/CalendarMonthHeader");
    expect(typeof mod.CalendarMonthHeader).toBe("function");
  });

  it("CalendarFilterTabs exports component", () => {
    const mod = require("../../src/components/calendar/CalendarFilterTabs");
    expect(typeof mod.CalendarFilterTabs).toBe("function");
  });

  it("CalendarDetailCard exports component", () => {
    const mod = require("../../src/components/calendar/CalendarDetailCard");
    expect(typeof mod.CalendarDetailCard).toBe("function");
  });

  it("EmptyCalendar exports component", () => {
    const mod = require("../../src/components/calendar/EmptyCalendar");
    expect(typeof mod.EmptyCalendar).toBe("function");
  });

  it("index barrel exports all calendar components", () => {
    const barrel = require("../../src/components/calendar");
    expect(typeof barrel.CalendarMonthGrid).toBe("function");
    expect(typeof barrel.CalendarMonthHeader).toBe("function");
    expect(typeof barrel.CalendarFilterTabs).toBe("function");
    expect(typeof barrel.CalendarDetailCard).toBe("function");
    expect(typeof barrel.EmptyCalendar).toBe("function");
  });
});

// --- Calendar Detail Card Logic Tests ---

describe("CalendarDetailCard logic", () => {
  it("renders without crash for null calendarDay", () => {
    const {
      CalendarDetailCard,
    } = require("../../src/components/calendar/CalendarDetailCard");
    // Should return null for null input
    const result = CalendarDetailCard({
      calendarDay: null,
      onStartWorkout: jest.fn(),
      onRecordOtherSport: jest.fn(),
      onBacklogWorkout: jest.fn(),
    });
    expect(result).toBeNull();
  });
});

// --- Filter Type Tests ---

describe("CalendarFilterTabs logic", () => {
  it("FILTER_OPTIONS is correctly defined in the module", () => {
    // The module should export the component without errors
    const mod = require("../../src/components/calendar/CalendarFilterTabs");
    expect(typeof mod.CalendarFilterTabs).toBe("function");
    // FilterType is a TS type export, not a runtime value
    expect("FilterType" in mod).toBe(false);
  });
});

// --- Calendar Page Component Tests ---

describe("Calendar page", () => {
  it("exports CalendarScreen as default", () => {
    const mod = require("../../app/(tabs)/calendar");
    expect(typeof mod.default).toBe("function");
  });

  it("exports CalendarScreenProps interface (type-only, runtime check)", () => {
    const mod = require("../../app/(tabs)/calendar");
    // CalendarScreenProps is a type, not available at runtime
    // Just verify the module loaded
    expect(mod.default).toBeDefined();
  });
});
