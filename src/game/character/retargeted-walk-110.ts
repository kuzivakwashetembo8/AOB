/** CHAR-110B — owned-skeleton runtime playback of offline retargeted UAL Walk_Loop.
 * No UAL asset at runtime, no Three.js mixer, no mesh-space deformation.
 * The base pose is captured AFTER accepted CHAR-109 arm relaxation.
 * Babylon linked TransformNodes, not Bone.rotate, are authoritative.
 */
import {Quaternion,TransformNode} from "@babylonjs/core";
import type {Skeleton} from "@babylonjs/core";
import {rotationOf} from "./driver-joint-space";

export type WalkClip110={
 schema:"gtd.char110.ual-walk.v1";
 duration:number;sampleCount:number;walkTargetMps:number;frameBasis:number[];
 tracks:{node:string;source:string;peakRadians:number;keys:number[][]}[];
};
export type WalkReport110={status:"retargeted-ual-walk"|"rejected";reason:string|null;active:boolean;
 jointCount:number;frames:number;armSwing:boolean;cycleSeconds:number};
export type WalkPlayer110={
 readonly report:WalkReport110;
 update(speedMps:number,dt:number):void;reset():void;dispose():void;
};
export const RETARGET_WALK_PATH_110="/GLBs/Characters/char110-ual-walk.json";
const targetNames=["Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase",
 "RightUpLeg","RightLeg","RightFoot","RightToeBase"] as const;
export function validateWalkClip110(value:unknown):WalkClip110{
 const v=value as Partial<WalkClip110>|null;
 if(!v||v.schema!=="gtd.char110.ual-walk.v1"||
 !Number.isFinite(v.duration)||!(v.duration!>.35&&v.duration!<5)||
 v.sampleCount!==41||v.walkTargetMps!==1.5||
 !Array.isArray(v.tracks)||v.tracks.length!==targetNames.length)throw Error("Invalid CHAR-110 walk clip header");
 const seen=new Set<string>();
 for(const track of v.tracks){
  if(!track||!targetNames.includes(track.node as typeof targetNames[number])||seen.has(track.node)||
  !Array.isArray(track.keys)||track.keys.length!==v.sampleCount||!Number.isFinite(track.peakRadians)||
  track.peakRadians<0||track.peakRadians>2.8)throw Error("Invalid CHAR-110 track "+track?.node);
  seen.add(track.node);
  for(const k of track.keys){
   if(!Array.isArray(k)||k.length!==4||k.some(x=>!Number.isFinite(x))||
    Math.abs(k.reduce((sum,x)=>sum+x*x,0)-1)>.008)throw Error("Invalid CHAR-110 quaternion for "+track.node);
  }
 }
 if(targetNames.some(n=>!seen.has(n)))throw Error("Missing mandatory CHAR-110 tracks");
 const arms=v.tracks.filter(t=>t.node==="LeftArm"||t.node==="RightArm");
 if(arms.some(t=>t.peakRadians<.025))throw Error("UAL arm swing missing — do not leave arms locked to idle");
 return v as WalkClip110;
}
export async function fetchWalkClip110(fetcher:typeof fetch=fetch):Promise<WalkClip110>{
 const response=await fetcher(RETARGET_WALK_PATH_110);
 if(!response.ok)throw Error("CHAR-110 retargeted walk unavailable: HTTP "+response.status);
 return validateWalkClip110(await response.json());
}
type Track={node:TransformNode;base:Quaternion;keys:Quaternion[];name:string};
export function createWalkPlayer110(skeletons:readonly Skeleton[],clip:WalkClip110):WalkPlayer110{
 const parsed=validateWalkClip110(clip);
 const tracks:Track[]=[];
 const names=new Map<string,TransformNode>();
 for(const skel of skeletons)for(const bone of skel.bones){
  const node=bone.getTransformNode();
  if(!node)continue;
  if(names.has(bone.name)&&names.get(bone.name)!==node)
   throw Error("Ambiguous duplicate named CHAR-110 bone "+bone.name);
  names.set(bone.name,node);
 }
 for(const track of parsed.tracks){
  const node=names.get(track.node);
  if(!node||node.isDisposed())throw Error("Unlinked target joint "+track.node);
  tracks.push({node,name:track.node,base:rotationOf(node),keys:track.keys.map(q=>
   new Quaternion(q[0]!,q[1]!,q[2]!,q[3]!).normalize())});
 }
 if(tracks.length!==targetNames.length)throw Error("Incomplete retargeted anatomy");
 let elapsed=0,weight=0,frames=0,disposed=false;
 function restore(){
  for(const track of tracks)if(!track.node.isDisposed())
   track.node.rotationQuaternion=track.base.clone();
 }
 return {
  get report(){return {status:disposed?"rejected":"retargeted-ual-walk",
   reason:disposed?"disposed":null,active:weight>.01,jointCount:tracks.length,frames,
   armSwing:true,cycleSeconds:parsed.duration};},
  update(speedMps,dt){
   if(disposed||!Number.isFinite(dt)||dt<=0||!Number.isFinite(speedMps))return;
   const step=Math.min(dt,.05),speed=Math.max(0,speedMps);
   const moving=speed>.12;
   weight=Math.max(0,Math.min(1,weight+(moving?1:-1)*step/.20));
   if(moving)elapsed=(elapsed+step*Math.max(.35,Math.min(1.35,speed/parsed.walkTargetMps)))%parsed.duration;
   if(weight<=.00001){restore();return}
   const cursor=elapsed/parsed.duration*(parsed.sampleCount-1);
   const a=Math.min(parsed.sampleCount-2,Math.floor(cursor));
   const alpha=Math.max(0,Math.min(1,cursor-a));
   for(const track of tracks){
    if(track.node.isDisposed())continue;
    const delta=Quaternion.Slerp(track.keys[a]!,track.keys[a+1]!,alpha).normalize();
    const movingPose=delta.multiply(track.base).normalize();
    track.node.rotationQuaternion=Quaternion.Slerp(track.base,movingPose,weight).normalize();
   }
   frames++;
  },
  reset(){elapsed=0;weight=0;restore();},
  dispose(){restore();disposed=true;tracks.length=0;}
 };
}
