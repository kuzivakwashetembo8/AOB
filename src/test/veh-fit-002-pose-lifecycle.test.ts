import { describe,expect,it } from "vitest";
import { MeshBuilder,NullEngine,Scene,Skeleton,TransformNode } from "@babylonjs/core";
import { createDriverCabinPose } from "../game/character/driver-cabin-pose";

describe("VEH-FIT-002 G1-G2 driving pose isolation",()=>{
 it("fails closed on foreign skeleton without replacing locomotion",()=>{
   const engine=new NullEngine();
   const scene=new Scene(engine);
   const skeleton=new Skeleton("foreign","foreign",scene);
   const mesh=MeshBuilder.CreateBox("dummy",{size:1},scene);
   const root=new TransformNode("root",scene);
   const cabin=new TransformNode("vehicle",scene);
   const adapter=createDriverCabinPose(scene,skeleton,mesh,root);
   try{
     expect(adapter.report().status).toBe("disabled");
     adapter.setCabin(cabin,true,"feet");
     scene.render();
     expect(adapter.report().correctionMode).toBe("feet");
     const report=adapter.report();
     expect(report.status).toBe("missing-rig");
     expect(report.appliedLimbs).toEqual([]);
     adapter.setCabin(null,false);
     expect(adapter.report().status).toBe("disabled");
     scene.render();
     expect(root.position.y).toBe(0);
   } finally {
     adapter.dispose();scene.dispose();engine.dispose();
   }
 });
});
