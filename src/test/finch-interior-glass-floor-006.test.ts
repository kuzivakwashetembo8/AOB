import {describe,it,expect} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {northHeightsGround} from "../game/experiments/north-heights-reconstruction-001";
import {
 FINCH_LOBBY_FOOTPRINT_006,FINCH_LOBBY_FLOOR_OFFSET_006,
 insideFinchLobby006,finchTerrainHeight006,finchLobbyMinimumCapsuleY006,
 finchShaft004,
} from "../game/experiments/north-heights-finch-elevator-structure-004";
import {constrainFinchCabinCamera006,createFinchLobby004}
 from "../game/experiments/north-heights-finch-lobby-004";
import type {BuildingSpec} from "../game/world-generation/schema";
import type {MeridianPhysics} from "../game/physics/rapier-world";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const lot={id:"NH-04-06-L2",seed:"NH-04-06-L2",archetype:"podium-tower",
 position:{x:46.002,y:11.27,z:-94.18},yawRadians:0,
 overrides:{width:22.669,depth:33.889,floors:53,floorHeight:3.1}} as BuildingSpec;

describe("POI-006 uniformly flat HQ and full-glass elevator",()=>{
 it("uses one continuous lobby support level, without a hillside step midway",()=>{
  const r=FINCH_LOBBY_FOOTPRINT_006;
  expect(r.x).toBe(lot.position.x);
  expect(r.z).toBe(lot.position.z);
  expect(r.halfX*2).toBeCloseTo(lot.overrides!.width!,3);
  expect(r.halfZ*2).toBeCloseTo(lot.overrides!.depth!,3);
  const center=northHeightsGround(r.x,r.z);
  const floor=center+FINCH_LOBBY_FLOOR_OFFSET_006;
  for(const dx of [-.85,-.5,0,.5,.85]){
   for(const dz of [-.88,-.4,0,.4,.88]){
    const x=r.x+r.halfX*dx,z=r.z+r.halfZ*dz;
    expect(insideFinchLobby006(x,z)).toBe(true);
    expect(finchTerrainHeight006(x,z,northHeightsGround)).toBeCloseTo(center+.08,5);
    expect(finchLobbyMinimumCapsuleY006(x,z,northHeightsGround))
     .toBeCloseTo(floor+.92+.015,5);
   }
  }
  // The city hill must remain unchanged well outside Finch's footprint.
  const away={x:r.x+r.halfX+5,z:r.z};
  expect(finchTerrainHeight006(away.x,away.z,northHeightsGround))
   .toBeCloseTo(northHeightsGround(away.x,away.z),5);
  expect(finchLobbyMinimumCapsuleY006(away.x,away.z,northHeightsGround)).toBeNull();
  const lobby=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-finch-lobby-004.ts"),"utf8");
  expect(lobby).not.toContain('box("full-white-lobby-floor"');
  expect(lobby).not.toContain('box("top-white-landing"');
  expect(lobby).toContain('box("top-white-door-threshold"');
  const terrain=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-reconstruction-001.ts"),"utf8");
  const engine=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-city-8.ts"),"utf8");
  expect(terrain).toContain("finchTerrainHeight006(x,z,northHeightsGround)");
  expect(engine).toContain("finchLobbyMinimumCapsuleY006(limited.x,limited.z,northHeightsGround)");
 });
 it("makes every cabin component transparent glass and confines the camera inside",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  let active=0;
  const physics={addStaticBox:()=>{active++;return {dispose:()=>{active--;}};}} as unknown as MeridianPhysics;
  const lift=createFinchLobby004(scene,[lot],northHeightsGround,physics);
  const shaft=finchShaft004(lot)!;
  const base=northHeightsGround(lot.position.x,lot.position.z)+shaft.bottomFloorOffset;
  const p={x:shaft.x,y:base+.92,z:shaft.z};
  const before=lift.update(p,.05);
  expect(before.cameraCabin).not.toBeNull();
  const cabin=before.cameraCabin!;
  expect(cabin.floorY).toBeCloseTo(base,4);
  for(const projected of [
   {x:cabin.x+50,y:base+20,z:cabin.z+50},
   {x:cabin.x-50,y:base-20,z:cabin.z-50},
  ]){
   const cam=constrainFinchCabinCamera006(projected,cabin);
   expect(Math.abs(cam.x-cabin.x)).toBeLessThan(cabin.halfX+.0001);
   expect(Math.abs(cam.z-cabin.z)).toBeLessThan(cabin.halfZ+.0001);
   expect(cam.y).toBeGreaterThanOrEqual(cabin.floorY+.40);
   expect(cam.y).toBeLessThanOrEqual(cabin.floorY+cabin.height-.25);
  }
  const liftParts=scene.meshes.filter(m=>/^poi004:(car-|door-|shaft-)/.test(m.name));
  expect(liftParts.length).toBeGreaterThanOrEqual(10);
  for(const item of liftParts){
   expect(item.material?.alpha).toBeLessThan(1);
   expect(item.material?.name).toMatch(/glass/);
  }
  for(const forbidden of ["jamb","handrail","header","column","indicator"]){
   expect(scene.meshes.filter(m=>m.name.includes(forbidden))).toHaveLength(0);
  }
  expect(lift.requestTravel()).toBe(true);
  let person=p;
  for(let i=0;i<150;i++){
   const frame=lift.update(person,.05);
   if(frame.positionOverride)person=frame.positionOverride;
   expect(frame.cameraCabin).not.toBeNull();
   expect(frame.cameraCabin!.floorY).toBeGreaterThanOrEqual(base);
  }
  lift.dispose();expect(active).toBe(0);
  scene.dispose();engine.dispose();
 });
});
