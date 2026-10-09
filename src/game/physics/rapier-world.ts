import RAPIER from "@dimforge/rapier3d-compat";

export type Vec3 = { x: number; y: number; z: number };

export interface StaticCollisionHandle {
  dispose(): void;
}

export class MeridianPhysics {
  readonly world: RAPIER.World;
  private readonly playerBody: RAPIER.RigidBody;
  private readonly playerCollider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;

  private constructor(world: RAPIER.World) {
    this.world = world;
    this.playerBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.92, 0),
    );
    this.playerCollider = world.createCollider(
      RAPIER.ColliderDesc.capsule(0.55, 0.35).setFriction(0),
      this.playerBody,
    );
    this.controller = world.createCharacterController(0.03);
    this.controller.setApplyImpulsesToDynamicBodies(true);
    this.controller.enableSnapToGround(0.18);
  }

  static async create(): Promise<MeridianPhysics> {
    await RAPIER.init();
    return new MeridianPhysics(new RAPIER.World({ x: 0, y: -9.81, z: 0 }));
  }

  addStaticBox(
    position: Vec3,
    halfExtents: Vec3,
    yawRadians = 0,
  ): StaticCollisionHandle {
    const halfYaw = yawRadians / 2;
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(position.x, position.y, position.z)
        .setRotation({
          x: 0,
          y: Math.sin(halfYaw),
          z: 0,
          w: Math.cos(halfYaw),
        }),
    );
    try {
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          halfExtents.x,
          halfExtents.y,
          halfExtents.z,
        ),
        body,
      );
    } catch (error) {
      this.world.removeRigidBody(body);
      throw error;
    }

    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        this.world.removeRigidBody(body);
      },
    };
  }

  movePlayer(desired: Vec3): { movement: Vec3; grounded: boolean } {
    this.controller.computeColliderMovement(this.playerCollider, desired);
    const corrected = this.controller.computedMovement();
    const current = this.playerBody.translation();
    this.playerBody.setNextKinematicTranslation({
      x: current.x + corrected.x,
      y: current.y + corrected.y,
      z: current.z + corrected.z,
    });
    this.world.step();
    return {
      movement: { x: corrected.x, y: corrected.y, z: corrected.z },
      grounded: this.controller.computedGrounded(),
    };
  }

  setPlayerPosition(position: Vec3) {
    this.playerBody.setTranslation(position, true);
    this.playerBody.setNextKinematicTranslation(position);
  }

  playerPosition(): Vec3 {
    const p = this.playerBody.translation();
    return { x: p.x, y: p.y, z: p.z };
  }

  destroy() {
    this.controller.free();
    this.world.free();
  }
}
