import {RawTexture,Texture} from "@babylonjs/core";
import type {Scene} from "@babylonjs/core";
import type {GroundLandPlan} from "./ground-land-use";

const byte=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
function grain(x:number,z:number,seed:number) {
  let h=Math.imul(x+1,374761393)^Math.imul(z+1,668265263)^seed;
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}

/** GROUND-004: one continuous grass finish. No stalls, slab seams,
 * paved masks, water, earthen patches or other land-use patterns.
 */
export function buildGroundLandPixels(plan:GroundLandPlan,pixelsPerMetre=8) {
  if(!Number.isInteger(pixelsPerMetre)||pixelsPerMetre<1||pixelsPerMetre>10)
    throw Error("GROUND-004 invalid texture density");
  const width=plan.width*pixelsPerMetre,height=plan.height*pixelsPerMetre;
  if(width*height>4000000)throw Error("GROUND-004 texture budget exceeded");
  const pixels=new Uint8Array(width*height*4);
  for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    const worldX=plan.bounds.left+(x+.5)/pixelsPerMetre;
    const worldZ=plan.bounds.north+(z+.5)/pixelsPerMetre;
    const cluster=grain(Math.floor(worldX*3),Math.floor(worldZ*3),32001)-.5;
    const tuft=grain(Math.floor(worldX*9),Math.floor(worldZ*9),8711);
    const fine=grain(x,z,7341)-.5;
    const light=cluster*22+fine*17+(tuft>.8?11:tuft<.2?-10:0);
    const i=(z*width+x)*4;
    pixels[i]=byte(77+light);
    pixels[i+1]=byte(118+light);
    pixels[i+2]=byte(67+light*.75);
    pixels[i+3]=255;
  }
  return {pixels,width,height};
}
export function createGroundLandTexture(scene:Scene,plan:GroundLandPlan):RawTexture {
  const {pixels,width,height}=buildGroundLandPixels(plan);
  const texture=RawTexture.CreateRGBATexture(pixels,width,height,scene,true,false,
    Texture.TRILINEAR_SAMPLINGMODE);
  texture.name="ground004-grass-only";
  texture.anisotropicFilteringLevel=8;
  texture.wrapU=Texture.CLAMP_ADDRESSMODE;
  texture.wrapV=Texture.CLAMP_ADDRESSMODE;
  return texture;
}
