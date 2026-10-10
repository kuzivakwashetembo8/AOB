/**
 * FL4-04: diagnostic-only vehicle optimizations. Preserve accepted GLB assets,
 * calibrated shapes and Rapier colliders. Nothing here is a release policy.
 */
export type FL4VehicleOptimizationMode = "full" | "selectiveShadows";

// FL4-06 accepted direction: old procedural car graphics are NOT future LOD.
// Only select/deselect shadow participation; always render accepted GLBs.
export const MAX_VEHICLE_SHADOW_MESHES = 4;

/**
 * Accepted imported vehicles are the normal GTD development and mobile-review
 * representation, including the public main build. The rejected procedural
 * comparison requires BOTH diagnostics and an explicitly nonproduction host.
 * There is never an automatic visual fallback during GLB loading or failure.
 */
export function shouldRenderAcceptedImportedVehicles(
  requestedVehicleMode: string | null,
  diagnosticsEnabled: boolean,
  productionHostname: boolean,
): boolean {
  return !(
    requestedVehicleMode === "baseline" &&
    diagnosticsEnabled &&
    !productionHostname
  );
}

export function resolveVehicleOptimizationMode(
  requested: string | null,
  diagnosticsEnabled: boolean,
  finalReviewEnabled = false,
): FL4VehicleOptimizationMode {
  // FL-4 closeout candidate only: allow the measured shadow simplification in
  // *normal* gameplay, without the diagnostic sample collector being active.
  // Outside the explicit final-review flag, development remains full fidelity
  // until the user visually accepts this change. On a review, the explicit
  // diagnostics "full" mode is still available for rollback/A-B comparison.
  if (!diagnosticsEnabled && !finalReviewEnabled) return "full";
  if (finalReviewEnabled && requested === null) return "selectiveShadows";
  if (!diagnosticsEnabled) return "selectiveShadows";
  switch (requested) {
    case "selectiveShadows":
      return requested;
    default:
      return "full";
  }
}

export function usesSelectiveVehicleShadows(mode: FL4VehicleOptimizationMode): boolean {
  return mode === "selectiveShadows";
}

export interface VehicleShadowCandidate {
  readonly id: string;
  readonly vertices: number;
  readonly width: number;
  readonly height: number;
  readonly length: number;
}

/**
 * Select substantial silhouette components to test their contribution to the
 * shadow map. Deterministic ties avoid different shadow passes across runs.
 * This is a test policy, NOT a substitute for authored body/wheel shadow LODs.
 */
export function selectVehicleShadowCasterIds(
  candidates: readonly VehicleShadowCandidate[],
  limit = MAX_VEHICLE_SHADOW_MESHES,
): readonly string[] {
  const count = Math.max(0, Math.floor(Number.isFinite(limit) ? limit : 0));
  return candidates
    .filter((part) =>
      part.vertices > 0 &&
      [part.width, part.height, part.length].every((value) => Number.isFinite(value) && value >= 0),
    )
    .map((part) => ({
      id: part.id,
      // Broad body panels/roll cages dominate silhouette shadow projection.
      area: part.width * part.length +
        0.4 * part.height * (part.width + part.length),
    }))
    .sort((a, b) => b.area - a.area || a.id.localeCompare(b.id))
    .slice(0, count)
    .map((part) => part.id);
}

