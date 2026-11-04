import {describe,it,expect} from "vitest";
import {pedestrianObstacleStep020,type PedMotion020} from "../game/experiments/north-heights-pedestrian-avoidance-020";
import {finchMissionVisit005,finchProximity005} from "../game/experiments/north-heights-finch-intro-005";
import {nh017CircleOverlapsCar,createNorthHeightsSolidField017}
 from "../game/vehicles/nh-solid-vehicle-collision-017";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const source=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("PED-020 local obstruction avoidance",()=>{
 it("sidesteps a stopped car then returns onto the original waypoint line",()=>{
  const car={id:"blocked",x:5,z:0,heading:0};
  const clear=(x:number,z:number)=>!nh017CircleOverlapsCar({x,z},.35,car,2.1,1.9);
  let p:PedMotion020={x:0,z:0,progress:0,avoidOffset:0,avoidTarget:0};
  let lateral=false,returned=false,waiting=0;
  for(let i=0;i<500;i++){
   const next=pedestrianObstacleStep020(p,{x:0,z:0},{x:12,z:0},"crossing",.13,clear,1);
   expect(clear(next.x,next.z)).toBe(true);
   if(next.blocked)waiting++;
   p=next;
   if(Math.abs(p.z)>1.4)lateral=true;
   if(lateral&&p.x>8&&Math.abs(p.z)<.05)returned=true;
   if(p.progress>=12&&Math.abs(p.avoidOffset)<.015)break;
  }
  expect(waiting).toBeLessThan(15);
  expect(lateral).toBe(true);
  expect(returned).toBe(true);
  expect(p.progress).toBeCloseTo(12,2);
  expect(p.z).toBeCloseTo(0,2);
 });
 it("never crosses an impassable obstruction",()=>{
  const clear=(x:number,z:number)=>x<3.9||x>6.1;
  let p:PedMotion020={x:0,z:0,progress:0,avoidOffset:0,avoidTarget:0};
  for(let i=0;i<120;i++)p=pedestrianObstacleStep020(p,{x:0,z:0},{x:10,z:0},"sidewalk",.1,clear,1);
  expect(p.x).toBeLessThan(4);
 });
 it("recognizes physical tree trunks as pedestrian obstacles",()=>{
  const field=createNorthHeightsSolidField017({
   cars:()=>[],buildings:[],lamps:[],trees:[{x:0,z:0,size:1}],
  });
  expect(field.personClear({x:0,z:0})).toBe(false);
  expect(field.personClear({x:3,z:0})).toBe(true);
 });
 it("opens a mission-relevant Finch conversation at five metres repeatedly",()=>{
  const finch={x:0,y:160,z:0};
  expect(finchProximity005({x:5,y:160,z:0},finch,true)).toBe(true);
  expect(finchProximity005({x:5.1,y:160,z:0},finch,true)).toBe(false);
  for(const phase of ["find","follow","observe","complete"] as const)
   expect(finchMissionVisit005(phase).length).toBeGreaterThan(0);
  const route=source("src/routes/north-heights-preview.tsx");
  expect(route).toContain("finchVisitOpened.current=false");
  expect(route).toContain('if(dialogueKind==="visit")');
 });
 it("uses lighter gritty stone for sidewalks and the same material on curb fascia",()=>{
  const road=source("src/game/experiments/north-heights-reconstruction-001.ts");
  expect(road).toContain('["pavement","sidewalk-paving"]');
  expect(road).toContain('color:key==="pavement"?"#a8a198"');
  expect(road).toContain('textureKind:key==="pavement"?"asphalt"');
  const geometry=source("src/game/experiments/north-heights-roads-003.ts");
  expect(geometry).toContain("curb:material.pavement");
 });
});
