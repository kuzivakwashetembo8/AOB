/** GTD-RND-MAT-005 South Ward visual field trial.
 * Intentional provisional placements; no owner-accepted building assignments.
 * Does not touch either officially accepted BRK-01 apartment/garage.
 */
import {
  BRICK_SURFACES, type BrickSurfaceId, brickTileMetres,
} from "./brick-surface-catalog";

export const BUSINESS_BRICK_TILE_WIDTH_METRES = 1.485;
export const SOUTH_WARD_BUSINESS_BRICK_ASSIGNMENTS = {
  "sw-fl-corner-commercial": "BRK-04", // buff; storefront window/reveal witness
  "sw-fl-rear-shop": "BRK-10",          // whitewash; commercial street witness
  "sw-fl-rear-workshop": "BRK-09",      // reclaimed; industrial weathering witness
  "sw-fl-east-support": "BRK-07",      // charcoal; office/day-night witness
} as const satisfies Record<string, BrickSurfaceId>;
export const BRICK_FOCUS_BUILDING_ID = "sw-fl-corner-commercial";
export type BusinessBrickBuildingId = keyof typeof SOUTH_WARD_BUSINESS_BRICK_ASSIGNMENTS;

export function isBusinessBrickSurface(id: string): id is BrickSurfaceId {
  return Object.prototype.hasOwnProperty.call(BRICK_SURFACES, id) &&
    id !== "BRK-01";
}

/** Explicit diagnostic comparison; a malformed parameter never changes a wall.
 * BRK-01 stays on its already accepted two buildings (not used for override).
 */
export function parseBusinessBrickFocus(value: string | null): BrickSurfaceId | null {
  return value !== null && isBusinessBrickSurface(value) ? value : null;
}

export function businessBrickForBuilding(
  buildingId: string,
  enabled: boolean,
  focus: BrickSurfaceId | null = null,
): BrickSurfaceId | null {
  if (!enabled || !Object.prototype.hasOwnProperty.call(
    SOUTH_WARD_BUSINESS_BRICK_ASSIGNMENTS, buildingId)) return null;
  if (buildingId === BRICK_FOCUS_BUILDING_ID && focus &&
    isBusinessBrickSurface(focus)) return focus;
  return SOUTH_WARD_BUSINESS_BRICK_ASSIGNMENTS[
    buildingId as BusinessBrickBuildingId];
}

export function businessBrickPhysicalTile(surfaceId: BrickSurfaceId): {
  width: number; height: number;
} {
  return brickTileMetres(surfaceId, BUSINESS_BRICK_TILE_WIDTH_METRES);
}
