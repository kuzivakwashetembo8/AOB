/**
 * EXP-VEH-002 / L0: Ferrari movement in Meridia.
 *
 * The fixed-step Rapier character-controller handles low curbs (bounded
 * autostep) and obstructing buildings. This is a KINEMATIC CHASSIS prototype,
 * not a wheel/suspension simulation. The vehicle collider, not Babylon meshes,
 * determines where the car may go.
 */
import RAPIER from "@dimforge/rapier3d-compat";
import { TransformNode } from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";
import { stepDriveControl, type DriveState } from "./drive-kinematics";
import { ferrariForwardVelocity } from "./ferrari-camera";
import {
  FERRARI_STREET_PROFILE,
  INITIAL_VERTICAL_VEHICLE_STATE,
  clampVehicleClimb,
  settleVehicleVerticalState,
  stepVehicleVerticalMotion,
  type VerticalVehicleState,
} from "./street-vehicle-physics";
import {
  FERRARI_WHEEL_MAPPING,
  StreetVehicleWheelRig,
} from "./street-vehicle-wheels";

export interface DriveTrialDimensions { readonly x: number; readonly y: number; readonly z: number }
export interface VehicleWorldPoint { readonly x: number; readonly y: number; readonly z: number }
export const FERRARI_CURB_MAX_METRES = FERRARI_STREET_PROFILE.maxCurbAutostepMetres;
const ACTOR_CLEARANCE_METRES = 0.95;
const MAX_EXIT_HEIGHT_DIFFERENCE_METRES = 0.38;

export function ferrariExitOffsets(yaw: number, width: number, length: number) {
  const lateral = width / 2 + ACTOR_CLEARANCE_METRES;
  const rear = length / 2 + ACTOR_CLEARANCE_METRES;
  return [
    { x: Math.cos(yaw) * lateral, z: -Math.sin(yaw) * lateral },
    { x: -Math.cos(yaw) * lateral, z: Math.sin(yaw) * lateral },
    { x: Math.sin(yaw) * rear, z: Math.cos(yaw) * rear },
    { x: -Math.sin(yaw) * rear, z: -Math.cos(yaw) * rear },
  ] as const;
}

export class FirstDriveTrial {
  private readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private drive: DriveState = { speedMps: 0, steeringRadians: 0 };
  private lastX: number;
  private lastZ: number;
  private distanceMetres = 0;
  private readonly wheelRig: StreetVehicleWheelRig;
  private readonly collisionShape: RAPIER.Cuboid;
  private vertical: VerticalVehicleState = INITIAL_VERTICAL_VEHICLE_STATE;
  private blockedProtectedCurbTicks = 0;
  private highestObservedUnsupportedGap = 0;
  private warningEmitted = false;
  private destroyed = false;

  constructor(
    private readonly physics: MeridianPhysics,
    readonly anchor: TransformNode,
    readonly dimensions: DriveTrialDimensions,
  ) {
    if (![dimensions.x, dimensions.y, dimensions.z].every(n => Number.isFinite(n) && n > 0)) {
      throw new Error("Ferrari trial requires the imported visual's real calibrated bounds");
    }
    const halfYaw = anchor.rotation.y / 2;
    this.body = physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(anchor.position.x, anchor.position.y + dimensions.y / 2 + 0.035, anchor.position.z)
        .setRotation({ x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) }),
    );
    this.collisionShape = new RAPIER.Cuboid(
      dimensions.x / 2, dimensions.y / 2, dimensions.z / 2,
    );
    try {
      this.collider = physics.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          dimensions.x / 2, dimensions.y / 2, dimensions.z / 2,
        ).setFriction(0.85).setRestitution(0),
        this.body,
      );
    } catch (error) {
      physics.world.removeRigidBody(this.body);
      throw error;
    }
    try {
      this.controller = physics.world.createCharacterController(0.02);
      // Only shallow, floor-supported ledges are climbable. Tall buildings,
      // bins and parked vehicles are not turned into traversable surfaces.
      this.controller.enableAutostep(
        FERRARI_CURB_MAX_METRES, FERRARI_STREET_PROFILE.minStepWidthMetres, false,
      );
      this.controller.enableSnapToGround(FERRARI_STREET_PROFILE.groundSnapMetres);
      this.controller.setApplyImpulsesToDynamicBodies(true);
    } catch (error) {
      physics.world.removeRigidBody(this.body);
      throw error;
    }
    this.lastX = anchor.position.x;
    this.lastZ = anchor.position.z;
    // The car-specific asset adapter is the only Ferrari-named dependency.
    // The wheel quaternion system is reusable with a sedan's wheel mapping.
    this.wheelRig = new StreetVehicleWheelRig(anchor, FERRARI_WHEEL_MAPPING);
  }

  get pose(): VehicleWorldPoint { return this.body.translation(); }
  get headingYaw() { return this.anchor.rotation.y; }
  get speedMps() { return this.drive.speedMps; }
  get wheelCount() { return this.wheelRig.wheelCount; }
  get status() { return {
    speedMps: this.speedMps,
    grounded: this.vertical.grounded,
    airborneSeconds: this.vertical.airborneSeconds,
    maxUnsupportedGroundGapMetres: this.highestObservedUnsupportedGap,
    vehicleNoStepBlockedTicks: this.blockedProtectedCurbTicks,
    wheelCount: this.wheelCount,
    wheelRigReady: this.wheelRig.ready,
    missingWheelPivots: this.wheelRig.absentNames,
    distanceMetres: this.distanceMetres, curbMaxMetres: FERRARI_CURB_MAX_METRES,
  }; }

  prepare(dt: number, steering: number, moveY: number) {
    if (this.destroyed) return;
    const next = stepDriveControl(
      this.drive, { throttle: -moveY, steering }, dt,
    );
    this.drive = {
      speedMps: next.speedMps,
      steeringRadians: next.steeringRadians,
    };
    const q = this.body.rotation();
    const yaw = 2 * Math.atan2(q.y, q.w);
    // User-confirmed steering direction: reversing the original angular sign
    // repairs left/right in the camera-visible Meridia Ferrari configuration.
    const nextYaw = yaw + next.yawRateRadiansPerSecond * dt;
    const forward = ferrariForwardVelocity(nextYaw, next.speedMps);
    // Free fall is gravity-accelerated after losing Rapier support, not
    // a constant 0.24m/s descent that leaves the visual car hovering.
    const vertical = stepVehicleVerticalMotion(this.vertical, dt, FERRARI_STREET_PROFILE);
    this.controller.computeColliderMovement(this.collider, {
      x: forward.x * dt,
      y: vertical.requestedDownwardMetres,
      z: forward.z * dt,
    });
    const corrected = this.controller.computedMovement();
    this.vertical = settleVehicleVerticalState(vertical, this.controller.computedGrounded());
    const at = this.body.translation();
    const climb = clampVehicleClimb(corrected.y, dt, FERRARI_STREET_PROFILE);
    let x = climb.suspendPlanarTravel ? 0 : corrected.x;
    let z = climb.suspendPlanarTravel ? 0 : corrected.z;
    // A 0.21m pavement curb and 0.22m garage portal are nearly identical
    // in height. Rapier autostep must NOT climb the garage's physical,
    // explicitly tagged no-step threshold. Test swept chassis samples
    // against that EXACT collider, not an invented high invisible wall.
    if (this.physics.isNearVehicleNoStepCollider(at, this.dimensions.z + 3)) {
      const orientation = {
        x: 0, y: Math.sin(nextYaw / 2), z: 0, w: Math.cos(nextYaw / 2),
      };
      const intersectsProtected = (fraction: number) =>
        !!this.physics.world.intersectionWithShape(
          {
            x: at.x + x * fraction,
            y: at.y + climb.y * fraction,
            z: at.z + z * fraction,
          }, orientation, this.collisionShape,
          undefined, undefined, this.collider, this.body,
          candidate => this.physics.isVehicleNoStepCollider(candidate),
        );
      if (!intersectsProtected(0)) {
        for (let sample = 1; sample <= 6; sample++) {
          if (!intersectsProtected(sample / 6)) continue;
          const fraction = (sample - 1) / 6;
          x *= fraction;
          z *= fraction;
          this.blockedProtectedCurbTicks++;
          break;
        }
      }
    }
    this.body.setNextKinematicTranslation({
      x: at.x + x,
      y: at.y + climb.y,
      z: at.z + z,
    });
    const halfYaw = nextYaw / 2;
    this.body.setNextKinematicRotation({
      x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw),
    });
    // The movement controller is integrated into the existing single world
    // tick; physics.world.step() remains owned by MeridianPhysics.movePlayer().
  }

  finish(dt: number) {
    if (this.destroyed) return;
    const translation = this.body.translation();
    const q = this.body.rotation();
    this.anchor.position.set(
      translation.x, translation.y - this.dimensions.y / 2 - 0.035, translation.z,
    );
    this.anchor.rotation.y = 2 * Math.atan2(q.y, q.w);
    const travelled = Math.hypot(
      translation.x - this.lastX, translation.z - this.lastZ,
    );
    this.lastX = translation.x;
    this.lastZ = translation.z;
    this.distanceMetres += travelled;
    this.wheelRig.update(
      travelled * (this.drive.speedMps < 0 ? -1 : 1),
      this.drive.steeringRadians,
    );
    if (!Number.isFinite(dt) || ![translation.x, translation.y, translation.z,
      this.headingYaw].every(Number.isFinite)) {
      throw new Error("VM-G02: Nonfinite or invalid simulated vehicle pose");
    }
    // A sampled support gap is diagnostic, not a false claim of suspension.
    // Never teleport the car to a ground point or conceal the failure.
    const bottomY = translation.y - this.dimensions.y / 2;
    const rayStart = bottomY + 0.4;
    const support = this.physics.world.castRay(
      new RAPIER.Ray({
        x: translation.x, y: rayStart, z: translation.z,
      }, { x: 0, y: -1, z: 0 }),
      4, true, undefined, undefined, this.collider,
    );
    if (support) {
      const gap = Math.max(0, rayStart - support.timeOfImpact - bottomY);
      this.highestObservedUnsupportedGap = Math.max(this.highestObservedUnsupportedGap, gap);
      if (gap > 0.5 && this.vertical.airborneSeconds > 0.6 && !this.warningEmitted) {
        console.warn("[GTD-WORLD-002/VM-G02] Extended unsupported Ferrari travel", {
          gapMetres: gap, airborneSeconds: this.vertical.airborneSeconds,
          pose: { ...translation },
        });
        this.warningEmitted = true;
      }
      if (gap < 0.15) this.warningEmitted = false;
    }
  }

  /**
   * Current car location is authoritative, not the saved boarding point.
   * Sample actual Rapier ground and reject occupied or high/low exit slots.
   */
  findSafeExitPosition(): VehicleWorldPoint | null {
    const at = this.body.translation();
    const bottomY = at.y - this.dimensions.y / 2;
    const world = this.physics.world;
    const capsule = new RAPIER.Capsule(0.55, 0.35);
    const identity = { x: 0, y: 0, z: 0, w: 1 };
    for (const offset of ferrariExitOffsets(this.headingYaw, this.dimensions.x, this.dimensions.z)) {
      const x = at.x + offset.x;
      const z = at.z + offset.z;
      const rayStart = bottomY + 2.2;
      const hit = world.castRay(
        new RAPIER.Ray({ x, y: rayStart, z }, { x: 0, y: -1, z: 0 }),
        4.2, true, undefined, undefined, this.collider,
      );
      if (!hit) continue;
      const groundY = rayStart - hit.timeOfImpact;
      if (!Number.isFinite(groundY) ||
          Math.abs(groundY - bottomY) > MAX_EXIT_HEIGHT_DIFFERENCE_METRES) continue;
      const pos = { x, y: groundY + 0.93, z };
      const obstruction = world.intersectionWithShape(
        pos, identity, capsule, undefined, undefined, this.collider, this.body,
      );
      if (!obstruction) return pos;
    }
    return null;
  }

  dispose() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.wheelRig.dispose();
    this.controller.free();
    this.physics.world.removeRigidBody(this.body);
  }
}
