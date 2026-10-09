import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import {
  BuildingMaterialLibrary, FACADE_DETAIL_CATALOG, MATERIAL_FAMILIES, FIRST_LIGHT_CITY_SPEC, generateBuilding, materialRecipe,
  planBuilding, planFacadeDetails, resolveCityBuildings, selectRepresentationTier,
  windowRepresentation,
} from "../game/world-generation";

const specs = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const garage = specs.find((item) => item.id === "sw-fl-garage")!;
const commercial = specs.find((item) => item.id === "sw-fl-corner-commercial")!;
const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;

describe("Meridian Step 3 visual representation", () => {
  it("defines required shared material and facade-detail families", () => {
    expect(MATERIAL_FAMILIES["warm-brick"]).toBeDefined();
    expect(MATERIAL_FAMILIES["institutional-concrete"]).toBeDefined();
    expect(MATERIAL_FAMILIES["asphalt"]).toBeDefined();
    expect(MATERIAL_FAMILIES["sidewalk-paving"]).toBeDefined();
    expect(FACADE_DETAIL_CATALOG["ac-unit"]).toBeDefined();
    expect(FACADE_DETAIL_CATALOG["shutter"]).toBeDefined();
    expect(FACADE_DETAIL_CATALOG["vent"]).toBeDefined();
    expect(FACADE_DETAIL_CATALOG["cornice"]).toBeDefined();
    expect(FACADE_DETAIL_CATALOG["sign-band"]).toBeDefined();
    expect(FACADE_DETAIL_CATALOG["foundation-band"]).toBeDefined();
  });
  it("uses deterministic material recipes and bounded shared tint buckets", () => {
    const recipe = materialRecipe(garage, version, "wall");
    expect(materialRecipe(garage, version, "wall")).toEqual(recipe);
    expect(recipe.familyId).toBe("garage-block");
    expect(recipe.variation.tintBucket).toBeGreaterThanOrEqual(0);
    expect(recipe.variation.tintBucket).toBeLessThan(8);
    expect(recipe.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(recipe.textureKind).toBe("block");
    expect(recipe.textureScale.u).toBeGreaterThan(0);
    expect(recipe.key).toContain("garage-block");
    expect(new Set(specs.map((item) => materialRecipe(item, version, "wall").key)).size)
      .toBeLessThanOrEqual(specs.length);
  });

  it("keeps facade details and decal hooks deterministic without mutating structural openings", () => {
    const plan = planBuilding(commercial, version);
    const before = JSON.stringify(plan);
    const first = planFacadeDetails(commercial, plan);
    expect(planFacadeDetails(commercial, plan)).toEqual(first);
    expect(first.decals.length).toBeGreaterThan(0);
    expect(first.primitives.some((part) => part.templateId === "facade-foundation-band")).toBe(true);
    expect(first.primitives.every((part) => part.id.startsWith("detail:"))).toBe(true);
    expect(new Set(first.primitives.map((part) => part.id)).size).toBe(first.primitives.length);
    expect(JSON.stringify(plan)).toBe(before);
  });

  it("respects distance thresholds, hysteresis and visual-only window tiers", () => {
    expect(selectRepresentationTier("standard", 0)).toBe("near");
    expect(selectRepresentationTier("standard", 36, "near")).toBe("near");
    expect(selectRepresentationTier("standard", 39, "near")).toBe("medium");
    expect(selectRepresentationTier("standard", 400)).toBe("skyline");
    const opening = planBuilding(garage, version).openings.find((item) => item.kind === "window")!;
    expect(opening.cutThrough).toBe(true);
    expect(windowRepresentation(opening, "near")).toBe("physical");
    expect(windowRepresentation(opening, "medium")).toBe("recessed");
    expect(windowRepresentation(opening, "far")).toBe("decorative");
    expect(opening.cutThrough).toBe(true);
  });

  it("shares GPU materials across buildings and releases all leases on disposal", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const library = new BuildingMaterialLibrary(scene);
    try {
      const a = generateBuilding(scene, null, garage, { generatorVersion: version, materialLibrary: library });
      const count = library.materialCount;
      const b = generateBuilding(scene, null, garage, { generatorVersion: version, materialLibrary: library });
      expect(library.materialCount).toBe(count);
      expect(library.activeLeases).toBeGreaterThan(0);
      a.dispose();
      expect(library.activeLeases).toBeGreaterThan(0);
      b.dispose();
      expect(library.activeLeases).toBe(0);
      expect(scene.meshes).toHaveLength(0);
    } finally {
      library.dispose(); scene.dispose(); engine.dispose();
    }
  });

  it("thin-instances repeated primitives and switches to low-draw-call mass proxies", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const building = generateBuilding(scene, null, commercial, {
        generatorVersion: version, enableFacadeDetails: true, batchingMode: "thin-instances",
      });
      const supportsThinInstances = Boolean(engine.getCaps().instancedArrays);
      if (supportsThinInstances) {
        expect(building.meshes.length).toBeLessThan(building.plan.primitives.length);
        expect(building.meshes.some((mesh) => mesh.thinInstanceCount > 1)).toBe(true);
      } else {
        expect(building.meshes.some((mesh) => mesh.thinInstanceCount > 0)).toBe(false);
        expect(building.meshes.length).toBeGreaterThanOrEqual(building.plan.primitives.length);
      }
      expect(building.detailPlan.decals.length).toBeGreaterThan(0);
      building.setRepresentationDistance(1000);
      expect(building.representationTier).toBe("skyline");
      expect(building.meshes.filter((mesh) => mesh.isEnabled())).toHaveLength(building.plan.masses.length);
      building.setRepresentationDistance(0);
      expect(building.representationTier).toBe("near");
      building.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally { scene.dispose(); engine.dispose(); }
  });
});
