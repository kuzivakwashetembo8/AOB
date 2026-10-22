// @vitest-environment jsdom
/** Requires npm run prebuild: evaluates the shipped GLB and freshly baked clip. */
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';
import {Bone,Matrix,NullEngine,Scene,Skeleton,TransformNode,Quaternion,Vector3} from '@babylonjs/core';
import {createWalkPlayer110,type WalkClip110} from '../game/character/retargeted-walk-110';
import {validateSprintClip120} from '../game/character/retargeted-sprint-120';
import {createNativePoseController109} from '../game/character/native-neutral-pose-109';
import {createSprintArmChain120F,sampleSprintArm120F} from '../game/character/sprint-arm-chain-120f';
const root='public/GLBs/Characters/';
// Vercel runs `npx vitest run` before `npm run build`. Generated clips
// are intentionally not committed; prepare them on a clean checkout.
if(!existsSync(root+'char110-ual-walk.json')||!existsSync(root+'char120-ual-sprint.json')){
 execFileSync('npm',['run','prebuild'],{stdio:'inherit'});
}
const walk=JSON.parse(readFileSync(root+'char110-ual-walk.json','utf8')) as WalkClip110;
const sprint=validateSprintClip120(JSON.parse(readFileSync(root+'char120-ual-sprint.json','utf8')));
const b=readFileSync(root+'character.glb');
type NodeData={name:string;translation?:number[];scale?:number[];rotation?:number[];matrix?:number[];children?:number[]};
const glb=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12))) as {nodes:NodeData[];skins:{joints:number[]}[]};
function rig(yaw=0,scale=1,reflect=false){
 const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton('actual-Voight','actual-Voight',scene);
 const nodes=glb.nodes.map(n=>{const t=new TransformNode(n.name,scene);t.position=Vector3.FromArray(n.translation??[0,0,0]);t.scaling=Vector3.FromArray(n.scale??[1,1,1]);t.rotationQuaternion=Quaternion.FromArray(n.rotation??[0,0,0,1]);if(n.matrix)Matrix.FromArray(n.matrix).decompose(t.scaling,t.rotationQuaternion,t.position);return t;});
 glb.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>nodes[c]!.parent=nodes[i]!));
 for(const i of glb.skins[0]!.joints){const bone=new Bone(glb.nodes[i]!.name,sk,null,Matrix.Identity());bone.linkTransformNode(nodes[i]!);}
 const bones=new Map(sk.bones.map(b=>[b.name,b]));for(const bone of sk.bones){const p=bone.getTransformNode()!.parent;if(p&&bones.has(p.name))bone.setParent(bones.get(p.name)!);}
 const neutral=createNativePoseController109([sk]);expect(neutral.report.status).toBe('native-joints');
 const anchor=new TransformNode('actor',scene);anchor.rotationQuaternion=Quaternion.RotationAxis(Vector3.Up(),yaw);anchor.scaling.set(scale,scale,reflect?-scale:scale);
 for(const n of nodes)if(!n.parent)n.parent=anchor;
 const names=new Map(nodes.map(n=>[n.name,n]));
 const node=(name:string)=>names.get(name)!;
 const point=(name:string)=>{const h=node('Hips');h.computeWorldMatrix(true);const n=node(name);n.computeWorldMatrix(true);return Vector3.TransformCoordinates(n.getAbsolutePosition(),Matrix.Invert(h.getWorldMatrix()));};
 return {sk,nodes,node,point,dispose(){scene.dispose();engine.dispose();}};
}
const qdiff=(a:Quaternion,b:Quaternion)=>1-Math.abs(Quaternion.Dot(a,b));
describe('CHAR-120F actual GLB sprint anatomy',()=>{
 it('bakes a finite continuous authored arm path and rejects malformed directions',()=>{
  expect(sprint.armMotion?.left).toHaveLength(41);expect(sprint.armMotion?.right).toHaveLength(41);
  const bad=structuredClone(sprint);bad.armMotion!.left[5]![0]=NaN;expect(()=>validateSprintClip120(bad)).toThrow();
  const seam=structuredClone(sprint);seam.armMotion!.left[40]=seam.armMotion!.left[20]!;expect(()=>validateSprintClip120(seam)).toThrow();
 });
 it.each([[0,1,false],[1.3,1.75,false],[-2.4,.65,true]])('hits both absolute elbow and wrist targets at yaw=%s scale=%s reflection=%s',(yaw,scale,reflect)=>{
  const r=rig(yaw as number,scale as number,reflect as boolean);
  try{
   const player=createWalkPlayer110([r.sk],walk,[],sprint),neutral=new Map(r.nodes.map(n=>[n.name,n.rotationQuaternion!.clone()]));
   for(let i=0;i<80;i++)player.update(4,sprint.duration/80,true);
   let minFlex=180,maxFlex=0,minLeadingHeight=0,minLeadingForward=1;
   let previous=new Map<string,Quaternion>();
   for(let k=0;k<80;k++){
    const hands=[];
    for(const side of ['Left','Right'] as const){
     const s=r.point(side+'Arm'),e=r.point(side+'ForeArm'),w=r.point(side+'Hand');
     const u=e.subtract(s),v=w.subtract(e),keys=side==='Left'?sprint.armMotion!.left:sprint.armMotion!.right;
     const source=sampleSprintArm120F(keys,k/2),du=Vector3.FromArray(source),dv=Vector3.FromArray(source,3);
     expect(Vector3.Distance(e,s.add(du.scale(u.length())))).toBeLessThan(.00002);
     expect(Vector3.Distance(w,s.add(du.scale(u.length())).add(dv.scale(v.length())))).toBeLessThan(.00002);
     const flex=Math.acos(Math.max(-1,Math.min(1,Vector3.Dot(u.normalizeToNew(),v.normalizeToNew()))))*180/Math.PI;
     minFlex=Math.min(minFlex,flex);maxFlex=Math.max(maxFlex,flex);
     const sign=side==='Left'?1:-1;
     expect(e.x*sign).toBeGreaterThan(.12);expect(w.x*sign).toBeGreaterThan(.12);
     hands.push(w.subtract(s));
     for(const part of ['Arm','ForeArm']){
      const name=side+part,q=r.node(name).rotationQuaternion!;
      if(previous.has(name))expect(qdiff(q,previous.get(name)!)).toBeLessThan(.003);
      previous.set(name,q.clone());
     }
    }
    const leading=hands.sort((a,b)=>b.z-a.z)[0]!;
    minLeadingHeight=Math.min(minLeadingHeight,leading.y);minLeadingForward=Math.min(minLeadingForward,leading.z);
    player.update(4,sprint.duration/80,true);
   }
   expect(minFlex).toBeGreaterThan(75);expect(maxFlex).toBeLessThan(100);
   expect(minLeadingHeight).toBeGreaterThan(-.28);expect(minLeadingForward).toBeGreaterThan(.2);
   expect(player.report.sprintArmFailures).toBe(0);
   player.reset();for(const n of r.nodes)expect(qdiff(n.rotationQuaternion!,neutral.get(n.name)!)).toBeLessThan(1e-7);
   player.dispose();
  }finally{r.dispose();}
 });
 it('leaves every other local joint unchanged, preserves walking and returns cleanly from sprint',()=>{
  const a=rig(),b=rig();
  try{
   // exactOptionalPropertyTypes: an absent legacy channel must be omitted,
   // not supplied explicitly as undefined.
   const legacy=structuredClone(sprint);
   delete legacy.armMotion;
   const active=createWalkPlayer110([a.sk],walk,[],sprint),control=createWalkPlayer110([b.sk],walk,[],legacy);
   for(const [speed,held,count] of [[1.65,false,30],[4,true,120],[1.65,false,40],[0,false,30]] as const){
    for(let i=0;i<count;i++){
     active.update(speed,1/60,held);control.update(speed,1/60,held);
     for(const n of a.nodes){
      if(/^(Left|Right)(Arm|ForeArm)$/.test(n.name)&&(held||(active.report.sprintWeight??0)>0))continue;
      expect(qdiff(n.rotationQuaternion!,b.node(n.name).rotationQuaternion!)).toBeLessThan(1e-7);
     }
    }
   }
   expect(active.report.sprintArmFailures).toBe(0);active.dispose();control.dispose();
  }finally{a.dispose();b.dispose();}
 });
 it('rejects degenerate requests without leaving partial arm transforms',()=>{
  const r=rig();try{
   const arm=r.node('RightArm'),elbow=r.node('RightForeArm'),hand=r.node('RightHand');
   const solve=createSprintArmChain120F(r.node('Hips'),arm,elbow,hand),a=arm.rotationQuaternion!.clone(),e=elbow.rotationQuaternion!.clone();
   expect(solve([0,0,0,0,0,0],1)).toBe(false);
   expect(qdiff(arm.rotationQuaternion!,a)).toBeLessThan(1e-7);expect(qdiff(elbow.rotationQuaternion!,e)).toBeLessThan(1e-7);
  }finally{r.dispose();}
 });
});
