/** Recovered NH-OPT-011 misty cloud visual baseline.
 * Source commit: 4fb2b17fe3e5017fbf08e85c7c586ac8a8d33baf.
 * Cloud-only extraction: weather controls, rain, thunder, and audio intentionally excluded.
 * Daytime opacity and seeded 256 x 128 cloud texture match the legacy pilot.
 */
import {Color3,Material,Mesh,MeshBuilder,RawTexture,Scene,StandardMaterial,Texture,VertexData} from "@babylonjs/core";
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
  // Spherical UVs converge into sharp spokes at the zenith. Fade only the
  // polar 20 degrees; the entire accepted cloud pattern elsewhere is untouched.
  const fromPole=Math.min(y+.5,height-y-.5)/height;
  const t=Math.max(0,Math.min(1,(fromPole-.042)/(.108-.042)));
  const polarFade=t*t*(3-2*t);
  pixels[k]=244;pixels[k+1]=246;pixels[k+2]=249;
  pixels[k+3]=Math.round(alpha*polarFade);
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
 dome.alphaIndex=0;

 // Restore soft, non-radial clouds above the camera without relying on the
 // sphere's singular north-pole UV. A compact planar-mapped spherical cap
 // samples the SAME noise texture, so this is not a redesigned sky.
 const cap=new Mesh("nh011-zenith-cloud-cap",scene);
 const capRadius=3435,capAngle=.34,capRings=8,capSegments=72;
 const positions:number[]=[0,capRadius,0];
 const normals:number[]=[0,-1,0];
 const uvs:number[]=[.405,.52];
 const colors:number[]=[1,1,1,1];
 const indices:number[]=[];
 const smoothstep=(min:number,max:number,value:number)=>{
  const t=Math.max(0,Math.min(1,(value-min)/(max-min)));
  return t*t*(3-2*t);
 };
 for(let ring=1;ring<=capRings;ring++){
  const theta=capAngle*ring/capRings;
  const r=capRadius*Math.sin(theta),y=capRadius*Math.cos(theta);
  const opacity=1-smoothstep(.13,capAngle,theta);
  for(let segment=0;segment<=capSegments;segment++){
   const angle=2*Math.PI*segment/capSegments;
   const x=r*Math.cos(angle),z=r*Math.sin(angle);
   positions.push(x,y,z);normals.push(0,-1,0);
   // Planar XZ coordinates avoid longitude convergence at the zenith.
   uvs.push(.405+.15*x/(capRadius*Math.sin(capAngle)),
            .52+.23*z/(capRadius*Math.sin(capAngle)));
   colors.push(1,1,1,opacity);
  }
 }
 for(let segment=0;segment<capSegments;segment++)
  indices.push(0,segment+1,segment+2);
 for(let ring=0;ring<capRings-1;ring++){
  const inner=1+ring*(capSegments+1),outer=inner+capSegments+1;
  for(let segment=0;segment<capSegments;segment++){
   const a=inner+segment,b=a+1,d=outer+segment,e=d+1;
   indices.push(a,d,b,b,d,e);
  }
 }
 const geometry=new VertexData();
 geometry.positions=positions;geometry.normals=normals;
 geometry.uvs=uvs;geometry.colors=colors;geometry.indices=indices;
 geometry.applyToMesh(cap);
 cap.material=material;cap.infiniteDistance=true;cap.isPickable=false;
 cap.applyFog=false;cap.alphaIndex=1;
 cap.hasVertexAlpha=true;

 // Keep the existing star dome unobstructed at night.
 const setTime=(time:NorthHeightsTime)=>{
  dome.visibility=time==="day"?.62:time==="dusk"?.16:0;
  cap.visibility=dome.visibility;
 };
 setTime("dusk");
 return {
  setTime,
  dispose(){
   cap.dispose();dome.dispose();
   material.diffuseTexture=null;
   material.opacityTexture=null;
   cloudTex.dispose();
   material.dispose();
  },
 };
}
