import {describe,it,expect} from "vitest";
import {NorthHeightsPedestrianSimulator001} from "@/game/experiments/north-heights-pedestrian-simulator-001";
import {pedestrianRoute001} from "@/game/experiments/north-heights-pedestrian-graph-001";
import type {BuildingSpec} from "@/game/world-generation/schema";
const building=(id:string,x:number,z:number):BuildingSpec=>({
 id,seed:id,archetype:"residential",yawRadians:0,position:{x,y:0,z},
 overrides:{width:10,depth:12,floors:3,floorHeight:3.1},
});
const close=[
 building("A",-294,-288),building("B",-286,-288),
 building("C",-278,-288),building("D",-270,-288),
];
describe("PED-001 Stage 3 building journey lifecycle",()=>{
 it("completes repeated journeys and re-emerges only at valid doorways",()=>{
   const sim=new NorthHeightsPedestrianSimulator001(close);
   const first=sim.agents[0]!;
   let seenDeparture=false,seenArrival=false,previous=first.state;
   let maxDisplacement=0,prevX=first.x,prevZ=first.z;
   for(let i=0;i<7000;i++){
     sim.step(.05);
     const delta=Math.hypot(first.x-prevX,first.z-prevZ);
     maxDisplacement=Math.max(maxDisplacement,delta);
     expect(delta).toBeLessThanOrEqual(first.speed*.05+.0001);
     prevX=first.x;prevZ=first.z;
     if(previous==="inside"&&first.state==="depart"){
       const origin=sim.graph.nodes.get(sim.graph.entrances.get(first.origin)!)!;
       expect(first.x).toBeCloseTo(origin.x,4);
       expect(first.z).toBeCloseTo(origin.z,4);
       seenDeparture=true;
     }
     if(previous!=="inside"&&first.state==="inside"){
       const destination=sim.graph.nodes.get(sim.graph.entrances.get(first.origin)!)!;
       expect(first.x).toBeCloseTo(destination.x,4);
       expect(first.z).toBeCloseTo(destination.z,4);
       expect(first.lastArrival).toBe(first.origin);
       seenArrival=true;
     }
     previous=first.state;
   }
   expect(seenDeparture).toBe(true);
   expect(seenArrival).toBe(true);
   expect(first.journeysCompleted).toBeGreaterThanOrEqual(2);
   expect(sim.completed).toBeGreaterThan(100);
   expect(sim.routeFailures).toBe(0);
   expect(sim.stranded).toBe(0);
   expect(maxDisplacement).toBeGreaterThan(0);
 });
 it("plans only reachable destinations even with disconnected doorway components",()=>{
   const isolated=building("ISOLATED",400,400);
   const sim=new NorthHeightsPedestrianSimulator001([...close,isolated]);
   expect(sim.unreachableBuildings).toContain("ISOLATED");
   expect(sim.agents.every(a=>a.origin!=="ISOLATED")).toBe(true);
   for(let i=0;i<1500;i++)sim.step(.05);
   expect(sim.agents.every(a=>a.destination!=="ISOLATED")).toBe(true);
   expect(sim.stranded).toBe(0);
 });
 it("preserves coordinates and edge progress when rerouting mid-segment",()=>{
   const sim=new NorthHeightsPedestrianSimulator001(close);
   const a=sim.agents[0]!;
   for(let i=0;i<200;i++){sim.step(.05);if(a.progress>.02)break;}
   expect(a.state).not.toBe("inside");
   expect(a.progress).toBeGreaterThan(0);
   const before={x:a.x,z:a.z,progress:a.progress};
   expect(sim.reroute(a)).toBe(true);
   expect(a.x).toBe(before.x);expect(a.z).toBe(before.z);
   expect(a.progress).toBe(before.progress);
   expect(a.reroutes).toBe(1);
   const x=a.x,z=a.z;
   sim.step(.05);
   expect(Math.hypot(a.x-x,a.z-z)).toBeLessThanOrEqual(a.speed*.05+.0001);
 });
 it("park routes remain graph-constrained and can traverse park waypoints",()=>{
   const sim=new NorthHeightsPedestrianSimulator001(close);
   const park=sim.graph.parks[0]!;
   const nearPark=sim.graph.nodes.get(park)!;
   const origin=sim.graph.entrances.get("A")!;
   const route=pedestrianRoute001(sim.graph,origin,park);
   expect(route.length).toBeGreaterThan(1);
   expect(nearPark.kind).toBe("park");
   expect(route.every((id,i)=>i===0||sim.graph.links.get(route[i-1]!)?.some(e=>e.to===id))).toBe(true);
 });
});
