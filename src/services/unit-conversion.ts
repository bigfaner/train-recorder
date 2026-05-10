/**
 * UnitConversion Service
 *
 * Converts between kg and lbs for display, while always
 * storing weights in kg internally. Also provides rounding
 * to the nearest achievable barbell plate combination.
 *
 * Standard barbell plates (kg): 1.25, 2.5, 5, 10, 15, 20, 25
 * Each plate can appear 0, 1, or 2 times (one per side of barbell).
 * roundToPlate computes the nearest achievable total from the
 * standard plate set, applicable to both barbell and dumbbell loads.
 */

import type { UnitConversion } from "../types";

/** Conversion factor: 1 kg = 2.20462 lbs */
export const KG_TO_LBS_FACTOR = 2.20462;

/**
 * Standard barbell plate values in kg.
 * Each plate can be used 0, 1, or 2 times (per side for barbell,
 * or total for dumbbell scenarios).
 */
export const STANDARD_PLATES_KG = [1.25, 2.5, 5, 10, 15, 20, 25] as const;

/**
 * Pre-compute all achievable weight sums from standard plates.
 * Each plate can appear 0, 1, or 2 times.
 * The achievable total = sum of selected plates (each count 0-2).
 *
 * E.g., 1.25+1.25=2.5, 2.5+2.5=5, 1.25+2.5+2.5=6.25, etc.
 */
function generateAchievableWeights(): number[] {
  const plateValues = [...STANDARD_PLATES_KG];

  // Start with {0} and accumulate: for each plate, we can add 0, 1, or 2 copies
  let currentSums = new Set<number>([0]);

  for (const plate of plateValues) {
    const nextSums = new Set<number>(currentSums);
    for (const sum of currentSums) {
      nextSums.add(sum + plate); // 1 copy
      nextSums.add(sum + 2 * plate); // 2 copies
    }
    currentSums = nextSums;
  }

  return Array.from(currentSums).sort((a, b) => a - b);
}

/** All achievable weight sums from plate combinations, sorted ascending */
const ACHIEVABLE_WEIGHTS = generateAchievableWeights();

/**
 * Round to the nearest achievable plate combination.
 * Uses binary search for efficiency.
 */
function roundToNearestAchievable(weightKg: number): number {
  if (weightKg <= 0) return 0;

  // Binary search for the closest achievable weight
  let lo = 0;
  let hi = ACHIEVABLE_WEIGHTS.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (ACHIEVABLE_WEIGHTS[mid] < weightKg) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // lo is the index of the first weight >= input
  if (lo === 0) return ACHIEVABLE_WEIGHTS[0];

  const lower = ACHIEVABLE_WEIGHTS[lo - 1];
  const upper = ACHIEVABLE_WEIGHTS[lo];

  // Pick the closer one; on tie, pick the lower
  if (weightKg - lower <= upper - weightKg) {
    return lower;
  }
  return upper;
}

/**
 * Format a number to a fixed number of decimal places, removing trailing zeros.
 */
function formatWeight(value: number): string {
  // Round to 2 decimal places, then remove trailing zeros
  const rounded = Math.round(value * 100) / 100;
  const str = rounded.toFixed(2);
  // Remove trailing zeros after decimal point
  return str.replace(/\.?0+$/, "");
}

/**
 * Create a UnitConversion service instance.
 */
export function createUnitConversionService(): UnitConversion {
  return {
    kgToLbs(kg: number): number {
      return kg * KG_TO_LBS_FACTOR;
    },

    lbsToKg(lbs: number): number {
      return lbs / KG_TO_LBS_FACTOR;
    },

    displayWeight(kg: number, unit: "kg" | "lbs"): string {
      if (unit === "kg") {
        return `${formatWeight(kg)} kg`;
      }
      const lbs = kg * KG_TO_LBS_FACTOR;
      return `${formatWeight(lbs)} lbs`;
    },

    storeWeight(input: number, unit: "kg" | "lbs"): number {
      if (unit === "kg") {
        return input;
      }
      return input / KG_TO_LBS_FACTOR;
    },

    roundToPlate(kg: number): number {
      return roundToNearestAchievable(kg);
    },
  };
}
