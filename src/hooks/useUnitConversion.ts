/**
 * useUnitConversion hook
 *
 * Provides conversion functions reactive to settings changes.
 * Wraps UnitConversion service with the current weight unit from settings store.
 *
 * Usage:
 *   const { display, store, unit, roundToPlate } = useUnitConversion(conversionService, settingsStore);
 */

import { useStore } from "zustand";
import type { UnitConversion } from "../types";
export interface UseUnitConversionResult {
  /** Current weight unit */
  unit: "kg" | "lbs";
  /** Display a kg value in the current unit */
  display: (kg: number) => string;
  /** Convert input in current unit to kg for storage */
  store: (input: number) => number;
  /** Convert kg to current unit as a number */
  toCurrentUnit: (kg: number) => number;
  /** Convert current unit value to kg */
  fromCurrentUnit: (value: number) => number;
  /** Round to nearest plate combination */
  roundToPlate: (kg: number) => number;
}

/**
 * Hook for unit conversion with reactive settings.
 */
export function useUnitConversion(
  conversionService: UnitConversion,
  settingsStore: ReturnType<
    typeof import("../stores/settings.store").createSettingsStore
  >,
): UseUnitConversionResult {
  const preferences = useStore(settingsStore, (state) => state.preferences);
  const unit = preferences.weightUnit;

  return {
    unit,
    display: (kg: number) => conversionService.displayWeight(kg, unit),
    store: (input: number) => conversionService.storeWeight(input, unit),
    toCurrentUnit: (kg: number) =>
      unit === "lbs" ? conversionService.kgToLbs(kg) : kg,
    fromCurrentUnit: (value: number) =>
      unit === "lbs" ? conversionService.lbsToKg(value) : value,
    roundToPlate: (kg: number) => conversionService.roundToPlate(kg),
  };
}
