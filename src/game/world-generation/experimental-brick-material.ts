/**
 * GTD-RND-MAT-001 / Brick Material Trial A.
 * Explicit, opt-in single-building material evaluation; not an adopted
 * city-wide building style or change to any Rapier geometry.
 */
import {
  Mesh, VertexBuffer,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { BoxPrimitive } from "./architecture-plan";
import type { MaterialRecipe } from "./representation-materials";
import { createImageWallMaterial } from "./image-wall-material";
import type { ImageWallMaterial } from "./image-wall-material";
import { BRICK_SURFACES, type BrickSurfaceId } from "./brick-surface-catalog";

export const BRICK_TRIAL_BUILDING_ID = "sw-fl-south-apartment";
export const BRICK_TRIAL_GARAGE_ID = "sw-fl-garage";
export const BRICK_TRIAL_ASSET_PATH = "/brick-wall-image.webp";
export const BRICK_TRIAL_ASSET_ID = "south-ward-red-brick-a" as const;
/** The owner's 1774x871 WebP is slightly wider than a perfect 2:1 image.
 * Preserve image pixel proportions; no stretch or crop in the first trial.
 * Approximately six 225mm brick modules span the image horizontally.
 */
const aspectHeightPerWidth = 871 / 1774;
/** Changing metre coverage changes apparent brick size, NOT image bytes. */
export const BRICK_SCALE_PRESETS = Object.freeze({
  compactA: Object.freeze({ width: 1.35, height: 1.35 * aspectHeightPerWidth }),
  standardB: Object.freeze({ width: 1.485, height: 1.485 * aspectHeightPerWidth }),
  largeC: Object.freeze({ width: 1.62, height: 1.62 * aspectHeightPerWidth }),
});
export type BrickScalePresetId = keyof typeof BRICK_SCALE_PRESETS;
export type BrickScalePreset = Readonly<{ width: number; height: number }>;
export const BRICK_TRIAL_METRES_PER_TILE = BRICK_SCALE_PRESETS.compactA;

/** Exact named experimental assignments, never inferred from archetype. */
export const BRICK_TRIAL_ASSIGNMENTS = Object.freeze({
  [BRICK_TRIAL_BUILDING_ID]: "compactA",
  [BRICK_TRIAL_GARAGE_ID]: "standardB",
} as const);
export function brickTrialPresetForBuilding(
  buildingId: string, enabled: boolean,
): BrickScalePresetId | null {
  if (!enabled) return null;
  return Object.prototype.hasOwnProperty.call(BRICK_TRIAL_ASSIGNMENTS, buildingId)
    ? BRICK_TRIAL_ASSIGNMENTS[buildingId as keyof typeof BRICK_TRIAL_ASSIGNMENTS]
    : null;
}

/** Object-local building coordinates are shared across ALL wall sections.
 * This avoids the old per-box UV reset that enlarged/shrank individual bricks.
 * Window frames and glazing keep their own independent geometry and materials.
 */
export function physicalBrickUV(
  vertex: { x: number; y: number; z: number },
  normal: { x: number; y: number; z: number },
  preset: BrickScalePreset = BRICK_SCALE_PRESETS.compactA,
): { u: number; v: number } {
  const uMetres = Math.abs(normal.x) > 0.5 ? vertex.z : vertex.x;
  const vMetres = Math.abs(normal.y) > 0.5 ? vertex.z : vertex.y;
  return {
    u: uMetres / preset.width,
    v: vMetres / preset.height,
  };
}

export function applyPhysicalBrickUV(
  mesh: Mesh, part: BoxPrimitive, preset: BrickScalePreset = BRICK_SCALE_PRESETS.compactA,
): void {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
  if (!positions || !normals || positions.length !== normals.length) {
    throw new Error("Brick trial requires box vertex positions and normals");
  }
  const uv = new Float32Array((positions.length / 3) * 2);
  for (let index = 0; index < positions.length / 3; index++) {
    const vertex = { x: part.center.x + positions[index * 3]!,
      y: part.center.y + positions[index * 3 + 1]!,
      z: part.center.z + positions[index * 3 + 2]! };
    const normal = { x: normals[index * 3]!, y: normals[index * 3 + 1]!,
      z: normals[index * 3 + 2]! };
    const mapped = physicalBrickUV(vertex, normal, preset);
    uv[2 * index] = mapped.u;
    uv[2 * index + 1] = mapped.v;
  }
  mesh.setVerticesData(VertexBuffer.UVKind, uv, true);
}

export type ExperimentalBrickMaterial = ImageWallMaterial;

/** Preserve the accepted BRK-01 implementation and material names; delegate
 * image caching and fallback to the shared cross-family material library.
 */
export function createExperimentalBrickMaterial(
  scene: Scene, fallbackRecipe: MaterialRecipe,
  buildingId: string = BRICK_TRIAL_BUILDING_ID,
  surfaceId: BrickSurfaceId = "BRK-01",
): ExperimentalBrickMaterial {
  const name = surfaceId === "BRK-01"
    ? ("experiment:brick-" + (buildingId === BRICK_TRIAL_GARAGE_ID ? "B" : "A") + ":" + buildingId)
    : ("experiment:brick-" + surfaceId + ":" + buildingId);
  const source = surfaceId === "BRK-01"
    ? BRICK_TRIAL_ASSET_PATH : BRICK_SURFACES[surfaceId].path;
  return createImageWallMaterial(scene, fallbackRecipe, name, source);
}
