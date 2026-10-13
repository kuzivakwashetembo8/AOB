import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NullEngine, Scene, VertexBuffer } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { planBuilding } from "../game/world-generation/architecture-plan";
import { generateBuilding } from "../game/world-generation/building-generator";
import { physicalBrickUV } from "../game/world-generation/experimental-brick-material";
import { GLASS_SURFACES, GLASS_SURFACE_IDS, GLASS_TILE_METRES } from "../game/world-generation/glass-surface-catalog";
import { SOUTH_WARD_GLASS_TOWERS, glassSurfaceForBuilding, parseGlassFocus } from "../game/world-generation/glass-south-ward-field-trial";
import { woodSurfaceForBuilding } from "../game/world-generation/wood-south-ward-field-trial";
import { businessBrickForBuilding } from "../game/world-generation/brick-business-field-trial";
import { brickTrialPresetForBuilding } from "../game/world-generation/experimental-brick-material";

const specs = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const version = FIRST_LIGHT_CITY_SPEC.generatorVersion;
const towerIds = ["sw-fl-skyline-west","sw-fl-skyline-east"];

function dimensions(bytes: Buffer) {
  expect(bytes.toString("ascii",0,4)).toBe("RIFF");
  expect(bytes.toString("ascii",8,12)).toBe("WEBP");
  expect(bytes.toString("ascii",12,16)).toBe("VP8X");
  return {width: 1+bytes[24]!+(bytes[25]!<<8)+(bytes[26]!<<16),
    height: 1+bytes[27]!+(bytes[28]!<<8)+(bytes[29]!<<16)};
}

describe("MAT-007 South Ward image curtain-wall towers", () => {
  it("records ten exact owner's glass blobs and measured 1672x941 resolution", () => {
    expect(GLASS_SURFACE_IDS).toHaveLength(10);
    for (const id of GLASS_SURFACE_IDS) {
      const entry = GLASS_SURFACES[id];
      const bytes = readFileSync(join(process.cwd(),"public",entry.path.slice(1)));
      expect(bytes.length).toBe(entry.bytes);
      expect(dimensions(bytes)).toEqual({width:1672,height:941});
      expect(createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0"))
        .update(bytes).digest("hex")).toBe(entry.gitBlobSha);
    }
    expect(GLASS_TILE_METRES.width / GLASS_TILE_METRES.height)
      .toBeCloseTo(1672/941,9);
  });

  it("maps only the two towers, with strict focus selection and reversible image layer", () => {
    expect(SOUTH_WARD_GLASS_TOWERS).toEqual({
      "sw-fl-skyline-west":"GLS-01","sw-fl-skyline-east":"GLS-03",
    });
    for (const id of towerIds) {
      expect(glassSurfaceForBuilding(id,true)).not.toBeNull();
      expect(glassSurfaceForBuilding(id,false)).toBeNull();
      expect(woodSurfaceForBuilding(id,true)).toBeNull();
    }
    expect(parseGlassFocus("GLS-11")).toBeNull();
    expect(parseGlassFocus("BRK-01")).toBeNull();
    expect(parseGlassFocus("../foo")).toBeNull();
    expect(parseGlassFocus(null)).toBeNull();
    for (const surfaceId of GLASS_SURFACE_IDS) {
      expect(parseGlassFocus(surfaceId)).toBe(surfaceId);
      expect(glassSurfaceForBuilding("sw-fl-skyline-east",true,surfaceId))
        .toBe(surfaceId);
      expect(glassSurfaceForBuilding("sw-fl-skyline-west",true,surfaceId))
        .toBe("GLS-01");
    }
    for (const spec of specs.filter(s=>!towerIds.includes(s.id))) {
      expect(glassSurfaceForBuilding(spec.id,true)).toBeNull();
    }
  });

  it("eliminates actual and semantic standalone windows only on the two towers", () => {
    const plans = specs.map(s=>({id:s.id,plan:planBuilding(s,version)}));
    for (const {id,plan} of plans) {
      if (!towerIds.includes(id)) continue;
      const s=specs.find(x=>x.id===id)!;
      expect(s.parameters.windowType).toBe("none");
      expect(plan.masses).toHaveLength(2);
      expect(plan.openings.filter(o=>o.kind==="window"||o.kind==="storefront"))
        .toHaveLength(0);
      expect(plan.bays.filter(b=>b.role==="window"||b.role==="storefront"))
        .toHaveLength(0);
      expect(plan.primitives.filter(p=>p.id.startsWith("pane:")||
        p.id.startsWith("frame:auto:") || p.role==="glass" ||p.role==="storefront"))
        .toHaveLength(0);
      expect(plan.primitives.some(p=>p.role==="wall")).toBe(true);
      expect(plan.primitives.some(p=>p.role==="roof")).toBe(true);
    }
    const apartment=plans.find(x=>x.id==="sw-fl-south-apartment")!.plan;
    expect(apartment.openings.some(o=>o.kind==="window")).toBe(true);
  });

  it("installs per-metre glass UVs on continuous tower walls, retains collision geometry and other eight assignments", () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    try {
      const results = specs.map(spec=>({spec,result:generateBuilding(scene,null,spec,{
        generatorVersion:version,enableBrickMaterialTrial:true,
        enableBrickBusinessFieldTrial:true,enableWoodSurfaceFieldTrial:true,
        enableGlassSurfaceFieldTrial:true,enableFacadeDetails:true,
        batchingMode:"thin-instances",
      })}));
      for (const {spec,result} of results) {
        const glass=glassSurfaceForBuilding(spec.id,true);
        const walls=result.meshes.filter(m=>m.material?.name.startsWith("experiment:glass-"));
        expect(result.plan).toEqual(planBuilding(spec,version));
        if (!glass) {
          expect(walls).toHaveLength(0);
          const normal=brickTrialPresetForBuilding(spec.id,true) ??
            businessBrickForBuilding(spec.id,true) ??
            woodSurfaceForBuilding(spec.id,true);
          expect(normal).not.toBeNull();
          continue;
        }
        expect(walls.length).toBeGreaterThan(0);
        expect(result.detailPlan.primitives).toHaveLength(0);
        expect(result.plan.openings.some(o=>o.kind==="window")).toBe(false);
        expect(result.interaction.collisionBoxes.length).toBeGreaterThan(0);
        for (const mesh of walls) {
          expect(mesh.material?.name).toBe("experiment:glass-"+glass+":"+spec.id);
          expect(mesh.hasThinInstances).toBe(false);
          const prim=result.plan.primitives.find(p=>p.id===
            (mesh.metadata as {primitiveId:string}).primitiveId)!;
          expect(prim.role).toBe("wall");
          const pos=mesh.getVerticesData(VertexBuffer.PositionKind)!;
          const normals=mesh.getVerticesData(VertexBuffer.NormalKind)!;
          const uv=mesh.getVerticesData(VertexBuffer.UVKind)!;
          for(let i=0;i<pos.length/3;i++){
            const expected=physicalBrickUV({
              x:prim.center.x+pos[i*3]!,y:prim.center.y+pos[i*3+1]!,
              z:prim.center.z+pos[i*3+2]!,
            }, {x:normals[i*3]!,y:normals[i*3+1]!,z:normals[i*3+2]!}, GLASS_TILE_METRES);
            expect(uv[i*2]).toBeCloseTo(expected.u,5);
            expect(uv[i*2+1]).toBeCloseTo(expected.v,5);
          }
        }
      }
      for(const x of results)x.result.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally{scene.dispose();engine.dispose();}
  });
});
