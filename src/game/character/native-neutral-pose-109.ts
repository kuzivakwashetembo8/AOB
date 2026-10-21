/**
 * CHAR-109: persistent native-skeleton neutral pose for glTF characters.
 * Babylon's glTF loader links bones to TransformNodes. Manipulating a Bone
 * alone is overwritten by the linked node on skeleton.prepare(). Keep the
 * source skin weights, upper-body mesh vertices and bind matrices intact.
 */
import {Quaternion,Vector3,TransformNode} from "@babylonjs/core";
import type {Skeleton} from "@babylonjs/core";
import {parentSpaceAimDelta,rotationOf} from "./driver-joint-space";

export type NativePose109Report={
  status:"native-joints"|"not-ready"|"rejected";
  applied:string[];reason:string|null;restored:number;
};
export type NativePose109Controller={
  readonly report:NativePose109Report;
  ensure():void;
  dispose():void;
};
const normal=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,"");
const near=(a:Quaternion,b:Quaternion)=>
  Math.abs(Quaternion.Dot(a,b))>.999999;
export type ArmNeutral109={side:"left"|"right";upper:TransformNode;forearm:TransformNode};
export function findLinkedArms109(skeletons:readonly Skeleton[]):ArmNeutral109[]{
 const arms:ArmNeutral109[]=[];
 for(const skeleton of skeletons){
  for(const side of ["left","right"] as const){
   const upper=skeleton.bones.find(b=>normal(b.name)===side+"arm");
   const forearm=skeleton.bones.find(b=>normal(b.name)===side+"forearm");
   if(!upper||!forearm)continue;
   let anc=forearm.getParent(),linked=false;
   for(let i=0;anc&&i<8;i++,anc=anc.getParent()){
     if(anc===upper){linked=true;break;}
   }
   if(!linked)continue;
   // glTF linked nodes are authoritative for both the animation and skin.
   const up=upper.getTransformNode(),down=forearm.getTransformNode();
   if(up&&down)arms.push({side,upper:up,forearm:down});
  }
 }
 return arms;
}
/** The target is an anatomically relaxed arm, with a small natural lateral cant.
 * Everything is solved in the parent joint's LOCAL frame, never using mesh
 * bounding-box percentages or a global Bone.rotate call.
 */
export function neutralArmDelta109(
 directionWorld:Vector3,targetWorld:Vector3,parent:TransformNode,
 maxRadians=2.15,
):Quaternion|null{
 parent.computeWorldMatrix(true);
 return parentSpaceAimDelta(directionWorld,targetWorld,parent.getWorldMatrix(),maxRadians);
}
export function createNativePoseController109(skeletons:readonly Skeleton[]):NativePose109Controller{
 const candidates=findLinkedArms109(skeletons);
 const stored:{node:TransformNode;target:Quaternion;original:Quaternion}[]=[];
 const applied:string[]=[];
 const hands=new Map<string,TransformNode>();
 for(const skel of skeletons)for(const bone of skel.bones){
  const node=bone.getTransformNode();
  if(node)hands.set(normal(bone.name),node);
 }
 let reason:string|null=null,restored=0;
 if(candidates.length!==2)reason="source joints lack two linked LeftArm/RightArm and forearms";
 for(const arm of candidates){
   const parent=arm.upper.parent;
   if(!(parent instanceof TransformNode)){reason="missing linked arm transform parent";continue;}
   // Refresh Babylon's linked node hierarchy before measuring actual rest
   // shoulder->elbow direction. No skeleton-space/world-space confusion.
   parent.computeWorldMatrix(true);
   arm.upper.computeWorldMatrix(true);
   arm.forearm.computeWorldMatrix(true);
   const shoulder=arm.upper.getAbsolutePosition().clone();
   const elbow=arm.forearm.getAbsolutePosition().clone();
   const current=elbow.subtract(shoulder);
   if(current.lengthSquared()<1e-8){reason="invalid shoulder-to-elbow bind vector";continue;}
   // Keep the accepted palm orientation as a reference before adjusting the
   // elbow/forearm. Derive outward from real shoulder locations, not name sign.
   const hand=hands.get(arm.side+"hand");
   const other=candidates.find(c=>c.side!==arm.side);
   const original=rotationOf(arm.upper);
   const legacyTarget=new Vector3(arm.side==="left"?-.10:.10,-1,0).normalize();
   const legacyDelta=neutralArmDelta109(current,legacyTarget,parent,2.15);
   let palmWorld:import("@babylonjs/core").Matrix|null=null;
   if(hand&&hand.parent===arm.forearm&&legacyDelta){
    arm.upper.rotationQuaternion=legacyDelta.multiply(original).normalize();
    hand.computeWorldMatrix(true);palmWorld=hand.getWorldMatrix().clone();
    arm.upper.rotationQuaternion=original;arm.upper.computeWorldMatrix(true);
   }
   other?.upper.computeWorldMatrix(true);
   const outward=other?shoulder.subtract(other.upper.getAbsolutePosition()):new Vector3(arm.side==="left"?-1:1,0,0);
   outward.y=0;outward.normalize();
   const target=outward.scale(.24).add(new Vector3(0,-1,0)).normalize();
   const delta=neutralArmDelta109(current,target,parent,2.15);
   if(!delta){reason="joint-parent transform is not a safe rotation frame";continue;}
   const desired=delta.multiply(original).normalize();
   arm.upper.rotationQuaternion=desired;
   arm.upper.computeWorldMatrix(true);
   arm.forearm.computeWorldMatrix(true);
   const next=arm.forearm.getAbsolutePosition().subtract(arm.upper.getAbsolutePosition());
   const before=Vector3.Dot(current.normalize(),target);
   const after=next.lengthSquared()>1e-8?Vector3.Dot(next.normalize(),target):-1;
   // A bad handedness/parity or linked hierarchy must fail closed.
   if(!Number.isFinite(after)||after+1e-5<before){
     arm.upper.rotationQuaternion=original;
     arm.upper.computeWorldMatrix(true);
     reason="joint aim increased anatomical error";continue;
   }
   stored.push({node:arm.upper,target:desired.clone(),original:original.clone()});
   applied.push(arm.side+"Arm");
   if(hand&&hand.parent===arm.forearm&&palmWorld&&hand.position.lengthSquared()>1e-8){
    const forearmOriginal=rotationOf(arm.forearm),handOriginal=rotationOf(hand);
    // CHAR-117: articulate the elbow rather than rolling the sleeve around
    // an almost straight arm. A small forward bend and a narrower forearm
    // cant leave the elbow outside the waist without spreading the wrists.
    hand.computeWorldMatrix(true);
    const wristDirection=hand.getAbsolutePosition().subtract(arm.forearm.getAbsolutePosition());
    const across=outward.clone();
    // The shoulder parent carries actor yaw; derive forward in that frame.
    const shoulderParent=parent.parent;
    const forward=shoulderParent instanceof TransformNode
      ?Vector3.TransformNormal(Vector3.Forward(),shoulderParent.getWorldMatrix()).normalize()
      :Vector3.Forward();
    forward.y=0;forward.normalize();
    const forearmDirection=across.scale(.08).add(new Vector3(0,-1,0)).add(forward.scale(.20)).normalize();
    const elbowDelta=neutralArmDelta109(wristDirection,forearmDirection,arm.upper,.65);
    if(!elbowDelta){reason="cannot solve relaxed elbow frame";applied.pop();continue;}
    const forearmTarget=elbowDelta.multiply(forearmOriginal).normalize();
    arm.forearm.rotationQuaternion=forearmTarget;
    arm.forearm.computeWorldMatrix(true);
    const local=palmWorld.multiply(arm.forearm.getWorldMatrix().clone().invert());
    const scale=new Vector3(),handTarget=Quaternion.Identity(),position=new Vector3();
    if(!local.decompose(scale,handTarget,position)){
     arm.forearm.rotationQuaternion=forearmOriginal;
     reason="cannot preserve relaxed palm frame";applied.pop();
    }else{
     hand.rotationQuaternion=handTarget.normalize();
     stored.push({node:arm.forearm,target:forearmTarget,original:forearmOriginal},
      {node:hand,target:handTarget.clone(),original:handOriginal});
    }
   }
 }
 if(applied.length!==2){
   // Never leave only one arm corrected if the other joint failed calibration.
   for(const item of stored)item.node.rotationQuaternion=item.original.clone();
   for(const skeleton of skeletons)skeleton.prepare();
   stored.length=0;
   applied.length=0;
 }
 for(const skeleton of skeletons)skeleton.prepare();
 const report:NativePose109Report={
  status:applied.length===2?"native-joints":"rejected",
  applied,reason:applied.length===2?null:reason??"neutral arm correction incomplete",restored:0
 };
 return {
  get report(){return {...report,applied:[...applied],restored};},
  ensure(){
   if(report.status!=="native-joints")return;
   let changed=false;
   for(const item of stored){
     if(!item.node.isDisposed()&&!near(rotationOf(item.node),item.target)){
       item.node.rotationQuaternion=item.target.clone();
       restored++;changed=true;
     }
   }
   // No skeletal work on a normal frame; groups in this GLB are empty.
   // If a future animation resets the joints, ensure() reapplies the neutral
   // quaternion without accumulating another offset.
   if(changed)for(const skeleton of skeletons)skeleton.prepare();
  },
  dispose(){stored.length=0;}
 };
}

