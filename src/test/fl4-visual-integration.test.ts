import { describe, expect, it } from "vitest";
import { NullEngine, Scene, VertexBuffer } from "@babylonjs/core";
import {
  FIRST_LIGHT_CITY_SPEC,
  createGeneratedStreetContext,
  planBuilding,
  planStreetContext,
  resolveCityBuildings,
} from "../game/world-generation";
import { planTreeCanopy } from "../game/world-generation/tree-canopy";
import { planVehicleProxyGeometry } from "../game/world-generation/vehicle-proxy-geometry";

const city = FIRST_LIGHT_CITY_SPEC;
const buildings = resolveCityBuildings(city);

describe("FL-4 visual realism integration", () => {
  it("scales tall-storey ordinary windows without changing standard floors or authored garage openings", () => {
    const plans = buildings.map((building) => ({
      building,
      plan: planBuilding(building, city.generatorVersion),
    }));
    const tall = plans.find((item) => item.building.id === "sw-fl-west-support")!;
    const ordinary = plans.find((item) => item.building.id === "sw-fl-east-support")!;
    const garage = plans.find((item) => item.building.id === "sw-fl-garage")!;
    const bigWindow = tall.plan.openings.find((o) => o.source === "generated" && o.kind === "window")!;
    const normalWindow = ordinary.plan.openings.find((o) => o.source === "generated" && o.kind === "window")!;
    expect(bigWindow).toBeDefined();
    expect(bigWindow.height).toBeCloseTo(1.932);
    expect(bigWindow.sillHeight - bigWindow.floor * tall.building.parameters.floorHeight).toBeCloseTo(1.26);
    expect(normalWindow.height).toBeLessThanOrEqual(1.65);
    // MA infrastructure requires one pedestrian door per building. The
    // garage's authored vehicle bay and rear windows remain untouched.
    const generatedGarage = garage.plan.openings.filter(o => o.source === "generated");
    expect(generatedGarage).toHaveLength(1);
    expect(generatedGarage[0]?.kind).toBe("door");
    expect(generatedGarage[0]?.cutThrough).toBe(false);
    for (const authored of garage.building.openings ?? []) {
      const mapped = garage.plan.openings.find((o) => o.id === authored.id)!;
      expect(mapped.sillHeight).toBe(authored.sillHeight);
      expect(mapped.height).toBe(authored.height);
      expect(mapped.kind).toBe(authored.kind);
    }
    for (const { building, plan } of plans) {
      for (const opening of plan.openings.filter((o) => o.source === "generated")) {
        const localSill = opening.sillHeight - opening.floor * building.parameters.floorHeight;
        if (opening.kind === "door") {
          expect(localSill).toBe(0); // Ground-level pedestrian access
        } else {
          expect(localSill).toBeGreaterThanOrEqual(0.2);
        }
        expect(localSill + opening.height).toBeLessThanOrEqual(building.parameters.floorHeight + 0.00001);
      }
    }
  });

  it("connects variable canopy cards to live geometry without extra transparent planes", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const context = createGeneratedStreetContext(scene, city);
      const treeItems = planStreetContext(city).items.filter((item) => item.kind === "tree");
      const cards = context.meshes.filter((m) => m.name.startsWith("generated-tree-foliage:"));
      expect(cards).toHaveLength(treeItems.length * 30);
      const sizes: number[] = [];
      for (const tree of treeItems) {
        const planned = planTreeCanopy(tree, city.generatorVersion);
        const target = cards.filter((m) => m.name.startsWith("generated-tree-foliage:" + tree.id + ":"));
        expect(target).toHaveLength(30);
        const first = target[0]!;
        expect(first.position.x).toBeCloseTo(planned.cards[0]!.x);
        expect(first.position.y).toBeCloseTo(planned.cards[0]!.y);
        expect(first.getBoundingInfo().boundingBox.extendSize.y * 2).toBeCloseTo(planned.cards[0]!.height);
        sizes.push(planned.radius);
      }
      expect(Math.max(...sizes)).toBeGreaterThan(Math.min(...sizes));
      context.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("uses two shaped surfaces and four wheels per static car, preserving collision envelope and geometry validity", () => {
    const visual = planVehicleProxyGeometry();
    for (const mesh of [visual.body, visual.glass]) {
      expect(mesh.positions.length % 3).toBe(0);
      expect(mesh.indices.length % 3).toBe(0);
      expect(mesh.indices.length).toBeGreaterThan(0);
      expect(mesh.positions.every(Number.isFinite)).toBe(true);
      expect(mesh.indices.every((index) => Number.isInteger(index) && index >= 0 && index < mesh.positions.length / 3)).toBe(true);
      for (let i = 0; i < mesh.positions.length; i += 3) {
        expect(Math.abs(mesh.positions[i]!)).toBeLessThanOrEqual(0.85 + 1e-6);
        expect(mesh.positions[i + 1]!).toBeGreaterThanOrEqual(0.34);
        expect(mesh.positions[i + 1]!).toBeLessThanOrEqual(1.52);
        expect(Math.abs(mesh.positions[i + 2]!)).toBeLessThanOrEqual(2 + 1e-6);
      }
    }
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const context = createGeneratedStreetContext(scene, city);
      const cars = planStreetContext(city).items.filter((item) => item.kind === "parked-car");
      for (const car of cars) {
        const body = context.meshes.find((m) => m.name === "generated-car-body:" + car.id)!;
        const glass = context.meshes.find((m) => m.name === "generated-car-cabin:" + car.id)!;
        const wheels = context.meshes.filter((m) => m.name.startsWith("generated-car-wheel:" + car.id + ":"));
        expect(body.getVerticesData(VertexBuffer.PositionKind)?.length).toBe(visual.body.positions.length);
        expect(glass.getIndices()?.length).toBe(visual.glass.indices.length);
        expect(wheels).toHaveLength(4);
        expect(body.parent).toBe(glass.parent);
        expect(wheels.every((wheel) => wheel.parent === body.parent)).toBe(true);
      }
      context.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
