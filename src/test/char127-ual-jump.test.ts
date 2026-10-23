// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3} from "@babylonjs/core";
import {createJumpPlayer127,jumpPhaseFromVelocity127,validateJumpClip127,type JumpClip127} from "../game/character/retargeted-jump-127";

const names=[
 "Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand","RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase","RightUpLeg","RightLeg","RightFoot","RightToeBase"
];
function sourceClip():JumpClip127{
 return {schema:"gtd.char127.ual-jump.v1",target:"character.glb",
  source:"pinned UAL Jump_Loop",duration:.8,sampleCount:5,frameBasis:[0,0,0,1],
  tracks:names.map(node=>({node,source:node,peakRadians:.32,
   keys:Array.from({length:5},(_,i)=>{
    const angle=Math.sin(i/4*Math.PI)*.32;
    return Quaternion.RotationAxis(Vector3.Right(),angle).asArray();
   })}))};
}
function rig(){
 const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton("char127","char127",scene);
 const nodes=new Map<string,TransformNode>();
 for(const name of names){
  const bone=new Bone(name,sk,null,Matrix.Identity());
  const node=new TransformNode(name,scene);node.rotationQuaternion=Quaternion.Identity();
  bone.linkTransformNode(node);nodes.set(name,node);
 }
 return {sk,nodes,dispose(){scene.dispose();engine.dispose()}};
}
describe("CHAR-127 authored UAL jump first pass",()=>{
 it("refuses spoofed or missing jump anatomy",()=>{
  const clip=sourceClip();
  expect(validateJumpClip127(clip).tracks).toHaveLength(22);
  expect(()=>validateJumpClip127({...clip,tracks:clip.tracks.slice(1)})).toThrow();
  expect(()=>validateJumpClip127({...clip,tracks:clip.tracks.map(t=>
   t.node==="RightLeg"?{...t,peakRadians:0}:t)})).toThrow();
  expect(()=>validateJumpClip127({...clip,tracks:clip.tracks.map((t,i)=>
   i===0?{...t,keys:[[0,0,0,0],...t.keys.slice(1)]}:t)})).toThrow();
 });
 it("follows Rapier vertical speed through launch, apex and descent",()=>{
  expect(jumpPhaseFromVelocity127(5.4)).toBeCloseTo(0);
  expect(jumpPhaseFromVelocity127(0)).toBeCloseTo(.5);
  expect(jumpPhaseFromVelocity127(-5.4)).toBeCloseTo(1);
 });
 it("overlays airborne UAL pose then yields to accepted walking/neutral after landing",()=>{
  const r=rig();
  try{
   const player=createJumpPlayer127([r.sk],sourceClip());
   player.update({grounded:true,verticalVelocity:0,dt:1/60});
   expect(player.report.weight).toBe(0);
   for(let i=0;i<8;i++)player.update({grounded:false,verticalVelocity:1,dt:1/60});
   expect(player.report.airborne).toBe(true);
   expect(player.report.weight).toBeCloseTo(1);
   expect(Math.abs(r.nodes.get("LeftLeg")!.rotationQuaternion!.x)).toBeGreaterThan(.01);
   for(let i=0;i<17;i++)player.update({grounded:true,verticalVelocity:0,dt:1/60});
   expect(player.report.weight).toBe(0);
   // Jump leaves the base gait untouched as soon as its landing fade ends.
   r.nodes.get("LeftLeg")!.rotationQuaternion=Quaternion.Identity();
   player.update({grounded:true,verticalVelocity:0,dt:1/60});
   expect(r.nodes.get("LeftLeg")!.rotationQuaternion!.equalsWithEpsilon(Quaternion.Identity(),1e-6)).toBe(true);
   player.reset();expect(player.report.airborne).toBe(false);
   player.dispose();expect(player.report.status).toBe("disposed");
  }finally{r.dispose();}
 });
});
