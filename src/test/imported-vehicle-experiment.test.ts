import { describe, expect, it } from "vitest";
import {
  PARKED_VEHICLE_VISUAL_ENVELOPE,
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

  it("uses a uniform scale; never changes collision envelopes", () => {
    const original = { x: 2.2, y: 1.5, z: 4.5 };
    const fit = planImportedVehicleFit(original);
    expect(fit.rotateYRadians).toBe(0);
    expect(fit.uniformScale).toBeGreaterThan(0);
    expect(fit.uniformScale * original.x).toBeLessThanOrEqual(PARKED_VEHICLE_VISUAL_ENVELOPE.x + 1e-6);
    expect(fit.uniformScale * original.y).toBeLessThanOrEqual(PARKED_VEHICLE_VISUAL_ENVELOPE.y + 1e-6);
    expect(fit.uniformScale * original.z).toBeLessThanOrEqual(PARKED_VEHICLE_VISUAL_ENVELOPE.z + 1e-6);
    const rotated = planImportedVehicleFit({ x: 4.5, y: 1.5, z: 2.2 });
    expect(rotated.rotateYRadians).toBeCloseTo(Math.PI / 2);
    expect(rotated.uniformScale).toBeCloseTo(fit.uniformScale);
    expect(() => planImportedVehicleFit({ x: 0, y: 1.5, z: 4.5 })).toThrow();
    expect(() => planImportedVehicleFit({ x: Infinity, y: 1.5, z: 4.5 })).toThrow();
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
