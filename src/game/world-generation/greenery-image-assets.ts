import { Texture } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

/** GRN-002: a single committed asset reused for all cards/ground tiles.
 * No tree geometry, land-use classification or collider change.
 */
export const FOLIAGE_IMAGE_URL = "/assets/vegetation/foliage-cluster-01.webp";
export const FOLIAGE_TEST_TREE_ID = "sw-fl-tree-pocket-west";
export type FoliageImageTrial = "off" | "one" | "all";

/** Metre-scaled repetition; never stretch one carpet tile over the whole map. */
/** Texture has its own error/fallback handlers at the integration point.
 * No texture is constructed on the NullEngine unless a test requests it.
 */
export function createImageTexture(
 scene: Scene, url: string,
 onLoad: (texture:Texture)=>void,
 onError: (message:string)=>void,
): Texture {
 const texture = new Texture(
   url, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE,
   ()=>onLoad(texture),
   message=>onError(message??"Image asset failed to load"),
 );
 return texture;
}
