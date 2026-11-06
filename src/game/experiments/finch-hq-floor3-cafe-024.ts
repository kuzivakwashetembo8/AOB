/** FINCH-CAFE-024 — owner-accepted AppDeploy café arranged in the real
 * Finch HQ Floor 3, through shared component catalogue + pure organizer.
 *
 * Trial branch only. The accepted elevator, structural slabs, visual tiles,
 * city facade, NPC missions and Floor 53 remain independent.
 */
import {
 Color3,DynamicTexture,MeshBuilder,PointLight,Scene,
 StandardMaterial,TransformNode,Vector3,
} from "@babylonjs/core";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {MeridianPhysics} from "@/game/physics/rapier-world";
import {describeRoomComponent024,type RoomMaterial024,
 type RoomPrimitive024,type RoomComponentRequest024}
 from "@/game/interiors/room-components-024";
import {finchShaft004,finchFloorRing004}
 from "./north-heights-finch-elevator-structure-004";
import {organizeFinchCafeFloor024} from "./finch-hq-floor3-program-024";

export type FinchCafeRuntime024={
 update:(player:{x:number;y:number;z:number}|null,traveling:boolean)=>void;
 stats:()=>Readonly<{active:boolean;meshes:number;colliders:number;components:number}>;
 dispose:()=>void;
};
const COLORS:Record<RoomMaterial024,[number,number,number]>={
 wood:[.39,.24,.15],"wood-dark":[.20,.13,.09],
 "wood-light":[.57,.39,.26],brass:[.71,.55,.31],steel:[.32,.35,.36],
 marble:[.81,.76,.66],leather:[.31,.25,.20],fabric:[.34,.27,.24],
 white:[.88,.85,.79],glass:[.62,.85,.88],screen:[.05,.14,.18],
 "screen-line":[.26,.68,.70],plant:[.18,.35,.20],leaf:[.34,.49,.23],
 pot:[.46,.40,.34],rug:[.25,.20,.17],warm:[1,.76,.44],
 wall:[.69,.65,.57],
};
export function createFinchCafeFloor024(
 scene:Scene,lot:BuildingSpec,ground:(x:number,z:number)=>number,
 physics:MeridianPhysics,
):FinchCafeRuntime024{
 if(lot.id!=="NH-04-06-L2")
  throw new Error("Cafe cannot mount outside Finch HQ");
 const shaft=finchShaft004(lot);
 if(!shaft)throw new Error("Finch shaft missing");
 const floor=3;
 const floorY=ground(lot.position.x,lot.position.z)
  +shaft.topFloorOffset-(shaft.floors-floor)*shaft.fh;
 const plan=organizeFinchCafeFloor024(lot);
 let root:TransformNode|null=null;
 let meshes=0;
 let disposed=false;
 const materials=new Map<RoomMaterial024,StandardMaterial>();
 const lease:StandardMaterial[]=[];
 const lights:PointLight[]=[];
 const colliders:{dispose:()=>void}[]=[];
 let canvasTexture:DynamicTexture|null=null;
 const material=(role:RoomMaterial024):StandardMaterial=>{
  const cached=materials.get(role);
  if(cached)return cached;
  const rgb=COLORS[role];
  const mat=new StandardMaterial("finch024:"+role,scene);
  mat.diffuseColor=new Color3(...rgb);
  mat.specularColor=new Color3(.12,.12,.12);
  mat.specularPower=role==="marble"||role==="steel"?50:16;
  if(role==="glass"){
   mat.alpha=.23;mat.backFaceCulling=false;mat.disableDepthWrite=true;
  }
  if(role==="warm"||role==="screen-line"){
   mat.emissiveColor=new Color3(...rgb).scale(role==="warm"?.80:.40);
  }
  materials.set(role,mat);
  lease.push(mat);
  return mat;
 };
 const createPrimitive=(parent:TransformNode,
  part:RoomPrimitive024,placement:RoomComponentRequest024)=>{
  // Contact-only primitives supply Rapier shapes without visual cuboids.
  const contactOnly=part.id.endsWith(":contact")
   ||part.id.endsWith(":table-contact");
  if(!contactOnly){
   const name="finch024:"+part.id;
   const mesh=part.shape==="cylinder"
    ?MeshBuilder.CreateCylinder(name,{
      diameter:part.width,height:part.height,tessellation:12},scene)
    :part.shape==="torus"
    ?MeshBuilder.CreateTorus(name,{
      diameter:part.width,thickness:part.height,tessellation:32},scene)
    :MeshBuilder.CreateBox(name,{
      width:part.width,height:part.height,depth:part.depth},scene);
   mesh.parent=parent;
   mesh.position.set(part.x,part.y,part.z);
   mesh.material=material(part.material);
   mesh.isPickable=false;
   mesh.checkCollisions=false;
   meshes++;
  }
  if(part.solid){
   const yaw=placement.yaw??0;
   const dx=part.x*Math.cos(yaw)+part.z*Math.sin(yaw);
   const dz=-part.x*Math.sin(yaw)+part.z*Math.cos(yaw);
   colliders.push(physics.addStaticBox({
    x:lot.position.x+placement.x+dx,
    y:floorY+(placement.elevation??0)+part.y,
    z:lot.position.z+placement.z+dz,
   },{x:part.width/2,y:part.height/2,z:part.depth/2},yaw));
  }
 };
 const createComponent=(placement:RoomComponentRequest024)=>{
  if(!root)throw Error("Floor 3 root is not active");
  const node=new TransformNode("finch024:component:"+placement.id,scene);
  node.parent=root;
  node.position.set(placement.x,placement.elevation??0,placement.z);
  node.rotation.y=placement.yaw??0;
  for(const primitive of describeRoomComponent024(placement))
   createPrimitive(node,primitive,placement);
 };
 const createFloorCeiling=()=>{
  if(!root)return;
  const footprint=finchFloorRing004(
   lot.position.x,lot.position.z,
   (lot.overrides?.width??22.669)-.60,
   (lot.overrides?.depth??33.889)-.60,shaft);
  for(const [i,part] of footprint.entries()){
   // The floor above already provides structural ceiling collision. This
   // 6cm decorative treatment sits 2cm beneath its bottom support face and
   // does not cap the open elevator shaft.
   const panel=MeshBuilder.CreateBox("finch024:ceiling-panel-"+i,{
    width:part.width,height:.06,depth:part.depth},scene);
   panel.parent=root;
   panel.position.set(part.x-lot.position.x,2.90,part.z-lot.position.z);
   panel.material=material("wood-dark");
   panel.isPickable=false;panel.checkCollisions=false;meshes++;
  }
  for(const x of [-10.85,10.85]){
   const beam=MeshBuilder.CreateBox("finch024:ceiling-trim",{
    width:.12,height:.10,depth:32.5},scene);
   beam.parent=root;beam.position.set(x,2.81,0);
   beam.material=material("brass");meshes++;
  }
 };
 const createLight=()=>{
  if(!root)return;
  // Only three live shadowless lights for the entire active suite. The
  // remaining pendants emit through their materials, avoiding light cost.
  for(const [i,x,z,intensity] of [
   [0,-5.0,-1.0,.72],[1,4.6,3.1,.84],[2,-7.4,10.9,.70],
  ] as const){
   const bulb=new PointLight("finch024:cafe-light-"+i,
    new Vector3(lot.position.x+x,floorY+2.43,lot.position.z+z),scene);
   bulb.diffuse=new Color3(1,.78,.53);
   bulb.intensity=intensity;bulb.range=8.8;
   lights.push(bulb);
  }
 };
 const createSign=()=>{
  if(!root||typeof document==="undefined")return;
  const title="FINCH CAFÉ";
  canvasTexture=new DynamicTexture("finch024:cafe-sign-text",{
   width:512,height:128},scene,false);
  // Babylon's typed DynamicTexture API also supports headless rendering.
  canvasTexture.drawText(title,null,81,"bold 44px Arial",
   "#f1d3a6","#1e2a28",true);
  const signMat=new StandardMaterial("finch024:sign-type",scene);
  signMat.diffuseTexture=canvasTexture;
  signMat.emissiveColor=new Color3(.14,.13,.09);
  lease.push(signMat);
  const label=MeshBuilder.CreatePlane("finch024:cafe-name",
   {width:1.48,height:.35},scene);
  label.parent=root;label.position.set(5.4,2.44,2.61);
  label.rotation.y=Math.PI;
  label.material=signMat;
  label.isPickable=false;meshes++;
 };
 const activate=()=>{
  if(disposed||root)return;
  root=new TransformNode("finch024:cafe-floor3-root",scene);
  root.position.set(lot.position.x,floorY,lot.position.z);
  for(const placement of plan.placements)createComponent(placement);
  createFloorCeiling();
  createLight();
  createSign();
 };
 const deactivate=()=>{
  for(const body of colliders.splice(0))body.dispose();
  for(const bulb of lights.splice(0))bulb.dispose();
  root?.dispose(false,true);root=null;
  for(const mat of lease.splice(0))mat.dispose();
  materials.clear();canvasTexture?.dispose();canvasTexture=null;
  meshes=0;
 };
 const update=(person:{x:number;y:number;z:number}|null,traveling:boolean)=>{
  if(disposed)return;
  const inside=!!person&&!traveling
   &&Math.abs(person.x-lot.position.x)<(lot.overrides?.width??22.669)/2+2
   &&Math.abs(person.z-lot.position.z)<(lot.overrides?.depth??33.889)/2+2
   &&Math.abs(person.y-(floorY+.92))<1.65;
  if(inside&&!root)activate();
  else if(!inside&&root)deactivate();
 };
 return {
  update,
  stats:()=>({active:root!==null,meshes,colliders:colliders.length,
   components:root?plan.placements.length:0}),
  dispose(){
   if(disposed)return;
   deactivate();disposed=true;
  },
 };
}
