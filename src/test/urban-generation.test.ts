import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import {
  CITY_SCHEMA_VERSION,
  FIRST_LIGHT_CITY_SPEC,
  CityRegistry,
  createGeneratedStreetContext,
  createGeneratedUrbanSurfaces,
  planLotOrientation,
  planNeighborhood,
  planRoadGraph,
  planRoadMarkings,
  planStreetContext,
} from "../game/world-generation";

describe("Meridian Step 5 roads and fidelity context", () => {
  it("indexes stable First Light identities", () => {
    const registry = new CityRegistry(FIRST_LIGHT_CITY_SPEC);
    expect(registry.getBuilding("sw-fl-garage")?.archetype).toBe("garage");
    expect(registry.getBuildingsInBlock("sw-fl-main-north")).toHaveLength(3);
  });

  it("orients First Light lots toward their assigned streets", () => {
    const blocks =
      FIRST_LIGHT_CITY_SPEC.districts[0]!.neighborhoods[0]!.blocks;
    expect(
      planLotOrientation(FIRST_LIGHT_CITY_SPEC, blocks[0]!.lots[1]!)
        .yawRadians,
    ).toBeCloseTo(0);
    expect(
      Math.abs(
        planLotOrientation(FIRST_LIGHT_CITY_SPEC, blocks[1]!.lots[0]!)
          .yawRadians,
      ),
    ).toBeCloseTo(Math.PI);
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

  it("plans First Light roads and intersection-safe marking geometry", () => {
    const plan = planRoadGraph(FIRST_LIGHT_CITY_SPEC.roads);
    expect(plan.surfaces).toHaveLength(5);
    expect(plan.junctions).toHaveLength(2);
    const markings = planRoadMarkings(FIRST_LIGHT_CITY_SPEC);
    expect(markings.length).toBeGreaterThan(10);
    expect(
      markings.every(
        (item) =>
          Number.isFinite(item.center.x) &&
          Number.isFinite(item.center.z) &&
          item.length > 0 &&
          item.width > 0,
      ),
    ).toBe(true);
    expect(markings.some((item) => item.kind === "stop-line")).toBe(true);
  });

  it("plans deterministic vegetation, streetlights, vehicles and pocket props", () => {
    const first = planStreetContext(FIRST_LIGHT_CITY_SPEC);
    expect(planStreetContext(FIRST_LIGHT_CITY_SPEC)).toEqual(first);
    expect(first.treeCount).toBeGreaterThanOrEqual(3);
    expect(first.streetlightCount).toBeGreaterThanOrEqual(2);
    expect(first.parkedCarCount).toBeGreaterThanOrEqual(2);
    expect(first.propCount).toBeGreaterThanOrEqual(2);
    expect(new Set(first.items.map((item) => item.id)).size).toBe(
      first.items.length,
    );
  });

  it("renders and disposes generated urban surfaces and context under NullEngine", () => {
    expect(FIRST_LIGHT_CITY_SPEC.schemaVersion).toBe(CITY_SCHEMA_VERSION);
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const surfaces = createGeneratedUrbanSurfaces(
        scene,
        FIRST_LIGHT_CITY_SPEC,
      );
      const context = createGeneratedStreetContext(
        scene,
        FIRST_LIGHT_CITY_SPEC,
      );
      expect(surfaces.meshes.length).toBeGreaterThan(20);
      expect(surfaces.markingPlan.length).toBeGreaterThan(10);
      expect(context.itemCount).toBeGreaterThan(5);
      expect(context.meshes.length).toBeGreaterThan(context.itemCount);
      context.dispose();
      surfaces.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
