/**
 * Unit tests for base UI components.
 *
 * React Native is mocked since the test environment is node.
 * We test pure logic functions, component exports, and design tokens.
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
    StyleSheet: {
      create: (styles: Record<string, object>) => styles,
    },
  };
});

// --- Module Export Tests ---

describe("UI Component Modules", () => {
  it("Button module exports Button component", () => {
    const module = require("@components/ui/Button");
    expect(typeof module.Button).toBe("function");
    expect(module.Button.name).toBe("Button");
  });

  it("Card module exports Card component", () => {
    const module = require("@components/ui/Card");
    expect(typeof module.Card).toBe("function");
    expect(module.Card.name).toBe("Card");
  });

  it("Input module exports Input component", () => {
    const module = require("@components/ui/Input");
    expect(typeof module.Input).toBe("function");
    expect(module.Input.name).toBe("Input");
  });

  it("Tag module exports Tag component", () => {
    const module = require("@components/ui/Tag");
    expect(typeof module.Tag).toBe("function");
    expect(module.Tag.name).toBe("Tag");
  });

  it("TimerDisplay module exports TimerDisplay component and formatTimerDisplay", () => {
    const module = require("@components/ui/TimerDisplay");
    expect(typeof module.TimerDisplay).toBe("function");
    expect(typeof module.formatTimerDisplay).toBe("function");
  });

  it("Slider module exports Slider component", () => {
    const module = require("@components/ui/Slider");
    expect(typeof module.Slider).toBe("function");
    expect(module.Slider.name).toBe("Slider");
  });

  it("index barrel exports all components", () => {
    const barrel = require("@components/ui");
    expect(typeof barrel.Button).toBe("function");
    expect(typeof barrel.Card).toBe("function");
    expect(typeof barrel.Input).toBe("function");
    expect(typeof barrel.Tag).toBe("function");
    expect(typeof barrel.TimerDisplay).toBe("function");
    expect(typeof barrel.formatTimerDisplay).toBe("function");
    expect(typeof barrel.Slider).toBe("function");
  });
});

// --- Pure Function Tests ---

describe("formatTimerDisplay", () => {
  const { formatTimerDisplay } = require("@components/ui/TimerDisplay");

  it("formats 0 seconds as 0:00", () => {
    expect(formatTimerDisplay(0)).toBe("0:00");
  });

  it("formats 5 seconds as 0:05", () => {
    expect(formatTimerDisplay(5)).toBe("0:05");
  });

  it("formats 60 seconds as 1:00", () => {
    expect(formatTimerDisplay(60)).toBe("1:00");
  });

  it("formats 90 seconds as 1:30", () => {
    expect(formatTimerDisplay(90)).toBe("1:30");
  });

  it("formats 150 seconds as 2:30", () => {
    expect(formatTimerDisplay(150)).toBe("2:30");
  });

  it("formats 3661 seconds as 61:01", () => {
    expect(formatTimerDisplay(3661)).toBe("61:01");
  });

  it("formats 5999 seconds as 99:59", () => {
    expect(formatTimerDisplay(5999)).toBe("99:59");
  });
});

// --- Design Token Tests ---

describe("Design Tokens", () => {
  it("Colors has all required color tokens", () => {
    const { Colors } = require("@utils/constants");
    expect(Colors.background).toBe("#ffffff");
    expect(Colors.backgroundAlt).toBe("#f5f5f7");
    expect(Colors.surface).toBe("#ffffff");
    expect(Colors.border).toBe("#d2d2d7");
    expect(Colors.textPrimary).toBe("#1d1d1f");
    expect(Colors.textSecondary).toBe("#6e6e73");
    expect(Colors.textTertiary).toBe("#86868b");
    expect(Colors.accent).toBe("#0071e3");
    expect(Colors.accentHover).toBe("#0077ed");
    expect(Colors.success).toBe("#30d158");
    expect(Colors.error).toBe("#ff3b30");
    expect(Colors.pushDay).toBe("#0071e3");
    expect(Colors.pullDay).toBe("#30d158");
    expect(Colors.legDay).toBe("#ff9500");
    expect(Colors.otherSport).toBe("#af52de");
    expect(Colors.restDay).toBe("#86868b");
  });

  it("Typography has all required tokens", () => {
    const { Typography } = require("@utils/constants");
    expect(Typography.heading1.fontSize).toBe(28);
    expect(Typography.heading2.fontSize).toBe(22);
    expect(Typography.heading3.fontSize).toBe(17);
    expect(Typography.body.fontSize).toBe(17);
    expect(Typography.bodySmall.fontSize).toBe(15);
    expect(Typography.caption.fontSize).toBe(13);
    expect(Typography.timerDisplay.fontSize).toBe(72);
    expect(Typography.weightDisplay.fontSize).toBe(48);
  });

  it("Spacing has correct values", () => {
    const { Spacing } = require("@utils/constants");
    expect(Spacing.contentPadding).toBe(16);
    expect(Spacing.sectionSpacing).toBe(24);
    expect(Spacing.cardSpacing).toBe(12);
    expect(Spacing.cardPadding).toBe(16);
    expect(Spacing.cardBorderRadius).toBe(16);
  });

  it("ComponentSizes has correct values", () => {
    const { ComponentSizes } = require("@utils/constants");
    expect(ComponentSizes.buttonHeight).toBe(50);
    expect(ComponentSizes.buttonBorderRadius).toBe(12);
    expect(ComponentSizes.inputHeight).toBe(44);
    expect(ComponentSizes.inputBorderRadius).toBe(12);
    expect(ComponentSizes.tabBarHeight).toBe(83);
  });
});
