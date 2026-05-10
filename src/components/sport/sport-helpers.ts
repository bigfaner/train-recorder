/**
 * Other sport page helper functions.
 *
 * Pure functions for sport type management, metric input generation,
 * validation, and formatting.
 */

import type { SportType, SportMetric, SportMetricValue } from "../../types";

// ============================================================
// Preset sport types and metrics
// ============================================================

export const PRESET_SPORT_ICONS: Record<string, string> = {
  游泳: "swim",
  跑步: "run",
  骑行: "bike",
  瑜伽: "yoga",
};

export const PRESET_METRICS: Array<{
  metric_name: string;
  metric_unit: string | null;
}> = [
  { metric_name: "距离", metric_unit: "m" },
  { metric_name: "时间", metric_unit: "min" },
  { metric_name: "趟数", metric_unit: "趟" },
  { metric_name: "配速", metric_unit: "min/km" },
  { metric_name: "心率", metric_unit: "bpm" },
  { metric_name: "卡路里", metric_unit: "kcal" },
];

/** Default metrics per preset sport type (by sport_name) */
export const DEFAULT_METRICS_BY_SPORT: Record<
  string,
  Array<{ metric_name: string; metric_unit: string | null }>
> = {
  游泳: [
    { metric_name: "距离", metric_unit: "m" },
    { metric_name: "时间", metric_unit: "min" },
    { metric_name: "趟数", metric_unit: "趟" },
  ],
  跑步: [
    { metric_name: "距离", metric_unit: "km" },
    { metric_name: "时间", metric_unit: "min" },
    { metric_name: "配速", metric_unit: "min/km" },
    { metric_name: "心率", metric_unit: "bpm" },
    { metric_name: "卡路里", metric_unit: "kcal" },
  ],
  骑行: [
    { metric_name: "距离", metric_unit: "km" },
    { metric_name: "时间", metric_unit: "min" },
    { metric_name: "心率", metric_unit: "bpm" },
    { metric_name: "卡路里", metric_unit: "kcal" },
  ],
  瑜伽: [
    { metric_name: "时间", metric_unit: "min" },
    { metric_name: "卡路里", metric_unit: "kcal" },
  ],
};

// ============================================================
// Metric input types
// ============================================================

export interface MetricInput {
  metricBizKey: bigint;
  metricName: string;
  metricUnit: string | null;
  value: string;
  isCustom: 0 | 1;
}

export interface SportEntryData {
  sportTypeBizKey: bigint | null;
  recordDate: string;
  metrics: MetricInput[];
  note: string;
}

export interface CustomSportData {
  sportName: string;
  selectedPresetMetrics: string[];
  customMetrics: Array<{ name: string; unit: string }>;
}

// ============================================================
// Validation
// ============================================================

export interface SportValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a sport entry before saving.
 * - sportTypeBizKey is required
 * - recordDate is required and cannot exceed today
 * - At least one metric value must be filled
 */
export function validateSportEntry(
  data: SportEntryData,
): SportValidationResult {
  const errors: string[] = [];

  if (!data.sportTypeBizKey) {
    errors.push("请选择运动类型");
  }

  if (!data.recordDate) {
    errors.push("请选择日期");
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (data.recordDate && data.recordDate > todayStr) {
    errors.push("日期不能超过今天");
  }

  const filledMetrics = data.metrics.filter((m) => m.value.trim() !== "");
  if (filledMetrics.length === 0) {
    errors.push("请至少填写一项运动指标");
  }

  // Validate metric values are valid numbers
  for (const metric of filledMetrics) {
    const num = Number(metric.value);
    if (isNaN(num) || num < 0) {
      errors.push(`${metric.metricName}数值无效`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate custom sport data before saving.
 * - sportName is required
 * - At least one metric must be selected or custom
 */
export function validateCustomSport(
  data: CustomSportData,
): SportValidationResult {
  const errors: string[] = [];

  if (!data.sportName.trim()) {
    errors.push("请输入运动名称");
  }

  if (data.sportName.trim().length > 20) {
    errors.push("运动名称不能超过20个字符");
  }

  const totalMetrics =
    data.selectedPresetMetrics.length + data.customMetrics.length;
  if (totalMetrics === 0) {
    errors.push("请至少选择一项记录指标");
  }

  // Validate custom metric names
  for (const cm of data.customMetrics) {
    if (!cm.name.trim()) {
      errors.push("自定义指标名称不能为空");
    }
    if (cm.name.trim().length > 15) {
      errors.push("指标名称不能超过15个字符");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================
// Formatting
// ============================================================

/**
 * Format metric value for display.
 */
export function formatMetricValue(value: string): string {
  if (!value) return "";
  const num = Number(value);
  if (isNaN(num)) return value;
  // Show up to 1 decimal for non-integers
  return num % 1 === 0 ? String(num) : num.toFixed(1);
}

/**
 * Get icon name for a sport type.
 */
export function getSportIcon(sportType: SportType): string {
  if (sportType.icon) return sportType.icon;
  return PRESET_SPORT_ICONS[sportType.sport_name] || "custom";
}

/**
 * Build metric inputs from SportMetric definitions.
 */
export function buildMetricInputs(
  metrics: SportMetric[],
  existingValues?: SportMetricValue[],
): MetricInput[] {
  return metrics.map((m) => {
    const existing = existingValues?.find(
      (v) => v.sport_metric_biz_key === m.biz_key,
    );
    return {
      metricBizKey: m.biz_key,
      metricName: m.metric_name,
      metricUnit: m.metric_unit,
      value: existing ? String(existing.metric_value) : "",
      isCustom: m.is_custom,
    };
  });
}

// ============================================================
// Sorting / Grouping
// ============================================================

/**
 * Separate preset and custom sport types.
 */
export function groupSportTypes(sportTypes: SportType[]): {
  presets: SportType[];
  customs: SportType[];
} {
  const presets = sportTypes.filter((s) => s.is_custom === 0);
  const customs = sportTypes.filter((s) => s.is_custom === 1);
  return { presets, customs };
}

/**
 * Create empty sport entry data with today's date.
 */
export function createEmptySportEntry(date?: string): SportEntryData {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    sportTypeBizKey: null,
    recordDate: date || todayStr,
    metrics: [],
    note: "",
  };
}

/**
 * Create empty custom sport data.
 */
export function createEmptyCustomSport(): CustomSportData {
  return {
    sportName: "",
    selectedPresetMetrics: [],
    customMetrics: [],
  };
}

/**
 * Format date for display.
 */
export function formatSportDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}年${month}月${day}日`;
}
