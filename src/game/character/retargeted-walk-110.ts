/** CHAR-110B — owned-skeleton runtime playback of offline retargeted UAL Walk_Loop.
 * No UAL asset at runtime, no Three.js mixer, no mesh-space deformation.
 * The base pose is captured AFTER accepted CHAR-109 arm relaxation.
 * Babylon linked TransformNodes, not Bone.rotate, are authoritative.
 */
import {Quaternion,TransformNode,Vector3,Matrix} from "@babylonjs/core";
import type {Skeleton} from "@babylonjs/core";
import {rotationOf,parentSpaceAimDelta} from "./driver-joint-space";
import {validateSprintClip120,type SprintClip120} from "./retargeted-sprint-120";
import {createSprintArmChain120F,jogArmCarriage123,sampleSprintArm120F} from "./sprint-arm-chain-120f";

export type WalkClip110={
 schema:"gtd.char110.ual-walk.v1";
 duration:number;sampleCount:number;walkTargetMps:number;frameBasis:number[];
 tracks:{node:string;source:string;peakRadians:number;keys:number[][]}[];
};
export type WalkReport110={status:"retargeted-ual-walk"|"rejected";reason:string|null;active:boolean;
 jointCount:number;frames:number;armSwing:boolean;cycleSeconds:number;sprintActive?:boolean;sprintWeight?:number;sprintArmFailures?:number};
export type WalkPlayer110={
 readonly report:WalkReport110;
 update(speedMps:number,dt:number,sprintHeld?:boolean):void;reset():void;dispose():void;
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
/** CHAR-120D: build one forward-carriage offset from the actual linked
 * neutral rig. Its parent-space quaternion is held fixed over all running
 * phases, so the authored swing and signed forearm flex remain unchanged.
 */
export function calibrateSprintArmCarriage120D(
 hips:TransformNode,arm:TransformNode,elbow:TransformNode,
 forwardMetres=.095,maxRadians=.35,
):Quaternion|null{
 if(elbow.parent!==arm||!(arm.parent instanceof TransformNode)||
  !Number.isFinite(forwardMetres)||forwardMetres<=0)return null;
 hips.computeWorldMatrix(true);
 arm.parent.computeWorldMatrix(true);
 arm.computeWorldMatrix(true);elbow.computeWorldMatrix(true);
 const forward=Vector3.TransformNormal(Vector3.Forward(),
  hips.getWorldMatrix()).normalize();
 const original=elbow.getAbsolutePosition().subtract(arm.getAbsolutePosition());
 if(original.lengthSquared()<1e-6||forward.lengthSquared()<.5)return null;
 const desired=original.add(forward.scale(forwardMetres));
 return parentSpaceAimDelta(original,desired,arm.parent.getWorldMatrix(),maxRadians);
}
/** CHAR-120E: solve the *actual* wrist direction from the shoulder, not
 * CHAR-120D's neutral elbow-only aim. A positive leadFactor designates the
 * forward arm. All points are read from the live linked TransformNode chain.
 * Only the upper-arm local quaternion is allowed to change.
 */
export function aimSprintWristLane120E(
 hips:TransformNode,arm:TransformNode,elbow:TransformNode,hand:TransformNode,
 leadFactor:number,blend=1,
):{applied:boolean;before:number;after:number;wristForward:number}|null{
 if(!(arm.parent instanceof TransformNode)||elbow.parent!==arm||
  hand.parent!==elbow||![leadFactor,blend].every(Number.isFinite))return null;
 hips.computeWorldMatrix(true);arm.parent.computeWorldMatrix(true);
 arm.computeWorldMatrix(true);elbow.computeWorldMatrix(true);
 hand.computeWorldMatrix(true);
 const shoulder=arm.getAbsolutePosition().clone();
 const wrist=hand.getAbsolutePosition().clone();
 const forward=Vector3.TransformNormal(Vector3.Forward(),hips.getWorldMatrix()).normalize();
 const up=Vector3.TransformNormal(Vector3.Up(),hips.getWorldMatrix()).normalize();
 const armToWrist=wrist.subtract(shoulder);
 if(armToWrist.lengthSquared()<.005||forward.lengthSquared()<.5||
  up.lengthSquared()<.5)return null;
 const lead=Math.max(0,Math.min(1,leadFactor));
 const distanceForward=Vector3.Dot(armToWrist,forward);
 const distanceUp=Vector3.Dot(armToWrist,up);
 // The rear hand travels close to the hip; the leading fist rises toward
 // the lower chest. Never pull an already-good wrist backwards or downwards.
 const forwardGoal=-.035+.225*lead;
 const verticalGoal=-.435+.165*lead;
 const forwardShift=Math.max(0,forwardGoal-distanceForward);
 const verticalShift=Math.max(0,verticalGoal-distanceUp);
 if(forwardShift<.001&&verticalShift<.001)
  return {applied:false,before:0,after:0,wristForward:distanceForward};
 const desired=armToWrist.add(forward.scale(forwardShift)).
  add(up.scale(verticalShift));
 const delta=parentSpaceAimDelta(armToWrist,desired,arm.parent.getWorldMatrix(),.72);
 if(!delta)return null;
 const base=rotationOf(arm),strength=Math.max(0,Math.min(1,blend));
 const corrected=Quaternion.Slerp(Quaternion.Identity(),delta,strength).normalize();
 const before=Vector3.DistanceSquared(armToWrist,desired);
 arm.rotationQuaternion=corrected.multiply(base).normalize();
 hand.computeWorldMatrix(true);
 const result=hand.getAbsolutePosition().subtract(shoulder);
 const after=Vector3.DistanceSquared(result,desired);
 if(!Number.isFinite(after)||after>before+1e-7){
  arm.rotationQuaternion=base;hand.computeWorldMatrix(true);
  return {applied:false,before,after:before,wristForward:distanceForward};
 }
 return {applied:true,before,after,wristForward:Vector3.Dot(result,forward)};
}
type Track={node:TransformNode;base:Quaternion;keys:Quaternion[];name:string};
export const HUMAN_WALK_SPEED_119=1.65;
/** CHAR-124 pure, continuous phase proxy for trailing-foot recovery.
* Start folding as soon as the ankle passes 2cm behind the pelvis, instead
* of waiting 9cm. Complete by 24cm; stance/leading legs retain baseline.
*/
export const rearLegRecovery124=(ankleForwardZ:number):number=>{
 if(!Number.isFinite(ankleForwardZ))return 0;
 const t=Math.max(0,Math.min(1,(-ankleForwardZ-.02)/.22));
 return t*t*(3-2*t);
};
/** CHAR-125: independent bilateral gate, nonzero only during trailing swing.
 * The heel correction must not affect a rearward-moving planted foot.
 */
export function heelRecoveryGate125(ankleZ:number,forwardVelocity:number):number{
 if(!Number.isFinite(ankleZ)||!Number.isFinite(forwardVelocity))return 0;
 const smooth=(t:number)=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
 return smooth((-ankleZ-.045)/.17)*smooth((forwardVelocity-.025)/.62);
}
export function createWalkPlayer110(skeletons:readonly Skeleton[],clip:WalkClip110,
 blinkTargets:readonly {influence:number}[]=[],sprintClip:SprintClip120|null=null,
 options:{heelRecovery125?:boolean}={}):WalkPlayer110{
 const parsed=validateWalkClip110(clip);
 const sprint=sprintClip?validateSprintClip120(sprintClip):null;
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
 const sprintTracks=new Map<string,Quaternion[]>();
 if(sprint)for(const track of sprint.tracks)
  sprintTracks.set(track.node,track.keys.map(q=>
   new Quaternion(q[0]!,q[1]!,q[2]!,q[3]!).normalize()));
 if(sprint&&targetNames.some(n=>sprintTracks.get(n)?.length!==sprint.sampleCount))
  throw Error("Incomplete retargeted CHAR-120 sprint anatomy");
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
 const sprintArmCenters=new Map<string,Quaternion>();
 if(sprint)for(const [name,keys] of sprintTracks){
  if(!/^(Left|Right)(Arm|ForeArm|Shoulder)$/.test(name))continue;
  const ref=keys[0]!,sum=new Quaternion(0,0,0,0);
  for(const q of keys.slice(0,-1)){
   const sign=Quaternion.Dot(ref,q)<0?-1:1;
   sum.x+=q.x*sign;sum.y+=q.y*sign;sum.z+=q.z*sign;sum.w+=q.w*sign;
  }
  sprintArmCenters.set(name,sum.normalize());
 }
 function sprintDelta(track:Track,cursor:number):Quaternion{
  if(!sprint)return Quaternion.Identity();
  const keys=sprintTracks.get(track.name)!;
  const frames=sprint.sampleCount-1;
  const wrapped=((cursor%frames)+frames)%frames,a=Math.floor(wrapped);
  const q=Quaternion.Slerp(keys[a]!,keys[a+1]!,wrapped-a).normalize();
  const center=sprintArmCenters.get(track.name);
  if(!center)return q;
  // CHAR-120A: restore a bounded portion of Sprint_Loop's authored
  // elbow/arm mean pose; centering the cycle alone discarded nearly 55°
  // of source-relative elbow flex. Keep shoulder/clavicle motion untouched.
  const isForearm=track.name.endsWith("ForeArm");
  const isUpperArm=track.name.endsWith("Arm")&&!isForearm;
  const cycle=q.multiply(Quaternion.Inverse(center)).normalize();
  if(isForearm||isUpperArm){
   const swingGain=isForearm?1.10:1.35;
   // CHAR-120B: stronger authored elbow flex only; keep arm drive unchanged.
   const meanGain=isForearm?.90:.50;
   const swing=Quaternion.Slerp(Quaternion.Identity(),cycle,swingGain).normalize();
   // CHAR-120C: target forearm flex was pointed outward/backward. Reverse
   // the source-relative mean BEND only; keep authored oscillation, upper arms,
   // shoulder motion and every wrist local transform completely unchanged.
   const bendCenter=isForearm?Quaternion.Inverse(center).normalize():center;
   const authoredBend=Quaternion.Slerp(Quaternion.Identity(),bendCenter,meanGain).normalize();
   return swing.multiply(authoredBend).normalize();
  }
  // CHAR-123: restrained clavicle swing for a hurried jog.
  const gain=track.name.endsWith("Shoulder")?.24:.85;
  return Quaternion.Slerp(Quaternion.Identity(),cycle,gain).normalize();
 }
 const hips=names.get("Hips")!;
 const anatomicalArms=sprint?.armMotion?(["Right","Left"] as const).map(side=>({
  side,
  solve:createSprintArmChain120F(hips,names.get(side+"Arm")!,names.get(side+"ForeArm")!,names.get(side+"Hand")!),
  keys:side==="Right"?sprint.armMotion!.right:sprint.armMotion!.left,
 })):null;
 const anatomicalJoint=(name:string)=>!!anatomicalArms&&/^(Left|Right)(Arm|ForeArm)$/.test(name);
 // CHAR-120E replaces the neutral elbow carriage with live wrist targets.
 const legSides=["Left","Right"] as const;
 const previousRawAnkleZ=new Map<"Left"|"Right",number>();
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
 // CHAR-122: sprint-only lower-body silhouette correction. Unlike
 // walking, sprint currently bypasses its foot-heading alignment entirely.
 // Keep authored thigh/hip gait and timing unchanged; moderate only the
 // knee fold, then steer the toe yaw relative to the current pelvis.
 function refineSprintLegs(blend:number,dt:number){
  if(blend<=.00001)return;
  hips.computeWorldMatrix(true);
  const body=hips.getWorldMatrix(),inverse=Matrix.Invert(body);
  const point=(node:TransformNode)=>{
   node.computeWorldMatrix(true);
   return Vector3.TransformCoordinates(node.getAbsolutePosition(),inverse);
  };
  for(const side of legSides){
   const knee=names.get(side+"Leg")!,foot=names.get(side+"Foot")!;
   const toe=names.get(side+"ToeBase")!,track=byName.get(side+"Leg")!;
   if(foot.parent!==knee||toe.parent!==foot)continue;
   // The native-reference knee clip is over-flexed on Voight's target rig.
   // CHAR-123: preserve slightly more natural flex during trailing swing,
   // without reintroducing the original excessive sprint-knee bend.
   const ankleBefore=point(foot);
   const recovery=rearLegRecovery124(ankleBefore.z);
   const moderation=.38-.075*recovery;
   knee.rotationQuaternion=Quaternion.Slerp(rotationOf(knee),track.base,moderation*blend).normalize();
   // CHAR-125: measure RAW ankle movement. Begin heel fold only after
   // push-off, when the rear foot starts moving forward from behind.
   const previous=previousRawAnkleZ.get(side);
   const velocity=previous===undefined?0:(ankleBefore.z-previous)/Math.max(.001,dt);
   previousRawAnkleZ.set(side,ankleBefore.z);
   const gate=options.heelRecovery125===false?0:
    heelRecoveryGate125(ankleBefore.z,velocity)*blend;
   if(gate>.0001&&knee.parent instanceof TransformNode){
    knee.parent.computeWorldMatrix(true);
    const joint=point(knee),ankle=point(foot);
    const shin=ankle.subtract(joint),length=shin.length();
    if(length>.10){
     const thigh=names.get(side+"UpLeg")!;
     const thighDir=joint.subtract(point(thigh)).normalize();
     // Raise the ankle and guide it behind the knee. Keep anatomical X.
     const desired=shin.add(new Vector3(0,.18*gate,-.19*gate)).normalize();
     const maximum=92*Math.PI/180;
     const flex=Math.acos(Math.max(-1,Math.min(1,Vector3.Dot(thighDir,desired))));
     const allowed=flex>maximum?
      Vector3.Lerp(thighDir,desired,maximum/flex).normalize():desired;
     const target=joint.add(allowed.scale(length));
     if(target.y>ankle.y+.0005&&target.z<ankle.z+.002){
      const from=Vector3.TransformNormal(shin,body);
      const to=Vector3.TransformNormal(target.subtract(joint),body);
      const aim=parentSpaceAimDelta(from,to,knee.parent.getWorldMatrix(),.42);
      if(aim){
       const initial=rotationOf(knee);
       knee.rotationQuaternion=aim.multiply(initial).normalize();
       const raised=point(foot),raisedDir=raised.subtract(joint).normalize();
       const bend=Math.acos(Math.max(-1,Math.min(1,Vector3.Dot(thighDir,raisedDir))));
       if(raised.y<ankle.y-.001||raised.z>ankle.z+.01||
        bend>maximum+.015)knee.rotationQuaternion=initial;
      }
     }
    }
   }
   const a=point(foot),b=point(toe),direction=b.subtract(a);
   const horizontal=Math.hypot(direction.x,direction.z);
   if(horizontal<.045||direction.z<-.06)continue;
   const angle=Math.atan2(direction.x,direction.z);
   const heading=Math.max(-.12,Math.min(.12,angle));
   const deltaHeading=Math.max(-1.4,Math.min(1.4,(heading-angle)*blend));
   if(Math.abs(deltaHeading)<.001)continue;
   const desired=new Vector3(Math.sin(angle+deltaHeading)*horizontal,0,
    Math.cos(angle+deltaHeading)*horizontal);
   const from=Vector3.TransformNormal(new Vector3(direction.x,0,direction.z),body);
   const to=Vector3.TransformNormal(desired,body);
   const delta=parentSpaceAimDelta(from,to,knee.getWorldMatrix(),1.42);
   if(!delta)continue;
   const previousFootRotation=rotationOf(foot);
   foot.rotationQuaternion=delta.multiply(previousFootRotation).normalize();
   // Never aim a toe through the pelvis centerline.
   const sign=side==="Left"?1:-1;
   if(point(toe).x*sign<.025)foot.rotationQuaternion=previousFootRotation;
  }
 }
 // CHAR-118: distribute a slight walking-only inclination through the back.
 // The arms inherit the torso motion with their accepted local pose unchanged.
 const back=[names.get("Spine")!,names.get("Spine1")!,names.get("Spine2")!];
 const backDegrees=[2,1.75,1.25];
 // CHAR-124: 12% less additive forward jog pitch than CHAR-123 (>=8%).
 const sprintBackDegrees=[1.012,.792,.572];
 const supportedBack=back[0]!.parent===hips&&back[1]!.parent===back[0]&&back[2]!.parent===back[1];
 function inclineWalkingBack(blend:number,sprintBlend=0){
  if(!supportedBack)return;
  hips.computeWorldMatrix(true);
  const up=Vector3.TransformNormal(Vector3.Up(),hips.getWorldMatrix()).normalize();
  const forward=Vector3.TransformNormal(Vector3.Forward(),hips.getWorldMatrix()).normalize();
  for(let i=0;i<back.length;i++){
   const node=back[i]!,parent=node.parent as TransformNode;
   parent.computeWorldMatrix(true);
   const degrees=backDegrees[i]!*(1-sprintBlend)+sprintBackDegrees[i]!*sprintBlend;
   const angle=degrees*Math.PI/180*blend;
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
 const blinkBases=blinkTargets.map(t=>t.influence);
 const setBlink=(value:number)=>blinkTargets.forEach((t,i)=>t.influence=blinkBases[i]!+(1-blinkBases[i]!)*value);
 let idleTime=0;
 function addLocal(name:string,axis:Vector3,radians:number){
  const node=names.get(name);if(node)node.rotationQuaternion=rotationOf(node).multiply(Quaternion.RotationAxis(axis,radians)).normalize();
 }
 const pulse=(time:number,start:number,duration:number)=>{
  const t=(time-start)/duration;return t>0&&t<1?Math.sin(Math.PI*t)**2:0;
 };
 function animateIdle(dt:number){
  idleTime+=dt;
  const fade=Math.max(0,Math.min(1,(idleTime-.6)/1.2));
  const breath=Math.sin(idleTime*2*Math.PI/4.8)*.004*fade;
  addLocal("Spine1",Vector3.Right(),breath);
  addLocal("Spine2",Vector3.Right(),-breath*.5);
  const glance=pulse(idleTime%11,4,2.8)*fade;
  addLocal("Head",Vector3.Up(),.035*glance);
  addLocal("Head",Vector3.Right(),.025*glance);
  const gesture=pulse(idleTime%14,8,3.2)*fade;
  addLocal("RightArm",Vector3.Right(),.012*gesture);
  addLocal("RightForeArm",Vector3.Right(),.045*gesture);
  const blink=pulse(idleTime%9.3,2.2,.20)+pulse(idleTime%9.3,6.8,.18);
  setBlink(blink*fade);
 }
 function flexWalkingForearms(cursor:number,blend:number){
  hips.computeWorldMatrix(true);
  const forward=Vector3.TransformNormal(Vector3.Forward(),hips.getWorldMatrix()).normalize();
  for(const [index,side] of ["Right","Left"].entries()){
   const elbow=names.get(side+"ForeArm")!,hand=names.get(side+"Hand")!;
   if(!(elbow.parent instanceof TransformNode)||hand.parent!==elbow)continue;
   elbow.computeWorldMatrix(true);hand.computeWorldMatrix(true);
   const from=hand.getAbsolutePosition().subtract(elbow.getAbsolutePosition());
   const phase=cursor/(parsed.sampleCount-1)*Math.PI*2+index*Math.PI;
   const strength=(.035+.045*(.5+.5*Math.cos(phase)))*blend;
   const to=from.normalizeToNew().add(forward.scale(strength)).normalize();
   const delta=parentSpaceAimDelta(from,to,elbow.parent.getWorldMatrix(),.09*blend);
   if(delta)elbow.rotationQuaternion=delta.multiply(rotationOf(elbow)).normalize();
  }
 }
 let elapsed=0,sprintElapsed=0,sprintWeight=0,lastSprintRequest=false,sprintArmFailures=0;
 let weight=0,frames=0,disposed=false;
 function restore(){
  for(const track of tracks)if(!track.node.isDisposed())
   track.node.rotationQuaternion=track.base.clone();
 }
 return {
  get report(){return {status:disposed?"rejected":"retargeted-ual-walk",
   reason:disposed?"disposed":null,active:weight>.01,jointCount:tracks.length,frames,
   armSwing:true,cycleSeconds:parsed.duration,
   sprintActive:sprintWeight>.5,sprintWeight,sprintArmFailures} as WalkReport110;},
  update(speedMps,dt,sprintHeld=false){
   if(disposed||!Number.isFinite(dt)||dt<=0||!Number.isFinite(speedMps))return;
   const step=Math.min(dt,.05),speed=Math.max(0,speedMps);
   const moving=speed>.12;
   const wantsSprint=!!sprint&&sprintHeld&&speed>.25;
   // Phase synchronization on transition, no half-stride resets.
   if(sprint&&wantsSprint!==lastSprintRequest){
    if(wantsSprint)sprintElapsed=(elapsed/parsed.duration)*sprint.duration;
    else elapsed=(sprintElapsed/sprint.duration)*parsed.duration;
    lastSprintRequest=wantsSprint;
    previousRawAnkleZ.clear();
   }
   weight=Math.max(0,Math.min(1,weight+(moving?1:-1)*step/.20));
   sprintWeight=Math.max(0,Math.min(1,sprintWeight+
    (wantsSprint?1:-1)*step/.22));
   if(moving){
    elapsed=(elapsed+step*Math.max(.35,Math.min(1.35,speed/parsed.walkTargetMps)))%parsed.duration;
    if(sprint)sprintElapsed=(sprintElapsed+
     step*Math.max(.45,Math.min(1.5,speed/sprint.runTargetMps)))%sprint.duration;
   }
   if(moving){idleTime=0;setBlink(0);}
   if(weight<=.00001){restore();animateIdle(step);return}
   const cursor=elapsed/parsed.duration*(parsed.sampleCount-1);
   const sprintCursor=sprint?sprintElapsed/sprint.duration*(sprint.sampleCount-1):0;
   for(const track of tracks){
    if(track.node.isDisposed())continue;
    let delta=walkDelta(track,cursor);
    if(sprint&&sprintWeight>0.00001&&!anatomicalJoint(track.name))
      delta=Quaternion.Slerp(delta,sprintDelta(track,sprintCursor),sprintWeight).normalize();
    const movingPose=delta.multiply(track.base).normalize();
    track.node.rotationQuaternion=Quaternion.Slerp(track.base,movingPose,weight).normalize();
   }
   if(symmetric){
    for(const part of paired){
     const left=byName.get("Left"+part)!,right=byName.get("Right"+part)!;
     // No authored/counter-rotated wrist delta: the relaxed wrist follows its
     // forearm as a unit. Preserve the accepted right elbow flexion and swing.
     let rightPose=part==="Hand"?right.base:
      walkDelta(right,cursor+(parsed.sampleCount-1)/2).multiply(right.base).normalize();
     if(sprint&&sprintWeight>0.00001&&!anatomicalJoint(right.name)){
      const sprintPose=part==="Hand"?right.base:
       sprintDelta(right,sprintCursor+(sprint.sampleCount-1)/2).multiply(right.base).normalize();
      rightPose=Quaternion.Slerp(rightPose,sprintPose,sprintWeight).normalize();
     }
     left.node.rotationQuaternion=Quaternion.Slerp(left.base,mirror(rightPose),weight).normalize();
    }
    const wrist=byName.get("RightHand")!;
    wrist.node.rotationQuaternion=wrist.base.clone();
   }
   // Walking-specific corrections must not distort the authored sprint shoes.
   refineLegs(weight*(1-sprintWeight));
   refineSprintLegs(weight*sprintWeight,step);
   inclineWalkingBack(weight,sprintWeight);
   flexWalkingForearms(cursor,weight*(1-sprintWeight));
   // CHAR-120E: read BOTH animated shoulder-elbow-wrist chains before
   // correcting either one. The more forward wrist leads; the other trails.
   // Local elbows, wrists, shoulders, torso and accepted legs are unmodified.
   if(anatomicalArms&&sprintWeight>.00001){
    for(const arm of anatomicalArms)
     if(!arm.solve(jogArmCarriage123(sampleSprintArm120F(arm.keys,sprintCursor),arm.side),weight*sprintWeight))sprintArmFailures++;
   }else if(sprint&&sprintWeight>.00001){
    const forward=Vector3.TransformNormal(Vector3.Forward(),
     (hips.computeWorldMatrix(true),hips.getWorldMatrix())).normalize();
    const positions=(["Right","Left"] as const).map(side=>{
     const arm=names.get(side+"Arm")!,wrist=names.get(side+"Hand")!;
     arm.computeWorldMatrix(true);wrist.computeWorldMatrix(true);
     return {side,projection:Vector3.Dot(
      wrist.getAbsolutePosition().subtract(arm.getAbsolutePosition()),forward)};
    });
    const phase=Math.max(-1,Math.min(1,
     (positions[0]!.projection-positions[1]!.projection)/.18));
    for(const sample of positions){
     const lead=Math.max(0,sample.side==="Right"?phase:-phase);
     aimSprintWristLane120E(hips,names.get(sample.side+"Arm")!,
      names.get(sample.side+"ForeArm")!,names.get(sample.side+"Hand")!,
      lead,weight*sprintWeight);
    }
   }
   if(anchor&&head.node.parent instanceof TransformNode){
    const parentRotation=relativeRotation(head.node.parent);
    const level=Quaternion.Inverse(parentRotation).multiply(neutralHead).normalize();
    head.node.rotationQuaternion=Quaternion.Slerp(rotationOf(head.node),level,weight).normalize();
   }
   frames++;
  },
  reset(){elapsed=0;sprintElapsed=0;sprintWeight=0;lastSprintRequest=false;sprintArmFailures=0;
   previousRawAnkleZ.clear();
   weight=0;idleTime=0;setBlink(0);restore();},
  dispose(){restore();setBlink(0);disposed=true;tracks.length=0;sprintTracks.clear();previousRawAnkleZ.clear();}
 };
}


