/**
 * Pure helper functions for the Timer Panel UI.
 *
 * Extracted for testability:
 * - Timer panel visibility state
 * - Timer phase determination (counting, completed, expired)
 * - Circular progress calculation
 * - Notification text formatting
 */

/**
 * Determine the current timer panel phase.
 *
 * - "hidden": no timer is active
 * - "counting": timer is actively counting down
 * - "completed": countdown reached 0 (red display, vibration expected)
 * - "expired": user was away too long (phone call, long absence)
 */
export type TimerPanelPhase = "hidden" | "counting" | "completed" | "expired";

/**
 * Compute the timer panel phase from store state.
 *
 * @param isActive - Whether the timer is currently counting down
 * @param remainingSeconds - Seconds remaining
 * @param isPaused - Whether the timer is paused
 * @param wasExpiredOnRecover - Whether timer expired during background/force-close
 */
export function getTimerPanelPhase(
  isActive: boolean,
  remainingSeconds: number,
  isPaused: boolean,
  wasExpiredOnRecover: boolean = false,
): TimerPanelPhase {
  if (wasExpiredOnRecover) {
    return "expired";
  }

  if (!isActive && !isPaused) {
    return "hidden";
  }

  if (isPaused) {
    return "counting";
  }

  if (remainingSeconds <= 0) {
    return "completed";
  }

  return "counting";
}

/**
 * Compute the circular progress value (0 to 1).
 *
 * @param remainingSeconds - Seconds remaining
 * @param totalDuration - Total timer duration
 * @returns Progress value from 0 (complete) to 1 (just started)
 */
export function computeTimerProgress(
  remainingSeconds: number,
  totalDuration: number,
): number {
  if (totalDuration <= 0) return 0;
  const clampedRemaining = Math.max(0, remainingSeconds);
  return Math.min(1, clampedRemaining / totalDuration);
}

/**
 * Format remaining time for system notification.
 * Returns text like "组间休息 · 剩余 1:30"
 *
 * @param remainingSeconds - Seconds remaining
 * @returns Formatted notification text
 */
export function formatNotificationText(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  return `组间休息 · 剩余 ${timeStr}`;
}

/**
 * Get the text color for the timer display based on phase.
 *
 * @param phase - Current timer panel phase
 * @returns Color value for the timer text
 */
export function getTimerTextColor(phase: TimerPanelPhase): string {
  if (phase === "completed" || phase === "expired") {
    return "#ff3b30"; // Colors.error
  }
  return "#1d1d1f"; // Colors.textPrimary
}

/**
 * Check if the timer is in a state where "开始下一组" button should show.
 *
 * @param phase - Current timer panel phase
 */
export function shouldShowNextSetButton(phase: TimerPanelPhase): boolean {
  return phase === "completed" || phase === "expired";
}

/**
 * Get the expired message for long absence / phone call recovery.
 *
 * @returns Recovery message string
 */
export function getExpiredMessage(): string {
  return "休息时间已过，准备好了就开始下一组";
}

/**
 * Compute timer visibility (whether panel should slide up).
 *
 * @param phase - Current timer panel phase
 */
export function isTimerPanelVisible(phase: TimerPanelPhase): boolean {
  return phase !== "hidden";
}
