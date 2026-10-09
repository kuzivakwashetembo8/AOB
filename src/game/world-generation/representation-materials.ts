import { featureRandom } from "./seeded-variation";
import type { PrimitiveRole } from "./architecture-plan";
import type { FacadeMaterial, ResolvedBuildingSpec } from "./schema";

export type MaterialFamilyId = FacadeMaterial | "institutional-concrete" | "asphalt" | "sidewalk-paving";
export interface MaterialFamily { readonly color: string; readonly roughness: number; readonly metalness: number; readonly alpha: number; }
export const MATERIAL_FAMILIES: Readonly<Record<MaterialFamilyId, MaterialFamily>> = {
  "warm-brick": { color: "#80543d", roughness: 0.88, metalness: 0, alpha: 1 },
  "weathered-concrete": { color: "#727577", roughness: 0.91, metalness: 0, alpha: 1 },
  "painted-block": { color: "#a59b86", roughness: 0.81, metalness: 0, alpha: 1 },
  "garage-block": { color: "#817b71", roughness: 0.90, metalness: 0, alpha: 1 },
  "industrial-metal": { color: "#66727b", roughness: 0.63, metalness: 0.42, alpha: 1 },
  plaster: { color: "#c4b7a4", roughness: 0.87, metalness: 0, alpha: 1 },
  "storefront-glass": { color: "#426272", roughness: 0.18, metalness: 0, alpha: 0.84 },
  "institutional-concrete": { color: "#92979a", roughness: 0.82, metalness: 0, alpha: 1 },
  asphalt: { color: "#41454b", roughness: 0.94, metalness: 0, alpha: 1 },
  "sidewalk-paving": { color: "#a8a39b", roughness: 0.91, metalness: 0, alpha: 1 },
};
const ROLE_FAMILIES: Readonly<Record<Exclude<PrimitiveRole, "wall">, MaterialFamilyId>> = {
  roof: "industrial-metal", trim: "painted-block", glass: "storefront-glass",
  metal: "industrial-metal", storefront: "storefront-glass",
};
export interface SurfaceVariation {
  readonly tintBucket: number; readonly weathering: number; readonly grime: number;
  readonly patching: number; readonly uvOffset: Readonly<{ u: number; v: number }>;
}
export interface MaterialRecipe {
  readonly key: string; readonly familyId: MaterialFamilyId; readonly role: PrimitiveRole;
  readonly color: string; readonly roughness: number; readonly metalness: number;
  readonly alpha: number; readonly variation: SurfaceVariation;
}
const channel = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

/** Quantized tint enables material reuse; grime, patching and UV are future atlas/decal hooks. */
export function materialRecipe(spec: ResolvedBuildingSpec, version: number, role: PrimitiveRole): MaterialRecipe {
  const familyId = role === "wall" ? spec.parameters.facadeMaterial : ROLE_FAMILIES[role];
  const family = MATERIAL_FAMILIES[familyId];
  const sample = (key: string) => featureRandom(spec.seed, version, "surface:" + role + ":" + key);
  const tintBucket = Math.min(7, Math.floor(sample("tint") * 8));
  const tint = 0.88 + tintBucket * 0.035;
  const red = parseInt(family.color.slice(1, 3), 16);
  const green = parseInt(family.color.slice(3, 5), 16);
  const blue = parseInt(family.color.slice(5, 7), 16);
  return {
    key: familyId + ":" + role + ":t" + tintBucket, familyId, role,
    color: "#" + channel(red * tint) + channel(green * tint) + channel(blue * tint),
    roughness: family.roughness, metalness: family.metalness, alpha: family.alpha,
    variation: { tintBucket, weathering: sample("weathering"), grime: sample("grime"),
      patching: sample("patching"), uvOffset: { u: sample("uv-u"), v: sample("uv-v") } },
  };
}
