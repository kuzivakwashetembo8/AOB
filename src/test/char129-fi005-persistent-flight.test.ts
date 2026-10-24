// @vitest-environment jsdom
/** CHAR-129 FI-005 acceptance gate on the original parented Voight GLB.
 * Keeps airplane physics/camera out of the anatomical rig fixture.
 */
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3} from "@babylonjs/core";
import {createNativePoseController109} from "../game/character/native-neutral-pose-109";
import {createNativeFlightPlayer129,captureNativeFlightGeometry129} from "../game/character/native-flight-129";
import type {FlightPoseInput} from "../game/character/locomotion/flight-pose";

const raw=readFileSync("public/GLBs/Characters/character.glb");
const data=JSON.parse(raw.toString("utf8",20,20+raw.readUInt32LE(12))) as {
 nodes:{name:string;translation?:number[];rotation?:number[];scale?:number[];matrix?:number[];children?:number[]}[];
 skins:{joints:number[]}[];
};
const idle:FlightPoseInput={forward:false,backward:false,left:false,right:false,
 ascending:false,descending:false,accelerated:false};

function original(yaw:number){
 const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton("voight","voight",scene);
 const nodes=data.nodes.map(n=>{
  const obj=new TransformNode(n.name,scene);
  obj.position=Vector3.FromArray(n.translation??[0,0,0]);
  obj.scaling=Vector3.FromArray(n.scale??[1,1,1]);
  obj.rotationQuaternion=Quaternion.FromArray(n.rotation??[0,0,0,1]);
  if(n.matrix)Matrix.FromArray(n.matrix).decompose(obj.scaling,obj.rotationQuaternion,obj.position);
  return obj;
 });
 data.nodes.forEach((n,i)=>(n.children??[]).forEach(j=>nodes[j]!.parent=nodes[i]!));
 for(const index of data.skins[0]!.joints){
  const bone=new Bone(data.nodes[index]!.name,sk,null,Matrix.Identity());
  bone.linkTransformNode(nodes[index]!);
 }
 const byBone=new Map(sk.bones.map(b=>[b.name,b]));
 for(const bone of sk.bones){
  const p=bone.getTransformNode()!.parent;
  if(p&&byBone.has(p.name))bone.setParent(byBone.get(p.name)!);
 }
 const neutral=createNativePoseController109([sk]);
 expect(neutral.report.status).toBe("native-joints");
 const anchor=new TransformNode("physics",scene);anchor.rotation.y=yaw;
 const pivot=new TransformNode("visual",scene);pivot.parent=anchor;pivot.position.y=.95;
 const shift=new TransformNode("visual-counter",scene);
 shift.parent=pivot;shift.position.y=-.95;
 for(const n of nodes)if(!n.parent)n.parent=shift;
 const linked=new Map(nodes.map(n=>[n.name,n]));
 const p=(name:string)=>{
  const n=linked.get(name)!;n.computeWorldMatrix(true);return n.getAbsolutePosition().clone();
 };
 return {anchor,pivot,linked,sk,p,dispose(){scene.dispose();engine.dispose();}};
}
function actualGaze(r:ReturnType<typeof original>){
 const leftToe=r.p("LeftToeBase").subtract(r.p("LeftFoot"));
 const rightToe=r.p("RightToeBase").subtract(r.p("RightFoot"));
 const forward=leftToe.add(rightToe);forward.y=0;return forward.normalize();
}
describe("CHAR-129 FI-005 persistent native flight posture",()=>{
 it.each([0,.8,-1.2])("keeps knee, arms and foot separation through vertical motion at yaw %s",yaw=>{
  const r=original(yaw);
  try{
   const neutralGeo=captureNativeFlightGeometry129(r.linked,r.anchor);
   // FI-006 permits a mild LEFT FOOT pitch, never a change to left
   // hip, thigh, shin or toe joint local rotations.
   const leftLegNames=["LeftUpLeg","LeftLeg","LeftToeBase"];
   const leftFootRest=r.linked.get("LeftFoot")!.rotationQuaternion!.clone();
   const leftLegBaseline=new Map(leftLegNames.map(n=>[n,r.linked.get(n)!.rotationQuaternion!.clone()]));
   const neckRest=r.linked.get("Neck")!.rotationQuaternion!.clone();
   const worldForward=actualGaze(r);
   const head=r.linked.get("Head")!;head.computeWorldMatrix(true);
   const headLocalGaze=Vector3.TransformNormal(worldForward,
     Matrix.Invert(head.getWorldMatrix())).normalize();
   const look=()=>{
    head.computeWorldMatrix(true);
    return Vector3.TransformNormal(headLocalGaze,head.getWorldMatrix()).normalize();
   };
   const player=createNativeFlightPlayer129([r.sk],r.anchor,r.pivot);
   player.enter();
   expect(player.report.idleCalibrated,player.report.idleCalibrationIssue??"calibrated")
    .toBe(true);
   expect(player.report.idleRightFootAboveLeftFraction).toBeGreaterThan(.24);
   expect(player.report.hoverLeftToeDownGain).toBeGreaterThan(.08);
   expect(Math.abs(Quaternion.Dot(leftFootRest,
    r.linked.get("LeftFoot")!.rotationQuaternion!))).toBeLessThan(.9999);
   expect(player.report.hoverWeight).toBe(1);
   const gap=()=>r.p("RightFoot").y-r.p("LeftFoot").y;
   const shin=Vector3.Distance(r.p("RightLeg"),r.p("RightFoot"));
   // On the FIRST frame after F, not only once motion is stationary.
   expect(gap()/shin).toBeGreaterThan(.24);
   const open=captureNativeFlightGeometry129(r.linked,r.anchor);
   expect(open.wristSeparation).toBeGreaterThan(neutralGeo.wristSeparation*1.08);
   const ankleAtStart=gap();
   for(let i=0;i<60;i++){
    player.update({...idle,ascending:true,dt:1/60});
    expect(player.report.activeClip).toBe("flyHoverUp");
    expect(gap()/shin).toBeGreaterThan(.23);
    expect(player.report.hoverWeight).toBe(1);
   }
   expect(look().y).toBeGreaterThan(.19);
   expect(player.report.headPitchDirection).toBeGreaterThan(.99);
   for(let i=0;i<60;i++){
    player.update({...idle,descending:true,dt:1/60});
    expect(player.report.activeClip).toBe("flyHoverDown");
    expect(gap()/shin).toBeGreaterThan(.23);
   }
   expect(look().y).toBeLessThan(-.14);
   expect(player.report.headPitchDirection).toBeLessThan(-.99);
   for(let i=0;i<60;i++)player.update({...idle,right:true,dt:1/60});
   expect(player.report.activeClip).toBe("flyHoverRight");
   expect(gap()).toBeCloseTo(ankleAtStart,4);
   expect(player.report.headPitchDirection).toBeCloseTo(0,5);
   expect(Math.abs(Quaternion.Dot(r.linked.get("Neck")!.rotationQuaternion!,neckRest)))
    .toBeCloseTo(1,5);
   for(const [name,rotation] of leftLegBaseline)
    expect(Math.abs(Quaternion.Dot(r.linked.get(name)!.rotationQuaternion!,rotation)))
     .toBeCloseTo(1,6);
   expect(Vector3.Distance(r.anchor.position,Vector3.Zero())).toBe(0);
   player.leave();
   expect(Math.abs(Quaternion.Dot(leftFootRest,
    r.linked.get("LeftFoot")!.rotationQuaternion!))).toBeCloseTo(1,6);
   expect(captureNativeFlightGeometry129(r.linked,r.anchor)).toEqual(neutralGeo);
   expect(gap()/shin).toBeLessThan(.24);
  }finally{r.dispose();}
 });
 it.each([0,.8,-1.2])("FI-006 forward sprint goes fully prone with wider arms and both soles up at yaw %s",yaw=>{
  const r=original(yaw);
  try{
   const before=captureNativeFlightGeometry129(r.linked,r.anchor);
   const neutral=new Map([...r.linked].map(([name,node])=>[
    name,node.rotationQuaternion?.clone()??Quaternion.Identity()]));
   const initialPosition=r.anchor.position.clone(),initialYaw=r.anchor.rotation.y;
   const player=createNativeFlightPlayer129([r.sk],r.anchor,r.pivot);
   player.enter();
   expect(player.report.idleCalibrated,player.report.idleCalibrationIssue??"hover").toBe(true);
   expect(player.report.fastCalibrated,player.report.fastCalibrationIssue??"fast").toBe(true);
   expect(player.report.hoverLeftToeDownGain).toBeGreaterThan(.08);
   const hoverGeo=captureNativeFlightGeometry129(r.linked,r.anchor);
   expect(hoverGeo.wristSeparation).toBeGreaterThan(before.wristSeparation*1.08);
   const hoverRightGap=r.p("RightFoot").y-r.p("LeftFoot").y;
   for(let i=0;i<45;i++)
    player.update({...idle,forward:true,accelerated:true,dt:1/60});
   expect(player.report.activeClip).toBe("fly");
   expect(player.report.mode).toBe("fast");
   expect(player.report.pitchRadians).toBeCloseTo(Math.PI/2,5);
   expect(player.report.fastWeight).toBeCloseTo(1,5);
   expect(player.report.fastSoleUpLeft).toBeGreaterThan(.55);
   expect(player.report.fastSoleUpRight).toBeGreaterThan(.55);
   const fastGeo=captureNativeFlightGeometry129(r.linked,r.anchor);
   expect(fastGeo.wristSeparation).toBeGreaterThan(hoverGeo.wristSeparation*1.03);
   const torso=r.p("Head").subtract(r.p("Hips"));
   expect(Math.abs(Vector3.Dot(torso.normalize(),Vector3.Up()))).toBeLessThan(.25);
   for(const n of ["LeftUpLeg","LeftLeg","RightUpLeg","RightLeg",
     "LeftHand","RightHand","LeftForeArm","RightForeArm"]){
    const current=r.linked.get(n)!.rotationQuaternion!;
    expect(Math.abs(Quaternion.Dot(current,neutral.get(n)!))).toBeCloseTo(1,5);
   }
   expect(Math.abs(Quaternion.Dot(r.linked.get("LeftFoot")!.rotationQuaternion!,
     neutral.get("LeftFoot")!))).toBeLessThan(.9999);
   expect(Math.abs(Quaternion.Dot(r.linked.get("RightFoot")!.rotationQuaternion!,
     neutral.get("RightFoot")!))).toBeLessThan(.9999);
   // Babylon vectors track dirty flags; compare actual coordinates instead.
   expect(Vector3.Distance(r.anchor.position,initialPosition)).toBeLessThan(1e-8);
   expect(r.anchor.rotation.y).toBe(initialYaw);
   for(let i=0;i<45;i++)
    player.update({...idle,forward:true,dt:1/60});
   expect(player.report.pitchRadians).toBeCloseTo(0,5);
   expect(player.report.hoverWeight).toBeCloseTo(1,5);
   expect(player.report.fastWeight).toBeCloseTo(0,5);
   expect(r.p("RightFoot").y-r.p("LeftFoot").y).toBeCloseTo(hoverRightGap,5);
   player.leave();
   expect(r.pivot.rotation.x).toBeCloseTo(0,7);
   expect(captureNativeFlightGeometry129(r.linked,r.anchor)).toEqual(before);
   for(const [n,rest] of neutral){
    const now=r.linked.get(n)!.rotationQuaternion!;
    expect(Math.abs(Quaternion.Dot(rest,now))).toBeCloseTo(1,6);
   }
  }finally{r.dispose();}
 });

});
