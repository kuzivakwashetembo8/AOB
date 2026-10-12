import { describe, expect, it } from "vitest";
import { NullEngine, Scene, VertexBuffer } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { generateBuilding } from "../game/world-generation/building-generator";
import { planBuilding } from "../game/world-generation/architecture-plan";
import {
  BRICK_SCALE_PRESETS, BRICK_TRIAL_ASSET_PATH,
  BRICK_TRIAL_BUILDING_ID, BRICK_TRIAL_GARAGE_ID,
  BRICK_TRIAL_METRES_PER_TILE, BRICK_TRIAL_ASSIGNMENTS,
  brickTrialPresetForBuilding, physicalBrickUV,
  type BrickScalePreset,
} from "../game/world-generation/experimental-brick-material";

const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;
const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const apartment = buildings.find(b => b.id === BRICK_TRIAL_BUILDING_ID)!;
const garage = buildings.find(b => b.id === BRICK_TRIAL_GARAGE_ID)!;

describe("GTD-RND-MAT-002 apartment A versus garage B", () => {
  it("registers exactly two bindings and never enables the reserved 120% preset", () => {
    expect(BRICK_TRIAL_ASSET_PATH).toBe("/brick-wall-image.webp");
    expect(Object.keys(BRICK_TRIAL_ASSIGNMENTS).sort()).toEqual(
      [BRICK_TRIAL_BUILDING_ID, BRICK_TRIAL_GARAGE_ID].sort());
    expect(brickTrialPresetForBuilding(BRICK_TRIAL_BUILDING_ID, true)).toBe("compactA");
    expect(brickTrialPresetForBuilding(BRICK_TRIAL_GARAGE_ID, true)).toBe("standardB");
    for (const b of buildings) {
      expect(brickTrialPresetForBuilding(b.id, false)).toBeNull();
      if (![BRICK_TRIAL_BUILDING_ID, BRICK_TRIAL_GARAGE_ID].includes(b.id)) {
        expect(brickTrialPresetForBuilding(b.id, true)).toBeNull();
      }
    }
    expect(new Set<string>(Object.values(BRICK_TRIAL_ASSIGNMENTS)).has("largeC")).toBe(false);
  });

  it("makes garage bricks exactly 110 percent larger using one native-ratio image", () => {
    const a = BRICK_SCALE_PRESETS.compactA;
    const b = BRICK_SCALE_PRESETS.standardB;
    expect(BRICK_TRIAL_METRES_PER_TILE).toBe(a);
    expect(a.width).toBeCloseTo(1.35, 9);
    expect(b.width).toBeCloseTo(1.485, 9);
    expect(b.width / a.width).toBeCloseTo(1.1, 9);
    expect(b.height / a.height).toBeCloseTo(1.1, 9);
    expect(a.width / a.height).toBeCloseTo(1774 / 871, 9);
    expect(b.width / b.height).toBeCloseTo(1774 / 871, 9);
    const x = { x: 0, y: 1, z: 0 };
    const next = { ...x, x: 1.485 };
    const normal = { x: 0, y: 0, z: 1 };
    const deltaA = physicalBrickUV(next, normal, a).u - physicalBrickUV(x, normal, a).u;
    const deltaB = physicalBrickUV(next, normal, b).u - physicalBrickUV(x, normal, b).u;
    expect(deltaA).toBeCloseTo(1.1, 9);
    expect(deltaB).toBeCloseTo(1, 9);
  });

  it("renders both scales concurrently and preserves the authored garage entrance and all building primitives", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const garagePlan = planBuilding(garage, version);
      const apartmentPlan = planBuilding(apartment, version);
      const garageTrial = generateBuilding(scene, null, garage, {
        generatorVersion: version, batchingMode: "thin-instances",
        enableBrickMaterialTrial: true, enableFacadeDetails: true,
      });
      const apartmentTrial = generateBuilding(scene, null, apartment, {
        generatorVersion: version, batchingMode: "thin-instances",
        enableBrickMaterialTrial: true, enableFacadeDetails: true,
      });
      expect(garageTrial.plan).toEqual(garagePlan);
      expect(apartmentTrial.plan).toEqual(apartmentPlan);
      const garageBay = garageTrial.plan.openings.find(o =>
        o.kind === "garage" && o.source === "authored");
      expect(garageBay).toBeDefined();
      expect(garageBay?.cutThrough).toBe(true);
      expect(garageTrial.portals.length).toBeGreaterThan(0);
      const garageWalls = garageTrial.meshes.filter(m =>
        m.material?.name === "experiment:brick-B:" + BRICK_TRIAL_GARAGE_ID);
      const apartmentWalls = apartmentTrial.meshes.filter(m =>
        m.material?.name === "experiment:brick-A:" + BRICK_TRIAL_BUILDING_ID);
      expect(garageWalls.length).toBeGreaterThan(3);
      expect(apartmentWalls.length).toBeGreaterThan(3);
      const verify = (meshes: typeof garageWalls, plan: typeof garagePlan,
        preset: BrickScalePreset) => {
        for (const mesh of meshes) {
          expect(mesh.hasThinInstances).toBe(false);
          const part = plan.primitives.find(p =>
            p.id === (mesh.metadata as { primitiveId: string }).primitiveId)!;
          expect(part.role).toBe("wall");
          const pos = mesh.getVerticesData(VertexBuffer.PositionKind)!;
          const nor = mesh.getVerticesData(VertexBuffer.NormalKind)!;
          const uv = mesh.getVerticesData(VertexBuffer.UVKind)!;
          for (let i = 0; i < pos.length / 3; i++) {
            const expected = physicalBrickUV({
              x: pos[i * 3]! + part.center.x,
              y: pos[i * 3 + 1]! + part.center.y,
              z: pos[i * 3 + 2]! + part.center.z,
            }, {
              x: nor[i * 3]!, y: nor[i * 3 + 1]!, z: nor[i * 3 + 2]!,
            }, preset);
            expect(uv[i * 2]).toBeCloseTo(expected.u, 5);
            expect(uv[i * 2 + 1]).toBeCloseTo(expected.v, 5);
          }
        }
      };
      verify(garageWalls, garagePlan, BRICK_SCALE_PRESETS.standardB);
      verify(apartmentWalls, apartmentPlan, BRICK_SCALE_PRESETS.compactA);
      const other = buildings.find(b => b.id === "sw-fl-rear-residential")!;
      const otherBuilding = generateBuilding(scene, null, other, {
        generatorVersion: version, batchingMode: "thin-instances",
        enableBrickMaterialTrial: true,
      });
      expect(otherBuilding.meshes.some(m =>
        m.material?.name.startsWith("experiment:brick-"))).toBe(false);
      otherBuilding.dispose();
      // Disposal of one experimental building cannot invalidate the other.
      garageTrial.dispose();
      expect(apartmentWalls.every(m => !m.isDisposed())).toBe(true);
      apartmentTrial.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
