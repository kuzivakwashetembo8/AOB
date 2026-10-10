import { describe, expect, it } from "vitest";
import {
  MAX_VEHICLE_SHADOW_MESHES,
  resolveVehicleOptimizationMode,
  selectVehicleShadowCasterIds,
  shouldRenderAcceptedImportedVehicles,
  usesSelectiveVehicleShadows,
} from "../game/experiments/fl4-vehicle-optimization";

describe("FL4-04 approved vehicle-only rendering policy", () => {
  it("never enables procedural-car LOD in normal play or final review", () => {
    for (const obsolete of ["combined", "distanceLOD", "bad-mode"]) {
      expect(resolveVehicleOptimizationMode(obsolete, false, false)).toBe("full");
      expect(resolveVehicleOptimizationMode(obsolete, true, false)).toBe("full");
      expect(resolveVehicleOptimizationMode(obsolete, true, true)).toBe("full");
    }
    expect(resolveVehicleOptimizationMode(null, false, false)).toBe("full");
    expect(resolveVehicleOptimizationMode(null, true, false)).toBe("full");
    expect(resolveVehicleOptimizationMode(null, false, true)).toBe("selectiveShadows");
    expect(resolveVehicleOptimizationMode(null, true, true)).toBe("selectiveShadows");
    expect(resolveVehicleOptimizationMode("full", true, true)).toBe("full");
    expect(resolveVehicleOptimizationMode("selectiveShadows", true)).toBe("selectiveShadows");
    expect(resolveVehicleOptimizationMode("selectiveShadows", false, false)).toBe("full");
    expect(resolveVehicleOptimizationMode("full", false, true)).toBe("selectiveShadows");
    expect(usesSelectiveVehicleShadows("full")).toBe(false);
    expect(usesSelectiveVehicleShadows("selectiveShadows")).toBe(true);
  });

  it("enables accepted GLBs on the public mobile-review production host by default", () => {
    for (const isProduction of [true, false]) {
      for (const diagnostics of [true, false]) {
        expect(shouldRenderAcceptedImportedVehicles(null, diagnostics, isProduction)).toBe(true);
        expect(shouldRenderAcceptedImportedVehicles("imports", diagnostics, isProduction)).toBe(true);
      }
    }
    // Production never exposes the rejected cars, even via an old A/B URL.
    expect(shouldRenderAcceptedImportedVehicles("baseline", false, true)).toBe(true);
    expect(shouldRenderAcceptedImportedVehicles("baseline", true, true)).toBe(true);
    // The old cars exist solely for explicit nonproduction diagnostic A/B.
    expect(shouldRenderAcceptedImportedVehicles("baseline", false, false)).toBe(true);
    expect(shouldRenderAcceptedImportedVehicles("baseline", true, false)).toBe(false);
    // Production mobile-review mode selects the tested reduced-caster variant.
    expect(resolveVehicleOptimizationMode(null, false, true)).toBe("selectiveShadows");
    expect(resolveVehicleOptimizationMode("full", true, true)).toBe("full");
  });

  it("selects bounded substantial shadow geometry with deterministic ties", () => {
    const candidates = [
      { id: "tiny", vertices: 1000, width: 0.1, height: 0.1, length: 0.1 },
      { id: "B", vertices: 1200, width: 2, height: 1, length: 4 },
      { id: "A", vertices: 1200, width: 2, height: 1, length: 4 },
      { id: "C", vertices: 100, width: 1.5, height: 0.5, length: 2 },
      { id: "D", vertices: 500, width: 1.2, height: 0.8, length: 2.3 },
      { id: "zero", vertices: 0, width: 10, height: 10, length: 10 },
      { id: "invalid", vertices: 500, width: Infinity, height: 1, length: 2 },
    ];
    expect(MAX_VEHICLE_SHADOW_MESHES).toBe(4);
    expect(selectVehicleShadowCasterIds(candidates)).toEqual(["A", "B", "D", "C"]);
    expect(selectVehicleShadowCasterIds([...candidates].reverse())).toEqual(["A", "B", "D", "C"]);
    expect(selectVehicleShadowCasterIds(candidates, 0)).toEqual([]);
    expect(selectVehicleShadowCasterIds([], 4)).toEqual([]);
  });
});
