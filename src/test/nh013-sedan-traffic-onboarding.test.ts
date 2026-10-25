import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot,NH013_SEDAN_MODEL_ID,NH013_SEDAN_PAINTS}
 from "@/game/traffic/nh013-sedan-pilot";

describe("NH-013 pilot: real sedan visuals attached to existing traffic intelligence",()=>{
 it("preserves all 125 independently routed NH-012 traffic agents",()=>{
   const sim=new NH012TrafficSimulator(125,120125);
   const before=sim.agents.map(x=>({edge:x.edgeId,s:x.s,speed:x.speed,dest:x.destination}));
   const ids=assignNH013SedanPilot(sim,8);
   expect(ids.size).toBe(8);
   expect(sim.agents).toHaveLength(125);
   expect(new Set(sim.agents.map(x=>x.id)).size).toBe(125);
   expect(sim.agents.filter(x=>x.modelId===NH013_SEDAN_MODEL_ID)).toHaveLength(8);
   expect(sim.agents.map(x=>({edge:x.edgeId,s:x.s,speed:x.speed,dest:x.destination})))
     .toEqual(before);
   expect(sim.validate()).toEqual([]);
 });
 it("assigns five realistic colours and gives the same sedan IDs across reloads",()=>{
   const a=new NH012TrafficSimulator(125,120125);
   const b=new NH012TrafficSimulator(125,120125);
   expect([...assignNH013SedanPilot(a,8)]).toEqual([...assignNH013SedanPilot(b,8)]);
   const colours=new Set(a.agents.filter(x=>x.modelId===NH013_SEDAN_MODEL_ID).map(x=>x.paintId));
   expect(colours).toEqual(new Set(NH013_SEDAN_PAINTS));
   for(let tick=0;tick<400;tick++){a.step();b.step();}
   expect(a.agents.map(x=>[x.id,x.x,x.z,x.heading,x.state]))
     .toEqual(b.agents.map(x=>[x.id,x.x,x.z,x.heading,x.state]));
   expect(a.validate()).toEqual([]);
 });
 it("verifies the original user's sedan GLB carries a separable paint material",()=>{
   const buf=readFileSync("public/GLBs/Cars/Four Door Sedan.glb");
   expect(buf.toString("ascii",0,4)).toBe("glTF");
   expect(buf.readUInt32LE(8)).toBe(buf.length);
   const size=buf.readUInt32LE(12);
   const gltf=JSON.parse(buf.toString("utf8",20,20+size));
   expect((gltf.materials??[]).some((m:{name:string})=>m.name==="paint")).toBe(true);
   const index=gltf.materials.findIndex((m:{name:string})=>m.name==="paint");
   const used=gltf.meshes.flatMap((m:{primitives:Array<{material:number}>})=>m.primitives)
     .filter((p:{material:number})=>p.material===index).length;
   expect(used).toBeGreaterThan(0);
   expect(gltf.nodes.length).toBeGreaterThan(1);
 });
});
