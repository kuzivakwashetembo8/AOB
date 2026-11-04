import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {NullEngine,Scene} from "@babylonjs/core";
import {NH012TrafficSimulator} from "../game/traffic/nh012-traffic-simulator";
import {dianeRoadStop008} from "../game/experiments/level001-diane-road-008";
import {DIANE_START_HINT_001,DIANE_MEETING_HINT_001,DIANE_SPOTTED_DISTANCE_009,
 DIANE_SPOTTED_SECONDS_009,DIANE_DIALOGUE_FAILED_009}
 from "../game/experiments/level001-diane-007";
import {northHeightsBuildingShaft019,buildingLiftFloorHeight019}
 from "../game/experiments/north-heights-building-lift-plan-019";
import {createNorthHeightsBuildingLifts019}
 from "../game/experiments/north-heights-building-lifts-019";
import {finchFloorRing004,finchFloorStopFraction004} from "../game/experiments/north-heights-finch-elevator-structure-004";
import type {MeridianPhysics} from "../game/physics/rapier-world";
const source=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");

describe("GTD-LEVEL001-WORLD-019 — owner follow-up refinements",()=>{
 it("keeps the receptionist seated without a constructed chair",()=>{
  const code=source("src/game/experiments/north-heights-finch-lobby-004.ts");
  expect(code).not.toContain('box("reception-seat"');
  expect(code).not.toContain('box("reception-seat-base"');
  expect(code).toContain('bottom-low.y*scale+.15');
 });
 it("renders a focused square map with only the game behind the blur",()=>{
  const code=source("src/ui/hud/north-heights-map-010.tsx");
  expect(code).toContain("backdrop-blur-[4px]");
  expect(code).toContain("aspect-square");
  expect(code).toContain('bg-transparent shadow-2xl');
  expect(code).not.toContain("max-w-[980px] flex-1");
 });
 it("rounds only outward facing land corners without black blocks or 4-way scallops",()=>{
  const code=source("src/game/experiments/north-heights-roads-003.ts");
  expect(code).toContain("outerX:number,outerZ:number");
  expect(code).toContain("Math.abs(corner.x-outerX)");
  expect(code).not.toContain("pad(batch.curb,xa,za,xb,zb,0,at)");
  expect(code).toContain("roundedJunctionPavement(batch.pavement,batch.curb,xa,za,xb,zb,");
 });
 it("moves Diane away from Finch and fails when a following car stays too close",()=>{
  expect(Math.hypot(DIANE_START_HINT_001.x-46.002,DIANE_START_HINT_001.z+94.18))
   .toBeGreaterThan(160);
  expect(DIANE_SPOTTED_DISTANCE_009).toBeGreaterThan(10);
  expect(DIANE_SPOTTED_SECONDS_009).toBeGreaterThan(0);
  expect(DIANE_DIALOGUE_FAILED_009).toHaveLength(2);
  const mission=source("src/game/experiments/level001-diane-007.ts");
  expect(mission).toContain('this.change("failed")');
  expect(mission).toContain('this.phase="find"');
  expect(mission).toContain("fleeingSeconds");
 });
 it("allows the targeted car to reserve junctions on intermediate road edges",()=>{
  const traffic=new NH012TrafficSimulator(25,120125);
  const car=traffic.agents[12]!;
  const start=dianeRoadStop008(traffic.graph,DIANE_START_HINT_001);
  const end=dianeRoadStop008(traffic.graph,DIANE_MEETING_HINT_001);
  expect(traffic.parkDianeVehicle001(car.id,start)).toBe(true);
  expect(traffic.beginDianeDrive001(car.id,end)).toBe(true);
  const visited=new Set<string>([car.edgeId]);
  for(let i=0;i<3000;i++){
   traffic.step();
   visited.add(car.edgeId);
   if(visited.size>=3)break;
  }
  expect(visited.size).toBeGreaterThanOrEqual(3);
 });
 it("keeps physical and visible lift holes identical in ALL multi-floor buildings",()=>{
  const lot={id:"NH-02-02-L1",position:{x:24,z:-80},
   overrides:{width:22,depth:33,floors:7,floorHeight:3.1}};
  const shaft=northHeightsBuildingShaft019(lot)!;
  expect(shaft.floors).toBe(7);
  expect(shaft.finch).toBe(false);
  expect(buildingLiftFloorHeight019(shaft,1)).toBe(.27);
  expect(buildingLiftFloorHeight019(shaft,7)).toBeGreaterThan(18);
  const pieces=finchFloorRing004(lot.position.x,lot.position.z,21.4,32.4,shaft);
  expect(pieces).toHaveLength(4);
  expect(pieces.every(p=>p.width>0&&p.depth>0)).toBe(true);
  const vis=source("src/game/experiments/north-heights-reconstruction-001.ts");
  const phy=source("src/game/experiments/north-heights-physics-005.ts");
  expect(vis).toContain("northHeightsBuildingShaft019");
  expect(phy).toContain("northHeightsBuildingShaft019");
  expect(vis).toContain("finchFloorRing004");
  expect(phy).toContain("finchFloorRing004");
 });
 it("instantiates a glass cabin lazily and moves the original capsule to a selected floor",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  let active=0;
  const physics={addStaticBox:()=>{
   active++;let disposed=false;
   return {dispose:()=>{if(!disposed){active--;disposed=true;}}};
  }} as unknown as MeridianPhysics;
  try{
   const lot={id:"NH-02-02-L1",position:{x:24,z:-80},
    overrides:{width:22,depth:33,floors:7,floorHeight:3.1}};
   const shaft=northHeightsBuildingShaft019(lot)!;
   const lifts=createNorthHeightsBuildingLifts019(scene,[lot],()=>4,physics);
   expect(lifts.count).toBe(1);
   expect(scene.getMeshByName("nh019:"+lot.id+":floor")).toBeNull();
   let p={x:shaft.x,y:4+.27+.92,z:shaft.z};
   let result=lifts.update(p,.05);
   expect(result.state?.available).toBe(true);
   expect(scene.getMeshByName("nh019:"+lot.id+":floor")).not.toBeNull();
   expect(lifts.requestFloor(lot.id,4)).toBe(true);
   expect(lifts.requestFloor(lot.id,5)).toBe(false);
   for(let i=0;i<150;i++){
    result=lifts.update(p,.05);
    if(result.positionOverride)p=result.positionOverride;
    if(!result.traveling)break;
   }
   expect(result.state?.currentFloor).toBe(4);
   expect(p.y).toBeCloseTo(4+buildingLiftFloorHeight019(shaft,4)+.92,2);
   expect(active).toBe(1);
   lifts.dispose();
   expect(active).toBe(0);
  }finally{scene.dispose();engine.dispose();}
 });
 it("uses one shared keypad that reads the real building floor count",()=>{
  const ui=source("src/ui/hud/north-heights-lift-keypad-019.tsx");
  const route=source("src/routes/north-heights-preview.tsx");
  expect(ui).toContain("length:lift.floors");
  expect(ui).toContain('data-testid="nh019-lift-keypad"');
  expect(route).toContain("setBuildingLift(lift)");
  expect(route).toContain("travelBuildingFloor019");
  expect(route).toContain("travelFinchElevator(floor)");
 });
 it("aligns all 53 Finch cabin stops with the actual floor surfaces",()=>{
  const shaft={floors:53,fh:3.1,bottomFloorOffset:.27,topFloorOffset:.87+52*3.1};
  expect(finchFloorStopFraction004(1,shaft)).toBe(0);
  expect(finchFloorStopFraction004(53,shaft)).toBe(1);
  for(let level=2;level<=53;level++){
   const cabinTop=shaft.bottomFloorOffset+
    finchFloorStopFraction004(level,shaft)*(shaft.topFloorOffset-shaft.bottomFloorOffset);
   const landingTop=.80+(level-1)*shaft.fh+.07;
   expect(cabinTop).toBeCloseTo(landingTop,8);
  }
  const lobby=source("src/game/experiments/north-heights-finch-lobby-004.ts");
  expect(lobby).toContain("finchFloorStopFraction004(target,shaft)");
  expect(lobby).toContain('box("top-white-door-threshold"');
  expect(lobby).toContain('box("floor-white-door-threshold-"+level');
 });
 it("keeps the map closable and pinch-zoomable, with compact dialogue above the scene",()=>{
  const map=source("src/ui/hud/north-heights-map-010.tsx");
  const route=source("src/routes/north-heights-preview.tsx");
  expect(map).toContain('aria-label="Close map"');
  expect(map).toContain("pointers.current.size===2");
  expect(map).toContain("pinch.current");
  expect(route).toContain('aria-label="Level 001 Finch dialogue"');
  expect(route).toContain("<ArrowRight size={17} strokeWidth={1.25}/>");
  expect(route).not.toContain('?"Finish":"Next"');
 });

});
