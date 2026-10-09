import { featureRandom } from "./seeded-variation";
import type { PrimitiveRole } from "./architecture-plan";
import type { FacadeMaterial, ResolvedBuildingSpec } from "./schema";

export type MaterialFamilyId =
  | FacadeMaterial
  | "institutional-concrete"
  | "asphalt"
  | "sidewalk-paving"
  | "roof-membrane"
  | "storefront-metal"
  | "clear-glass"
  | "dark-brick"
  | "pale-brick";

export type SurfaceTextureKind =
  | "brick"
  | "block"
  | "concrete"
  | "plaster"
  | "metal"
  | "glass"
  | "asphalt"
  | "paving"
  | "roof";

export interface MaterialFamily {
  readonly color: string;
  readonly roughness: number;
  readonly metalness: number;
  readonly alpha: number;
  readonly textureKind: SurfaceTextureKind;
  readonly textureScale: Readonly<{ u: number; v: number }>;
}

export const MATERIAL_FAMILIES: Readonly<Record<MaterialFamilyId, MaterialFamily>> = {
  "warm-brick": {
    color: "#8a5940",
    roughness: 0.88,
    metalness: 0,
    alpha: 1,
    textureKind: "brick",
    textureScale: { u: 3.4, v: 3.4 },
  },
  "dark-brick": {
    color: "#694538",
    roughness: 0.9,
    metalness: 0,
    alpha: 1,
    textureKind: "brick",
    textureScale: { u: 3.6, v: 3.6 },
  },
  "pale-brick": {
    color: "#a78368",
    roughness: 0.87,
    metalness: 0,
    alpha: 1,
    textureKind: "brick",
    textureScale: { u: 3.2, v: 3.2 },
  },
  "weathered-concrete": {
    color: "#777a79",
    roughness: 0.92,
    metalness: 0,
    alpha: 1,
    textureKind: "concrete",
    textureScale: { u: 1.9, v: 2.1 },
  },
  "painted-block": {
    color: "#aaa08a",
    roughness: 0.82,
    metalness: 0,
    alpha: 1,
    textureKind: "block",
    textureScale: { u: 2.6, v: 2.6 },
  },
  "garage-block": {
    color: "#878077",
    roughness: 0.9,
    metalness: 0,
    alpha: 1,
    textureKind: "block",
    textureScale: { u: 2.7, v: 2.7 },
  },
  "industrial-metal": {
    color: "#66727b",
    roughness: 0.62,
    metalness: 0.42,
    alpha: 1,
    textureKind: "metal",
    textureScale: { u: 2.2, v: 2.8 },
  },
  "storefront-metal": {
    color: "#343b3f",
    roughness: 0.48,
    metalness: 0.55,
    alpha: 1,
    textureKind: "metal",
    textureScale: { u: 1.8, v: 2.4 },
  },
  plaster: {
    color: "#c4b7a4",
    roughness: 0.87,
    metalness: 0,
    alpha: 1,
    textureKind: "plaster",
    textureScale: { u: 1.4, v: 1.8 },
  },
  "storefront-glass": {
    color: "#3b5c6c",
    roughness: 0.17,
    metalness: 0,
    alpha: 0.82,
    textureKind: "glass",
    textureScale: { u: 1.1, v: 1.15 },
  },
  "clear-glass": {
    color: "#668494",
    roughness: 0.13,
    metalness: 0,
    alpha: 0.72,
    textureKind: "glass",
    textureScale: { u: 1, v: 1 },
  },
  "institutional-concrete": {
    color: "#92979a",
    roughness: 0.82,
    metalness: 0,
    alpha: 1,
    textureKind: "concrete",
    textureScale: { u: 1.8, v: 2 },
  },
  asphalt: {
    color: "#41454b",
    roughness: 0.95,
    metalness: 0,
    alpha: 1,
    textureKind: "asphalt",
    textureScale: { u: 4.5, v: 4.5 },
  },
  "sidewalk-paving": {
    color: "#aaa49a",
    roughness: 0.91,
    metalness: 0,
    alpha: 1,
    textureKind: "paving",
    textureScale: { u: 3.6, v: 3.6 },
  },
  "roof-membrane": {
    color: "#5d6162",
    roughness: 0.9,
    metalness: 0.03,
    alpha: 1,
    textureKind: "roof",
    textureScale: { u: 2.4, v: 2.4 },
  },
};

const wallFamily = (
  spec: ResolvedBuildingSpec,
  version: number,
): MaterialFamilyId => {
  const base = spec.parameters.facadeMaterial;
  if (base !== "warm-brick") return base;
  const sample = featureRandom(spec.seed, version, "surface:wall:brick-family");
  if (sample > 0.82) return "pale-brick";
  if (sample < 0.2) return "dark-brick";
  return "warm-brick";
};

const ROLE_FAMILIES: Readonly<Record<Exclude<PrimitiveRole, "wall">, MaterialFamilyId>> = {
  roof: "roof-membrane",
  trim: "painted-block",
  glass: "clear-glass",
  metal: "storefront-metal",
  storefront: "storefront-glass",
};

export interface SurfaceVariation {
  readonly tintBucket: number;
  readonly weathering: number;
  readonly grime: number;
  readonly patching: number;
  readonly uvOffset: Readonly<{ u: number; v: number }>;
}

export interface MaterialRecipe {
  readonly key: string;
  readonly familyId: MaterialFamilyId;
  readonly role: PrimitiveRole;
  readonly color: string;
  readonly roughness: number;
  readonly metalness: number;
  readonly alpha: number;
  readonly textureKind: SurfaceTextureKind;
  readonly textureScale: Readonly<{ u: number; v: number }>;
  readonly variation: SurfaceVariation;
}

const channel = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

export function materialRecipe(
  spec: ResolvedBuildingSpec,
  version: number,
  role: PrimitiveRole,
): MaterialRecipe {
  const familyId = role === "wall" ? wallFamily(spec, version) : ROLE_FAMILIES[role];
  const family = MATERIAL_FAMILIES[familyId];
  const sample = (key: string) =>
    featureRandom(spec.seed, version, "surface:" + role + ":" + key);
  const tintBucket = Math.min(7, Math.floor(sample("tint") * 8));
  const tint = 0.87 + tintBucket * 0.032;
  const red = Number.parseInt(family.color.slice(1, 3), 16);
  const green = Number.parseInt(family.color.slice(3, 5), 16);
  const blue = Number.parseInt(family.color.slice(5, 7), 16);
  const weathering = sample("weathering");
  const grime = sample("grime");
  const patching = sample("patching");
  return {
    key: [
      familyId,
      role,
      "t" + tintBucket,
      "w" + Math.floor(weathering * 4),
      "g" + Math.floor(grime * 4),
      "p" + Math.floor(patching * 3),
    ].join(":"),
    familyId,
    role,
    color:
      "#" +
      channel(red * tint) +
      channel(green * tint) +
      channel(blue * tint),
    roughness: Math.min(0.98, family.roughness + weathering * 0.045),
    metalness: family.metalness,
    alpha: family.alpha,
    textureKind: family.textureKind,
    textureScale: family.textureScale,
    variation: {
      tintBucket,
      weathering,
      grime,
      patching,
      uvOffset: { u: sample("uv-u"), v: sample("uv-v") },
    },
  };
}
