/**
 * CircularProgress component for the timer panel.
 *
 * Renders a circular progress indicator that shows remaining time
 * as a depleting arc. Uses SVG-like rendering via react-native View transforms.
 *
 * Props:
 * - progress: 0 to 1 (1 = full circle, 0 = empty)
 * - size: diameter of the circle
 * - strokeWidth: thickness of the progress ring
 * - color: color of the active arc
 * - backgroundColor: color of the background track
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@utils/constants";

export interface CircularProgressProps {
  /** Progress value from 0 (empty) to 1 (full circle) */
  progress: number;
  /** Diameter of the circle in pixels */
  size?: number;
  /** Thickness of the progress ring */
  strokeWidth?: number;
  /** Color of the active progress arc */
  color?: string;
  /** Color of the background track */
  backgroundColor?: string;
  /** Children to render inside the circle (e.g. timer text) */
  children?: React.ReactNode;
}

/**
 * CircularProgress renders a circular progress ring around its children.
 *
 * Uses two half-circle views with rotation transforms to create
 * a smooth circular progress indicator without requiring SVG.
 */
export function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 6,
  color = Colors.accent,
  backgroundColor = Colors.border,
  children,
}: CircularProgressProps) {
  const _radius = (size - strokeWidth) / 2;
  const halfSize = size / 2;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Convert progress to rotation angles
  // Full circle = 360 degrees
  const fullAngle = clampedProgress * 360;
  const firstHalfAngle = Math.min(fullAngle, 180);
  const secondHalfAngle = Math.max(0, fullAngle - 180);

  // First half: rotates from 0 to 180
  const firstHalfRotation = firstHalfAngle;
  // Second half: rotates from 0 to 180 (starts when first half completes)
  const secondHalfRotation = secondHalfAngle;

  // Whether to show the second half
  const showSecondHalf = fullAngle > 180;

  const innerSize = size - strokeWidth * 2;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clampedProgress * 100),
      }}
    >
      {/* Background track */}
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />

      {/* First half circle (0-180 degrees) */}
      {clampedProgress > 0 && (
        <View
          style={[
            styles.halfCircleContainer,
            {
              width: size,
              height: size,
            },
          ]}
        >
          <View
            style={[
              styles.halfCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: color,
                left: 0,
                transform: [
                  { rotate: `${firstHalfRotation}deg` },
                  { translateX: halfSize },
                ],
              },
            ]}
          />
        </View>
      )}

      {/* Second half circle (180-360 degrees) */}
      {showSecondHalf && (
        <View
          style={[
            styles.halfCircleContainer,
            {
              width: size,
              height: size,
            },
          ]}
        >
          <View
            style={[
              styles.halfCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: color,
                left: 0,
                transform: [
                  { rotate: `180deg` },
                  { rotate: `${secondHalfRotation}deg` },
                  { translateX: halfSize },
                ],
              },
            ]}
          />
        </View>
      )}

      {/* Center content */}
      <View
        style={[
          styles.centerContent,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  track: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  halfCircleContainer: {
    position: "absolute",
    overflow: "hidden",
    left: 0,
    top: 0,
  },
  halfCircle: {
    position: "absolute",
    top: 0,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
