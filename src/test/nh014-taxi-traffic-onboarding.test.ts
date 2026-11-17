import {describe,it,expect} from "vitest";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot,NH013_SEDAN_MODEL_ID} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot,NH013_HATCHBACK_ID} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot,NH014_TAXI_MODEL_ID,NH014_TAXI_COUNT}
 from "@/game/traffic/nh014-taxi-pilot";
describe("NH-014 logical taxi traffic identity",()=>{
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
});
