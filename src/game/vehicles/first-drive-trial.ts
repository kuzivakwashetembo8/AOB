/**
 * EXP-VEH-002: one controlled Ferrari specimen in the existing Meridia world.
 * Rapier dynamic chassis owns the pose. Imported Babylon visuals follow it.
 * No traffic AI, drifting, suspension, or wheel-contact physics is claimed.
 */
import RAPIER from "@dimforge/rapier3d-compat";
import { TransformNode } from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";
import { stepDriveControl, type DriveState } from "./drive-kinematics";

export interface DriveTrialDimensions { readonly x: number; readonly y: number; readonly z: number }
export class FirstDriveTrial {
  private readonly body: RAPIER.RigidBody;
  private readonly initialYaw: number;
  private drive: DriveState = { speedMps: 0, steeringRadians: 0 };
  private lastX: number;
  private lastZ: number;
  private distanceMetres = 0;
  private readonly wheels: { node: TransformNode; originalX: number; originalZ: number; front: boolean }[];
  private destroyed = false;

  constructor(
    private readonly physics: MeridianPhysics,
    readonly anchor: TransformNode,
    readonly dimensions: DriveTrialDimensions,
  ) {
    if (![dimensions.x, dimensions.y, dimensions.z].every(n => Number.isFinite(n) && n > 0)) {
      throw new Error("Ferrari trial requires the imported visual's real calibrated bounds");
    }
    this.initialYaw = anchor.rotation.y;
    const halfYaw = this.initialYaw / 2;
    this.body = physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(anchor.position.x, anchor.position.y + dimensions.y / 2 + 0.025, anchor.position.z)
        .setRotation({ x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) })
        .setLinearDamping(1.1)
        .setAngularDamping(3)
        .enabledRotations(false, true, false)
        .setCanSleep(false),
    );
    try {
      physics.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          dimensions.x / 2, dimensions.y / 2, dimensions.z / 2,
        ).setFriction(0.85).setRestitution(0),
        this.body,
      );
      this.body.enableCcd(true);
    } catch (error) {
      physics.world.removeRigidBody(this.body);
      throw error;
    }
    this.lastX = anchor.position.x;
    this.lastZ = anchor.position.z;
    // Preserve every source model's original transforms and silently skip
    // wheel animation where the GLB has no independently addressable wheels.
    const descendants = anchor.getDescendants(false);
    this.wheels = (["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"] as const)
      .map(name => {
        const node = descendants.find(item =>
          item instanceof TransformNode && (
            item.name === name || item.name.endsWith(":" + name)
          ),
        );
        if (!(node instanceof TransformNode)) return null;
        return {
          node, originalX: node.rotation.x, originalZ: node.rotation.z,
          front: name === "wheel_fl" || name === "wheel_fr",
        };
      })
      .filter((item): item is {
        node: TransformNode; originalX: number; originalZ: number; front: boolean
      } => item !== null);
  }

  get pose() { return this.body.translation(); }
  get speedMps() { return this.drive.speedMps; }
  get wheelCount() { return this.wheels.length; }
  get status() { return { speedMps: this.speedMps, wheelCount: this.wheelCount,
    distanceMetres: this.distanceMetres }; }

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
    // Rapier owns collisions, vertical gravity and horizontal resolution.
    // No manual transform translation or independent render-frame physics.
    const previous = this.body.linvel();
    this.body.setLinvel({
      x: Math.sin(yaw) * next.speedMps,
      y: previous.y,
      z: Math.cos(yaw) * next.speedMps,
    }, true);
    this.body.setAngvel({
      x: 0, y: next.yawRateRadiansPerSecond, z: 0,
    }, true);
  }

  finish(dt: number) {
    if (this.destroyed) return;
    const translation = this.body.translation();
    const q = this.body.rotation();
    this.anchor.position.set(
      translation.x, translation.y - this.dimensions.y / 2, translation.z,
    );
    this.anchor.rotation.y = 2 * Math.atan2(q.y, q.w);
    const travelled = Math.hypot(
      translation.x - this.lastX, translation.z - this.lastZ,
    );
    this.lastX = translation.x;
    this.lastZ = translation.z;
    this.distanceMetres += travelled;
    // Wheel motion uses observed travel, not requested throttle.
    const radius = 0.32; // Visual-only provisional radius, pending wheel GLB inspection.
    const roll = (travelled / radius) * (this.drive.speedMps < 0 ? -1 : 1);
    for (const wheel of this.wheels) {
      wheel.node.rotation.x += roll;
      if (wheel.front) {
        wheel.node.rotation.z = wheel.originalZ + this.drive.steeringRadians;
      }
    }
    if (!Number.isFinite(dt)) throw new Error("Invalid vehicle simulation time");
  }

  dispose() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.physics.world.removeRigidBody(this.body);
  }
}
