/**
 * Body data page helper functions.
 *
 * Pure functions for computing weight change, formatting values,
 * building chart data, and validating body measurement inputs.
 */

import type { BodyMeasurement } from "../../types";

// ============================================================
// Segment types for tab control
// ============================================================

export type BodySegmentKey = "trend" | "history";

export interface BodySegment {
  key: BodySegmentKey;
  label: string;
}

export const BODY_SEGMENTS: BodySegment[] = [
  { key: "trend", label: "趋势图" },
  { key: "history", label: "历史记录" },
];

// ============================================================
// Metric selector types
// ============================================================

export type BodyMetricKey =
  | "body_weight"
  | "chest_circumference"
  | "waist_circumference"
  | "arm_circumference"
  | "thigh_circumference";

export interface BodyMetricOption {
  key: BodyMetricKey;
  label: string;
}

export const BODY_METRICS: BodyMetricOption[] = [
  { key: "body_weight", label: "体重" },
  { key: "chest_circumference", label: "胸围" },
  { key: "waist_circumference", label: "腰围" },
  { key: "arm_circumference", label: "臂围" },
  { key: "thigh_circumference", label: "大腿围" },
];

// ============================================================
// Weight change computation
// ============================================================

export interface WeightChange {
  change: number | null; // null when no previous record
  direction: "up" | "down" | "same" | null;
  color: string;
  arrow: string;
}

/**
 * Compute weight change between the latest and previous body measurement.
 * Returns null direction/change when no previous record exists.
 */
export function computeWeightChange(
  latest: BodyMeasurement,
  previous: BodyMeasurement | null,
): WeightChange {
  if (
    !previous ||
    previous.body_weight === null ||
    latest.body_weight === null
  ) {
    return {
      change: null,
      direction: null,
      color: "#86868b",
      arrow: "",
    };
  }

  const diff = latest.body_weight - previous.body_weight;

  if (Math.abs(diff) < 0.05) {
    return {
      change: 0,
      direction: "same",
      color: "#86868b",
      arrow: " →",
    };
  }

  if (diff > 0) {
    return {
      change: diff,
      direction: "up",
      color: "#ff3b30",
      arrow: " ↑",
    };
  }

  return {
    change: diff,
    direction: "down",
    color: "#30d158",
    arrow: " ↓",
  };
}

// ============================================================
// Formatting
// ============================================================

/**
 * Format weight value for display (1 decimal place).
 */
export function formatWeightValue(value: number | null): string {
  if (value === null) return "--";
  return value.toFixed(1);
}

/**
 * Format weight change with sign and unit.
 */
export function formatWeightChange(change: number | null): string {
  if (change === null) return "--";
  if (change === 0) return "0.0 kg";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)} kg`;
}

/**
 * Format body measurement date for display.
 */
export function formatBodyDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${month}/${day}`;
}

/**
 * Format a date string as "YYYY年MM月DD日" for form display.
 */
export function formatFormDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}年${month}月${day}日`;
}

// ============================================================
// Chart data
// ============================================================

export interface TrendDataPoint {
  date: string;
  value: number | null;
}

/**
 * Build trend chart data from measurements for a given metric.
 * Filters out records where the metric value is null.
 */
export function buildTrendData(
  measurements: BodyMeasurement[],
  metricKey: BodyMetricKey,
): TrendDataPoint[] {
  return measurements
    .map((m) => ({
      date: m.record_date,
      value: m[metricKey] as number | null,
    }))
    .filter((d) => d.value !== null);
}

// ============================================================
// Validation
// ============================================================

export interface BodyEntryData {
  record_date: string;
  body_weight: number | null;
  chest_circumference: number | null;
  waist_circumference: number | null;
  arm_circumference: number | null;
  thigh_circumference: number | null;
  body_note: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate body measurement entry data.
 * - record_date is required and cannot exceed today
 * - body_weight is required
 * - circumference fields are optional
 */
export function validateBodyEntry(data: BodyEntryData): ValidationResult {
  const errors: string[] = [];

  if (!data.record_date) {
    errors.push("请选择日期");
  }

  // Cannot exceed today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (data.record_date && data.record_date > todayStr) {
    errors.push("日期不能超过今天");
  }

  if (data.body_weight === null || data.body_weight <= 0) {
    errors.push("请输入有效的体重");
  }

  if (data.body_weight !== null && data.body_weight > 500) {
    errors.push("体重数值异常");
  }

  // Optional circumference validation
  const circumferenceFields: Array<{
    key: keyof BodyEntryData;
    label: string;
  }> = [
    { key: "chest_circumference", label: "胸围" },
    { key: "waist_circumference", label: "腰围" },
    { key: "arm_circumference", label: "臂围" },
    { key: "thigh_circumference", label: "大腿围" },
  ];

  for (const field of circumferenceFields) {
    const val = data[field.key] as number | null;
    if (val !== null && val <= 0) {
      errors.push(`${field.label}数值无效`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================
// History list helpers
// ============================================================

/**
 * Sort measurements by date descending.
 */
export function sortByDateDesc(
  measurements: BodyMeasurement[],
): BodyMeasurement[] {
  return [...measurements].sort((a, b) =>
    b.record_date.localeCompare(a.record_date),
  );
}

/**
 * Create empty body entry data with today's date.
 */
export function createEmptyEntry(): BodyEntryData {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    record_date: todayStr,
    body_weight: null,
    chest_circumference: null,
    waist_circumference: null,
    arm_circumference: null,
    thigh_circumference: null,
    body_note: null,
  };
}

/**
 * Create entry data from existing measurement (for edit).
 */
export function measurementToEntry(m: BodyMeasurement): BodyEntryData {
  return {
    record_date: m.record_date,
    body_weight: m.body_weight,
    chest_circumference: m.chest_circumference,
    waist_circumference: m.waist_circumference,
    arm_circumference: m.arm_circumference,
    thigh_circumference: m.thigh_circumference,
    body_note: m.body_note,
  };
}

/**
 * Filter measurements for a date range.
 */
export function filterByDateRange(
  measurements: BodyMeasurement[],
  startDate: string,
  endDate: string,
): BodyMeasurement[] {
  return measurements.filter(
    (m) => m.record_date >= startDate && m.record_date <= endDate,
  );
}
