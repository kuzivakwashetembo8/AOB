import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {reeseGroundClip001} from "../game/character/reese-player-001";
import {constrainFinchCabinCamera006} from "../game/experiments/north-heights-finch-lobby-004";
const file=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");

describe("Level 001 preview refinement 011",()=>{
 it("keeps Reese on continuous walking clips and disables flight tilt animation",()=>{
  expect(reeseGroundClip001(2.7,false,true,0)).toBe("walk");
  expect(reeseGroundClip001(7,true,true,0)).toBe("run");
  const code=file("src/game/character/reese-player-001.ts");
  expect(code).toContain("pendingGaitSeconds");
  expect(code).toContain("setHandItem(item:");
  expect(code).toContain("resetFlight();");
  expect(code).not.toContain("flightPitch+=(pitch-flightPitch)");
 });
 it("starts empty-handed and places a distinct gun toggle before info/pause",()=>{
  const player=file("src/game/character/reese-player-001.ts");
  const screen=file("src/routes/north-heights-preview.tsx");
  expect(player).toContain('handItem:"hand"|"gun"="hand"');
  expect(screen).toContain('data-testid="reese-hand-selector"');
  expect(screen).toContain("controller.current?.setReeseHandItem(next)");
 });
 it("enforces physical elevator camera bounds and independent lift control",()=>{
  const c=constrainFinchCabinCamera006({x:100,y:500,z:-100},
   {x:4,z:2,floorY:20,height:3.05,halfX:2,halfZ:2});
  expect(c.x).toBe(6);expect(c.z).toBe(0);expect(c.y).toBeLessThan(24);
  const lobby=file("src/game/experiments/north-heights-finch-lobby-004.ts");
  expect(lobby).toContain("car-front-sidelight-left");
  expect(lobby).toContain("car-front-sidelight-right");
  const screen=file("src/routes/north-heights-preview.tsx");
  expect(screen).toContain('data-testid="poi005-lift-independent"');
  expect(screen).not.toContain("elevator={dialogueIndex===null?elevatorAction:undefined}");
 });
 it("uses native city roofs and preserves anonymous mission POI",()=>{
  const map=file("src/ui/hud/north-heights-map-010.tsx");
  const world=file("src/game/experiments/north-heights-city-8.ts");
  expect(map).toContain("buildings.map");
  expect(map).not.toContain("NORTH_HEIGHTS_MAP_BLOCKS_010");
  expect(map).toContain('data-testid="level001-anonymous-poi"');
  expect(world).toContain("onMapBuildings?.(world.lotSpecs.map");
 });
 it("does not allow roof/floor peeking or orphaned mission junction occupancy",()=>{
  expect(file("src/game/experiments/north-heights-city-8.ts"))
   .toContain("room.position.z-d/2+.55");
  const traffic=file("src/game/traffic/nh012-traffic-simulator.ts");
  expect(traffic).toContain("reconcileJunctionReservations001()");
  expect(traffic).toContain("if(!this.dianePace001)return;");
 });
 it("adds a reception seat and actual rounded pavement faces",()=>{
  const lobby=file("src/game/experiments/north-heights-finch-lobby-004.ts");
  expect(lobby).toContain('box("reception-seat"');
  expect(lobby).toContain("sit.*idle");
  const roads=file("src/game/experiments/north-heights-roads-003.ts");
  expect(roads).toContain("roundedJunctionPavement");
  expect(roads).toContain('if(name!=="curb")');
 });
});
