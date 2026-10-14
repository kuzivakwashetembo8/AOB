import {describe,expect,it} from "vitest";
import {FreeCamera,NullEngine,Scene,Vector3} from "@babylonjs/core";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {createGeneratedStreetContext} from "../game/world-generation/street-context-renderer";
import {FOLIAGE_TEST_TREE_ID} from "../game/world-generation/greenery-image-assets";
import {chooseCanopyPresentation} from "../game/world-generation/greenery-view-policy";

describe("GRN-003 image scale and aerial volume experiment",()=>{
 it("selects 3D generated foliage at high flight altitude even if the camera looks shallowly downward",()=>{
   expect(chooseCanopyPresentation(8,.05,"photo")).toBe("volume");
   expect(chooseCanopyPresentation(2,0,"photo")).toBe("volume");
   expect(chooseCanopyPresentation(-3,.85,"photo")).toBe("photo");
 });
 it("uses hysteresis so near camera thresholds do not flicker",()=>{
   expect(chooseCanopyPresentation(10,.5,"photo")).toBe("volume");
   expect(chooseCanopyPresentation(.5,.21,"volume")).toBe("volume");
   expect(chooseCanopyPresentation(.5,.21,"photo")).toBe("photo");
   expect(chooseCanopyPresentation(-1,.6,"volume")).toBe("photo");
   expect(chooseCanopyPresentation(10,.12,"volume")).toBe("volume");
   expect(chooseCanopyPresentation(Number.NaN,.5,"photo")).toBe("photo");
 });
 it("does not create aerial 3D lobes when switch is off",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const c=createGeneratedStreetContext(scene,FIRST_LIGHT_CITY_SPEC,
       {skipPocketParkGround:true,foliageImageTrial:"all"});
     expect(c.meshes.filter(m=>m.name.startsWith("grn003-aerial-foliage:"))).toHaveLength(0);
     expect(c.meshes.filter(m=>m.name.startsWith("generated-tree-foliage:")).length%30).toBe(0);
     c.dispose();
   }finally{scene.dispose();engine.dispose();}
 });
 it("switches real 3D foliage lobes on only for an overhead view",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const c=createGeneratedStreetContext(scene,FIRST_LIGHT_CITY_SPEC,
       {skipPocketParkGround:true,foliageImageTrial:"one",aerialFoliageTrial:true});
     const cards=c.meshes.filter(m=>m.name.startsWith("generated-tree-foliage:"+FOLIAGE_TEST_TREE_ID+":"));
     const lobes=c.meshes.filter(m=>m.name.startsWith("grn003-aerial-foliage:"+FOLIAGE_TEST_TREE_ID+":"));
     const shrubCards=c.meshes.filter(m=>m.name.startsWith("generated-shrub-card:"));
     expect(cards).toHaveLength(30);
     expect(lobes).toHaveLength(10);
     expect(cards.every(m=>m.isEnabled())).toBe(true);
     expect(lobes.every(m=>!m.isEnabled())).toBe(true);
     const root=scene.getTransformNodeByName("generated-tree:"+FOLIAGE_TEST_TREE_ID);
     expect(root).toBeDefined();
     if(!root)throw Error("missing test tree");
     const camera=new FreeCamera("grn003-test-camera",new Vector3(0,0,0),scene);
     scene.activeCamera=camera;
     camera.position.set(root.position.x,root.position.y+21,root.position.z+5);
     camera.setTarget(new Vector3(root.position.x,root.position.y+4,root.position.z));
     scene.onBeforeRenderObservable.notifyObservers(scene);
     expect(lobes.every(m=>m.isEnabled())).toBe(true);
     expect(cards.every(m=>!m.isEnabled())).toBe(true);
     expect(shrubCards.every(m=>m.isEnabled())).toBe(true);
     // A lower camera looking slightly upward restores the leaf photo.
     camera.position.set(root.position.x+4,root.position.y+1.5,root.position.z+4);
     camera.setTarget(new Vector3(root.position.x,root.position.y+5.5,root.position.z));
     scene.onBeforeRenderObservable.notifyObservers(scene);
     expect(cards.every(m=>m.isEnabled())).toBe(true);
     expect(lobes.every(m=>!m.isEnabled())).toBe(true);
     c.dispose();
     // Babylon may defer unregistering an observer until the next notification.
     // The contract is that render callbacks cannot mutate disposed crowns.
     expect(cards.every(m=>m.isDisposed())).toBe(true);
     expect(lobes.every(m=>m.isDisposed())).toBe(true);
     expect(()=>scene.onBeforeRenderObservable.notifyObservers(scene)).not.toThrow();
   }finally{scene.dispose();engine.dispose();}
 });
});
