import {describe,it,expect} from "vitest";
import {buildNorthHeightsTrafficGraph012,nh012PointOnConnector,
 nh012PointOnEdge,NH012_SIMULATION_DT} from "@/game/traffic/nh012-lane-network";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {MERCER_EXTRA_GLB_SPECS} from "@/game/vehicles/mercer-additional-parked-glbs-006";

describe("NH-012 actual lightweight North Heights traffic",()=>{
 const graph=buildNorthHeightsTrafficGraph012();
 it("uses exactly 121 road junctions, 220 physical spans and 440 directional lanes",()=>{
   expect(graph.nodes.size).toBe(121);
   expect(graph.edges.size).toBe(440);
   expect(graph.connectors.size).toBeGreaterThan(800);
   for(const edge of graph.edges.values()){
     expect(edge.length).toBe(44);
     const start=graph.nodes.get(edge.from)!,end=graph.nodes.get(edge.to)!;
     expect(Math.hypot(start.x-end.x,start.z-end.z)).toBe(64);
     expect(graph.outgoing.get(edge.from)).toContain(edge.id);
     expect(graph.incoming.get(edge.to)).toContain(edge.id);
     for(const connector of graph.turns.get(edge.id)??[]){
       const next=graph.edges.get(connector.outgoing)!;
       expect(next.from).toBe(edge.to);
       expect(next.to).not.toBe(edge.from);
       expect(nh012PointOnConnector(connector,0)).toEqual(nh012PointOnEdge(edge,edge.length));
       const tail=nh012PointOnConnector(connector,connector.length);
       const head=nh012PointOnEdge(next,0);
       expect(Math.hypot(tail.x-head.x,tail.z-head.z)).toBeLessThan(.00001);
     }
   }
 });
 it("creates 125 unique independently simulated model-and-paint identities",()=>{
   const sim=new NH012TrafficSimulator(125,120125,graph);
   expect(sim.agents).toHaveLength(125);
   expect(new Set(sim.agents.map(a=>a.id)).size).toBe(125);
   expect(new Set(sim.agents.map(a=>a.edgeId)).size).toBe(125);
   expect(new Set(sim.agents.map(a=>a.modelId)).size).toBe(5);
   expect(new Set(sim.agents.map(a=>a.paintId)).size).toBe(12);
   expect([...new Set(sim.agents.map(a=>a.modelId))].sort()).toEqual(
     MERCER_EXTRA_GLB_SPECS.filter(s=>!s.id.includes("bmw")).map(s=>s.id).sort());
   const variants=new Map<string,number>();
   for(const a of sim.agents){
     const key=a.modelId+"|"+a.paintId;variants.set(key,(variants.get(key)??0)+1);
   }
   expect(variants.size).toBe(25);
   expect([...variants.values()].filter(n=>n===5)).toHaveLength(25);
   expect([...variants.values()].filter(n=>n===4)).toHaveLength(0);
   expect(sim.validate()).toEqual([]);
 });
 it("is deterministic across multiple lane transitions without resetting identity",()=>{
   const a=new NH012TrafficSimulator(125,120125,graph);
   const b=new NH012TrafficSimulator(125,120125,graph);
   for(let i=0;i<1100;i++){
     a.step();b.step();
     if(i%30===0){
       expect(a.validate()).toEqual([]);
       expect(b.validate()).toEqual([]);
     }
   }
   const representative=(sim:NH012TrafficSimulator)=>sim.agents.map(x=>
     [x.id,x.edgeId,x.connectorId,x.s,x.speed,x.x,x.z,x.heading,x.state,x.destination]);
   expect(representative(a)).toEqual(representative(b));
   expect(a.tick).toBe(1100);
   expect(a.agents.some(x=>x.state==="turning")).toBe(true);
   expect(a.agents.some(x=>x.state==="moving")).toBe(true);
 });
 it("permits controlled sparse population for 25/75/125 comparison",()=>{
   for(const count of [25,75,125]){
     const sim=new NH012TrafficSimulator(count,120125,graph);
     for(let i=0;i<120;i++)sim.step();
     expect(sim.snapshot().count).toBe(count);
     expect(sim.validate()).toEqual([]);
   }
   expect(NH012_SIMULATION_DT).toBe(.05);
 });
});
