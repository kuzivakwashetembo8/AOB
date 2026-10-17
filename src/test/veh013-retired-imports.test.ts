import {NullEngine,Scene} from "@babylonjs/core";
import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {MeridianPhysics} from "../game/physics/rapier-world";
import {createGeneratedFirstLightWorld} from "../game/world/generated-first-light-world";
import {createFirstLightRuntimeWorld} from "../game/world/first-light-runtime-source";
import {MERCER_EXTRA_GLB_SPECS} from "../game/vehicles/mercer-additional-parked-glbs-006";
import {initialStartupChecklist,applyStartupCheckpoint,startupCompletion}
  from "../game/core/loading-checklist";

describe("VEH-013 — remove Ferrari/Buggy without breaking native vehicles",()=>{
 it("game runtime cannot invoke the retired remote importer or construct a Ferrari actor",()=>{
   const runtime=readFileSync(new URL("../game/core/gtd-runtime.ts",import.meta.url),"utf8");
   expect(runtime).not.toContain("beginImportedCarEvaluation");
   expect(runtime).not.toContain("this.importedCarProbe");
   expect(runtime).not.toContain('slot.source==="sports"');
   expect(runtime).not.toContain("canInitializePlayerVehicle");
   expect(runtime).toContain("await firstLight.rangeRoverReviewReady");
   expect(runtime).toContain("prepareNativeFleetWheelRig");
   expect(runtime).toContain("splitOriginalMergedWheelGeometry");
 });
 it("keeps exactly four real local original models with no remote source",()=>{
   expect(MERCER_EXTRA_GLB_SPECS.map(x=>x.label)).toEqual([
     "Range Rover Sport 2018","Toyota Hilux 002",
     "Land Rover Defender 001","Dodge HP",
   ]);
   expect(MERCER_EXTRA_GLB_SPECS.every(x=>x.url.startsWith("/")&&
     x.visualOnly!==true)).toBe(true);
   expect(MERCER_EXTRA_GLB_SPECS.some(x=>/buggy|ferrari/i.test(x.id+x.url+x.label))).toBe(false);
 });
 it("retired checkpoints are skipped; native fleet readiness remains measured",()=>{
   let checklist=initialStartupChecklist();
   for(const id of ["renderer","physics","world","voight"] as const)
     checklist=applyStartupCheckpoint(checklist,{id,status:"done"});
   for(const id of ["vehicle-offroad","vehicle-sports"] as const)
     checklist=applyStartupCheckpoint(checklist,{id,status:"skipped"});
   checklist=applyStartupCheckpoint(checklist,{id:"vehicle-loader",status:"running"});
   expect(startupCompletion(checklist).settled).toBe(false);
   checklist=applyStartupCheckpoint(checklist,{id:"vehicle-loader",status:"done"});
   expect(startupCompletion(checklist)).toMatchObject({resolved:7,total:8,settled:false});
   checklist=applyStartupCheckpoint(checklist,{id:"first-frame",status:"done"});
   expect(startupCompletion(checklist)).toMatchObject({resolved:8,settled:true});
 });
 it("creates NO obsolete body, wheel, cabin, or invisible Rapier parked-car colliders",async()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const physics=await MeridianPhysics.create();
   const baseline=physics.world.colliders.len();
   try{
     const active=createFirstLightRuntimeWorld(scene,physics,
       "generated-first-light");
     const afterActive=physics.world.colliders.len();
     const activeGeometry=scene.meshes.filter(m=>
       /^generated-car-(?:body|wheel|cabin):/.test(m.name));
     expect(activeGeometry).toHaveLength(0);
     active.dispose();
     expect(physics.world.colliders.len()).toBe(baseline);

     // The archived world remains available for historical non-game unit
     // comparisons. It must not be the active game's construction policy.
     const legacy=createGeneratedFirstLightWorld(scene,physics,{
       enableShadows:false,
     });
     const legacyGeometry=scene.meshes.filter(m=>
       /^generated-car-(?:body|wheel|cabin):/.test(m.name));
     expect(legacyGeometry.length).toBeGreaterThan(0);
     expect(physics.world.colliders.len()).toBeGreaterThan(afterActive);
     legacy.dispose();
     expect(physics.world.colliders.len()).toBe(baseline);
   }finally{physics.destroy();scene.dispose();engine.dispose();}
 },20_000);
});
