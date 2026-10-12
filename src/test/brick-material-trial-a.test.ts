import { describe, expect, it } from "vitest";
import { NullEngine, Scene, VertexBuffer } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { generateBuilding } from "../game/world-generation/building-generator";
import {
  BRICK_TRIAL_ASSET_PATH, BRICK_TRIAL_BUILDING_ID,
  BRICK_TRIAL_METRES_PER_TILE, physicalBrickUV,
} from "../game/world-generation/experimental-brick-material";
import { planBuilding } from "../game/world-generation/architecture-plan";

const source = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const apartment = source.find(s => s.id === BRICK_TRIAL_BUILDING_ID)!;
const other = source.find(s => s.id === "sw-fl-rear-residential")!;
const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;

describe("GTD-RND-MAT-001 / one-building Brick Material Trial A", () => {
  it("pins only the exact owner WebP, preserves native image pixel proportions", () => {
    expect(BRICK_TRIAL_ASSET_PATH).toBe("/brick-wall-image.webp");
    expect(BRICK_TRIAL_BUILDING_ID).toBe("sw-fl-south-apartment");
    expect(BRICK_TRIAL_METRES_PER_TILE.width / BRICK_TRIAL_METRES_PER_TILE.height)
      .toBeCloseTo(1774 / 871, 7);
  });

  it("uses absolute building-relative coordinates, not a per-box fixed 3.4 repeat", () => {
    const p = { x: 1.5, y: 2.2, z: 6.3 };
    const a = physicalBrickUV(p, { x: 0, y: 0, z: 1 });
    const b = physicalBrickUV({ ...p, x: p.x + 0.675 }, { x: 0, y: 0, z: 1 });
    const c = physicalBrickUV(p, { x: 1, y: 0, z: 0 });
    expect(b.u - a.u).toBeCloseTo(0.5, 6);
    expect(b.v).toBeCloseTo(a.v, 6);
    expect(c.u).toBeCloseTo(p.z / BRICK_TRIAL_METRES_PER_TILE.width);
    expect(a.v).toBeCloseTo(p.y / BRICK_TRIAL_METRES_PER_TILE.height);
  });

  it("changes just one building's wall material and maps real window-adjacent wall boxes", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const baselinePlan = planBuilding(apartment, version);
      const target = generateBuilding(scene, null, apartment, {
        generatorVersion: version,
        batchingMode: "thin-instances",
        enableBrickMaterialTrial: true,
        enableFacadeDetails: true,
      });
      expect(target.plan).toEqual(baselinePlan);
      expect(target.physicsIntegrated).toBe(false);
      expect(target.plan.openings.filter(o => o.kind === "window").length).toBeGreaterThan(0);
      const painted = target.meshes.filter(mesh =>
        mesh.material?.name === "experiment:brick-A:" + BRICK_TRIAL_BUILDING_ID);
      expect(painted.length).toBeGreaterThan(3);
      for (const mesh of painted) {
        expect(mesh.hasThinInstances).toBe(false);
        const uv = mesh.getVerticesData(VertexBuffer.UVKind);
        const pos = mesh.getVerticesData(VertexBuffer.PositionKind);
        const norm = mesh.getVerticesData(VertexBuffer.NormalKind);
        expect(uv?.length).toBe((pos?.length ?? 0) / 3 * 2);
        const primitiveId = (mesh.metadata as {primitiveId:string}).primitiveId;
        const part = target.plan.primitives.find(p => p.id === primitiveId)!;
        expect(part.role).toBe("wall");
        for (let index = 0; index < (pos?.length ?? 0) / 3; index++) {
          const v = physicalBrickUV({
            x: part.center.x + pos![3 * index]!,
            y: part.center.y + pos![3 * index + 1]!,
            z: part.center.z + pos![3 * index + 2]!,
          }, {
            x: norm![3 * index]!, y: norm![3 * index + 1]!,
            z: norm![3 * index + 2]!,
          });
          expect(uv![2 * index]).toBeCloseTo(v.u, 5);
          expect(uv![2 * index + 1]).toBeCloseTo(v.v, 5);
        }
      }
      const untouched = generateBuilding(scene, null, other, {
        generatorVersion: version, batchingMode: "thin-instances",
        enableBrickMaterialTrial: true,
      });
      expect(untouched.meshes.some(mesh =>
        mesh.material?.name.startsWith("experiment:brick-A:"))).toBe(false);
      const optOut = generateBuilding(scene, null, apartment, {
        generatorVersion: version, batchingMode: "thin-instances",
        enableBrickMaterialTrial: false,
      });
      expect(optOut.meshes.some(mesh =>
        mesh.material?.name.startsWith("experiment:brick-A:"))).toBe(false);
      optOut.dispose();
      untouched.dispose();
      target.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
