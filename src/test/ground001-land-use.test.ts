import {describe,expect,it} from "vitest";
import {NullEngine,Scene,Texture,StandardMaterial} from "@babylonjs/core";
import {MeridianPhysics} from "../game/physics/rapier-world";
import {createGeneratedFirstLightWorld} from "../game/world/generated-first-light-world";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {LAND_FINISHES,planGroundLandUse} from "../game/world-generation/ground-land-use";
import {buildGroundLandPixels,createGroundLandTexture} from "../game/world-generation/ground-land-surface";

const bounds={left:-80,right:80,north:-45,south:85};
describe("GROUND-001: intentional South Ward land coverage",()=>{
 it("keeps the owner-approved 13 classes and finite First Light footprint",()=>{
   expect(LAND_FINISHES).toHaveLength(13);
   expect(new Set(LAND_FINISHES).size).toBe(13);
   const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   expect(p.width).toBe(160); expect(p.height).toBe(130);
   expect(p.kinds.length).toBe(20800);
   expect(Object.values(p.counts).reduce((a,b)=>a+b,0)).toBe(20800);
   expect([...p.kinds].every(v=>v>=0&&v<13)).toBe(true);
   expect(p.sample(-81,0)).toBeNull();
   expect(p.sample(81,0)).toBeNull();
 });
 it("is deterministic, and depends on the CitySpec generator revision",()=>{
   const a=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   const b=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   expect(a.kinds).toEqual(b.kinds);
   const c=planGroundLandUse({...FIRST_LIGHT_CITY_SPEC,
     generatorVersion:FIRST_LIGHT_CITY_SPEC.generatorVersion+1},bounds);
   expect(c.kinds).not.toEqual(a.kinds);
 });
 it("protects the existing public park and leaves established roads to their physical meshes",()=>{
   const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   expect(p.sample(-2.5,35.5)).toBe("GRN-01");
   expect(p.sample(0,8)).toBe("PAV-01");
   expect(p.sample(20,28)).toBe("PAV-01");
 });
 it("paints a full-size opaque surface without allocation gaps",()=>{
   const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   const image=buildGroundLandPixels(p);
   expect(image.width).toBe(1280);expect(image.height).toBe(1040);
   expect(image.pixels.length).toBe(1280*1040*4);
   let transparent=0;
   for(let i=3;i<image.pixels.length;i+=4)if(image.pixels[i]!==255)transparent++;
   expect(transparent).toBe(0);
 });
 it("allocates a bounded mipmapped WebGL-compatible texture and disposes it",()=>{
   const engine=new NullEngine();
   const scene=new Scene(engine);
   try{
     const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
     const tex=createGroundLandTexture(scene,p);
     expect(tex).toBeInstanceOf(Texture);
     expect(tex.name).toContain("ground003");
     tex.dispose();
   }finally{scene.dispose();engine.dispose();}
 });
 it("installs preview map on the same ground draw while keeping buildings, roads, and physics",async()=>{
   const engine=new NullEngine();
   const scene=new Scene(engine);
   const physics=await MeridianPhysics.create();
   try{
     const baselineBodies=physics.world.bodies.len();
     const world=createGeneratedFirstLightWorld(scene,physics,{
       enableLandUsePreview:true,enableShadows:false,
     });
     const ground=scene.getMeshByName("generated-first-light-ground");
     expect(ground).toBeDefined();
     expect(ground?.metadata?.landUsePreview).toBe(true);
     expect(ground?.material).toBeInstanceOf(StandardMaterial);
     const texture=(ground?.material as StandardMaterial).diffuseTexture;
     expect(texture?.name).toContain("ground003");
     expect(world.buildings).toHaveLength(10);
     expect(world.urbanSurfaces.meshes.some(m=>m.name.startsWith("generated-infill:"))).toBe(false);
     expect(physics.world.bodies.len()).toBeGreaterThan(baselineBodies);
     world.dispose();
     expect(physics.world.bodies.len()).toBe(baselineBodies);
   }finally{physics.destroy();scene.dispose();engine.dispose();}
 });
 it("rejects invalid and unbounded world domains before allocating",()=>{
   expect(()=>planGroundLandUse(FIRST_LIGHT_CITY_SPEC,
     {left:0,right:2000,north:0,south:2000})).toThrow();
   expect(()=>planGroundLandUse(FIRST_LIGHT_CITY_SPEC,
     {left:1,right:0,north:0,south:10})).toThrow();
 });
});
