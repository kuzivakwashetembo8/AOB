import {describe,expect,it} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {planParcelInfill} from "../game/world-generation/parcel-infill";
import {createGeneratedUrbanSurfaces} from "../game/world-generation/urban-surface-renderer";
describe("WORLD-003 generated inter-building land use",()=>{
 it("derives deterministic variation from the actual city plan",()=>{
  const a=planParcelInfill(FIRST_LIGHT_CITY_SPEC);
  const b=planParcelInfill(FIRST_LIGHT_CITY_SPEC);
  expect(a).toEqual(b);
  expect(new Set(a.map(c=>c.finish))).toEqual(new Set(["pavement","parking","grass"]));
  expect(a.length).toBeGreaterThan(250);
 });
 it("changes when the city generator changes, without authored parking XZ",()=>{
  const original=planParcelInfill(FIRST_LIGHT_CITY_SPEC);
  const modified=planParcelInfill({...FIRST_LIGHT_CITY_SPEC,generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion+1});
  expect(modified.map(x=>x.finish)).not.toEqual(original.map(x=>x.finish));
 });
 it("instantiates only three shared infill materials, with no physical colliders",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  try{
    const urban=createGeneratedUrbanSurfaces(scene,FIRST_LIGHT_CITY_SPEC);
    expect(urban.meshes.filter(m=>m.name.startsWith("generated-infill:"))).toHaveLength(4);
    expect(urban.meshes.filter(m=>m.name.startsWith("generated-parking:"))).toHaveLength(0);
    expect(urban.meshes.filter(m=>m.name.startsWith("generated-development:"))).toHaveLength(0);
    expect(urban.meshes.filter(m=>m.name.startsWith("generated-infill:"))
      .every(m=>m.thinInstanceCount>0)).toBe(true);
    expect(urban.meshes.some(m=>m.name==="generated-infill:parking-stalls")).toBe(true);
    expect(urban.meshes.filter(m=>m.name.startsWith("generated-infill:"))
      .every(m=>!m.isPickable)).toBe(true);
    urban.dispose();
  } finally {scene.dispose();engine.dispose()}
 });
});
