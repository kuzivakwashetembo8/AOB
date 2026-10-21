import {readFileSync,copyFileSync,mkdtempSync,mkdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {execFileSync} from "node:child_process";
function bakedClip(){
 const dir=mkdtempSync(join(tmpdir(),"char115-"));
 try{
  const assets=join(dir,"public/GLBs/Characters");mkdirSync(assets,{recursive:true});
  for(const file of ["character.glb","ual.glb"])copyFileSync(resolve("public/GLBs/Characters",file),join(assets,file));
  for(const script of ["char110-bake-ual-walk.mjs","char110e-native-bake.mjs","char110e-activate-native.mjs","char110-verify-leg-lanes.mjs"])
   execFileSync(process.execPath,[resolve("scripts",script)],{cwd:dir,stdio:"pipe",timeout:30000});
  return JSON.parse(readFileSync(join(assets,"char110-ual-walk.json"),"utf8"));
 }finally{rmSync(dir,{recursive:true,force:true});}
}
import assert from "node:assert/strict";
import {it} from "vitest";
import {Bone,Matrix,NullEngine,Scene,Skeleton,TransformNode,Quaternion,Vector3} from "@babylonjs/core";
import {createWalkPlayer110} from "../game/character/retargeted-walk-110";
import {createNativePoseController109} from "../game/character/native-neutral-pose-109";
it("keeps actual character head level, wrists neutral and restores standing",()=>{
const b=readFileSync("public/GLBs/Characters/character.glb"),j=JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12)));
const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton("real-rig","real-rig",scene);
const nodes:TransformNode[]=j.nodes.map((n:any)=>{
 const t=new TransformNode(n.name,scene);
 t.position=Vector3.FromArray(n.translation??[0,0,0]);
 t.scaling=Vector3.FromArray(n.scale??[1,1,1]);
 t.rotationQuaternion=new Quaternion(...(n.rotation??[0,0,0,1]));
 if(n.matrix){const s=new Vector3(),q=Quaternion.Identity(),p=new Vector3();Matrix.FromArray(n.matrix).decompose(s,q,p);t.position=p;t.scaling=s;t.rotationQuaternion=q;}
 return t;
},120000);
j.nodes.forEach((n:any,i:number)=>(n.children??[]).forEach((c:number)=>nodes[c]!.parent=nodes[i]!));
for(const i of j.skins[0].joints){const bone=new Bone(j.nodes[i].name,sk,null,Matrix.Identity());bone.linkTransformNode(nodes[i]!);}
// The neutral controller checks bone ancestry as well as linked-node ancestry.
const bones=new Map(sk.bones.map(b=>[b.name,b]));
for(const bone of sk.bones){const p=bone.getTransformNode()!.parent;if(p&&bones.has(p.name))bone.setParent(bones.get(p.name)!);}
const neutral=createNativePoseController109([sk]);assert.equal(neutral.report.status,"native-joints");
const names=new Map<string,TransformNode>(nodes.map(n=>[n.name,n]));
const q=(name:string)=>names.get(name)!.rotationQuaternion!;
const anchor=names.get("Hips")!.parent;
function relative(n:any):Quaternion{return !n||n===anchor?Quaternion.Identity():relative(n.parent).multiply(n.rotationQuaternion).normalize();}
const head=relative(names.get("Head")),wrist=q("RightHand").clone();
const clip=bakedClip(),player=createWalkPlayer110([sk],clip);
const error=(a:Quaternion,b:Quaternion)=>2*Math.acos(Math.min(1,Math.abs(Quaternion.Dot(a,b))));
for(let i=0;i<120;i++)player.update(1.5,1/60);
let maxHead=0,maxWrist=0,armMotion=0;
for(let i=0;i<160;i++){
 player.update(1.5,clip.duration/160);
 maxHead=Math.max(maxHead,error(relative(names.get("Head")),head));
 maxWrist=Math.max(maxWrist,error(q("RightHand"),wrist));
 armMotion=Math.max(armMotion,error(q("RightArm"),Quaternion.Identity()));
 assert.ok(Number.isFinite(q("LeftForeArm").w));
}
assert.ok(maxHead<1e-5,"head direction changed");
assert.ok(maxWrist<1e-5,"wrist bent relative to forearm");
assert.ok(armMotion>.05,"arm swing missing");
player.reset();assert.ok(error(relative(names.get("Head")),head)<1e-5);
console.log(JSON.stringify({actualGLB:true,samples:160,maxHeadRadians:maxHead,maxWristRadians:maxWrist,armSwing:true,reset:true}));
scene.dispose();engine.dispose();

});
