/** MAT-007 authored two-tower facade substitution, not a randomized
 * material assignment. Building silhouettes/physics remain South Ward's
 * existing podium/tower footprints. These are opaque glass-look previews.
 */
import { GLASS_SURFACES, isGlassSurfaceId, type GlassSurfaceId } from "./glass-surface-catalog";
export const SOUTH_WARD_GLASS_TOWERS = {
  "sw-fl-skyline-west": "GLS-01",
  "sw-fl-skyline-east": "GLS-03",
} as const satisfies Record<string, GlassSurfaceId>;
export const GLASS_FOCUS_BUILDING_ID = "sw-fl-skyline-east";
export function isGlassTower(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SOUTH_WARD_GLASS_TOWERS,id);
}
export function parseGlassFocus(raw: string | null): GlassSurfaceId | null {
  return raw !== null && isGlassSurfaceId(raw) ? raw : null;
}
export function glassSurfaceForBuilding(
  buildingId: string, enabled: boolean,
  focus: GlassSurfaceId | null = null,
): GlassSurfaceId | null {
  if (!enabled || !isGlassTower(buildingId)) return null;
  if (buildingId === GLASS_FOCUS_BUILDING_ID && focus && GLASS_SURFACES[focus]) return focus;
  return SOUTH_WARD_GLASS_TOWERS[
    buildingId as keyof typeof SOUTH_WARD_GLASS_TOWERS];
}
