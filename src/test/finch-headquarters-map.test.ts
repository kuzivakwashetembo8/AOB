import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001} from "../game/experiments/north-heights-finch-hq-001";
import {
 NORTH_HEIGHTS_MAP_FINCH_HQ_001,NORTH_HEIGHTS_MAP_BLOCKS_010,
 northHeightsMapPoint010,
} from "../game/experiments/north-heights-map-data-010";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");

describe("POI-002 Finch headquarters map designation",()=>{
 it("designates only the eastern 53-storey skyline tower, without creating mission logic",()=>{
  const hq=NORTH_HEIGHTS_FINCH_HEADQUARTERS_001;
  expect(hq.buildingId).toBe("NH-04-06-L2");
  expect(hq.blockId).toBe("NH-04-06");
  expect(hq.storeys).toBe(53);
  expect(hq.meetingFloor).toBe(53);
  expect(hq.status).toBe("location-only");
  expect(hq.position).toEqual({x:46.002,z:-94.18});
  const generator=read("src/game/experiments/north-heights-reconstruction-001.ts");
  expect(generator).toContain('lot.block === "NH-04-06"');
  expect(generator).toContain("lot.floors = 53");
 });
 it("projects to the correct building block without mirroring the map",()=>{
  const hq=NORTH_HEIGHTS_MAP_FINCH_HQ_001;
  expect(hq.x).toBeCloseTo(366.002,3);
  expect(hq.y).toBeCloseTo(414.18,3);
  expect({x:hq.x,y:hq.y}).toEqual(northHeightsMapPoint010(hq.position));
  const block=NORTH_HEIGHTS_MAP_BLOCKS_010.find(b=>b.id===hq.blockId)!;
  expect(hq.x).toBeGreaterThan(block.x);
  expect(hq.x).toBeLessThan(block.x+64);
  expect(hq.y).toBeGreaterThan(block.y);
  expect(hq.y).toBeLessThan(block.y+64);
 });
 it("shows its own marker and expanded label without losing the accepted white player dot",()=>{
  const view=read("src/ui/hud/north-heights-map-010.tsx");
  expect(view).toContain("NORTH_HEIGHTS_MAP_FINCH_HQ_001");
  expect(view).toContain("Finch headquarters location");
  expect(view).toContain("FINCH HQ");
  expect(view).toContain('fill="#d9a64c"');
  expect(view).toContain('fill="#ffffff"');
  expect(view).toContain("<DistrictVector x={position.x} z={position.z} poi={poi} buildings={buildings}/>");
  expect(view).toContain("<DistrictVector x={position.x} z={position.z} labels");
  expect(view).toContain("onFinchSelect");
  expect(view).toContain("buildings.map");
 });
});
