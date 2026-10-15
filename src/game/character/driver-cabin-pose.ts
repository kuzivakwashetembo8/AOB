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
  status: "disabled" | "missing-rig" | "missing-wheel" | "active";
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
    const wheel=wheelLandmark(wheelNode);
    if(!wheel){state={...zero(),status:"missing-wheel"};return;}
    const rootPos=characterRoot.getAbsolutePosition();
    const toward=wheel.center.subtract(rootPos);toward.y=0;
    if(toward.length()<0.08)return;
    toward.normalize();
    const right=new Vector3(Math.cos(cabin.rotation.y),0,-Math.sin(cabin.rotation.y));
    // Retarget feet *forward* of hips, well inside the lower Ferrari cockpit.
    // Physical floor is not assumed: the target is bounded above the
    // imported car's normalized lowest body point and is subject to G4 review.
    const footBase=wheel.center.add(toward.scale(0.18));
    footBase.y=cabin.position.y+0.32;
    const leftFootTarget=footBase.add(right.scale(-0.14));
    const rightFootTarget=footBase.add(right.scale(0.14));
    const leftGrip=wheel.center.add(right.scale(-wheel.radius*0.70));
    const rightGrip=wheel.center.add(right.scale(wheel.radius*0.70));
    leftGrip.y+=wheel.radius*0.10;
    rightGrip.y+=wheel.radius*0.10;

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
      if(solveChain(mapped.found,limb.chain,limb.to))appliedLimbs.push(limb.role);
      const tip=mapped.found[limb.chain[2]];
      const current=tip?boneWorld(tip):null;
      if(current){
        actual[limb.role]=point(current);
        errorMetres[limb.role]=Vector3.Distance(current,limb.to);
      }
    }
    state={enabled:true,status:"active",appliedLimbs,missing:[...mapped.missing],
      targets,actual,errorMetres};
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
