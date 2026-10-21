// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Scene,Skeleton,TransformNode} from "@babylonjs/core";
import {createFootPhysicsInspector110,DEFAULT_FOOT_PHYSICS_DEBUG} from "../game/character/foot-ik-inspector-110";

function sceneRig(){
 const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton("voight","voight",scene);
 for(const [name,x,y] of [["LeftLeg",-.08,.56],["RightLeg",.08,.56],
   ["LeftFoot",-.08,.10],["RightFoot",.08,.10]] as const){
  const bone=new Bone(name,sk,null,Matrix.Identity());
  const node=new TransformNode(name,scene);node.position.set(x,y,0);
  bone.linkTransformNode(node);
 }
 return {engine,scene,sk};
}
describe("CHAR-110D live Foot IK geometry inspection",()=>{
 it("shows actual linked foot/ground and predictive markers only when enabled",()=>{
  const r=sceneRig();
  try{
   const inspector=createFootPhysicsInspector110(r.scene,[r.sk]);
   const query=(p:{x:number;y:number;z:number})=>({x:p.x,y:0,z:p.z,normal:{x:0,y:1,z:0}});
   inspector.configure({...DEFAULT_FOOT_PHYSICS_DEBUG,physicsDebug:true,physicsCapsuleDebug:true,
     footIKDebug:true,footIKProbes:true,footIKPrediction:true},query);
   inspector.update({x:0,y:.92,z:0},1/60);
   inspector.update({x:.05,y:.92,z:0},1/60);
   expect(inspector.report.groundQueries).toBe(2);
   expect(inspector.report.predictedContacts).toBe(2);
   expect(inspector.report.fullTwoBoneIK).toBe(false);
   expect(r.scene.meshes.filter(m=>m.name.startsWith("char110-")&&m.isEnabled()).length).toBeGreaterThanOrEqual(8);
   inspector.hide();
   expect(r.scene.meshes.filter(m=>m.name.startsWith("char110-")&&m.isEnabled())).toHaveLength(0);
   inspector.dispose();
  }finally{r.scene.dispose();r.engine.dispose()}
 });
 it("leaves geometry hidden and skeleton unchanged when diagnostics are off",()=>{
  const r=sceneRig();
  try{
   const inspector=createFootPhysicsInspector110(r.scene,[r.sk]);
   let probes=0;
   inspector.configure(DEFAULT_FOOT_PHYSICS_DEBUG,()=>{probes++;return null});
   inspector.update({x:0,y:.92,z:0},1/60);
   expect(probes).toBe(0);
   expect(r.scene.meshes.filter(m=>m.name.startsWith("char110-")&&m.isEnabled())).toHaveLength(0);
   inspector.dispose();
  }finally{r.scene.dispose();r.engine.dispose()}
 });
});
