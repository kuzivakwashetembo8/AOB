/**
 * GTD-VEH-FIT-002 G1/G2 — compact, driving-only two-link pose adapter.
 * Keeps the accepted torso root and imported Driving_Loop. This modifies
 * actual UAL linked joint transforms after animation evaluation each render;
 * it never creates a replacement character, keyframe or physics collider.
 * For unknown rigs or an absent real steering mesh it fails closed.
 */
import {
  AbstractMesh, Matrix, Quaternion, Scene, TransformNode, Vector3,
} from "@babylonjs/core";
import type { Mesh, Skeleton, Observer } from "@babylonjs/core";
import { findDriverBones, type DriverLimbRole } from "./driver-limb-landmarks";
import { applyAimStep, rotationOf } from "./driver-joint-space";

export type DriverContactState = {
  enabled: boolean;
  status: "disabled" | "missing-rig" | "missing-wheel" | "active" | "out-of-tolerance";
  appliedLimbs: string[];
  missing: string[];
  targets: Record<string, {x:number;y:number;z:number}>;
  actual: Record<string, {x:number;y:number;z:number}>;
  errorMetres: Record<string, number>;
};
const point=(v: Vector3)=>({x:v.x,y:v.y,z:v.z});
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
function findWheelMesh(anchor:TransformNode): AbstractMesh|null {
  const node=anchor.getDescendants(false).find(n=>
    n instanceof AbstractMesh && n.getTotalVertices()>0 &&
    /steer.{0,12}wheel|steering|volante/i.test(n.name));
  return node instanceof AbstractMesh ? node : null;
}
function wheelLandmark(m:AbstractMesh|null) {
  if(!m)return null;
  m.computeWorldMatrix(true);
  const bounds=m.getBoundingInfo().boundingBox;
  const radius=Math.max(bounds.extendSizeWorld.x,
    bounds.extendSizeWorld.y,bounds.extendSizeWorld.z);
  if(!Number.isFinite(radius)||radius<0.08||radius>0.5)return null;
  return {center:bounds.centerWorld.clone(),radius};
}
/** Deterministic, testable target geometry from the live UAL hip/wrist
 * positions and the real Ferrari rim. Never extend feet past the wheel.
 */
export function planDriverContactTargets(args:{
  leftHip:Vector3;rightHip:Vector3;leftHand:Vector3;rightHand:Vector3;
  wheelCenter:Vector3;wheelRadius:number;vehicleFloorY:number;
}) {
  const {leftHip,rightHip,leftHand,rightHand,wheelCenter,wheelRadius,vehicleFloorY}=args;
  const midpoint=leftHip.add(rightHip).scale(0.5);
  const forward=wheelCenter.subtract(midpoint);forward.y=0;
  if(forward.lengthSquared()<0.01||!Number.isFinite(wheelRadius)||wheelRadius<=0)
    return null;
  forward.normalize();
  const footY=Math.max(vehicleFloorY+0.22,midpoint.y-0.22);
  const leftFoot=leftHip.add(forward.scale(0.37));
  const rightFoot=rightHip.add(forward.scale(0.37));
  leftFoot.y=footY;
  rightFoot.y=footY;
  function nearestRim(hand:Vector3,hip:Vector3) {
    const toward=hand.subtract(wheelCenter);toward.y=0;
    if(toward.lengthSquared()<0.003){
      toward.copyFrom(hip.subtract(wheelCenter));toward.y=0;
    }
    if(toward.lengthSquared()<0.003) toward.copyFrom(forward.negate());
    toward.normalize();
    const target=wheelCenter.add(toward.scale(wheelRadius*0.92));
    target.y=wheelCenter.y-0.045;
    return target;
  }
  return {
    leftFoot,rightFoot,
    leftHand:nearestRim(leftHand,leftHip),
    rightHand:nearestRim(rightHand,rightHip),
  };
}

type PositionedBone = {name:string; getTransformNode():TransformNode|null};
function boneWorld(b:PositionedBone):Vector3|null {
  const node=b.getTransformNode();
  if(!node)return null;
  node.computeWorldMatrix(true);
  return node.getAbsolutePosition().clone();
}
type JointChain = [DriverLimbRole,DriverLimbRole,DriverLimbRole];
/** Return true only on a converged, finite candidate. Any failed chain is
 * rolled back to its animation-only baseline; no outward limb deformation. */
function solveChain(
  bones: ReturnType<typeof findDriverBones>["found"],
  chain: JointChain,target:Vector3,
):boolean {
  const [root,mid,end]=chain.map(r=>bones[r]);
  if(!root||!mid||!end)return false;
  const a=root.getTransformNode(),b=mid.getTransformNode(),c=end.getTransformNode();
  if(!a||!b||!c)return false;
  a.computeWorldMatrix(true);b.computeWorldMatrix(true);c.computeWorldMatrix(true);
  const limbLength=Vector3.Distance(a.getAbsolutePosition(),b.getAbsolutePosition())+
    Vector3.Distance(b.getAbsolutePosition(),c.getAbsolutePosition());
  const reach=Vector3.Distance(a.getAbsolutePosition(),target);
  if(!Number.isFinite(reach)||limbLength<0.15||reach>limbLength+0.001)return false;
  const originalA=rotationOf(a),originalB=rotationOf(b);
  const before=Vector3.Distance(c.getAbsolutePosition(),target);
  for(let i=0;i<10;i++){
    if(Vector3.Distance(c.getAbsolutePosition(),target)<=0.02)break;
    applyAimStep(b,c,target,0.15);
    applyAimStep(a,c,target,0.15);
  }
  c.computeWorldMatrix(true);
  const after=Vector3.Distance(c.getAbsolutePosition(),target);
  if(!Number.isFinite(after)||after>0.02||after>before+1e-4){
    a.rotationQuaternion=originalA;
    b.rotationQuaternion=originalB;
    c.computeWorldMatrix(true);
    return false;
  }
  return true;
}
/** Returns driver-only observer with explicit lifetime; no per-frame scene searches. */
export function createDriverCabinPose(scene:Scene,skeleton:Skeleton,witness:Mesh,
  characterRoot:TransformNode) {
  const mapped=findDriverBones(skeleton);
  let cabin:TransformNode|null=null;
  let wheelNode:AbstractMesh|null=null;
  let enabled=false;
  let correctionMode: "feet"|"hands"|"both" = "both";
  let cachedLocalTargets:ReturnType<typeof planDriverContactTargets>|null=null;
  const cachedBaseline=new Map<TransformNode,Quaternion>();
  const zero=():DriverContactState=>({
    enabled,status:enabled?"missing-wheel":"disabled",appliedLimbs:[],
    missing:[...mapped.missing],targets:{},actual:{},errorMetres:{},
  });
  let state=zero();
  const linkedNodes=[...new Set(Object.values(mapped.found).map(b=>b?.getTransformNode())
    .filter((n):n is TransformNode=>n instanceof TransformNode))];
  // Listener is active only when used; no work during walking/flight.
  // Undo the prior frame's procedural pose BEFORE Babylon evaluates Driving_Loop.
  // This also protects tracks which are not keyed every animation frame.
  const beforeAnimation=scene.onBeforeAnimationsObservable.add(()=>{
    if(!enabled)return;
    for(const [node,original] of cachedBaseline)node.rotationQuaternion=original.clone();
    cachedBaseline.clear();
  });
  const observer:Observer<Scene>=scene.onBeforeRenderObservable.add(()=>{
    if(!enabled||!cabin)return;
    if(!mapped.found.leftThigh||!mapped.found.rightThigh||
      !mapped.found.leftHand||!mapped.found.rightHand) {
      state={...zero(),status:"missing-rig"};return;
    }
    if(!Number.isFinite(characterRoot.getAbsolutePosition().y)) {
      state={...zero(),status:"out-of-tolerance"};return;
    }
    const wheel=wheelLandmark(wheelNode);
    if(!wheel){state={...zero(),status:"missing-wheel"};return;}
    const hipL=mapped.found.leftThigh?boneWorld(mapped.found.leftThigh):null;
    const hipR=mapped.found.rightThigh?boneWorld(mapped.found.rightThigh):null;
    const handL=mapped.found.leftHand?boneWorld(mapped.found.leftHand):null;
    const handR=mapped.found.rightHand?boneWorld(mapped.found.rightHand):null;
    if(!hipL||!hipR||!handL||!handR) {
      state={...zero(),status:"missing-rig"};return;
    }
    // Driver's actual pelvis, not the standing character root or the wheel,
    // determines where the forward pedals can be reached. The previous
    // wheel + forward*0.18 position was 1.0–1.3 m from the animated feet.
    // Contact targets are captured once in the Ferrari's own local frame.
    // Recomputing from already-corrected hands causes moving-target feedback.
    cabin.computeWorldMatrix(true);
    if(!cachedLocalTargets){
      const initial=planDriverContactTargets({
        leftHip:hipL,rightHip:hipR,leftHand:handL,rightHand:handR,
        wheelCenter:wheel.center,wheelRadius:wheel.radius,
        vehicleFloorY:cabin.position.y,
      });
      if(initial){
        const inverse=cabin.getWorldMatrix().clone().invert();
        cachedLocalTargets={
          leftFoot:Vector3.TransformCoordinates(initial.leftFoot,inverse),
          rightFoot:Vector3.TransformCoordinates(initial.rightFoot,inverse),
          leftHand:Vector3.TransformCoordinates(initial.leftHand,inverse),
          rightHand:Vector3.TransformCoordinates(initial.rightHand,inverse),
        };
      }
    }
    const plannedTargets=cachedLocalTargets?{
      leftFoot:Vector3.TransformCoordinates(cachedLocalTargets.leftFoot,cabin.getWorldMatrix()),
      rightFoot:Vector3.TransformCoordinates(cachedLocalTargets.rightFoot,cabin.getWorldMatrix()),
      leftHand:Vector3.TransformCoordinates(cachedLocalTargets.leftHand,cabin.getWorldMatrix()),
      rightHand:Vector3.TransformCoordinates(cachedLocalTargets.rightHand,cabin.getWorldMatrix()),
    }:null;
    if(!plannedTargets) {
      state={...zero(),status:"out-of-tolerance"};return;
    }
    const {leftFoot:leftFootTarget,rightFoot:rightFootTarget,
      leftHand:leftGrip,rightHand:rightGrip}=plannedTargets;

    // Snapshots allow complete restoration when player leaves vehicle.
    cachedBaseline.clear();
    for(const node of linkedNodes) {
      cachedBaseline.set(node,node.rotationQuaternion?.clone() ??
        Quaternion.FromEulerAngles(node.rotation.x,node.rotation.y,node.rotation.z));
    }
    const desired=[
      {role:"leftFoot",chain:["leftThigh","leftCalf","leftFoot"] as JointChain,to:leftFootTarget},
      {role:"rightFoot",chain:["rightThigh","rightCalf","rightFoot"] as JointChain,to:rightFootTarget},
      {role:"leftHand",chain:["leftUpperArm","leftForearm","leftHand"] as JointChain,to:leftGrip},
      {role:"rightHand",chain:["rightUpperArm","rightForearm","rightHand"] as JointChain,to:rightGrip},
    ];
    const appliedLimbs:string[]=[];
    const targets:DriverContactState["targets"]={};
    const actual:DriverContactState["actual"]={};
    const errorMetres:DriverContactState["errorMetres"]={};
    for(const limb of desired) {
      if(correctionMode==="feet"&&limb.role.endsWith("Hand"))continue;
      if(correctionMode==="hands"&&limb.role.endsWith("Foot"))continue;
      targets[limb.role]=point(limb.to);
      const attempted=solveChain(mapped.found,limb.chain,limb.to);
      const tip=mapped.found[limb.chain[2]];
      const current=tip?boneWorld(tip):null;
      if(current) {
        actual[limb.role]=point(current);
        const error=Vector3.Distance(current,limb.to);
        errorMetres[limb.role]=error;
        // Attempting an IK solve is NOT equivalent to making contact.
        if(attempted && error<=0.02)appliedLimbs.push(limb.role);
      }
    }
    const unresolved=Object.entries(errorMetres)
      .some(([,error])=>error>0.02);
    state={enabled:true,status:unresolved?"out-of-tolerance":"active",
      appliedLimbs,missing:[...mapped.missing],targets,actual,errorMetres};
  });
  return {
    setCabin(next:TransformNode|null,active:boolean,
      mode:"feet"|"hands"|"both"="both"){
      if(!active||!next){
        for(const [node,rotation] of cachedBaseline) {
          node.rotationQuaternion=rotation.clone();
        }
        cachedBaseline.clear();
      }
      if(cabin!==next||correctionMode!==mode||enabled!==active)cachedLocalTargets=null;
      cabin=next;wheelNode=active&&next?findWheelMesh(next):null;
      correctionMode=mode;enabled=active;state=zero();
    },
    report:()=>({...state,correctionMode,sourceBones:Object.entries(mapped.found)
      .map(([role,bone])=>({role,name:bone?.name,linked:!!bone?.getTransformNode()})),
      skeletonName:skeleton.name,witnessName:witness.name}),
    dispose(){
      scene.onBeforeRenderObservable.remove(observer);
      scene.onBeforeAnimationsObservable.remove(beforeAnimation);
      cabin=null;wheelNode=null;enabled=false;cachedBaseline.clear();cachedLocalTargets=null;
    },
  };
}
