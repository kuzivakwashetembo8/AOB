import { describe, expect, it } from "vitest";
import { FIRST_LIGHT_CITY_SPEC, planRoadGraph, CityRegistry, planLotOrientation, planNeighborhood } from "../game/world-generation";
describe("Meridian Step 5 roads", () => {
  it("indexes stable First Light identities", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    expect(registry.getBuilding("sw-fl-garage")?.archetype).toBe("garage");
    expect(registry.getBuildingsInBlock("sw-fl-main-north")).toHaveLength(3);
  });
  it("orients First Light lots toward their assigned streets", () => {
    const blocks = FIRST_LIGHT_CITY_SPEC.districts[0]!.neighborhoods[0]!.blocks;
    expect(planLotOrientation(FIRST_LIGHT_CITY_SPEC, blocks[0]!.lots[1]!).yawRadians).toBeCloseTo(0);
    expect(Math.abs(planLotOrientation(FIRST_LIGHT_CITY_SPEC, blocks[1]!.lots[0]!).yawRadians))
      .toBeCloseTo(Math.PI);
  });
  it("keeps neighborhood composition deterministic", () => {
    const city = FIRST_LIGHT_CITY_SPEC;
    const before = JSON.stringify(city);
    const first = planNeighborhood(city, "south-ward-first-light");
    expect(first.lots).toHaveLength(10);
    expect(first.skylineAnchorBuildingIds).toHaveLength(2);
    expect(planNeighborhood(city, "south-ward-first-light")).toEqual(first);
    expect(JSON.stringify(city)).toBe(before);
  });
  it("plans First Light roads", () => {
    const plan = planRoadGraph(FIRST_LIGHT_CITY_SPEC.roads);
    expect(plan.surfaces).toHaveLength(5);
    expect(plan.junctions).toHaveLength(2);
  });
});
