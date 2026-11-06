/** POI-006: an empty 53rd-floor meeting room with Finch as its only inhabitant
 * on the real floor-53 collision slab. No lower-floor room assets are generated. */
import {AnimationGroup,Mesh,Scene,SceneLoader,TransformNode,Vector3} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {finchProximity005} from "./north-heights-finch-intro-005";
import {finchShaft004} from "./north-heights-finch-elevator-structure-004";
import {createFinchRoomTrial022} from "./north-heights-finch-office-trial-022";
import {createFinchCafeFloor024} from "./finch-hq-floor3-cafe-024";
import type {BuildingSpec} from "@/game/world-generation/schema";
import type {MeridianPhysics} from "@/game/physics/rapier-world";

export interface FinchSuite005{
 loadFinch:()=>Promise<void>;
 isNearFinch:(player:{x:number;y:number;z:number}|null)=>boolean;
 setTalking:(active:boolean)=>void;
 updateInterior:(person:{x:number;y:number;z:number}|null,traveling:boolean)=>void;
 getFinchLocation:()=>{x:number;y:number;z:number};
 dispose:()=>void;
}
export function createFinchSuite005(scene:Scene,lots:readonly BuildingSpec[],
 ground:(x:number,z:number)=>number,physics:MeridianPhysics):FinchSuite005{
 const lot=lots.find(l=>l.id==="NH-04-06-L2");
 if(!lot)throw Error("POI-005 missing Finch HQ building");
 const shaft=finchShaft004(lot);
 if(!shaft)throw Error("POI-005 missing shaft reference");
 const x=lot.position.x,z=lot.position.z;
 const y=ground(x,z)+shaft.topFloorOffset;
 // FINCH-ROOM-022: on this isolated evaluation branch only, dress the actual
 // 53rd floor around the existing Finch position. Keep the white structural
 // slab, glass elevator, mission trigger and all other floors unchanged.
 const officeTrial=createFinchRoomTrial022(scene,lot,ground,physics);
 // Floor 3 uses the reusable component catalogue + pure organization rules.
 const cafeFloor3=createFinchCafeFloor024(scene,lot,ground,physics);
 const finchPosition={x:x+2.9,y:y+.93,z:z+8.98};
 let finchRoot:TransformNode|null=null,groups:AnimationGroup[]=[];
 let finchMeshes:Mesh[]=[],loaded=false,requested=false,disposed=false;
 let idleClip:AnimationGroup|null=null,talkingClip:AnimationGroup|null=null;
 let speakingRequested=false,speakingActive=false;
 const switchFinchClip=()=>{
  if(!loaded||disposed)return;
  const speaking=speakingRequested&&!!talkingClip;
  if(speaking===speakingActive)return;
  const next=speaking?talkingClip:idleClip;
  if(!next)return;
  for(const clip of [idleClip,talkingClip])if(clip&&clip!==next)clip.stop();
  next.start(true);
  speakingActive=speaking;
 };
 const loadFinch=async()=>{
  if(disposed||requested)return;
  requested=true;
  try{
   const result=await SceneLoader.ImportMeshAsync("","/GLBs/Characters/","Finch.glb",scene);
   if(disposed){result.meshes.forEach(m=>m.dispose());result.animationGroups.forEach(g=>g.dispose());return;}
   const anchor=new TransformNode("poi005:Harold-Finch-53",scene);
   finchRoot=anchor;
   result.meshes.filter(m=>!m.parent).forEach(m=>m.parent=anchor);
   const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
   finchMeshes=result.meshes.filter((m):m is Mesh=>m instanceof Mesh);
   for(const mesh of finchMeshes){
    if(mesh.getTotalVertices()===0)continue;
    mesh.computeWorldMatrix(true);
    const bounds=mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(bounds.minimumWorld);max.maximizeInPlace(bounds.maximumWorld);
    mesh.isPickable=false;mesh.checkCollisions=false;
   }
   const h=max.y-min.y;
   if(!Number.isFinite(h)||h<.2)throw Error("Invalid Finch.glb bounds");
   const scale=h<1.45||h>2.18?1.78/h:1;
   anchor.scaling.setAll(scale);
   anchor.position.set(finchPosition.x-(min.x+max.x)*.5*scale,
     y-min.y*scale,finchPosition.z-(min.z+max.z)*.5*scale);
   anchor.rotation.y=Math.PI; // faces the approaching lift and office visitor
   groups=result.animationGroups;
   idleClip=groups.find(g=>/^(idle|stand)/i.test(g.name))??groups.find(g=>/idle/i.test(g.name))??null;
   talkingClip=groups.find(g=>/(talk|speak|chat|conversation|dialog)/i.test(g.name))??null;
   for(const group of groups)group.stop();
   idleClip?.start(true);
   speakingActive=false;loaded=true;
   switchFinchClip();
   if(!talkingClip)console.warn("[FINCH-007] Finch.glb is missing a talking animation; idle retained.");
  }catch(err){if(!disposed)console.error("[POI-005] Finch asset failed",err);}
 };
 return {
  loadFinch,
  updateInterior(person,traveling){
   // Physical Reese capsule (not the elevated third-person camera) governs
   // visual floor skins. The lift may still be opening when Reese reaches the
   // Floor 3 landing, so tiles are visible even before movement is enabled.
   let occupied:number|null=null;
   if(person
     &&Math.abs(person.x-x)<(lot.overrides?.width??22.669)/2-.30
     &&Math.abs(person.z-z)<(lot.overrides?.depth??33.889)/2-.30){
    const base=ground(x,z);
    const playerFeet=person.y-.92;
    const near=Math.max(1,Math.min(shaft.floors,
      Math.round((playerFeet-base-.87)/shaft.fh)+1));
    const support=near===1?base+shaft.bottomFloorOffset
      :base+shaft.topFloorOffset-(shaft.floors-near)*shaft.fh;
    // Strict slab proximity rejects a floating/jumping character. Rendering
    // during a stationary elevator door opening is fine: no furniture loaded.
    if(Math.abs(playerFeet-support)<.60)occupied=near;
   }
   officeTrial.setOccupiedFloor(occupied);
   cafeFloor3.update(person,traveling);
  },
  isNearFinch:p=>finchProximity005(p,finchPosition,loaded),
   setTalking(active:boolean){speakingRequested=active;switchFinchClip();},
  getFinchLocation:()=>({...finchPosition}),
  dispose(){
   disposed=true;loaded=false;groups.forEach(g=>g.dispose());idleClip=null;talkingClip=null;
   cafeFloor3.dispose();
   officeTrial.dispose();
   finchRoot?.dispose(false,true);
   finchMeshes.forEach(m=>m.dispose());

  },
 };
}
