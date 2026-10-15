/**
 * Reusable visual wheel rig adapter for imported Meridian vehicle GLBs.
 * Does NOT pretend wheel rotation is tire traction or a suspension solver.
 * Independently named pivots are required; unavailable pivots are explicitly
 * reported, never replaced by rotating the whole car mesh.
 */
import { AbstractMesh, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";

export type WheelCorner = "frontLeft" | "frontRight" | "rearLeft" | "rearRight";
export interface StreetVehicleWheelMapping {
  readonly wheelNames: Record<WheelCorner, string>;
  readonly spinAxis: "x" | "y" | "z";
  readonly steerAxis: "x" | "y" | "z";
  readonly steeringSign: 1 | -1;
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
  suspensionTravelWorldY: number;
};
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
      let treadY=Infinity;
      for(const mesh of treadParts) {
        mesh.computeWorldMatrix(true);
        treadY=Math.min(treadY,mesh.getBoundingInfo().boundingBox.minimumWorld.y);
      }
      parts.push({
        corner, node, base, priorQuaternion, originalEuler: node.rotation.clone(),
        radiusMetres, initialPosition: node.position.clone(),
        treadBelowPivotWorldY: Number.isFinite(treadY)?treadY-pivotY:null,
        suspensionTravelWorldY:0,
      });
    }
    this.parts = parts;
    this.absentNames = missing;
  }

  /** Physical chassis box floor is based on actual tire tread, not model AABB
   * minY or a fixed +0.035m. Returns null for foreign/partial GLBs. Samples
   * unanimated world transforms once at instantiation; no per-frame mesh scan. */
  contactTreadFloorRelativeToAnchor(): number | null {
    if (!this.ready) return null;
    this.visualAnchor.computeWorldMatrix(true);
    const ys: number[] = [];
    for (const wheel of this.parts) {
      const parts = [
        ...(wheel.node instanceof AbstractMesh ? [wheel.node] : []),
        ...wheel.node.getChildMeshes(false),
      ].filter(m => m.getTotalVertices() > 0);
      if(!parts.length) return null;
      let minY=Infinity;
      for(const mesh of parts) {
        mesh.computeWorldMatrix(true);
        minY=Math.min(minY,mesh.getBoundingInfo().boundingBox.minimumWorld.y);
      }
      if(!Number.isFinite(minY))return null;
      ys.push(minY-this.visualAnchor.position.y);
    }
    if(Math.max(...ys)-Math.min(...ys)>0.065)return null;
    ys.sort((a,b)=>a-b);
    const median=(ys[1]!+ys[2]!)*0.5;
    return Math.abs(median)<1.5 ? median : null;
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
      const steer = part.corner === "frontLeft" || part.corner === "frontRight"
        ? this.mapping.steeringSign * steeringRadians : 0;
      // The source's X roll and Z steer are composed on the original GLTF
      // quaternion. Rotation happens around each actual named wheel pivot.
      part.node.rotationQuaternion = part.base
        .multiply(Quaternion.RotationAxis(axis(this.mapping.steerAxis), steer))
        .multiply(Quaternion.RotationAxis(axis(this.mapping.spinAxis), rollAngle));
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
      const support=grounded?sample({x:pivot.x,y:pivot.y+0.45,z:pivot.z}):null;
      // Do not reach toward unsupported air or objects above tire axle.
      const plausible=support!==null&&Number.isFinite(support)&&
        support<=pivot.y+0.18&&support>=pivot.y-1.05;
      let correction=0;
      if(plausible) {
        const visualTop=support!<0.055?support!+0.030:support!;
        const tread=pivot.y+part.treadBelowPivotWorldY;
        correction=visualTop+0.006-tread;
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
