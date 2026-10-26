import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot,NH013_SEDAN_MODEL_ID} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot,NH013_HATCHBACK_ID} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot,NH014_TAXI_MODEL_ID,NH014_TAXI_COUNT}
 from "@/game/traffic/nh014-taxi-pilot";
import {NH014_TAXI_WHEELBASE,NH014_TAXI_HEADING_CORRECTION}
 from "@/game/vehicles/nh014-taxi-wheel-rig";
describe("NH-014 authentic taxi visual onboarding",()=>{
 it("only reassigns eight existing NH-012 agents, keeping 125 positions, lanes, speeds and routes",()=>{
   const a=new NH012TrafficSimulator(125,120125);
   const b=new NH012TrafficSimulator(125,120125);
   const before=a.agents.map(x=>[x.edgeId,x.s,x.speed,x.destination,x.x,x.z,x.heading]);
   for(const sim of [a,b]){
     assignNH013SedanPilot(sim,8);assignNH013HatchbackPilot(sim,12);
   }
   const beforeTaxi=a.agents.map(x=>[x.edgeId,x.s,x.speed,x.destination,x.x,x.z,x.heading]);
   expect(beforeTaxi).toEqual(before);
   const ids=assignNH014TaxiPilot(a);
   expect(ids.size).toBe(NH014_TAXI_COUNT);
   expect([...ids]).toEqual([...assignNH014TaxiPilot(b)]);
   expect(a.agents.map(x=>[x.edgeId,x.s,x.speed,x.destination,x.x,x.z,x.heading])).toEqual(before);
   expect(a.agents).toHaveLength(125);
   expect(new Set(a.agents.map(x=>x.id)).size).toBe(125);
   expect(a.agents.filter(x=>x.modelId===NH013_SEDAN_MODEL_ID)).toHaveLength(8);
   expect(a.agents.filter(x=>x.modelId===NH013_HATCHBACK_ID)).toHaveLength(12);
   expect(a.agents.filter(x=>x.modelId===NH014_TAXI_MODEL_ID)).toHaveLength(8);
   expect(a.agents.filter(x=>!x.id.startsWith("NH013:")&&!x.id.startsWith("NH014:"))).toHaveLength(97);
   expect(a.validate()).toEqual([]);
   for(let i=0;i<240;i++){a.step();b.step();}
   expect(a.agents.map(x=>[x.x,x.z,x.heading,x.state,x.speed]))
     .toEqual(b.agents.map(x=>[x.x,x.z,x.heading,x.state,x.speed]));
   expect(a.validate()).toEqual([]);
 });
 it("verifies the committed source taxi has four distinct real authored wheel hubs, with front at -Z",()=>{
   const file=readFileSync("public/GLBs/Cars/Taxi.glb");
   expect(file.toString("ascii",0,4)).toBe("glTF");
   expect(file.readUInt32LE(8)).toBe(file.length);
   const n=file.readUInt32LE(12),g=JSON.parse(file.toString("utf8",20,20+n));
   const wheels=["lgnWFL_1","lgnWFR_9","lgnWRL_8","lgnWRR_10"];
   const nodes=g.nodes.filter((v:{name:string})=>wheels.includes(v.name));
   expect(nodes).toHaveLength(4);
   expect(new Set(nodes.map((v:{translation:number[]})=>v.translation.join(","))).size).toBe(4);
   expect(nodes.every((v:{children:number[]})=>v.children.length===1&&g.nodes[v.children[0]!]?.mesh!==undefined)).toBe(true);
   expect(nodes.filter((v:{name:string;translation:number[]})=>/WFL|WFR/.test(v.name))
     .every((v:{translation:number[]})=>v.translation[2]!<0)).toBe(true);
   expect(g.materials.some((m:{name:string})=>m.name==="body")).toBe(true);
   expect(g.materials.some((m:{name:string})=>m.name==="taxiSign")).toBe(true);
   expect(NH014_TAXI_WHEELBASE).toBeGreaterThan(2.7);
   expect(NH014_TAXI_HEADING_CORRECTION).toBe(Math.PI);
 });
});
