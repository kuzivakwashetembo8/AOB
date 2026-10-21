/** CHAR-110B — owned-skeleton runtime playback of offline retargeted UAL Walk_Loop.
 * No UAL asset at runtime, no Three.js mixer, no mesh-space deformation.
 * The base pose is captured AFTER accepted CHAR-109 arm relaxation.
 * Babylon linked TransformNodes, not Bone.rotate, are authoritative.
 */
import {Quaternion,TransformNode,Vector3,Matrix} from "@babylonjs/core";
import type {Skeleton} from "@babylonjs/core";
import {rotationOf,parentSpaceAimDelta} from "./driver-joint-space";

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
 // CHAR-115: the target rig's bilateral joint frames are X reflections
 // (audited character.glb). Mirror the accepted right chain at half a cycle,
 // including the absolute neutral quaternion, rather than guessing Euler axes.
 const byName=new Map(tracks.map(t=>[t.name,t]));
 const mirror=(q:Quaternion)=>new Quaternion(q.x,-q.y,-q.z,q.w).normalize();
 const sample=(track:Track,cursor:number)=>{
  const wrapped=((cursor%(parsed.sampleCount-1))+(parsed.sampleCount-1))%(parsed.sampleCount-1);
  const a=Math.floor(wrapped);
  return Quaternion.Slerp(track.keys[a]!,track.keys[a+1]!,wrapped-a).normalize();
 };
 // Keep the full source tracks untouched: the previous amplitude remains
 // the running research reference. Walking removes the cycle's forward bias.
 const armCenters=new Map<string,Quaternion>();
 for(const track of tracks){
  if(!/^(Left|Right)(Arm|ForeArm|Shoulder)$/.test(track.name))continue;
  const ref=track.keys[0]!,sum=new Quaternion(0,0,0,0);
  for(const q of track.keys.slice(0,-1)){
   const sign=Quaternion.Dot(ref,q)<0?-1:1;
   sum.x+=q.x*sign;sum.y+=q.y*sign;sum.z+=q.z*sign;sum.w+=q.w*sign;
  }
  armCenters.set(track.name,sum.normalize());
 }
 function walkDelta(track:Track,cursor:number):Quaternion{
  const q=sample(track,cursor),center=armCenters.get(track.name);
  if(!center)return q;
  const gain=track.name.endsWith("Shoulder")?.55:track.name.endsWith("ForeArm")?.35:.42;
  return Quaternion.Slerp(Quaternion.Identity(),q.multiply(Quaternion.Inverse(center)).normalize(),gain).normalize();
 }
 const hips=names.get("Hips")!;
 const legSides=["Left","Right"] as const;
 function refineLegs(blend:number){
  hips.computeWorldMatrix(true);
  const hipWorld=hips.getWorldMatrix(),hipInverse=Matrix.Invert(hipWorld);
  const point=(node:TransformNode)=>{
   node.computeWorldMatrix(true);
   return Vector3.TransformCoordinates(node.getAbsolutePosition(),hipInverse);
  };
  for(const side of legSides){
   const upper=names.get(side+"UpLeg")!,knee=names.get(side+"Leg")!;
   const foot=names.get(side+"Foot")!,toe=names.get(side+"ToeBase")!;
   if(upper.parent!==hips||foot.parent!==knee||toe.parent!==foot)continue;
   const sign=Math.sign(upper.position.x);
   if(!sign)continue;
   const start=point(upper),ankle=point(foot);
   // Reduce only excessive lateral spread; never pull a foot across center.
   const excess=Math.max(0,ankle.x*sign-.10);
   const shift=Math.min(.035,excess*.5)*blend;
   if(shift>1e-6){
    const desired=ankle.clone();desired.x-=sign*shift;
    const from=Vector3.TransformNormal(ankle.subtract(start),hipWorld);
    const to=Vector3.TransformNormal(desired.subtract(start),hipWorld);
    const delta=parentSpaceAimDelta(from,to,hipWorld,.055);
    if(delta){
     const before=rotationOf(upper);
     upper.rotationQuaternion=delta.multiply(before).normalize();
     if([knee,foot,toe].some(node=>point(node).x*sign<.04)){
      upper.rotationQuaternion=before;upper.computeWorldMatrix(true);
     }
    }
   }
   const a=point(foot),b=point(toe),direction=b.subtract(a);
   const horizontal=Math.hypot(direction.x,direction.z);
   // Pitch/roll and toe lift remain authored. Heading is undefined during
   // near-vertical toe lift, so do not manufacture a yaw at those samples.
   if(horizontal<.045||direction.z<=.025)continue;
   const angle=Math.atan2(direction.x,direction.z);
   const desiredAngle=Math.max(-.10,Math.min(.10,angle));
   const yaw=(desiredAngle-angle)*blend;
   const desiredDirection=new Vector3(Math.sin(angle+yaw)*horizontal,0,Math.cos(angle+yaw)*horizontal);
   const horizontalWorld=Vector3.TransformNormal(new Vector3(direction.x,0,direction.z),hipWorld);
   const desiredWorld=Vector3.TransformNormal(desiredDirection,hipWorld);
   knee.computeWorldMatrix(true);
   const delta=parentSpaceAimDelta(horizontalWorld,desiredWorld,knee.getWorldMatrix(),.9);
   if(delta){
    const before=rotationOf(foot);
    foot.rotationQuaternion=delta.multiply(before).normalize();
    if(point(toe).x*sign<.04)foot.rotationQuaternion=before;
   }
  }
 }
 // CHAR-118: distribute a slight walking-only inclination through the back.
 // The arms inherit the torso motion with their accepted local pose unchanged.
 const back=[names.get("Spine")!,names.get("Spine1")!,names.get("Spine2")!];
 const backDegrees=[2,1.75,1.25];
 const supportedBack=back[0]!.parent===hips&&back[1]!.parent===back[0]&&back[2]!.parent===back[1];
 function inclineWalkingBack(blend:number){
  if(!supportedBack)return;
  hips.computeWorldMatrix(true);
  const up=Vector3.TransformNormal(Vector3.Up(),hips.getWorldMatrix()).normalize();
  const forward=Vector3.TransformNormal(Vector3.Forward(),hips.getWorldMatrix()).normalize();
  for(let i=0;i<back.length;i++){
   const node=back[i]!,parent=node.parent as TransformNode;
   parent.computeWorldMatrix(true);
   const angle=backDegrees[i]!*Math.PI/180*blend;
   if(angle<=1e-8)continue;
   const desired=up.scale(Math.cos(angle)).add(forward.scale(Math.sin(angle)));
   const delta=parentSpaceAimDelta(up,desired,parent.getWorldMatrix(),angle+1e-6);
   if(delta)node.rotationQuaternion=delta.multiply(rotationOf(node)).normalize();
  }
 }
 const head=byName.get("Head")!;
 const anchor=names.get("Hips")!.parent;
 // Local quaternion products stop at the actor's root: world yaw is retained,
 // while animated pelvis/spine/neck roll and pitch are counteracted.
 function relativeRotation(node:TransformNode|null):Quaternion{
  if(!node||node===anchor)return Quaternion.Identity();
  const parent=node.parent instanceof TransformNode?node.parent:null;
  return relativeRotation(parent).multiply(rotationOf(node)).normalize();
 }
 const neutralHead=relativeRotation(head.node);
 const paired=["Shoulder","Arm","ForeArm","Hand"] as const;
 // Rootless synthetic/unsupported rigs retain the original playback behavior.
 const symmetric=paired.every(part=>{
  const l=byName.get("Left"+part)!,r=byName.get("Right"+part)!;
  return l.node.parent instanceof TransformNode&&r.node.parent instanceof TransformNode;
 });
 let elapsed=0,weight=0,frames=0,disposed=false;
 function restore(){
  for(const track of tracks)if(!track.node.isDisposed())
   track.node.rotationQuaternion=track.base.clone();
 }
 return {
  get report(){return {status:disposed?"rejected":"retargeted-ual-walk",
   reason:disposed?"disposed":null,active:weight>.01,jointCount:tracks.length,frames,
   armSwing:true,cycleSeconds:parsed.duration} as WalkReport110;},
  update(speedMps,dt){
   if(disposed||!Number.isFinite(dt)||dt<=0||!Number.isFinite(speedMps))return;
   const step=Math.min(dt,.05),speed=Math.max(0,speedMps);
   const moving=speed>.12;
   weight=Math.max(0,Math.min(1,weight+(moving?1:-1)*step/.20));
   if(moving)elapsed=(elapsed+step*Math.max(.35,Math.min(1.35,speed/parsed.walkTargetMps)))%parsed.duration;
   if(weight<=.00001){restore();return}
   const cursor=elapsed/parsed.duration*(parsed.sampleCount-1);
   for(const track of tracks){
    if(track.node.isDisposed())continue;
    const delta=walkDelta(track,cursor);
    const movingPose=delta.multiply(track.base).normalize();
    track.node.rotationQuaternion=Quaternion.Slerp(track.base,movingPose,weight).normalize();
   }
   if(symmetric){
    for(const part of paired){
     const left=byName.get("Left"+part)!,right=byName.get("Right"+part)!;
     // No authored/counter-rotated wrist delta: the relaxed wrist follows its
     // forearm as a unit. Preserve the accepted right elbow flexion and swing.
     const rightPose=part==="Hand"?right.base:
      walkDelta(right,cursor+(parsed.sampleCount-1)/2).multiply(right.base).normalize();
     left.node.rotationQuaternion=Quaternion.Slerp(left.base,mirror(rightPose),weight).normalize();
    }
    const wrist=byName.get("RightHand")!;
    wrist.node.rotationQuaternion=wrist.base.clone();
   }
   refineLegs(weight);
   inclineWalkingBack(weight);
   if(anchor&&head.node.parent instanceof TransformNode){
    const parentRotation=relativeRotation(head.node.parent);
    const level=Quaternion.Inverse(parentRotation).multiply(neutralHead).normalize();
    head.node.rotationQuaternion=Quaternion.Slerp(rotationOf(head.node),level,weight).normalize();
   }
   frames++;
  },
  reset(){elapsed=0;weight=0;restore();},
  dispose(){restore();disposed=true;tracks.length=0;}
 };
}

