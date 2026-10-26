import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NullEngine,Scene,Mesh} from "@babylonjs/core";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot} from "@/game/traffic/nh014-taxi-pilot";
import {assignNH015KangoPilot} from "@/game/traffic/nh015-kango-pilot";
import {
 sedanPaint009,sedanFleetAudit009,NH009_SEDAN_COUNT,NH009_SEDAN_PAINTS
} from "@/game/traffic/nh009-sedan-only-policy";
import {
 createNorthHeightsSedanTraffic009
} from "@/game/experiments/north-heights-sedan-traffic-009";
import {sourceRecord007} from "@/game/vehicles/native-seven-vehicle-007";
function simulator(){
 const s=new NH012TrafficSimulator(125,120125);
 assignNH013SedanPilot(s,8);assignNH013HatchbackPilot(s,12);
 assignNH014TaxiPilot(s,8);assignNH015KangoPilot(s,6);
 return s;
}
describe("GEN-VEH-009 owner-approved sedan-only traffic",()=>{
 it("assigns all 125 unchanged NH012 agents the approved sedan with diverse stable colors",()=>{
   const sim=simulator(),snapshot=sim.snapshot(),audit=sedanFleetAudit009(snapshot);
   expect(audit).toMatchObject({vehicles:125,model:"sedan",missing:0});
   expect(new Set(snapshot.agents.map(a=>a.id)).size).toBe(125);
   expect(audit.colors).toBeGreaterThanOrEqual(8);
   expect(NH009_SEDAN_COUNT).toBe(125);
   expect(NH009_SEDAN_PAINTS.length).toBe(12);
   for(const a of snapshot.agents){
     expect(sedanPaint009(a.id)).toMatch(/^#[0-9A-Fa-f]{6}$/);
     expect(sedanPaint009(a.id)).toBe(sedanPaint009(a.id));
   }
   const first=snapshot.agents.map(a=>[a.id,sedanPaint009(a.id)]);
   for(let i=0;i<100;i++)sim.step();
   expect(sim.snapshot().agents.map(a=>[a.id,sedanPaint009(a.id)])).toEqual(first);
   expect(sim.validate()).toEqual([]);
 });
 it("renders only the original source sedan surfaces and four genuine tyre/rim pairs",()=>{
   const record=sourceRecord007("sedan");
   expect(record?.status).toBe("source");
   expect(record?.wheelsStatus).toBe("source");
   expect(record?.body?.['paint']?.triangles).toBeGreaterThan(1000);
   expect(record?.body?.['glass']?.triangles).toBeGreaterThan(1000);
   expect(Object.keys(record?.wheels??{})).toHaveLength(4);
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const sim=simulator(),render=createNorthHeightsSedanTraffic009(scene,sim.graph);
     try{
       const report=render.update(sim.snapshot(),new Set());
       expect(report).toMatchObject({vehicles3D:125,sourceGLBs:0,lowDetail:125,dots:0});
       expect([...scene.meshes].filter(m=>m.name.startsWith("nh009:body:paint:"))).toHaveLength(12);
       const grouped=scene.meshes.filter(m=>m.name.startsWith("nh009:"));
       expect(grouped.some(m=>m.name.includes("wheel:frontLeft:tire"))).toBe(true);
       expect(grouped.some(m=>m.name.includes("wheel:rearRight:rim"))).toBe(true);
       expect(grouped.reduce((n,m)=>n+(m instanceof Mesh?m.thinInstanceCount:0),0)).toBeGreaterThan(1250);
       expect(grouped.some(m=>/rover|dodge|hatchback|kangoo|hilux|defender|taxi|lamborghini/.test(m.name))).toBe(false);
       sim.step();
       expect(render.update(sim.snapshot(),new Set()).dots).toBe(0);
     }finally{render.dispose();}
   }finally{scene.dispose();engine.dispose();}
 });
 it("connects the preview to sedan-only renderer, not the rejected multi-family renderer",()=>{
   const city=readFileSync("src/game/experiments/north-heights-city-8.ts","utf8");
   expect(city).toContain("createNorthHeightsSedanTraffic009(scene,traffic.graph)");
   expect(city).not.toContain("createNorthHeightsTraffic3D016(scene,traffic.graph)");
   expect(city).toContain("new NH012TrafficSimulator(125,120125)");
   expect(city).not.toContain("createNorthHeightsAuthenticFleet016(");
 });
});
