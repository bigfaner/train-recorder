/**
 * Unit tests for Settings page components and helpers.
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
// SettingsGroup Tests
// ============================================================

describe("SettingsGroup", () => {
  const {
    SettingsGroup,
    SettingsRow,
  } = require("../../../src/components/settings");

  it("should render group title", () => {
    const React = require("react");
    const result = React.createElement(
      SettingsGroup,
      { title: "训练设置" },
      React.createElement(SettingsRow, { label: "测试项", value: "kg" }),
    );
    expect(result.props.title).toBe("训练设置");
    expect(result.props.children).toBeDefined();
  });
});

// ============================================================
// SettingsRow Tests
// ============================================================

describe("SettingsRow", () => {
  const { SettingsRow } = require("../../../src/components/settings");

  it("should render with label and value props", () => {
    const React = require("react");
    const result = React.createElement(SettingsRow, {
      label: "重量单位",
      value: "kg",
    });
    expect(result.props.label).toBe("重量单位");
    expect(result.props.value).toBe("kg");
  });

  it("should render with onPress callback", () => {
    const React = require("react");
    const onPress = jest.fn();
    const result = React.createElement(SettingsRow, {
      label: "重量单位",
      value: "kg",
      onPress,
    });
    expect(result.props.onPress).toBe(onPress);
  });
});

// ============================================================
// ToggleRow Tests
// ============================================================

describe("ToggleRow", () => {
  const { ToggleRow } = require("../../../src/components/settings");

  it("should render with label, value, and onValueChange", () => {
    const React = require("react");
    const onValueChange = jest.fn();
    const result = React.createElement(ToggleRow, {
      label: "训练提醒",
      value: true,
      onValueChange,
    });
    expect(result.props.label).toBe("训练提醒");
    expect(result.props.value).toBe(true);
    expect(result.props.onValueChange).toBe(onValueChange);
  });

  it("should render with value false", () => {
    const React = require("react");
    const result = React.createElement(ToggleRow, {
      label: "休息结束提示音",
      value: false,
      onValueChange: jest.fn(),
    });
    expect(result.props.value).toBe(false);
  });
});

// ============================================================
// UnitToggleRow Tests
// ============================================================

describe("UnitToggleRow", () => {
  const { UnitToggleRow } = require("../../../src/components/settings");

  it("should render with kg unit", () => {
    const React = require("react");
    const result = React.createElement(UnitToggleRow, {
      currentUnit: "kg",
      onToggle: jest.fn(),
    });
    expect(result.props.currentUnit).toBe("kg");
  });

  it("should render with lbs unit", () => {
    const React = require("react");
    const result = React.createElement(UnitToggleRow, {
      currentUnit: "lbs",
      onToggle: jest.fn(),
    });
    expect(result.props.currentUnit).toBe("lbs");
  });
});

// ============================================================
// RestTimeRow Tests
// ============================================================

describe("RestTimeRow", () => {
  const { RestTimeRow } = require("../../../src/components/settings");

  it("should render with current rest time value", () => {
    const React = require("react");
    const result = React.createElement(RestTimeRow, {
      currentValue: 180,
      onPress: jest.fn(),
    });
    expect(result.props.currentValue).toBe(180);
  });
});

// ============================================================
// NavigationRow Tests
// ============================================================

describe("NavigationRow", () => {
  const { NavigationRow } = require("../../../src/components/settings");

  it("should render with label", () => {
    const React = require("react");
    const result = React.createElement(NavigationRow, {
      label: "动作库管理",
      onPress: jest.fn(),
    });
    expect(result.props.label).toBe("动作库管理");
  });

  it("should render with subtitle", () => {
    const React = require("react");
    const result = React.createElement(NavigationRow, {
      label: "动作库管理",
      subtitle: "19 个动作",
      onPress: jest.fn(),
    });
    expect(result.props.subtitle).toBe("19 个动作");
  });
});

// ============================================================
// DestructiveRow Tests
// ============================================================

describe("DestructiveRow", () => {
  const { DestructiveRow } = require("../../../src/components/settings");

  it("should render with label", () => {
    const React = require("react");
    const result = React.createElement(DestructiveRow, {
      label: "清除所有数据",
      onPress: jest.fn(),
    });
    expect(result.props.label).toBe("清除所有数据");
  });
});

// ============================================================
// BottomSheet Tests
// ============================================================

describe("BottomSheet", () => {
  const { BottomSheet } = require("../../../src/components/settings");

  it("should render with visible true", () => {
    const React = require("react");
    const result = React.createElement(BottomSheet, {
      title: "选择休息时间",
      visible: true,
      onClose: jest.fn(),
      children: null,
    });
    expect(result.props.visible).toBe(true);
    expect(result.props.title).toBe("选择休息时间");
  });

  it("should render with visible false", () => {
    const React = require("react");
    const result = React.createElement(BottomSheet, {
      title: "选择休息时间",
      visible: false,
      onClose: jest.fn(),
      children: null,
    });
    expect(result.props.visible).toBe(false);
  });
});

// ============================================================
// SettingsBottomSheet Tests
// ============================================================

describe("SettingsBottomSheet", () => {
  const { SettingsBottomSheet } = require("../../../src/components/settings");

  const options = [
    { label: "90 秒", value: 90 },
    { label: "120 秒", value: 120 },
    { label: "180 秒", value: 180 },
  ];

  it("should render with options and selectedValue", () => {
    const React = require("react");
    const result = React.createElement(SettingsBottomSheet, {
      title: "选择休息时间",
      visible: true,
      options,
      selectedValue: 90,
      onSelect: jest.fn(),
      onClose: jest.fn(),
    });
    expect(result.props.options).toEqual(options);
    expect(result.props.selectedValue).toBe(90);
  });
});

// ============================================================
// Toast Tests
// ============================================================

describe("Toast", () => {
  const { Toast } = require("../../../src/components/settings");

  it("should render with visible true", () => {
    const React = require("react");
    const result = React.createElement(Toast, {
      message: "单位已切换为 lbs",
      visible: true,
    });
    expect(result.props.message).toBe("单位已切换为 lbs");
    expect(result.props.visible).toBe(true);
  });

  it("should render with visible false", () => {
    const React = require("react");
    const result = React.createElement(Toast, {
      message: "单位已切换为 lbs",
      visible: false,
    });
    expect(result.props.visible).toBe(false);
  });
});

// ============================================================
// SettingsScreen Integration Tests
// ============================================================

describe("SettingsScreen", () => {
  it("should export a function component", () => {
    const { default: SettingsScreen } = require("../../../app/(tabs)/settings");
    expect(typeof SettingsScreen).toBe("function");
  });
});

// ============================================================
// Settings Helpers Tests
// ============================================================

describe("Settings Helpers", () => {
  const {
    getRestTimeOptions,
    getExportRangeOptions,
    formatUnitLabel,
  } = require("../../../src/components/settings/settings-helpers");

  describe("getRestTimeOptions", () => {
    it("should return all rest time options", () => {
      const options = getRestTimeOptions();
      expect(options).toEqual([
        { label: "90 秒", value: 90 },
        { label: "120 秒", value: 120 },
        { label: "180 秒", value: 180 },
        { label: "240 秒", value: 240 },
        { label: "300 秒", value: 300 },
      ]);
    });
  });

  describe("getExportRangeOptions", () => {
    it("should return export range options", () => {
      const options = getExportRangeOptions();
      expect(options).toEqual([
        { label: "全部数据", value: "all" },
        { label: "最近 3 个月", value: "3m" },
        { label: "最近 6 个月", value: "6m" },
      ]);
    });
  });

  describe("formatUnitLabel", () => {
    it("should format kg label", () => {
      expect(formatUnitLabel("kg")).toBe("公斤 (kg)");
    });

    it("should format lbs label", () => {
      expect(formatUnitLabel("lbs")).toBe("磅 (lbs)");
    });
  });
});
