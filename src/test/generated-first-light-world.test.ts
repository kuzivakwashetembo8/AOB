import { NullEngine, Scene } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { MeridianPhysics } from "../game/physics/rapier-world";
import {
  ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
  createFirstLightRuntimeWorld,
} from "../game/world/first-light-runtime-source";
import { createGeneratedFirstLightWorld } from "../game/world/generated-first-light-world";

describe("Generated First Light live-runtime world", () => {
  it("selects Generated First Light as the active gameplay source", () => {
    expect(ACTIVE_FIRST_LIGHT_WORLD_SOURCE).toBe("generated-first-light");
  });

  it("creates a finite semantic player spawn and expected world metadata", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    try {
      const world = createGeneratedFirstLightWorld(scene, physics, {
        enableCameraBlockers: true,
        enableShadows: true,
      });
      expect(world.spawn.x).toBeCloseTo(-7.5);
      expect(world.spawn.y).toBeCloseTo(0.92);
      expect(world.spawn.z).toBeCloseTo(2.45);
      expect(
        [world.spawn.x, world.spawn.y, world.spawn.z].every(Number.isFinite),
      ).toBe(true);
      expect(world.location).toBe("South Ward // First Light");
      expect(world.objective).toContain("generated South Ward");
      expect(world.buildings).toHaveLength(10);
      expect(world.shadowGenerator).toBeNull();
      expect(
        world.buildings.some((building) => building.cameraBlockers.length > 0),
      ).toBe(true);
      const ground = scene.getMeshByName("generated-first-light-ground");
      expect(ground?.metadata?.cameraBlocker).toBe(true);
      expect(ground?.metadata?.cameraGround).toBe(true);
      world.dispose();
    } finally {
      physics.destroy();
      scene.dispose();
      engine.dispose();
    }
  });

  it("reclaims the complete generated world physics allocation on disposal", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    const baselineBodies = physics.world.bodies.len();
    const baselineColliders = physics.world.colliders.len();
    try {
      const world = createGeneratedFirstLightWorld(scene, physics, {
        enableCameraBlockers: true,
        enableShadows: false,
      });
      expect(physics.world.bodies.len()).toBeGreaterThan(baselineBodies);
      expect(physics.world.colliders.len()).toBeGreaterThan(baselineColliders);
      world.dispose();
      expect(physics.world.bodies.len()).toBe(baselineBodies);
      expect(physics.world.colliders.len()).toBe(baselineColliders);
    } finally {
      physics.destroy();
      scene.dispose();
      engine.dispose();
    }
  });

  it("survives repeated full-world create-dispose cycles", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    const baselineBodies = physics.world.bodies.len();
    const baselineColliders = physics.world.colliders.len();
    try {
      for (let cycle = 0; cycle < 10; cycle += 1) {
        const world = createFirstLightRuntimeWorld(
          scene,
          physics,
          "generated-first-light",
        );
        expect(physics.world.bodies.len()).toBeGreaterThan(baselineBodies);
        expect(physics.world.colliders.len()).toBeGreaterThan(baselineColliders);
        world.dispose();
        expect(physics.world.bodies.len()).toBe(baselineBodies);
        expect(physics.world.colliders.len()).toBe(baselineColliders);
      }
    } finally {
      physics.destroy();
      scene.dispose();
      engine.dispose();
    }
  }, 15_000);
});
