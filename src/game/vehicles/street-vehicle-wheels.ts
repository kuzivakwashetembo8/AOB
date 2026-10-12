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
      parts.push({
        corner, node, base, priorQuaternion, originalEuler: node.rotation.clone(),
        radiusMetres,
      });
    }
    this.parts = parts;
    this.absentNames = missing;
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

  dispose(): void {
    for (const part of this.parts) {
      part.node.rotationQuaternion = part.priorQuaternion?.clone() ?? null;
      if (!part.priorQuaternion) part.node.rotation.copyFrom(part.originalEuler);
    }
  }
}
