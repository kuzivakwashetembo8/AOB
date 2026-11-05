/** GTD-NH-ATM-022: accepted NH-011 mist-cloud appearance extended to the
 * ten principal cloud genera. Preserves the approved pole-safe planar cap.
 * Two bounded layers crossfade; no cloud-per-object meshes or frame-time re-bakes.
 */
import {
 Color3,Material,Mesh,MeshBuilder,RawTexture,Scene,StandardMaterial,Texture,VertexData,
} from "@babylonjs/core";
import type {NorthHeightsTime} from "./north-heights-sky-002";
import {
 CLOUD_PRESETS_022,type CloudGenus022,type WeatherCondition022,
} from "@/game/atmosphere/nh022-cloud-presets";
import type {AtmosphereRender022,CloudScene022} from "@/game/atmosphere/nh022-atmosphere-model";

const TAU=Math.PI*2;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,x:number)=>{
 const t=clamp((x-a)/(b-a));return t*t*(3-2*t);
};
function hash(x:number,y:number,s:number){
 let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,2147483647);
 h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;
}
/** x wraps around the cloud texture; no visible longitudinal UV seam. */
function noise(x:number,y:number,seed:number,period:number){
 const ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy;
 const wrap=(v:number)=>(v%period+period)%period;
 const u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty);
 const a=hash(wrap(ix),iy,seed),b=hash(wrap(ix+1),iy,seed);
 const c=hash(wrap(ix),iy+1,seed),d=hash(wrap(ix+1),iy+1,seed);
 return ((a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v);
}
function fbm(u:number,v:number,seed:number,scale:number,stretch:number,octaves:number){
 let sum=0,weight=0,amp=.59;
 for(let k=0;k<octaves;k++){
  const p=Math.max(2,Math.round(scale*Math.pow(2,k)));
  sum+=noise(u*p,v*p/stretch,seed+1117*k,p)*amp;
  weight+=amp;amp*=.48;
 }
 return sum/weight;
}
function genusMask(u:number,v:number,genus:CloudGenus022,seed:number){
 const p=CLOUD_PRESETS_022[genus];
 const warp=fbm(u+.11,v+.34,seed+702,3,1.6,3)-.5;
 const bend=fbm(u+.38,v+.17,seed+123,5,2.1,2)-.5;
 const ux=u+warp*.043,vy=v+bend*.065;
 const body=fbm(ux,vy,seed,p.scale,p.stretch,p.detail);
 const grain=fbm(ux+.22,vy+.31,seed+401,p.scale*2.1,p.stretch,2);
 let n=.76*body+.24*grain;
 switch(p.shape){
  case "wisps":
   n=(.79*body+.21*grain)+.1*Math.sin((vy*19+warp*3)*TAU)*body;
   return smooth(.48,.70,n)*(.53+.47*grain);
  case "veil":
   return smooth(.37,.65,.78*body+.22*grain)*(.43+.45*grain);
  case "granules":
   return smooth(.53,.72,n)*(.8+.2*grain);
  case "sheet":
   return smooth(.28,.63,n)*.9;
  case "islands":
   return smooth(.44,.68,n);
  case "low-sheet":
   return smooth(.24,.62,n)*.92;
  case "rolls":
   return smooth(.37,.66,n)*(.7+.3*grain);
  case "rain":
   return smooth(.25,.59,n);
  case "puffs":
   return smooth(.47,.68,n)*(.78+.22*grain);
  case "storm":
   n=.84*body+.16*grain;
   return smooth(.31,.60,n)*(.79+.21*grain);
 }
}
function weatherAlpha(condition:WeatherCondition022){
 return condition==="Clear"?.33:condition==="Partly Cloudy"?.72:
  condition==="Overcast"?.86:condition==="Rain"?.99:1;
}
function cloudPixels(cloud:CloudScene022,low:boolean){
 const width=low?256:384,height=low?128:192;
 const pixels=new Uint8Array(width*height*4);
 const coverageScale=.5+cloud.coverage*.7;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x+.5)/width,v=(y+.5)/height;
  const one=genusMask(u,v,cloud.genus,cloud.seed);
  const two=cloud.secondary?
   genusMask(u+.17,v+.07,cloud.secondary,cloud.seed+1973):0;
  let density=cloud.secondary?one*.68+two*.48:one;
  density=clamp((density-.18)*1.15);
  // Preserve approved spherical-UV polar fade. A planar-mapped cap replaces
  // this small area and never samples near a texture pole.
  const fromPole=Math.min(y+.5,height-y-.5)/height;
  const fade=smooth(.042,.108,fromPole);
  const alpha=clamp(density*coverageScale*weatherAlpha(cloud.condition)*fade);
  const i=(y*width+x)*4;
  pixels[i]=244;pixels[i+1]=246;pixels[i+2]=249;
  pixels[i+3]=Math.round(alpha*210);
 }
 return {pixels,width,height};
}
type CloudLayer={
 id:number;scene:CloudScene022;dome:Mesh;cap:Mesh;material:StandardMaterial;
 texture:RawTexture;dispose:()=>void;
};
function createLayer(scene:Scene,description:CloudScene022,index:number,low:boolean):CloudLayer{
 const {pixels,width,height}=cloudPixels(description,low);
 const texture=RawTexture.CreateRGBATexture(pixels,width,height,scene,true,false,Texture.BILINEAR_SAMPLINGMODE);
 texture.name="nh022-cloud-"+index+"-"+description.id;
 texture.wrapU=Texture.WRAP_ADDRESSMODE;texture.wrapV=Texture.CLAMP_ADDRESSMODE;
 texture.hasAlpha=true;
 const material=new StandardMaterial("nh022-cloud-material-"+index,scene);
 material.backFaceCulling=false;material.disableLighting=true;material.disableDepthWrite=true;
 material.fogEnabled=false;material.diffuseTexture=texture;material.opacityTexture=texture;
 material.diffuseColor=Color3.White();material.emissiveColor=Color3.White();
 material.useAlphaFromDiffuseTexture=true;material.transparencyMode=Material.MATERIAL_ALPHABLEND;
 material.alpha=.82;
 const radius=3450-index*12;
 const dome=MeshBuilder.CreateSphere("nh022-cloud-dome-"+index,{diameter:radius*2,segments:32},scene);
 dome.material=material;dome.infiniteDistance=true;dome.isPickable=false;dome.applyFog=false;
 dome.alphaIndex=index*2;
 // The cap uses planar XZ sampling and variable vertex alpha to replace UV
 // convergence above the player's head, retaining the accepted morphology.
 const cap=new Mesh("nh022-pole-safe-cap-"+index,scene);
 const capRadius=radius-15,capAngle=.34,capRings=8,capSegments=72;
 const positions:number[]=[0,capRadius,0],normals:number[]=[0,-1,0];
 const uvs:number[]=[.405,.52],colors:number[]=[1,1,1,1],indices:number[]=[];
 for(let ring=1;ring<=capRings;ring++){
  const theta=capAngle*ring/capRings,r=capRadius*Math.sin(theta),h=capRadius*Math.cos(theta);
  const opacity=1-smooth(.13,capAngle,theta);
  for(let j=0;j<=capSegments;j++){
   const a=TAU*j/capSegments,x=r*Math.cos(a),z=r*Math.sin(a);
   positions.push(x,h,z);normals.push(0,-1,0);
   uvs.push(.405+.15*x/(capRadius*Math.sin(capAngle)),
    .52+.23*z/(capRadius*Math.sin(capAngle)));
   colors.push(1,1,1,opacity);
  }
 }
 for(let j=0;j<capSegments;j++)indices.push(0,j+1,j+2);
 for(let ring=0;ring<capRings-1;ring++){
  const inner=1+ring*(capSegments+1),outer=inner+capSegments+1;
  for(let j=0;j<capSegments;j++){
   const a=inner+j,b=a+1,d=outer+j,e=d+1;indices.push(a,d,b,b,d,e);
  }
 }
 const vertices=new VertexData();
 vertices.positions=positions;vertices.normals=normals;vertices.uvs=uvs;
 vertices.colors=colors;vertices.indices=indices;vertices.applyToMesh(cap);
 cap.material=material;cap.infiniteDistance=true;cap.isPickable=false;cap.applyFog=false;
 cap.alphaIndex=index*2+1;cap.hasVertexAlpha=true;
 const dispose=()=>{
  cap.dispose();dome.dispose();
  material.diffuseTexture=null;material.opacityTexture=null;
  texture.dispose();material.dispose();
 };
 return {id:description.id,scene:description,dome,cap,material,texture,dispose};
}
function tintForMinute(minute:number,condition:WeatherCondition022){
 const night=minute<310||minute>=1200;
 const dawn=smooth(305,380,minute)*(1-smooth(390,450,minute));
 const dusk=smooth(1010,1110,minute)*(1-smooth(1130,1190,minute));
 const warm=Math.max(dawn,dusk);
 let r=night?.16:1,g=night?.19:.98,b=night?.26:1;
 r=r*(1-warm)+.99*warm;
 g=g*(1-warm)+.66*warm;
 b=b*(1-warm)+.44*warm;
 if(condition==="Rain"||condition==="Thunderstorm"){
  r*=.48;g*=.53;b*=.61;
 }else if(condition==="Overcast"){
  r*=.76;g*=.80;b*=.85;
 }
 return new Color3(r,g,b);
}
export function createNorthHeightsClouds011(scene:Scene,mobile=false){
 const layers:[CloudLayer|null,CloudLayer|null]=[null,null];
 let time:NorthHeightsTime="day",closed=false;
 const ensure=(index:0|1,cloud:CloudScene022)=>{
  if(layers[index]?.id===cloud.id)return layers[index]!;
  layers[index]?.dispose();layers[index]=createLayer(scene,cloud,index,mobile);
  return layers[index]!;
 };
 const update=(state:AtmosphereRender022,_dt:number,quality="High")=>{
  if(closed)return;
  const first=ensure(0,state.from);
  const second=state.from.id===state.to.id?null:ensure(1,state.to);
  const night=state.timeOfDay<310||state.timeOfDay>=1200;
  const nightOpacity=night?.52:1;
  const reduced=quality==="Low"?.85:1;
  const fade=smooth(0,.98,state.blend);
  const show=(layer:CloudLayer,weight:number)=>{
   const visible=Math.max(0,weight)*nightOpacity*reduced;
   layer.dome.visibility=visible;layer.cap.visibility=visible;
   const p=layer.scene;
   const tint=tintForMinute(state.timeOfDay,p.condition);
   layer.material.diffuseColor.copyFrom(tint);
   layer.material.emissiveColor.copyFrom(tint);
   const drift=CLOUD_PRESETS_022[p.genus].drift;
   const wind=state.cloudSeconds*drift/55;
   // Same world-space offset is used on the entire dome and cap; looking
   // around cannot generate or reorder clouds.
   layer.texture.uOffset=(wind*p.windX)%1;
   layer.texture.vOffset=Math.sin(wind*p.windZ*.23)*.014;
  };
  show(first,second?1-fade:1);
  if(second)show(second,fade);
  else if(layers[1]){layers[1]!.dome.visibility=0;layers[1]!.cap.visibility=0;}
 };
 return {
  setTime(value:NorthHeightsTime){time=value;void time;},
  update,
  dispose(){if(closed)return;closed=true;layers[0]?.dispose();layers[1]?.dispose();}
 };
}
