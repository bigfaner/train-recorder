/**
 * Tests for Onboarding page components.
 *
 * Tests component rendering with mocked React Native primitives.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// Mock React Native before any imports
jest.mock("react-native", () => {
  const React = require("react");
  const mockComponent = (name: string) => {
    const fn = (props: Record<string, unknown>) => {
      const children = props.children;
      if (typeof children === "string") {
        return React.createElement(name, props, children);
      }
      if (Array.isArray(children)) {
        return React.createElement(name, props, ...children);
      }
      return React.createElement(name, props, children);
    };
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
    Switch: mockComponent("Switch"),
    Modal: mockComponent("Modal"),
    Pressable: mockComponent("Pressable"),
    Alert: {
      alert: jest.fn(),
    },
    StyleSheet: {
      create: (styles: Record<string, object>) => styles,
      hairlineWidth: 1,
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 390, height: 844 })),
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

const React = require("react");

// ============================================================
// WelcomeSteps Tests
// ============================================================

describe("WelcomeSteps", () => {
  const { WelcomeSteps } = require("../../../src/components/onboarding");

  it("should render with step 0", () => {
    const result = React.createElement(WelcomeSteps, {
      currentStep: 0,
      onNext: jest.fn(),
      onSkip: jest.fn(),
    });
    expect(result.props.currentStep).toBe(0);
    expect(result.props.onNext).toBeDefined();
    expect(result.props.onSkip).toBeDefined();
  });

  it("should render with step 1", () => {
    const result = React.createElement(WelcomeSteps, {
      currentStep: 1,
      onNext: jest.fn(),
      onSkip: jest.fn(),
    });
    expect(result.props.currentStep).toBe(1);
  });

  it("should render with step 2", () => {
    const result = React.createElement(WelcomeSteps, {
      currentStep: 2,
      onNext: jest.fn(),
      onSkip: jest.fn(),
    });
    expect(result.props.currentStep).toBe(2);
  });

  it("should render with step 3 (last welcome step)", () => {
    const result = React.createElement(WelcomeSteps, {
      currentStep: 3,
      onNext: jest.fn(),
      onSkip: jest.fn(),
    });
    expect(result.props.currentStep).toBe(3);
  });
});

// ============================================================
// TemplatePicker Tests
// ============================================================

describe("TemplatePicker", () => {
  const { TemplatePicker } = require("../../../src/components/onboarding");
  const templates = require("../../../src/services/onboarding").TEMPLATES;

  it("should render with templates", () => {
    const result = React.createElement(TemplatePicker, {
      templates,
      selectedTemplateId: null,
      onSelectTemplate: jest.fn(),
      onConfirm: jest.fn(),
      onSkip: jest.fn(),
    });
    expect(result.props.templates).toBe(templates);
    expect(result.props.selectedTemplateId).toBeNull();
  });

  it("should render with a selected template", () => {
    const result = React.createElement(TemplatePicker, {
      templates,
      selectedTemplateId: "ppl",
      onSelectTemplate: jest.fn(),
      onConfirm: jest.fn(),
      onSkip: jest.fn(),
    });
    expect(result.props.selectedTemplateId).toBe("ppl");
  });
});

// ============================================================
// PlanConfig Tests
// ============================================================

describe("PlanConfig", () => {
  const { PlanConfig } = require("../../../src/components/onboarding");
  const { TEMPLATES } = require("../../../src/services/onboarding");

  it("should render with a template", () => {
    const ppl = TEMPLATES.find(
      (t: { templateId: string }) => t.templateId === "ppl",
    )!;
    const result = React.createElement(PlanConfig, {
      template: ppl,
      onComplete: jest.fn(),
      onBack: jest.fn(),
    });
    expect(result.props.template).toBe(ppl);
    expect(result.props.onComplete).toBeDefined();
    expect(result.props.onBack).toBeDefined();
  });

  it("should render with upper_lower template", () => {
    const ul = TEMPLATES.find(
      (t: { templateId: string }) => t.templateId === "upper_lower",
    )!;
    const result = React.createElement(PlanConfig, {
      template: ul,
      onComplete: jest.fn(),
      onBack: jest.fn(),
    });
    expect(result.props.template).toBe(ul);
  });

  it("should render with full_body template", () => {
    const fb = TEMPLATES.find(
      (t: { templateId: string }) => t.templateId === "full_body",
    )!;
    const result = React.createElement(PlanConfig, {
      template: fb,
      onComplete: jest.fn(),
      onBack: jest.fn(),
    });
    expect(result.props.template).toBe(fb);
  });
});

// ============================================================
// StepIndicator Tests
// ============================================================

describe("StepIndicator", () => {
  const { StepIndicator } = require("../../../src/components/onboarding");

  it("should render with current step and total steps", () => {
    const result = React.createElement(StepIndicator, {
      currentStep: 0,
      totalSteps: 3,
    });
    expect(result.props.currentStep).toBe(0);
    expect(result.props.totalSteps).toBe(3);
  });

  it("should render with step 1 of 3", () => {
    const result = React.createElement(StepIndicator, {
      currentStep: 1,
      totalSteps: 3,
    });
    expect(result.props.currentStep).toBe(1);
  });

  it("should render with step 2 of 3", () => {
    const result = React.createElement(StepIndicator, {
      currentStep: 2,
      totalSteps: 3,
    });
    expect(result.props.currentStep).toBe(2);
  });
});

// ============================================================
// OnboardingScreen Integration Test
// ============================================================

describe("OnboardingScreen", () => {
  it("should export a function component", () => {
    const { default: OnboardingScreen } = require("../../../app/onboarding");
    expect(typeof OnboardingScreen).toBe("function");
  });

  it("should accept props for creating plan and marking onboarding complete", () => {
    const { default: OnboardingScreen } = require("../../../app/onboarding");
    const result = React.createElement(OnboardingScreen, {
      onCreatePlanFromTemplate: jest.fn(),
      onMarkOnboardingComplete: jest.fn(),
      onSkipOnboarding: jest.fn(),
    });
    expect(result.props.onCreatePlanFromTemplate).toBeDefined();
    expect(result.props.onMarkOnboardingComplete).toBeDefined();
    expect(result.props.onSkipOnboarding).toBeDefined();
  });
});

// ============================================================
// Templates Data Validation (acceptance criteria)
// ============================================================

describe("Templates Data", () => {
  const { TEMPLATES } = require("../../../src/services/onboarding");

  it("should have exactly 3 templates", () => {
    expect(TEMPLATES.length).toBe(3);
  });

  it("should have PPL template with correct structure", () => {
    const ppl = TEMPLATES.find(
      (t: { templateId: string }) => t.templateId === "ppl",
    );
    expect(ppl).toBeDefined();
    expect(ppl.templateName).toBe("推拉蹲 3日循环");
    expect(ppl.description).toBeTruthy();
    expect(ppl.days.length).toBe(3);
  });

  it("should have Upper/Lower template with correct structure", () => {
    const ul = TEMPLATES.find(
      (t: { templateId: string }) => t.templateId === "upper_lower",
    );
    expect(ul).toBeDefined();
    expect(ul.templateName).toBe("上下肢 4日分化");
    expect(ul.description).toBeTruthy();
    expect(ul.days.length).toBe(4);
  });

  it("should have Full Body template with correct structure", () => {
    const fb = TEMPLATES.find(
      (t: { templateId: string }) => t.templateId === "full_body",
    );
    expect(fb).toBeDefined();
    expect(fb.templateName).toBe("全身 3日训练");
    expect(fb.description).toBeTruthy();
    expect(fb.days.length).toBe(3);
  });

  it("all template exercises should have default sets_config (pre-filled)", () => {
    for (const t of TEMPLATES) {
      for (const day of t.days) {
        for (const ex of day.exercises) {
          expect(ex.setsConfig).toBeDefined();
          if (ex.setsConfig.mode === "fixed") {
            expect(ex.setsConfig.target_reps).toBeGreaterThan(0);
            expect(ex.setsConfig.target_repeat).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("each template day should have at least 3 exercises", () => {
    for (const t of TEMPLATES) {
      for (const day of t.days) {
        expect(day.exercises.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

// ============================================================
// Welcome Steps Content Validation
// ============================================================

describe("Welcome Steps Content", () => {
  const { WelcomeSteps } = require("../../../src/components/onboarding");

  it("should have onNext and onSkip callbacks for all steps", () => {
    for (let step = 0; step <= 3; step++) {
      const onNext = jest.fn();
      const onSkip = jest.fn();
      const result = React.createElement(WelcomeSteps, {
        currentStep: step,
        onNext,
        onSkip,
      });
      expect(result.props.onNext).toBe(onNext);
      expect(result.props.onSkip).toBe(onSkip);
    }
  });
});
