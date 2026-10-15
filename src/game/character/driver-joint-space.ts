import { Matrix, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";

/**
 * AR1-1. Compute a LOCAL quaternion from two WORLD directions. The inverse
 * parent's linear transform must act on both POLAR vectors before taking their
 * CROSS PRODUCT. A cross product is axial and flips parity under reflection.
 *
 * This simple method is valid only for orthogonal, uniformly scaled parents
 * (reflection allowed). Nonuniform/sheared frames explicitly fail closed.
 */
export function parentSpaceAimDelta(
  originalWorld: Vector3, desiredWorld: Vector3,
  parentWorld: Matrix, maxRadians: number,
): Quaternion | null {
  if (!Number.isFinite(maxRadians) || maxRadians<=0 ||
    maxRadians>Math.PI || ![...originalWorld.asArray(),...desiredWorld.asArray()]
      .every(Number.isFinite)) return null;
  const m=parentWorld.m;
  const c0=new Vector3(m[0]!,m[1]!,m[2]!);
  const c1=new Vector3(m[4]!,m[5]!,m[6]!);
  const c2=new Vector3(m[8]!,m[9]!,m[10]!);
  const s=[c0.length(),c1.length(),c2.length()];
  if (Math.min(...s)<1e-8 || Math.max(...s)/Math.min(...s)>1.001 ||
    Math.abs(Vector3.Dot(c0,c1))>1e-4*s[0]!*s[1]! ||
    Math.abs(Vector3.Dot(c1,c2))>1e-4*s[1]!*s[2]! ||
    Math.abs(Vector3.Dot(c0,c2))>1e-4*s[0]!*s[2]!) return null;
  const inverse=parentWorld.clone().invert();
  const from=Vector3.TransformNormal(originalWorld,inverse);
  const to=Vector3.TransformNormal(desiredWorld,inverse);
  if(from.lengthSquared()<1e-8 || to.lengthSquared()<1e-8)return null;
  from.normalize();to.normalize();
  const dot=Math.max(-1,Math.min(1,Vector3.Dot(from,to)));
  const angle=Math.acos(dot);
  if(angle<1e-5)return Quaternion.Identity();
  // Near antiparallel is ambiguous without a known knee/elbow pole vector.
  if(dot< -0.99999)return null;
  const cross=Vector3.Cross(from,to);
  if(cross.lengthSquared()<1e-10)return null;
  cross.normalize();
  return Quaternion.RotationAxis(cross,Math.min(maxRadians,angle));
}

export function rotationOf(node:TransformNode):Quaternion {
  return node.rotationQuaternion?.clone() ??
    Quaternion.FromEulerAngles(node.rotation.x,node.rotation.y,node.rotation.z);
}

export function applyAimStep(
  joint:TransformNode,tip:TransformNode,target:Vector3,
  maxRadians:number,
):boolean{
  joint.computeWorldMatrix(true);tip.computeWorldMatrix(true);
  const from=tip.getAbsolutePosition().subtract(joint.getAbsolutePosition());
  const towards=target.subtract(joint.getAbsolutePosition());
  const parent=joint.parent;
  if(!parent)return false;
  parent.computeWorldMatrix(true);
  const delta=parentSpaceAimDelta(from,towards,parent.getWorldMatrix(),maxRadians);
  if(!delta)return false;
  const base=rotationOf(joint);
  // Test candidate multiplication, reject if the world-space objective worsens.
  const before=Vector3.DistanceSquared(tip.getAbsolutePosition(),target);
  joint.rotationQuaternion=delta.multiply(base).normalize();
  tip.computeWorldMatrix(true);
  const after=Vector3.DistanceSquared(tip.getAbsolutePosition(),target);
  if(!Number.isFinite(after)||after>before+1e-8){
    joint.rotationQuaternion=base;tip.computeWorldMatrix(true);return false;
  }
  return true;
}
