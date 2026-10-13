import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { planBuilding } from "../game/world-generation/architecture-plan";
import { planFacadeDetails } from "../game/world-generation/facade-details";
import { createGeneratedUrbanSurfaces } from "../game/world-generation/urban-surface-renderer";
import { materialRecipe } from "../game/world-generation/representation-materials";
import { isCurbAscent } from "../game/character/locomotion/curb-step";

const specs = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;

describe("South Ward municipal urban quality / seven correction gates", () => {
  it("removes random shutter bars and roof protrusions from all generated facades", () => {
    for (const spec of specs) {
      const architecture = planBuilding(spec, version);
      const details = planFacadeDetails(spec, architecture);
      expect(details.primitives.filter(p => p.templateId === "facade-shutter"), spec.id)
        .toHaveLength(0);
      expect(architecture.primitives.filter(p => p.id.includes(":fixture:")), spec.id)
        .toHaveLength(0);
    }
  });

  it("provides a clearly visible but nontraversable pedestrian door on every building", () => {
    for (const spec of specs) {
      const plan = planBuilding(spec, version);
      const doors = plan.openings.filter(o => o.kind === "door" && o.floor === 0);
      expect(doors.length, spec.id).toBeGreaterThan(0);
      const authoredDoors = doors.filter(o => o.source === "authored");
      if (authoredDoors.length === 0) {
        expect(doors.every(o => o.cutThrough === false), spec.id).toBe(true);
        for (const door of doors) {
          expect(plan.primitives.some(p => p.id === "door-panel:" + door.id), spec.id).toBe(true);
        }
      }
    }
  });

  it("retains some flatter brickwork alongside selected relief masonry", () => {
    const recipes = specs.filter(spec => spec.parameters.facadeMaterial === "warm-brick")
      .map(spec => materialRecipe(spec, version, "wall"));
    expect(recipes.length).toBeGreaterThanOrEqual(2);
    expect(recipes.some(r => r.textureKind === "brick-relief")).toBe(true);
    expect(recipes.every(r => ["brick-relief","brick"].includes(r.textureKind))).toBe(true);
  });

  it("owns T-junction asphalt with nonoverlapping main and stem geometry", () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    try {
      const surfaces = createGeneratedUrbanSurfaces(scene, FIRST_LIGHT_CITY_SPEC);
      const find = (name: string) => surfaces.meshes.find(m => m.name === name)!;
      const main = find("generated-parity-main-road");
      const stem = find("generated-parity-side-road");
      const rear = find("generated-parity-rear-road");
      expect(stem.position.z).toBeCloseTo(28);
      expect(stem.getBoundingInfo().boundingBox.extendSize.z * 2).toBeCloseTo(32);
      expect(stem.position.z - 16).toBeCloseTo(main.position.z + 4);
      expect(stem.position.z + 16).toBeCloseTo(rear.position.z - 4);
      expect(stem.position.y + 0.015).toBeCloseTo(main.position.y + 0.015);
      expect(surfaces.meshes.filter(m => m.name.startsWith("generated-junction:"))).toHaveLength(0);
      const walks = surfaces.meshes.filter(m => m.name.includes("walk") && m.name.startsWith("generated-parity"));
      expect(walks.length).toBeGreaterThan(4);
      expect(find("generated-parity-north-walk").getBoundingInfo().boundingBox.extendSize.z * 2)
        .toBeCloseTo(3.75);
      // WORLD-003 supersedes the old four fixed development rectangles
      // and three authored car parks with deterministic city-derived infill.
      for (const obsolete of ["generated-development:", "generated-parking:", "generated-parking-marking:"]) {
        expect(surfaces.meshes.some(m => m.name.startsWith(obsolete))).toBe(false);
      }
      for (const kind of ["pavement", "parking", "grass", "parking-stalls"]) {
        const mesh = find("generated-infill:" + kind);
        expect(mesh.thinInstanceCount).toBeGreaterThan(0);
        expect(mesh.isPickable).toBe(false);
      }
      surfaces.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose(); engine.dispose();
    }
  });

  it("records wider South Ward sidewalks for future pedestrian navigation and NPCs", () => {
    expect(FIRST_LIGHT_CITY_SPEC.roads.segments.every(s => s.sidewalkWidth >= 3.75)).toBe(true);
  });

  it("only requests a curb animation for an actual grounded and upward Rapier step", () => {
    expect(isCurbAscent(0.21, 1.6, true)).toBe(true);
    expect(isCurbAscent(-0.21, 1.6, true)).toBe(false);
    expect(isCurbAscent(0.21, 0, true)).toBe(false);
    expect(isCurbAscent(0.21, 1.6, false)).toBe(false);
    expect(isCurbAscent(0.35, 1.6, true)).toBe(false);
  });
});
