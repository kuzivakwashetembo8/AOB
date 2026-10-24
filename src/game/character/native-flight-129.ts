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
import {rotationOf,applyAimStep,parentSpaceAimDelta} from "./driver-joint-space";
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
const MAX_FAST_PITCH_RAD=Math.PI/2; // FI-006: 90° body-horizontal, visual pivot only
const PITCH_RADIANS_PER_SECOND=4.5;
const FLY_IDLE_CYCLE_SECONDS_129=2;
const FLY_IDLE_VERTICAL_AMPLITUDE_129=.014322; // FI-003: 0.013020 * 1.10
const FLY_IDLE_FORWARD_AMPLITUDE_129=.0083545; // FI-003: 0.007595 * 1.10
const FLY_IDLE_BLEND_SECONDS_129=.24;
const FLY_IDLE_ARM_OPEN_FRACTION_129=.40; // FI-005: visible balance spread
const FLY_IDLE_KNEE_FORWARD_FRACTION_129=.48; // FI-005: forward raised knee
const FLY_IDLE_FOOT_UP_FRACTION_129=.60;
const FAST_ARM_OPEN_FRACTION_129=.60;
const FAST_POSE_BLEND_SECONDS_129=.19;
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
 idleKneeFlexionGainDegrees:number;idleRightFootLiftFraction:number;
 idleRightKneeAdvanceFraction:number;
 idleRightToeDownDot:number;
 idleRightFootAboveLeftFraction:number;headPitchDirection:number;hoverWeight:number;
 fastWeight:number;fastCalibrated:boolean;fastCalibrationIssue:string|null;
 hoverLeftToeDownGain:number;fastSoleUpLeft:number;fastSoleUpRight:number;
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
 let idleWeight=0,hoverWeight=0,floatSeconds=0,headPitchDirection=0,calibrated=false,calibrationIssue:string|null=null;
 let idleTargets=new Map<string,Quaternion>();
 let hoverGeometry:NativeFlightGeometry129|null=null;
 let kneeFlexionGainDegrees=0,rightFootLiftFraction=0,rightKneeAdvanceFraction=0;
 let rightToeDownDot=0,rightFootAboveLeftFraction=0;
 let fastTargets=new Map<string,Quaternion>(),fastCalibrated=false;
 let fastCalibrationIssue:string|null=null,fastWeight=0;
 let hoverLeftToeDownGain=0,fastSoleUpLeft=0,fastSoleUpRight=0;
 let upHead:Quaternion|null=null,downHead:Quaternion|null=null;
 const pivotRest=flightPivot.position.clone();
 let status:NativeFlightReport129["status"]="uninitialized";
 function restore(){
  for(const item of pose)if(!item.node.isDisposed())
   item.node.rotationQuaternion=item.rest.clone();
 }
 function resetPivot(){
  pitch=0;idleWeight=0;hoverWeight=0;fastWeight=0;
  headPitchDirection=0;floatSeconds=0;
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
  kneeFlexionGainDegrees=0;rightFootLiftFraction=0;rightKneeAdvanceFraction=0;rightToeDownDot=0;
  rightFootAboveLeftFraction=0;upHead=null;downHead=null;
  hoverLeftToeDownGain=0;fastSoleUpLeft=0;fastSoleUpRight=0;
  fastTargets.clear();fastCalibrated=false;fastCalibrationIssue=null;
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
    if(!applyAimStep(arm,elbow,target,.42))
     throw Error("native "+side+" elbow lateral aim failed");
   }
   const knee=nodes.get("RightLeg")!,thigh=nodes.get("RightUpLeg")!,
    ankle=nodes.get("RightFoot")!;
   const hipStart=reference("RightUpLeg"),kneeStart=reference("RightLeg"),
    ankleStart=reference("RightFoot");
   const thighLength=Vector3.Distance(hipStart,kneeStart),
    shinLength=Vector3.Distance(kneeStart,ankleStart);
   if(!Number.isFinite(thighLength)||thighLength<.01||
      !Number.isFinite(shinLength)||shinLength<.01)
    throw Error("native thigh/shin lengths invalid");
   // Authoritative native facing comes from actual toes, not a guessed
   // world-Z or a duplicated UAL humanoid heading convention.
   const toeForward=reference("LeftToeBase").subtract(reference("LeftFoot"))
     .add(reference("RightToeBase").subtract(ankleStart));
   toeForward.y=0;
   if(toeForward.lengthSquared()<1e-7)
    throw Error("native toe-derived forward direction missing");
   const forward=toeForward.normalize();
   const kneeFlexion=(hip:Vector3,k:Vector3,foot:Vector3)=>{
    const up=hip.subtract(k).normalize(),down=foot.subtract(k).normalize();
    return Math.PI-Math.acos(clamp(Vector3.Dot(up,down),-1,1));
   };
   const initialFlex=kneeFlexion(hipStart,kneeStart,ankleStart);
   // The first stage moves the KNEE forward. Then recompute the ankle
   // AFTER the upper-leg transform; the old code aimed at a stale ankle
   // and could cancel the tibia's visible flexion.
   if(!applyAimStep(thigh,knee,kneeStart.add(
     forward.scale(thighLength*FLY_IDLE_KNEE_FORWARD_FRACTION_129)),.65))
    throw Error("native relaxed thigh aim failed");
   const kneeMoved=reference("RightLeg"),ankleMoved=reference("RightFoot");
   const footTarget=ankleMoved.add(Vector3.Up().scale(
     shinLength*FLY_IDLE_FOOT_UP_FRACTION_129)).subtract(
     forward.scale(shinLength*.85));
   if(!applyAimStep(knee,ankle,footTarget,1.20))
    throw Error("native right shin flexion aim failed");
   const kneeFinal=reference("RightLeg"),ankleFinal=reference("RightFoot"),
    hipFinal=reference("RightUpLeg");
   const gain=kneeFlexion(hipFinal,kneeFinal,ankleFinal)-initialFlex;
   const footRise=(ankleFinal.y-ankleStart.y)/shinLength;
   const footGap=(ankleFinal.y-reference("LeftFoot").y)/shinLength;
   const kneeAdvance=Vector3.Dot(kneeFinal.subtract(kneeStart),forward)/thighLength;
   if(!Number.isFinite(kneeAdvance)||kneeAdvance<.18)
    throw Error("native right knee insufficient forward lead: "+kneeAdvance.toFixed(3));
   if(!Number.isFinite(gain)||gain<25*Math.PI/180)
    throw Error("native right knee still visibly straight: insufficient flexion "+
      (gain*180/Math.PI).toFixed(2)+" degrees");
   if(!Number.isFinite(footRise)||footRise<.28)
    throw Error("native right ankle lift too small: "+footRise.toFixed(3));
   if(!Number.isFinite(footGap)||footGap<.24)
    throw Error("native right foot not visibly higher than straight leg: "+footGap.toFixed(3));
   kneeFlexionGainDegrees=gain*180/Math.PI;
   rightFootAboveLeftFraction=footGap;
   rightFootLiftFraction=footRise;
   rightKneeAdvanceFraction=kneeAdvance;
   // FI-004: A flexed KNEE alone leaves the shoe's sole pointing down like
   // someone standing on an invisible platform. Aim the linked TOE landmark
   // with the native FOOT joint (not toes) so the toe points towards earth.
   // Shortest-arc parent-space aiming preserves natural ankle roll/palm parity.
   const rightToe=nodes.get("RightToeBase")!;
   const ankleAfterKnee=reference("RightFoot");
   const toeBefore=reference("RightToeBase");
   const shoeLength=Vector3.Distance(ankleAfterKnee,toeBefore);
   if(!Number.isFinite(shoeLength)||shoeLength<1e-5)
    throw Error("native shoe toe landmark invalid");
   const worldDown=new Vector3(0,-1,0);
   const shoeDirection=worldDown.scale(.96).add(forward.scale(.12)).normalize();
   const toeTarget=ankleAfterKnee.add(shoeDirection.scale(shoeLength));
   if(!applyAimStep(ankle,rightToe,toeTarget,1.55))
    throw Error("native ankle toe-down aim failed");
   const toeVector=reference("RightToeBase").subtract(reference("RightFoot"));
   if(toeVector.lengthSquared()<1e-9)
    throw Error("native toe-to-ankle vector collapsed");
   const toeDir=toeVector.normalize();
   const alignment=Vector3.Dot(toeDir,new Vector3(0,-1,0));
   if(!Number.isFinite(alignment)||alignment<.70 ||
      Vector3.Dot(toeDir,forward)>.35)
    throw Error("native raised-foot toes not pointing down: "+
      alignment.toFixed(3));
   rightToeDownDot=alignment;
   // FI-006: only the EXTENDED LEFT ANKLE rotates slightly during hover.
   // Left hip, thigh, shin and actual foot position stay unchanged.
   const leftFoot=nodes.get("LeftFoot")!,leftToe=nodes.get("LeftToeBase")!;
   const leftAnkle=reference("LeftFoot");
   const leftToeInitial=reference("LeftToeBase").subtract(leftAnkle);
   const leftToeLength=leftToeInitial.length();
   if(!(leftToeLength>1e-5))throw Error("CHAR129 left foot tip collapsed");
   const beforeDown=Vector3.Dot(leftToeInitial.scale(1/leftToeLength),Vector3.Down());
   const leftToeTarget=leftAnkle.add(
    leftToeInitial.add(Vector3.Down().scale(leftToeLength*.27))
     .normalize().scale(leftToeLength));
   if(!applyAimStep(leftFoot,leftToe,leftToeTarget,.32))
    throw Error("CHAR129 straight left ankle slight flex failed");
   const leftDirection=reference("LeftToeBase").subtract(reference("LeftFoot")).normalize();
   hoverLeftToeDownGain=Vector3.Dot(leftDirection,Vector3.Down())-beforeDown;
   if(!Number.isFinite(hoverLeftToeDownGain)||hoverLeftToeDownGain<.08 ||
      Vector3.Dot(leftDirection,Vector3.Down())>=rightToeDownDot-.15)
    throw Error("CHAR129 extended ankle not subtly flexed independently of bent foot");
   hoverGeometry=captureNativeFlightGeometry129(nodes,anchor);
   if(!laneSafe(hoverGeometry,baseline))
    throw Error("native flyIdle violates wrist or ankle anatomical lanes");
   // Fork glTF/UAL uses separate head motion; compute native neck pitch
   // in parent space from actual toe-derived facing, not copied UAL joints.
   const neck=nodes.get("Neck")!,parent=neck.parent;
   if(!parent)throw Error("native neck has no linked parent");
   parent.computeWorldMatrix(true);
   const baseNeck=rotationOf(neck);
   const headAim=(direction:1|-1,pitchAmount:number,maxRadians:number)=>{
    const to=forward.add(Vector3.Up().scale(direction*pitchAmount)).normalize();
    const delta=parentSpaceAimDelta(forward,to,parent.getWorldMatrix(),maxRadians);
    if(!delta)throw Error("native head flight tilt uncalibrated");
    return delta.multiply(baseNeck).normalize();
   };
   upHead=headAim(1,.36,.35);
   downHead=headAim(-1,.28,.29);
   for(const name of ["LeftArm","RightArm","RightUpLeg","RightLeg","RightFoot","LeftFoot"]){
    const node=nodes.get(name)!;
    idleTargets.set(name,rotationOf(node));
   }
   calibrated=true;

   // Independently solve the speed-flight limb pose on the ORIGINAL
   // accepted standing basis. Do not inherit the raised-knee hover pose.
   // Aim down-facing toes BEFORE the 90° whole-body pitch; this makes
   // the actual shoe soles face upward once Voight lies prone.
   for(const j of pose)j.node.rotationQuaternion=base.get(j.name)!.clone();
   const soleLocal=new Map<string,Vector3>();
   for(const side of ["Left","Right"] as const){
    const foot=nodes.get(side+"Foot")!;
    foot.computeWorldMatrix(true);
    soleLocal.set(side,Vector3.TransformNormal(Vector3.Down(),
      Matrix.Invert(foot.getWorldMatrix())).normalize());
   }
   try{
    for(const side of ["Left","Right"] as const){
     const upper=nodes.get(side+"Arm")!,elbow=nodes.get(side+"ForeArm")!;
     const target=reference(side+"ForeArm").add(lateral.scale(
      (side==="Left"?-1:1)*baseline.shoulderSpan*FAST_ARM_OPEN_FRACTION_129));
     if(!applyAimStep(upper,elbow,target,.72))
      throw Error("CHAR129 fast "+side+" arm aim failed");
    }
    for(const side of ["Left","Right"] as const){
     const ankle=nodes.get(side+"Foot")!,toe=nodes.get(side+"ToeBase")!;
     const footOrigin=reference(side+"Foot");
     const length=Vector3.Distance(footOrigin,reference(side+"ToeBase"));
     if(!(length>1e-5))throw Error("CHAR129 fast "+side+" shoe collapsed");
     // Under a 90° forward body pitch, toes-down becomes toes-back and
     // plantar surface points to the sky (rather than at the pavement).
     const goal=Vector3.Down().scale(.99).add(forward.scale(.10)).normalize();
     if(!applyAimStep(ankle,toe,footOrigin.add(goal.scale(length)),1.70))
      throw Error("CHAR129 fast "+side+" foot aim failed");
    }
    const geo=captureNativeFlightGeometry129(nodes,anchor);
    if(!laneSafe(geo,baseline)||
       geo.wristSeparation<hoverGeometry.wristSeparation*1.03)
      throw Error("CHAR129 fast arm spread or bilateral lanes invalid");
    // Measure actual linked sole-reference normals AFTER temporarily
    // simulating full body pitch, rather than inferring sole direction from
    // an unrotated toe. This never touches the Rapier root.
    flightPivot.rotation.x=MAX_FAST_PITCH_RAD;
    try{
     const soleDot=(side:"Left"|"Right")=>{
      const foot=nodes.get(side+"Foot")!;
      foot.computeWorldMatrix(true);
      return Vector3.Dot(Vector3.TransformNormal(soleLocal.get(side)!,
       foot.getWorldMatrix()).normalize(),Vector3.Up());
     };
     fastSoleUpLeft=soleDot("Left");
     fastSoleUpRight=soleDot("Right");
    }finally{
     flightPivot.rotation.x=0;
    }
    if(fastSoleUpLeft<.55||fastSoleUpRight<.55)
     throw Error("CHAR129 fast shoes do not face sky: "+
      fastSoleUpLeft.toFixed(2)+"/"+fastSoleUpRight.toFixed(2));
    for(const name of ["LeftArm","RightArm","LeftFoot","RightFoot"])
     fastTargets.set(name,rotationOf(nodes.get(name)!));
    fastCalibrated=true;
   }catch(fastError){
    fastTargets.clear();fastCalibrated=false;
    fastCalibrationIssue=fastError instanceof Error?fastError.message:String(fastError);
    fastSoleUpLeft=0;fastSoleUpRight=0;
   }
  }catch(error){
   calibrationIssue=error instanceof Error?error.message:String(error);
   idleTargets.clear();hoverGeometry=null;
   fastTargets.clear();fastCalibrated=false;
   kneeFlexionGainDegrees=0;rightFootLiftFraction=0;rightKneeAdvanceFraction=0;
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
   // Calibrated hover begins bent on the FIRST airborne frame.
   hoverWeight=calibrated?1:0;
   if(calibrated)for(const joint of pose){
    const desired=idleTargets.get(joint.name);
    if(desired)joint.node.rotationQuaternion=desired.clone();
   }
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
  // Microfloat is exclusive to stationary idle; the upright anatomical
  // pose persists across takeoff, ascent, descent and directional hovering.
  const targetIdle=clip==="flyIdle"?1:0;
  idleWeight+=clamp(targetIdle-idleWeight,-step/FLY_IDLE_BLEND_SECONDS_129,
   step/FLY_IDLE_BLEND_SECONDS_129);
  const targetHover=clip==="fly"||!calibrated?0:1;
  hoverWeight+=clamp(targetHover-hoverWeight,-step/.17,step/.17);
  const targetFast=clip==="fly"&&fastCalibrated?1:0;
  fastWeight+=clamp(targetFast-fastWeight,
   -step/FAST_POSE_BLEND_SECONDS_129,step/FAST_POSE_BLEND_SECONDS_129);
  const headTarget=clip==="fly"?0:input.ascending?1:input.descending?-1:0;
  headPitchDirection+=clamp(headTarget-headPitchDirection,-step/.20,step/.20);
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
   let desired=idleTarget&&hoverWeight>0?
    Quaternion.Slerp(j.rest,idleTarget,hoverWeight).normalize():j.rest;
   const fastTarget=fastTargets.get(j.name);
   if(fastTarget&&fastWeight>0)
    desired=Quaternion.Slerp(desired,fastTarget,fastWeight).normalize();
   if(j.name==="Neck"&&calibrated){
    const headTarget=headPitchDirection>0?upHead:downHead;
    if(headTarget)desired=Quaternion.Slerp(j.rest,headTarget,
      Math.abs(headPitchDirection)*hoverWeight).normalize();
   }
   if(Math.abs(Quaternion.Dot(current,desired))<.999999)
    j.node.rotationQuaternion=desired.clone();
  }
  maxDeviation=Math.max(maxDeviation,deviation);
  // Only compare geometry when fully upright: a tilted visual frame is
  // intentionally different from baseline in actor coordinates.
  if(frames%30===0&&Math.abs(pitch)<.0001&&baseline){
   const current=captureNativeFlightGeometry129(nodes,anchor);
   const matchBaseline=hoverWeight<.0001&&equivalent(baseline,current);
   const matchIdle=hoverWeight>.9999&&(
    calibrated&&hoverGeometry!==null?
      equivalent(hoverGeometry,current):equivalent(baseline,current));
   const validTransition=hoverWeight>.0001&&hoverWeight<.9999&&
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
    idleCalibrated:calibrated,idleCalibrationIssue:calibrationIssue,
    idleKneeFlexionGainDegrees:kneeFlexionGainDegrees,
    idleRightFootLiftFraction:rightFootLiftFraction,
    idleRightKneeAdvanceFraction:rightKneeAdvanceFraction,
    idleRightToeDownDot:rightToeDownDot,
    idleRightFootAboveLeftFraction:rightFootAboveLeftFraction,
    headPitchDirection,hoverWeight,fastWeight,fastCalibrated,
    fastCalibrationIssue,hoverLeftToeDownGain,fastSoleUpLeft,fastSoleUpRight};
  },
  dispose(){leave();disposed=true;status="disposed";pose.length=0;}
 };
}
