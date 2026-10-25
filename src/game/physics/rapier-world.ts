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
  /** Physical portal thresholds that a vehicle must not climb via autostep. */
  private readonly vehicleNoStepColliders = new Map<number, RAPIER.Collider>();
  // NH-010 vehicle-only swept barriers: DO NOT register Rapier colliders,
  // because people must be able to enter actual pedestrian doorways.
  private readonly vehicleOnlyFootprints = new Map<number,{
    x:number;z:number;halfX:number;halfZ:number;yaw:number;
  }>();
  private nextVehicleOnlyHandle=1;
  private readonly vehicleNoStepFootprints = new Map<number, {
    x: number; z: number; halfX: number; halfZ: number; yaw: number;
  }>();

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
    this.controller.enableSnapToGround(0.22);
    // Ordinary urban height changes should feel like steps, not invisible
    // geometry. Curbs/thresholds below this limit are traversed automatically;
    // larger props remain blocking collision.
    this.controller.enableAutostep(0.28, 0.18, false);
  }

  static async create(): Promise<MeridianPhysics> {
    await RAPIER.init();
    return new MeridianPhysics(new RAPIER.World({ x: 0, y: -9.81, z: 0 }));
  }

  addStaticBox(
    position: Vec3,
    halfExtents: Vec3,
    yawRadians = 0,
    options: { vehicleNoStep?: boolean } = {},
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
    let noStepCollider: RAPIER.Collider | null = null;
    try {
      const collider = this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          halfExtents.x,
          halfExtents.y,
          halfExtents.z,
        ),
        body,
      );
      if (options.vehicleNoStep) {
        this.vehicleNoStepColliders.set(collider.handle, collider);
        this.vehicleNoStepFootprints.set(collider.handle, {
          x: position.x, z: position.z,
          halfX: halfExtents.x, halfZ: halfExtents.z, yaw: yawRadians,
        });
        noStepCollider = collider;
      }
    } catch (error) {
      this.world.removeRigidBody(body);
      throw error;
    }

    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (noStepCollider) {
          this.vehicleNoStepColliders.delete(noStepCollider.handle);
          this.vehicleNoStepFootprints.delete(noStepCollider.handle);
        }
        this.world.removeRigidBody(body);
      },
    };
  }

  /** Explicit physical collision metadata, not an invisible taller wall. */
  isVehicleNoStepCollider(collider: RAPIER.Collider): boolean {
    return this.vehicleNoStepColliders.has(collider.handle);
  }

  /** Cheap distance gate: precise Rapier shape queries only near actual portals. */
  isNearVehicleNoStepCollider(point: Vec3, range: number): boolean {
    for (const collider of this.vehicleNoStepColliders.values()) {
      const p = collider.translation();
      if (Math.abs(p.x - point.x) < range && Math.abs(p.z - point.z) < range) return true;
    }
    return false;
  }

  /** Vehicle-only building footprints; no new physical collider or invisible
   * pedestrian obstruction. The shared drive solver samples these as swept
   * plan-view SAT obstacles. */
  addVehiclePlanarBarrier(footprint:{
    x:number;z:number;halfX:number;halfZ:number;yaw?:number;
  }):StaticCollisionHandle{
    const id=this.nextVehicleOnlyHandle++;
    this.vehicleOnlyFootprints.set(id,{...footprint,yaw:footprint.yaw??0});
    return {dispose:()=>{this.vehicleOnlyFootprints.delete(id);}};
  }
  /** Exact XZ bounds of tagged obstacles and district building envelopes. */
  vehicleNoStepFootprintsNear(position: Vec3, radius: number): ReadonlyArray<{
    readonly x: number; readonly z: number;
    readonly halfX: number; readonly halfZ: number; readonly yaw: number;
  }> {
    const results = [];
    for (const pool of [this.vehicleNoStepFootprints,this.vehicleOnlyFootprints]){
      for(const footprint of pool.values()){
        if(Math.abs(footprint.x-position.x)<=radius+footprint.halfX&&
           Math.abs(footprint.z-position.z)<=radius+footprint.halfZ)
          results.push(footprint);
      }
    }
    return results;
  }

  addStaticCylinder(
    position: Vec3,
    halfHeight: number,
    radius: number,
  ): StaticCollisionHandle {
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(
        position.x,
        position.y,
        position.z,
      ),
    );
    try {
      this.world.createCollider(
        RAPIER.ColliderDesc.cylinder(halfHeight, radius),
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

  /** World-accurate ray against existing Rapier ground; exclude player capsule. */
  probeGround(origin: Vec3, maxDistance = 2): { x:number;y:number;z:number;normal:Vec3 } | null {
    const max = Math.max(0.1, Math.min(4, maxDistance));
    const ray = new RAPIER.Ray(origin, { x:0, y:-1, z:0 });
    const hit = this.world.castRayAndGetNormal(ray,max,true,undefined,undefined,this.playerCollider);
    if(!hit)return null;
    const distance=hit.timeOfImpact;
    return {x:origin.x,y:origin.y-distance,z:origin.z,
      normal:{x:hit.normal.x,y:hit.normal.y,z:hit.normal.z}};
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
