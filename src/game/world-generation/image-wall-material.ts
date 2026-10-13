/** MAT-006: scene-scoped image-derived wall material leases for all wall families.
 * Opaque procedural fallback remains active until each WebP has loaded.
 * Material ownership is local; the WebP resource is shared by source URL.
 */
import { Color3, StandardMaterial, Texture } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { MaterialRecipe } from "./representation-materials";
import { createSurfaceTexture } from "./surface-textures";

export interface ImageWallMaterial {
  readonly material: StandardMaterial;
  readonly source: string;
  dispose(): void;
}
interface SharedImage {
  image: Texture | null;
  ready: boolean;
  disposed: boolean;
  references: number;
  readonly subscribers: Set<StandardMaterial>;
}
const imagePools = new WeakMap<Scene, Map<string, SharedImage>>();

function leaseImage(scene: Scene, material: StandardMaterial, path: string): () => void {
  let pool = imagePools.get(scene);
  if (!pool) {
    pool = new Map();
    imagePools.set(scene, pool);
  }
  let item = pool.get(path);
  if (!item) {
    item = { image: null, ready: false, disposed: false,
      references: 0, subscribers: new Set<StandardMaterial>() };
    pool.set(path, item);
    if (typeof document !== "undefined") {
      const owner = item;
      const texture = new Texture(path, scene, false, false,
        Texture.TRILINEAR_SAMPLINGMODE,
        () => {
          if (owner.disposed || !owner.image) return;
          owner.ready = true;
          for (const subscriber of owner.subscribers) {
            subscriber.diffuseTexture = owner.image;
          }
        },
        message => {
          if (!owner.disposed) console.warn(
            "[IMAGE-WALL] WebP unavailable; procedural fallback retained:",
            path, message);
        });
      texture.hasAlpha = false;
      texture.wrapU = Texture.WRAP_ADDRESSMODE;
      texture.wrapV = Texture.WRAP_ADDRESSMODE;
      texture.anisotropicFilteringLevel = 8;
      item.image = texture;
    }
  }
  item.references++;
  item.subscribers.add(material);
  if (item.ready && item.image) material.diffuseTexture = item.image;
  const lease = item;
  const scenePool = pool;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lease.subscribers.delete(material);
    lease.references--;
    if (lease.references === 0) {
      lease.disposed = true;
      lease.image?.dispose();
      scenePool.delete(path);
      if (scenePool.size === 0) imagePools.delete(scene);
    }
  };
}

export function createImageWallMaterial(
  scene: Scene, fallbackRecipe: MaterialRecipe,
  name: string, sourcePath: string,
): ImageWallMaterial {
  if (!sourcePath.startsWith("/assets/surfaces/") &&
      sourcePath !== "/brick-wall-image.webp") {
    throw new Error("Image wall material requires an allowlisted local asset URL");
  }
  const material = new StandardMaterial(name, scene);
  const fallback = createSurfaceTexture(scene, fallbackRecipe);
  material.diffuseTexture = fallback;
  material.diffuseColor = Color3.White();
  material.specularColor = new Color3(0.045, 0.045, 0.045);
  material.specularPower = 10;
  material.alpha = 1;
  material.useAlphaFromDiffuseTexture = false;
  material.backFaceCulling = true;
  const release = leaseImage(scene, material, sourcePath);
  let disposed = false;
  return { material, source: sourcePath, dispose() {
    if (disposed) return;
    disposed = true;
    release();
    fallback.dispose();
    material.dispose();
  }};
}
