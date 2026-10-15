/**
 * VEH-FIT-002 G0: on-demand, read-only contact audit on the actual imported
 * Ferrari and pinned UAL rig. Only invoked from an explicit browser console
 * diagnostic. There is no per-frame telemetry, asset mutation or network I/O.
 */
import { AbstractMesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import type { LoadedMeridiaCharacter } from "../character/voight-humanoid-trial";
import type { FirstDriveTrial } from "./first-drive-trial";

type P = { x: number; y: number; z: number };
const p = (v: P): P => ({ x: v.x, y: v.y, z: v.z });
const finite = (n: number | null) => n === null || Number.isFinite(n);
const wheelNames = ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"] as const;
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");
const tagged = (actual: string, suffix: string) =>
  actual.split(":").pop()?.toLowerCase().trim() === suffix;
type WheelWitness = {
  name: string;
  pivot: P | null;
  treadBottomY: number | null;
  estimatedRadius: number | null;
  roadVisualTopY: number | null;
  collisionTopY: number | null;
  visualTreadGapMetres: number | null;
  colliderRoadDeltaMetres: number | null;
  meshCount: number;
  supportStatus: "measured" | "no-road" | "no-wheel" | "no-collider";
};
function roadVisualTop(scene: Scene, point: P): number | null {
  let highest: number | null = null;
  for (const mesh of scene.meshes) {
    // First Light asphalt mesh is a thin box, deliberately NOT a Rapier collider.
    const asphalt = mesh.name.startsWith("generated-parity-") &&
      mesh.name.endsWith("-road");
    const polygon = mesh.name.startsWith("generated-asphalt:");
    if (!asphalt && !polygon) continue;
    mesh.computeWorldMatrix(true);
    const bounds = mesh.getBoundingInfo().boundingBox;
    if (point.x < bounds.minimumWorld.x - 0.001 ||
      point.x > bounds.maximumWorld.x + 0.001 ||
      point.z < bounds.minimumWorld.z - 0.001 ||
      point.z > bounds.maximumWorld.z + 0.001) continue;
    // Polygon AABBs may include triangles outside the road. They are
    // explicitly marked unsupported until the generated road has a true query.
    if (polygon) continue;
    highest = Math.max(highest ?? -Infinity, bounds.maximumWorld.y);
  }
  return highest;
}
function descendantMeshes(node: TransformNode): AbstractMesh[] {
  return [
    ...(node instanceof AbstractMesh ? [node] : []),
    ...node.getChildMeshes(false),
  ].filter(mesh => mesh.getTotalVertices() > 0);
}
function wheelWitness(scene: Scene, car: FirstDriveTrial, name: string): WheelWitness {
  const pivot = car.anchor.getDescendants(false).find(node =>
    node instanceof TransformNode && tagged(node.name, name));
  const empty = (supportStatus: WheelWitness["supportStatus"]): WheelWitness => ({
    name, pivot: null, treadBottomY: null, estimatedRadius: null,
    roadVisualTopY: null, collisionTopY: null,
    visualTreadGapMetres: null, colliderRoadDeltaMetres: null,
    meshCount: 0, supportStatus,
  });
  if (!(pivot instanceof TransformNode)) return empty("no-wheel");
  pivot.computeWorldMatrix(true);
  const position = pivot.getAbsolutePosition();
  const parts = descendantMeshes(pivot);
  if (!parts.length) return { ...empty("no-wheel"), pivot: p(position) };
  let minY = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const mesh of parts) {
    mesh.computeWorldMatrix(true);
    const b = mesh.getBoundingInfo().boundingBox;
    minY = Math.min(minY, b.minimumWorld.y);
    minX = Math.min(minX, b.minimumWorld.x);
    maxX = Math.max(maxX, b.maximumWorld.x);
    minZ = Math.min(minZ, b.minimumWorld.z);
    maxZ = Math.max(maxZ, b.maximumWorld.z);
  }
  if (![minY, minX, maxX, minZ, maxZ].every(Number.isFinite)) return empty("no-wheel");
  const roadY = roadVisualTop(scene, position);
  // Measured AABB dimensions are reported, not assumed to be perfect tire radii.
  const radius = Math.max(0, Math.min(maxX - minX, maxZ - minZ)) * 0.5;
  const probe = car.probeWheelSupport(position.x, position.y + 0.4, position.z);
  const supportY = probe?.topY ?? null;
  const status: WheelWitness["supportStatus"] =
    roadY === null ? "no-road" : supportY === null ? "no-collider" : "measured";
  return {
    name, pivot: p(position), treadBottomY: minY, estimatedRadius: radius,
    roadVisualTopY: roadY, collisionTopY: supportY,
    visualTreadGapMetres: roadY === null ? null : minY - roadY,
    colliderRoadDeltaMetres: roadY === null || supportY === null
      ? null : roadY - supportY, meshCount: parts.length, supportStatus: status,
  };
}
function humanoidBones(character: LoadedMeridiaCharacter | null) {
  if (!character) return { available: false, limbs: [], missing: ["humanoid"] };
  const skinned = character.witness;
  const skeleton = skinned.skeleton;
  if (!skeleton) return { available: false, limbs: [], missing: ["skeleton"] };
  const probes = [
    "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase",
    "RightUpLeg", "RightLeg", "RightFoot", "RightToeBase",
    "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand",
    "RightShoulder", "RightArm", "RightForeArm", "RightHand",
    "Hips", "Spine",
  ];
  const limbs: { role: string; sourceBone: string; location: P }[] = [];
  const missing: string[] = [];
  for (const target of probes) {
    const key = normalize(target);
    const bone = skeleton.bones.find(b => {
      const id = normalize(b.name);
      return id === key || id.endsWith(key);
    });
    if (!bone) { missing.push(target); continue; }
    try {
      const pos = bone.getAbsolutePosition(skinned);
      if ([pos.x, pos.y, pos.z].every(Number.isFinite))
        limbs.push({ role: target, sourceBone: bone.name, location: p(pos) });
      else missing.push(target);
    } catch { missing.push(target); }
  }
  return { available: limbs.length > 0, limbs, missing };
}
function steeringWheelWitness(car: FirstDriveTrial) {
  const candidates = car.anchor.getDescendants(false).filter(n =>
    /steer.{0,12}wheel|steering|volante/i.test(n.name));
  const meshes = candidates.filter(n => n instanceof AbstractMesh && n.getTotalVertices() > 0);
  const source = meshes[0] ?? candidates[0];
  if (!source) return { found: false, label: null, center: null, radius: null };
  if (source instanceof AbstractMesh && source.getTotalVertices() > 0) {
    source.computeWorldMatrix(true);
    const b = source.getBoundingInfo().boundingBox;
    return { found: true, label: source.name,
      center: p(b.centerWorld), radius: Math.max(b.extendSizeWorld.x, b.extendSizeWorld.y, b.extendSizeWorld.z) };
  }
  const origin = (source as TransformNode).getAbsolutePosition();
  return { found: true, label: source.name, center: p(origin), radius: null };
}
export function measureVehicleFit002(scene: Scene, car: FirstDriveTrial | null,
  character: LoadedMeridiaCharacter | null, enabled: boolean) {
  const report = character?.report();
  if (!enabled || !car) return {
    schema: "gtd.veh-fit-002.contact.v1", enabled,
    available: false, reason: enabled ? "not-driving" : "diagnostic-disabled",
  };
  const wheels = wheelNames.map(n => wheelWitness(scene, car, n));
  const boneReport = humanoidBones(character);
  const allGaps = wheels.map(w => w.visualTreadGapMetres).filter(
    (n): n is number => n !== null && Number.isFinite(n));
  const steeringWheel = steeringWheelWitness(car);
  const currentWristPositions = boneReport.limbs.filter(l =>
    l.role === "LeftHand" || l.role === "RightHand");
  const wristToWheelCenter = steeringWheel.center === null ? [] :
    currentWristPositions.map(l => ({
      role: l.role,
      distanceMetres: Vector3.Distance(
        new Vector3(l.location.x, l.location.y, l.location.z),
        new Vector3(steeringWheel.center!.x, steeringWheel.center!.y, steeringWheel.center!.z)),
      note: "Distance to wheel center only; NOT a certified rim/grip contact",
    }));
  const status = car.status;
  return {
    schema: "gtd.veh-fit-002.contact.v1", enabled: true, available: true,
    evidence: "live Babylon matrices and Rapier supports; no movement or mutation",
    character: {
      activeAnimation: report?.activeAnimation ?? null,
      normalizedHeight: 1.78,
      normalizationScale: report?.normalizationScale ?? null,
      driverRoot: character ? p(character.root.position) : null,
      bones: boneReport,
    },
    car: { visualAnchor: p(car.anchor.position), yaw: car.headingYaw,
      dimensions: car.dimensions, physics: status,
      status: car.status },
    wheelContact: wheels,
    wheelContactSummary: {
      samples: allGaps.length,
      minimumGapMetres: allGaps.length ? Math.min(...allGaps) : null,
      maximumGapMetres: allGaps.length ? Math.max(...allGaps) : null,
      allFourWheelsMeasured: allGaps.length === 4,
      acceptableFlatRoad: allGaps.length === 4 && allGaps.every(g => Math.abs(g) <= 0.015),
    },
    steeringWheel,
    wristToWheelCenter,
    limitations: [
      "AABB wheel tread is an approximation under steering/rotation; it must be visually checked.",
      "Wheel steering rim geometry may lack a named independent GLB node.",
      "A bone landmark is not an actual sole/palm contact surface.",
      "Contact samples are measured only when the report function is called.",
      "These measurements do not adjust driver pose or vehicle dynamics.",
    ],
    invariantFinite: wheels.every(w =>
      [w.treadBottomY, w.roadVisualTopY, w.collisionTopY,
        w.visualTreadGapMetres, w.colliderRoadDeltaMetres].every(finite)),
  };
}
