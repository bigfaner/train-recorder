import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { Colors, ComponentSizes, Typography } from "@utils/constants";

/**
 * Simple text-based tab icon component.
 * Uses Unicode symbols as placeholders for SF Symbols / Material icons.
 */
function TabIconComponent({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    calendar: "\u{1F4C5}",
    plan: "\u{1F4CB}",
    history: "\u{1F4CA}",
    stats: "\u{1F464}",
    settings: "\u{2699}",
  };

  return <Text style={[styles.icon, { color }]}>{icons[name] || "?"}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: [
          styles.tabBar,
          {
            height: ComponentSizes.tabBarHeight,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarLabel: "日历",
          tabBarIcon: ({ color }) => (
            <TabIconComponent name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarLabel: "计划",
          tabBarIcon: ({ color }) => (
            <TabIconComponent name="plan" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarLabel: "历史",
          tabBarIcon: ({ color }) => (
            <TabIconComponent name="history" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarLabel: "统计",
          tabBarIcon: ({ color }) => (
            <TabIconComponent name="stats" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "设置",
          tabBarIcon: ({ color }) => (
            <TabIconComponent name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 28, // safe area padding for bottom
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    letterSpacing: Typography.caption.letterSpacing,
  },
  header: {
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  icon: {
    fontSize: 24,
  },
});
