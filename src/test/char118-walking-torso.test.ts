import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {it} from "vitest";
import {Bone,Matrix,NullEngine,Scene,Skeleton,TransformNode,Quaternion,Vector3} from "@babylonjs/core";
import {createWalkPlayer110} from "../game/character/retargeted-walk-110";
import {createNativePoseController109} from "../game/character/native-neutral-pose-109";
function rig(control:boolean,yaw:number){
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

 const names=new Map(nodes.map(n=>[n.name,n]));
 const actor=new TransformNode("actor",scene);actor.rotationQuaternion=Quaternion.RotationAxis(Vector3.Up(),yaw);
 for(const n of nodes)if(!n.parent)n.parent=actor;
 if(control){
  // Identity intermediary preserves the rendered rig but deliberately makes
  // the optional spine calibration unsupported: playback is the control.
  const intermediary=new TransformNode("unmapped-back",scene);intermediary.parent=names.get("Hips")!;
  names.get("Spine")!.parent=intermediary;
 }
 assert.equal(createNativePoseController109([sk]).report.status,"native-joints");
 return {names,sk,dispose(){scene.dispose();engine.dispose();}};
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
};
it("CHAR-118 inclines only the walking spine and preserves accepted arms, legs, head gaze and reset",()=>{
 for(const yaw of [0,1.2]){
  const candidate=rig(false,yaw),control=rig(true,yaw);
  const a=createWalkPlayer110([candidate.sk],clip),b=createWalkPlayer110([control.sk],clip);
  const idle=new Map([...candidate.names].map(([name,n])=>[name,n.rotationQuaternion!.clone()]));
  const error=(a:Quaternion,b:Quaternion)=>2*Math.acos(Math.min(1,Math.abs(Quaternion.Dot(a.clone().normalize(),b.clone().normalize()))));
  function point(r:ReturnType<typeof rig>,name:string){
   const n=r.names.get(name)!,hips=r.names.get("Hips")!;n.computeWorldMatrix(true);hips.computeWorldMatrix(true);
   return Vector3.TransformCoordinates(n.getAbsolutePosition(),Matrix.Invert(hips.getWorldMatrix()));
  }
  const protectedNames=["Hips","LeftUpLeg","RightUpLeg","LeftLeg","RightLeg","LeftFoot","RightFoot","LeftToeBase","RightToeBase"];
  for(let i=0;i<180;i++){
   a.update(1.5,1/60);b.update(1.5,1/60);
   for(const name of protectedNames){
    const x=candidate.names.get(name)!,y=control.names.get(name)!;x.computeWorldMatrix(true);y.computeWorldMatrix(true);
    assert.ok(x.getWorldMatrix().equalsWithEpsilon(y.getWorldMatrix(),1e-6),"protected body changed "+name);
   }
   for(const side of ["Left","Right"])for(const part of ["Shoulder","Arm","ForeArm","Hand"]){
    assert.ok(error(candidate.names.get(side+part)!.rotationQuaternion!,control.names.get(side+part)!.rotationQuaternion!)<1e-6,"accepted arm changed");
   }
   if(i>15){
    for(const [index,name] of ["Spine","Spine1","Spine2"].entries()){
     assert.ok(Math.abs(error(candidate.names.get(name)!.rotationQuaternion!,control.names.get(name)!.rotationQuaternion!)-[2,1.75,1.25][index]!*Math.PI/180)<1e-5,"distributed spine bend");
    }
    const shift=point(candidate,"Neck").subtract(point(control,"Neck"));
    assert.ok(shift.z>.005&&shift.z<.07,"slight forward upper torso displacement "+JSON.stringify({yaw,i,shift:shift.asArray()}));
    const x=candidate.names.get("Head")!,y=control.names.get("Head")!;x.computeWorldMatrix(true);y.computeWorldMatrix(true);
    const q1=Quaternion.Identity(),q2=Quaternion.Identity();x.getWorldMatrix().decompose(new Vector3(),q1,new Vector3());y.getWorldMatrix().decompose(new Vector3(),q2,new Vector3());
    assert.ok(error(q1.normalize(),q2.normalize())<1e-5,"level gaze changed");
   }
  }
  for(let i=0;i<20;i++)a.update(0,1/60);
  for(const [name,q] of idle)assert.ok(error(candidate.names.get(name)!.rotationQuaternion!,q)<1e-6,"standing did not restore "+name);
  a.update(1.5,.05);a.reset();
  for(const [name,q] of idle)assert.ok(error(candidate.names.get(name)!.rotationQuaternion!,q)<1e-6,"reset did not restore "+name);
  candidate.dispose();control.dispose();
 }
},120000);
