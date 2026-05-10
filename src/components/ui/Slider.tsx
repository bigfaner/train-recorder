import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@utils/constants";

export interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  testID?: string;
}

export function Slider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  step = 1,
  minLabel,
  maxLabel,
  testID,
}: SliderProps) {
  const range = maximumValue - minimumValue;
  const progress = range > 0 ? (value - minimumValue) / range : 0;

  const handleIncrement = useCallback(() => {
    const next = Math.min(value + step, maximumValue);
    onValueChange(next);
  }, [value, step, maximumValue, onValueChange]);

  const handleDecrement = useCallback(() => {
    const prev = Math.max(value - step, minimumValue);
    onValueChange(prev);
  }, [value, step, minimumValue, onValueChange]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.labelsRow}>
        {minLabel && <Text style={styles.endLabel}>{minLabel}</Text>}
        <Text style={styles.valueLabel}>{value}</Text>
        {maxLabel && <Text style={styles.endLabel}>{maxLabel}</Text>}
      </View>
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View style={[styles.progress, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleDecrement}
            style={styles.stepButton}
            accessibilityRole="button"
            accessibilityLabel="Decrease"
          >
            <Text style={styles.stepButtonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleIncrement}
            style={styles.stepButton}
            accessibilityRole="button"
            accessibilityLabel="Increase"
          >
            <Text style={styles.stepButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  endLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  valueLabel: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  trackContainer: {
    alignItems: "center",
  },
  track: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    width: "100%",
    overflow: "hidden",
  },
  progress: {
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 8,
  },
  stepButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: Colors.backgroundAlt,
  },
  stepButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.accent,
  },
});
