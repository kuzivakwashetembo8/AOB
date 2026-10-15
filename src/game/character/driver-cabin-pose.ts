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
function aim(
  from: PositionedBone, next: PositionedBone, to: Vector3,
  maxRadians=0.45,
) {
  const node=from.getTransformNode();
  if(!node)return false;
  const a=boneWorld(from),b=boneWorld(next);
  if(!a||!b)return false;
  const original=b.subtract(a),desired=to.subtract(a);
  const len=original.length(),targetLen=desired.length();
  if(len<0.015||targetLen<0.015)return false;
  original.scaleInPlace(1/len);desired.scaleInPlace(1/targetLen);
  const dot=clamp(Vector3.Dot(original,desired),-1,1);
  const theta=Math.min(maxRadians,Math.acos(dot));
  if(theta<0.0004)return false;
  const worldAxis=Vector3.Cross(original,desired);
  if(worldAxis.lengthSquared()<1e-9)return false;
  worldAxis.normalize();
  // Rotate in the joint parent's local space, not in Ferrari or Babylon world
  // coordinates: the imported glTF bones are nested and frequently pre-rotated.
  const parent=node.parent;
  const inv=parent ? parent.getWorldMatrix().clone().invert() : Matrix.Identity();
  const localAxis=Vector3.TransformNormal(worldAxis,inv);
  if(localAxis.lengthSquared()<1e-8)return false;
  localAxis.normalize();
  const delta=Quaternion.RotationAxis(localAxis,theta);
  const base=node.rotationQuaternion?.clone() ??
    Quaternion.FromEulerAngles(node.rotation.x,node.rotation.y,node.rotation.z);
  node.rotationQuaternion=delta.multiply(base).normalize();
  node.computeWorldMatrix(true);
  return true;
}
type JointChain = [DriverLimbRole,DriverLimbRole,DriverLimbRole];
function solveChain(
  bones: ReturnType<typeof findDriverBones>["found"],
  chain: JointChain, target: Vector3,
):boolean {
  const [root,mid,end]=chain.map(r=>bones[r]);
  if(!root||!mid||!end)return false;
  const a=boneWorld(root),b=boneWorld(mid),c=boneWorld(end);
  if(!a||!b||!c)return false;
  // Prevent impossible limb reach and violent retargeting on foreign rigs.
  const length=a.subtract(b).length()+b.subtract(c).length();
  const reach=target.subtract(a).length();
  if(length<0.15||reach>length*1.07)return false;
  for(let k=0;k<5;k++){
    aim(mid,end,target,0.22);
    aim(root,end,target,0.19);
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
  const cachedBaseline=new Map<TransformNode,Quaternion>();
  const zero=():DriverContactState=>({
    enabled,status:enabled?"missing-wheel":"disabled",appliedLimbs:[],
    missing:[...mapped.missing],targets:{},actual:{},errorMetres:{},
  });
  let state=zero();
  const linkedNodes=[...new Set(Object.values(mapped.found).map(b=>b?.getTransformNode())
    .filter((n):n is TransformNode=>n instanceof TransformNode))];
  // Listener is active only when used; no work during walking/flight.
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
    const plannedTargets=planDriverContactTargets({
      leftHip:hipL,rightHip:hipR,leftHand:handL,rightHand:handR,
      wheelCenter:wheel.center,wheelRadius:wheel.radius,
      vehicleFloorY:cabin.position.y,
    });
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
        if(attempted && error<=0.06)appliedLimbs.push(limb.role);
      }
    }
    const unresolved=Object.entries(errorMetres)
      .some(([,error])=>error>0.06);
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
      cabin=next;wheelNode=active&&next?findWheelMesh(next):null;
      correctionMode=mode;enabled=active;state=zero();
    },
    report:()=>({...state,correctionMode,sourceBones:Object.entries(mapped.found)
      .map(([role,bone])=>({role,name:bone?.name,linked:!!bone?.getTransformNode()})),
      skeletonName:skeleton.name,witnessName:witness.name}),
    dispose(){
      scene.onBeforeRenderObservable.remove(observer);
      cabin=null;wheelNode=null;enabled=false;cachedBaseline.clear();
    },
  };
}
