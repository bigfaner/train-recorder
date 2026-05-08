import {
  createUnitConversionService,
  KG_TO_LBS_FACTOR,
  STANDARD_PLATES_KG,
} from "../../src/services/unit-conversion";
import type { UnitConversion } from "../../src/types";

describe("UnitConversion Service", () => {
  let service: UnitConversion;

  beforeEach(() => {
    service = createUnitConversionService();
  });

  // ---- kgToLbs ----

  describe("kgToLbs", () => {
    it("should convert 0 kg to 0 lbs", () => {
      expect(service.kgToLbs(0)).toBeCloseTo(0, 10);
    });

    it("should convert 1 kg to 2.20462 lbs", () => {
      expect(service.kgToLbs(1)).toBeCloseTo(KG_TO_LBS_FACTOR, 5);
    });

    it("should convert 100 kg to 220.462 lbs", () => {
      expect(service.kgToLbs(100)).toBeCloseTo(100 * KG_TO_LBS_FACTOR, 5);
    });

    it("should convert typical barbell weight 20 kg", () => {
      expect(service.kgToLbs(20)).toBeCloseTo(20 * KG_TO_LBS_FACTOR, 5);
    });
  });

  // ---- lbsToKg ----

  describe("lbsToKg", () => {
    it("should convert 0 lbs to 0 kg", () => {
      expect(service.lbsToKg(0)).toBeCloseTo(0, 10);
    });

    it("should round-trip: kg → lbs → kg", () => {
      const originalKg = 85;
      const lbs = service.kgToLbs(originalKg);
      const backToKg = service.lbsToKg(lbs);
      expect(backToKg).toBeCloseTo(originalKg, 10);
    });

    it("should convert 45 lbs to approximately 20.4117 kg", () => {
      expect(service.lbsToKg(45)).toBeCloseTo(45 / KG_TO_LBS_FACTOR, 5);
    });
  });

  // ---- displayWeight ----

  describe("displayWeight", () => {
    it("should format kg with 'kg' unit label", () => {
      expect(service.displayWeight(85, "kg")).toBe("85 kg");
    });

    it("should format lbs by converting and adding 'lbs' label", () => {
      const result = service.displayWeight(85, "lbs");
      expect(result).toContain("lbs");
      const numericPart = parseFloat(result);
      expect(numericPart).toBeCloseTo(85 * KG_TO_LBS_FACTOR, 2);
    });

    it("should handle decimal kg values", () => {
      expect(service.displayWeight(2.5, "kg")).toBe("2.5 kg");
    });

    it("should handle 0 weight", () => {
      expect(service.displayWeight(0, "kg")).toBe("0 kg");
    });

    it("should display weight with reasonable precision", () => {
      const result = service.displayWeight(100, "lbs");
      // Should not have excessive decimal places
      const parts = result.split(" ");
      const num = parseFloat(parts[0]);
      expect(Number.isFinite(num)).toBe(true);
      // Should be within reasonable display precision (2 decimal places)
      const decimalPart = parts[0].includes(".") ? parts[0].split(".")[1] : "";
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    });
  });

  // ---- storeWeight ----

  describe("storeWeight", () => {
    it("should return kg value unchanged when unit is kg", () => {
      expect(service.storeWeight(85, "kg")).toBe(85);
    });

    it("should convert lbs to kg when unit is lbs", () => {
      const result = service.storeWeight(187.39, "lbs");
      expect(result).toBeCloseTo(187.39 / KG_TO_LBS_FACTOR, 5);
    });

    it("should store 0 correctly regardless of unit", () => {
      expect(service.storeWeight(0, "kg")).toBe(0);
      expect(service.storeWeight(0, "lbs")).toBeCloseTo(0, 10);
    });

    it("should handle round-trip: display → store correctly for kg", () => {
      const original = 100;
      const stored = service.storeWeight(original, "kg");
      expect(stored).toBe(original);
    });

    it("should handle round-trip: display → store correctly for lbs", () => {
      const storedKg = 100;
      const displayLbs = service.kgToLbs(storedKg);
      const restoredKg = service.storeWeight(displayLbs, "lbs");
      expect(restoredKg).toBeCloseTo(storedKg, 5);
    });
  });

  // ---- roundToPlate ----

  describe("roundToPlate", () => {
    it("should return exact plate combination unchanged", () => {
      // 20 kg is a standard plate (2 x 10)
      expect(service.roundToPlate(20)).toBe(20);
    });

    it("should round 21 kg to nearest plate combination", () => {
      // 21 is not achievable; nearest should be 21.25 (20+1.25) or 20
      const result = service.roundToPlate(21);
      // Verify result is close to 21
      expect(Math.abs(result - 21)).toBeLessThanOrEqual(1.25);
    });

    it("should round 22.8 kg to 22.5 kg (2*10+2.5)", () => {
      expect(service.roundToPlate(22.8)).toBe(22.5);
    });

    it("should round 23 kg to 22.5 kg", () => {
      expect(service.roundToPlate(23)).toBe(22.5);
    });

    it("should round 23.8 kg to 23.75 kg (20+2.5+1.25)", () => {
      expect(service.roundToPlate(23.8)).toBe(23.75);
    });

    it("should round 1 kg to 1.25 kg (smallest plate)", () => {
      // 1.25 is the smallest achievable plate value
      expect(service.roundToPlate(1)).toBe(1.25);
    });

    it("should round 0.5 kg to 0 (below minimum plate)", () => {
      // 0.5 is less than the smallest plate (1.25), rounds to 0
      expect(service.roundToPlate(0.5)).toBe(0);
    });

    it("should handle 0 kg", () => {
      expect(service.roundToPlate(0)).toBe(0);
    });

    it("should handle large weights (many plates)", () => {
      // 2*25 + 2*20 + 2*15 + 2*10 + 2*5 + 2*2.5 + 2*1.25 = 157.5
      expect(service.roundToPlate(157.5)).toBe(157.5);
    });

    it("should round to achievable combinations only", () => {
      // Test several values and verify results are close to input
      const testValues = [5, 10, 15, 30, 50, 75, 100];
      for (const val of testValues) {
        const result = service.roundToPlate(val);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(Math.abs(result - val)).toBeLessThanOrEqual(
          Math.max(...STANDARD_PLATES_KG),
        );
      }
    });

    it("should handle 42.5 correctly (25+15+2.5)", () => {
      expect(service.roundToPlate(42.5)).toBe(42.5);
    });

    it("should handle 47.5 correctly (25+20+2.5)", () => {
      expect(service.roundToPlate(47.5)).toBe(47.5);
    });

    it("should handle 62.5 correctly (25+25+10+2.5)", () => {
      expect(service.roundToPlate(62.5)).toBe(62.5);
    });
  });
});
