// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3} from "@babylonjs/core";
import {createWalkPlayer110,validateWalkClip110,type WalkClip110} from "../game/character/retargeted-walk-110";
const names=["Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand","RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase","RightUpLeg","RightLeg","RightFoot","RightToeBase"];
function fixture():WalkClip110{
 return {schema:"gtd.char110.ual-walk.v1",duration:1.333333,sampleCount:41,walkTargetMps:1.5,frameBasis:[0,0,0,1],
 tracks:names.map(name=>({node:name,source:"UAL:"+name,peakRadians:.4,keys:Array.from({length:41},(_,i)=>{
  const sign=name.startsWith("Left")?1:-1;
  const q=Quaternion.RotationAxis(Vector3.Right(),.3*Math.sin(i/40*Math.PI*2)*sign);
  return [q.x,q.y,q.z,q.w];
 })}))};
}
describe("CHAR-110 authored-clip retarget playback",()=>{
 it("rejects incomplete clip maps, invalid quaternions and locked-arm data",()=>{
  const v=fixture();expect(validateWalkClip110(v).tracks).toHaveLength(22);
  expect(()=>validateWalkClip110({...v,tracks:v.tracks.slice(1)})).toThrow();
  expect(()=>validateWalkClip110({...v,tracks:v.tracks.map((t,i)=>i===0?{...t,keys:t.keys.map(()=>[0,0,0,0])}:t)})).toThrow();
  expect(()=>validateWalkClip110({...v,tracks:v.tracks.map(t=>t.node==="LeftArm"?{...t,peakRadians:0}:t)})).toThrow();
 });
 it("animates skinned-linked named nodes, counter-swinging arms, and restores accepted rest",()=>{
  const engine=new NullEngine();const scene=new Scene(engine);
  try{
   const sk=new Skeleton("actor","actor",scene);
   const linked=new Map<string,TransformNode>();
   for(const name of names){
    const bone=new Bone(name,sk,null,Matrix.Identity());
    const node=new TransformNode(name,scene);node.rotationQuaternion=Quaternion.Identity();
    bone.linkTransformNode(node);linked.set(name,node);
   }
   const player=createWalkPlayer110([sk],fixture());
   expect(player.report.jointCount).toBe(22);
   player.update(1.5,1/30);player.update(1.5,1/30);
   expect(player.report.status).toBe("retargeted-ual-walk");
   const left=linked.get("LeftArm")!.rotationQuaternion!;
   const right=linked.get("RightArm")!.rotationQuaternion!;
   expect(left.x*right.x).toBeLessThan(0);
   expect(Math.abs(left.x)).toBeGreaterThan(.001);
   player.reset();
   expect(Math.abs(linked.get("LeftArm")!.rotationQuaternion!.x)).toBeLessThan(.00001);
   player.dispose();
  }finally{scene.dispose();engine.dispose()}
 });
});
