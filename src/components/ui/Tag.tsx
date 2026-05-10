import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ComponentSizes } from "@utils/constants";

export interface TagProps {
  label: string;
  color: string;
}

/**
 * Convert a hex color to rgba with given opacity.
 */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Tag({ label, color }: TagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: hexToRgba(color, 0.15) }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 100, // rounded-full
    paddingHorizontal: ComponentSizes.tagPaddingHorizontal,
    paddingVertical: ComponentSizes.tagPaddingVertical,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
