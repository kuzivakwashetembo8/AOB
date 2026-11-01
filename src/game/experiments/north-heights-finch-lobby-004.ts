/** POI-004. Single centered glass elevator, 53-level continuous physical travel.
 * Shares the shaft coordinates with both Rapier and the authored floor cutouts. */
import {AnimationGroup,Color3,Mesh,MeshBuilder,Scene,SceneLoader,StandardMaterial,TransformNode,Vector3} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {PED002_NPC_FILES} from "./north-heights-pedestrian-asset-manifest-002";
import {finchShaft004,FINCH_ELEVATOR_TRAVEL_SECONDS_004} from "./north-heights-finch-elevator-structure-004";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {MeridianPhysics} from "@/game/physics/rapier-world";

export type FinchElevatorState004={
 floor:1|53;direction:"up"|"down";available:boolean;moving:boolean;progress:number;
};
export interface FinchLobby004{
 update:(person:{x:number;y:number;z:number}|null,dt:number)=>{
  positionOverride:{x:number;y:number;z:number}|null;
  traveling:boolean;state:FinchElevatorState004;
 };
 requestTravel:()=>boolean;
 loadReceptionist:()=>Promise<void>;
 dispose:()=>void;
}

export function createFinchLobby004(scene:Scene,lots:readonly BuildingSpec[],
 ground:(x:number,z:number)=>number,physics:MeridianPhysics):FinchLobby004{
 const building=lots.find(l=>l.id==="NH-04-06-L2");
 if(!building)throw Error("POI-004 Finch headquarters does not exist");
 const shaft=finchShaft004(building);
 if(!shaft)throw Error("POI-004 missing elevator shaft");
 const cx=building.position.x,cz=building.position.z;
 const groundY=ground(cx,cz),bottom=groundY+shaft.bottomFloorOffset;
 const top=groundY+shaft.topFloorOffset;
 const x=shaft.x,z=shaft.z,front=z+2.05,height=3.05;
 const root=new TransformNode("poi004:finch-interior",scene);
 const carriage=new TransformNode("poi004:carriage-moving",scene);carriage.parent=root;
 const mats:StandardMaterial[]=[];
 const colliders:{dispose:()=>void}[]=[];
 const staticBox=(px:number,py:number,pz:number,hw:number,hh:number,hd:number)=>{
  colliders.push(physics.addStaticBox({x:px,y:py,z:pz},{x:hw,y:hh,z:hd}));
 };
 const material=(name:string,r:number,g:number,b:number,alpha=1)=>{
  const m=new StandardMaterial("poi004:"+name,scene);
  m.diffuseColor=new Color3(r,g,b);m.specularColor=new Color3(.4,.4,.4);
  m.alpha=alpha;if(alpha<1)m.backFaceCulling=false;
  mats.push(m);return m;
 };
 const white=material("white",.99,.99,.99);
 const steel=material("steel",.66,.72,.77),wood=material("rosewood",.34,.13,.075);
 const dark=material("slate",.14,.16,.19),glass=material("transparent-glass",.35,.76,.91,.20);
 const blue=material("light",.42,.78,1);
 blue.emissiveColor=new Color3(.1,.35,.5);
 const box=(name:string,px:number,py:number,pz:number,w:number,h:number,d:number,
  mat:StandardMaterial,onCarriage=false)=>{
  const mesh=MeshBuilder.CreateBox("poi004:"+name,{width:w,height:h,depth:d},scene);
  mesh.position.set(px,py,pz);mesh.material=mat;mesh.parent=onCarriage?carriage:root;
  mesh.isPickable=false;mesh.checkCollisions=false;return mesh;
 };
 const width=building.overrides?.width??22.669;
 const depth=building.overrides?.depth??33.889;
 // Completely white, opaque lobby flooring, continuous to the entrance.
 // The shared lawn has independently been cut away beneath this exact footprint.
 box("full-white-lobby-floor",cx,bottom-.04,cz,width-.65,.08,depth-.65,white);
 // White landing around the upper shaft cutout. The procedural full-height
 // office floors remain absent from the shaft, never intersecting its car.
 // A 3m deep room-to-cabin landing aligns flush with the platform.
 box("top-white-landing",x,top-.03,front+2.35,6.7,.06,4.7,white);
 staticBox(x,top-.03,front+2.35,3.35,.03,2.35);
 // Centered on the -Z wall, with equal left/right margins.
 // Continuous glass shaft: no solid intermediary floors or opaque masonry.
 const shaftH=top-bottom+3.1,shaftY=bottom+shaftH/2;
 box("shaft-glass-left",x-2.45,shaftY,z,.07,shaftH,4.9,glass);
 box("shaft-glass-right",x+2.45,shaftY,z,.07,shaftH,4.9,glass);
 box("shaft-glass-back",x,shaftY,z-2.45,4.9,shaftH,.07,glass);
 box("shaft-glass-front-upper",x,bottom+3.2+(top-bottom-3.2)/2,front,
  4.85,top-bottom-3.2,.06,glass);
 // A simple white reception counter to the right of the entrance sightline.
 const deskX=cx+width*.26,deskZ=cz+3.6;
 box("desk-front",deskX,bottom+.56,deskZ,3.65,1.08,.67,white);
 box("desk-counter",deskX,bottom+1.13,deskZ,4.05,.14,1.09,white);
 box("desk-left-side",deskX-1.75,bottom+.56,deskZ-.27,.16,1.1,.75,white);
 box("desk-right-side",deskX+1.75,bottom+.56,deskZ-.27,.16,1.1,.75,white);
 staticBox(deskX,bottom+.56,deskZ,1.83,.56,.34);
 staticBox(deskX,bottom+1.13,deskZ,2.03,.07,.55);
 // Carriage parts use one transform only: mesh & player ascend together.
 box("car-floor",x,bottom-.075,z,4.3,.15,4.30,white,true);
 box("car-ceiling",x,bottom+height,z,4.35,.13,4.35,dark,true);
 box("car-back-glass",x,bottom+height/2,z-2.17,4.26,height,.07,glass,true);
 for(const side of [-1,1]){
  box("car-side-glass-"+side,x+side*2.17,bottom+height/2,z,.07,height,4.3,glass,true);
  box("front-jamb-"+side,x+side*1.9,bottom+height/2,front,.28,height,.18,wood,true);
  box("handrail-"+side,x+side*2.05,bottom+1,z, .09,.07,3.5,steel,true);
 }
 box("door-header",x,bottom+height-.10,front,3.85,.24,.19,steel,true);
 box("control-column",x+2.3,bottom+1.4,front+.08,.22,1.2,.15,steel,true);
 box("floor-indicator",x,bottom+height+.11,front+.08,.6,.14,.08,blue,true);
 const doorL=box("door-left",x-.82,bottom+1.48,front,1.63,2.78,.12,steel,true);
 const doorR=box("door-right",x+.82,bottom+1.48,front,1.63,2.78,.12,steel,true);
 let doorCollider:{dispose:()=>void}|null=null,platformCollider:{dispose:()=>void}|null=null;
 let floor:1|53=1,target:1|53=53;
 let mode:"idle"|"closing"|"riding"|"opening"="idle";
 let heightFraction=0,doorFraction=0,available=false,closed=false;
 let personInCar:{x:number;y:number;z:number}|null=null;
 const receptionistNodes:TransformNode[]=[];let groups:AnimationGroup[]=[];
 let requested=false;
 const status=():FinchElevatorState004=>({
  floor,direction:floor===1?"up":"down",available:mode==="idle"&&available,
  moving:mode!=="idle",progress:Math.round(heightFraction*100),
 });
 const requestTravel=()=>{
  if(mode!=="idle"||!available||!personInCar||closed)return false;
  target=floor===1?53:1;mode="closing";available=false;
  return true;
 };
 const approach=(p:{x:number;y:number;z:number}|null)=>{
  if(!p)return false;
  return Math.abs(p.x-x)<1.55&&p.z<front-.62&&p.z>z-1.9&&
   Math.abs(p.y-(bottom+(top-bottom)*heightFraction+.92))<1.9;
 };
 const update=(p:{x:number;y:number;z:number}|null,dt:number)=>{
  if(closed)return {positionOverride:null,traveling:false,state:status()};
  const step=Math.min(.05,Math.max(0,dt));
  const offset=heightFraction*(top-bottom);
  const px=(p?.x??Infinity)-x,pz=(p?.z??Infinity)-front;
  const sameLevel=!!p&&Math.abs(p.y-(bottom+offset+.92))<2.2;
  personInCar=approach(p)?{...p!}:null;
  available=!!personInCar;
  const nearDoor=sameLevel&&Math.abs(px)<2.65&&pz>-1.0&&pz<3.3;
  const nearExit=!!personInCar&&pz>-1.6;
  const openingWanted=mode==="opening"||(mode==="idle"&&(nearDoor||nearExit));
  const goal=mode==="closing"||mode==="riding"?0:openingWanted?1:0;
  doorFraction+=(goal-doorFraction)*Math.min(1,step*5.2);
  if(Math.abs(doorFraction-goal)<.005)doorFraction=goal;
  doorL.position.x=x-.82-doorFraction*1.52;
  doorR.position.x=x+.82+doorFraction*1.52;
  if(doorFraction>.04||nearDoor||personInCar){
   doorCollider?.dispose();doorCollider=null;
  }else if(!doorCollider&&doorFraction<.02){
   doorCollider=physics.addStaticBox({x,y:bottom+offset+1.48,z:front},
     {x:1.62,y:1.39,z:.06});
  }
  let override:{x:number;y:number;z:number}|null=null;
  if(mode==="closing"&&doorFraction<.02)mode="riding";
  if(mode==="riding"){
   const delta=step/FINCH_ELEVATOR_TRAVEL_SECONDS_004*(target===53?1:-1);
   heightFraction=Math.max(0,Math.min(1,heightFraction+delta));
   carriage.position.y=(top-bottom)*heightFraction;
   // Keep the original Voight character/camera and the original player body.
   // No instantaneous floor-53 teleport. The body advances at the same continuous
   // vertical speed as the physically visible elevator cabin.
   const y=bottom+(top-bottom)*heightFraction+.92;
   override={x:personInCar?.x??x,y,z:personInCar?.z??z};
   if((target===53&&heightFraction>=1)||(target===1&&heightFraction<=0)){
    floor=target;
    platformCollider?.dispose();platformCollider=null;
    if(floor===53)platformCollider=physics.addStaticBox(
      {x,y:top-.08,z},{x:2.15,y:.08,z:2.15});
    mode="opening";
   }
  }else if(mode==="opening"&&doorFraction>.98){
   mode="idle";
  }
  // The cabin alone travels vertically; shaft glass and both landings stay fixed.
  carriage.position.y=(top-bottom)*heightFraction;
  return {positionOverride:override,traveling:mode!=="idle",state:status()};
 };
 const loadReceptionist=async()=>{
  if(closed||requested)return;requested=true;
  try{
   // Office Professionals: 025, formally dressed insurance broker.
   const file=PED002_NPC_FILES[24]!;
   const data=await SceneLoader.ImportMeshAsync("","/GLBs/Characters/",file,scene);
   if(closed){data.meshes.forEach(m=>m.dispose());return;}
   const anchor=new TransformNode("poi004:receptionist-office-professional-025",scene);
   receptionistNodes.push(anchor);
   const roots=data.meshes.filter(m=>!m.parent);
   roots.forEach(m=>m.parent=anchor);
   const low=new Vector3(Infinity,Infinity,Infinity),high=new Vector3(-Infinity,-Infinity,-Infinity);
   for(const m of data.meshes){
    if(m.getTotalVertices()===0)continue;
    m.computeWorldMatrix(true);
    const b=m.getBoundingInfo().boundingBox;
    low.minimizeInPlace(b.minimumWorld);high.maximizeInPlace(b.maximumWorld);
    m.isPickable=false;m.checkCollisions=false;
   }
   const h=high.y-low.y;
   if(!Number.isFinite(h)||h<.1)throw Error("POI-004 invalid suit NPC geometry");
   const scale=(h<1.25||h>2.25)?1.74/h:1;
   anchor.scaling.setAll(scale);
   anchor.position.set(deskX-(low.x+high.x)*.5*scale,bottom-low.y*scale,
    deskZ-1.50-(low.z+high.z)*.5*scale);
   anchor.rotation.y=0;
   groups=data.animationGroups;
   const idle=groups.find(g=>/idle/i.test(g.name));
   for(const g of groups)if(g!==idle)g.stop();
   idle?.start(true);
  }catch(error){if(!closed)console.error("[POI-004] Formal receptionist failed",error);}
 };
 return {update,requestTravel,loadReceptionist,dispose(){
  closed=true;doorCollider?.dispose();platformCollider?.dispose();
  colliders.forEach(h=>h.dispose());groups.forEach(g=>g.stop());
  for(const node of receptionistNodes)node.dispose(false,true);
  root.dispose(false,true);mats.forEach(m=>m.dispose());
 }};
}
