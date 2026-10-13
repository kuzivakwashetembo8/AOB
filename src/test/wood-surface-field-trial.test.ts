import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NullEngine, Scene, VertexBuffer } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { generateBuilding } from "../game/world-generation/building-generator";
import { planBuilding } from "../game/world-generation/architecture-plan";
import {
  WOOD_FAMILY_ID, WOOD_SURFACES, WOOD_SURFACE_IDS, woodTileMetres,
} from "../game/world-generation/wood-surface-catalog";
import {
  SOUTH_WARD_WOOD_ASSIGNMENTS, parseWoodFocus,
  woodSurfaceForBuilding, WOOD_FOCUS_BUILDING_ID,
} from "../game/world-generation/wood-south-ward-field-trial";
import { brickTrialPresetForBuilding } from "../game/world-generation/experimental-brick-material";
import { businessBrickForBuilding } from "../game/world-generation/brick-business-field-trial";
import { physicalBrickUV } from "../game/world-generation/experimental-brick-material";

const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;

function header(bytes: Buffer) {
  expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
  expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");
  const tag = bytes.toString("ascii", 12, 16);
  if (tag === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff,
    height: bytes.readUInt16LE(28) & 0x3fff, tag };
  if (tag === "VP8X") return {
    width: 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16),
    height: 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16), tag };
  if (tag === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1,
      height: ((bits >>> 14) & 0x3fff) + 1, tag };
  }
  throw Error("Unsupported WebP format: " + tag);
}

describe("MAT-006 wood source assets and South Ward assignments", () => {
  it("pins ten byte-identical owner assets with real WebP headers", () => {
    expect(WOOD_FAMILY_ID).toBe("WALL-02");
    expect(WOOD_SURFACE_IDS).toHaveLength(10);
    for (const id of WOOD_SURFACE_IDS) {
      const item = WOOD_SURFACES[id];
      const bytes = readFileSync(join(process.cwd(), "public", item.path.slice(1)));
      expect(bytes.length).toBe(item.sizeBytes);
      const sha = createHash("sha1")
        .update(Buffer.from("blob " + bytes.length + "\0"))
        .update(bytes).digest("hex");
      expect(sha).toBe(item.gitBlobSha);
      const img = header(bytes);
      expect(img.width).toBeGreaterThan(900);
      expect(img.height).toBeGreaterThan(500);
      expect(img.width).toBe(id === "WOOD-01" ? 1790 : 1659);
      expect(img.height).toBe(id === "WOOD-01" ? 879 : 948);
      expect(item.pixelWidth).toBe(img.width);
      expect(item.pixelHeight).toBe(img.height);
      expect(woodTileMetres(id).width / woodTileMetres(id).height)
        .toBeCloseTo(img.width / img.height, 9);
      // Expose actual source dimensions in CI before the family can be certified.
      console.info("MAT006-WEBP-HEADER", id, img.width, img.height, img.tag);
    }
  });

  it("allows exactly four formerly procedural buildings, never the brick ones", () => {
    expect(SOUTH_WARD_WOOD_ASSIGNMENTS).toEqual({
      "sw-fl-west-support": "WOOD-01",
      "sw-fl-rear-residential": "WOOD-03",
      "sw-fl-skyline-west": "WOOD-09",
      "sw-fl-skyline-east": "WOOD-05",
    });
    const woodBuildings = buildings.filter(x => woodSurfaceForBuilding(x.id, true));
    expect(woodBuildings).toHaveLength(4);
    expect(buildings).toHaveLength(10);
    for (const spec of buildings) {
      const b = brickTrialPresetForBuilding(spec.id, true) ??
        businessBrickForBuilding(spec.id, true);
      const w = woodSurfaceForBuilding(spec.id, true);
      expect(Boolean(b) !== Boolean(w)).toBe(true);
      expect(woodSurfaceForBuilding(spec.id, false)).toBeNull();
    }
  });

  it("validates focus parameters strictly and changes only the west-side residence", () => {
    expect(parseWoodFocus(null)).toBeNull();
    expect(parseWoodFocus("WOOD-11")).toBeNull();
    expect(parseWoodFocus("BRK-05")).toBeNull();
    expect(parseWoodFocus("../../foo")).toBeNull();
    for (const id of WOOD_SURFACE_IDS) {
      expect(parseWoodFocus(id)).toBe(id);
      expect(woodSurfaceForBuilding(WOOD_FOCUS_BUILDING_ID, true, id)).toBe(id);
      expect(woodSurfaceForBuilding("sw-fl-rear-residential", true, id)).toBe("WOOD-03");
    }
  });

  it("applies physical UVs on exactly the wood wall boxes and preserves all building geometry", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const outputs = buildings.map(spec => ({
        spec, result: generateBuilding(scene, null, spec, {
          generatorVersion: version, batchingMode: "thin-instances",
          enableBrickMaterialTrial: true, enableBrickBusinessFieldTrial: true,
          enableWoodSurfaceFieldTrial: true, enableFacadeDetails: true,
        }),
      }));
      for (const {spec, result} of outputs) {
        expect(result.plan).toEqual(planBuilding(spec, version));
        const id = woodSurfaceForBuilding(spec.id, true);
        const woodMeshes = result.meshes.filter(mesh =>
          mesh.material?.name.startsWith("experiment:wood-"));
        if (!id) {
          expect(woodMeshes).toHaveLength(0);
          continue;
        }
        expect(woodMeshes.length).toBeGreaterThan(0);
        for (const mesh of woodMeshes) {
          expect(mesh.material?.name).toBe("experiment:wood-" + id + ":" + spec.id);
          expect(mesh.hasThinInstances).toBe(false);
          const part = result.plan.primitives.find(p =>
            p.id === (mesh.metadata as {primitiveId:string}).primitiveId)!;
          expect(part.role).toBe("wall");
          const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
          const normals = mesh.getVerticesData(VertexBuffer.NormalKind)!;
          const uv = mesh.getVerticesData(VertexBuffer.UVKind)!;
          for (let i=0;i<positions.length/3;i++) {
            const mapped = physicalBrickUV({
              x: part.center.x + positions[3*i]!,
              y: part.center.y + positions[3*i+1]!,
              z: part.center.z + positions[3*i+2]!,
            }, {
              x: normals[3*i]!, y: normals[3*i+1]!, z: normals[3*i+2]!,
            }, woodTileMetres(id));
            expect(uv[2*i]).toBeCloseTo(mapped.u, 5);
            expect(uv[2*i+1]).toBeCloseTo(mapped.v, 5);
          }
        }
      }
      for (const {result} of outputs) result.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally { scene.dispose(); engine.dispose(); }
  });

  it("switching the wood layer off restores procedural walls without removing accepted brick", () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    try {
      const wood = generateBuilding(scene,null,buildings.find(x=>x.id==="sw-fl-west-support")!,{
        generatorVersion:version,enableWoodSurfaceFieldTrial:false,enableBrickMaterialTrial:true,
        enableBrickBusinessFieldTrial:true,
      });
      const brick = generateBuilding(scene,null,buildings.find(x=>x.id==="sw-fl-south-apartment")!,{
        generatorVersion:version,enableWoodSurfaceFieldTrial:false,enableBrickMaterialTrial:true,
        enableBrickBusinessFieldTrial:true,
      });
      expect(wood.meshes.some(m=>m.material?.name.startsWith("experiment:wood-"))).toBe(false);
      expect(brick.meshes.some(m=>m.material?.name==="experiment:brick-A:sw-fl-south-apartment")).toBe(true);
      wood.dispose(); brick.dispose();
    } finally {scene.dispose();engine.dispose();}
  });
});
