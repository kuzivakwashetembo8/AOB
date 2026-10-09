import RAPIER from "@dimforge/rapier3d-compat";
import type { MeridianPhysics } from "../physics/rapier-world";
export interface CollisionContext { readonly world: MeridianPhysics; }
export function colliderCount(context: CollisionContext): number { return context.world.world.colliders.len(); }

export function makeStaticBody(context: CollisionContext) {
  return context.world.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
}
