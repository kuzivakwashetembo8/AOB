// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3} from "@babylonjs/core";
import {createWalkPlayer110,type WalkClip110} from "../game/character/retargeted-walk-110";
import {HUMAN_SPRINT_SPEED_120,stepHumanTravelSpeed120,validateSprintClip120,type SprintClip120}
 from "../game/character/retargeted-sprint-120";

const names=["Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand","RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase","RightUpLeg","RightLeg","RightFoot","RightToeBase"];
function clips():{walk:WalkClip110;sprint:SprintClip120}{
 const makeTracks=(amplitude:number)=>names.map(name=>({
  node:name,source:name,peakRadians:amplitude,
  keys:Array.from({length:41},(_,i)=>{
   const angle=amplitude*Math.sin(i/40*2*Math.PI)*(name.startsWith("Left")?1:-1);
   const q=Quaternion.RotationAxis(Vector3.Right(),angle);
   return q.asArray();
  })
 }));
 return {
  walk:{schema:"gtd.char110.ual-walk.v1",duration:1.333333,sampleCount:41,
   walkTargetMps:1.5,frameBasis:[0,0,0,1],tracks:makeTracks(.15)},
  sprint:{schema:"gtd.char120.ual-sprint.v1",duration:.7,sampleCount:41,
   runTargetMps:4,frameBasis:[0,0,0,1],tracks:makeTracks(.65)}
 };
}
function rig(){
 const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton("char120","char120",scene);
 const bones=new Map<string,TransformNode>();
 for(const name of names){
  const bone=new Bone(name,sk,null,Matrix.Identity());
  const node=new TransformNode(name,scene);node.rotationQuaternion=Quaternion.Identity();
  bone.linkTransformNode(node);bones.set(name,node);
 }
 return {sk,bones,dispose(){scene.dispose();engine.dispose();}};
}
describe("CHAR-120 authored natural athletic sprint",()=>{
 it("hard-rejects missing running joints, fake stationary legs, broken loop or malformed quaternion",()=>{
  const {sprint}=clips();expect(validateSprintClip120(sprint).tracks).toHaveLength(22);
  expect(()=>validateSprintClip120({...sprint,tracks:sprint.tracks.slice(1)})).toThrow();
  expect(()=>validateSprintClip120({...sprint,tracks:sprint.tracks.map(t=>t.node==="LeftUpLeg"?{...t,peakRadians:0}:t)})).toThrow();
  expect(()=>validateSprintClip120({...sprint,tracks:sprint.tracks.map((t,i)=>i===0?{...t,keys:t.keys.map(()=>[1,0,0,0])}:t)})).toThrow();
  expect(()=>validateSprintClip120({...sprint,tracks:sprint.tracks.map((t,i)=>i===0?{...t,keys:t.keys.map((q,j)=>j===40?[0,1,0,0]:q)}:t)})).toThrow();
 });
 it("ramps actual movement separately from clip selection and exactly restores accepted walk",()=>{
  let speed=1.65;
  for(let i=0;i<21;i++)speed=stepHumanTravelSpeed120(speed,true,1/60);
  expect(speed).toBeCloseTo(HUMAN_SPRINT_SPEED_120,5);
  for(let i=0;i<18;i++)speed=stepHumanTravelSpeed120(speed,false,1/60);
  expect(speed).toBeCloseTo(1.65,5);
  expect(stepHumanTravelSpeed120(1.65,false,1/60)).toBe(1.65);
  expect(stepHumanTravelSpeed120(3.0,true,0)).toBe(3.0);
 });
 it("runs a separate articulated clip, crossfades on Shift release, restores the exact neutral",()=>{
  const r=rig(),{walk,sprint}=clips();
  try{
   const player=createWalkPlayer110([r.sk],walk,[],sprint);
   for(let i=0;i<32;i++)player.update(4,1/60,true);
   expect(player.report.sprintActive).toBe(true);
   const sprintArm=r.bones.get("RightArm")!.rotationQuaternion!.clone();
   expect(Math.abs(sprintArm.x)).toBeGreaterThan(.01);
   for(let i=0;i<18;i++)player.update(1.65,1/60,false);
   expect(player.report.sprintActive).toBe(false);
   expect(player.report.sprintWeight).toBeCloseTo(0,4);
   player.reset();
   for(const n of names)expect(r.bones.get(n)!.rotationQuaternion!.equalsWithEpsilon(Quaternion.Identity(),1e-5)).toBe(true);
   expect(player.report.sprintActive).toBe(false);
   player.dispose();
  }finally{r.dispose();}
 });
});
