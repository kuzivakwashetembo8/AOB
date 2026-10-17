/**
 * Reusable visual wheel rig adapter for imported Meridian vehicle GLBs.
 * Does NOT pretend wheel rotation is tire traction or a suspension solver.
 * Independently named pivots are required; unavailable pivots are explicitly
 * reported, never replaced by rotating the whole car mesh.
 */
import { AbstractMesh, Matrix, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { buildTireContactProfile, tireContactBottomY, type TireContactProfile } from "./wheel-contact-geometry";

export type WheelCorner = "frontLeft" | "frontRight" | "rearLeft" | "rearRight";
export interface StreetVehicleWheelMapping {
  readonly wheelNames: Record<WheelCorner, string>;
  readonly spinAxis: "x" | "y" | "z";
  readonly steerAxis: "x" | "y" | "z";
  /** New cars normalize visual front toe against chassis yaw; old rigs can opt out. */
  readonly steeringMode?: "legacy-local" | "world-yaw";
  readonly steeringSign?: 1 | -1;
  readonly fallbackRadiusMetres: number;
}
export const FERRARI_WHEEL_MAPPING: StreetVehicleWheelMapping = {
  wheelNames: {
    frontLeft: "wheel_fl",
    frontRight: "wheel_fr",
    rearLeft: "wheel_rl",
    rearRight: "wheel_rr",
  },
  spinAxis: "x",
  steerAxis: "z",
  // Matches JS-3D-Car's right-key negative wheelOrientation convention.
  steeringSign: -1,
  steeringMode: "legacy-local",
  fallbackRadiusMetres: 0.32,
};
const axis = (name: "x" | "y" | "z") =>
  name === "x" ? Vector3.Right() : name === "y" ? Vector3.Up() : Vector3.Forward();
type WheelPart = {
  readonly corner: WheelCorner;
  readonly node: TransformNode;
  readonly base: Quaternion;
  readonly priorQuaternion: Quaternion | null;
  readonly originalEuler: Vector3;
  readonly radiusMetres: number;
  readonly initialPosition: Vector3;
  readonly treadBelowPivotWorldY: number | null;
  readonly treadMeshes: readonly AbstractMesh[];
  readonly tireProfile:TireContactProfile|null;
  suspensionTravelWorldY: number;
};
/**
 * Standardize visual steering to the accepted chassis/world yaw convention,
 * regardless of the source GLB parent rotation, pitch or coordinate basis.
 * Return a rotation in the wheel hub's PARENT frame.
 */
export function worldYawSteerQuaternion(parentWorld: Matrix | null, steeringRadians: number): Quaternion {
  if (!Number.isFinite(steeringRadians)) throw Error("Nonfinite wheel steering");
  const localUp = parentWorld
    ? Vector3.TransformNormal(Vector3.Up(), parentWorld.clone().invert())
    : Vector3.Up();
  const len = localUp.length();
  if (!Number.isFinite(len) || len < 1e-6) throw Error("Invalid wheel parent world-up axis");
  // Accepted Ferrari visual convention: negate the physics steering angle.
  return Quaternion.RotationAxis(localUp.scale(1 / len), -steeringRadians);
}
const median = (sizes: number[]) => sizes.sort((a, b) => a - b)[1] ?? 0;

/** Normalize only established source and importer prefix conventions. */
function matchNodeName(actual: string, expected: string): boolean {
  const suffix = actual.split(":").pop()?.toLowerCase().trim();
  return suffix === expected.toLowerCase();
}
function measuredWheelRadius(node: TransformNode, fallback: number): number {
  // Wheel thickness is typically the smallest AABB axis. The median axis
  // estimates diameter, avoiding the error of treating tire width as diameter.
  const meshes = [
    ...(node instanceof AbstractMesh ? [node] : []),
    ...node.getChildMeshes(false),
  ].filter(m => m.getTotalVertices() > 0);
  if (!meshes.length) return fallback;
  let min = { x: Infinity, y: Infinity, z: Infinity };
  let max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    min = {
      x: Math.min(min.x, box.minimumWorld.x),
      y: Math.min(min.y, box.minimumWorld.y),
      z: Math.min(min.z, box.minimumWorld.z),
    };
    max = {
      x: Math.max(max.x, box.maximumWorld.x),
      y: Math.max(max.y, box.maximumWorld.y),
      z: Math.max(max.z, box.maximumWorld.z),
    };
  }
  const r = median([max.x - min.x, max.y - min.y, max.z - min.z]) * 0.5;
  return Number.isFinite(r) && r >= 0.18 && r <= 0.85 ? r : fallback;
}

export class StreetVehicleWheelRig {
  private readonly parts: WheelPart[];
  private wheelTravelMetres = 0;
  readonly absentNames: readonly string[];

  constructor(readonly visualAnchor: TransformNode, readonly mapping: StreetVehicleWheelMapping) {
    const descendants = visualAnchor.getDescendants(false);
    const missing: string[] = [];
    const parts: WheelPart[] = [];
    for (const corner of ["frontLeft", "frontRight", "rearLeft", "rearRight"] as const) {
      const expected = mapping.wheelNames[corner];
      const node = descendants.find(item => item instanceof TransformNode &&
        matchNodeName(item.name, expected));
      if (!(node instanceof TransformNode)) { missing.push(expected); continue; }
      const priorQuaternion = node.rotationQuaternion?.clone() ?? null;
      const base = priorQuaternion?.clone() ??
        Quaternion.FromEulerAngles(node.rotation.x, node.rotation.y, node.rotation.z);
      const radiusMetres = measuredWheelRadius(node, mapping.fallbackRadiusMetres);
      // GLTF imports commonly use rotationQuaternion, which overrides Euler
      // node.rotation.x/z mutations. Store the original orientation once and
      // update the actual quaternion so all four wheels visibly animate.
      node.rotationQuaternion = base.clone();
      node.computeWorldMatrix(true);
      const pivotY=node.getAbsolutePosition().y;
      const treadParts = [
        ...(node instanceof AbstractMesh ? [node] : []),
        ...node.getChildMeshes(false),
      ].filter(m=>m.getTotalVertices()>0);
      const tireProfile=buildTireContactProfile(node,treadParts,mapping.spinAxis);
      const sampled=tireProfile?tireContactBottomY(node.getWorldMatrix(),tireProfile,mapping.spinAxis):null;
      const treadY=sampled??Infinity;
      parts.push({
        corner, node, base, priorQuaternion, originalEuler: node.rotation.clone(),
        radiusMetres, initialPosition: node.position.clone(),
        treadBelowPivotWorldY: Number.isFinite(treadY)?treadY-pivotY:null,
        treadMeshes:treadParts,tireProfile,suspensionTravelWorldY:0,
      });
    }
    this.parts = parts;
    this.absentNames = missing;
  }

  /** Physical chassis box floor is based on actual tire tread, not model AABB
   * minY or a fixed +0.035m. Returns null for foreign/partial GLBs. Samples
   * unanimated world transforms once at instantiation; no per-frame mesh scan. */
  contactTreadFloorRelativeToAnchor(): number | null {
    const samples=this.sampleTireTreads();
    if(samples.length!==4 ||
      this.parts.some(p=>p.tireProfile?.confidence!=="verified-shape"))return null;
    const ys=samples.map(p=>p.bottomY-this.visualAnchor.position.y).sort((a,b)=>a-b);
    if(ys[3]!-ys[0]!>0.065)return null;
    return (ys[1]!+ys[2]!)*0.5;
  }
  get contactProfileEvidence(){
    return this.parts.map(p=>({
      corner:p.corner,source:p.tireProfile?.source??"missing",
      confidence:p.tireProfile?.confidence??"unavailable",
      radiusLocal:p.tireProfile?.radius??null,
      vertexCount:p.tireProfile?.vertexCount??0,
    }));
  }
  /** Spin-independent analytic radial tire support, NOT an AABB corner.
   * Returns no witnesses when an imported wheel shape cannot be isolated.
   */
  sampleTireTreads():ReadonlyArray<{corner:WheelCorner;position:Vector3;bottomY:number}>{
    if(!this.ready)return [];
    const samples:{corner:WheelCorner;position:Vector3;bottomY:number}[]=[];
    for(const part of this.parts){
      if(!part.tireProfile)return [];
      part.node.computeWorldMatrix(true);
      const pivot=part.node.getAbsolutePosition().clone();
      const bottomY=tireContactBottomY(part.node.getWorldMatrix(),
        part.tireProfile,this.mapping.spinAxis);
      if(bottomY===null)return [];
      samples.push({corner:part.corner,position:pivot,bottomY});
    }
    return samples;
  }

  get wheelCount(): number { return this.parts.length; }
  get frontWheelCount(): number {
    return this.parts.filter(p => p.corner === "frontLeft" || p.corner === "frontRight").length;
  }
  get distanceDrivenMetres(): number { return this.wheelTravelMetres; }
  get ready(): boolean { return this.parts.length === 4; }

  update(signedTravelMetres: number, steeringRadians: number): void {
    if (!Number.isFinite(signedTravelMetres) || !Number.isFinite(steeringRadians)) {
      throw new Error("Wheel animation rejects nonfinite travel or steering");
    }
    this.wheelTravelMetres += signedTravelMetres;
    for (const part of this.parts) {
      const rollAngle = this.wheelTravelMetres / part.radiusMetres;
      const front = part.corner === "frontLeft" || part.corner === "frontRight";
      const roll = Quaternion.RotationAxis(axis(this.mapping.spinAxis), rollAngle);
      if (this.mapping.steeringMode === "legacy-local") {
        // Preserve the accepted Ferrari/Buggy model-specific orientation.
        const steer = front ? (this.mapping.steeringSign ?? -1) * steeringRadians : 0;
        part.node.rotationQuaternion = part.base
          .multiply(Quaternion.RotationAxis(axis(this.mapping.steerAxis), steer))
          .multiply(roll);
      } else {
        // Default for newly imported cars: world-up front steering, BEFORE
        // the original GLTF hub orientation. Rear hubs remain unsteered.
        const steer = worldYawSteerQuaternion(
          part.node.parent?.getWorldMatrix() ?? null,
          front ? steeringRadians : 0,
        );
        part.node.rotationQuaternion = steer.multiply(part.base).multiply(roll);
      }
    }
  }

  /**
   * G3 prototype: each *real imported wheel pivot* follows its corresponding
   * Rapier contact surface with bounded visible suspension travel. Chassis
   * support and physics remain KCC-owned. Road paint sits ~3cm above Rapier
   * floor; sidewalk visual and collision tops match. Never falsely infer
   * contact from the full-car cuboid alone.
   */
  alignVisualWheelContacts(dt: number,
    sample: (point:{x:number;y:number;z:number})=>number|null,
    grounded: boolean):void {
    if(!this.ready||!Number.isFinite(dt)||dt<=0)return;
    for(const part of this.parts) {
      if(part.treadBelowPivotWorldY===null)continue;
      part.node.computeWorldMatrix(true);
      const pivot=part.node.getAbsolutePosition();
      // Never move wheels based on an unproven rubber/tire mesh identity.
      if(part.tireProfile?.confidence!=="verified-shape")continue;
      const actualTreadY=tireContactBottomY(part.node.getWorldMatrix(),
        part.tireProfile,this.mapping.spinAxis);
      if(actualTreadY===null)continue;
      const support=grounded?sample({x:pivot.x,y:pivot.y+0.45,z:pivot.z}):null;
      // Do not reach toward unsupported air or objects above tire axle.
      const plausible=support!==null&&Number.isFinite(support)&&
        support<=pivot.y+0.18&&support>=pivot.y-1.05;
      let correction=0;
      if(plausible) {
        const visualTop=support!<0.055?support!+0.030:support!;
        correction=visualTop+0.006-actualTreadY;
      } else {
        // Relax smoothly back to authored pivot when off the ground.
        correction=-part.suspensionTravelWorldY;
      }
      const maxStep=Math.min(0.025,dt*0.65);
      const change=Math.max(-maxStep,Math.min(maxStep,correction));
      const target=Math.max(-0.13,Math.min(0.13,
        part.suspensionTravelWorldY+change));
      const delta=target-part.suspensionTravelWorldY;
      if(Math.abs(delta)<0.0001)continue;
      const parent=part.node.parent;
      const matrix=parent?parent.getWorldMatrix().clone().invert():null;
      const move=matrix?Vector3.TransformNormal(new Vector3(0,delta,0),matrix)
        :new Vector3(0,delta,0);
      part.node.position.addInPlace(move);
      part.node.computeWorldMatrix(true);
      part.suspensionTravelWorldY=target;
    }
  }

  get visualWheelTravelMetres() {
    return this.parts.map(p=>({corner:p.corner,travel:p.suspensionTravelWorldY}));
  }

  dispose(): void {
    for (const part of this.parts) {
      part.node.rotationQuaternion = part.priorQuaternion?.clone() ?? null;
      if (!part.priorQuaternion) part.node.rotation.copyFrom(part.originalEuler);
      part.node.position.copyFrom(part.initialPosition);
      part.suspensionTravelWorldY=0;
    }
  }
}
