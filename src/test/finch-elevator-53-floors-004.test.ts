import {describe,it,expect} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {finchShaft004,finchFloorRing004,FINCH_ELEVATOR_TRAVEL_SECONDS_004} from "../game/experiments/north-heights-finch-elevator-structure-004";
import {createFinchLobby004} from "../game/experiments/north-heights-finch-lobby-004";
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001} from "../game/experiments/north-heights-finch-hq-001";
import type {BuildingSpec} from "../game/world-generation/schema";
import type {MeridianPhysics} from "../game/physics/rapier-world";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const lot={id:NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.buildingId,
  position:{x:46.002,y:11.27,z:-94.18},overrides:{width:22.669,depth:33.889,floors:53,floorHeight:3.1},
  yawRadians:0,archetype:"podium-tower",seed:"NH-04-06-L2"} as BuildingSpec;
const ground=()=>11.27;
describe("POI-004 full-height Finch HQ elevator",()=>{
 it("centers the shaft on its wall and cuts all 52 intervening levels",()=>{
  const shaft=finchShaft004(lot)!;
  expect(shaft.x).toBe(lot.position.x);
  expect(shaft.floors).toBe(53);
  expect(shaft.topFloorOffset-shaft.bottomFloorOffset).toBeGreaterThan(160);
  const pieces=finchFloorRing004(lot.position.x,lot.position.z,
    lot.overrides!.width!-.6,lot.overrides!.depth!-.6,shaft);
  expect(pieces).toHaveLength(4);
  const expected=(lot.overrides!.width!-.6)*(lot.overrides!.depth!-.6)-4*shaft.halfX*shaft.halfZ;
  const actual=pieces.reduce((n,p)=>n+p.width*p.depth,0);
  expect(actual).toBeCloseTo(expected,5);
  for(const part of pieces){
   const overlapX=Math.max(0,Math.min(part.x+part.width/2,shaft.x+shaft.halfX)-
      Math.max(part.x-part.width/2,shaft.x-shaft.halfX));
   const overlapZ=Math.max(0,Math.min(part.z+part.depth/2,shaft.z+shaft.halfZ)-
      Math.max(part.z-part.depth/2,shaft.z-shaft.halfZ));
   expect(overlapX*overlapZ).toBeLessThan(.00001);
  }
 });
 it("raises the same player over time, opens at floor 53, then makes the full return",()=>{
  const engine=new NullEngine();const scene=new Scene(engine);
  let active=0;
  const physics={addStaticBox:()=>{
   active++;let disposed=false;
   return {dispose:()=>{if(!disposed){active--;disposed=true;}}};
  }} as unknown as MeridianPhysics;
  const lift=createFinchLobby004(scene,[lot],ground,physics);
  const shaft=finchShaft004(lot)!;
  let p={x:shaft.x,y:ground()+shaft.bottomFloorOffset+.92,z:shaft.z};
  let first=lift.update(p,.05);
  expect(first.state.available).toBe(true);
  expect(first.state.direction).toBe("up");
  expect(lift.requestTravel()).toBe(true);
  const original=p.y;
  let topReached=false,upTicks=0;
  for(let i=0;i<400;i++){
   const frame=lift.update(p,.05);
   if(frame.positionOverride)p=frame.positionOverride;
   if(frame.state.floor===53&&!frame.traveling){topReached=true;upTicks=i+1;break;}
  }
  expect(topReached).toBe(true);
  expect(upTicks*.05).toBeGreaterThanOrEqual(FINCH_ELEVATOR_TRAVEL_SECONDS_004);
  expect(p.y-original).toBeCloseTo(shaft.topFloorOffset-shaft.bottomFloorOffset,1);
  expect(lift.update(p,.05).state.direction).toBe("down");
  expect(lift.requestTravel()).toBe(true);
  let downReached=false;
  for(let i=0;i<400;i++){
   const frame=lift.update(p,.05);
   if(frame.positionOverride)p=frame.positionOverride;
   if(frame.state.floor===1&&!frame.traveling){downReached=true;break;}
  }
  expect(downReached).toBe(true);
  expect(p.y).toBeCloseTo(original,1);
  lift.dispose();expect(active).toBe(0);
  scene.dispose();engine.dispose();
 });
 it("maintains matching visual and physical holes while excluding grass",()=>{
  const visual=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-reconstruction-001.ts"),"utf8");
  const physics=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-physics-005.ts"),"utf8");
  const grass=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-block-surfaces-008.ts"),"utf8");
  expect(visual).toContain("finchFloorRing004(");
  expect(physics).toContain("finchFloorRing004(");
  expect(visual).toContain("excludedGrass:");
  expect(grass).toContain("if(xx===1&&zz===1)continue");
 });
 it("uses an existing office-professional formal receptionist and accessible lift arrows",()=>{
  const code=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-finch-lobby-004.ts"),"utf8");
  const route=readFileSync(resolve(process.cwd(),"src/routes/north-heights-preview.tsx"),"utf8");
  expect(code).toContain("PED002_NPC_FILES[24]");
  expect(code).toContain("car-side-glass");
  expect(code).toContain("requestTravel");
  const touch=readFileSync(resolve(process.cwd(),"src/ui/hud/touch-controls.tsx"),"utf8");
  const desktop=readFileSync(resolve(process.cwd(),"src/ui/hud/desktop-controls.tsx"),"utf8");
  expect(route).toContain("elevator={dialogueIndex===null?elevatorAction:undefined}");
  expect(touch).toContain('data-testid="poi005-lift-touch"');
  expect(desktop).toContain('data-testid="poi005-lift-desktop"');
  expect(touch).toContain("<ArrowUp");
  expect(desktop).toContain("<ArrowDown");
 });
});
