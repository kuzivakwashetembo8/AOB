import {describe,expect,it} from "vitest";
import {FreeCamera,NullEngine,Scene,Vector3} from "@babylonjs/core";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {createGeneratedStreetContext} from "../game/world-generation/street-context-renderer";
import {FOLIAGE_TEST_TREE_ID,parseGrassTileMetres,grassMetricRepeat} from "../game/world-generation/greenery-image-assets";
import {chooseCanopyPresentation} from "../game/world-generation/greenery-view-policy";

describe("GRN-003 image scale and aerial volume experiment",()=>{
 it("allows only fixed 1/2/3 metre photo-tile cases with a 2m default",()=>{
   expect(parseGrassTileMetres(null)).toBe(2);
   expect(parseGrassTileMetres("3")).toBe(3);
   expect(parseGrassTileMetres("2")).toBe(2);
   expect(parseGrassTileMetres("1")).toBe(1);
   expect(parseGrassTileMetres("0")).toBe(2);
   expect(grassMetricRepeat(1)).toEqual({u:160,v:130});
   expect(grassMetricRepeat(2)).toEqual({u:80,v:65});
   expect(grassMetricRepeat(3)).toEqual({u:160/3,v:130/3});
 });
 it("uses hysteresis so near camera thresholds do not flicker",()=>{
   expect(chooseCanopyPresentation(10,.5,"photo")).toBe("volume");
   expect(chooseCanopyPresentation(1.2,.21,"volume")).toBe("volume");
   expect(chooseCanopyPresentation(1.2,.21,"photo")).toBe("photo");
   expect(chooseCanopyPresentation(.5,.6,"volume")).toBe("photo");
   expect(chooseCanopyPresentation(10,.12,"volume")).toBe("photo");
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
     const observersBeforeDispose=scene.onBeforeRenderObservable.observers.length;
     c.dispose();
     // Camera may own other Babylon render observers. Our context removes one.
     expect(scene.onBeforeRenderObservable.observers.length).toBe(observersBeforeDispose-1);
   }finally{scene.dispose();engine.dispose();}
 });
});
