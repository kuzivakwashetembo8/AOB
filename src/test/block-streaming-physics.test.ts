import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import { MeridianPhysics } from "../game/physics/rapier-world";
import { FIRST_LIGHT_CITY_SPEC, CityRegistry, generateBuilding, resolveCityBuildings } from "../game/world-generation";
describe("Meridian Step 5 streaming prerequisites", () => {
  it("retains stable block references", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    expect(registry.getBlock("sw-fl-main-north")?.block.lots).toHaveLength(3);
  });
});
