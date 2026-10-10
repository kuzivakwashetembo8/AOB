import { describe, expect, it } from "vitest";
import {
  VEHICLE_CLASS_TARGET_LENGTH_METRES,
  VEHICLE_PROBE_SOURCES,
  planImportedVehicleFit,
  sourceForExistingSlot,
} from "../game/experiments/vehicle-probe-plan";
import { FIRST_LIGHT_CITY_SPEC, planStreetContext } from "../game/world-generation";

describe("EXP-VEH-001 imported parked-car experiment contract", () => {
  it("assigns the two independent specimens deterministically to existing car slots", () => {
    const existing = planStreetContext(FIRST_LIGHT_CITY_SPEC).items
      .filter((item) => item.kind === "parked-car")
      .sort((a, b) => a.id.localeCompare(b.id));
    expect(existing.length).toBeGreaterThanOrEqual(2);
    expect(new Set(existing.map((car) => car.id)).size).toBe(existing.length);
    expect(sourceForExistingSlot(0).id).toBe("offroad");
    expect(sourceForExistingSlot(1).id).toBe("sports");
    expect(VEHICLE_PROBE_SOURCES.map((specimen) => specimen.id)).toEqual(["offroad", "sports"]);
    expect(existing.map((_, index) => sourceForExistingSlot(index).id))
      .toEqual(existing.map((_, index) => index % 2 === 0 ? "offroad" : "sports"));
  });

  it("uses original proportions at class-specific target length, without altering physics", () => {
    const original = { x: 2.2, y: 1.5, z: 4.5 };
    const fit = planImportedVehicleFit(original, VEHICLE_CLASS_TARGET_LENGTH_METRES.sports);
    expect(fit.rotateYRadians).toBe(0);
    expect(fit.uniformScale).toBeGreaterThan(0);
    expect(fit.uniformScale * original.z).toBeCloseTo(VEHICLE_CLASS_TARGET_LENGTH_METRES.sports);
    expect(fit.uniformScale * original.x / (fit.uniformScale * original.z)).toBeCloseTo(original.x / original.z);
    expect(fit.uniformScale * original.y / (fit.uniformScale * original.z)).toBeCloseTo(original.y / original.z);
    const rotated = planImportedVehicleFit({ x: 4.5, y: 1.5, z: 2.2 }, VEHICLE_CLASS_TARGET_LENGTH_METRES.sports);
    expect(rotated.rotateYRadians).toBeCloseTo(Math.PI / 2);
    expect(rotated.uniformScale).toBeCloseTo(fit.uniformScale);
    expect(planImportedVehicleFit(original, VEHICLE_CLASS_TARGET_LENGTH_METRES.offroad).uniformScale).toBeLessThan(fit.uniformScale);
    expect(() => planImportedVehicleFit({ x: 0, y: 1.5, z: 4.5 })).toThrow();
    expect(() => planImportedVehicleFit({ x: Infinity, y: 1.5, z: 4.5 })).toThrow();
    expect(() => planImportedVehicleFit(original, 0)).toThrow();
  });

  it("keeps sample sources external and immutable, never bundled in GTD", () => {
    for (const specimen of VEHICLE_PROBE_SOURCES) {
      expect(specimen.rootUrl).toMatch(/^https:\/\/raw\.githubusercontent\.com\/interlinkglobal\//);
      expect(specimen.rootUrl).toMatch(/[0-9a-f]{40}/);
      expect(specimen.fileName).toMatch(/\.glb$/);
      expect(specimen.bytes).toBeGreaterThan(0);
    }
  });
});
