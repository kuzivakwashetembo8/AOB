/** CHAR-127: authored UAL Jump_Loop on Voight's own linked joint transforms.
 * Rapier governs root motion, support, gravity, and takeoff. This animation
 * only changes skinned joints and never moves the physics capsule or mesh root.
 */
import {Quaternion} from "@babylonjs/core";
import type {Skeleton,TransformNode} from "@babylonjs/core";
import {rotationOf} from "./driver-joint-space";

export const JUMP_CLIP_PATH_127="/GLBs/Characters/char127-ual-jump.json";
const JOINTS=[
 "Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase",
 "RightUpLeg","RightLeg","RightFoot","RightToeBase",
] as const;

export type JumpClip127={
 schema:"gtd.char127.ual-jump.v1";
 source:string;target:"character.glb";duration:number;sampleCount:number;
 frameBasis:number[];
 tracks:{node:string;source:string;peakRadians:number;keys:number[][]}[];
};
export type JumpSignal127=Readonly<{grounded:boolean;verticalVelocity:number;dt:number}>;
export type JumpReport127=Readonly<{
 status:"ready"|"disposed";airborne:boolean;landing:boolean;weight:number;
 sample:number;frames:number;joints:number;
}>;
export type JumpPlayer127={
 update(signal:JumpSignal127):void;
 reset():void;
 dispose():void;
 readonly report:JumpReport127;
};

const clamp01=(n:number)=>Math.max(0,Math.min(1,n));
export const jumpPhaseFromVelocity127=(verticalVelocity:number,launchSpeed=5.4):number=>{
 if(!Number.isFinite(verticalVelocity)||!Number.isFinite(launchSpeed)||launchSpeed<=0)return .5;
 return clamp01((launchSpeed-verticalVelocity)/(2*launchSpeed));
};

export function validateJumpClip127(value:unknown):JumpClip127{
 const v=value as Partial<JumpClip127>|null;
 if(!v||v.schema!=="gtd.char127.ual-jump.v1"||v.target!=="character.glb"||
  !(typeof v.duration==="number"&&v.duration>.1&&v.duration<10)||
  !Number.isInteger(v.sampleCount)||v.sampleCount!<3||v.sampleCount!>200||
  !Array.isArray(v.tracks)||v.tracks.length!==JOINTS.length||
  !Array.isArray(v.frameBasis)||v.frameBasis.length!==4||
  v.frameBasis.some(n=>!Number.isFinite(n)))
  throw Error("CHAR-127 invalid authored UAL jump contract");
 const seen=new Set<string>();
 for(const track of v.tracks){
  if(!track||!JOINTS.includes(track.node as typeof JOINTS[number])||seen.has(track.node)||
    typeof track.source!=="string"||!Number.isFinite(track.peakRadians)||
    !Array.isArray(track.keys)||track.keys.length!==v.sampleCount)
    throw Error("CHAR-127 missing or invalid joint track");
  seen.add(track.node);
  for(const key of track.keys){
   if(!Array.isArray(key)||key.length!==4||key.some(n=>!Number.isFinite(n))||
    Math.abs(key.reduce((sum,n)=>sum+n*n,0)-1)>.025)
    throw Error("CHAR-127 non-unit joint rotation "+track.node);
  }
 }
 for(const j of ["LeftUpLeg","LeftLeg","RightUpLeg","RightLeg"])
  if((v.tracks.find(t=>t.node===j)?.peakRadians??0)<.075)
   throw Error("CHAR-127 authored jump lacks knee/hip movement: "+j);
 return v as JumpClip127;
}

export async function fetchJumpClip127(fetcher:typeof fetch=fetch):Promise<JumpClip127>{
 const response=await fetcher(JUMP_CLIP_PATH_127);
 if(!response.ok)throw Error("CHAR-127 UAL jump missing HTTP "+response.status);
 return validateJumpClip127(await response.json());
}
type JointTrack={node:TransformNode;base:Quaternion;keys:Quaternion[]};
export function createJumpPlayer127(skeletons:readonly Skeleton[],raw:JumpClip127):JumpPlayer127{
 const clip=validateJumpClip127(raw);
 const linked=new Map<string,TransformNode>();
 for(const skel of skeletons)for(const bone of skel.bones){
  const node=bone.getTransformNode();
  if(node){
   if(linked.has(bone.name)&&linked.get(bone.name)!==node)
    throw Error("CHAR-127 ambiguous linked bone "+bone.name);
   linked.set(bone.name,node);
  }
 }
 const tracks:JointTrack[]=clip.tracks.map(t=>{
  const node=linked.get(t.node);
  if(!node||node.isDisposed())throw Error("CHAR-127 missing linked joint "+t.node);
  return {node,base:rotationOf(node).clone(),
   keys:t.keys.map(q=>new Quaternion(q[0]!,q[1]!,q[2]!,q[3]!).normalize())};
 });
 let weight=0,wasAirborne=false,landingRemaining=0,cursor=0,frames=0,disposed=false;
 const LANDING_FADE=.20;
 function sample(keys:readonly Quaternion[],position:number):Quaternion{
  const frame=clamp01(position)*(clip.sampleCount-1);
  const lower=Math.min(clip.sampleCount-2,Math.floor(frame));
  return Quaternion.Slerp(keys[lower]!,keys[lower+1]!,frame-lower).normalize();
 }
 return {
  get report():JumpReport127{
   return {status:disposed?"disposed":"ready",airborne:wasAirborne,
    landing:landingRemaining>0,weight,sample:cursor,frames,joints:tracks.length};
  },
  update(signal){
   if(disposed||!Number.isFinite(signal.dt)||signal.dt<=0||!Number.isFinite(signal.verticalVelocity))return;
   const step=Math.min(.05,signal.dt),airborne=!signal.grounded;
   if(airborne){
    landingRemaining=0;
    weight=clamp01(weight+step/.10);
    // The launch-to-landing ballistic phase is driven by ACTUAL Rapier
    // vertical speed. No synthetic visual root shift or timer-driven gravity.
    cursor=.05+.90*jumpPhaseFromVelocity127(signal.verticalVelocity);
   }else if(wasAirborne){
    landingRemaining=LANDING_FADE;
    // Hold source recovery at impact; fade back to the current gait/idle
    // rather than stamping an authored flying pose on grounded walking.
    cursor=.98;
   }
   if(!airborne){
    if(landingRemaining>0){
     landingRemaining=Math.max(0,landingRemaining-step);
     weight=clamp01(landingRemaining/LANDING_FADE);
    }else weight=0;
   }
   wasAirborne=airborne;
   if(weight<.00001)return;
   // Called AFTER walk/sprint pose. It overlays the authored jump without
   // editing CHAR-110/120 source tracks and naturally returns their pose.
   for(const track of tracks){
    if(track.node.isDisposed())continue;
    const baseline=rotationOf(track.node).clone();
    const target=sample(track.keys,cursor).multiply(track.base).normalize();
    track.node.rotationQuaternion=Quaternion.Slerp(baseline,target,weight).normalize();
   }
   frames++;
  },
  reset(){weight=0;wasAirborne=false;landingRemaining=0;cursor=0;},
  dispose(){disposed=true;weight=0;wasAirborne=false;landingRemaining=0;tracks.length=0;},
 };
}
