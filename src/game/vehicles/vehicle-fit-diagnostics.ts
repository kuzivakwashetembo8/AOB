/**
 * VEH-FIT-002 G0: on-demand, read-only contact audit on the actual imported
 * Ferrari and pinned UAL rig. Only invoked from an explicit browser console
 * diagnostic. There is no per-frame telemetry, asset mutation or network I/O.
 */
import { AbstractMesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import type { LoadedMeridiaCharacter } from "../character/voight-humanoid-trial";
import type { FirstDriveTrial } from "./first-drive-trial";
import { findDriverBones, DRIVER_LIMB_ROLES } from "../character/driver-limb-landmarks";
import { sampleRenderedVehicleSurface } from "./vehicle-road-surface";

type P = { x: number; y: number; z: number };
const p = (v: P): P => ({ x: v.x, y: v.y, z: v.z });
const finite = (n: number | null) => n === null || Number.isFinite(n);
const wheelNames = ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"] as const;
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
  visualSupportTopY: number | null;
  visualSupportKind: "road" | "sidewalk" | "unknown";
  visualSupportGapMetres: number | null;
  meshCount: number;
  contactEvidence:"verified-shape"|"unverified-mesh"|"unavailable";
  surfaceId:string|null;
  supportStatus: "measured" | "no-road" | "no-wheel" | "no-tire" | "no-collider";
};
function wheelWitness(scene:Scene,car:FirstDriveTrial,name:string):WheelWitness {
  const pivot=car.anchor.getDescendants(false).find(n=>
    n instanceof TransformNode && tagged(n.name,name));
  const empty=(reason:WheelWitness["supportStatus"]):WheelWitness=>({
    name,pivot:null,treadBottomY:null,estimatedRadius:null,roadVisualTopY:null,
    collisionTopY:null,visualTreadGapMetres:null,colliderRoadDeltaMetres:null,
    visualSupportTopY:null,visualSupportKind:"unknown",visualSupportGapMetres:null,
    meshCount:0,contactEvidence:"unavailable",surfaceId:null,supportStatus:reason,
  });
  if(!(pivot instanceof TransformNode))return empty("no-wheel");
  pivot.computeWorldMatrix(true);
  const center=pivot.getAbsolutePosition();
  const index=wheelNames.indexOf(name as typeof wheelNames[number]);
  const sample=car.sampleTireContactTreads()[index];
  const meta=car.status.tireContactEvidence[index];
  if(!sample||sample.corner!==["frontLeft","frontRight","rearLeft","rearRight"][index])
    return {...empty("no-tire"),pivot:p(center)};
  const surface=sampleRenderedVehicleSurface(scene,center.x,center.z);
  const ray=car.probeWheelSupport(center.x,center.y+0.45,center.z);
  const renderedY=surface?.y??null;
  const physicsY=ray?.topY??null;
  const support= !surface?"no-road":physicsY===null?"no-collider":"measured";
  return {
    name,pivot:p(center),treadBottomY:sample.bottomY,
    estimatedRadius:meta?.radiusLocal??null,
    roadVisualTopY:surface?.kind==="asphalt"?surface.y:null,
    collisionTopY:physicsY,
    visualTreadGapMetres:surface?.kind==="asphalt"?sample.bottomY-surface.y:null,
    colliderRoadDeltaMetres:surface?.kind==="asphalt"&&physicsY!==null?
      surface.y-physicsY:null,
    visualSupportTopY:renderedY,
    visualSupportKind:surface?.kind==="asphalt"?"road":
      surface?.kind==="sidewalk"?"sidewalk":"unknown",
    visualSupportGapMetres:renderedY===null?null:sample.bottomY-renderedY,
    meshCount:meta?.vertexCount??0,
    contactEvidence:meta?.confidence??"unavailable",
    surfaceId:surface?.name??null,supportStatus:support,
  };
}
function humanoidBones(character: LoadedMeridiaCharacter | null) {
  if (!character) return { available: false, limbs: [], missing: ["humanoid"] };
  const skinned = character.witness;
  const skeleton = skinned.skeleton;
  if (!skeleton) return { available: false, limbs: [], missing: ["skeleton"] };
  const mapped = findDriverBones(skeleton);
  const limbs: { role: string; sourceBone: string; location: P }[] = [];
  const missing: string[] = [];
  for (const target of DRIVER_LIMB_ROLES) {
    const bone = mapped.found[target];
    if (!bone) { missing.push(target); continue; }
    try {
      const transform = bone.getTransformNode();
      const pos = transform ? transform.getAbsolutePosition() :
        bone.getAbsolutePosition(skinned);
      if ([pos.x, pos.y, pos.z].every(Number.isFinite))
        limbs.push({ role: target, sourceBone: bone.name, location: p(pos) });
      else missing.push(target);
    } catch { missing.push(target); }
  }
  return { available: limbs.length > 0, limbs, missing, sourceBoneNames: skeleton.bones.map(b => b.name) };
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
  const allGaps = wheels.map(w => w.visualSupportGapMetres).filter(
    (n): n is number => n !== null && Number.isFinite(n));
  const steeringWheel = steeringWheelWitness(car);
  const currentWristPositions = boneReport.limbs.filter(l =>
    l.role === "leftHand" || l.role === "rightHand");
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
      fittedDrivingPose: character?.driverContactReport() ?? null,
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
      "Tire contact uses a spin-independent vertex-derived radial envelope; an unidentified rubber mesh is explicitly unverified.",
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
