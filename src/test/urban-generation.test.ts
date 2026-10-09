import { describe, expect, it } from "vitest";
import { FIRST_LIGHT_CITY_SPEC, planRoadGraph, CityRegistry } from "../game/world-generation";
describe("Meridian Step 5 roads", () => {
  it("indexes stable First Light identities", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    expect(registry.getBuilding("sw-fl-garage")?.archetype).toBe("garage");
    expect(registry.getBuildingsInBlock("sw-fl-main-north")).toHaveLength(3);
  });
  it("plans First Light roads", () => {
    const plan = planRoadGraph(FIRST_LIGHT_CITY_SPEC.roads);
    expect(plan.surfaces).toHaveLength(5);
    expect(plan.junctions).toHaveLength(2);
  });
});
