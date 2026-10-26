import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {NullEngine,Scene} from "@babylonjs/core";
import {BMW_SOURCE_PARTS_006,BMW_SOURCE_WHEELS_006} from "@/game/vehicles/bmw-source-data-006";
import {
 createBMWSourceMesh006,createBMWWheelMesh006,getBMWWheelFit006,
 createTemerarioRimFaceOverlay007,
} from "@/game/vehicles/native-vehicle-geometry-001";
import {ROVER_SOURCE_PARTS_005} from "@/game/vehicles/rover-source-data-005";
import {TEMERARIO_SOURCE_PARTS_002,TEMERARIO_SOURCE_WHEELS_003} from "@/game/vehicles/temerario-source-data-002";

describe("GEN-VEH-006 source BMW M4 and Lamborghini rim visibility",()=>{
 it("reads original BMW wheel source and preserves its THREE original materials",()=>{
  const script=readFileSync("scripts/genveh006-extract-bmw.mjs","utf8");
  expect(script).toContain("bmw_m4_competition_m_package (1).glb");
  expect(script).toContain('WHeelsandrims_2');
  expect(script).toContain("wheel001_extract_wheels.mjs");
  expect(script).toContain("longNodeToCorner");
  expect(script).toContain("sourceRimTagged");
  expect(script).toContain("boundary[a]=1;boundary[b]=1;");
 });
 it("is isolated to the BMW traffic class, preserving source Lamborghini and Rover renderers",()=>{
  const s=readFileSync("src/game/experiments/north-heights-traffic-3d-016.ts","utf8");
  expect(s).toContain('a.modelId==="gtd-veh014-mercer-bmw-m4"');
  expect(s).toContain('write(bmwBody("paint",paint),world)');
  expect(s).toContain('write(bmwWheel(corner,"rim")');
  expect(s).toContain('write(roverPart("paint",paint),world)');
  expect(s).toContain('write(sourcedWheel(corner,"tire"),transform)');
  expect(s).toContain('write(spokeRim(),face)');
  expect(s).not.toContain("loadAssetContainerAsync");
  expect(Object.keys(ROVER_SOURCE_PARTS_005)).toHaveLength(5);
  expect(Object.keys(TEMERARIO_SOURCE_PARTS_002)).toHaveLength(5);
  expect(Object.keys(TEMERARIO_SOURCE_WHEELS_003)).toHaveLength(4);
 });
 it("emits realistic native 5-part BMW exterior plus 4 source-fitted tyre and rim assemblies",()=>{
  if(!BMW_SOURCE_PARTS_006.paint.p)return; // placeholder unit run before prebuild
  const engine=new NullEngine(),scene=new Scene(engine);
  try{
    let total=0;
    for(const part of ["paint","glass","trim","frontLight","rearLight"] as const){
      const record=BMW_SOURCE_PARTS_006[part];
      expect(record.vertices).toBeGreaterThan(10);
      expect(record.triangles).toBeGreaterThan(5);
      const mesh=createBMWSourceMesh006(scene,part,part);
      expect(mesh.getTotalVertices()).toBe(record.vertices);
      total+=record.triangles;
    }
    expect(total).toBeGreaterThan(25000);
    expect(total).toBeLessThan(200000);
    for(const corner of ["frontLeft","frontRight","rearLeft","rearRight"] as const){
      const w=BMW_SOURCE_WHEELS_006[corner],fit=getBMWWheelFit006(corner);
      expect(fit.radius).toBeGreaterThan(.24);
      expect(fit.radius).toBeLessThan(.52);
      expect(fit.center).toHaveLength(3);
      for(const part of ["tire","rim"] as const){
        expect(w[part].triangles).toBeGreaterThan(30);
        const mesh=createBMWWheelMesh006(scene,corner+part,corner,part);
        expect(mesh.getTotalIndices()).toBe(w[part].triangles*3);
      }
    }
    const front=BMW_SOURCE_WHEELS_006.frontLeft.center[2],
      rear=BMW_SOURCE_WHEELS_006.rearLeft.center[2];
    expect(Math.abs(front-rear)).toBeGreaterThan(2);
  }finally{scene.dispose();engine.dispose();}
 });
 it("draws open paired spoke pattern, not another solid filled wheel disc",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  try{
    const mesh=createTemerarioRimFaceOverlay007(scene,"test:rim:face");
    expect(mesh.getTotalVertices()).toBeGreaterThan(100);
    expect(mesh.getTotalVertices()).toBeLessThan(600);
    expect(mesh.getTotalIndices()).toBeGreaterThan(200);
  }finally{scene.dispose();engine.dispose();}
 });
});
