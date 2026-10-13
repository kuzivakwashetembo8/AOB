/**
 * GTD-RND-MAT-001 / Brick Material Trial A.
 * Explicit, opt-in single-building material evaluation; not an adopted
 * city-wide building style or change to any Rapier geometry.
 */
import {
  Color3, Mesh, RawTexture, StandardMaterial, Texture, VertexBuffer,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { BoxPrimitive } from "./architecture-plan";
import type { MaterialRecipe } from "./representation-materials";
import { createSurfaceTexture } from "./surface-textures";
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

export interface ExperimentalBrickMaterial {
  readonly material: StandardMaterial;
  readonly source: string;
  dispose(): void;
}

interface SharedBrickImage {
  readonly subscribers: Set<StandardMaterial>;
  image: Texture | null;
  ready: boolean;
  disposed: boolean;
  references: number;
}
/** One scene-scoped image lease per unique source path.
 * BRK-01's production URL is preserved byte-for-byte; candidates each load once
 * even when assigned to multiple buildings in a later experiment.
 */
const brickImages = new WeakMap<Scene, Map<string, SharedBrickImage>>();
function leaseBrickImage(
  scene: Scene, material: StandardMaterial, path: string,
): () => void {
  let pool = brickImages.get(scene);
  if (!pool) {
    pool = new Map<string, SharedBrickImage>();
    brickImages.set(scene, pool);
  }
  let shared = pool.get(path);
  if (!shared) {
    shared = {
      image: null, ready: false, disposed: false,
      references: 0, subscribers: new Set<StandardMaterial>(),
    };
    pool.set(path, shared);
    if (typeof document !== "undefined") {
      const resource = shared;
      const image = new Texture(
        path, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE,
        () => {
          if (resource.disposed || !resource.image) return;
          resource.ready = true;
          for (const subscriber of resource.subscribers) {
            subscriber.diffuseTexture = resource.image;
          }
        },
        message => {
          if (!resource.disposed) console.warn(
            "[BRICK-MAT-005] WebP unavailable; keeping procedural wall:",
            path, message);
        },
      );
      image.hasAlpha = false;
      image.wrapU = Texture.WRAP_ADDRESSMODE;
      image.wrapV = Texture.WRAP_ADDRESSMODE;
      image.anisotropicFilteringLevel = 8;
      shared.image = image;
    }
  }
  shared.references++;
  shared.subscribers.add(material);
  if (shared.ready && shared.image) material.diffuseTexture = shared.image;
  const lease = shared;
  const ownerPool = pool;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lease.subscribers.delete(material);
    lease.references--;
    if (lease.references === 0) {
      lease.disposed = true;
      lease.image?.dispose();
      ownerPool.delete(path);
      if (ownerPool.size === 0) brickImages.delete(scene);
    }
  };
}

/** Nonblocking WebP and opaque procedural fallback. A candidate BRK ID is an
 * intentional trial override, not a globally accepted visual assignment.
 */
export function createExperimentalBrickMaterial(
  scene: Scene, fallbackRecipe: MaterialRecipe,
  buildingId: string = BRICK_TRIAL_BUILDING_ID,
  surfaceId: BrickSurfaceId = "BRK-01",
): ExperimentalBrickMaterial {
  const materialName = surfaceId === "BRK-01"
    ? ("experiment:brick-" + (buildingId === BRICK_TRIAL_GARAGE_ID ? "B" : "A") + ":" + buildingId)
    : ("experiment:brick-" + surfaceId + ":" + buildingId);
  const material = new StandardMaterial(materialName, scene);
  const fallback = createSurfaceTexture(scene, fallbackRecipe);
  const path = surfaceId === "BRK-01" ? BRICK_TRIAL_ASSET_PATH : BRICK_SURFACES[surfaceId].path;
  material.diffuseTexture = fallback;
  material.diffuseColor = Color3.White();
  material.specularColor = new Color3(0.045, 0.045, 0.045);
  material.specularPower = 10;
  material.alpha = 1;
  material.useAlphaFromDiffuseTexture = false;
  material.backFaceCulling = true;
  const release = leaseBrickImage(scene, material, path);
  let disposed = false;
  return {
    material,
    source: path,
    dispose() {
      if (disposed) return;
      disposed = true;
      release();
      fallback.dispose();
      material.dispose();
    },
  };
}
