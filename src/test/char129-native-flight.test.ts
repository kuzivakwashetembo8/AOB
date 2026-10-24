// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3} from "@babylonjs/core";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
 captureNativeFlightGeometry129,createNativeFlightPlayer129,
 nativeFlightPitch129,NATIVE_FLIGHT_MAX_PITCH_129,
 FLY_IDLE_CYCLE_SECONDS_129,FLY_IDLE_VERTICAL_AMPLITUDE_129,
 FLY_IDLE_FORWARD_AMPLITUDE_129,
} from "../game/character/native-flight-129";
import type {FlightPoseInput} from "../game/character/locomotion/flight-pose";

const staticPose:FlightPoseInput={
 forward:false,backward:false,left:false,right:false,
 ascending:false,descending:false,accelerated:false,
};
const joints=[
 "Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase",
 "RightUpLeg","RightLeg","RightFoot","RightToeBase",
] as const;
function rig(){
 const engine=new NullEngine(),scene=new Scene(engine);
 const anchor=new TransformNode("rapier-foot-anchor",scene);
 anchor.rotation.y=.71;
 anchor.position.set(13,4,7);
 const pivot=new TransformNode("visual-waist-pivot",scene);
 pivot.parent=anchor;pivot.position.y=.95;
 const offset=new TransformNode("visual-waist-offset",scene);
 offset.parent=pivot;offset.position.y=-.95;
 const boneSkel=new Skeleton("voight-native","voight-native",scene);
 const names=new Map<string,TransformNode>();
 const bones=new Map<string,Bone>();
 const parents:Record<string,string|undefined>={
  Hips:undefined,Spine:"Hips",Spine1:"Spine",Spine2:"Spine1",
  Neck:"Spine2",Head:"Neck",
  LeftShoulder:"Spine2",LeftArm:"LeftShoulder",
  LeftForeArm:"LeftArm",LeftHand:"LeftForeArm",
  RightShoulder:"Spine2",RightArm:"RightShoulder",
  RightForeArm:"RightArm",RightHand:"RightForeArm",
  LeftUpLeg:"Hips",LeftLeg:"LeftUpLeg",
  LeftFoot:"LeftLeg",LeftToeBase:"LeftFoot",
  RightUpLeg:"Hips",RightLeg:"RightUpLeg",
  RightFoot:"RightLeg",RightToeBase:"RightFoot",
 };
 const offsets:Record<string,Vector3>={
  Hips:new Vector3(0,.98,0),Spine:new Vector3(0,.19,0),
  Spine1:new Vector3(0,.19,0),Spine2:new Vector3(0,.19,0),
  Neck:new Vector3(0,.12,0),Head:new Vector3(0,.17,0),
  LeftShoulder:new Vector3(-.20,.07,0),
  LeftArm:new Vector3(-.08,0,0),LeftForeArm:new Vector3(-.02,-.25,0),
  LeftHand:new Vector3(-.01,-.25,0),
  RightShoulder:new Vector3(.20,.07,0),
  RightArm:new Vector3(.08,0,0),RightForeArm:new Vector3(.02,-.25,0),
  RightHand:new Vector3(.01,-.25,0),
  LeftUpLeg:new Vector3(-.15,-.05,0),
  LeftLeg:new Vector3(0,-.38,0),
  LeftFoot:new Vector3(0,-.38,0),
  LeftToeBase:new Vector3(0,-.03,.10),
  RightUpLeg:new Vector3(.15,-.05,0),
  RightLeg:new Vector3(0,-.38,0),
  RightFoot:new Vector3(0,-.38,0),
  RightToeBase:new Vector3(0,-.03,.10),
 };
 for(const name of joints){
  const ancestor=parents[name];
  const bone=new Bone(name,boneSkel,ancestor?bones.get(ancestor):null,Matrix.Identity());
  const node=new TransformNode(name,scene);
  node.parent=ancestor?names.get(ancestor)!:offset;
  node.position=offsets[name]!.clone();
  // Preserved natural baseline is deliberately nonidentity, unlike a T-pose.
  node.rotationQuaternion=Quaternion.RotationAxis(
   Vector3.Forward(),name==="LeftArm"?-.08:name==="RightArm"?.08:0);
  bone.linkTransformNode(node);
  bones.set(name,bone);names.set(name,node);
 }
 return {scene,engine,boneSkel,anchor,pivot,offset,names,
  dispose(){scene.dispose();engine.dispose();}};
}
describe("CHAR-129 native flight, negative-schema protection",()=>{
 it("uses existing intent selection while the Voight skeleton retains native geometry",()=>{
  expect(nativeFlightPitch129(staticPose)).toBe(0);
  expect(nativeFlightPitch129({...staticPose,ascending:true,accelerated:true})).toBe(0);
  expect(nativeFlightPitch129({...staticPose,forward:true})).toBe(0);
  expect(nativeFlightPitch129({...staticPose,left:true})).toBe(0);
  expect(nativeFlightPitch129({...staticPose,forward:true,accelerated:true}))
   .toBe(NATIVE_FLIGHT_MAX_PITCH_129);
 });
 it("preserves the accepted nonidentity arm/leg chain while translating, turning and hovering",()=>{
  const r=rig();
  try{
   const before=captureNativeFlightGeometry129(r.names,r.anchor);
   expect(before.leftAnkleLane).toBeLessThan(0);
   expect(before.rightAnkleLane).toBeGreaterThan(0);
   const rotations=new Map([...r.names].map(([key,node])=>[key,node.rotationQuaternion!.clone()]));
   const player=createNativeFlightPlayer129([r.boneSkel],r.anchor,r.pivot);
   player.enter();
   for(let i=0;i<60;i++){
    r.anchor.position.x+=.05;r.anchor.rotation.y+=.005;
    player.update({...staticPose,left:true,ascending:true,dt:1/60});
   }
   const after=captureNativeFlightGeometry129(r.names,r.anchor);
   expect(after.leftAnkleLane).toBeCloseTo(before.leftAnkleLane,5);
   expect(after.rightAnkleLane).toBeCloseTo(before.rightAnkleLane,5);
   expect(after.wristSeparation).toBeCloseTo(before.wristSeparation,5);
   for(const [key,base] of rotations)
    expect(Math.abs(Quaternion.Dot(base,r.names.get(key)!.rotationQuaternion!))).toBeCloseTo(1,6);
   expect(player.report.mode).toBe("hover");
   expect(player.report.pitchRadians).toBe(0);
   player.leave();
   expect(player.report.mode).toBe("standing");
   player.dispose();
  }finally{r.dispose();}
 });
 it("uses a visual-only torso pitch for fast flight, returning to exactly the accepted pose",()=>{
  const r=rig();
  try{
   const player=createNativeFlightPlayer129([r.boneSkel],r.anchor,r.pivot);
   const baseline=captureNativeFlightGeometry129(r.names,r.anchor);
   const rotations=new Map([...r.names].map(([key,node])=>[key,node.rotationQuaternion!.clone()]));
   player.enter();
   for(let i=0;i<35;i++)player.update({...staticPose,forward:true,accelerated:true,dt:1/60});
   expect(player.report.mode).toBe("fast");
   expect(player.report.pitchRadians).toBeCloseTo(NATIVE_FLIGHT_MAX_PITCH_129,4);
   expect(r.anchor.rotation.x).toBe(0); // never rotate physics
   for(const [key,base] of rotations)
    expect(Math.abs(Quaternion.Dot(base,r.names.get(key)!.rotationQuaternion!))).toBeCloseTo(1,6);
   for(let i=0;i<35;i++)player.update({...staticPose,dt:1/60});
   expect(r.pivot.rotation.x).toBeCloseTo(0,6);
   // flyIdle is now intentionally different from standing; leaving flight
   // must still reconstruct the saved neutral pose without drift.
   player.leave();
   const after=captureNativeFlightGeometry129(r.names,r.anchor);
   expect(after.leftAnkleLane).toBeCloseTo(baseline.leftAnkleLane,5);
   expect(after.rightAnkleLane).toBeCloseTo(baseline.rightAnkleLane,5);
   expect(after.leftWristLane).toBeCloseTo(baseline.leftWristLane,5);
   expect(after.rightWristLane).toBeCloseTo(baseline.rightWristLane,5);
   for(let i=0;i<30;i++){player.leave();player.enter();player.update({...staticPose,dt:1/60});}
   expect(player.report.worstNeutralDeviationRadians).toBeLessThan(.5);
   player.dispose();
  }finally{r.dispose();}
 });
 it("flyIdle subtly opens both native arms and relaxes one leg without crossing",()=>{
  const r=rig();
  try{
   const rest=captureNativeFlightGeometry129(r.names,r.anchor);
   const base=new Map([...r.names].map(([k,v])=>[k,v.rotationQuaternion!.clone()]));
   const player=createNativeFlightPlayer129([r.boneSkel],r.anchor,r.pivot);
   player.enter();
   expect(player.report.idleCalibrated).toBe(true);
   expect(player.report.idleCalibrationIssue).toBe(null);
   expect(player.report.idleKneeFlexionGainDegrees).toBeGreaterThanOrEqual(10);
   expect(player.report.idleRightFootLiftFraction).toBeGreaterThan(.035);
   for(let i=0;i<18;i++)player.update({...staticPose,dt:1/60});
   const hover=captureNativeFlightGeometry129(r.names,r.anchor);
   expect(player.report.activeClip).toBe("flyIdle");
   expect(player.report.idleWeight).toBeCloseTo(1,4);
   expect(hover.leftWristLane).toBeLessThan(rest.leftWristLane);
   expect(hover.rightWristLane).toBeGreaterThan(rest.rightWristLane);
   expect(hover.leftAnkleLane).toBeLessThan(hover.rightAnkleLane);
   expect(hover.ankleSeparation).toBeGreaterThan(rest.ankleSeparation*.80);
   expect(Math.abs(Quaternion.Dot(r.names.get("RightUpLeg")!.rotationQuaternion!,
    base.get("RightUpLeg")!))).toBeLessThan(.999999);
   expect(Math.abs(Quaternion.Dot(r.names.get("RightLeg")!.rotationQuaternion!,
    base.get("RightLeg")!))).toBeLessThan(.999999);
   for(const name of ["Hips","Spine","Spine1","Spine2","LeftUpLeg","LeftLeg","LeftFoot",
    "RightFoot","LeftHand","RightHand","LeftForeArm","RightForeArm"])
    expect(Math.abs(Quaternion.Dot(r.names.get(name)!.rotationQuaternion!,base.get(name)!)))
     .toBeCloseTo(1,6);
   player.leave();
   expect(captureNativeFlightGeometry129(r.names,r.anchor)).toEqual(rest);
   expect(r.pivot.position.y).toBeCloseTo(.95,6);
   expect(r.pivot.position.z).toBeCloseTo(0,6);
  }finally{r.dispose();}
 });
 it("flyIdle repeats a subcentimetric two-second float, without moving the physics anchor",()=>{
  const r=rig();
  try{
   const player=createNativeFlightPlayer129([r.boneSkel],r.anchor,r.pivot);
   const physicsStart=r.anchor.position.clone();
   expect(FLY_IDLE_CYCLE_SECONDS_129).toBe(2);
   expect(FLY_IDLE_VERTICAL_AMPLITUDE_129).toBeCloseTo(.012*1.085,8);
   expect(FLY_IDLE_FORWARD_AMPLITUDE_129).toBeCloseTo(.007*1.085,8);
   player.enter();
   const samples:number[]=[];
   const forward:number[]=[];
   for(let i=0;i<360;i++){
    player.update({...staticPose,dt:1/60});
    samples.push(player.report.microVertical);
    forward.push(player.report.microForward);
    expect(Math.abs(player.report.microVertical)).toBeLessThanOrEqual(
     FLY_IDLE_VERTICAL_AMPLITUDE_129+1e-8);
    expect(Math.abs(player.report.microForward)).toBeLessThanOrEqual(
     FLY_IDLE_FORWARD_AMPLITUDE_129+1e-8);
   }
   expect(Vector3.Distance(r.anchor.position,physicsStart)).toBe(0);
   expect(samples[90]).toBeCloseTo(samples[210]!,5);
   expect(samples[210]).toBeCloseTo(samples[330]!,5);
   expect(Math.max(...samples)-Math.min(...samples)).toBeGreaterThan(.015);
   expect(forward[90]).toBeCloseTo(forward[210]!,5);
   for(let i=0;i<16;i++)player.update({...staticPose,left:true,dt:1/60});
   expect(player.report.idleWeight).toBeCloseTo(0,5);
   expect(player.report.microVertical).toBeCloseTo(0,6);
   expect(player.report.microForward).toBeCloseTo(0,6);
   player.leave();player.dispose();
  }finally{r.dispose();}
 });
 it("repeated native hover exit does not accumulate wrist twist or hip rotation",()=>{
  const r=rig();
  try{
   const start=captureNativeFlightGeometry129(r.names,r.anchor);
   const q=new Map([...r.names].map(([k,v])=>[k,v.rotationQuaternion!.clone()]));
   const player=createNativeFlightPlayer129([r.boneSkel],r.anchor,r.pivot);
   for(let cycle=0;cycle<80;cycle++){
    player.enter();
    for(let i=0;i<18;i++)player.update({...staticPose,dt:1/60});
    player.leave();
   }
   expect(captureNativeFlightGeometry129(r.names,r.anchor)).toEqual(start);
   for(const [key,base] of q)
    expect(Math.abs(Quaternion.Dot(base,r.names.get(key)!.rotationQuaternion!)))
     .toBeCloseTo(1,6);
  }finally{r.dispose();}
 });
 it("fails closed on crossed linked-native legs instead of trusting fake local quaternion tests",()=>{
  const r=rig();
  try{
   r.names.get("RightUpLeg")!.position.x=-.30;
   expect(()=>captureNativeFlightGeometry129(r.names,r.anchor)).toThrow(/baseline|lanes/);
  }finally{r.dispose();}
 });
 it("preserves the real owner GLB rig as the sole target and no CHAR-128 runtime source",()=>{
  const path=resolve(process.cwd(),"public/GLBs/Characters/character.glb");
  const blob=readFileSync(path);
  const jsonSize=blob.readUInt32LE(12);
  const gltf=JSON.parse(blob.toString("utf8",20,20+jsonSize));
  const actual=new Set(gltf.nodes.map((n:{name?:string})=>n.name));
  for(const name of joints)expect(actual.has(name)).toBe(true);
  expect((gltf.skins??[]).flatMap((skin:{joints:number[]})=>skin.joints).length).toBeGreaterThan(60);
  const runtime=readFileSync(resolve(process.cwd(),"src/game/core/gtd-runtime.ts"),"utf8");
  const native=readFileSync(resolve(process.cwd(),"src/game/world/mercer-static-character-103.ts"),"utf8");
  expect(runtime).toContain("this.humanAsset()?.updateControlledFlight");
  expect(native).toContain("createNativeFlightPlayer129");
  expect(native).not.toContain("createFlightPlayer128");
  expect(runtime).not.toContain("CHAR-105 is walking-only; switch back for flight");
 });
});
