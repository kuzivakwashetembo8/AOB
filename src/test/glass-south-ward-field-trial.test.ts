import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NullEngine, Scene, VertexBuffer } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { planBuilding } from "../game/world-generation/architecture-plan";
import { generateBuilding } from "../game/world-generation/building-generator";
import {
  BLUE_GLASS_TOWER_ID, GREY_GLASS_TOWER_ID,
  continuousBlueGlassUV, continuousGlassFacadeUV, planSkylineArchitecturalGeometry,
} from "../game/world-generation/skyline-glass-geometry";
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
  const encoding=bytes.toString("ascii",12,16);
  if (encoding==="VP8X") return {
    width: 1+bytes[24]!+(bytes[25]!<<8)+(bytes[26]!<<16),
    height: 1+bytes[27]!+(bytes[28]!<<8)+(bytes[29]!<<16)
  };
  if (encoding==="VP8 ") return {
    width: bytes.readUInt16LE(26)&0x3fff,
    height: bytes.readUInt16LE(28)&0x3fff
  };
  if (encoding==="VP8L") {
    const packed=bytes.readUInt32LE(21);
    return {width: 1+(packed&0x3fff),height: 1+((packed>>>14)&0x3fff)};
  }
  throw new Error("Unsupported WebP header: "+encoding);
}

describe("MAT-007 South Ward image curtain-wall towers", () => {
  it("verifies all ten replacement owner-committed glass blobs and wide texture aspect", () => {
    expect(GLASS_SURFACE_IDS).toHaveLength(10);
    for (const id of GLASS_SURFACE_IDS) {
      const entry = GLASS_SURFACES[id];
      const bytes = readFileSync(join(process.cwd(),"public",entry.path.slice(1)));
      expect(bytes.length).toBe(entry.bytes);
      const {width,height}=dimensions(bytes);
      expect(width).toBeGreaterThanOrEqual(1600);
      expect(height).toBeGreaterThanOrEqual(900);
      expect(width/height).toBeCloseTo(16/9,1);
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

  it("installs full-envelope UVs on BOTH towers and preserves collision plus the other eight assignments", () => {
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
            const vertex = {
              x:prim.center.x+pos[i*3]!,y:prim.center.y+pos[i*3+1]!,
              z:prim.center.z+pos[i*3+2]!,
            };
            const normal = {x:normals[i*3]!,y:normals[i*3+1]!,z:normals[i*3+2]!};
            const expected = continuousGlassFacadeUV(vertex, normal, {
              width: spec.parameters.width, depth: spec.parameters.depth,
              height: spec.parameters.floors * spec.parameters.floorHeight,
            });
            expect(uv[i*2]).toBeCloseTo(expected.u,5);
            expect(uv[i*2+1]).toBeCloseTo(expected.v,5);
          }
        }
      }
      for(const x of results)x.result.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally{scene.dispose();engine.dispose();}
  });

  it("installs 3D mullions and floor transoms only on the grey-glass tower", () => {
    const blue = specs.find(s => s.id === BLUE_GLASS_TOWER_ID)!;
    const grey = specs.find(s => s.id === GREY_GLASS_TOWER_ID)!;
    const bluePlan = planBuilding(blue, version);
    const greyPlan = planBuilding(grey, version);
    const blueDetails = planSkylineArchitecturalGeometry(bluePlan, blue.id);
    const greyDetails = planSkylineArchitecturalGeometry(greyPlan, grey.id);
    expect(blueDetails.some(x => x.id.startsWith("skyline-mullion:"))).toBe(false);
    expect(blueDetails.some(x => x.id.startsWith("skyline-transom:"))).toBe(false);
    const blueCaps = blueDetails.filter(x => x.id.startsWith("skyline-cap:"));
    const greyCaps = greyDetails.filter(x => x.id.startsWith("skyline-cap:"));
    expect(blueCaps).toHaveLength(8);
    expect(greyCaps).toHaveLength(8);
    expect(blueCaps.every(x => x.role === "trim")).toBe(true);
    expect(greyCaps.every(x => x.role === "metal")).toBe(true);
    for (const mass of greyPlan.masses) {
      const caps = greyCaps.filter(x => x.id.includes(`:${mass.id}:`));
      expect(caps).toHaveLength(4);
      const verticals = greyDetails.filter(x => x.id.startsWith(
        `skyline-mullion:${mass.id}:`));
      expect(verticals.length).toBeGreaterThan(0);
      expect(verticals.every(x => x.center.y + x.size.y / 2 >=
        mass.baseY + mass.height)).toBe(true);
    }
    expect(greyDetails.filter(x => x.id.startsWith("skyline-mullion:")).length)
      .toBeGreaterThan(20);
    expect(greyDetails.filter(x => x.id.startsWith("skyline-transom:")).length)
      .toBeGreaterThan(20);
    expect(greyDetails.filter(x => x.id.startsWith("skyline-mullion:"))
      .every(x => x.size.y > 3 && Math.min(x.size.x,x.size.z) > 0.1)).toBe(true);
    expect(planSkylineArchitecturalGeometry(greyPlan, grey.id, false)
      .every(x => x.id.startsWith("skyline-cap:"))).toBe(true);
    expect(planSkylineArchitecturalGeometry(planBuilding(specs[0]!,version), specs[0]!.id))
      .toHaveLength(0);
  });

  it("keeps blue stripless/pale while grey remains framed with dark frame-matched crown", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const towers = towerIds.map(id => {
        const spec = specs.find(s => s.id === id)!;
        return {spec, result: generateBuilding(scene, null, spec, {
          generatorVersion:version, enableGlassSurfaceFieldTrial:true,
          enableFacadeDetails:true, batchingMode:"thin-instances",
        })};
      });
      for(const {spec,result} of towers) {
        const pale = result.meshes.filter(m =>
          m.material?.name === "skyline-pale-metal-cap:" + spec.id);
        const frameMetal = result.meshes.filter(m =>
          m.material?.name === "skyline-structural-metal:" + spec.id);
        expect(frameMetal.length).toBeGreaterThan(0);
        if (spec.id === BLUE_GLASS_TOWER_ID) expect(pale.length).toBeGreaterThan(0);
        else expect(pale).toHaveLength(0);
        const roofGroups = result.meshes.filter(m => {
          const info = m.metadata as { primitiveIds?: string[]; primitiveId?: string };
          return (info.primitiveIds ?? [info.primitiveId ?? ""]).some(p => p.startsWith("roof:"));
        });
        expect(roofGroups.length).toBeGreaterThan(0);
        const expectedRoofMaterial = spec.id === GREY_GLASS_TOWER_ID
          ? "skyline-structural-metal:" : "skyline-pale-metal-cap:";
        expect(roofGroups.every(m => m.material?.name ===
          expectedRoofMaterial + spec.id)).toBe(true);
        const parts = planSkylineArchitecturalGeometry(result.plan, spec.id);
        if (spec.id === BLUE_GLASS_TOWER_ID) {
          expect(parts.some(x => x.id.startsWith("skyline-mullion:"))).toBe(false);
          expect(continuousBlueGlassUV({x:0,y:0,z:0},{x:0,y:0,z:1},
            {width:15,depth:18,height:28}).v).toBeCloseTo(0.08,5);
          expect(continuousBlueGlassUV({x:0,y:28,z:0},{x:0,y:0,z:1},
            {width:15,depth:18,height:28}).v).toBeCloseTo(0.92,5);
        } else {
          expect(parts.some(x => x.id.startsWith("skyline-mullion:"))).toBe(true);
          expect(parts.some(x => x.id.startsWith("skyline-transom:"))).toBe(true);
          const crownGroups = result.meshes.filter(m => {
            const meta = m.metadata as {primitiveIds?:string[];primitiveId?:string};
            return (meta.primitiveIds ?? [meta.primitiveId ?? ""])
              .some(p => p.startsWith("skyline-cap:"));
          });
          expect(crownGroups.length).toBeGreaterThan(0);
          expect(crownGroups.every(m => m.material?.name ===
            "skyline-structural-metal:" + spec.id)).toBe(true);
        }
        result.dispose();
      }
      expect(scene.meshes).toHaveLength(0);
    } finally {scene.dispose(); engine.dispose();}
  });

  it("uses the same full-height image coordinates for both glass modes and GLS variants", () => {
    const a = {width:17,depth:17,height:33.2};
    const l = {x:-4.9,y:6.64,z:8.5};
    const r = {x:-4.9,y:26.56,z:6.1};
    const normal = {x:0,y:0,z:1};
    const lower = continuousGlassFacadeUV(l,normal,a);
    const upper = continuousGlassFacadeUV(r,normal,a);
    expect(lower.u).toBeCloseTo(upper.u,9); // podium setback cannot reset the image
    expect(lower.v).toBeCloseTo(0.08 + 0.84 * 0.2,9);
    expect(upper.v).toBeCloseTo(0.08 + 0.84 * 0.8,9);
    expect(continuousGlassFacadeUV(l,normal,a))
      .toEqual(continuousBlueGlassUV(l,normal,a)); // blue unchanged
    for (const id of GLASS_SURFACE_IDS) {
      expect(glassSurfaceForBuilding(GREY_GLASS_TOWER_ID,true,id)).toBe(id);
    }
  });

});
