import { featureRandom } from "./seeded-variation";
import type { BoxPrimitive, BuildingMass, GeneratedBuildingPlan, PlannedOpening } from "./architecture-plan";
import type { FacadeSide, ResolvedBuildingSpec } from "./schema";

export type FacadeDetailKind = "sill" | "mullion" | "awning" | "vent" | "utility-box" | "downpipe";
export type DecalKind = "grime" | "patch" | "signage" | "graffiti";
export const FACADE_DETAIL_CATALOG: Readonly<Record<FacadeDetailKind, { role: BoxPrimitive["role"]; geometry: true }>> = {
  sill: { role: "trim", geometry: true }, mullion: { role: "trim", geometry: true },
  awning: { role: "metal", geometry: true }, vent: { role: "metal", geometry: true },
  "utility-box": { role: "metal", geometry: true }, downpipe: { role: "metal", geometry: true },
};
export interface DecalHook {
  readonly id: string; readonly kind: DecalKind; readonly massId: string;
  readonly facade: FacadeSide; readonly offset: number; readonly height: number;
  readonly width: number; readonly intensity: number;
}
export interface FacadeDetailPlan {
  readonly primitives: readonly BoxPrimitive[]; readonly decals: readonly DecalHook[];
}
function sideCenter(mass: BuildingMass, side: FacadeSide, offset: number, y: number, outward: number) {
  if (side === "front") return { x: mass.centerX + offset, y, z: mass.centerZ + mass.depth / 2 + outward };
  if (side === "rear") return { x: mass.centerX + offset, y, z: mass.centerZ - mass.depth / 2 - outward };
  if (side === "left") return { x: mass.centerX - mass.width / 2 - outward, y, z: mass.centerZ + offset };
  return { x: mass.centerX + mass.width / 2 + outward, y, z: mass.centerZ + offset };
}
function panel(id: string, kind: FacadeDetailKind, mass: BuildingMass, side: FacadeSide,
  offset: number, y: number, width: number, height: number, thickness: number, outward = 0.19): BoxPrimitive {
  const alongX = side === "front" || side === "rear";
  return { id: "detail:" + id, role: FACADE_DETAIL_CATALOG[kind].role, templateId: "facade-" + kind,
    center: sideCenter(mass, side, offset, y, outward),
    size: { x: alongX ? width : thickness, y: height, z: alongX ? thickness : width } };
}
function awning(opening: PlannedOpening, mass: BuildingMass): BoxPrimitive {
  const alongX = opening.facade === "front" || opening.facade === "rear";
  return { id: "detail:awning:" + opening.id, role: "metal", templateId: "facade-awning",
    center: sideCenter(mass, opening.facade, opening.offset, opening.sillHeight + opening.height + 0.22, 0.46),
    size: { x: alongX ? opening.width + 0.36 : 0.78, y: 0.12, z: alongX ? 0.78 : opening.width + 0.36 } };
}
/** Pure visual details; never changes wall cuts, collision or interaction anchors. */
export function planFacadeDetails(spec: ResolvedBuildingSpec, plan: GeneratedBuildingPlan): FacadeDetailPlan {
  const primitives: BoxPrimitive[] = [];
  const decals: DecalHook[] = [];
  const version = plan.generatorVersion;
  const sample = (key: string) => featureRandom(spec.seed, version, "detail:" + key);
  const max = spec.parameters.lodProfile === "hero" ? 80 : spec.parameters.lodProfile === "standard" ? 36 :
    spec.parameters.lodProfile === "background" ? 12 : 0;
  const massById = new Map(plan.masses.map((mass) => [mass.id, mass]));
  for (const opening of plan.openings) {
    if (primitives.length >= max) break;
    const mass = massById.get(opening.massId);
    if (!mass) continue;
    const top = opening.sillHeight + opening.height;
    if (opening.kind === "window" && sample(opening.id + ":sill") > 0.27) {
      primitives.push(panel("sill:" + opening.id, "sill", mass, opening.facade,
        opening.offset, opening.sillHeight - 0.06, opening.width + 0.26, 0.10, 0.19));
      if (opening.width >= 1.1 && sample(opening.id + ":mullion") > 0.55 && primitives.length < max) {
        primitives.push(panel("mullion:" + opening.id, "mullion", mass, opening.facade,
          opening.offset, (opening.sillHeight + top) / 2, 0.055, opening.height - 0.12, 0.09, 0.22));
      }
    } else if (opening.kind === "storefront" && opening.width > 1.7 && sample(opening.id + ":awning") > 0.55) {
      primitives.push(awning(opening, mass));
    }
  }
  for (const mass of plan.masses) {
    for (const side of ["front", "rear", "left", "right"] as const) {
      const span = side === "front" || side === "rear" ? mass.width : mass.depth;
      if (max > 0 && primitives.length < max && span > 7 && sample(mass.id + ":" + side + ":downpipe") > 0.56) {
        primitives.push(panel("downpipe:" + mass.id + ":" + side, "downpipe", mass, side,
          span / 2 - 0.42, mass.baseY + mass.height / 2, 0.12, mass.height, 0.14));
      }
      if (max > 0 && primitives.length < max && spec.archetype === "garage" && side === "front") {
        primitives.push(panel("utility:" + mass.id, "utility-box", mass, side,
          -span / 2 + 0.9, mass.baseY + 1.3, 0.65, 0.85, 0.22));
      }
      const kind: DecalKind = spec.archetype === "commercial" && side === "front" ? "signage" :
        sample(mass.id + ":" + side + ":decal-kind") > 0.7 ? "patch" : "grime";
      decals.push({ id: "decal:" + mass.id + ":" + side, kind, massId: mass.id, facade: side,
        offset: (sample(mass.id + ":" + side + ":offset") - 0.5) * span * 0.5,
        height: mass.baseY + Math.min(1.7, mass.height * 0.28), width: Math.min(2.4, span * 0.3),
        intensity: sample(mass.id + ":" + side + ":intensity") });
    }
  }
  return { primitives, decals };
}
