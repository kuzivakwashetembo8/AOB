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

export interface DriveTrialDimensions { readonly x: number; readonly y: number; readonly z: number }
export interface VehicleWorldPoint { readonly x: number; readonly y: number; readonly z: number }
export const FERRARI_CURB_MAX_METRES = 0.24;
const FERRARI_GROUND_SNAP_METRES = 0.25;
const FERRARI_MIN_STEP_WIDTH_METRES = 0.08;
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
  private readonly wheels: { node: TransformNode; front: boolean; originalZ: number }[];
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
        FERRARI_CURB_MAX_METRES, FERRARI_MIN_STEP_WIDTH_METRES, false,
      );
      this.controller.enableSnapToGround(FERRARI_GROUND_SNAP_METRES);
      this.controller.setApplyImpulsesToDynamicBodies(true);
    } catch (error) {
      physics.world.removeRigidBody(this.body);
      throw error;
    }
    this.lastX = anchor.position.x;
    this.lastZ = anchor.position.z;
    const descendants = anchor.getDescendants(false);
    this.wheels = (["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"] as const)
      .map(name => {
        const node = descendants.find(item =>
          item instanceof TransformNode && (
            item.name === name || item.name.endsWith(":" + name)
          ),
        );
        return node instanceof TransformNode
          ? { node, originalZ: node.rotation.z, front: name === "wheel_fl" || name === "wheel_fr" }
          : null;
      })
      .filter((item): item is { node: TransformNode; front: boolean; originalZ: number } => item !== null);
  }

  get pose(): VehicleWorldPoint { return this.body.translation(); }
  get headingYaw() { return this.anchor.rotation.y; }
  get speedMps() { return this.drive.speedMps; }
  get wheelCount() { return this.wheels.length; }
  get status() { return {
    speedMps: this.speedMps, wheelCount: this.wheelCount,
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
    // A small, ongoing downward component maintains actual ground contact.
    // This is NOT a rigid-body hop, height teleport, or frictionless noclip.
    this.controller.computeColliderMovement(this.collider, {
      x: forward.x * dt,
      y: -0.24 * dt,
      z: forward.z * dt,
    });
    const corrected = this.controller.computedMovement();
    const at = this.body.translation();
    this.body.setNextKinematicTranslation({
      x: at.x + corrected.x,
      y: at.y + corrected.y,
      z: at.z + corrected.z,
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
    const roll = (travelled / 0.32) * (this.drive.speedMps < 0 ? -1 : 1);
    for (const wheel of this.wheels) {
      wheel.node.rotation.x += roll;
      if (wheel.front) wheel.node.rotation.z = wheel.originalZ + this.drive.steeringRadians;
    }
    if (!Number.isFinite(dt)) throw new Error("Invalid vehicle simulation time");
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
    this.controller.free();
    this.physics.world.removeRigidBody(this.body);
  }
}
