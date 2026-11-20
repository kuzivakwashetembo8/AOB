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
 it("keeps the Finch mission anchor but creates no office or furniture inside HQ",()=>{
  const engine=new NullEngine();
  const scene=new Scene(engine);
  let active=0;
  const physics={addStaticBox:()=>{
   active++;return {dispose:()=>{active--;}};
  }} as unknown as MeridianPhysics;
  const suite=createFinchSuite005(scene,[lot],()=>11.27,physics);
  expect(scene.meshes.filter(m=>m.name.startsWith("finch022:"))).toHaveLength(0);
  expect(scene.meshes.filter(m=>m.name.startsWith("finch023:"))).toHaveLength(0);
  expect(active).toBe(0);
  const finch=suite.getFinchLocation();
  expect(finch.z-lot.position.z).toBeCloseTo(8.98,4);
  expect(finch.y).toBeGreaterThan(160);
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
