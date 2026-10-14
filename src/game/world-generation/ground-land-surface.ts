import {RawTexture, Texture} from "@babylonjs/core";
import type {Scene} from "@babylonjs/core";
import type {GroundLandPlan, LandFinish} from "./ground-land-use";

const PALETTE:Record<LandFinish,readonly [number,number,number]>={
  "PAV-01":[143,140,130],"PAV-02":[166,157,143],"PAV-03":[175,167,153],
  "PAV-04":[120,119,112],"PRK-01":[79,84,84],"PRK-02":[95,98,96],
  "SRV-01":[111,105,94],"GRN-01":[80,125,68],"GRN-02":[98,134,73],
  "GRN-03":[73,111,65],"GRD-01":[125,108,85],
  "WTR-01":[49,101,113],"WTR-02":[69,110,111],
};
const clampByte=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
/** The existing ground mesh is an already confirmed real WebGL draw witness.
 * Encode parcel surfaces on its own UV-aligned texture, removing any dependency
 * on WORLD-003's unverified overlapping quad visibility path.
 */
export function buildGroundLandPixels(plan:GroundLandPlan, pixelsPerMetre=4){
  const w=plan.width*pixelsPerMetre,h=plan.height*pixelsPerMetre;
  if(w*h>4000000)throw new Error("GROUND-001 texture budget exceeded");
  const rgba=new Uint8Array(w*h*4);
  for(let z=0;z<h;z++)for(let x=0;x<w;x++){
    const col=Math.floor(x/pixelsPerMetre),row=Math.floor(z/pixelsPerMetre);
    const ix=row*plan.width+col;
    const finish=(Object.keys(PALETTE) as LandFinish[])[0];
    const id=plan.kinds[ix]??0;
    // Constant catalogue ordering is authoritative; a random object ordering is not.
    const key=LAND_ORDER[id]??finish;
    const rgb=PALETTE[key],worldX=plan.bounds.left+(x+.5)/pixelsPerMetre;
    const worldZ=plan.bounds.north+(z+.5)/pixelsPerMetre;
    const noise=((Math.imul(x+27,374761393)^Math.imul(z+7,668265263))>>>0)%41-20;
    let detail=noise*.30;
    const ux=((worldX%2+2)%2),uz=((worldZ%2+2)%2);
    if(key.startsWith("PAV") && key!=="PAV-04"){
      if(ux<.025||uz<.025)detail-=20; // physical-scale slab joints
      else if(ux<.065||uz<.065)detail-=5;
    }
    if(key==="PRK-01"||key==="PRK-02"){
      const unit=((worldX%2.6+2.6)%2.6),length=((worldZ%5+5)%5);
      if((unit<.11 && length<4.8)||(length<.10&&unit<2.5)){
        const off=(z*w+x)*4;
        rgba[off]=202;rgba[off+1]=201;rgba[off+2]=186;rgba[off+3]=255;
        continue;
      }
      detail*=.55;
    }
    if(key==="SRV-01"||key==="GRD-01")detail*=1.4;
    if(key==="GRN-01"||key==="GRN-02"||key==="GRN-03"){
      detail+=Math.sin(worldX*1.18+worldZ*2.1)*4;
      if(key==="GRN-03"&&noise>12)detail+=8;
    }
    if(key.startsWith("WTR")){
      detail=Math.sin(worldX*.8+worldZ*.7)*5+Math.sin(worldZ*2.3)*2;
    }
    const out=(z*w+x)*4;
    rgba[out]=clampByte(rgb[0]+detail);
    rgba[out+1]=clampByte(rgb[1]+detail);
    rgba[out+2]=clampByte(rgb[2]+detail);
    rgba[out+3]=255;
  }
  return {pixels:rgba,width:w,height:h};
}
import {LAND_FINISHES as LAND_ORDER} from "./ground-land-use";
export function createGroundLandTexture(scene:Scene,plan:GroundLandPlan):RawTexture{
  const {pixels,width,height}=buildGroundLandPixels(plan);
  const texture=RawTexture.CreateRGBATexture(pixels,width,height,scene,true,false,
    Texture.TRILINEAR_SAMPLINGMODE);
  texture.name="ground001-south-ward-composed-parcel-map";
  texture.wrapU=Texture.CLAMP_ADDRESSMODE;
  texture.wrapV=Texture.CLAMP_ADDRESSMODE;
  return texture;
}
