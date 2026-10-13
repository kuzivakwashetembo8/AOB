import { describe, expect, it } from "vitest";
import { NullEngine, Scene, VertexBuffer } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { generateBuilding } from "../game/world-generation/building-generator";
import { planBuilding } from "../game/world-generation/architecture-plan";
import { BRICK_SURFACES, BRICK_SURFACE_IDS } from "../game/world-generation/brick-surface-catalog";
import {
  SOUTH_WARD_BUSINESS_BRICK_ASSIGNMENTS,
  BRICK_FOCUS_BUILDING_ID,
  BUSINESS_BRICK_TILE_WIDTH_METRES,
  businessBrickForBuilding, businessBrickPhysicalTile, parseBusinessBrickFocus,
} from "../game/world-generation/brick-business-field-trial";
import { physicalBrickUV } from "../game/world-generation/experimental-brick-material";

const specs = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const gen = FIRST_LIGHT_CITY_SPEC.generatorVersion;

describe("MAT-005 South Ward business surface field trial", () => {
  it("targets exactly four office/retail/workshop businesses without changing accepted walls", () => {
    expect(SOUTH_WARD_BUSINESS_BRICK_ASSIGNMENTS).toEqual({
      "sw-fl-corner-commercial": "BRK-04",
      "sw-fl-rear-shop": "BRK-10",
      "sw-fl-rear-workshop": "BRK-09",
      "sw-fl-east-support": "BRK-07",
    });
    expect(BRICK_FOCUS_BUILDING_ID).toBe("sw-fl-corner-commercial");
    expect(BUSINESS_BRICK_TILE_WIDTH_METRES).toBe(1.485);
    for (const id of ["sw-fl-garage", "sw-fl-south-apartment", "sw-fl-rear-residential"]) {
      expect(businessBrickForBuilding(id, true)).toBeNull();
    }
    for (const id of Object.keys(SOUTH_WARD_BUSINESS_BRICK_ASSIGNMENTS)) {
      expect(specs.find(b => b.id === id)).toBeDefined();
      expect(businessBrickForBuilding(id, false)).toBeNull();
    }
  });

  it("validates safe single-shop override and can inspect all nine candidate textures", () => {
    expect(parseBusinessBrickFocus(null)).toBeNull();
    expect(parseBusinessBrickFocus("BRK-01")).toBeNull();
    expect(parseBusinessBrickFocus("BRK-11")).toBeNull();
    expect(parseBusinessBrickFocus("../Brick 2.webp")).toBeNull();
    for (const id of BRICK_SURFACE_IDS.slice(1)) {
      expect(parseBusinessBrickFocus(id)).toBe(id);
      expect(businessBrickForBuilding(BRICK_FOCUS_BUILDING_ID, true, id)).toBe(id);
      expect(businessBrickForBuilding("sw-fl-rear-shop", true, id)).toBe("BRK-10");
      const tile = businessBrickPhysicalTile(id);
      expect(tile.width).toBe(1.485);
      expect(tile.width / tile.height).toBeCloseTo(
        BRICK_SURFACES[id].widthPx / BRICK_SURFACES[id].heightPx, 8);
    }
  });

  it("applies candidate textures strictly to wall meshes; all authored openings/physics plans remain identical", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const results = specs.map(spec => generateBuilding(scene, null, spec, {
        generatorVersion: gen, enableFacadeDetails: true,
        enableBrickMaterialTrial: true, enableBrickBusinessFieldTrial: true,
        batchingMode: "thin-instances",
      }));
      for (const result of results) {
        const id = result.buildingId;
        const candidate = businessBrickForBuilding(id, true);
        const walls = result.meshes.filter(m => candidate &&
          m.material?.name === "experiment:brick-" + candidate + ":" + id);
        expect(result.plan).toEqual(planBuilding(specs.find(s => s.id === id)!, gen));
        if (!candidate) {
          expect(walls).toHaveLength(0);
          expect(result.meshes.some(m =>
            m.material?.name.startsWith("experiment:brick-BRK-"))).toBe(false);
          continue;
        }
        expect(walls.length).toBeGreaterThan(0);
        for (const m of walls) {
          expect(m.hasThinInstances).toBe(false);
          const v = m.getVerticesData(VertexBuffer.PositionKind)!;
          const n = m.getVerticesData(VertexBuffer.NormalKind)!;
          const uv = m.getVerticesData(VertexBuffer.UVKind)!;
          const part = result.plan.primitives.find(p =>
            p.id === (m.metadata as {primitiveId:string}).primitiveId)!;
          expect(part.role).toBe("wall");
          for (let j = 0; j < v.length / 3; j++) {
            const coords = physicalBrickUV({
              x: part.center.x + v[j * 3]!, y: part.center.y + v[j * 3 + 1]!,
              z: part.center.z + v[j * 3 + 2]!,
            }, {x:n[j*3]!,y:n[j*3+1]!,z:n[j*3+2]!},
              businessBrickPhysicalTile(candidate));
            expect(uv[j*2]).toBeCloseTo(coords.u, 5);
            expect(uv[j*2+1]).toBeCloseTo(coords.v, 5);
          }
        }
      }
      for (const result of results) result.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose(); engine.dispose();
    }
  });

  it("turning off candidate field trial retains the two previously accepted surfaces", () => {
    const engine = new NullEngine(); const scene = new Scene(engine);
    try {
      const commercial = specs.find(x => x.id === "sw-fl-corner-commercial")!;
      const apartment = specs.find(x => x.id === "sw-fl-south-apartment")!;
      const candidateOff = generateBuilding(scene,null,commercial,{
        generatorVersion:gen,enableBrickMaterialTrial:true,
        enableBrickBusinessFieldTrial:false,
      });
      const accepted = generateBuilding(scene,null,apartment,{
        generatorVersion:gen,enableBrickMaterialTrial:true,
        enableBrickBusinessFieldTrial:false,
      });
      expect(candidateOff.meshes.some(m=>m.material?.name.startsWith("experiment:brick-"))).toBe(false);
      expect(accepted.meshes.some(m=>m.material?.name==="experiment:brick-A:sw-fl-south-apartment")).toBe(true);
      accepted.dispose(); candidateOff.dispose();
    } finally {scene.dispose();engine.dispose();}
  });
});
