/** FINCH-FLOORS-023 — one tile grammar, color variation only, 53 tower floors.
 * Visual-only skins use the existing white Rapier support slabs and the same
 * elevator cutout on every upper floor. 9 shared materials + thin instances
 * avoid a separate mesh/material per room or storey.
 */
import {
 Color3,Matrix,MeshBuilder,Quaternion,RawTexture,Scene,StandardMaterial,
 Texture,TransformNode,Vector3,VertexBuffer,
} from "@babylonjs/core";
import type {BuildingSpec} from "@/game/world-generation/schema";
import {finchFloorRing004,finchShaft004} from "./north-heights-finch-elevator-structure-004";

export const FINCH_TILE_VARIANTS_023=[
 // Original Floor 53 terracotta / walnut tile color is the first variant.
 {name:"warm-terracotta",rgb:[1.0,1.0,1.0]},
 {name:"soft-oak",rgb:[1.03,1.07,.94]},
 {name:"smoky-stone",rgb:[.83,.89,.92]},
 {name:"sandstone",rgb:[1.10,1.04,.82]},
 {name:"muted-sage",rgb:[.81,1.00,.84]},
 {name:"slate-blue",rgb:[.80,.91,1.12]},
 {name:"dark-walnut",rgb:[.81,.78,.77]},
 {name:"ivory-linen",rgb:[1.20,1.17,1.04]},
 {name:"warm-grey",rgb:[.95,.97,.98]},
] as const;

export function finchFloorTileVariant023(floor:number):number{
 if(!Number.isInteger(floor)||floor<1||floor>53)
  throw Error("Finch tile floor index must be 1..53");
 return ((53-floor)%FINCH_TILE_VARIANTS_023.length);
}
export type FinchFloorSurfaces023={
 dispose:()=>void;
 readonly surfaces:number;
 readonly floorCount:number;
 readonly variants:number;
};
export function createFinchFloorSurfaces023(
 scene:Scene,lot:BuildingSpec,ground:(x:number,z:number)=>number,
):FinchFloorSurfaces023{
 if(lot.id!=="NH-04-06-L2")throw Error("Finch tiles must not affect other towers");
 const shaft=finchShaft004(lot);
 if(!shaft)throw Error("Finch floor shaft is required");
 const w=(lot.overrides?.width??22.669)-.60;
 const d=(lot.overrides?.depth??33.889)-.60;
 const footprint=finchFloorRing004(lot.position.x,lot.position.z,w,d,shaft);
 const topY=ground(lot.position.x,lot.position.z)+shaft.topFloorOffset;
 const root=new TransformNode("finch023:tile-floors-root",scene);
 root.position.set(lot.position.x,topY,lot.position.z);

 // Exactly the same deterministic 64 x 64 tile texture for every floor.
 // Varying only StandardMaterial.diffuseColor produces color, not layout,
 // or geometry differences between storeys.
 const pixels=new Uint8Array(64*64*4);
 for(let v=0;v<64;v++)for(let u=0;u<64;u++){
  const offset=(v*64+u)*4;
  const joint=u<2||v<2;
  const grain=(u*17+v*7)%13;
  const delta=grain<3?-6:grain>10?5:0;
  pixels[offset]=joint?55:131+delta;
  pixels[offset+1]=joint?40:88+delta;
  pixels[offset+2]=joint?32:63+delta;
  pixels[offset+3]=255;
 }
 const texture=RawTexture.CreateRGBATexture(
  pixels,64,64,scene,false,false,Texture.NEAREST_SAMPLINGMODE);
 texture.wrapU=Texture.WRAP_ADDRESSMODE;
 texture.wrapV=Texture.WRAP_ADDRESSMODE;
 const mats=FINCH_TILE_VARIANTS_023.map((variant,index)=>{
  const mat=new StandardMaterial("finch023:tiles-"+index+"-"+variant.name,scene);
  mat.diffuseTexture=texture;
  mat.diffuseColor=new Color3(...variant.rgb);
  mat.specularColor=new Color3(.12,.085,.055);
  mat.specularPower=64;
  return mat;
 });
 const compose=(positions:readonly {x:number;y:number;z:number}[])=>{
  const matrices=new Float32Array(positions.length*16);
  positions.forEach((position,i)=>{
   Matrix.Compose(Vector3.One(),Quaternion.Identity(),
    new Vector3(position.x,position.y,position.z)).copyToArray(matrices,i*16);
  });
  return matrices;
 };
 let surfaces=0,instanced=0;
 const groundPlane=(id:string,width:number,depth:number,material:StandardMaterial)=>{
  const mesh=MeshBuilder.CreateGround(id,{width,height:depth,subdivisions:1},scene);
  mesh.parent=root;
  mesh.material=material;
  mesh.isPickable=false;
  mesh.checkCollisions=false;
  mesh.alwaysSelectAsActiveMesh=true;
  // Each physical section repeats identical 0.76m grout proportions.
  const uv=mesh.getVerticesData(VertexBuffer.UVKind);
  if(uv) {
   for(let i=0;i<uv.length;i+=2){
    uv[i]=(uv[i]??0)*width/.76;
    uv[i+1]=(uv[i+1]??0)*depth/.76;
   }
   mesh.setVerticesData(VertexBuffer.UVKind,uv);
  }
  surfaces++;
  return mesh;
 };
 // Keep floor 1 continuous, as its existing support is a full lobby slab.
 // 2..53 have the authoritative same four-part ring as the glass elevator.
 const floors=Array.from({length:52},(_,index)=>index+2);
 for(const [variantIndex,mat] of mats.entries()){
  const levels=floors.filter(f=>finchFloorTileVariant023(f)===variantIndex);
  if(!levels.length)continue;
  for(const [sectionIndex,part] of footprint.entries()){
   const mesh=groundPlane(
    "finch023:floor-skin-ring-"+variantIndex+"-"+sectionIndex,
    part.width,part.depth,mat);
   const positions=levels.map(f=>({
    x:part.x-lot.position.x,
    y:-(53-f)*shaft.fh+.023,
    z:part.z-lot.position.z,
   }));
   mesh.thinInstanceSetBuffer("matrix",compose(positions),16,true);
   mesh.thinInstanceRefreshBoundingInfo();
   instanced+=positions.length;
  }
 }
 const lobby=groundPlane("finch023:floor-skin-lobby",w,d,
  mats[finchFloorTileVariant023(1)]!);
 lobby.thinInstanceSetBuffer("matrix",compose([{
  x:0,y:shaft.bottomFloorOffset-shaft.topFloorOffset+.023,z:0,
 }]),16,true);
 lobby.thinInstanceRefreshBoundingInfo();
 instanced+=1;
 return {
  surfaces:instanced,
  floorCount:53,
  variants:FINCH_TILE_VARIANTS_023.length,
  dispose(){
   root.dispose(false,true);
   mats.forEach(mat=>mat.dispose());
   texture.dispose();
  },
 };
}
