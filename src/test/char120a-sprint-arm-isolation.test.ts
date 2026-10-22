// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {Bone,Matrix,NullEngine,Quaternion,Scene,Skeleton,TransformNode,Vector3}
 from "@babylonjs/core";
import {createWalkPlayer110,type WalkClip110} from "../game/character/retargeted-walk-110";
import type {SprintClip120} from "../game/character/retargeted-sprint-120";

const bones=["Hips","Spine","Spine1","Spine2","Neck","Head",
 "LeftShoulder","LeftArm","LeftForeArm","LeftHand","RightShoulder","RightArm","RightForeArm","RightHand",
 "LeftUpLeg","LeftLeg","LeftFoot","LeftToeBase","RightUpLeg","RightLeg","RightFoot","RightToeBase"];
const upperLimbs=new Set(["LeftArm","LeftForeArm","RightArm","RightForeArm"]);
const parent=(name:string):string|null=>{
 if(name==="Hips")return null;
 if(name==="Spine")return "Hips";
 if(name==="Spine1")return "Spine";
 if(name==="Spine2")return "Spine1";
 if(name==="Neck")return "Spine2";
 if(name==="Head")return "Neck";
 for(const side of ["Left","Right"]){
  if(name===side+"Shoulder")return "Spine2";
  if(name===side+"Arm")return side+"Shoulder";
  if(name===side+"ForeArm")return side+"Arm";
  if(name===side+"Hand")return side+"ForeArm";
  if(name===side+"UpLeg")return "Hips";
  if(name===side+"Leg")return side+"UpLeg";
  if(name===side+"Foot")return side+"Leg";
  if(name===side+"ToeBase")return side+"Foot";
 }
 throw Error(name);
};
function rig(){
 const engine=new NullEngine(),scene=new Scene(engine),sk=new Skeleton("arm-gate","arm-gate",scene);
 const nodes=new Map<string,TransformNode>();
 for(const name of bones){
  const bone=new Bone(name,sk,null,Matrix.Identity());
  const node=new TransformNode(name,scene);node.rotationQuaternion=Quaternion.Identity();
  bone.linkTransformNode(node);nodes.set(name,node);
 }
 for(const [name,node] of nodes){
  const p=parent(name);if(p)node.parent=nodes.get(p)!;
  if(name.endsWith("UpLeg"))node.position.x=name.startsWith("Left")?-.11:.11;
  if(name.endsWith("Leg")||name.endsWith("Foot"))node.position.y=-.4;
  if(name.endsWith("ToeBase")){node.position.y=-.09;node.position.z=.12}
  if(name.endsWith("ForeArm")||name.endsWith("Hand"))node.position.y=-.25;
  if(name.endsWith("Arm")&&!name.endsWith("ForeArm"))node.position.y=-.17;
  if(name.endsWith("Shoulder"))node.position.x=name.startsWith("Left")?-.2:.2;
  if(name.startsWith("Spine")||name==="Neck"||name==="Head")node.position.y=.16;
 }
 return {sk,nodes,dispose:()=>{scene.dispose();engine.dispose();}};
}
function assets(muted=false):{walk:WalkClip110;sprint:SprintClip120}{
 const frames=41;
 function tracks(isSprint:boolean){
  return bones.map(node=>{
   const isArm=upperLimbs.has(node);
   const sourceMean=isSprint&&isArm?(node.endsWith("ForeArm")?.8:.4):0;
   const amplitude=isSprint?(isArm?(muted?.12:.22):.25):.12;
   const sign=node.startsWith("Left")?-1:1;
   return {node,source:"UAL:"+node,peakRadians:Math.max(.1,amplitude),
    keys:Array.from({length:frames},(_,i)=>{
     const angle=sourceMean*sign+amplitude*Math.sin(2*Math.PI*i/(frames-1))*sign;
     return Quaternion.RotationAxis(Vector3.Right(),angle).asArray();
    })
   };
  });
 }
 return {
  walk:{schema:"gtd.char110.ual-walk.v1",duration:1.333333,sampleCount:41,
   walkTargetMps:1.5,frameBasis:[0,0,0,1],tracks:tracks(false)},
  sprint:{schema:"gtd.char120.ual-sprint.v1",duration:.666667,sampleCount:41,
   runTargetMps:4,frameBasis:[0,0,0,1],tracks:tracks(true)}
 };
}
function dist(a:Quaternion,b:Quaternion){
 return 2*Math.acos(Math.min(1,Math.abs(Quaternion.Dot(a.clone().normalize(),b.clone().normalize()))));
}
describe("CHAR-120A: only existing authored sprint upper arms and elbows change",()=>{
 it("preserves standing, accepted walking and local hand orientations with the sprint file loaded",()=>{
  const a=rig(),b=rig(),{walk,sprint}=assets();
  try{
   const modified=createWalkPlayer110([a.sk],walk,[],sprint);
   const baseline=createWalkPlayer110([b.sk],walk);
   for(let i=0;i<90;i++){
    const speed=i<30?0:1.65;
    modified.update(speed,1/60,false);
    baseline.update(speed,1/60,false);
    for(const name of bones)expect(dist(a.nodes.get(name)!.rotationQuaternion!,
     b.nodes.get(name)!.rotationQuaternion!)).toBeLessThan(1e-5);
   }
   modified.reset();baseline.reset();
   for(const name of bones)expect(dist(a.nodes.get(name)!.rotationQuaternion!,
    b.nodes.get(name)!.rotationQuaternion!)).toBeLessThan(1e-5);
   modified.dispose();baseline.dispose();
  }finally{a.dispose();b.dispose();}
 });
 it("changes only local sprint Arm/ForeArm rotations; hip, legs, spine, shoulders, head, hands stay identical",()=>{
  const a=rig(),b=rig(),{walk,sprint}=assets(),muted=assets(true).sprint;
  try{
   const active=createWalkPlayer110([a.sk],walk,[],sprint);
   const reduced=createWalkPlayer110([b.sk],walk,[],muted);
   let maxArmDifference=0,maxForearmDifference=0;
   for(let i=0;i<120;i++){
    active.update(4,1/60,true);reduced.update(4,1/60,true);
    for(const name of bones){
     const angle=dist(a.nodes.get(name)!.rotationQuaternion!,
      b.nodes.get(name)!.rotationQuaternion!);
     if(name.endsWith("ForeArm"))maxForearmDifference=Math.max(maxForearmDifference,angle);
     else if(name.endsWith("Arm"))maxArmDifference=Math.max(maxArmDifference,angle);
     else expect(angle).toBeLessThan(1e-5);
    }
   }
   expect(maxArmDifference).toBeGreaterThan(.06);
   expect(maxForearmDifference).toBeGreaterThan(.06);
   active.reset();
   for(const name of bones)expect(dist(a.nodes.get(name)!.rotationQuaternion!,
    Quaternion.Identity())).toBeLessThan(1e-5);
   active.dispose();reduced.dispose();
  }finally{a.dispose();b.dispose();}
 });
 it("retains an authored elbow bend while the arm swings forward and backward",()=>{
  const r=rig(),{walk,sprint}=assets();
  try{
   const player=createWalkPlayer110([r.sk],walk,[],sprint);
   let minForearm=Infinity,maxForearm=0,minArm=Infinity,maxArm=0;
   for(let i=0;i<150;i++){
    player.update(4,1/60,true);
    if(i<20)continue; // allow sprint crossfade to complete
    const elbow=dist(r.nodes.get("RightForeArm")!.rotationQuaternion!,Quaternion.Identity());
    const arm=dist(r.nodes.get("RightArm")!.rotationQuaternion!,Quaternion.Identity());
    minForearm=Math.min(minForearm,elbow);maxForearm=Math.max(maxForearm,elbow);
    minArm=Math.min(minArm,arm);maxArm=Math.max(maxArm,arm);
   }
   // Old pure centering held near-straight elbows; partial source-relative
   // elbow bias and cycle motion must now be independently observable.
   expect(minForearm).toBeGreaterThan(.15);
   expect(maxForearm-minForearm).toBeGreaterThan(.2);
   expect(maxArm-minArm).toBeGreaterThan(.15);
   expect(player.report.sprintActive).toBe(true);
   player.dispose();
  }finally{r.dispose();}
 });
 it("CHAR-120B increases only the source-derived forearm bend, retaining full arm cadence and walk reset",()=>{
  const a=rig(),b=rig(),{walk,sprint}=assets();
  try{
   // Control removes only the mean right-forearm source bend; both clips retain
   // identical sinusoidal forearm swing and all other 21 authored tracks.
   const neutralForearm:SprintClip120={
    ...sprint,
    tracks:sprint.tracks.map(track=>track.node==="RightForeArm"?
     {...track,keys:track.keys.map((q,i)=>{
      const angle=.22*Math.sin(i/40*2*Math.PI);
      return Quaternion.RotationAxis(Vector3.Right(),angle).asArray();
     })}:track)
   };
   const enhanced=createWalkPlayer110([a.sk],walk,[],sprint);
   const control=createWalkPlayer110([b.sk],walk,[],neutralForearm);
   const diffAngles:number[]=[];
   const aAngles:number[]=[],bAngles:number[]=[];
   for(let i=0;i<125;i++){
    enhanced.update(4,1/60,true);
    control.update(4,1/60,true);
    if(i<20)continue; // allow the preexisting sprint blend to reach 1
    const left=a.nodes.get("RightForeArm")!.rotationQuaternion!;
    const right=b.nodes.get("RightForeArm")!.rotationQuaternion!;
    const toSignedX=(q:Quaternion)=>2*Math.atan2(q.x,q.w);
    const angA=toSignedX(left),angB=toSignedX(right);
    aAngles.push(angA);bAngles.push(angB);
    diffAngles.push(angA-angB);
    for(const name of bones){
     if(name.endsWith("ForeArm"))continue; // mirror causes paired forearm to follow
     expect(dist(a.nodes.get(name)!.rotationQuaternion!,
      b.nodes.get(name)!.rotationQuaternion!)).toBeLessThan(1e-5);
    }
    // CHAR-120C: signed elbow bend must now be reversed on the target rig,
    // not merely nonzero. Invert only the mean; the cycle remains unchanged.
    expect(angA-angB).toBeCloseTo(-.72,3);
    for(const side of ["Right","Left"]){
     const wristA=a.nodes.get(side+"Hand")!,wristB=b.nodes.get(side+"Hand")!;
     const elbowA=a.nodes.get(side+"ForeArm")!,elbowB=b.nodes.get(side+"ForeArm")!;
     wristA.computeWorldMatrix(true);wristB.computeWorldMatrix(true);
     elbowA.computeWorldMatrix(true);elbowB.computeWorldMatrix(true);
     const wristForwardA=wristA.getAbsolutePosition().z-elbowA.getAbsolutePosition().z;
     const wristForwardB=wristB.getAbsolutePosition().z-elbowB.getAbsolutePosition().z;
     // The corrected bend projects each hand FORWARD from its elbow instead
     // of carrying the hand backward, in this anatomically parented test rig.
     expect(wristForwardA-wristForwardB).toBeGreaterThan(.07);
    }
   }
   const excursion=(values:number[])=>Math.max(...values)-Math.min(...values);
   expect(excursion(diffAngles)).toBeLessThan(.005);
   expect(excursion(aAngles)).toBeCloseTo(excursion(bAngles),3);
   for(let i=0;i<22;i++){enhanced.update(1.65,1/60,false);control.update(1.65,1/60,false);}
   for(const name of bones)expect(dist(a.nodes.get(name)!.rotationQuaternion!,
    b.nodes.get(name)!.rotationQuaternion!)).toBeLessThan(1e-5);
   enhanced.reset();control.reset();
   for(const name of bones)expect(dist(a.nodes.get(name)!.rotationQuaternion!,
    Quaternion.Identity())).toBeLessThan(1e-5);
   enhanced.dispose();control.dispose();
  }finally{a.dispose();b.dispose();}
 });

});
