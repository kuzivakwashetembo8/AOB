import {describe,it,expect} from "vitest";
import {NullEngine,Scene,StandardMaterial,VertexBuffer} from "@babylonjs/core";
import {createNorthHeightsRoads003} from "@/game/experiments/north-heights-roads-003";
import {northHeightsPedestrianSurfaceOffset001} from "@/game/experiments/north-heights-pedestrian-surface-001";
import {readFileSync} from "node:fs";

describe("PED-001 VIS-004: animated pedestrian ground support",()=>{
 it("uses real sidewalk, corner, crossing and park elevations",()=>{
   expect(northHeightsPedestrianSurfaceOffset001(6,32)).toBeCloseTo(.20);
   expect(northHeightsPedestrianSurfaceOffset001(6,6)).toBeCloseTo(.20);
   expect(northHeightsPedestrianSurfaceOffset001(9.55,6)).toBeCloseTo(.20);
   expect(northHeightsPedestrianSurfaceOffset001(9.55,0)).toBeCloseTo(.075);
   expect(northHeightsPedestrianSurfaceOffset001(0,32)).toBeCloseTo(.075);
   expect(northHeightsPedestrianSurfaceOffset001(32,32)).toBe(0);
   expect(northHeightsPedestrianSurfaceOffset001(32,32,{x:32,z:32})).toBeCloseTo(.19);
   expect(northHeightsPedestrianSurfaceOffset001(32,34,{x:32,z:32})).toBe(0);
 });
 it("both character assignment and ongoing updates use support Y",()=>{
   const source=readFileSync("src/game/experiments/north-heights-pedestrian-characters-001.ts","utf8");
   expect(source.match(/slot\.anchor\.position\.set\(a\.x,supportY\(a\),a\.z\)/g)).toHaveLength(2);
   expect(source).not.toContain("slot.anchor.position.set(a.x,ground(a.x,a.z),a.z)");
 });
});
describe("PED-001 VIS-004: rounded curb fascia has realistic side shading",()=>{
 it("shares concrete material with genuinely lit vertical normals in five batches",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const mats=Object.fromEntries(["asphalt","pavement","curb","crossing","marking"].map(name=>
       [name,new StandardMaterial(name,scene)])) as Record<
         "asphalt"|"pavement"|"curb"|"crossing"|"marking",StandardMaterial>;
     const result=createNorthHeightsRoads003(scene,[-64,0,64],()=>0,mats);
     expect(result.surfaceMeshes).toBe(5);
     const top=scene.getMeshByName("nh003-road:pavement")!;
     const side=scene.getMeshByName("nh003-road:curb")!;
     expect(side.material).toBe(top.material);
     expect(side.material).toBe(mats.pavement);
     expect(side.getTotalIndices()).toBeGreaterThan(800);
     const normals=side.getVerticesData(VertexBuffer.NormalKind)!;
     // The accepted old upward normals erased the visual 3D curb edge.
     // Physical side-facing normals now permit a slight natural shadow.
     const vertical=Array.from({length:normals.length/3},(_,i)=>normals[i*3+1]!);
     expect(vertical.some(y=>Math.abs(y)<.75)).toBe(true);
     expect(vertical.some(y=>y>.95)).toBe(true);
   }finally{scene.dispose();engine.dispose();}
 });
});
