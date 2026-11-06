import {describe,expect,it} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import type {BuildingSpec} from "../game/world-generation/schema";
import type {MeridianPhysics} from "../game/physics/rapier-world";
import {ROOM_COMPONENT_CATALOG_024,describeRoomComponent024}
 from "../game/interiors/room-components-024";
import {connectableRooms024,organizeRoomFloor024,roomFloorSeed024}
 from "../game/interiors/organize-floor-024";
import {finchCafeFloorProgram024,organizeFinchCafeFloor024}
 from "../game/experiments/finch-hq-floor3-program-024";
import {createFinchCafeFloor024}
 from "../game/experiments/finch-hq-floor3-cafe-024";
import {finchShaft004}
 from "../game/experiments/north-heights-finch-elevator-structure-004";

const lot={id:"NH-04-06-L2",
 position:{x:46.002,y:11.27,z:-94.18},yawRadians:0,
 overrides:{width:22.669,depth:33.889,floors:53,floorHeight:3.1},
 archetype:"podium-tower",seed:"NH-04-06-L2"} as BuildingSpec;

describe("FINCH-CAFE-024 component organization",()=>{
 it("uses reusable component kinds, genuine floor zones and connected openings",()=>{
  const raw=finchCafeFloorProgram024(lot);
  const result=organizeRoomFloor024(raw);
  expect(ROOM_COMPONENT_CATALOG_024).toContain("cafe-table-group");
  expect(raw.floor).toBe(3);
  expect(raw.zones).toHaveLength(4);
  expect(raw.openings).toHaveLength(3);
  expect(raw.openings.every(o=>o.width>=2.1)).toBe(true);
  expect(result.placements.filter(p=>p.kind==="cafe-table-group"))
   .toHaveLength(6);
  expect(result.placements.filter(p=>p.kind==="pendant-light"))
   .toHaveLength(6);
  expect(result.placements.some(p=>p.kind==="pantry-bench")).toBe(true);
  expect(result.placements.some(p=>p.kind==="partition-glass")).toBe(true);
  expect(connectableRooms024(result)).toBe(true);
  expect(organizeFinchCafeFloor024(lot)).toEqual(result);
  expect(roomFloorSeed024(lot.id,3)).toBe(roomFloorSeed024(lot.id,3));
  expect(roomFloorSeed024(lot.id,3)).not.toBe(roomFloorSeed024(lot.id,4));
  const sample=describeRoomComponent024(result.placements[0]!);
  expect(sample.length).toBeGreaterThan(10);
 });
 it("refuses disconnected floors or mismatched building IDs",()=>{
  const raw=finchCafeFloorProgram024(lot);
  expect(()=>organizeRoomFloor024({...raw,openings:[]})).toThrow();
  expect(()=>finchCafeFloorProgram024({...lot,id:"another-tower"})).toThrow();
  expect(()=>organizeRoomFloor024({...raw, rules:[
   {id:"invalid",zoneId:"meeting",kind:"cafe-counter",layout:"anchors",
    anchors:[{x:99,z:99}]},
  ]})).toThrow();
 });
 it("lazily mounts physical cafe components only on the occupied third floor",()=>{
  const engine=new NullEngine();
  const scene=new Scene(engine);
  let liveBodies=0;
  const physics={addStaticBox:()=>{
   liveBodies++;
   return {dispose(){liveBodies--;}};
  }} as unknown as MeridianPhysics;
  const cafe=createFinchCafeFloor024(scene,lot,()=>11.27,physics);
  expect(cafe.stats().active).toBe(false);
  expect(liveBodies).toBe(0);
  const shaft=finchShaft004(lot)!;
  const floorY=11.27+shaft.topFloorOffset-(shaft.floors-3)*shaft.fh;
  cafe.update({x:lot.position.x,y:floorY+.92,z:lot.position.z+6},true);
  expect(cafe.stats().active).toBe(false);
  cafe.update({x:lot.position.x,y:floorY+.92,z:lot.position.z+6},false);
  expect(cafe.stats().active).toBe(true);
  expect(cafe.stats().components).toBeGreaterThan(20);
  expect(cafe.stats().meshes).toBeGreaterThan(100);
  expect(liveBodies).toBeGreaterThan(12);
  expect(scene.getMeshByName("finch024:ceiling-panel-0")).toBeTruthy();
  expect(scene.meshes.some(m=>m.name.includes("meeting-front-left"))).toBe(true);
  expect(scene.meshes.some(m=>m.name.includes("espresso-station"))).toBe(true);
  cafe.update({x:lot.position.x,y:floorY-3.1+.92,z:lot.position.z+6},false);
  expect(cafe.stats().active).toBe(false);
  expect(liveBodies).toBe(0);
  cafe.dispose();
  scene.dispose();engine.dispose();
 });
});
