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