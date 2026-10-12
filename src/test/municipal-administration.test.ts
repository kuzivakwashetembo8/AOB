import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import {
  FIRST_LIGHT_CITY_SPEC,
  resolveCityBuildings,
} from "../game/world-generation";
import {
  facadeFrontAnchor,
  planMunicipalStreetObjects,
  MUNICIPAL_TEMPLATES,
} from "../game/world-generation/municipal-object-plan";
import {
  createMunicipalStreetContext,
} from "../game/world-generation/municipal-object-renderer";
import { projectToRoad } from "../game/world-generation/road-graph";

const plan = planMunicipalStreetObjects(FIRST_LIGHT_CITY_SPEC);

describe("SO-MA municipal administration scene and authored shop boards", () => {
  it("anchors TWO user WebP sign states to actual commercial frontages", () => {
    const boards = plan.filter(x => x.kind === "shop-board");
    expect(boards).toHaveLength(2);
    expect(new Set(boards.map(x => x.assetId))).toEqual(
      new Set(["south-ward-shop-open", "south-ward-shop-closed"]),
    );
    const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
    for (const item of boards) {
      const building = buildings.find(b => b.id === item.buildingId)!;
      expect(["commercial", "mixed-use"]).toContain(building.archetype);
      expect(item.position).toEqual(facadeFrontAnchor(
        building, -1.5, 2.25, 0.38,
      ));
      expect(item.anchorType).toBe("facade");
      expect(item.collision).toBe("none");
      expect(item.position.y - item.dimensionsMeters.height / 2).toBeGreaterThan(2);
    }
  });

  it("gives each shop a conspicuous name and white LED fixture", () => {
    const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC)
      .filter(b => b.archetype === "commercial" || b.archetype === "mixed-use");
    expect(plan.filter(x => x.kind === "shop-name")).toHaveLength(buildings.length);
    expect(plan.filter(x => x.kind === "storefront-led")).toHaveLength(buildings.length);
    const corner = plan.filter(x => x.buildingId === "sw-fl-corner-commercial");
    expect(corner.some(x => x.kind === "shop-name" && x.label === "MERCER CORNER STORE")).toBe(true);
    expect(corner.some(x => x.kind === "storefront-led")).toBe(true);
    expect(corner.some(x => x.kind === "shop-board")).toBe(true);
  });

  it("places a visible cluster at the Mercer corner, not across the entire district", () => {
    const nearShop = plan.filter(x =>
      Math.hypot(x.position.x - 29.2, x.position.z - 14) < 10);
    expect(nearShop.filter(x => x.kind === "wheelie-bin").length).toBeGreaterThanOrEqual(2);
    expect(nearShop.some(x => x.kind === "hydrant")).toBe(true);
    expect(nearShop.some(x => x.kind === "street-name")).toBe(true);
    expect(nearShop.some(x => x.kind === "utility-cabinet")).toBe(true);
  });

  it("keeps authored urban furniture purposeful, unique and outside road lanes", () => {
    const ids = plan.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const kinds = new Set(plan.map(p => p.kind));
    for (const kind of ["wheelie-bin", "hydrant", "bollard",
      "street-name", "utility-cabinet", "stop-sign", "shop-board"]) {
      expect(kinds.has(kind as typeof plan[number]["kind"])).toBe(true);
    }
    for (const p of plan) {
      const recipe = MUNICIPAL_TEMPLATES[p.kind];
      expect(p.dimensionsMeters.width).toBe(recipe.width);
      expect([p.position.x,p.position.y,p.position.z,p.yawRadians].every(Number.isFinite)).toBe(true);
      if (p.anchorType !== "authored-ground") continue;
      const road = projectToRoad(FIRST_LIGHT_CITY_SPEC.roads,p.position);
      expect(road).not.toBeNull();
      expect(road!.distance, p.id).toBeGreaterThan(road!.roadWidth / 2);
    }
  });

  it("gets street plate names from the actual road graph, not fixed renderer copy", () => {
    for (const plate of plan.filter(x => x.kind === "street-name")) {
      const projection = projectToRoad(FIRST_LIGHT_CITY_SPEC.roads, plate.position)!;
      expect(plate.label).toBe(
        FIRST_LIGHT_CITY_SPEC.roads.segments.find(x => x.id === projection.segmentId)?.name,
      );
    }
  });

  it("renders / disposes every planned mesh in Babylon NullEngine without image network requests", () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    try {
      const context = createMunicipalStreetContext(scene, plan);
      expect(context.itemCount).toBe(plan.length);
      expect(context.boards).toHaveLength(2);
      expect(context.meshes.length).toBeGreaterThan(12);
      expect(scene.meshes.length).toBe(context.meshes.length);
      context.dispose();
      context.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally { scene.dispose(); engine.dispose(); }
  });

  it("reuses deterministic placements for the same world", () => {
    expect(planMunicipalStreetObjects(FIRST_LIGHT_CITY_SPEC)).toEqual(plan);
  });
});
