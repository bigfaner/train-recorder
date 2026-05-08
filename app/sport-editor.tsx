import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";

export default function SportEditorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>运动编辑</Text>
      <Text style={styles.subtitle}>Sport Editor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.contentPadding,
  },
  title: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: Typography.heading1.fontWeight as "600",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
