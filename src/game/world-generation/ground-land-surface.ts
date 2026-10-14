import {RawTexture,Texture} from "@babylonjs/core";
import type {Scene} from "@babylonjs/core";
import {LAND_FINISHES} from "./ground-land-use";
import type {GroundLandPlan,LandFinish} from "./ground-land-use";

const PALETTE:Record<LandFinish,readonly [number,number,number]>={
  "PAV-01":[153,151,144],"PAV-02":[168,163,153],"PAV-03":[173,168,156],
  "PAV-04":[119,116,109],"PRK-01":[80,85,84],"PRK-02":[87,91,89],
  "SRV-01":[112,108,99],"GRN-01":[77,118,67],"GRN-02":[92,133,79],
  "GRN-03":[71,108,63],"GRD-01":[121,105,86],
  "WTR-01":[65,83,69],"WTR-02":[72,108,84],
};
const byte=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
const mix=(x:number,z:number,seed:number)=>{
  let h=Math.imul(x+1,374761393)^Math.imul(z+1,668265263)^seed;
  h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;
};
const fract=(x:number,s:number)=>((x%s)+s)%s;
export function buildGroundLandPixels(plan:GroundLandPlan,pixelsPerMetre=8){
  if(!Number.isInteger(pixelsPerMetre)||pixelsPerMetre<1||pixelsPerMetre>10)
    throw Error("GROUND-003 invalid texture density");
  const w=plan.width*pixelsPerMetre,h=plan.height*pixelsPerMetre;
  if(w*h>4000000)throw Error("GROUND-003 texture budget exceeded");
  const pixels=new Uint8Array(w*h*4);
  for(let z=0;z<h;z++)for(let x=0;x<w;x++){
    const i=Math.floor(z/pixelsPerMetre)*plan.width+Math.floor(x/pixelsPerMetre);
    const kind=LAND_FINISHES[plan.kinds[i]??0]??"PAV-01";
    const rgb=PALETTE[kind], wx=plan.bounds.left+(x+.5)/pixelsPerMetre;
    const wz=plan.bounds.north+(z+.5)/pixelsPerMetre, grain=mix(x,z,7341);
    let light=(grain-.5)*11;
    if(kind.startsWith("GRN")){
      // Fine, deterministic blade-scale texture; no large blurry sine-wave wash.
      const cluster=mix(Math.floor(wx*3),Math.floor(wz*3),32001)-.5;
      const tuft=mix(Math.floor(wx*9),Math.floor(wz*9),8711);
      const fleck=tuft>.8?14:tuft<.2?-13:0;
      light=cluster*27+(grain-.5)*20+fleck;
    }else if(kind.startsWith("PAV")){
      // ONLY transverse slab joints: no vertical world-X joints or columns.
      if(kind!=="PAV-04"){
        const transverse=fract(wz,3);
        if(transverse<0.07)light=-9;
        else if(transverse<0.15)light=-3;
        else light=(grain-.5)*7;
      }
    }else if(kind==="PRK-01"||kind==="PRK-02"){
      // Keep stall paint wholly inside allotted asphalt: never draw over grass.
      const cellX=fract(wx,2.65),cellZ=fract(wz,5.4);
      if((cellX<.10&&cellZ<4.6)||(cellZ<.10&&cellX<2.5)){
        const o=(z*w+x)*4;
        pixels[o]=206;pixels[o+1]=204;pixels[o+2]=193;pixels[o+3]=255;
        continue;
      }
      light=(grain-.5)*8;
    }else if(kind==="GRD-01"||kind==="SRV-01"){
      const fleck=mix(Math.floor(wx*11),Math.floor(wz*11),440);
      light=(grain-.5)*19+(fleck>.83?13:0);
    }else if(kind==="WTR-01"||kind==="WTR-02"){
      light=(grain-.5)*6;
    }
    const offset=(z*w+x)*4;
    pixels[offset]=byte(rgb[0]+light);
    pixels[offset+1]=byte(rgb[1]+light);
    pixels[offset+2]=byte(rgb[2]+light*.75);
    pixels[offset+3]=255;
  }
  return {pixels,width:w,height:h};
}
export function createGroundLandTexture(scene:Scene,plan:GroundLandPlan):RawTexture{
  const {pixels,width,height}=buildGroundLandPixels(plan);
  const texture=RawTexture.CreateRGBATexture(pixels,width,height,scene,true,false,
    Texture.BILINEAR_SAMPLINGMODE);
  texture.name="ground003-urban-parcel-map";
  texture.anisotropicFilteringLevel=8;
  texture.wrapU=Texture.CLAMP_ADDRESSMODE;
  texture.wrapV=Texture.CLAMP_ADDRESSMODE;
  return texture;
}
