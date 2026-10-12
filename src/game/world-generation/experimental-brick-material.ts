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

export const BRICK_TRIAL_BUILDING_ID = "sw-fl-south-apartment";
export const BRICK_TRIAL_ASSET_PATH = "/brick-wall-image.webp";
/** The owner's 1774x871 WebP is slightly wider than a perfect 2:1 image.
 * Preserve image pixel proportions; no stretch or crop in the first trial.
 * Approximately six 225mm brick modules span the image horizontally.
 */
export const BRICK_TRIAL_METRES_PER_TILE = Object.freeze({
  width: 1.35,
  height: 1.35 * 871 / 1774,
});

/** Object-local building coordinates are shared across ALL wall sections.
 * This avoids the old per-box UV reset that enlarged/shrank individual bricks.
 * Window frames and glazing keep their own independent geometry and materials.
 */
export function physicalBrickUV(
  vertex: { x: number; y: number; z: number },
  normal: { x: number; y: number; z: number },
): { u: number; v: number } {
  const uMetres = Math.abs(normal.x) > 0.5 ? vertex.z : vertex.x;
  const vMetres = Math.abs(normal.y) > 0.5 ? vertex.z : vertex.y;
  return {
    u: uMetres / BRICK_TRIAL_METRES_PER_TILE.width,
    v: vMetres / BRICK_TRIAL_METRES_PER_TILE.height,
  };
}

export function applyPhysicalBrickUV(mesh: Mesh, part: BoxPrimitive): void {
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
    const mapped = physicalBrickUV(vertex, normal);
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

/** Nonblocking image loading, with deterministic existing procedural fallback.
 * A failed WebP must NEVER erase walls, crash scene creation or add colliders.
 */
export function createExperimentalBrickMaterial(
  scene: Scene, fallbackRecipe: MaterialRecipe,
): ExperimentalBrickMaterial {
  const material = new StandardMaterial("experiment:brick-A:" + BRICK_TRIAL_BUILDING_ID, scene);
  const fallback = createSurfaceTexture(scene, fallbackRecipe);
  material.diffuseTexture = fallback;
  material.diffuseColor = Color3.White();
  material.specularColor = new Color3(0.045, 0.045, 0.045);
  material.specularPower = 10;
  material.alpha = 1;
  material.useAlphaFromDiffuseTexture = false;
  material.backFaceCulling = true;
  let disposed = false;
  let image: Texture | null = null;
  if (typeof document !== "undefined") {
    image = new Texture(
      BRICK_TRIAL_ASSET_PATH, scene, false, false,
      Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        if (disposed || !image) return;
        image.hasAlpha = false;
        image.wrapU = Texture.WRAP_ADDRESSMODE;
        image.wrapV = Texture.WRAP_ADDRESSMODE;
        image.anisotropicFilteringLevel = 8;
        material.diffuseTexture = image;
      },
      (message) => {
        // Fail closed to the existing brick material without affecting gameplay.
        console.warn("[BRICK-MAT-A] Owner WebP unavailable; using procedural brick:", message);
      },
    );
    image.hasAlpha = false;
    image.wrapU = Texture.WRAP_ADDRESSMODE;
    image.wrapV = Texture.WRAP_ADDRESSMODE;
    image.anisotropicFilteringLevel = 8;
  }
  return {
    material,
    source: BRICK_TRIAL_ASSET_PATH,
    dispose() {
      if (disposed) return;
      disposed = true;
      image?.dispose();
      fallback.dispose();
      material.dispose();
    },
  };
}
