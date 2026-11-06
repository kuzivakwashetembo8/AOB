import {describe,expect,it} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import type {BuildingSpec} from "../game/world-generation/schema";
import type {MeridianPhysics} from "../game/physics/rapier-world";
import {createFinchSuite005} from "../game/experiments/north-heights-finch-suite-005";
import {finchShaft004} from "../game/experiments/north-heights-finch-elevator-structure-004";

const lot={
 id:"NH-04-06-L2",seed:"NH-04-06-L2",archetype:"podium-tower",
 position:{x:46.002,y:11.27,z:-94.18},yawRadians:0,
 overrides:{width:22.669,depth:33.889,floors:53,floorHeight:3.1},
} as BuildingSpec;

describe("FINCH-ROOM-022 pilot polishing",()=>{
 it("keeps the 53rd-floor meeting geometry navigable and the mission anchor fixed",()=>{
  const engine=new NullEngine();
  const scene=new Scene(engine);
  let active=0;
  const physics={addStaticBox:()=>{
   active++;return {dispose:()=>{active--;}};
  }} as unknown as MeridianPhysics;
  const suite=createFinchSuite005(scene,[lot],()=>11.27,physics);
  const find=(name:string)=>{
   const mesh=scene.getMeshByName("finch022:"+name);
   expect(mesh, "Missing mesh "+name).toBeTruthy();
   return mesh!;
  };
  const desk=find("executive-desk-top");
  const visitorWest=find("visitor-west-seat");
  const visitorEast=find("visitor-east-seat");
  const finch=suite.getFinchLocation();
  const localFinchZ=finch.z-lot.position.z;
  expect(localFinchZ).toBeCloseTo(8.98,4);
  expect(desk.position.z).toBeLessThan(localFinchZ-1);
  expect(visitorWest.position.z).toBeLessThan(desk.position.z);
  expect(visitorEast.position.z).toBeCloseTo(visitorWest.position.z,4);
  expect(visitorEast.position.x-visitorWest.position.x).toBeCloseTo(1.7,4);
  // Continuous lift-to-library L: overlap at the bend and terminate
  // within the first bookcase bay at the actual shelf front (not empty wall).
  const mainRunner=find("lift-runner");
  const westRunner=find("library-runner-turn");
  expect(mainRunner.position.z+14.75/2)
   .toBeGreaterThanOrEqual(westRunner.position.z-1.74/2);
  expect(westRunner.position.x).toBeLessThan(mainRunner.position.x);
  expect(mainRunner.position.z-14.75/2).toBeLessThan(-8.8);
  const nearShelf=find("bookshelf-back");
  const westEdge=westRunner.position.x-6.08/2;
  const shelfFace=nearShelf.position.x+.40;
  expect(Math.abs(westEdge-shelfFace)).toBeLessThan(.30);
  // The turn reaches the first bookshelf span starting z~5.75.
  expect(westRunner.position.z).toBeGreaterThan(6.0);
  expect(find("pendant-ring").position.y).toBeGreaterThan(2.5);
  expect(find("lounge-floor-lamp-shade").position.y).toBeGreaterThan(1.8);
  expect(find("wall-sconce-west").position.x).toBeLessThan(-5.8);
  expect(scene.getMeshByName("finch022:wall-sconce-right")).toBeNull();
  // Four existing floor skins support the visible floor without more
  // physical floor slabs; furniture adds only 5 static contact boxes.
  expect(scene.meshes.filter(m=>m.name.startsWith("finch023:floor-skin-"))).toHaveLength(37);
  expect(active).toBe(5);
  expect(finchShaft004(lot)?.floors).toBe(53);
  suite.dispose();
  expect(active).toBe(0);
  scene.dispose();
  engine.dispose();
 });
 it("limits clear top-edge glazing to the Finch office level",()=>{
  const source=readFileSync(resolve(process.cwd(),
   "src/game/experiments/north-heights-reconstruction-001.ts"),"utf8");
  expect(source).toContain('lot.id==="NH-04-06-L2"&&lot.floors===53');
  expect(source).toContain('const regularGlassHeight=finchOffice?officeGlassStart:height');
  expect(source).toContain('city.box("finch-office-clear"');
  expect(source).toContain("const stride=finchOffice?1:");
  expect(source).toContain('mat.alpha=.12');
 });
});
