/** MAT-009: two owner-approved architectural glass modes.
 * East/grey: continuous glass beneath physical 3D mullions/transoms, with a
 * dark crown completed by matching frame rails.
 * West/blue: the same pre-existing continuous UV policy, no frame grid, and
 * the approved subtle pale metal edge trim preserved unchanged.
 * Visual only; no new physics/collision or modified building massing.
 */
import type { BuildingMass, BoxPrimitive, GeneratedBuildingPlan } from "./architecture-plan";
import type { FacadeSide } from "./schema";

export const BLUE_GLASS_TOWER_ID = "sw-fl-skyline-west";
export const GREY_GLASS_TOWER_ID = "sw-fl-skyline-east";
export const GREY_MULLION_SPACING_METRES = 2.3;
const FRAME_PROJECTION = 0.18;
const FRAME_DEPTH = 0.17;
const VERTICAL_WIDTH = 0.13;
const TRANSOM_HEIGHT = 0.13;
const CAP_HEIGHT = 0.26;
const CAP_DEPTH = 0.24;
const SIDES: readonly FacadeSide[] = ["front", "rear", "left", "right"];

function edgeBox(
  mass: BuildingMass, side: FacadeSide, distance: number,
  y: number, span: number, height: number, depth: number,
  id: string, role: "metal" | "trim",
): BoxPrimitive {
  const frontRear = side === "front" || side === "rear";
  const x = frontRear ? mass.centerX + distance : mass.centerX +
    (side === "left" ? -1 : 1) * (mass.width / 2 + FRAME_PROJECTION);
  const z = frontRear ? mass.centerZ +
    (side === "rear" ? -1 : 1) * (mass.depth / 2 + FRAME_PROJECTION)
    : mass.centerZ + distance;
  return {
    id, role,
    center: { x, y, z },
    size: { x: frontRear ? span : depth, y: height, z: frontRear ? depth : span },
  };
}

/** Every rail is a measurable box projecting beyond the original .24 m wall.
 * The four façades and both mass tiers are authored from identical geometry,
 * rather than baking any grid into a texture. No new collision meshes.
 */
export function planSkylineArchitecturalGeometry(
  plan: GeneratedBuildingPlan,
  buildingId: string,
  enableGreyFraming = true,
): readonly BoxPrimitive[] {
  if (buildingId !== BLUE_GLASS_TOWER_ID && buildingId !== GREY_GLASS_TOWER_ID) return [];
  const pieces: BoxPrimitive[] = [];
  for (const mass of plan.masses) {
    const roofY = mass.baseY + mass.height;
    for (const side of SIDES) {
      const frontRear = side === "front" || side === "rear";
      const span = frontRear ? mass.width : mass.depth;
      // Framed grey crowns terminate in the same DARK metal as the real
      // mullions and transoms. The unframed blue reference retains its
      // previously accepted, pale architectural (never wooden) perimeter.
      const cap = edgeBox(mass, side, 0, roofY + 0.11,
        span + CAP_DEPTH, CAP_HEIGHT, CAP_DEPTH,
        `skyline-cap:${mass.id}:${side}`,
        buildingId === GREY_GLASS_TOWER_ID ? "metal" : "trim");
      const edge = frontRear ? mass.depth / 2 : mass.width / 2;
      pieces.push({
        ...cap,
        center: {
          ...cap.center,
          [frontRear ? "z" : "x"]: (frontRear ? mass.centerZ : mass.centerX) +
            (side === "rear" || side === "left" ? -1 : 1) * (edge + 0.07),
        },
      });
      if (buildingId !== GREY_GLASS_TOWER_ID || !enableGreyFraming) continue;
      const columns = Math.max(2, Math.round(span / GREY_MULLION_SPACING_METRES));
      for (let i = 0; i <= columns; i++) {
        const offset = -span / 2 + span * i / columns;
        // Reach into the roof-edge rail to avoid a bright, unframed gap
        // between the upper mullion tips and the curtain-wall termination.
        pieces.push(edgeBox(mass, side, offset,
          mass.baseY + (mass.height + 0.08) / 2,
          VERTICAL_WIDTH, mass.height + 0.08, FRAME_DEPTH,
          `skyline-mullion:${mass.id}:${side}:c${i}`, "metal"));
      }
      // Align horizontal transoms to true floor heights, not texture pixels.
      const floorHeight = mass.height / mass.floors;
      for (let floor = 1; floor < mass.floors; floor++) {
        pieces.push(edgeBox(mass, side, 0,
          mass.baseY + floor * floorHeight,
          span + VERTICAL_WIDTH, TRANSOM_HEIGHT, FRAME_DEPTH,
          `skyline-transom:${mass.id}:${side}:f${floor}`, "metal"));
      }
    }
  }
  return pieces;
}

/** A single owner's GLS image covers the ENTIRE envelope of either tower.
 * Every wall box shares building-local x/z and y, across podium and upper
 * mass alike: no per-floor image restart, 15.2m repeat, or block highlight.
 * Preserve exactly the successful blue UV/crop numbers on both modes.
 * The grey 3D strips are independently overlaid on this continuous material.
 */
export function continuousGlassFacadeUV(
  vertex: { x: number; y: number; z: number },
  normal: { x: number; y: number; z: number },
  envelope: Readonly<{ width: number; depth: number; height: number }>,
): { u: number; v: number } {
  const side = Math.abs(normal.x) > 0.5;
  const distance = side ? vertex.z : vertex.x;
  const span = side ? envelope.depth : envelope.width;
  return {
    u: 0.18 + 0.64 * (distance / span + 0.5),
    v: 0.08 + 0.84 * (vertex.y / envelope.height),
  };
}

/** Historical MAT-008 export retained for callers and visual regressions. */
export const continuousBlueGlassUV = continuousGlassFacadeUV;
