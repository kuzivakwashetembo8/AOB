// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3} from "@babylonjs/core";
import {createNativePoseController109,findLinkedArms109,neutralArmDelta109} from "../game/character/native-neutral-pose-109";
describe("CHAR-109 glTF linked arm-neutral controller",()=>{
 it("aims directions downwards in the parent joint local frame",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  try{
   const root=new TransformNode("rig-parent",scene);
   root.rotationQuaternion=Quaternion.Identity();
   const source=new Vector3(-1,0,0);
   const target=new Vector3(-.1,-1,0).normalize();
   const delta=neutralArmDelta109(source,target,root);
   expect(delta).not.toBeNull();
   const transformed=source.rotateByQuaternionToRef(delta!,new Vector3());
   expect(Vector3.Dot(transformed.normalize(),target)).toBeGreaterThan(.99);
  }finally{scene.dispose();engine.dispose();}
 });
 it("controls real linked joint nodes, keeps original vertices and restores posture",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  try{
   const skeleton=new Skeleton("skinned-avatar","skinned-avatar",scene);
   const root=new TransformNode("hips",scene);
   for(const side of ["left","right"] as const){
     const sign=side==="left"?-1:1;
     const shoulderBone=new Bone(side+"Shoulder",skeleton,null,Matrix.Identity());
     const upper=new Bone(side+"Arm",skeleton,shoulderBone,Matrix.Identity());
     const lower=new Bone(side+"ForeArm",skeleton,upper,Matrix.Identity());
     const shoulderNode=new TransformNode(side+"Shoulder",scene);
     shoulderNode.parent=root;
     shoulderNode.position.set(sign*.25,1.5,0);
     const upperNode=new TransformNode(side+"Arm",scene);
     upperNode.parent=shoulderNode;
     upperNode.position.set(sign*.12,0,0);
     const elbowNode=new TransformNode(side+"ForeArm",scene);
     elbowNode.parent=upperNode;
     elbowNode.position.set(sign*.4,0,0);
     shoulderBone.linkTransformNode(shoulderNode);
     upper.linkTransformNode(upperNode);
     lower.linkTransformNode(elbowNode);
   }
   const linked=findLinkedArms109([skeleton]);
   expect(linked.map(x=>x.side).sort()).toEqual(["left","right"]);
   const controller=createNativePoseController109([skeleton]);
   expect(controller.report.status).toBe("native-joints");
   expect(controller.report.applied).toEqual(["leftArm","rightArm"]);
   for(const arm of linked){
     arm.upper.computeWorldMatrix(true);arm.forearm.computeWorldMatrix(true);
     const d=arm.forearm.getAbsolutePosition().subtract(arm.upper.getAbsolutePosition()).normalize();
     expect(d.y).toBeLessThan(-.9);
   }
   const node=linked[0]!.upper;
   node.rotationQuaternion=Quaternion.Identity();
   controller.ensure();
   expect(controller.report.restored).toBeGreaterThan(0);
   controller.dispose();
  }finally{scene.dispose();engine.dispose();}
 });
 it("refuses a skeleton with no linked armature, rather than stretching vertices",()=>{
  const engine=new NullEngine(),scene=new Scene(engine);
  try{
   const skeleton=new Skeleton("no-links","no-links",scene);
   const b=new Bone("LeftArm",skeleton,null,Matrix.Identity());
   new Bone("LeftForeArm",skeleton,b,Matrix.Identity());
   expect(createNativePoseController109([skeleton]).report.status).toBe("rejected");
  }finally{scene.dispose();engine.dispose();}
 });
});
