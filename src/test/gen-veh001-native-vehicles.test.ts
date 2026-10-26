import {describe,expect,it} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {readFileSync} from "node:fs";
import {
 createGTDGeneratedVehicleMesh001,gtdGeneratedFamily001,
 GTD_GENERATED_STARTERS_001,GENERATED_CAR_FAMILIES_001,
 generatedWheelRadius001,
} from "@/game/vehicles/native-vehicle-geometry-001";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot} from "@/game/traffic/nh014-taxi-pilot";
import {assignNH015KangoPilot} from "@/game/traffic/nh015-kango-pilot";

describe("GEN-VEH-001 native moving traffic / four founding silhouettes",()=>{
 it("implements all four owner-reference vehicle forms and ten category slots",()=>{
   expect(GTD_GENERATED_STARTERS_001).toHaveLength(4);
   expect(new Set(GTD_GENERATED_STARTERS_001.map(v=>gtdGeneratedFamily001(v.style))).size).toBe(4);
   expect(GENERATED_CAR_FAMILIES_001).toHaveLength(10);
 });
 it("builds real body and glass geometry without a loader, image plane or fetched textures",()=>{
   const engine=new NullEngine();const scene=new Scene(engine);
   try{
     for(const v of GTD_GENERATED_STARTERS_001){
       const size={width:1.9,length:4.65,height:1.75,style:v.style};
       const body=createGTDGeneratedVehicleMesh001(scene,v.id,size,"body");
       const glass=createGTDGeneratedVehicleMesh001(scene,v.id+":glass",size,"glass");
       expect(body.getTotalVertices()).toBeGreaterThan(20);
       expect(glass.getTotalVertices()).toBeGreaterThan(10);
       expect(body.getTotalIndices()).toBeGreaterThan(40);
       expect(generatedWheelRadius001(size)).toBeGreaterThan(.30);
     }
   } finally{scene.dispose();engine.dispose();}
 });
 it("keeps traffic simulation identical, 125 agents and no source traffic imports",()=>{
   const s=new NH012TrafficSimulator(125,120125);
   assignNH013SedanPilot(s,8);assignNH013HatchbackPilot(s,12);
   assignNH014TaxiPilot(s,8);assignNH015KangoPilot(s,6);
   expect(s.snapshot().count).toBe(125);
   expect(s.validate()).toEqual([]);
   const city=readFileSync("src/game/experiments/north-heights-city-8.ts","utf8");
   const mesh=readFileSync("src/game/experiments/north-heights-traffic-3d-016.ts","utf8");
   expect(city).not.toContain("createNorthHeightsAuthenticFleet016(");
   expect(city).not.toContain("createNorthHeightsSedanVisuals013(");
   expect(city).not.toContain("createNorthHeightsTaxiVisuals014(");
   expect(city).not.toContain("createNorthHeightsHatchbackVisuals013(");
   expect(city).not.toContain("createNorthHeightsKangoVisuals015(");
   expect(city).toContain("createMercerExtraParkedGLBs("); // A/B parked GLB control retained
   expect(mesh).toContain("createGTDGeneratedVehicleMesh001");
   expect(mesh).toContain("if(snapshot.tick===updatedTick)return lastReport");
   expect(mesh).not.toContain("loadAssetContainerAsync");
 });
});