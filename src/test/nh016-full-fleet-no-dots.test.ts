import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot} from "@/game/traffic/nh014-taxi-pilot";
import {assignNH015KangoPilot} from "@/game/traffic/nh015-kango-pilot";
import {
 NH016_FLEET_IDS,NH016_CLASS,NH016_PAINT,selectDefaultFleetAgents016,
 verifyCompleteFleet016,fleetPaint016,
} from "@/game/traffic/nh016-fleet-manifest";
import {trafficProxySpec016} from "@/game/experiments/north-heights-traffic-3d-016";
const init=()=>{
 const s=new NH012TrafficSimulator(125,120125);
 assignNH013SedanPilot(s,8);assignNH013HatchbackPilot(s,12);
 assignNH014TaxiPilot(s,8);assignNH015KangoPilot(s,6);
 return s;
};
describe("NH016 five BMW-free original source classes join traffic without dots",()=>{
 it("covers 125 original deterministic agents, 91 default and 34 accepted types",()=>{
   const sim=init(),snapshot=sim.snapshot();
   const all=verifyCompleteFleet016(snapshot);
   expect(all.total).toBe(125);
   expect(all.original).toBe(91);
   expect(selectDefaultFleetAgents016(snapshot)).toHaveLength(91);
   expect(new Set(Object.values(NH016_CLASS)).size).toBe(5);
   expect(NH016_FLEET_IDS).toHaveLength(5);
   expect(snapshot.agents.some(a=>a.modelId.includes("bmw"))).toBe(false);
   for(const id of NH016_FLEET_IDS)expect(all.models[id]).toBeGreaterThan(0);
   expect(new Set(snapshot.agents.map(a=>a.id)).size).toBe(125);
   expect(sim.validate()).toEqual([]);
   for(const agent of snapshot.agents){
     const spec=trafficProxySpec016(agent.modelId);
     expect(spec.width).toBeGreaterThan(1.5);
     expect(spec.length).toBeGreaterThan(4.2);
     expect(spec.height).toBeGreaterThan(1.2);
   }
 });
 it("does not change movement, junction logic, population or traffic seed",()=>{
   const a=init(),b=init();
   expect(a.agents).toEqual(b.agents);
   for(let i=0;i<360;i++){a.step();b.step();}
   expect(a.agents).toEqual(b.agents);
   expect(a.validate()).toEqual([]);
   expect(verifyCompleteFleet016(a.snapshot()).original).toBe(91);
 });
 it("preserves the 5 source paint families and replaces source traffic GLB upgrades on experimental branch",()=>{
   expect(Object.keys(NH016_PAINT).length).toBeGreaterThanOrEqual(12);
   for(const agent of selectDefaultFleetAgents016(init().snapshot())){
     expect(fleetPaint016(agent.paintId)).toMatch(/^#[a-fA-F0-9]{6}$/);
   }
   const city=readFileSync("src/game/experiments/north-heights-city-8.ts","utf8");
   expect(city).toContain("createNorthHeightsTraffic3D016(scene,traffic.graph)");
   expect(city).not.toContain("createNorthHeightsAuthenticFleet016(scene,traffic.graph,mobile)");
   expect(city).toContain("GEN-VEH-001");
   expect(city).toContain("DOTS 0 SIM");
   expect(city).not.toContain("createNorthHeightsTrafficDots012");
   expect(city).not.toContain("trafficDots.update");
   const detail=readFileSync("src/game/experiments/north-heights-authentic-fleet-016.ts","utf8");
   expect(detail).toContain("prepareNativeFleetWheelRig");
   expect(detail).toContain("prepareRangeRoverWheelRig");
   expect(detail).toContain("StreetVehicleWheelRig");
 });
});
