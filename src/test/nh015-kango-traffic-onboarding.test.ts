import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot} from "@/game/traffic/nh014-taxi-pilot";
import {assignNH015KangoPilot,NH015_KANGO_COUNT,NH015_KANGO_ID} from "@/game/traffic/nh015-kango-pilot";
import {NH015_KANGO_SOURCE_UP_CORRECTION,NH015_KANGO_HEADING_CORRECTION}
 from "@/game/vehicles/nh015-kango-wheel-rig";
describe("NH015 source-authentic Renault Kangoo traffic",()=>{
 it("places six models only on existing NH012 identities, preserving traffic routes/safety",()=>{
   const a=new NH012TrafficSimulator(125,120125),b=new NH012TrafficSimulator(125,120125);
   const before=a.agents.map(x=>[x.x,x.z,x.heading,x.speed,x.s,x.edgeId,x.destination]);
   for(const sim of [a,b]){assignNH013SedanPilot(sim,8);assignNH013HatchbackPilot(sim,12);assignNH014TaxiPilot(sim,8);}
   const ids=assignNH015KangoPilot(a);
   expect(ids.size).toBe(NH015_KANGO_COUNT);
   expect([...ids]).toEqual([...assignNH015KangoPilot(b)]);
   expect(a.agents).toHaveLength(125);
   expect(a.agents.filter(x=>x.modelId===NH015_KANGO_ID)).toHaveLength(6);
   expect(a.agents.map(x=>[x.x,x.z,x.heading,x.speed,x.s,x.edgeId,x.destination])).toEqual(before);
   expect(new Set(a.agents.map(x=>x.id)).size).toBe(125);
   expect(a.validate()).toEqual([]);
   for(let i=0;i<240;i++){a.step();b.step();}
   expect(a.agents.map(x=>[x.x,x.z,x.heading,x.speed,x.state]))
     .toEqual(b.agents.map(x=>[x.x,x.z,x.heading,x.speed,x.state]));
   expect(a.validate()).toEqual([]);
 });
 it("verifies four original rubber+rim sources and all four derived wheel pivots",()=>{
   const source=readFileSync("public/GLBs/Cars/Renault Kango Optimized.glb");
   expect(source.toString("ascii",0,4)).toBe("glTF");
   const n=source.readUInt32LE(12),original=JSON.parse(source.toString("utf8",20,20+n));
   expect(original.nodes).toHaveLength(13);
   expect(original.materials.some((x:{name:string})=>x.name==="_0-tire")).toBe(true);
   const derived=readFileSync("public/GLBs/Cars/TrafficOptimized/Renault-Kango-Source-Rigged.glb");
   expect(derived.readUInt32LE(8)).toBe(derived.length);
   const z=derived.readUInt32LE(12),asset=JSON.parse(derived.toString("utf8",20,20+z));
   const names=new Set(asset.nodes.map((x:{name:string})=>x.name));
   for(const corner of ["frontLeft","frontRight","rearLeft","rearRight"]){
     expect(names.has("NH015_KANGO_"+corner+"_PIVOT")).toBe(true);
     const mesh=asset.meshes.filter((x:{name?:string})=>x.name?.startsWith("NH015_KANGO_"+corner+"_"));
     expect(mesh.length).toBeGreaterThanOrEqual(2);
   }
   for(const sourceNode of [5,6]){
     expect(asset.nodes[sourceNode].mesh).toBe(original.nodes[sourceNode].mesh);
   }
   expect(NH015_KANGO_SOURCE_UP_CORRECTION).toBe(-Math.PI/2);
   expect(NH015_KANGO_HEADING_CORRECTION).toBe(0);
 });
});
