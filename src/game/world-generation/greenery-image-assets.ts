import { Texture } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

/** GRN-002: a single committed asset reused for all cards/ground tiles.
 * No tree geometry, land-use classification or collider change.
 */
export const FOLIAGE_IMAGE_URL = "/assets/vegetation/foliage-cluster-01.webp";
export const CARPET_GRASS_IMAGE_URL = "/assets/ground/carpet-grass-01.webp";
export const FOLIAGE_TEST_TREE_ID = "sw-fl-tree-pocket-west";
export type FoliageImageTrial = "off" | "one" | "all";

/** Metre-scaled repetition; never stretch one carpet tile over the whole map. */
export const CARPET_GRASS_TILE_METRES = 5;
export const SOUTH_WARD_GROUND_METRES = {width:160,height:130} as const;

export function grassMetricRepeat(
  tileMetres=CARPET_GRASS_TILE_METRES,
  width:number=SOUTH_WARD_GROUND_METRES.width,
  height:number=SOUTH_WARD_GROUND_METRES.height,
): {u:number;v:number} {
  if(![tileMetres,width,height].every(Number.isFinite)||
    tileMetres<1||tileMetres>30||width<=0||height<=0)
    throw new Error("GRN-002 invalid metre repeat");
  return {u:width/tileMetres,v:height/tileMetres};
}

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
