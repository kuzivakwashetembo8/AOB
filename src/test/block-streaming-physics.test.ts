import { describe, expect, it } from "vitest";
import { updateBlockStreaming } from "../game/world-generation";
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
  it("allocates and disposes block-owned resources exactly once", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    const disposed: string[] = [];
    const runtime = new BlockLifecycle(registry, (building) => ({
      dispose: () => { disposed.push(building.id); },
    }));
    runtime.acquire("sw-fl-main-north");
    runtime.acquire("sw-fl-main-north");
    expect(runtime.getActiveIds()).toEqual(["sw-fl-main-north"]);
    runtime.discard("sw-fl-main-north");
    runtime.discard("sw-fl-main-north");
    expect(disposed).toHaveLength(3);
  });
  it("rolls back partial block creation on factory failure", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    let made = 0, cleaned = 0;
    const runtime = new BlockLifecycle(registry, () => {
      if (++made === 2) throw new Error("factory failed");
      return { dispose: () => { cleaned++; } };
    });
    expect(() => runtime.acquire("sw-fl-main-north")).toThrow("factory failed");
    expect(runtime.getActiveIds()).toHaveLength(0);
    expect(cleaned).toBe(1);
  });
  it("rejects invalid streaming distances", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    const runtime = new BlockLifecycle(registry, () => ({ dispose() {} }));
    expect(() => updateBlockStreaming(runtime, { x: 0, y: 0, z: 0 },
      { activateWithin: 10, discardBeyond: 5 })).toThrow();
  });
  it("activates nearby blocks", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    const runtime = new BlockLifecycle(registry, () => ({ dispose() {} }));
    updateBlockStreaming(runtime, { x: 0, y: 0, z: 0 });
    expect(runtime.getActiveIds().length).toBeGreaterThan(0);
  });
  it("retains stable block references", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    expect(registry.getBlock("sw-fl-main-north")?.block.lots).toHaveLength(3);
  });
});
