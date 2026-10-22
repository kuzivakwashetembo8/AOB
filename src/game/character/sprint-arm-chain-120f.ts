/** CHAR-120F: anatomical two-segment arm transfer. Source directions define
 * a reachable wrist target AND an elbow pole using the target's own lengths.
 * Joint frames are measured from CHAR-109 neutral, never guessed Euler axes.
 */
import {Matrix,Quaternion,TransformNode,Vector3} from "@babylonjs/core";
import {parentSpaceAimDelta,rotationOf} from "./driver-joint-space";

export type SprintArmMotion120F={schema:"gtd.char120.arm-directions.v1";
 frame:"pelvis";left:number[][];right:number[][]};
const perpendicular=(a:Vector3,b:Vector3)=>b.subtract(a.scale(Vector3.Dot(a,b))).normalize();
function frame(upper:Vector3,lower:Vector3):Quaternion|null{
 const x=upper.normalizeToNew(),y=perpendicular(x,lower);
 if(x.lengthSquared()<.99||y.lengthSquared()<.99)return null;
 const z=Vector3.Cross(x,y).normalize();
 const m=Matrix.Identity();Matrix.FromXYZAxesToRef(x,y,z,m);
 return Quaternion.FromRotationMatrix(m).normalize();
}
export function createSprintArmChain120F(hips:TransformNode,arm:TransformNode,
 elbow:TransformNode,hand:TransformNode){
 if(!(arm.parent instanceof TransformNode)||elbow.parent!==arm||hand.parent!==elbow)
  throw Error("CHAR120F unsupported arm hierarchy");
 const parent=arm.parent,neutralArm=rotationOf(arm),neutralElbow=rotationOf(elbow);
 return (key:number[],blend:number)=>{
  if(key.length!==6||key.some(x=>!Number.isFinite(x))||!Number.isFinite(blend))return false;
  const strength=Math.max(0,Math.min(1,blend));if(strength===0)return true;
  const originalArm=rotationOf(arm),originalElbow=rotationOf(elbow);
  const restore=()=>{arm.rotationQuaternion=originalArm;elbow.rotationQuaternion=originalElbow;
   arm.computeWorldMatrix(true);elbow.computeWorldMatrix(true);hand.computeWorldMatrix(true);return false;};
  // Solve a complete pose before blending. Starting from captured neutral
  // removes the old sprint mean inversion, prevents drift and defines twist.
  arm.rotationQuaternion=neutralArm.clone();elbow.rotationQuaternion=neutralElbow.clone();
  hips.computeWorldMatrix(true);parent.computeWorldMatrix(true);
  arm.computeWorldMatrix(true);elbow.computeWorldMatrix(true);hand.computeWorldMatrix(true);
  const shoulder=arm.getAbsolutePosition().clone(),e=elbow.getAbsolutePosition().clone(),w=hand.getAbsolutePosition().clone();
  const u=e.subtract(shoulder),v=w.subtract(e),l1=u.length(),l2=v.length();
  if(l1<.001||l2<.001)return restore();
  const body=hips.getWorldMatrix(),parentWorld=parent.getWorldMatrix(),inverse=Matrix.Invert(parentWorld);
  const desiredUpper=Vector3.TransformNormal(Vector3.FromArray(key,0),body).normalize();
  const desiredLower=Vector3.TransformNormal(Vector3.FromArray(key,3),body).normalize();
  // Reuse the shared parity/uniform-scale guard before frame construction.
  if(!parentSpaceAimDelta(u,desiredUpper,parentWorld,Math.PI))return restore();
  const currentFrame=frame(Vector3.TransformNormal(u,inverse),Vector3.TransformNormal(v,inverse));
  const desiredFrame=frame(Vector3.TransformNormal(desiredUpper,inverse),Vector3.TransformNormal(desiredLower,inverse));
  if(!currentFrame||!desiredFrame)return restore();
  const delta=desiredFrame.multiply(Quaternion.Inverse(currentFrame)).normalize();
  const solvedArm=delta.multiply(neutralArm).normalize();
  arm.rotationQuaternion=solvedArm;arm.computeWorldMatrix(true);elbow.computeWorldMatrix(true);hand.computeWorldMatrix(true);
  const lowerNow=hand.getAbsolutePosition().subtract(elbow.getAbsolutePosition());
  const bend=parentSpaceAimDelta(lowerNow,desiredLower,arm.getWorldMatrix(),Math.PI);
  if(!bend)return restore();
  const solvedElbow=bend.multiply(neutralElbow).normalize();
  elbow.rotationQuaternion=solvedElbow;elbow.computeWorldMatrix(true);hand.computeWorldMatrix(true);
  const elbowTarget=shoulder.add(desiredUpper.scale(l1));
  const wristTarget=elbowTarget.add(desiredLower.scale(l2));
  // Absolute positional gate, not simply "closer than before".
  const tolerance=(l1+l2)*.002;
  if(Vector3.Distance(elbow.getAbsolutePosition(),elbowTarget)>tolerance||
   Vector3.Distance(hand.getAbsolutePosition(),wristTarget)>tolerance)return restore();
  arm.rotationQuaternion=Quaternion.Slerp(originalArm,solvedArm,strength).normalize();
  elbow.rotationQuaternion=Quaternion.Slerp(originalElbow,solvedElbow,strength).normalize();
  return true;
 };
}

/** CHAR-123: fixed, mirror-symmetric inward arm plane for a hurried jog.
 * The same two proper rigid rotations are applied to both direction vectors
 * across every animation frame. This keeps their dot-product (elbow flexion),
 * segment length, authored forward/back trajectory and continuity intact.
 */
export const URGENT_JOG_ARM_ADDUCTION_123=.19;
export function jogArmCarriage123(key:readonly number[],side:"Left"|"Right"):number[]{
 if(key.length!==6||key.some(x=>!Number.isFinite(x)))return [...key];
 const a=side==="Left"?-URGENT_JOG_ARM_ADDUCTION_123:URGENT_JOG_ARM_ADDUCTION_123;
 const c=Math.cos(a),s=Math.sin(a);
 // A second FIXED pitch of the whole two-segment chain restores the leading
 // wrist height lost during inward rotation. Neither angle depends on phase.
 // Same X-axis pitch for both arms: leading hand rises, trailing hand lowers.
 const pitch=-.11,cp=Math.cos(pitch),sp=Math.sin(pitch);
 return [0,3].flatMap(i=>{
  const x=key[i]!,y=key[i+1]!,z=key[i+2]!;
  const tx=c*x-s*y,ty=s*x+c*y;
  return [tx,cp*ty-sp*z,sp*ty+cp*z];
 });
}

export function sampleSprintArm120F(keys:number[][],cursor:number):number[]{
 const frames=keys.length-1,wrapped=((cursor%frames)+frames)%frames,i=Math.floor(wrapped),t=wrapped-i;
 const a=keys[i]!,b=keys[i+1]!;
 const upper=Vector3.Lerp(Vector3.FromArray(a),Vector3.FromArray(b),t).normalize();
 const lower=Vector3.Lerp(Vector3.FromArray(a,3),Vector3.FromArray(b,3),t).normalize();
 return [...upper.asArray(),...lower.asArray()];
}
