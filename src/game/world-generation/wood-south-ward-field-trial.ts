/** MAT-006: optional South Ward wood-family field exposure. Exactly the four
 * buildings not yet assigned image-derived brick walls receive wood imagery.
 * No new buildings/colliders are created by this surface-only comparison.
 */
import { WOOD_SURFACES, WOOD_SURFACE_IDS, type WoodSurfaceId } from "./wood-surface-catalog";

export const SOUTH_WARD_WOOD_ASSIGNMENTS = {
  "sw-fl-west-support": "WOOD-01",       // residential / natural horizontal
  "sw-fl-rear-residential": "WOOD-03",   // weathered residential exterior
  "sw-fl-skyline-west": "WOOD-09",       // upscale panel appearance, skyline experiment
  "sw-fl-skyline-east": "WOOD-05",       // vertical-grain skyline experiment
} as const satisfies Record<string, WoodSurfaceId>;
export const WOOD_FOCUS_BUILDING_ID = "sw-fl-west-support";

export function parseWoodFocus(value: string | null): WoodSurfaceId | null {
  return value !== null &&
    (WOOD_SURFACE_IDS as readonly string[]).includes(value)
      ? value as WoodSurfaceId : null;
}

export function woodSurfaceForBuilding(
  buildingId: string, enabled: boolean,
  focus: WoodSurfaceId | null = null,
): WoodSurfaceId | null {
  if (!enabled || !Object.prototype.hasOwnProperty.call(
    SOUTH_WARD_WOOD_ASSIGNMENTS, buildingId)) return null;
  if (buildingId === WOOD_FOCUS_BUILDING_ID && focus && WOOD_SURFACES[focus]) {
    return focus;
  }
  return SOUTH_WARD_WOOD_ASSIGNMENTS[
    buildingId as keyof typeof SOUTH_WARD_WOOD_ASSIGNMENTS];
}
