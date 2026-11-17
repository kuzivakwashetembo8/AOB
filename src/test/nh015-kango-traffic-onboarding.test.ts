import {describe,it,expect} from "vitest";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot} from "@/game/traffic/nh014-taxi-pilot";
import {assignNH015KangoPilot,NH015_KANGO_COUNT,NH015_KANGO_ID} from "@/game/traffic/nh015-kango-pilot";
describe("NH015 logical delivery-van traffic identity",()=>{
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
});
