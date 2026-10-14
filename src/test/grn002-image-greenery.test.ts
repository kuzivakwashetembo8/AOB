import {describe,expect,it} from "vitest";
import {NullEngine,Scene,StandardMaterial} from "@babylonjs/core";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {createGeneratedStreetContext} from "../game/world-generation/street-context-renderer";
import {createGeneratedFirstLightWorld} from "../game/world/generated-first-light-world";
import {MeridianPhysics} from "../game/physics/rapier-world";
import {planGroundLandUse,LAND_FINISHES} from "../game/world-generation/ground-land-use";
import {
 FOLIAGE_IMAGE_URL,CARPET_GRASS_IMAGE_URL,FOLIAGE_TEST_TREE_ID,
 grassMetricRepeat,
} from "../game/world-generation/greenery-image-assets";

describe("GRN-002: repeatable image-based greenery experiments",()=>{
 it("uses exact committed asset paths and a metre-based, finite tiling scale",()=>{
   expect(FOLIAGE_IMAGE_URL).toBe("/assets/vegetation/foliage-cluster-01.webp");
   expect(CARPET_GRASS_IMAGE_URL).toBe("/assets/ground/carpet-grass-01.webp");
   expect(grassMetricRepeat()).toEqual({u:32,v:26});
   expect(()=>grassMetricRepeat(0)).toThrow();
   expect(()=>grassMetricRepeat(Infinity)).toThrow();
   expect(()=>grassMetricRepeat(5,-1,130)).toThrow();
 });
 it("keeps one-photo-tree material isolated from all shrubs and other trees",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const c=createGeneratedStreetContext(scene,FIRST_LIGHT_CITY_SPEC,
       {skipPocketParkGround:true,foliageImageTrial:"one"});
     const target=c.meshes.filter(m=>m.name.startsWith("generated-tree-foliage:"+FOLIAGE_TEST_TREE_ID+":"));
     const other=c.meshes.filter(m=>m.name.startsWith("generated-tree-foliage:sw-fl-tree-garage-east:"));
     const shrubs=c.meshes.filter(m=>m.name.startsWith("generated-shrub-card:"));
     expect(target).toHaveLength(30);
     expect(other).toHaveLength(30);
     expect(shrubs.length).toBeGreaterThan(0);
     expect(target.every(m=>m.material?.name==="grn002-photo-foliage-material")).toBe(true);
     expect(other.every(m=>m.material?.name==="generated-tree-foliage-material")).toBe(true);
     expect(shrubs.every(m=>m.material?.name==="generated-tree-foliage-material")).toBe(true);
     c.dispose();
   }finally{scene.dispose();engine.dispose();}
 });
 it("does not change geometry/card count even when every tree is opted in",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const c=createGeneratedStreetContext(scene,FIRST_LIGHT_CITY_SPEC,
       {skipPocketParkGround:true,foliageImageTrial:"all"});
     const cards=c.meshes.filter(m=>m.name.startsWith("generated-tree-foliage:"));
     const proceduralShrubs=c.meshes.filter(m=>m.name.startsWith("generated-shrub-card:"));
     expect(cards.length).toBeGreaterThanOrEqual(90);
     expect(cards.length%30).toBe(0);
     expect(cards.every(m=>m.material?.name==="grn002-photo-foliage-material")).toBe(true);
     expect(proceduralShrubs.every(m=>m.material?.name==="generated-tree-foliage-material")).toBe(true);
     c.dispose();
   }finally{scene.dispose();engine.dispose();}
 });
 it("keeps original shared materials when image flags are off",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const c=createGeneratedStreetContext(scene,FIRST_LIGHT_CITY_SPEC,
       {skipPocketParkGround:true});
     expect(c.meshes.filter(m=>m.name.startsWith("generated-tree-foliage:"))
       .every(m=>m.material?.name==="generated-tree-foliage-material")).toBe(true);
     expect(scene.materials.filter(m=>m.name==="grn002-photo-foliage-material")).toHaveLength(0);
     c.dispose();
   }finally{scene.dispose();engine.dispose();}
 });
 it("keeps GROUND-004 GRN-01 physics and material fallback unchanged during image trials",async()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const physics=await MeridianPhysics.create();
   try{
     const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,{left:-80,right:80,north:-45,south:85});
     expect(LAND_FINISHES).toEqual(["GRN-01"]);
     expect(p.kinds).toHaveLength(20800);
     const orig=physics.world.bodies.len();
     const world=createGeneratedFirstLightWorld(scene,physics,{
       enableLandUsePreview:true,enableGrassImageTrial:true,
       foliageImageTrial:"all",enableShadows:false,
     });
     const ground=scene.getMeshByName("generated-first-light-ground");
     expect((ground?.material as StandardMaterial).diffuseTexture?.name)
       .toBe("ground004-grass-only"); // NullEngine never downloads assets.
     expect(ground?.getTotalVertices()).toBe(4);
     expect(world.buildings).toHaveLength(10);
     expect(physics.world.bodies.len()).toBeGreaterThan(orig);
     world.dispose();
     expect(physics.world.bodies.len()).toBe(orig);
   }finally{physics.destroy();scene.dispose();engine.dispose();}
 });
});
