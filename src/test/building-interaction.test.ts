import { describe, expect, it } from "vitest";
import { NullEngine, Ray, Scene, Vector3 } from "@babylonjs/core";
import { MeridianPhysics } from "../game/physics/rapier-world";
import {
  FIRST_LIGHT_CITY_SPEC, generateBuilding, planBuilding, planBuildingInteraction,
  resolveCityBuildings,
} from "../game/world-generation";

const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;
const inventory = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const garage = inventory.find((building) => building.id === "sw-fl-garage")!;

describe("Meridian Step 4 interaction planning", () => {
  it("keeps stable entrance identity and creates a traversable First Light garage portal", () => {
    const architecture = planBuilding(garage, version);
    const first = planBuildingInteraction(garage, architecture);
    expect(planBuildingInteraction(garage, architecture)).toEqual(first);
    expect(first.interior).toMatchObject({ mode: "cell", floor: 0 });
    expect(first.portals).toHaveLength(1);
    expect(first.portals[0]).toMatchObject({
      buildingId: garage.id, openingId: "vehicle-bay", anchorId: "vehicle-entry",
      facade: "front", width: 4.6,
    });
    expect(first.anchors.find((anchor) => anchor.id === "vehicle-entry")).toMatchObject({
      openingId: "vehicle-bay", kind: "garage-entrance", accessible: true,
    });
    expect(first.anchors.find((anchor) => anchor.id === "main-cell")?.accessible).toBe(true);
    expect(first.portals[0]!.exterior.z).toBeGreaterThan(first.portals[0]!.interior.z);
    expect(first.interior!.portalIds).toEqual(first.portals.map((portal) => portal.id));
    expect(first.spatial).toMatchObject({
      buildingId: garage.id, districtId: "south-ward", interiorMode: "cell",
      lotId: garage.lotId,
    });
    expect(first.spatial.bounds.min.x).toBeLessThan(first.spatial.bounds.max.x);
    expect(first.spatial.bounds.min.z).toBeLessThan(first.spatial.bounds.max.z);
  });

  it("collides with segmented walls and physical glass but not camera-blocking glass", () => {
    const interaction = planBuildingInteraction(garage, planBuilding(garage, version));
    const panes = interaction.collisionBoxes.filter((box) => box.role === "glass");
    expect(panes).toHaveLength(2);
    expect(panes.every((pane) => pane.id.startsWith("pane:rear-window"))).toBe(true);
    expect(interaction.cameraBlockerBoxes.some((box) => box.role === "glass")).toBe(false);
    expect(interaction.cameraBlockerBoxes.some((box) => box.role === "structure")).toBe(true);
    expect(interaction.collisionBoxes.some((box) => box.role === "interior-floor")).toBe(true);
    expect(interaction.collisionBoxes.some((box) => box.id === "solid-mass:body")).toBe(false);
    expect(interaction.collisionBoxes.every((box) =>
      box.size.x > 0 && box.size.y > 0 && box.size.z > 0)).toBe(true);
  });

  it("seals authored entrances when there is no accessible interior", () => {
    const spec = { ...garage, parameters: { ...garage.parameters,
      interiorMode: "none" as const, collisionMode: "simple-shell" as const } };
    const interaction = planBuildingInteraction(spec, planBuilding(spec, version));
    expect(interaction.interior).toBeNull();
    expect(interaction.portals).toHaveLength(0);
    expect(interaction.closedDoorPanels).toHaveLength(1);
    expect(interaction.collisionBoxes.some((box) => box.role === "closed-door")).toBe(true);
    expect(interaction.cameraBlockerBoxes.some((box) => box.role === "closed-door")).toBe(true);
  });

  it("constrains shallow interiors to a bounded front cell and supports camera blocker opt-out", () => {
    const spec = { ...garage, parameters: { ...garage.parameters,
      interiorMode: "shallow" as const, cameraBlockerMode: "none" as const } };
    const interaction = planBuildingInteraction(spec, planBuilding(spec, version));
    expect(interaction.interior?.mode).toBe("shallow");
    expect(interaction.portals).toHaveLength(1);
    expect(interaction.collisionBoxes.some((box) => box.role === "partition")).toBe(true);
    expect(interaction.cameraBlockerBoxes).toHaveLength(0);
    expect(interaction.interior!.localMax.z - interaction.interior!.localMin.z).toBeLessThan(4);
  });

  it("keeps spatial identity and physics independent of material and LOD representation", () => {
    const plan = planBuilding(garage, version);
    const original = planBuildingInteraction(garage, plan);
    const variant = { ...garage, parameters: { ...garage.parameters, lodProfile: "skyline" as const,
      facadeMaterial: "painted-block" as const } };
    expect(planBuildingInteraction(variant, plan).collisionBoxes).toEqual(original.collisionBoxes);
    expect(planBuildingInteraction(variant, plan).portals).toEqual(original.portals);
  });
});

describe("Meridian Step 4 Babylon and Rapier adapter", () => {
  it("creates independent ray-pickable blockers without changing legacy preview defaults", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const preview = generateBuilding(scene, null, garage, { generatorVersion: version });
      expect(preview.physicsIntegrated).toBe(false);
      expect(preview.cameraBlockers).toHaveLength(0);
      preview.dispose();
      const building = generateBuilding(scene, null, garage, {
        generatorVersion: version, enableCameraBlockers: true,
        batchingMode: "thin-instances",
      });
      expect(building.cameraBlockers.length).toBeGreaterThan(0);
      expect(building.cameraBlockers.every((mesh) =>
        mesh.isPickable && mesh.isVisible && mesh.visibility === 0 &&
        mesh.metadata?.cameraBlocker === true)).toBe(true);
      const frontZ = garage.position.z + garage.parameters.depth / 2;
      const ray = new Ray(
        new Vector3(garage.position.x + 5, 2, frontZ + 2),
        new Vector3(0, 0, -1), 3,
      );
      const hit = scene.pickWithRay(ray, (mesh) => mesh.metadata?.cameraBlocker === true);
      expect(hit?.hit).toBe(true);
      building.setRepresentationDistance(1000);
      expect(building.cameraBlockers.every((mesh) => mesh.isEnabled())).toBe(true);
      building.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose(); engine.dispose();
    }
  });

  it("registers Rapier compound collision and keeps it invariant across LOD", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    try {
      physics.addStaticBox({ x: 0, y: -0.1, z: 0 }, { x: 100, y: 0.1, z: 100 });
      const initialColliders = physics.world.colliders.len();
      const building = generateBuilding(scene, physics, garage, {
        generatorVersion: version, enableFacadeDetails: true,
        batchingMode: "thin-instances",
      });
      expect(building.physicsIntegrated).toBe(true);
      expect(building.colliderCount).toBeGreaterThan(0);
      expect(physics.world.colliders.len()).toBe(initialColliders + building.colliderCount);
      const beforeLod = physics.world.colliders.len();
      building.setRepresentationTier("skyline");
      building.setRepresentationTier("near");
      expect(physics.world.colliders.len()).toBe(beforeLod);

      physics.setPlayerPosition({ x: garage.position.x, y: 0.92,
        z: garage.position.z + garage.parameters.depth / 2 + 2 });
      physics.movePlayer({ x: 0, y: 0, z: -4 });
      expect(physics.playerPosition().z).toBeLessThan(
        garage.position.z + garage.parameters.depth / 2 - 0.3,
      );
      building.dispose();
      building.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      physics.destroy(); scene.dispose(); engine.dispose();
    }
  });
});
