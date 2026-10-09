import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import { MeridianPhysics } from "../game/physics/rapier-world";
import { FIRST_LIGHT_CITY_SPEC, CityRegistry, BlockLifecycle, generateBuilding, resolveCityBuildings } from "../game/world-generation";
describe("Meridian Step 5 streaming prerequisites", () => {
  it("reclaims generated colliders on disposal", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    try {
      const garage = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC).find((b) => b.id === "sw-fl-garage")!;
      const baseline = physics.world.colliders.len();
      const building = generateBuilding(scene, physics, garage, {
        generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion,
      });
      expect(physics.world.colliders.len()).toBeGreaterThan(baseline);
      building.dispose();
      expect(physics.world.colliders.len()).toBe(baseline);
    } finally {
      physics.destroy(); scene.dispose(); engine.dispose();
    }
  });
  it("retains stable block references", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    expect(registry.getBlock("sw-fl-main-north")?.block.lots).toHaveLength(3);
  });
});
