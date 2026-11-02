import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {DianeLevel001,DIANE_DIALOGUE_ASSIGNMENT_001,DIANE_DIALOGUE_REPORT_001,DIANE_FICTIONAL_SSN_001,parseDianeProgress001} from "../game/experiments/level001-diane-007";
import {dianeRoadStop008,dianeCrossCityRoute008,dianeRoadMeters008} from "../game/experiments/level001-diane-road-008";
import {NH012TrafficSimulator} from "../game/traffic/nh012-traffic-simulator";
import type {PedAgent001,NorthHeightsPedestrianSimulator001} from "../game/experiments/north-heights-pedestrian-simulator-001";
import type {PedGraph001} from "../game/experiments/north-heights-pedestrian-graph-001";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
function rig(){
 const graph:PedGraph001={nodes:new Map([["meeting",{id:"meeting",x:-198,z:182,kind:"sidewalk"}]]),
  links:new Map([["meeting",[]]]),entrances:new Map(),parks:[],crossings:0,unreachable:[]};
 const agents=Array.from({length:100},(_,i)=>({id:"PED-"+String(i+1).padStart(3,"0"),
  appearanceId:i+1,origin:"HQ",destination:"HQ",x:46,z:-75,state:"inside",speed:1.4})) as PedAgent001[];
 const sim={agents,graph,population:100,reserveAgents001:()=>{},releaseAgents001:()=>{}}
  as unknown as NorthHeightsPedestrianSimulator001;
 const traffic=new NH012TrafficSimulator(125,120125);
 const m=new DianeLevel001(sim,traffic,traffic.agents[110]!.id,parseDianeProgress001(null),()=>{});
 return {m,traffic,sim};
}
describe("Level 001 vehicle surveillance",()=>{
 it("keeps dialogue within four bubbles, stable identity and new persistence checkpoint",()=>{
  expect(DIANE_DIALOGUE_ASSIGNMENT_001).toHaveLength(4);
  expect(DIANE_DIALOGUE_REPORT_001).toHaveLength(2);
  expect(parseDianeProgress001(JSON.stringify({phase:"observe",ssn:DIANE_FICTIONAL_SSN_001})).phase).toBe("observe");
 });
 it("reserves existing NPCs and a real traffic car with a long legal city route",()=>{
  const {m,traffic,sim}=rig();
  expect(sim.agents).toHaveLength(100);expect(traffic.agents).toHaveLength(125);
  expect(traffic.agents.includes(m.car)).toBe(true);
  expect(m.routeMeters).toBeGreaterThan(250);
  const start=dianeRoadStop008(traffic.graph,{x:70,z:-58});
  const end=dianeRoadStop008(traffic.graph,m.meeting);
  const route=dianeCrossCityRoute008(traffic.graph,start.edgeId,start.s,end);
  expect(route).not.toBeNull();
  expect(dianeRoadMeters008(traffic.graph,route!,start.s)).toBeGreaterThan(250);
  for(let i=1;i<route!.edges.length;i++)
   expect((traffic.graph.turns.get(route!.edges[i-1]!)??[]).some(t=>t.outgoing===route!.edges[i])).toBe(true);
 });
 it("does not depart before Reese identifies Diane and enters a separate car",()=>{
  const {m,traffic}=rig();
  expect(m.assign()).toBe(true);
  expect(m.view.poi).toEqual(m.start);
  m.tick(.05,{x:m.start.x,y:.92,z:m.start.z,inCar:false,speed:0},0,()=>0);
  expect(m.stage).toBe("follow");
  for(let i=0;i<65;i++)m.tick(.1,{x:m.car.x+4,y:.92,z:m.car.z+4,inCar:false,speed:0},0,()=>0);
  expect(m.target.state).toBe("inside");
  expect(traffic.targetDriveStatus003(m.carId)).toBe("none");
  m.tick(.1,{x:m.car.x+4,y:.92,z:m.car.z+4,inCar:true,speed:0},0,()=>0);
  expect(traffic.targetDriveStatus003(m.carId)).toBe("enroute");
 });
 it("shows an anonymous map i, and disallows entering Diane's car",()=>{
  const map=read("src/ui/hud/north-heights-map-010.tsx");
  expect(map).toContain('data-testid="level001-anonymous-poi"');
  expect(map).not.toContain("Diane");
  const scene=read("src/game/experiments/north-heights-city-8.ts");
  expect(scene).toContain("near.id===dianeLevel?.carId");
 });
});