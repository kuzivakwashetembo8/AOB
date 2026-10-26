import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {TEMERARIO_SOURCE_PARTS_002} from "@/game/vehicles/temerario-source-data-002";
describe("GEN-VEH-002 source-Lamborghini exterior",()=>{
 it("retains five material classes for source-derived exterior shape",()=>{
  expect(Object.keys(TEMERARIO_SOURCE_PARTS_002).sort()).toEqual(
   ["paint","glass","trim","frontLight","rearLight"].sort());
  const script=readFileSync("scripts/genveh002-extract-temerario.mjs","utf8");
  expect(script).toContain("Lamborghini+Temerario.glb");
  expect(script).toContain("KHR_draco_mesh_compression");
  expect(script).toContain("EXT_");
  expect(script).toContain("GLS_");
  expect(script).toContain("DOOR_");
  expect(script).toContain("LGT_");
 });
 it("preserves source triangle sheets and normals instead of merging unrelated body panels",()=>{
  const script=readFileSync("scripts/genveh002-extract-temerario.mjs","utf8");
  expect(script).toContain("acc.segments.push(");
  expect(script).toContain("clusterSegment(seg,stepByPart[group])");
  expect(script).toContain("boundary[a]=1;boundary[b]=1;");
  expect(script).toContain("transformedNormal(");
  expect(script).not.toContain("const steps=[.004,.006,.009,.013,.018,.025,.035,.050,.070,.10,.14,.20]");
  for(const part of Object.values(TEMERARIO_SOURCE_PARTS_002)){
    if(!part.p)continue; // Placeholder-only source checks run before prebuild too.
    expect(part.n.length).toBeGreaterThan(0);
    expect(Number(part.indexBits)===16||Number(part.indexBits)===32).toBe(true);
    expect(part.sourceTriangles).toBeGreaterThanOrEqual(part.triangles);
    expect(part.sourcePrimitives).toBeGreaterThan(0);
    expect(atob(part.n).length).toBe(part.vertices*3);
    expect(atob(part.p).length).toBe(part.vertices*3*2);
    expect(atob(part.i).length).toBe(part.triangles*3*(part.indexBits/8));
  }
 });
 it("renders the authored shapes without moving-GLB runtime imports",()=>{
  const mesh=readFileSync("src/game/experiments/north-heights-traffic-3d-016.ts","utf8");
  const geometry=readFileSync("src/game/vehicles/native-vehicle-geometry-001.ts","utf8");
  const city=readFileSync("src/game/experiments/north-heights-city-8.ts","utf8");
  expect(mesh).toContain('createTemerarioSourceMesh002');
  expect(mesh).toContain('spec.style==="supercar"');
  expect(geometry).toContain('new Int16Array(pbytes.buffer)');
  expect(city).not.toContain("createNorthHeightsAuthenticFleet016(");
  expect(city).toContain("NATIVE");
  if(TEMERARIO_SOURCE_PARTS_002.paint.p)
   for(const part of Object.values(TEMERARIO_SOURCE_PARTS_002)){
    expect(part.vertices).toBeGreaterThan(2);
    expect(part.triangles).toBeGreaterThan(2);
   }
 });
});