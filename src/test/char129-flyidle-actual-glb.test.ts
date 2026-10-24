// @vitest-environment jsdom
/** CHAR-129-FI-001: verify actual original GLB's full linked hierarchy.
 * A synthetic rig cannot certify the user's actual hands and knee posture.
 */
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3} from "@babylonjs/core";
import {createNativePoseController109} from "../game/character/native-neutral-pose-109";
import {createNativeFlightPlayer129,captureNativeFlightGeometry129} from "../game/character/native-flight-129";

const bytes=readFileSync("public/GLBs/Characters/character.glb");
const glb=JSON.parse(bytes.toString("utf8",20,20+bytes.readUInt32LE(12))) as {
 nodes:{name:string;translation?:number[];rotation?:number[];scale?:number[];matrix?:number[];children?:number[]}[];
 skins:{joints:number[]}[];
};
function actualRig(yaw:number){
 const engine=new NullEngine(),scene=new Scene(engine);
 const skeleton=new Skeleton("char129-actual-original","char129-actual-original",scene);
 const hierarchy=glb.nodes.map(n=>{
  const node=new TransformNode(n.name,scene);
  node.position=Vector3.FromArray(n.translation??[0,0,0]);
  node.scaling=Vector3.FromArray(n.scale??[1,1,1]);
  node.rotationQuaternion=Quaternion.FromArray(n.rotation??[0,0,0,1]);
  if(n.matrix)Matrix.FromArray(n.matrix).decompose(
   node.scaling,node.rotationQuaternion,node.position);
  return node;
 });
 glb.nodes.forEach((n,i)=>(n.children??[]).forEach(child=>hierarchy[child]!.parent=hierarchy[i]!));
 for(const i of glb.skins[0]!.joints){
  const bone=new Bone(glb.nodes[i]!.name,skeleton,null,Matrix.Identity());
  bone.linkTransformNode(hierarchy[i]!);
 }
 const bones=new Map(skeleton.bones.map(b=>[b.name,b]));
 for(const bone of skeleton.bones){
  const parent=bone.getTransformNode()!.parent;
  if(parent&&bones.has(parent.name))bone.setParent(bones.get(parent.name)!);
 }
 const neutral=createNativePoseController109([skeleton]);
 expect(neutral.report.status).toBe("native-joints");
 const anchor=new TransformNode("char129-physics-anchor",scene);
 anchor.rotation.y=yaw;
 const pivot=new TransformNode("char129-visual-pivot",scene);
 pivot.parent=anchor;pivot.position.y=.95;
 const offset=new TransformNode("char129-visual-counter-offset",scene);
 offset.parent=pivot;offset.position.y=-.95;
 for(const node of hierarchy)if(!node.parent)node.parent=offset;
 const named=new Map(hierarchy.map(n=>[n.name,n]));
 return {anchor,pivot,skeleton,named,neutral,dispose(){scene.dispose();engine.dispose();}};
}
const idleInput={forward:false,backward:false,left:false,right:false,
 ascending:false,descending:false,accelerated:false};
describe("CHAR-129 FI-001 actual owner GLB pose",()=>{
 it.each([0,.8,-1.2])("calibrates natural flyIdle on the real linked character at yaw %s",yaw=>{
  const r=actualRig(yaw);
  try{
   const rest=captureNativeFlightGeometry129(r.named,r.anchor);
   const wristLocal=new Map(["LeftHand","RightHand","LeftForeArm","RightForeArm",
    "LeftLeg","RightToeBase","LeftUpLeg"].map(name=>[
     name,r.named.get(name)!.rotationQuaternion!.clone()]));
   const footRest=r.named.get("RightFoot")!.rotationQuaternion!.clone();
   const leftFootRest=r.named.get("LeftFoot")!.rotationQuaternion!.clone();
   const player=createNativeFlightPlayer129([r.skeleton],r.anchor,r.pivot);
   player.enter();
   expect(player.report.idleCalibrated,player.report.idleCalibrationIssue??"calibrated")
    .toBe(true);
   // FI-002: a nonidentity rotation is not sufficient. Verify anatomical
   // bend magnitude and positive lift on the REAL linked target GLB.
   expect(player.report.idleKneeFlexionGainDegrees).toBeGreaterThanOrEqual(25);
   expect(player.report.idleRightFootLiftFraction).toBeGreaterThan(.10);
   expect(player.report.idleRightKneeAdvanceFraction).toBeGreaterThanOrEqual(.18);
   expect(player.report.idleRightToeDownDot).toBeGreaterThanOrEqual(.70);
   expect(player.report.idleRightFootAboveLeftFraction).toBeGreaterThanOrEqual(.24);
   expect(player.report.hoverLeftToeDownGain).toBeGreaterThan(.08);
   expect(player.report.hoverWeight).toBe(1);
   for(let i=0;i<30;i++)player.update({...idleInput,dt:1/60});
   const hover=captureNativeFlightGeometry129(r.named,r.anchor);
   expect(hover.leftWristLane).toBeLessThan(rest.leftWristLane);
   expect(hover.rightWristLane).toBeGreaterThan(rest.rightWristLane);
   expect(hover.leftAnkleLane).toBeLessThan(hover.rightAnkleLane);
   expect(hover.ankleSeparation).toBeGreaterThan(rest.ankleSeparation*.8);
   const position=(name:string)=>{
    const n=r.named.get(name)!;n.computeWorldMatrix(true);
    return n.getAbsolutePosition().clone();
   };
   const hip=position("RightUpLeg"),knee=position("RightLeg"),ankle=position("RightFoot");
   const flexion=(a:Vector3,b:Vector3,c:Vector3)=>
    Math.PI-Math.acos(Math.max(-1,Math.min(1,Vector3.Dot(
     a.subtract(b).normalize(),c.subtract(b).normalize()))));
   expect(Number.isFinite(flexion(hip,knee,ankle))).toBe(true);
   const toe=position("RightToeBase");
   const shoeDirection=toe.subtract(ankle).normalize();
   const worldDown=new Vector3(0,-1,0);
   expect(Vector3.Dot(shoeDirection,worldDown)).toBeGreaterThanOrEqual(.70);
   expect(Math.abs(Quaternion.Dot(r.named.get("RightFoot")!.rotationQuaternion!,
     footRest))).toBeLessThan(.999999);
   expect(Math.abs(Quaternion.Dot(r.named.get("LeftFoot")!.rotationQuaternion!,
     leftFootRest))).toBeLessThan(.999999);
   for(const [name,rotation] of wristLocal)
    expect(Math.abs(Quaternion.Dot(r.named.get(name)!.rotationQuaternion!,rotation)))
     .toBeCloseTo(1,6);
   expect(player.report.idleWeight).toBeCloseTo(1,6);
   const neckRest=r.named.get("Neck")!.rotationQuaternion!.clone();
   const shoeBeforeFlight=r.named.get("RightFoot")!.rotationQuaternion!.clone();
   // FI-005: vertical flight must maintain the elevated knee/foot posture
   // and direct Head/Neck gaze up or down, *without* idle input.
   for(let i=0;i<20;i++)
    player.update({...idleInput,ascending:true,dt:1/60});
   expect(player.report.activeClip).toBe("flyHoverUp");
   expect(player.report.hoverWeight).toBeCloseTo(1,6);
   expect(player.report.headPitchDirection).toBeGreaterThan(.95);
   const neckUp=r.named.get("Neck")!.rotationQuaternion!.clone();
   expect(Math.abs(Quaternion.Dot(neckRest,neckUp))).toBeLessThan(.999);
   expect(Math.abs(Quaternion.Dot(shoeBeforeFlight,
      r.named.get("RightFoot")!.rotationQuaternion!))).toBeCloseTo(1,5);
   expect(position("RightFoot").y-position("LeftFoot").y).toBeGreaterThan(
     Vector3.Distance(position("RightLeg"),position("RightFoot"))*.24);
   for(let i=0;i<35;i++)
    player.update({...idleInput,descending:true,dt:1/60});
   expect(player.report.activeClip).toBe("flyHoverDown");
   expect(player.report.hoverWeight).toBeCloseTo(1,6);
   expect(player.report.headPitchDirection).toBeLessThan(-.95);
   const neckDown=r.named.get("Neck")!.rotationQuaternion!.clone();
   expect(Math.abs(Quaternion.Dot(neckUp,neckDown))).toBeLessThan(.98);
   expect(position("RightFoot").y-position("LeftFoot").y).toBeGreaterThan(
     Vector3.Distance(position("RightLeg"),position("RightFoot"))*.24);
   for(let i=0;i<20;i++)
    player.update({...idleInput,forward:true,dt:1/60});
   expect(player.report.activeClip).toBe("flyHoverForward");
   expect(player.report.hoverWeight).toBeCloseTo(1,6);
   expect(player.report.headPitchDirection).toBeCloseTo(0,5);
   expect(Math.abs(Quaternion.Dot(shoeBeforeFlight,
     r.named.get("RightFoot")!.rotationQuaternion!))).toBeCloseTo(1,5);
   player.leave();
   expect(Math.abs(Quaternion.Dot(r.named.get("RightFoot")!.rotationQuaternion!,
     footRest))).toBeCloseTo(1,6);
   expect(Math.abs(Quaternion.Dot(r.named.get("LeftFoot")!.rotationQuaternion!,
     leftFootRest))).toBeCloseTo(1,6);
   for(const [name,rotation] of wristLocal)
    expect(Math.abs(Quaternion.Dot(r.named.get(name)!.rotationQuaternion!,rotation)))
     .toBeCloseTo(1,6);
   expect(captureNativeFlightGeometry129(r.named,r.anchor)).toEqual(rest);
  }finally{r.dispose();}
 });
});
