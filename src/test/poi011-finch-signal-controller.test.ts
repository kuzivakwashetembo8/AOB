import {describe,expect,it} from "vitest";
import {TrafficSignalController021} from "../game/traffic/nh021-traffic-signal-controller";
import {FINCH_SIGNAL_NODE_021,pilotSignalPlans021,pilotZebraEdge021} from "../game/traffic/nh021-traffic-signal-plan";
import {planFinchTrafficSignals021} from "../game/experiments/north-heights-traffic-signal-placements-021";
import {northHeightsPedestrianZebra001} from "../game/experiments/north-heights-pedestrian-crossings-001";
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001} from "../game/experiments/north-heights-finch-hq-001";
import {buildNorthHeightsTrafficGraph012} from "../game/traffic/nh012-lane-network";
import {NH012TrafficSimulator} from "../game/traffic/nh012-traffic-simulator";
import {readFileSync} from "node:fs";
const source=(f:string)=>readFileSync(f,"utf8");
describe("POI-011: citywide data model, one Finch HQ controlled junction",()=>{
 it("activates only nearest grid node to Finch entrance",()=>{
  const plan=pilotSignalPlans021();
  expect(plan).toHaveLength(1);
  expect(plan[0]!.nodeId).toBe(FINCH_SIGNAL_NODE_021);
  expect(plan[0]!.centre).toEqual({x:64,z:-64});
  expect(plan[0]!.enabled).toBe(true);
  const graph=buildNorthHeightsTrafficGraph012();
  expect(graph.nodes.size).toBe(121);
  const h=NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.entrance;
  const ordered=[...graph.nodes.values()].map(n=>({id:n.id,d:Math.hypot(h.x-n.x,h.z-n.z)}))
   .sort((a,b)=>a.d-b.d);
  expect(ordered[0]!.id).toBe(FINCH_SIGNAL_NODE_021);
  expect(ordered[0]!.d).toBeCloseTo(22.34069077,4);
 });
 it("uses exactly four road-facing approaches, both supplied GLB asset types",()=>{
  const placements=planFinchTrafficSignals021();
  expect(placements).toHaveLength(4);
  expect(placements.filter(p=>p.kind==="hanging")).toHaveLength(2);
  expect(placements.filter(p=>p.kind==="roadside")).toHaveLength(2);
  expect(new Set(placements.map(p=>p.approach)).size).toBe(4);
  const graph=buildNorthHeightsTrafficGraph012();
  const incoming=graph.incoming.get(FINCH_SIGNAL_NODE_021)??[];
  for(const edgeId of incoming){
   const edge=graph.edges.get(edgeId)!;
   const p=placements.find(p=>p.faceX===-edge.dx&&p.faceZ===-edge.dz);
   expect(p).toBeDefined();
   expect(Math.hypot(p!.poleX-64,p!.poleZ+64)).toBeGreaterThan(8);
  }
  const renderer=source("src/game/experiments/north-heights-traffic-signal-renderer-021.ts");
  expect(renderer).toContain('traffic_light_-_free_low_poly.glb');
  expect(renderer).toContain('Traffic Light 2e (hanging).glb');
  expect(renderer).toContain('thinInstanceSetBuffer("matrix"');
  expect(renderer).toContain("pedestrianMayEnter021");
 });
 it("never shows conflicting green while stepping at 20Hz",()=>{
  const s=new TrafficSignalController021();
  const states=new Set<string>();
  for(let t=0;t<2500;t++){
   const ns=s.mayEnter021(0,1),ew=s.mayEnter021(1,0);
   expect(ns&&ew).toBe(false);
   states.add(s.phase);
   s.advance021(false);
  }
  for(const name of ["NS_GREEN","NS_AMBER","NS_CLEARANCE","EW_GREEN","EW_AMBER","EW_CLEARANCE"])
   expect(states.has(name)).toBe(true);
  expect(states.has("PED_WALK")).toBe(false);
  expect(s.tick).toBe(2500);
 });
 it("serves waiting crossing demand and protects people already on zebra",()=>{
  const s=new TrafficSignalController021();
  let crossing=0;s.setPedestrianOccupancy021(()=>crossing);
  s.requestPedestrian021();
  expect(s.pedestrianMayEnter021).toBe(false);
  for(let i=0;i<1100&&s.phase!=="PED_WALK";i++)s.advance021(false);
  expect(s.phase).toBe("PED_WALK");
  expect(s.mayEnter021(0,1)).toBe(false);
  expect(s.mayEnter021(1,0)).toBe(false);
  crossing=1;
  for(let i=0;i<500;i++)s.advance021(false);
  expect(["PED_CLEARANCE","PED_ALL_RED"]).toContain(s.phase);
  expect(s.mayEnter021(0,1)).toBe(false);
  crossing=0;
  for(let i=0;i<200;i++)s.advance021(false);
  expect(s.phase).toBe("NS_GREEN");
 });
 it("holds a clearance against occupied vehicle even if timer expires",()=>{
  const s=new TrafficSignalController021();
  for(let i=0;i<380;i++)s.advance021(false);
  expect(s.phase).toBe("NS_CLEARANCE");
  for(let i=0;i<200;i++)s.advance021(true);
  expect(s.phase).toBe("NS_CLEARANCE");
  expect(s.mayEnter021(1,0)).toBe(false);
  s.advance021(false);
  expect(s.phase).toBe("EW_GREEN");
 });
 it("reuses the single pilot zebra source for road paint and pedestrian graph",()=>{
  expect(northHeightsPedestrianZebra001(6,4)).toBe(true);
  expect(pilotZebraEdge021("zebra:e:6:4:+","zebra:e:6:4:-")).toBe(true);
  expect(pilotZebraEdge021("zebra:n:6:4:+","zebra:n:6:4:-")).toBe(true);
  expect(pilotZebraEdge021("zebra:e:6:4:+","zebra:n:6:4:-")).toBe(false);
  expect(pilotZebraEdge021("zebra:e:5:4:+","zebra:e:5:4:-")).toBe(false);
  expect(source("src/game/experiments/north-heights-roads-003.ts")).toContain("if(ix===6&&iz===4)");
 });
 it("keeps unsignalized simulator deterministic when pilot controller not attached",()=>{
  const a=new NH012TrafficSimulator(20,120125);
  const b=new NH012TrafficSimulator(20,120125);
  for(let i=0;i<500;i++){a.step();b.step();}
  expect(a.agents).toEqual(b.agents);
  expect(a.validate()).toEqual([]);
  expect(a.trafficSignalSnapshot021()).toBeNull();
 });
 it("permits signal clock only on the designated Finch node",()=>{
  const traffic=new NH012TrafficSimulator(20,120125);
  traffic.configureTrafficSignal021(new TrafficSignalController021());
  for(let i=0;i<100;i++)traffic.step();
  expect(traffic.trafficSignalSnapshot021()?.tick).toBe(100);
  traffic.configureTrafficSignal021(null);
  expect(traffic.trafficSignalSnapshot021()).toBeNull();
 });
});
