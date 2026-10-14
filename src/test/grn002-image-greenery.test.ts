import { describe, expect, it } from "vitest";
import { NullEngine, Scene, StandardMaterial } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { createGeneratedStreetContext } from "../game/world-generation/street-context-renderer";
import { createGeneratedFirstLightWorld } from "../game/world/generated-first-light-world";
import { MeridianPhysics } from "../game/physics/rapier-world";
import { planGroundLandUse, LAND_FINISHES } from "../game/world-generation/ground-land-use";

describe("GRN-005: accepted native greenery, no photographic runtime path", () => {
  it("uses the same generated leaf material on every tree and shrub", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const context = createGeneratedStreetContext(scene, FIRST_LIGHT_CITY_SPEC, {
        skipPocketParkGround: true,
      });
      const treeCards = context.meshes.filter(mesh =>
        mesh.name.startsWith("generated-tree-foliage:"));
      const shrubCards = context.meshes.filter(mesh =>
        mesh.name.startsWith("generated-shrub-card:"));
      expect(treeCards.length).toBeGreaterThanOrEqual(90);
      expect(treeCards.length % 30).toBe(0);
      expect(shrubCards.length).toBeGreaterThan(0);
      expect([...treeCards, ...shrubCards].every(mesh =>
        mesh.material?.name === "generated-tree-foliage-material")).toBe(true);
      expect([...treeCards, ...shrubCards].every(mesh => mesh.isEnabled())).toBe(true);
      expect(scene.materials.some(material => material.name.includes("photo-foliage"))).toBe(false);
      expect(context.meshes.some(mesh => mesh.name.startsWith("grn003-aerial-foliage:"))).toBe(false);
      context.dispose();
      expect(context.meshes.every(mesh => mesh.isDisposed())).toBe(true);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("retains procedural grass, original ground geometry, and collider lifecycle", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    try {
      const plan = planGroundLandUse(FIRST_LIGHT_CITY_SPEC,
        { left: -80, right: 80, north: -45, south: 85 });
      expect(LAND_FINISHES).toEqual(["GRN-01"]);
      expect(plan.kinds).toHaveLength(20800);
      const initialBodies = physics.world.bodies.len();
      const world = createGeneratedFirstLightWorld(scene, physics, {
        enableLandUsePreview: true,
        enableShadows: false,
      });
      const ground = scene.getMeshByName("generated-first-light-ground");
      expect((ground?.material as StandardMaterial).diffuseTexture?.name)
        .toBe("ground004-grass-only");
      expect(ground?.getTotalVertices()).toBe(4);
      expect(world.buildings).toHaveLength(10);
      expect(physics.world.bodies.len()).toBeGreaterThan(initialBodies);
      world.dispose();
      expect(physics.world.bodies.len()).toBe(initialBodies);
    } finally {
      physics.destroy();
      scene.dispose();
      engine.dispose();
    }
  });
});
