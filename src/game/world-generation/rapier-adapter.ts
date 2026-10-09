import RAPIER from "@dimforge/rapier3d-compat";
import type { MeridianPhysics } from "../physics/rapier-world";
import type { BuildingInteractionPlan } from "./interaction-plan";
import type { WorldPosition } from "./schema";

/** A compound Rapier body owned by a generated building. */
export interface BuildingCollisionHandle {
  readonly colliderCount: number;
  dispose(): void;
}

/**
 * Register a single fixed body with local cuboid colliders, using the same
 * origin and yaw as the Babylon root. No render mesh is used as physics input.
 */
export function registerBuildingCollision(
  physics: MeridianPhysics,
  origin: WorldPosition,
  yawRadians: number,
  plan: BuildingInteractionPlan,
): BuildingCollisionHandle {
  if (!Number.isFinite(yawRadians) ||
      ![origin.x, origin.y, origin.z].every(Number.isFinite)) {
    throw new Error("Invalid generated-building collision transform");
  }
  for (const box of plan.collisionBoxes) {
    if (![box.center.x, box.center.y, box.center.z,
      box.size.x, box.size.y, box.size.z, box.rotationZ ?? 0].every(Number.isFinite) ||
      box.size.x <= 0 || box.size.y <= 0 || box.size.z <= 0) {
      throw new Error("Invalid generated-building collider " + box.id);
    }
  }
  if (plan.collisionBoxes.length === 0) return { colliderCount: 0, dispose() {} };
  const halfYaw = yawRadians / 2;
  const body = physics.world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed()
      .setTranslation(origin.x, origin.y, origin.z)
      .setRotation({ x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) }),
  );
  try {
    for (const box of plan.collisionBoxes) {
      const desc = RAPIER.ColliderDesc.cuboid(
        box.size.x / 2, box.size.y / 2, box.size.z / 2,
      ).setTranslation(box.center.x, box.center.y, box.center.z);
      if (box.rotationZ !== undefined) {
        const half = box.rotationZ / 2;
        desc.setRotation({ x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) });
      }
      physics.world.createCollider(desc, body);
    }
  } catch (error) {
    physics.world.removeRigidBody(body);
    throw error;
  }
  let disposed = false;
  return {
    colliderCount: plan.collisionBoxes.length,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      // Removing the rigid body also reclaims all attached colliders.
      physics.world.removeRigidBody(body);
    },
  };
}
