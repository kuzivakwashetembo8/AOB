import {describe,it,expect} from "vitest";
import {buildPedestrianGraph001,pedestrianRoute001} from "@/game/experiments/north-heights-pedestrian-graph-001";
import {NorthHeightsPedestrianSimulator001,PED001_POPULATION} from "@/game/experiments/north-heights-pedestrian-simulator-001";
import type {BuildingSpec} from "@/game/world-generation/schema";
const building=(id:string,x:number,z:number):BuildingSpec=>({
 id,seed:id,archetype:"residential",yawRadians:0,position:{x,y:0,z},
 overrides:{width:24,depth:30,floors:3,floorHeight:3.1},
});
const buildings=[
 building("a",-288,-288),building("b",-224,-288),
 building("c",-288,-224),building("d",-224,-224),
 building("e",-160,-160),building("f",96,96),
];
describe("PED-001 navigation and dot-only population",()=>{
 it("maps actual building +Z doorways to sidewalk nodes",()=>{
   const graph=buildPedestrianGraph001(buildings);
   expect(graph.entrances.size).toBe(buildings.length);
   for(const b of buildings){
     const id=graph.entrances.get(b.id)!;
     expect(graph.nodes.get(id)!.z).toBeCloseTo(b.position.z+15);
     expect(graph.links.get(id)?.[0]?.kind).toBe("entrance");
   }
   expect(graph.crossings).toBeGreaterThan(90);
   expect(graph.parks.length).toBeGreaterThan(0);
 });
 it("routes between building entrances through designated graph edges",()=>{
   const graph=buildPedestrianGraph001(buildings);
   const route=pedestrianRoute001(graph,graph.entrances.get("a")!,graph.entrances.get("f")!);
   expect(route.length).toBeGreaterThan(3);
   for(let i=1;i<route.length;i++)
     expect(graph.links.get(route[i-1]!)?.some(e=>e.to===route[i])).toBe(true);
 });
 it("simulates exactly 60 distinct identities without importing GLBs",()=>{
   const sim=new NorthHeightsPedestrianSimulator001(buildings);
   expect(sim.population).toBe(PED001_POPULATION);
   expect(new Set(sim.agents.map(a=>a.id)).size).toBe(60);
   for(let i=0;i<1000;i++)sim.step(.05);
   expect(sim.agents.some(a=>a.state!=="inside")).toBe(true);
   expect(sim.agents.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.z))).toBe(true);
 });
});
