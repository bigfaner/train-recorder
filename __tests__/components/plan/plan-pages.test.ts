/**
 * Unit tests for plan page components.
 *
 * Tests pure logic, module exports, and component rendering
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
  useLocalSearchParams: () => ({}),
}));

describe("Plan Component Modules", () => {
  it("ActivePlanCard module exports component", () => {
    const module = require("@components/plan/ActivePlanCard");
    expect(typeof module.ActivePlanCard).toBe("function");
  });

  it("TrainingDayCard module exports component", () => {
    const module = require("@components/plan/TrainingDayCard");
    expect(typeof module.TrainingDayCard).toBe("function");
  });

  it("EmptyPlanState module exports component", () => {
    const module = require("@components/plan/EmptyPlanState");
    expect(typeof module.EmptyPlanState).toBe("function");
  });

  it("plan-helpers module exports all helpers", () => {
    const module = require("@components/plan/plan-helpers");
    expect(typeof module.validatePlan).toBe("function");
    expect(typeof module.parseSetsConfig).toBe("function");
    expect(typeof module.createFixedSetsConfig).toBe("function");
    expect(typeof module.createCustomSetsConfig).toBe("function");
    expect(typeof module.serializeSetsConfig).toBe("function");
    expect(typeof module.formatSetsDisplay).toBe("function");
    expect(typeof module.formatWeightDisplay).toBe("function");
    expect(typeof module.parseWeeklyConfig).toBe("function");
    expect(typeof module.serializeWeeklyConfig).toBe("function");
    expect(typeof module.getWeekdayLabel).toBe("function");
    expect(typeof module.getTrainingTypeDisplayLabel).toBe("function");
    expect(typeof module.formatPlanMode).toBe("function");
    expect(typeof module.formatScheduleMode).toBe("function");
    expect(typeof module.buildExerciseSummary).toBe("function");
    expect(typeof module.formatDayCardTitle).toBe("function");
    expect(Array.isArray(module.TRAINING_TYPES)).toBe(true);
    expect(module.TRAINING_TYPES).toHaveLength(4);
  });

  it("plan barrel exports all components and helpers", () => {
    const barrel = require("@components/plan");
    // Components
    expect(typeof barrel.ActivePlanCard).toBe("function");
    expect(typeof barrel.TrainingDayCard).toBe("function");
    expect(typeof barrel.EmptyPlanState).toBe("function");
    // Helpers
    expect(typeof barrel.validatePlan).toBe("function");
    expect(typeof barrel.parseSetsConfig).toBe("function");
    expect(typeof barrel.formatSetsDisplay).toBe("function");
    expect(typeof barrel.buildExerciseSummary).toBe("function");
  });
});

describe("Plan Page Modules", () => {
  it("plan tab page exports default function", () => {
    const module = require("../../../app/(tabs)/plan");
    expect(typeof module.default).toBe("function");
  });

  it("plan editor page exports default function", () => {
    const module = require("../../../app/plan-editor");
    expect(typeof module.default).toBe("function");
  });

  it("training day editor page exports default function", () => {
    const module = require("../../../app/training-day-editor");
    expect(typeof module.default).toBe("function");
  });
});

describe("TRAINING_TYPES constant", () => {
  const { TRAINING_TYPES } = require("@components/plan/plan-helpers");

  it("has push, pull, legs, custom", () => {
    const values = TRAINING_TYPES.map((t: { value: string }) => t.value);
    expect(values).toContain("push");
    expect(values).toContain("pull");
    expect(values).toContain("legs");
    expect(values).toContain("custom");
  });

  it("each type has value and label", () => {
    TRAINING_TYPES.forEach((t: { value: string; label: string }) => {
      expect(t.value).toBeTruthy();
      expect(t.label).toBeTruthy();
    });
  });
});
