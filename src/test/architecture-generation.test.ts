import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import {
  FIRST_LIGHT_CITY_SPEC, assertValidCitySpec, generateBuilding, planBuilding,
  resolveCityBuildings,
} from "../game/world-generation";
import type { PlannedOpening, ResolvedBuildingSpec } from "../game/world-generation";
import {cleanWoodBuildingSurrounds} from "../game/world-generation/wood-exterior-cleanup-019";

const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;
const inventory = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const get = (id: string) => inventory.find((item) => item.id === id)!;
const intersect = (a: PlannedOpening, b: PlannedOpening) =>
  a.facade === b.facade &&
  Math.abs(a.offset - b.offset) < (a.width + b.width) / 2 - 1e-6 &&
  a.sillHeight < b.sillHeight + b.height - 1e-6 &&
  b.sillHeight < a.sillHeight + a.height - 1e-6;

describe("Meridian Step 2 architecture generation", () => {
  it("accepts all ten validated First Light records without mutating them", () => {
    expect(() => assertValidCitySpec(FIRST_LIGHT_CITY_SPEC)).not.toThrow();
    const before = JSON.stringify(FIRST_LIGHT_CITY_SPEC);
    for (const spec of inventory) {
      const plan = planBuilding(spec, version);
      expect(plan.buildingId).toBe(spec.id);
      expect(plan.floorElevations).toHaveLength(spec.parameters.floors + 1);
      expect(plan.footprint).toHaveLength(4);
      expect(plan.primitives.length).toBeGreaterThan(0);
      expect(plan.primitives.every((part) =>
        part.size.x > 0 && part.size.y > 0 && part.size.z > 0 &&
        Number.isFinite(part.center.x) && Number.isFinite(part.center.y) && Number.isFinite(part.center.z),
      )).toBe(true);
      expect(new Set(plan.primitives.map((part) => part.id)).size).toBe(plan.primitives.length);
    }
    expect(JSON.stringify(FIRST_LIGHT_CITY_SPEC)).toBe(before);
  });

  it("produces byte-identical geometry from the same seed and version", () => {
    const spec = get("sw-fl-south-apartment");
    const first = planBuilding(spec, version);
    planBuilding(get("sw-fl-rear-shop"), version);
    expect(planBuilding(spec, version)).toEqual(first);
    expect(planBuilding(spec, version + 1).generatorVersion).toBe(version + 1);
  });

  it("cuts a real 4.6 metre garage bay and both rear physical windows", () => {
    const garage = get("sw-fl-garage");
    const plan = planBuilding(garage, version);
    const bay = plan.openings.find((item) => item.id === "vehicle-bay")!;
    expect(bay).toMatchObject({ facade: "front", width: 4.6, cutThrough: true, templateId: "garage-bay" });
    const windows = plan.openings.filter((item) => item.source === "authored" && item.kind === "window");
    expect(windows).toHaveLength(2);
    expect(windows.every((item) => item.cutThrough)).toBe(true);
    const frontWalls = plan.primitives.filter((part) =>
      part.role === "wall" && Math.abs(part.center.z - garage.parameters.depth / 2) < 1e-6,
    );
    for (const wall of frontWalls) {
      const horizontal = Math.abs(wall.center.x - bay.offset) < (wall.size.x + bay.width) / 2 - 1e-6;
      const vertical = wall.center.y - wall.size.y / 2 < bay.sillHeight + bay.height - 1e-6 &&
        wall.center.y + wall.size.y / 2 > bay.sillHeight + 1e-6;
      expect(horizontal && vertical).toBe(false);
    }
  });

  it("keeps authored openings free of automatically placed facade windows", () => {
    for (const spec of inventory) {
      const plan = planBuilding(spec, version);
      const authored = plan.openings.filter((item) => item.source === "authored");
      const generated = plan.openings.filter((item) => item.source === "generated");
      for (const a of authored) {
        for (const b of generated) expect(intersect(a, b)).toBe(false);
      }
      for (const opening of plan.openings) {
        const mass = plan.masses.find((item) => item.id === opening.massId)!;
        const span = opening.facade === "front" || opening.facade === "rear" ? mass.width : mass.depth;
        expect(Math.abs(opening.offset) + opening.width / 2).toBeLessThan(span / 2);
      }
    }
  });

  it("uses archetype-aware ground floors without inventing traversable shop doors", () => {
    const commercial = planBuilding(get("sw-fl-corner-commercial"), version);
    expect(commercial.bays.some((bay) => bay.floor === 0 && bay.role === "storefront")).toBe(true);
    expect(commercial.openings.some((item) => item.source === "generated" && item.kind === "storefront")).toBe(true);
    expect(commercial.openings.filter((item) => item.source === "generated" && item.kind === "storefront")
      .every((item) => !item.cutThrough)).toBe(true);
    const garage = planBuilding(get("sw-fl-garage"), version);
    expect(garage.bays.some((bay) => bay.role === "garage")).toBe(true);
    expect(garage.openings.some((item) => item.kind === "garage" && item.source === "authored")).toBe(true);
  });

  it("supports slab, row, warehouse, corner, podium and podium-tower massing", () => {
    const base = get("sw-fl-east-support");
    for (const form of ["slab", "row", "warehouse", "corner", "podium", "podium-tower"] as const) {
      const spec: ResolvedBuildingSpec = {
        ...base, parameters: { ...base.parameters, massing: form, floors: 8 },
      };
      const plan = planBuilding(spec, version);
      expect(plan.massing).toBe(form);
      expect(plan.masses.reduce((sum, mass) => sum + mass.floors, 0)).toBe(8);
      expect(plan.masses.reduce((sum, mass) => sum + mass.height, 0))
        .toBeCloseTo(8 * base.parameters.floorHeight);
      expect(plan.masses).toHaveLength(form === "podium" || form === "podium-tower" ? 2 : 1);
      if (plan.masses.length === 2) {
        expect(plan.masses[1]!.width).toBeLessThan(plan.masses[0]!.width);
      }
    }
  });

  it("supports flat, parapet, pitched and shed roof geometry", () => {
    const base = get("sw-fl-rear-shop");
    for (const roofType of ["flat", "parapet", "pitched", "shed"] as const) {
      const spec = { ...base, parameters: { ...base.parameters, roofType } };
      const plan = planBuilding(spec, version);
      expect(plan.roofs.at(-1)?.type).toBe(roofType);
      if (roofType === "parapet") {
        expect(plan.primitives.filter((part) => part.id.includes(":parapet:"))).toHaveLength(4);
      }
      if (roofType === "pitched" || roofType === "shed") {
        expect(plan.primitives.some((part) => part.rotationZ !== undefined)).toBe(true);
      }
    }
  });

  it("responds to dimensions, floor count and window representation without new code", () => {
    const base = get("sw-fl-east-support");
    const changed = {
      ...base, parameters: {
        ...base.parameters, width: base.parameters.width + 4,
        depth: base.parameters.depth + 3, floors: 6, windowType: "physical" as const,
      },
    };
    const original = planBuilding(base, version);
    const expanded = planBuilding(changed, version);
    expect(expanded.footprint[1]!.x - expanded.footprint[0]!.x)
      .toBeGreaterThan(original.footprint[1]!.x - original.footprint[0]!.x);
    expect(expanded.floorElevations).toHaveLength(7);
    expect(expanded.openings.some((item) => item.source === "generated" && item.cutThrough)).toBe(true);
  });

  it("creates and disposes Babylon visual meshes without registering physics", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const garage = get("sw-fl-garage");
      const generated = generateBuilding(scene, null, garage, { generatorVersion: version });
      expect(generated.physicsIntegrated).toBe(false);
      expect(generated.meshes).toHaveLength(
        cleanWoodBuildingSurrounds(generated.plan.primitives,false).length);
      expect(generated.root.position.x).toBe(garage.position.x);
      expect(generated.root.position.z).toBe(garage.position.z);
      expect(scene.meshes.length).toBeGreaterThan(0);
      generated.dispose();
      generated.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
