import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import {
  CITY_SCHEMA_VERSION,
  FIRST_LIGHT_CITY_SPEC,
  CityRegistry,
  createGeneratedStreetContext,
  createGeneratedUrbanSurfaces,
  planCurbCuts,
  planLotOrientation,
  planNeighborhood,
  planRoadGraph,
  planRoadMarkings,
  planStreetContext,
} from "../game/world-generation";
import type { RoadNetworkSpec } from "../game/world-generation";

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

  it("plans authored-style orthogonal First Light junctions", () => {
    const plan = planRoadGraph(FIRST_LIGHT_CITY_SPEC.roads);
    expect(plan.surfaces).toHaveLength(5);
    expect(plan.junctions).toHaveLength(2);

    for (const junction of plan.junctions) {
      expect(junction.kind).toBe("t");
      expect(junction.cornerTreatment).toBe("orthogonal");
      expect(junction.asphalt).toHaveLength(4);
      expect(junction.sidewalkCorners).toHaveLength(4);
      expect(junction.roadMouths).toHaveLength(3);
      expect(junction.curbSegments.length).toBeGreaterThanOrEqual(4);
      expect(
        junction.curbSegments.every(
          (segment) => segment.length === 2,
        ),
      ).toBe(true);
      expect(junction.radius).toBeCloseTo(junction.halfExtent);
    }

    const main = plan.junctions.find(
      (junction) => junction.nodeId === "sw-fl-main-junction",
    )!;
    expect(main.roadMouths.map((mouth) => mouth.edge).sort()).toEqual(
      ["negative-x", "positive-x", "positive-z"].sort(),
    );

    const positiveZ = main.curbSegments.filter(
      ([a, b]) =>
        Math.abs(a.z - (8 + main.halfExtent)) < 0.001 &&
        Math.abs(b.z - (8 + main.halfExtent)) < 0.001,
    );
    expect(positiveZ.length).toBeGreaterThanOrEqual(2);
    expect(
      positiveZ.every(([a, b]) => {
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        return !(minX < 20 && maxX > 20);
      }),
    ).toBe(true);
  });

  it("plans a conventional four-way intersection without a radial cap", () => {
    const roads: RoadNetworkSpec = {
      nodes: [
        { id: "center", position: { x: 0, y: 0, z: 0 } },
        { id: "west", position: { x: -30, y: 0, z: 0 } },
        { id: "east", position: { x: 30, y: 0, z: 0 } },
        { id: "north", position: { x: 0, y: 0, z: -30 } },
        { id: "south", position: { x: 0, y: 0, z: 30 } },
      ],
      segments: [
        { id: "w", startNodeId: "west", endNodeId: "center", name: "W", roadClass: "local", width: 8, laneCount: 2, sidewalkWidth: 3.1 },
        { id: "e", startNodeId: "center", endNodeId: "east", name: "E", roadClass: "local", width: 8, laneCount: 2, sidewalkWidth: 3.1 },
        { id: "n", startNodeId: "north", endNodeId: "center", name: "N", roadClass: "local", width: 8, laneCount: 2, sidewalkWidth: 3.1 },
        { id: "s", startNodeId: "center", endNodeId: "south", name: "S", roadClass: "local", width: 8, laneCount: 2, sidewalkWidth: 3.1 },
      ],
      intersections: [
        {
          id: "cross",
          nodeId: "center",
          kind: "four-way",
          connectedSegmentIds: ["w", "e", "n", "s"],
        },
      ],
    };

    const junction = planRoadGraph(roads).junctions[0]!;
    expect(junction.kind).toBe("four-way");
    expect(junction.asphalt).toHaveLength(4);
    expect(junction.roadMouths).toHaveLength(4);
    expect(junction.cornerTreatment).toBe("orthogonal");
    expect(junction.sidewalkCorners).toHaveLength(4);
  });

  it("plans intersection-safe road markings and limits stop lines to T stems", () => {
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
    const stopLines = markings.filter((item) => item.kind === "stop-line");
    expect(stopLines).toHaveLength(2);
    expect(
      stopLines.every((item) =>
        item.id.startsWith("sw-fl-workshop-link"),
      ),
    ).toBe(true);
  });

  it("retains generic garage curb-cut planning without forcing it into First Light parity rendering", () => {
    const cuts = planCurbCuts(FIRST_LIGHT_CITY_SPEC);
    const garage = cuts.find((cut) => cut.id === "sw-fl-garage:vehicle-entry");
    expect(garage).toBeDefined();
    expect(garage?.segmentId).toBe("sw-fl-mercer-west");
    expect(garage?.width).toBeCloseTo(5.4);
    expect(["left", "right"]).toContain(garage?.side);
  });

  it("plans deterministic vegetation, broader tree canopies and pocket-green shrubs", () => {
    const first = planStreetContext(FIRST_LIGHT_CITY_SPEC);
    expect(planStreetContext(FIRST_LIGHT_CITY_SPEC)).toEqual(first);
    expect(first.treeCount).toBeGreaterThanOrEqual(3);
    expect(first.shrubCount).toBe(4);
    expect(first.streetlightCount).toBeGreaterThanOrEqual(2);
    expect(first.parkedCarCount).toBeGreaterThanOrEqual(2);
    expect(first.propCount).toBeGreaterThanOrEqual(2);
    expect(new Set(first.items.map((item) => item.id)).size).toBe(
      first.items.length,
    );

    const pocketTrees = first.items.filter(
      (item) => item.kind === "tree" && item.id.includes("pocket"),
    );
    expect(pocketTrees).toHaveLength(2);
    expect(
      pocketTrees.every((item) => (item.canopyScale ?? 0) >= 1.17),
    ).toBe(true);
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
      expect(surfaces.meshes.length).toBeGreaterThan(30);
      expect(surfaces.markingPlan.length).toBeGreaterThan(10);
      expect(surfaces.curbCutPlan).toHaveLength(0);
      expect(
        surfaces.meshes.some((mesh) =>
          mesh.name === "generated-parity-main-junction" ||
          mesh.name === "generated-parity-rear-junction",
        ),
      ).toBe(false);
      expect(
        surfaces.meshes.some((mesh) =>
          mesh.name === "generated-parity-side-road",
        ),
      ).toBe(true);
      expect(
        surfaces.meshes.some((mesh) =>
          mesh.name === "generated-parity-north-curb",
        ),
      ).toBe(true);
      expect(
        surfaces.meshes.some((mesh) =>
          mesh.name.startsWith("generated-parity-drain-"),
        ),
      ).toBe(true);
      expect(context.itemCount).toBeGreaterThan(9);
      const treeTrunks = context.meshes.filter((mesh) =>
        mesh.name.startsWith("generated-tree-trunk:"),
      );
      expect(treeTrunks).toHaveLength(planStreetContext(FIRST_LIGHT_CITY_SPEC).treeCount);
      expect(context.meshes.some((mesh) =>
        mesh.name.includes("generated-tree-trunk-upper:") ||
        mesh.name.includes("generated-tree-trunk-lower:"),
      )).toBe(false);
      expect(treeTrunks.every((mesh) => mesh.rotation.x === 0 && mesh.rotation.z === 0)).toBe(true);
      expect(treeTrunks.every((mesh) => mesh.getBoundingInfo().boundingBox.extendSizeWorld.y > 0)).toBe(true);
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
