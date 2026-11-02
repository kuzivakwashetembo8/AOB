import {describe,it,expect} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {FINCH_INTRO_005,FINCH_START_005,finchProximity005}
 from "../game/experiments/north-heights-finch-intro-005";
import {NH012TrafficSimulator} from "../game/traffic/nh012-traffic-simulator";
import {createFinchSuite005} from "../game/experiments/north-heights-finch-suite-005";
import type {BuildingSpec} from "../game/world-generation/schema";
import type {MeridianPhysics} from "../game/physics/rapier-world";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
const building={id:"NH-04-06-L2",position:{x:46.002,y:11.27,z:-94.18},
 overrides:{width:22.669,depth:33.889,floors:53,floorHeight:3.1},
 archetype:"podium-tower",yawRadians:0,seed:"NH-04-06-L2"} as BuildingSpec;
describe("POI-005 owner-approved Finch introduction",()=>{
 it("requires four approved assignment dialogue bubbles for Reese",()=>{
  expect(FINCH_INTRO_005).toHaveLength(4);
  expect(FINCH_INTRO_005[0]).toBe("Mr. Reese, The Machine has given us a new number.");
  expect(FINCH_INTRO_005[1]).toContain("victim or a perpetrator");
  expect(FINCH_INTRO_005[2]).toContain("follow her");
  expect(FINCH_INTRO_005[3]).toBe("Don't intervene. Come back when you have something.");
 });
 it("only admits real three-dimensional proximity, not a character on ground floor",()=>{
  const finch={x:49,y:173.4,z:-86};
  expect(finchProximity005({x:50,y:173.5,z:-87},finch,true)).toBe(true);
  expect(finchProximity005({x:49,y:12,z:-86},finch,true)).toBe(false);
  expect(finchProximity005({x:54,y:173.4,z:-86},finch,true)).toBe(false);
  expect(finchProximity005({x:49,y:173.4,z:-86},finch,false)).toBe(false);
  expect(finchProximity005(null,finch,true)).toBe(false);
 });
 it("reassigns just one of the 125 accepted NH012 agents as yellow parked starter",()=>{
  const sim=new NH012TrafficSimulator(125,120125);
  const old=sim.population;
  const id=sim.parkFinchStarter005();
  const starter=sim.agents.find(a=>a.id===id)!;
  expect(sim.population).toBe(old);
  expect(sim.agents).toHaveLength(125);
  expect(sim.isStage6FreeParked(id)).toBe(true);
  expect(starter.speed).toBe(0);
  expect(starter.state).toBe("stopped");
  expect({x:starter.x,z:starter.z,heading:starter.heading}).toEqual(FINCH_START_005.starterCar);
  for(let i=0;i<20;i++)sim.step();
  expect(starter.x).toBe(FINCH_START_005.starterCar.x);
  expect(starter.z).toBe(FINCH_START_005.starterCar.z);
  expect(sim.beginFinchTargetDrive003(id).ok).toBe(false);
  sim.configureStage6FreeDriving(()=>true);
  sim.beginManualDriving(id);
  expect(sim.isStage6FreeDriving(id)).toBe(true);
  expect(sim.isStage6FreeParked(id)).toBe(false);
  sim.parkManualOffRoad(id);
  expect(sim.isStage6FreeParked(id)).toBe(true);
 });
 it("leaves floor 53 empty apart from Finch, with no furniture or extra colliders",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  let count=0;
  const physics={addStaticBox:()=>{count++;return {dispose:()=>{count--;}};}} as unknown as MeridianPhysics;
  const suite=createFinchSuite005(scene,[building],()=>11.27,physics);
  expect(scene.meshes.filter(m=>m.name.startsWith("poi005:"))).toHaveLength(0);
  expect(scene.materials.filter(m=>m.name.startsWith("poi005:"))).toHaveLength(0);
  expect(count).toBe(0);
  expect(suite.isNearFinch(suite.getFinchLocation())).toBe(false);
  expect(suite.getFinchLocation().y).toBeGreaterThan(160);
  const source=read("src/game/experiments/north-heights-finch-suite-005.ts");
  for(const prop of ["library-spine","executive-desk","sofa-seat","daybed","floor53-warm-carpet"]){
    expect(source).not.toContain('box("'+prop);
  }
  suite.dispose();expect(count).toBe(0);
  scene.dispose();engine.dispose();
 });
 it("uses original GLB path and accepted game control styles, not a separate lift panel",()=>{
  const suite=read("src/game/experiments/north-heights-finch-suite-005.ts");
  const lift=read("src/game/experiments/north-heights-finch-lobby-004.ts");
  const renderer=read("src/game/experiments/north-heights-sedan-traffic-009.ts");
  const route=read("src/routes/north-heights-preview.tsx");
  const touch=read("src/ui/hud/touch-controls.tsx");
  const desktop=read("src/ui/hud/desktop-controls.tsx");
  expect(suite).toContain('"Finch.glb"');
  expect(lift).toContain('const doorGlass=material(');
  expect(lift).toContain('const deckGlass=material(');
  expect(renderer).toContain('"#D7A83E"');
  expect(route).toContain('activeLines[dialogueIndex]');
  expect(route).toContain('poi005-next');
  expect(touch).toContain("gtd-uniform-action gtd-action-elevator");
  expect(desktop).toContain("desktop-control-button gtd-uniform-action gtd-action-elevator");
  expect(route).not.toContain('data-testid="finch-elevator-travel"');
 });
});
