import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {it} from "vitest";
import {Bone,Matrix,NullEngine,Scene,Skeleton,TransformNode,Quaternion,Vector3} from "@babylonjs/core";
import {createWalkPlayer110} from "../game/character/retargeted-walk-110";
import {neutralArmDelta109,createNativePoseController109} from "../game/character/native-neutral-pose-109";
it("opens resting elbows without changing palm facing and limits walking swing and foot splay",()=>{
const b=readFileSync("public/GLBs/Characters/character.glb"),j=JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12)));
const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton("real-rig","real-rig",scene);
const nodes:TransformNode[]=j.nodes.map((n:any)=>{
 const t=new TransformNode(n.name,scene);
 t.position=Vector3.FromArray(n.translation??[0,0,0]);
 t.scaling=Vector3.FromArray(n.scale??[1,1,1]);
 t.rotationQuaternion=new Quaternion(...(n.rotation??[0,0,0,1]));
 if(n.matrix){const s=new Vector3(),q=Quaternion.Identity(),p=new Vector3();Matrix.FromArray(n.matrix).decompose(s,q,p);t.position=p;t.scaling=s;t.rotationQuaternion=q;}
 return t;
});
j.nodes.forEach((n:any,i:number)=>(n.children??[]).forEach((c:number)=>nodes[c]!.parent=nodes[i]!));
for(const i of j.skins[0].joints){const bone=new Bone(j.nodes[i].name,sk,null,Matrix.Identity());bone.linkTransformNode(nodes[i]!);}
// The neutral controller checks bone ancestry as well as linked-node ancestry.
const bones=new Map(sk.bones.map(b=>[b.name,b]));
for(const bone of sk.bones){const p=bone.getTransformNode()!.parent;if(p&&bones.has(p.name))bone.setParent(bones.get(p.name)!);}
const nodeByName=new Map<string,TransformNode>(nodes.map(n=>[n.name,n]));
const palmReferences=new Map<string,Quaternion>();
for(const side of ["Left","Right"]){
 const upper=nodeByName.get(side+"Arm")!,forearm=nodeByName.get(side+"ForeArm")!,hand=nodeByName.get(side+"Hand")!;
 const parent=upper.parent as TransformNode;
 upper.computeWorldMatrix(true);forearm.computeWorldMatrix(true);
 const original=upper.rotationQuaternion!.clone();
 const direction=forearm.getAbsolutePosition().subtract(upper.getAbsolutePosition());
 const target=new Vector3(side==="Left"?-.10:.10,-1,0).normalize();
 const delta=neutralArmDelta109(direction,target,parent)!;
 upper.rotationQuaternion=delta.multiply(original).normalize();hand.computeWorldMatrix(true);
 const orientation=Quaternion.Identity();hand.getWorldMatrix().decompose(new Vector3(),orientation,new Vector3());
 palmReferences.set(side,orientation);upper.rotationQuaternion=original;
}
// CHAR-117: neutral calibration must not touch the accepted pelvis/legs.
const protectedNodes=nodes.filter(n=>!/^(Left|Right)(Arm|ForeArm|Hand)$/.test(n.name));
const protectedRotations=protectedNodes.map(n=>n.rotationQuaternion!.asArray());
const neutral=createNativePoseController109([sk]);assert.equal(neutral.report.status,"native-joints");
protectedNodes.forEach((n,i)=>assert.deepEqual(n.rotationQuaternion!.asArray(),protectedRotations[i],"neutral changed "+n.name));
const names=new Map<string,TransformNode>(nodes.map(n=>[n.name,n]));
const q=(name:string)=>names.get(name)!.rotationQuaternion!;
const anchor=names.get("Hips")!.parent;
function relative(n:any):Quaternion{return !n||n===anchor?Quaternion.Identity():relative(n.parent).multiply(n.rotationQuaternion).normalize();}
const head=relative(names.get("Head")),wrist=q("RightHand").clone();
const armBase=q("RightArm").clone();
function hipPoint(name:string){
 const h=names.get("Hips")!,n=names.get(name)!;
 n.computeWorldMatrix(true);h.computeWorldMatrix(true);
 return Vector3.TransformCoordinates(n.getAbsolutePosition(),Matrix.Invert(h.getWorldMatrix()));
}
for(const side of ["Left","Right"]){
 const sign=side==="Left"?1:-1;
 assert.ok((hipPoint(side+"ForeArm").x-hipPoint(side+"Arm").x)*sign>.055,"CHAR-117 articulated elbow clearance");
 const upper=hipPoint(side+"ForeArm").subtract(hipPoint(side+"Arm")).normalize();
 const lower=hipPoint(side+"Hand").subtract(hipPoint(side+"ForeArm")).normalize();
 const bend=Math.acos(Math.max(-1,Math.min(1,Vector3.Dot(upper,lower))));
 assert.ok(bend>.18&&bend<.45,"gentle elbow bend rather than sleeve roll");
 const hand=names.get(side+"Hand")!;hand.computeWorldMatrix(true);
 const orientation=Quaternion.Identity();hand.getWorldMatrix().decompose(new Vector3(),orientation,new Vector3());
 assert.ok(Math.abs(Quaternion.Dot(orientation,palmReferences.get(side)!))>.999999,"preserve palm orientation");
}
const clip={
 schema:"gtd.char110.ual-walk.v1" as const,duration:1.333333,sampleCount:41,walkTargetMps:1.5,frameBasis:[0,0,0,1],
 tracks:["Hips","Spine","Spine1","Spine2","Neck","Head","LeftShoulder","LeftArm","LeftForeArm","LeftHand","RightShoulder","RightArm","RightForeArm","RightHand","LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase","RightUpLeg","RightLeg","RightFoot","RightToeBase"].map(name=>({
  node:name,source:name,peakRadians:.3,keys:Array.from({length:41},(_,i)=>{
   // Stress inherited head tilt and wrist twist, with opposite bilateral swing.
   const delta=/(UpLeg|Leg|Foot|ToeBase)$/.test(name)?Quaternion.Identity():Quaternion.RotationAxis(Vector3.Right(),.3*Math.sin(i/40*Math.PI*2)*(name.startsWith("Left")?-1:1));
   return delta.asArray();
  })
 }))
},player=createWalkPlayer110([sk],clip);
const error=(a:Quaternion,b:Quaternion)=>2*Math.acos(Math.min(1,Math.abs(Quaternion.Dot(a,b))));
for(let i=0;i<120;i++)player.update(1.5,1/60);
let maxHead=0,maxWrist=0,armMotion=0;
for(let i=0;i<160;i++){
 player.update(1.5,clip.duration/160);
 maxHead=Math.max(maxHead,error(relative(names.get("Head")),head));
 maxWrist=Math.max(maxWrist,error(q("RightHand"),wrist));
 armMotion=Math.max(armMotion,error(q("RightArm"),Quaternion.Identity()));
 assert.ok(Number.isFinite(q("LeftForeArm").w));
 assert.ok(error(q("RightArm"),armBase)<.131,"moderate upper-arm swing");
 assert.ok(hipPoint("LeftFoot").x-hipPoint("RightFoot").x<.25,"narrower walking lane");
 for(const side of ["Left","Right"]){
  const sign=side==="Left"?1:-1,d=hipPoint(side+"ToeBase").subtract(hipPoint(side+"Foot"));
  assert.ok(hipPoint(side+"Foot").x*sign>.04,"no crossover");
  assert.ok(Math.abs(Math.atan2(d.x,d.z))<.101,"shoes face travel");
 }
}
assert.ok(maxHead<1e-5,"head direction changed");
assert.ok(maxWrist<1e-5,"wrist bent relative to forearm");
assert.ok(armMotion>.05,"arm swing missing");
player.reset();assert.ok(error(relative(names.get("Head")),head)<1e-5);
console.log(JSON.stringify({actualGLB:true,samples:160,maxHeadRadians:maxHead,maxWristRadians:maxWrist,armSwing:true,reset:true}));
scene.dispose();engine.dispose();

},120000);

