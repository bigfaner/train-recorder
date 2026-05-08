/**
 * Settings page helper functions.
 *
 * Pure functions for option generation and label formatting.
 */

import type { SelectOption } from "./SettingsComponents";
import type { ExportRange } from "../../types";

/** Rest time options in seconds */
const REST_TIME_OPTIONS = [90, 120, 180, 240, 300];

/** Get rest time select options */
export function getRestTimeOptions(): SelectOption<number>[] {
  return REST_TIME_OPTIONS.map((seconds) => ({
    label: `${seconds} 秒`,
    value: seconds,
  }));
}

/** Get export range select options */
export function getExportRangeOptions(): SelectOption<ExportRange>[] {
  return [
    { label: "全部数据", value: "all" },
    { label: "最近 3 个月", value: "3m" },
    { label: "最近 6 个月", value: "6m" },
  ];
}

/** Format weight unit as display label */
export function formatUnitLabel(unit: "kg" | "lbs"): string {
  return unit === "kg" ? "公斤 (kg)" : "磅 (lbs)";
}
