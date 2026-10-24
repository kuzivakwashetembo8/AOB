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
import {rotationOf} from "./driver-joint-space";
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
 let status:NativeFlightReport129["status"]="uninitialized";
 function restore(){
  for(const item of pose)if(!item.node.isDisposed())
   item.node.rotationQuaternion=item.rest.clone();
 }
 function resetPivot(){
  pitch=0;
  if(!flightPivot.isDisposed())flightPivot.rotation.x=0;
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
   if(dot<.999999)j.node.rotationQuaternion=j.rest.clone();
  }
  maxDeviation=Math.max(maxDeviation,deviation);
  // Only compare geometry when fully upright: a tilted visual frame is
  // intentionally different from baseline in actor coordinates.
  if(frames%30===0&&Math.abs(pitch)<.0001&&baseline){
   const current=captureNativeFlightGeometry129(nodes,anchor);
   if(!equivalent(baseline,current)){
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
    worstNeutralDeviationRadians:maxDeviation};
  },
  dispose(){leave();disposed=true;status="disposed";pose.length=0;}
 };
}
