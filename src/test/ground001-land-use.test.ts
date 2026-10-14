import {describe,expect,it} from "vitest";
import {NullEngine,Scene,Texture,StandardMaterial} from "@babylonjs/core";
import {MeridianPhysics} from "../game/physics/rapier-world";
import {createGeneratedFirstLightWorld} from "../game/world/generated-first-light-world";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {LAND_FINISHES,planGroundLandUse} from "../game/world-generation/ground-land-use";
import {buildGroundLandPixels,createGroundLandTexture} from "../game/world-generation/ground-land-surface";

const bounds={left:-80,right:80,north:-45,south:85};
describe("GROUND-004: intentional grass-only residual coverage",()=>{
 it("uses exactly one land class and fills all 20,800 mapped ground metres",()=>{
   const plan=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   expect(LAND_FINISHES).toEqual(["GRN-01"]);
   expect(plan.width).toBe(160);
   expect(plan.height).toBe(130);
   expect(plan.kinds.length).toBe(20800);
   expect([...plan.kinds].every(value=>value===0)).toBe(true);
   expect(plan.counts).toEqual({"GRN-01":20800});
   expect(plan.basins).toHaveLength(0);
   for(const [x,z] of [[0,8],[20,28],[-2.5,35.5],[64,70],[-75,-40]] as const)
     expect(plan.sample(x,z)).toBe("GRN-01");
   expect(plan.sample(-81,0)).toBeNull();
   expect(plan.sample(81,0)).toBeNull();
 });
 it("produces the same grass for any city revision; no random zoning",()=>{
   const a=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   const b=planGroundLandUse({...FIRST_LIGHT_CITY_SPEC,
     generatorVersion:FIRST_LIGHT_CITY_SPEC.generatorVersion+1},bounds);
   expect(a.kinds).toEqual(b.kinds);
   expect(a.counts).toEqual(b.counts);
 });
 it("renders an opaque, grass-colored high-resolution texture without paint",()=>{
   const plan=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds);
   const texture=buildGroundLandPixels(plan);
   expect(texture.width).toBe(1280);
   expect(texture.height).toBe(1040);
   expect(texture.pixels.length).toBe(1280*1040*4);
   let invalid=0;
   for(let i=0;i<texture.pixels.length;i+=4)
     if(texture.pixels[i+3]!==255||texture.pixels[i+1]!<=texture.pixels[i]!
       ||texture.pixels[i+1]!<=texture.pixels[i+2]!)invalid++;
   expect(invalid).toBe(0);
 });
 it("allocates and disposes a grass-only Babylon texture",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try {
     const tex=createGroundLandTexture(scene,planGroundLandUse(FIRST_LIGHT_CITY_SPEC,bounds));
     expect(tex).toBeInstanceOf(Texture);
     expect(tex.name).toBe("ground004-grass-only");
     tex.dispose();
   }finally{scene.dispose();engine.dispose();}
 });
 it("reuses the original flat collider and retains 10 buildings, roads and scene props",async()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const physics=await MeridianPhysics.create();
   try{
     const original=physics.world.bodies.len();
     const world=createGeneratedFirstLightWorld(scene,physics,{
       enableLandUsePreview:true,enableShadows:false,
     });
     const ground=scene.getMeshByName("generated-first-light-ground");
     expect(ground?.metadata?.groundFinish).toBe("GRN-01");
     expect((ground?.material as StandardMaterial).diffuseTexture?.name).toBe("ground004-grass-only");
     expect(ground?.getTotalVertices()).toBe(4); // Pre-water primitive.
     expect(world.buildings).toHaveLength(10);
     expect(world.urbanSurfaces.meshes.some(m=>m.name==="generated-parity-main-road")).toBe(true);
     expect(world.urbanSurfaces.meshes.some(m=>m.name.startsWith("generated-infill:"))).toBe(false);
     expect(scene.meshes.some(m=>m.name.startsWith("ground003-water:"))).toBe(false);
     expect(scene.meshes.some(m=>m.name.startsWith("generated-public-space:"))).toBe(false);
     expect(world.streetContext.itemCount).toBeGreaterThan(0);
     expect(physics.world.bodies.len()).toBeGreaterThan(original);
     world.dispose();
     expect(physics.world.bodies.len()).toBe(original);
   }finally{physics.destroy();scene.dispose();engine.dispose();}
 });
 it("fails closed on oversized and invalid bounds",()=>{
   expect(()=>planGroundLandUse(FIRST_LIGHT_CITY_SPEC,
     {left:0,right:2000,north:0,south:2000})).toThrow();
   expect(()=>planGroundLandUse(FIRST_LIGHT_CITY_SPEC,
     {left:1,right:0,north:0,south:10})).toThrow();
   expect(()=>planGroundLandUse(FIRST_LIGHT_CITY_SPEC,
     {left:0,right:Infinity,north:0,south:10})).toThrow();
 });
});
