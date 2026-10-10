/**
 * EXP-VEH-001 — visual size calibration for evaluation-only imported GLBs.
 *
 * Source specimens are NOT the first GTD sedan and their usage rights are
 * unverified. Target lengths are explicit, reviewable calibration hypotheses.
 * Length is normalized with a uniform fit. Optional per-class X/Y corrective
 * factors are then separately tested as experimental adjustments, never as
 * immutable specs for the eventual first GTD sedan.
 */
export const VEHICLE_PROBE_SOURCES = [
  {
    id: "offroad" as const,
    label: "Forked off-road buggy — temporary specimen",
    rootUrl: "https://raw.githubusercontent.com/interlinkglobal/Car-Game-ThreeJS/f639c35978222d9701514fb35f0d7d965d4136aa/public/vehicals/",
    fileName: "car.glb",
    repository: "https://github.com/interlinkglobal/Car-Game-ThreeJS",
    bytes: 6062428,
    // Trial size of a compact short-wheelbase off-road vehicle, not the
    // maker's certified dimensions for this stylized model.
    targetLengthMeters: 4.05,
    // Iteration 3 visual experiment: slightly widen the overall stance.
    // This is a proportional X-axis deformation, NOT a new source model.
    widthMultiplier: 1.10,
    heightMultiplier: 1,
  },
  {
    id: "sports" as const,
    label: "Forked Ferrari — temporary specimen",
    rootUrl: "https://raw.githubusercontent.com/interlinkglobal/JS-3D-Car/b2ce7c65e4e62e6486a39aed2c7dac89f7c0fa0f/models/",
    fileName: "ferrari.glb",
    repository: "https://github.com/interlinkglobal/JS-3D-Car",
    bytes: 1681572,
    // Ferrari 458 Italia class approximate published exterior length,
    // not an approval to reproduce a licensed branded asset.
    targetLengthMeters: 4.53,
    // Iteration 3 visual experiment: increase height by the requested ~10%.
    widthMultiplier: 1,
    heightMultiplier: 1.10,
  },
] as const;

export type VehicleProbeSource = (typeof VEHICLE_PROBE_SOURCES)[number];

export interface ProbeBounds {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
export interface ProbeShapeAdjustment {
  readonly widthMultiplier: number;
  readonly heightMultiplier: number;
}
export interface ImportedVehicleFit {
  readonly rotateYRadians: number;
  readonly uniformScale: number;
  readonly originalWidth: number;
  readonly originalLength: number;
  readonly originalHeight: number;
  readonly worldDimensions: ProbeBounds;
  readonly shapeAdjustment: ProbeShapeAdjustment;
  readonly targetLengthMeters: number;
  readonly warnings: readonly string[];
}

export function sourceForExistingSlot(slotIndex: number): VehicleProbeSource {
  return VEHICLE_PROBE_SOURCES[slotIndex % VEHICLE_PROBE_SOURCES.length]!;
}

/**
 * Choose a single uniform fit from the source's longest horizontal dimension
 * (the likely longitudinal body axis). Final source widths/heights remain
 * intrinsically proportional. The seeded original item's scaling is
 * cancelled so *every* specimen of the same class reaches the target length.
 *
 * The first fit is uniform and fixes world length; width/height adjustment
 * is a separate, opt-in correction for this experiment's visual studies.
 * The existing road, yaw, car ID and placement are never modified.
 */
export function planImportedVehicleFit(
  bounds: ProbeBounds,
  targetLengthMeters: number,
  parkedSlotScale = 1,
  shapeAdjustment: ProbeShapeAdjustment = { widthMultiplier: 1, heightMultiplier: 1 },
): ImportedVehicleFit {
  if (![bounds.x, bounds.y, bounds.z, targetLengthMeters, parkedSlotScale,
    shapeAdjustment.widthMultiplier, shapeAdjustment.heightMultiplier]
    .every((v) => Number.isFinite(v) && v > 0)) {
    throw new Error("Vehicle specimen dimensions, target length and parking scale must be positive and finite");
  }

  const xIsLong = bounds.x > bounds.z;
  const originalWidth = Math.min(bounds.x, bounds.z);
  const originalLength = Math.max(bounds.x, bounds.z);
  const uniformScale = targetLengthMeters / (originalLength * parkedSlotScale);
  const worldScale = uniformScale * parkedSlotScale;
  const worldDimensions: ProbeBounds = {
    x: originalWidth * worldScale * shapeAdjustment.widthMultiplier,
    y: bounds.y * worldScale * shapeAdjustment.heightMultiplier,
    z: originalLength * worldScale,
  };
  const warnings: string[] = [];
  // Diagnostic constraints, not automatic nonuniform stretching or shrinking.
  if (worldDimensions.x < 1.4 || worldDimensions.x > 2.5) {
    warnings.push("Source proportions yield unusual vehicle width; inspect curb and lane clearance");
  }
  if (worldDimensions.y < 1.0 || worldDimensions.y > 2.55) {
    warnings.push("Source proportions yield unusual vehicle height; verify Voight scale and road contact");
  }
  if (worldDimensions.x > 3.8 || worldDimensions.y > 3.8) {
    throw new Error("Vehicle sample proportions exceed the safe single-lane evaluation envelope");
  }

  return {
    rotateYRadians: xIsLong ? Math.PI / 2 : 0,
    uniformScale,
    originalWidth,
    originalLength,
    originalHeight: bounds.y,
    worldDimensions,
    shapeAdjustment: { ...shapeAdjustment },
    targetLengthMeters,
    warnings,
  };
}
