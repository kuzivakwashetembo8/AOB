import type { MeridianPhysics } from "../physics/rapier-world";
export interface CollisionContext { readonly world: MeridianPhysics; }
export function colliderCount(context: CollisionContext): number { return context.world.world.colliders.len(); }
