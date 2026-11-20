/** POI-004. Single centered glass elevator, 53-level continuous physical travel.
 * Shares the shaft coordinates with both Rapier and the authored floor cutouts. */
import {Color3,MeshBuilder,Scene,StandardMaterial,TransformNode,Vector3} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {finchShaft004,finchFloorStopFraction004,FINCH_ELEVATOR_TRAVEL_SECONDS_004} from "./north-heights-finch-elevator-structure-004";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {MeridianPhysics} from "@/game/physics/rapier-world";

/** World-space inner glass envelope; camera never escapes it while occupied. */
export type FinchCabinCamera006={x:number;z:number;floorY:number;height:number;halfX:number;halfZ:number};
export function constrainFinchCabinCamera006(
  position:{x:number;y:number;z:number},cabin:FinchCabinCamera006,
){
 const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
 return {
  x:clamp(position.x,cabin.x-cabin.halfX,cabin.x+cabin.halfX),
  y:clamp(position.y,cabin.floorY+.40,cabin.floorY+cabin.height-.25),
  z:clamp(position.z,cabin.z-cabin.halfZ,cabin.z+cabin.halfZ),
 };
}
/** 1-based physical floor shown during continuous travel. */
export function finchElevatorFloorCounter007(fraction:number):number{
 return Math.max(1,Math.min(53,1+Math.round(Math.max(0,Math.min(1,fraction))*52)));
}
export type FinchElevatorState004={
 floor:number;floors:number;buildingId:string;currentFloor:number;direction:"up"|"down";available:boolean;moving:boolean;progress:number;
};
export interface FinchLobby004{
 update:(person:{x:number;y:number;z:number}|null,dt:number)=>{
  positionOverride:{x:number;y:number;z:number}|null;
  traveling:boolean;state:FinchElevatorState004;
  cameraCabin:FinchCabinCamera006|null;
 };
 requestTravel:(selectedFloor?:number)=>boolean;
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
 const x=shaft.x,z=shaft.z,front=z+2.17,height=3.05;
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
 const glass=material("transparent-glass",.62,.83,.91,.22);
 const doorGlass=material("door-clear-glass",.72,.91,.98,.27);
 const deckGlass=material("laminated-floor-glass",.65,.84,.92,.42);
 const box=(name:string,px:number,py:number,pz:number,w:number,h:number,d:number,
  mat:StandardMaterial,onCarriage=false)=>{
  const mesh=MeshBuilder.CreateBox("poi004:"+name,{width:w,height:h,depth:d},scene);
  mesh.position.set(px,py,pz);mesh.material=mat;mesh.parent=onCarriage?carriage:root;
  mesh.isPickable=false;mesh.checkCollisions=false;return mesh;
 };
 const width=building.overrides?.width??22.669;
 // The existing native building slab is the ONE uniform white lobby floor.
 // Adding a second coplanar white mesh caused z-fighting and uneven visuals.
 // The terrain below it is now flattened by POI-006.
 // Every upper landing needs the same flush bridge used on Floor 53.
 // It overlaps the glass cabin deck and the existing white floor ring.
 const thresholdZ=front+.35;
 box("top-white-door-threshold",x,top-.03,thresholdZ,3.6,.06,.8,white);
 staticBox(x,top-.03,thresholdZ,1.8,.03,.4);
 for(let level=2;level<shaft.floors;level++){
  const landingY=groundY+shaft.topFloorOffset-(shaft.floors-level)*shaft.fh;
  box("floor-white-door-threshold-"+level,x,landingY-.03,thresholdZ,3.6,.06,.8,white);
  staticBox(x,landingY-.03,thresholdZ,1.8,.03,.4);
 }
 // Centered on the -Z wall, with equal left/right margins.
 // Continuous glass shaft: no solid intermediary floors or opaque masonry.
 const shaftH=top-bottom+3.1,shaftY=bottom+shaftH/2;
 box("shaft-glass-left",x-2.45,shaftY,z,.07,shaftH,4.9,glass);
 box("shaft-glass-right",x+2.45,shaftY,z,.07,shaftH,4.9,glass);
 box("shaft-glass-back",x,shaftY,z-2.45,4.9,shaftH,.07,glass);
 box("shaft-glass-front-upper",x,bottom+3.2+(top-bottom-3.2)/2,front,
  4.85,top-bottom-3.2,.06,glass);
 // Interior furnishings and reception props are intentionally not created.
 // Carriage parts use one transform only: mesh & player ascend together.
 box("car-floor",x,bottom-.075,z,4.35,.15,4.35,deckGlass,true);
 box("car-ceiling",x,bottom+height,z,4.35,.13,4.35,doorGlass,true);
 box("car-back-glass",x,bottom+height/2,z-2.17,4.35,height,.10,glass,true);
 for(const side of [-1,1]){
  box("car-side-glass-"+side,x+side*2.17,bottom+height/2,z,.10,height,4.35,glass,true);
 }
 // Every visible elevator component is glass: no steel, timber, jambs,
 // handrails, control columns or opaque floor indicators.
 // Fixed glass strips mate with the side, floor, and ceiling panels exactly.
 box("car-front-sidelight-left",x-1.90,bottom+height/2,front,.55,height,.10,glass,true);
 box("car-front-sidelight-right",x+1.90,bottom+height/2,front,.55,height,.10,glass,true);
 const doorL=box("door-left",x-.825,bottom+height/2,front,1.65,height,.12,doorGlass,true);
 const doorR=box("door-right",x+.825,bottom+height/2,front,1.65,height,.12,doorGlass,true);
 let doorCollider:{dispose:()=>void}|null=null,platformCollider:{dispose:()=>void}|null=null;
 let floor=1,target=53;
 let travelElapsed=0,travelDuration=FINCH_ELEVATOR_TRAVEL_SECONDS_004,travelStart=0;
 let mode:"idle"|"closing"|"riding"|"opening"="idle";
 let heightFraction=0,doorFraction=0,available=false,closed=false;
 let personInCar:{x:number;y:number;z:number}|null=null;
 const status=():FinchElevatorState004=>({
  floor,floors:53,buildingId:building.id,currentFloor:finchElevatorFloorCounter007(heightFraction),
   direction:floor===1?"up":"down",available:mode==="idle"&&available,
  moving:mode!=="idle",progress:Math.round(heightFraction*100),
 });
 const requestTravel=(selectedFloor?:number)=>{
  if(mode!=="idle"||!available||!personInCar||closed)return false;
  const next=selectedFloor??(floor===1?53:1);
  if(!Number.isInteger(next)||next<1||next>53||next===floor)return false;
  target=next;travelStart=heightFraction;travelElapsed=0;
  travelDuration=Math.max(1.5,FINCH_ELEVATOR_TRAVEL_SECONDS_004*Math.abs(target-floor)/52);
  mode="closing";available=false;return true;
 };
 const approach=(p:{x:number;y:number;z:number}|null)=>{
  if(!p)return false;
  return Math.abs(p.x-x)<1.55&&p.z<front-.62&&p.z>z-1.9&&
   Math.abs(p.y-(bottom+(top-bottom)*heightFraction+.92))<1.9;
 };
 const update=(p:{x:number;y:number;z:number}|null,dt:number)=>{
  if(closed)return {positionOverride:null,traveling:false,state:status(),cameraCabin:null};
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
  // Glass doors retract inside their own openings, not through the cabin sides.
  doorL.scaling.x=Math.max(.015,1-doorFraction);
  doorR.scaling.x=Math.max(.015,1-doorFraction);
  doorL.position.x=x-1.65+doorL.scaling.x*.825;
  doorR.position.x=x+1.65-doorR.scaling.x*.825;
  if(doorFraction>.04||nearDoor||personInCar){
   doorCollider?.dispose();doorCollider=null;
  }else if(!doorCollider&&doorFraction<.02){
   doorCollider=physics.addStaticBox({x,y:bottom+offset+1.48,z:front},
     {x:1.62,y:1.39,z:.06});
  }
  let override:{x:number;y:number;z:number}|null=null;
  if(mode==="closing"&&doorFraction<.02)mode="riding";
  if(mode==="riding"){
   travelElapsed=Math.min(travelDuration,travelElapsed+step);
   const travelEnd=finchFloorStopFraction004(target,shaft);
   const fraction=travelElapsed/travelDuration;
   heightFraction=Math.max(0,Math.min(1,travelStart+(travelEnd-travelStart)*fraction));
   carriage.position.y=(top-bottom)*heightFraction;
   // Keep the original Voight character/camera and the original player body.
   // No instantaneous floor-53 teleport. The body advances at the same continuous
   // vertical speed as the physically visible elevator cabin.
   const y=bottom+(top-bottom)*heightFraction+.92;
   override={x:personInCar?.x??x,y,z:personInCar?.z??z};
   if(travelElapsed>=travelDuration){
    floor=target;
    platformCollider?.dispose();platformCollider=null;
    if(floor>1)platformCollider=physics.addStaticBox(
      {x,y:bottom+(top-bottom)*heightFraction-.08,z},{x:2.15,y:.08,z:2.15});
    mode="opening";
   }
  }else if(mode==="opening"&&doorFraction>.98){
   mode="idle";
  }
  // The cabin alone travels vertically; shaft glass and both landings stay fixed.
  carriage.position.y=(top-bottom)*heightFraction;
  const cameraCabin:FinchCabinCamera006|null=(personInCar||mode!=="idle")&&p
   ?{x,z,floorY:bottom+(top-bottom)*heightFraction,
      height,halfX:2.17-.18,halfZ:2.17-.18}:null;
  return {positionOverride:override,traveling:mode!=="idle",state:status(),cameraCabin};
 };
 const loadReceptionist=async()=>{};
 return {update,requestTravel,loadReceptionist,dispose(){
  closed=true;doorCollider?.dispose();platformCollider?.dispose();
  colliders.forEach(h=>h.dispose());
  root.dispose(false,true);mats.forEach(m=>m.dispose());
 }};
}
