import {describe,expect,it} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {createGeneratedFirstLightWorld} from "../game/world/generated-first-light-world";
import {MeridianPhysics} from "../game/physics/rapier-world";

describe("TREE-PLACE-001 world integration",()=>{
 it("shares one generated plan across tree meshes and physical trunk colliders",async()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const physics=await MeridianPhysics.create();
   const baseBodies=physics.world.bodies.len();
   try{
     const world=createGeneratedFirstLightWorld(scene,physics,{
       enableLandUsePreview:true,enableTreePlace001:true,treeBudget:6,
       enableShadows:false,
     });
     const forest=world.forestryReport;
     expect(forest).not.toBeNull();
     const added=forest!.generated.length;
     expect(added).toBeGreaterThanOrEqual(3);
     const trees=world.streetContext.meshes.filter(m=>
       m.name.startsWith("generated-tree-foliage:tree-place-001:"));
     const trunks=world.streetContext.meshes.filter(m=>
       m.name.startsWith("generated-tree-trunk:tree-place-001:"));
     expect(trees.length).toBe(added*30);
     expect(trunks.length).toBe(added);
     expect(trees.every(m=>m.material?.name==="generated-tree-foliage-material"))
       .toBe(true);
     expect(scene.materials.some(m=>m.name==="grn002-photo-foliage-material")).toBe(false);
     expect(physics.world.bodies.len()).toBeGreaterThan(baseBodies+added);
     const afterInit=scene.meshes.length;
     expect(afterInit).toBeGreaterThan(0);
     world.dispose();
     expect(physics.world.bodies.len()).toBe(baseBodies);
     expect(trunks.every(m=>m.isDisposed())).toBe(true);
     expect(trees.every(m=>m.isDisposed())).toBe(true);
   }finally{
     physics.destroy();scene.dispose();engine.dispose();
   }
 });
 it("disabled mode has no extra generated trees or forestry plan",async()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const physics=await MeridianPhysics.create();
   try{
     const world=createGeneratedFirstLightWorld(scene,physics,{
       enableLandUsePreview:true,enableShadows:false,
     });
     expect(world.forestryReport).toBeNull();
     expect(world.streetContext.meshes.filter(m=>
       m.name.startsWith("generated-tree-trunk:"))).toHaveLength(3);
     expect(world.streetContext.meshes.filter(m=>
       m.name.startsWith("generated-tree-foliage:"))).toHaveLength(90);
     world.dispose();
   }finally{physics.destroy();scene.dispose();engine.dispose();}
 });
});
