/** GTD-CHAR-129: Voight-native flight. No UAL animation retarget.
 *
 * The accepted CHAR-109 pose is captured from the ACTUAL linked character.glb
 * after the walking/jumping controllers restore neutral. Hover retains ALL
 * calibrated joint locals and their inherited anatomical parent chain.
 * Accelerated flight uses one visual-only waist-level pivot, never re-poses
 * hands, elbows, hips, knees, feet or the Rapier collider.
 */
import {Quaternion,TransformNode,Vector3,Matrix} from "@babylonjs/core";
import type {Skeleton} from "@babylonjs/core";
import {rotationOf,applyAimStep} from "./driver-joint-space";
import {selectFlightPose,type FlightPoseInput,type FlightPoseClip} from "./locomotion/flight-pose";
const ANATOMY=[
 "Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase",
 "RightUpLeg","RightLeg","RightFoot","RightToeBase"
] as const;
const SAMPLES=["LeftShoulder","RightShoulder","Hips","LeftHand","RightHand",
 "LeftLeg","RightLeg","LeftFoot","RightFoot","LeftToeBase","RightToeBase"] as const;
const MAX_FAST_PITCH_RAD=Math.PI*0.37; // ~67°, torso-forward, not a collider tilt
const PITCH_RADIANS_PER_SECOND=4.5;
const FLY_IDLE_CYCLE_SECONDS_129=2;
const FLY_IDLE_VERTICAL_AMPLITUDE_129=.012;
const FLY_IDLE_FORWARD_AMPLITUDE_129=.007;
const FLY_IDLE_BLEND_SECONDS_129=.24;
const FLY_IDLE_ARM_OPEN_FRACTION_129=.055;
const FLY_IDLE_KNEE_FORWARD_FRACTION_129=.055;
const FLY_IDLE_FOOT_UP_FRACTION_129=.08;
export {FLY_IDLE_CYCLE_SECONDS_129,FLY_IDLE_VERTICAL_AMPLITUDE_129,FLY_IDLE_FORWARD_AMPLITUDE_129};
const clamp=(x:number,low:number,high:number)=>Math.max(low,Math.min(high,x));
export const NATIVE_FLIGHT_MAX_PITCH_129=MAX_FAST_PITCH_RAD;
export function nativeFlightPitch129(input:FlightPoseInput):number{
 return selectFlightPose(input)==="fly"?MAX_FAST_PITCH_RAD:0;
}
export type NativeFlightGeometry129=Readonly<{
 shoulderSpan:number;ankleSeparation:number;wristSeparation:number;
 leftAnkleLane:number;rightAnkleLane:number;
 leftWristLane:number;rightWristLane:number;
}>;
export type NativeFlightReport129=Readonly<{
 mode:"standing"|"hover"|"fast";source:"character.glb/native-109";
 status:"uninitialized"|"ready"|"rejected"|"disposed";reason:string|null;
 frames:number;pitchRadians:number;activeClip:FlightPoseClip|null;
 geometry:NativeFlightGeometry129|null;
 worstNeutralDeviationRadians:number;
 idleWeight:number;floatSeconds:number;microVertical:number;microForward:number;
 idleCalibrated:boolean;idleCalibrationIssue:string|null;
}>;
export type NativeFlightPlayer129={
 enter:()=>void;
 update:(input:FlightPoseInput&{dt:number})=>void;
 leave:()=>void;
 dispose:()=>void;
 readonly report:NativeFlightReport129;
};

type Joint={name:string;node:TransformNode;rest:Quaternion};
function readJoints(skeletons:readonly Skeleton[]):Map<string,TransformNode>{
 const found=new Map<string,TransformNode>();
 for(const skeleton of skeletons)for(const bone of skeleton.bones){
  const node=bone.getTransformNode();
  if(!node)continue;
  if(found.has(bone.name)&&found.get(bone.name)!==node)
   throw Error("CHAR129 duplicate linked joint "+bone.name);
  found.set(bone.name,node);
 }
 for(const name of ANATOMY){
  if(!found.get(name)||found.get(name)!.isDisposed())
   throw Error("CHAR129 native GLB missing linked "+name);
 }
 return found;
}
export function captureNativeFlightGeometry129(
 nodes:ReadonlyMap<string,TransformNode>,reference:TransformNode,
):NativeFlightGeometry129{
 reference.computeWorldMatrix(true);
 const inv=Matrix.Invert(reference.getWorldMatrix());
 function p(name:string):Vector3{
  const node=nodes.get(name);
  if(!node||node.isDisposed())throw Error("CHAR129 missing anatomical point "+name);
  node.computeWorldMatrix(true);
  return Vector3.TransformCoordinates(node.getAbsolutePosition(),inv);
 }
 const leftShoulder=p("LeftShoulder"),rightShoulder=p("RightShoulder"),
  hips=p("Hips"),rightHand=p("RightHand"),leftHand=p("LeftHand"),
  leftFoot=p("LeftFoot"),rightFoot=p("RightFoot");
 const span=Vector3.Distance(leftShoulder,rightShoulder);
 if(!Number.isFinite(span)||span<.00001)throw Error("CHAR129 collapsed shoulder baseline");
 const axis=rightShoulder.subtract(leftShoulder).scale(1/span);
 const lane=(point:Vector3)=>Vector3.Dot(point.subtract(hips),axis);
 const leftAnkleLane=lane(leftFoot),rightAnkleLane=lane(rightFoot),
  leftWristLane=lane(leftHand),rightWristLane=lane(rightHand);
 const ankleSeparation=Vector3.Distance(leftFoot,rightFoot),
  wristSeparation=Vector3.Distance(leftHand,rightHand);
 const values=[span,ankleSeparation,wristSeparation,leftAnkleLane,rightAnkleLane,
  leftWristLane,rightWristLane];
 if(values.some(x=>!Number.isFinite(x))||
   !(leftAnkleLane<rightAnkleLane && leftWristLane<rightWristLane)||
   !(ankleSeparation>.04*span && wristSeparation>.04*span))
   throw Error("CHAR129 native baseline crossed or invalid wrist/foot lanes");
 return {shoulderSpan:span,ankleSeparation,wristSeparation,
  leftAnkleLane,rightAnkleLane,leftWristLane,rightWristLane};
}
function equivalent(a:NativeFlightGeometry129,b:NativeFlightGeometry129):boolean{
 const length=(key:keyof NativeFlightGeometry129)=>Math.abs(a[key]-b[key]);
 return (Object.keys(a) as (keyof NativeFlightGeometry129)[]).every(k=>
  length(k)<.003*Math.max(1,Math.abs(a.shoulderSpan)));
}
export function createNativeFlightPlayer129(
 skeletons:readonly Skeleton[],anchor:TransformNode,flightPivot:TransformNode,
):NativeFlightPlayer129{
 const nodes=readJoints(skeletons);
 let active=false,disposed=false,frames=0,pitch=0,baseline:NativeFlightGeometry129|null=null;
 let pose:Joint[]=[],reason:string|null=null,maxDeviation=0,clip:FlightPoseClip|null=null;
 let idleWeight=0,floatSeconds=0,calibrated=false,calibrationIssue:string|null=null;
 let idleTargets=new Map<string,Quaternion>();
 let hoverGeometry:NativeFlightGeometry129|null=null;
 const pivotRest=flightPivot.position.clone();
 let status:NativeFlightReport129["status"]="uninitialized";
 function restore(){
  for(const item of pose)if(!item.node.isDisposed())
   item.node.rotationQuaternion=item.rest.clone();
 }
 function resetPivot(){
  pitch=0;idleWeight=0;floatSeconds=0;
  if(!flightPivot.isDisposed()){
   flightPivot.rotation.x=0;
   flightPivot.position.copyFrom(pivotRest);
  }
 }
 function laneSafe(candidate:NativeFlightGeometry129,rest:NativeFlightGeometry129):boolean{
  return candidate.leftAnkleLane<candidate.rightAnkleLane &&
   candidate.leftWristLane<candidate.rightWristLane &&
   candidate.ankleSeparation>=rest.ankleSeparation*.80 &&
   candidate.wristSeparation>=rest.wristSeparation*.95 &&
   candidate.leftWristLane<=rest.leftWristLane+.004*rest.shoulderSpan &&
   candidate.rightWristLane>=rest.rightWristLane-.004*rest.shoulderSpan;
 }
 function captureIdleTargets():void{
  // Derive native poses from actual parented endpoint geometry, never UAL.
  calibrated=false;calibrationIssue=null;idleTargets.clear();hoverGeometry=null;
  if(!baseline)return;
  const base=new Map(pose.map(j=>[j.name,j.rest]));
  const reference=(name:string)=>{
   const node=nodes.get(name)!;
   node.computeWorldMatrix(true);
   return node.getAbsolutePosition().clone();
  };
  try{
   const leftShoulder=reference("LeftShoulder"),rightShoulder=reference("RightShoulder");
   const lateral=rightShoulder.subtract(leftShoulder).normalize();
   const separation=baseline.shoulderSpan*FLY_IDLE_ARM_OPEN_FRACTION_129;
   for(const side of ["Left","Right"] as const){
    const arm=nodes.get(side+"Arm")!,elbow=nodes.get(side+"ForeArm")!;
    const target=reference(side+"ForeArm").add(lateral.scale(
     (side==="Left"?-1:1)*separation));
    if(!applyAimStep(arm,elbow,target,.15))
     throw Error("native "+side+" elbow lateral aim failed");
   }
   const knee=nodes.get("RightLeg")!,thigh=nodes.get("RightUpLeg")!,
    ankle=nodes.get("RightFoot")!;
   const kneeStart=reference("RightLeg"),ankleStart=reference("RightFoot"),
    hip=reference("RightUpLeg");
   const thighLength=Vector3.Distance(hip,kneeStart);
   if(!Number.isFinite(thighLength)||thighLength<.01)
    throw Error("native thigh length invalid");
   anchor.computeWorldMatrix(true);
   const forward=Vector3.TransformNormal(Vector3.Forward(),
    anchor.getWorldMatrix()).normalize();
   if(!applyAimStep(thigh,knee,kneeStart.add(
    forward.scale(thighLength*FLY_IDLE_KNEE_FORWARD_FRACTION_129)),.16))
    throw Error("native relaxed thigh aim failed");
   const footTarget=ankleStart.add(Vector3.Up().scale(
    thighLength*FLY_IDLE_FOOT_UP_FRACTION_129)).subtract(
    forward.scale(thighLength*.025));
   if(!applyAimStep(knee,ankle,footTarget,.23))
    throw Error("native relaxed knee aim failed");
   hoverGeometry=captureNativeFlightGeometry129(nodes,anchor);
   if(!laneSafe(hoverGeometry,baseline))
    throw Error("native flyIdle violates wrist or ankle anatomical lanes");
   for(const name of ["LeftArm","RightArm","RightUpLeg","RightLeg"]){
    const node=nodes.get(name)!;
    idleTargets.set(name,rotationOf(node));
   }
   calibrated=true;
  }catch(error){
   calibrationIssue=error instanceof Error?error.message:String(error);
   idleTargets.clear();hoverGeometry=null;
  }finally{
   for(const item of pose)if(!item.node.isDisposed())
    item.node.rotationQuaternion=base.get(item.name)!.clone();
  }
 }
 function enter(){
  if(disposed||active)return;
  // The caller resets gait/jump BEFORE this snapshot. No mesh or bind edits.
  resetPivot();
  pose=ANATOMY.map(name=>{
   const node=nodes.get(name)!;
   return {name,node,rest:rotationOf(node).clone()};
  });
  try{
   baseline=captureNativeFlightGeometry129(nodes,anchor);
   reason=null;status="ready";active=true;frames=0;maxDeviation=0;clip="flyIdle";
   captureIdleTargets();
  }catch(e){
   reason=e instanceof Error?e.message:String(e);
   status="rejected";active=false;baseline=null;pose=[];clip=null;
   throw Error("CHAR129 native flight baseline rejected: "+reason);
  }
 }
 function update(input:FlightPoseInput&{dt:number}){
  if(disposed||!active||status!=="ready"||!Number.isFinite(input.dt)||input.dt<=0)return;
  const step=clamp(input.dt,0,.05);
  clip=selectFlightPose(input);
  // Only stationary flyIdle gets the subtle native balance posture.
  const targetIdle=clip==="flyIdle"&&calibrated?1:0;
  idleWeight+=clamp(targetIdle-idleWeight,-step/FLY_IDLE_BLEND_SECONDS_129,
   step/FLY_IDLE_BLEND_SECONDS_129);
  // Two-second continuous, phase-shifted sinusoid; visual-only and almost
  // imperceptible. No oscillation is injected into Rapier coordinates.
  floatSeconds=(floatSeconds+step)%FLY_IDLE_CYCLE_SECONDS_129;
  flightPivot.position.y=pivotRest.y+
   FLY_IDLE_VERTICAL_AMPLITUDE_129*idleWeight*
   Math.sin(2*Math.PI*floatSeconds/FLY_IDLE_CYCLE_SECONDS_129);
  flightPivot.position.z=pivotRest.z+
   FLY_IDLE_FORWARD_AMPLITUDE_129*idleWeight*
   Math.sin(2*Math.PI*floatSeconds/FLY_IDLE_CYCLE_SECONDS_129-Math.PI/2);
  // A whole visual rig pitch preserves pairwise anatomy and palm frames
  // instead of foreign pelvis/spine/quaternion changes to any linked bone.
  const target=nativeFlightPitch129(input),maxStep=PITCH_RADIANS_PER_SECOND*step;
  pitch+=clamp(target-pitch,-maxStep,maxStep);
  flightPivot.rotation.x=pitch;
  let deviation=0;
  for(const j of pose){
   if(j.node.isDisposed())continue;
   const current=rotationOf(j.node);
   const dot=Math.abs(Quaternion.Dot(current,j.rest));
   deviation=Math.max(deviation,2*Math.acos(clamp(dot,-1,1)));
   // Absolute target each frame, not additive drift.
   const idleTarget=idleTargets.get(j.name);
   const desired=idleTarget&&idleWeight>0?
    Quaternion.Slerp(j.rest,idleTarget,idleWeight).normalize():j.rest;
   if(Math.abs(Quaternion.Dot(current,desired))<.999999)
    j.node.rotationQuaternion=desired.clone();
  }
  maxDeviation=Math.max(maxDeviation,deviation);
  // Only compare geometry when fully upright: a tilted visual frame is
  // intentionally different from baseline in actor coordinates.
  if(frames%30===0&&Math.abs(pitch)<.0001&&baseline){
   const current=captureNativeFlightGeometry129(nodes,anchor);
   const matchBaseline=idleWeight<.0001&&equivalent(baseline,current);
   const matchIdle=idleWeight>.9999&&hoverGeometry!==null&&
    equivalent(hoverGeometry,current);
   const validTransition=idleWeight>.0001&&idleWeight<.9999&&
    laneSafe(current,baseline);
   if(!(matchBaseline||matchIdle||validTransition)){
    status="rejected";reason="CHAR129 actual GLB hover world-space lanes diverged from accepted standing";
    resetPivot();restore();
    throw Error(reason);
   }
  }
  frames++;
 }
 function leave(){
  if(disposed)return;
  resetPivot();restore();active=false;clip=null;
  if(status==="ready")status="uninitialized";
 }
 return {
  enter,update,leave,
  get report():NativeFlightReport129{
   return {mode:!active?"standing":clip==="fly"?"fast":"hover",
    source:"character.glb/native-109",status,reason,frames,
    pitchRadians:pitch,activeClip:clip,geometry:baseline,
    worstNeutralDeviationRadians:maxDeviation,
    idleWeight,floatSeconds,microVertical:flightPivot.position.y-pivotRest.y,
    microForward:flightPivot.position.z-pivotRest.z,
    idleCalibrated:calibrated,idleCalibrationIssue:calibrationIssue};
  },
  dispose(){leave();disposed=true;status="disposed";pose.length=0;}
 };
}
