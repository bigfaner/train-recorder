/**
 * TimerPanel component for the workout execution page.
 *
 * Slides up from bottom after "完成本组" with:
 * - Large 72px countdown display inside a circular progress indicator
 * - "-30s", "跳过", "+30s" adjustment buttons
 * - Red text + vibration on countdown completion
 * - "开始下一组" button when timer completes or expires
 * - Expired message for phone call / long absence recovery
 *
 * Props:
 * - Timer state (isActive, remainingSeconds, totalDuration, isPaused)
 * - Phase state (wasExpiredOnRecover)
 * - Callbacks (onSkip, onStartNext, onAdjust)
 *
 * Integration:
 * - Receives state from useTimer hook
 * - Phase computed by getTimerPanelPhase helper
 * - Triggers haptic/vibration feedback on completion (handled by parent)
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import { formatTimerDisplay } from "../ui/TimerDisplay";
import { CircularProgress } from "./CircularProgress";
import {
  type TimerPanelPhase,
  computeTimerProgress,
  getTimerTextColor,
  shouldShowNextSetButton,
  getExpiredMessage,
  isTimerPanelVisible,
} from "./timer-helpers";

export interface TimerPanelProps {
  /** Current timer panel phase */
  phase: TimerPanelPhase;
  /** Remaining seconds in countdown */
  remainingSeconds: number;
  /** Total timer duration in seconds */
  totalDuration: number;
  /** Callback when "-30s" is pressed */
  onAdjustMinus30: () => void;
  /** Callback when "+30s" is pressed */
  onAdjustPlus30: () => void;
  /** Callback when "跳过" (skip) is pressed */
  onSkip: () => void;
  /** Callback when "开始下一组" is pressed */
  onStartNext: () => void;
}

/**
 * TimerPanel renders the rest timer overlay that appears after completing a set.
 *
 * Three visual states:
 * - Counting: circular progress + countdown + adjustment buttons
 * - Completed: red countdown + vibration + "开始下一组" button
 * - Expired: red expired message + "开始下一组" button
 */
export function TimerPanel({
  phase,
  remainingSeconds,
  totalDuration,
  onAdjustMinus30,
  onAdjustPlus30,
  onSkip,
  onStartNext,
}: TimerPanelProps) {
  if (!isTimerPanelVisible(phase)) {
    return null;
  }

  const progress = computeTimerProgress(remainingSeconds, totalDuration);
  const textColor = getTimerTextColor(phase);
  const showNextButton = shouldShowNextSetButton(phase);
  const displayTime = formatTimerDisplay(remainingSeconds);
  const isExpired = phase === "expired";
  const isCounting = phase === "counting";

  return (
    <View
      style={styles.panel}
      accessibilityRole="alert"
      accessibilityLabel={`休息计时器 ${displayTime}`}
      testID="rest-timer"
    >
      {/* Circular progress with timer display */}
      <View style={styles.timerContainer}>
        <CircularProgress
          progress={progress}
          size={200}
          strokeWidth={6}
          color={
            isExpired || phase === "completed" ? Colors.error : Colors.accent
          }
          backgroundColor={Colors.border}
        >
          <Text
            style={[styles.timerText, { color: textColor }]}
            accessibilityRole="text"
          >
            {displayTime}
          </Text>
        </CircularProgress>
      </View>

      {/* Expired recovery message */}
      {isExpired && (
        <Text style={styles.expiredMessage} testID="overtime-message">
          {getExpiredMessage()}
        </Text>
      )}

      {/* Adjustment buttons (only during counting) */}
      {isCounting && (
        <View style={styles.adjustRow}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={onAdjustMinus30}
            accessibilityRole="button"
            accessibilityLabel="-30秒"
          >
            <Text style={styles.adjustButtonText}>-30s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="跳过"
            testID="skip-rest-btn"
          >
            <Text style={styles.skipButtonText}>跳过</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustButton}
            onPress={onAdjustPlus30}
            accessibilityRole="button"
            accessibilityLabel="+30秒"
          >
            <Text style={styles.adjustButtonText}>+30s</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Start next set button */}
      {showNextButton && (
        <TouchableOpacity
          style={styles.nextSetButton}
          onPress={onStartNext}
          accessibilityRole="button"
          accessibilityLabel="开始下一组"
          testID="next-set-btn"
        >
          <Text style={styles.nextSetButtonText}>开始下一组</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.contentPadding,
    paddingTop: Spacing.sectionSpacing,
    paddingBottom: Spacing.sectionSpacing + 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },

  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  timerText: {
    fontSize: Typography.timerDisplay.fontSize,
    fontWeight: Typography.timerDisplay.fontWeight as "700",
    letterSpacing: Typography.timerDisplay.letterSpacing,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },

  expiredMessage: {
    fontSize: Typography.body.fontSize,
    color: Colors.error,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },

  adjustRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },

  adjustButton: {
    width: 72,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  adjustButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },

  skipButton: {
    width: 80,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  skipButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600" as const,
    color: Colors.accent,
  },

  nextSetButton: {
    width: "100%",
    height: ComponentSizes.buttonHeight,
    borderRadius: ComponentSizes.buttonBorderRadius,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  nextSetButtonText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#ffffff",
    textAlign: "center",
  },
});
