import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {ROVER_SOURCE_PARTS_005,ROVER_SOURCE_WHEELS_005} from "@/game/vehicles/rover-source-data-005";
import {TEMERARIO_SOURCE_PARTS_002,TEMERARIO_SOURCE_WHEELS_003} from "@/game/vehicles/temerario-source-data-002";
import {getRoverWheelFit005,createRoverSourceMesh005,createRoverWheelMesh005} from "@/game/vehicles/native-vehicle-geometry-001";
import {NullEngine,Scene} from "@babylonjs/core";

describe("GEN-VEH-005 Rover Sport original source extraction",()=>{
 it("retains verified source paths and all four named source wheel groups",()=>{
   const source=readFileSync("scripts/genveh005-extract-rover.mjs","utf8");
   expect(source).toContain("Range Rover Sports 2018 (.GLB).glb");
   for(const label of ["FL Wheel","FR Wheel","BL Wheel","BR Wheel"])
     expect(source).toContain('"'+label+'"');
   expect(source).toContain("boundary[a]=1;boundary[b]=1;");
 });
 it("uses actual Rover source data, not generic SUV wedges, in the 125-car traffic renderer",()=>{
   const s=readFileSync("src/game/experiments/north-heights-traffic-3d-016.ts","utf8");
   expect(s).toContain('a.modelId==="gtd-veh006-mercer-range-rover"');
   expect(s).toContain('write(roverPart("paint",paint),world)');
   expect(s).toContain('write(roverWheel(corner,"rim")');
   expect(s).not.toContain("createNorthHeightsAuthenticFleet016(scene,traffic.graph,mobile)");
   const doc=readFileSync("documentations/Development/GTD-GEN-VEH-005-Range-Rover-Sport-Source-Native-2026-10-26.md","utf8");
   expect(doc).toContain("Range Rover Sport 2018");
 });
 it("preserves accepted Lamborghini triangle source and wheel pivots",()=>{
   expect(Object.keys(TEMERARIO_SOURCE_PARTS_002)).toHaveLength(5);
   expect(Object.keys(TEMERARIO_SOURCE_WHEELS_003)).toHaveLength(4);
   const traffic=readFileSync("src/game/experiments/north-heights-traffic-3d-016.ts","utf8");
   expect(traffic).toContain('const rimSurface=Matrix.Translation(outward*.024,0,0).multiply(transform)');
 });
 it("builds native Rover surfaces and verifies four axles and wheel geometry",()=>{
   if(!ROVER_SOURCE_PARTS_005.paint.p)return; // regular local test before prebuild
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
    let total=0;
    for(const part of ["paint","glass","trim","frontLight","rearLight"] as const){
      const record=ROVER_SOURCE_PARTS_005[part];
      expect(record.vertices).toBeGreaterThan(20);
      expect(record.triangles).toBeGreaterThan(10);
      const mesh=createRoverSourceMesh005(scene,"test:"+part,part);
      expect(mesh.getTotalIndices()).toBe(record.triangles*3);
      total+=record.triangles;
    }
    expect(total).toBeLessThan(400000);
    for(const corner of ["frontLeft","frontRight","rearLeft","rearRight"] as const){
      const w=ROVER_SOURCE_WHEELS_005[corner],fit=getRoverWheelFit005(corner);
      expect(w.radius).toBeGreaterThan(.25);expect(w.radius).toBeLessThan(.55);
      expect(fit.center).toHaveLength(3);
      for(const part of ["tire","rim"] as const){
        expect(w[part].triangles).toBeGreaterThan(50);
        const mesh=createRoverWheelMesh005(scene,"test:"+corner+part,corner,part);
        expect(mesh.getTotalVertices()).toBe(w[part].vertices);
      }
    }
    const f=ROVER_SOURCE_WHEELS_005.frontLeft.center[2],
      b=ROVER_SOURCE_WHEELS_005.rearLeft.center[2];
    expect(Math.abs(f-b)).toBeGreaterThan(2);
   }finally{scene.dispose();engine.dispose();}
 });
});
