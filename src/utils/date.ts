/**
 * Date utility functions for the calendar module.
 */

/** Day of week type: 1=Monday, 7=Sunday (ISO 8601) */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Chinese weekday labels */
export const WEEKDAY_LABELS_SHORT = [
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "日",
] as const;

/** Chinese month labels */
export const MONTH_LABELS = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
] as const;

/**
 * Get the number of days in a given month.
 * @param year Full year (e.g. 2026)
 * @param month 1-indexed month (1=January, 12=December)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get the ISO weekday for the first day of a month.
 * Returns 1=Monday, 7=Sunday.
 */
export function getFirstDayWeekday(year: number, month: number): IsoWeekday {
  const d = new Date(year, month - 1, 1);
  const jsDay = d.getDay(); // 0=Sunday
  return (jsDay === 0 ? 7 : jsDay) as IsoWeekday;
}

/**
 * Format a date as 'YYYY-MM-DD'.
 */
export function formatDateISO(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Parse an ISO date string into { year, month, day }.
 */
export function parseISODate(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y!, month: m!, day: d! };
}

/**
 * Get today's date as an ISO string.
 */
export function getTodayISO(): string {
  const now = new Date();
  return formatDateISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Check if a date string is today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayISO();
}

/**
 * Check if a date string is in the past (before today).
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getTodayISO();
}

/**
 * Check if a date string is in the future (after today).
 */
export function isFuture(dateStr: string): boolean {
  return dateStr > getTodayISO();
}

/**
 * Get the color for a training type.
 */
export function getTrainingTypeColor(
  type: "push" | "pull" | "legs" | "custom",
): string {
  const colors: Record<string, string> = {
    push: "#0071e3", // blue
    pull: "#30d158", // green
    legs: "#ff9500", // orange
    custom: "#86868b", // grey
  };
  return colors[type] ?? "#86868b";
}

/**
 * Get the display label for a training type.
 */
export function getTrainingTypeLabel(
  type: "push" | "pull" | "legs" | "custom",
): string {
  const labels: Record<string, string> = {
    push: "推",
    pull: "拉",
    legs: "蹲",
    custom: "其他",
  };
  return labels[type] ?? "其他";
}
