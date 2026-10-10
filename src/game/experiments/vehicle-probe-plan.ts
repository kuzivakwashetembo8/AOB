/**
 * EXP-VEH-001: deterministic metadata and strictly uniform fit for
 * independently licensed/hosted evaluation-only vehicle specimens.
 * These are NOT final Meridian assets.
 */
export const VEHICLE_PROBE_SOURCES = [
  {
    id: "offroad" as const,
    label: "Forked off-road buggy — temporary specimen",
    rootUrl: "https://raw.githubusercontent.com/interlinkglobal/Car-Game-ThreeJS/f639c35978222d9701514fb35f0d7d965d4136aa/public/vehicals/",
    fileName: "car.glb",
    repository: "https://github.com/interlinkglobal/Car-Game-ThreeJS",
    bytes: 6062428,
  },
  {
    id: "sports" as const,
    label: "Forked Ferrari — temporary specimen",
    rootUrl: "https://raw.githubusercontent.com/interlinkglobal/JS-3D-Car/b2ce7c65e4e62e6486a39aed2c7dac89f7c0fa0f/models/",
    fileName: "ferrari.glb",
    repository: "https://github.com/interlinkglobal/JS-3D-Car",
    bytes: 1681572,
  },
] as const;

export type VehicleProbeSource = (typeof VEHICLE_PROBE_SOURCES)[number];

export interface ProbeBounds {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Experiment-only approximate real-world visual length by specimen class. */
export const VEHICLE_CLASS_TARGET_LENGTH_METRES = { offroad: 3.8, sports: 4.53 } as const;
export const PARKED_VEHICLE_VISUAL_ENVELOPE: ProbeBounds = { x: 1.66, y: 1.48, z: 3.84 };

export function sourceForExistingSlot(slotIndex: number): VehicleProbeSource {
  return VEHICLE_PROBE_SOURCES[slotIndex % VEHICLE_PROBE_SOURCES.length]!;
}

export function planImportedVehicleFit(bounds: ProbeBounds, targetLengthMetres = 4.53): {
  readonly rotateYRadians: number;
  readonly uniformScale: number;
  readonly originalWidth: number;
  readonly originalLength: number;
  readonly originalHeight: number;
} {
  if (![bounds.x, bounds.y, bounds.z].every((v) => Number.isFinite(v) && v > 0)) {
    throw new Error("Vehicle specimen has invalid geometry bounds");
  }
  const xIsLong = bounds.x > bounds.z;
  const originalWidth = Math.min(bounds.x, bounds.z);
  const originalLength = Math.max(bounds.x, bounds.z);
  const uniformScale = Math.min(
    targetLengthMetres / originalLength,
  );
  if (!Number.isFinite(targetLengthMetres) || targetLengthMetres <= 0 || !Number.isFinite(uniformScale) || uniformScale <= 0) {
    throw new Error("Vehicle specimen cannot be uniformly normalized");
  }
  return {
    rotateYRadians: xIsLong ? Math.PI / 2 : 0,
    uniformScale,
    originalWidth,
    originalLength,
    originalHeight: bounds.y,
  };
}
