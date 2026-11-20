import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
 NORTH_HEIGHTS_PARKING_LOTS_010, NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010,
 validateNorthHeightsParking010,
} from "../game/experiments/north-heights-spatial-plan-010";
import {
 NORTH_HEIGHTS_MAP_ROADS_010,NORTH_HEIGHTS_MAP_BLOCKS_010,
 NORTH_HEIGHTS_MAP_PARKING_010,northHeightsMapPoint010,
} from "../game/experiments/north-heights-map-data-010";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("NH-010 parking, sealed building exteriors and map",()=>{
 it("reserves one genuinely vacant city block before buildings, parks or parking",()=>{
  const lot=NORTH_HEIGHTS_PARKING_LOTS_010[0]!;
  expect(lot.blockId).toBe("NH-03-05");
  expect(NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010.has(lot.blockId)).toBe(true);
  expect(lot.stalls).toHaveLength(6);
  expect(NORTH_HEIGHTS_PARKING_LOTS_010).toHaveLength(2);
  expect(NORTH_HEIGHTS_PARKING_LOTS_010[1]!.stalls).toHaveLength(6);
  expect(NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010.has("NH-04-07")).toBe(true);
  expect(new Set(lot.stalls.map(s=>s.id)).size).toBe(6);
  const fleet=[
   {width:2.03,length:4.85},{width:2.15,length:5.25},
   {width:2.1,length:4.75},{width:2.06,length:5.1},
   {width:1.93,length:4.8},{width:2,length:4.75},
  ];
  expect(validateNorthHeightsParking010([],fleet)).toBe(true);
  expect(()=>validateNorthHeightsParking010([{
   position:{x:lot.stalls[0]!.x,z:lot.stalls[0]!.z},
   overrides:{width:16,depth:16},
  }],fleet)).toThrow(/overlaps a building/);
 });
 it("uses uninterrupted window glazing and closed physical walls with no pedestrian portal",()=>{
  const src=read("src/game/experiments/north-heights-reconstruction-001.ts");
  expect(src).toContain("const entranceFace=false;");
  expect(src).toContain("All facade bays are closed glazing");
  expect(src).not.toMatch(/city\.box\("door"/);
  const collisions=read("src/game/experiments/north-heights-physics-005.ts");
  expect(collisions).toContain("Four continuous walls");
  expect(collisions).not.toContain("northHeightsDoorway010");
  expect(collisions).not.toContain("handles.push(physics.addStaticBox(lot.position,lot.halfExtents");
  expect(read("src/game/experiments/north-heights-city-8.ts")).toContain("buildingInteriors=[]");
 });
 it("projects district streets and owner-approved white marker without any live map service",()=>{
  expect(NORTH_HEIGHTS_MAP_ROADS_010).toHaveLength(11);
  expect(NORTH_HEIGHTS_MAP_BLOCKS_010).toHaveLength(100);
  expect(NORTH_HEIGHTS_MAP_PARKING_010).toHaveLength(2);
  expect(northHeightsMapPoint010({x:0,z:0})).toEqual({x:320,y:320});
  expect(northHeightsMapPoint010({x:-320,z:320})).toEqual({x:0,y:0});
  expect(northHeightsMapPoint010({x:320,z:-320})).toEqual({x:640,y:640});
  expect(northHeightsMapPoint010({x:900,z:-900})).toEqual({x:640,y:640});
  const view=read("src/ui/hud/north-heights-map-010.tsx");
  expect(view).toContain('fill="#ffffff"');
  expect(view).toContain("North Heights 2D map");
  const controls=read("src/game/experiments/north-heights-city-8.ts");
  expect(controls).toContain('event.code==="KeyF"');
  // Stage 6: the six parked GLBs were intentionally decommissioned.
  // Original moving Sedan manual steering is now a 20Hz NH012-owned input.
  expect(controls).toContain("traffic.setManualSteering(ridingSedanId,steerRequest)");
  expect(controls).not.toContain("driving.prepare(1/60,x,-z)");
  expect(controls).not.toContain("createMercerExtraParkedGLBs");
 });
});
