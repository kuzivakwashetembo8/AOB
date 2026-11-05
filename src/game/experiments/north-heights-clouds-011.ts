/** Recovered NH-OPT-011 misty cloud visual baseline.
 * Source commit: 4fb2b17fe3e5017fbf08e85c7c586ac8a8d33baf.
 * Cloud-only extraction: weather controls, rain, thunder, and audio intentionally excluded.
 * Daytime opacity and seeded 256 x 128 cloud texture match the legacy pilot.
 */
import {Color3,Material,MeshBuilder,RawTexture,Scene,StandardMaterial,Texture} from "@babylonjs/core";
import type {NorthHeightsTime} from "./north-heights-sky-002";

export function createNorthHeightsClouds011(scene:Scene) {
 const size=256,height=128,pixels=new Uint8Array(size*height*4);
 let seed=17071;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const coarse=Array.from({length:33*17},()=>next());
 const sample=(x:number,y:number)=>{
  const cx=x/8,cy=y/8,x0=Math.floor(cx)%32,y0=Math.floor(cy)%16;
  const tx=cx-Math.floor(cx),ty=cy-Math.floor(cy);
  const smooth=(v:number)=>v*v*(3-2*v),a=smooth(tx),b=smooth(ty);
  const v=(ix:number,iy:number)=>coarse[(iy%16)*33+(ix%32)]!;
  return (v(x0,y0)*(1-a)+v(x0+1,y0)*a)*(1-b)+(v(x0,y0+1)*(1-a)+v(x0+1,y0+1)*a)*b;
 };
 for(let y=0;y<height;y++)for(let x=0;x<size;x++){
  const n=sample(x,y),alpha=Math.max(0,Math.min(205,(n-.43)*600));
  const k=(y*size+x)*4;
  pixels[k]=244;pixels[k+1]=246;pixels[k+2]=249;pixels[k+3]=alpha;
 }
 const cloudTex=RawTexture.CreateRGBATexture(pixels,size,height,scene,true,false,Texture.BILINEAR_SAMPLINGMODE);
 cloudTex.wrapU=Texture.WRAP_ADDRESSMODE;cloudTex.wrapV=Texture.CLAMP_ADDRESSMODE;
 const material=new StandardMaterial("nh011-misty-clouds",scene);
 material.backFaceCulling=false;material.disableLighting=true;material.disableDepthWrite=true;
 material.fogEnabled=false;material.diffuseTexture=cloudTex;material.opacityTexture=cloudTex;
 material.emissiveColor=Color3.White();material.useAlphaFromDiffuseTexture=true;
 material.transparencyMode=Material.MATERIAL_ALPHABLEND;material.alpha=.82;
 const dome=MeshBuilder.CreateSphere("nh011-cloud-dome",{diameter:6900,segments:32},scene);
 dome.material=material;dome.infiniteDistance=true;dome.isPickable=false;dome.applyFog=false;

 // Keep the existing star dome unobstructed at night.
 const setTime=(time:NorthHeightsTime)=>{
  dome.visibility=time==="day"?.62:time==="dusk"?.16:0;
 };
 setTime("dusk");
 return {
  setTime,
  dispose(){
   dome.dispose();
   material.diffuseTexture=null;
   material.opacityTexture=null;
   cloudTex.dispose();
   material.dispose();
  },
 };
}
