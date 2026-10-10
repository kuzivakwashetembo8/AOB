import { describe, expect, it } from "vitest";
import {
  MAX_VEHICLE_SHADOW_MESHES,
  VEHICLE_LOD_ENTER_METRES,
  VEHICLE_LOD_RETURN_METRES,
  resolveVehicleOptimizationMode,
  selectVehicleShadowCasterIds,
  usesSelectiveVehicleShadows,
  usesVehicleDistanceLOD,
  wantsFullVehicleDetail,
} from "../game/experiments/fl4-vehicle-optimization";

describe("FL4-04 isolated vehicle optimization controls", () => {
  it("never changes the accepted development default outside explicit diagnostics", () => {
    for (const mode of ["combined", "selectiveShadows", "distanceLOD"]) {
      expect(resolveVehicleOptimizationMode(mode, false)).toBe("full");
    }
    expect(resolveVehicleOptimizationMode(null, true)).toBe("full");
    expect(resolveVehicleOptimizationMode("garbage", true)).toBe("full");
    expect(resolveVehicleOptimizationMode("combined", true)).toBe("combined");
    expect(resolveVehicleOptimizationMode("selectiveShadows", true)).toBe("selectiveShadows");
    expect(resolveVehicleOptimizationMode("distanceLOD", true)).toBe("distanceLOD");
    expect(usesSelectiveVehicleShadows("full")).toBe(false);
    expect(usesSelectiveVehicleShadows("combined")).toBe(true);
    expect(usesVehicleDistanceLOD("full")).toBe(false);
    expect(usesVehicleDistanceLOD("combined")).toBe(true);
  });

  it("selects at most four substantial body submeshes with stable ties", () => {
    const candidates = [
      { id: "tiny", vertices: 1000, width: 0.1, height: 0.1, length: 0.1 },
      { id: "B", vertices: 1200, width: 2, height: 1.0, length: 4 },
      { id: "A", vertices: 1200, width: 2, height: 1.0, length: 4 },
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

  it("uses hysteresis for distant simplified vehicle visuals, never removing nearby detailed GLBs", () => {
    expect(VEHICLE_LOD_RETURN_METRES).toBeLessThan(VEHICLE_LOD_ENTER_METRES);
    expect(wantsFullVehicleDetail(true, 0)).toBe(true);
    expect(wantsFullVehicleDetail(true, 28)).toBe(true);
    expect(wantsFullVehicleDetail(true, 36)).toBe(true);
    expect(wantsFullVehicleDetail(true, 36.01)).toBe(false);
    expect(wantsFullVehicleDetail(false, 35)).toBe(false);
    expect(wantsFullVehicleDetail(false, 28)).toBe(false);
    expect(wantsFullVehicleDetail(false, 27.99)).toBe(true);
    expect(wantsFullVehicleDetail(true, Number.NaN)).toBe(true);
    expect(wantsFullVehicleDetail(false, -5)).toBe(false);
  });
});
