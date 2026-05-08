import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { Colors, Spacing } from "@utils/constants";

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    padding: Spacing.cardPadding,
    // shadow 0 2px 12px rgba(0,0,0,0.06)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
});
