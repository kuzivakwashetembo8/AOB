import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {buildNorthHeightsTrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot,NH013_HATCHBACK_ID,NH013_HATCHBACK_PAINTS} from "@/game/traffic/nh013-hatchback-pilot";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {trafficTurnSteering013,smoothTrafficToe013} from "@/game/vehicles/nh013-traffic-turn-steering";
import {northHeightsGround} from "@/game/experiments/north-heights-reconstruction-001";
describe("NH-013 G2 road-grade and two-model traffic visual admission",()=>{
 it("uses four road wheel samples to pitch an ascending car without penetrating the uphill axle",()=>{
   const flat=sampleTrafficVehicleRoadPose013({x:0,z:0,heading:0,wheelbase:2.8,track:1.62,ground:()=>12});
   expect(flat.y).toBeCloseTo(12.093,5);
   expect(flat.frontRise).toBeCloseTo(0,6);
   const hill=sampleTrafficVehicleRoadPose013({x:0,z:200,heading:0,wheelbase:2.8,track:1.62,ground:northHeightsGround});
   expect(hill.frontRise).toBeGreaterThan(.1);
   expect(hill.maxError).toBeGreaterThanOrEqual(-.000001);
   expect(hill.y).toBeGreaterThan(northHeightsGround(0,200));
   expect(Math.abs(hill.rotation.x)+Math.abs(hill.rotation.z)).toBeGreaterThan(.005);
   const alongX=sampleTrafficVehicleRoadPose013({x:0,z:200,heading:Math.PI/2,wheelbase:2.8,track:1.62,ground:northHeightsGround});
   expect(Number.isFinite(alongX.y)).toBe(true);
   expect(Number.isFinite(alongX.rotation.w)).toBe(true);
 });
 it("preserves connector toe across individual render frames instead of letting it fade to straight",()=>{
   const graph=buildNorthHeightsTrafficGraph012();
   const turn=[...graph.connectors.values()].find(c=>{
     const a=graph.edges.get(c.incoming)!,b=graph.edges.get(c.outgoing)!;
     return a.dx!==b.dx||a.dz!==b.dz;
   })!;
   const edge=graph.edges.get(turn.incoming)!;
   const p=turn.p0,q=turn.p1;
   const startHeading=Math.atan2(q.x-p.x,q.z-p.z);
   const target=trafficTurnSteering013({connectorId:turn.id,s:1.5,heading:startHeading,speed:3.0},graph,2.8);
   expect(Math.abs(target)).toBeGreaterThan(.02);
   const smoothed=smoothTrafficToe013(0,target,true);
   expect(Math.abs(smoothed)).toBeGreaterThan(.01);
   expect(smoothTrafficToe013(smoothed,0,false)).toBe(smoothed);
   expect(trafficTurnSteering013({connectorId:null,s:3,heading:0,speed:3},graph,2.8)).toBe(0);
   expect(edge.to).toBe(turn.junction);
 });
 it("adds twelve five-paint hatchbacks to eight sedans without adding traffic agents",()=>{
   const sim=new NH012TrafficSimulator(125,120125);
   const original=sim.agents.map(a=>[a.x,a.z,a.edgeId,a.s,a.speed,a.heading,a.destination]);
   expect(assignNH013SedanPilot(sim,8).size).toBe(8);
   expect(assignNH013HatchbackPilot(sim,12).size).toBe(12);
   expect(sim.agents.length).toBe(125);
   expect(new Set(sim.agents.map(x=>x.id)).size).toBe(125);
   expect(sim.agents.filter(x=>x.modelId===NH013_HATCHBACK_ID)).toHaveLength(12);
   expect(new Set(sim.agents.filter(x=>x.modelId===NH013_HATCHBACK_ID).map(x=>x.paintId)))
     .toEqual(new Set(NH013_HATCHBACK_PAINTS));
   expect(sim.agents.map(a=>[a.x,a.z,a.edgeId,a.s,a.speed,a.heading,a.destination])).toEqual(original);
   expect(sim.validate()).toEqual([]);
   for(let i=0;i<240;i++)sim.step();
   expect(sim.validate()).toEqual([]);
 });
 it("derived hatchback model really contains four distinct authentic tyre pivots",()=>{
   const p="public/GLBs/Cars/TrafficOptimized/Fourd-Confusion-Hatchback-Rigged.glb";
   expect(existsSync(p)).toBe(true);
   const bin=readFileSync(p);
   expect(bin.toString("ascii",0,4)).toBe("glTF");
   expect(bin.readUInt32LE(8)).toBe(bin.length);
   const n=bin.readUInt32LE(12),g=JSON.parse(bin.toString("utf8",20,20+n));
   const names=new Set<string>(g.nodes.map((n:{name:string})=>n.name));
   for(const c of ["frontLeft","frontRight","rearLeft","rearRight"])
     expect(names.has("NH013_HATCH_TIRE_"+c+"_PIVOT")).toBe(true);
   expect(g.nodes[65].mesh).toBeUndefined();
   expect(g.nodes[66].mesh).toBeUndefined();
   expect(g.materials.some((m:{name:string})=>m.name==="M_Body_ColorMain")).toBe(true);
 });
});
