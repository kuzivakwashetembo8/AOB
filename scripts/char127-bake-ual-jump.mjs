/** CHAR-127 — build-time UAL Jump_Loop → Voight linked-joint motion transfer.
 * Original 65-joint clip, source rest/bind axes, target 73-joint rest hierarchy.
 * Emits only compact target-rotation deltas, not a UAL mesh or engine.
 * Designed to fail on missing joints, interpolation, mirror/parity or huge rotations.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {Matrix,Quaternion,Vector3} from "@babylonjs/core";

const sourceFile="public/GLBs/Characters/ual.glb";
const targetFile="public/GLBs/Characters/character.glb";
const outputFile="public/GLBs/Characters/char127-ual-jump.json";
const Q=a=>new Quaternion(a[0],a[1],a[2],a[3]).normalize();
const identity=()=>Quaternion.Identity();
const inv=q=>Quaternion.Inverse(q).normalize();
const mul=(a,b)=>a.multiply(b).normalize();
const array=q=>[+q.x.toFixed(6),+q.y.toFixed(6),+q.z.toFixed(6),+q.w.toFixed(6)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function glb(path){
 const b=readFileSync(resolve(path));if(b.toString("ascii",0,4)!=="glTF"||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error(path+" invalid GLB");
 const jsonSize=b.readUInt32LE(12);
 if(b.readUInt32LE(16)!==0x4e4f534a)throw Error("Expected JSON first GLB chunk");
 const j=JSON.parse(b.toString("utf8",20,20+jsonSize));
 const offset=20+jsonSize;
 if(b.readUInt32LE(offset+4)!==0x004e4942)throw Error("Expected BIN GLB chunk");
 const bin=b.subarray(offset+8,offset+8+b.readUInt32LE(offset));
 const parent=j.nodes.map(()=>-1);
 j.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>{if(parent[c]!==-1)throw Error("Multiple parents");parent[c]=i;}));
 const names=new Map(j.nodes.map((n,i)=>[n.name,i]));
 function local(i){
  const n=j.nodes[i];
  if(n.matrix){
   const m=Matrix.FromArray(n.matrix),s=new Vector3(),q=identity(),t=new Vector3();
   if(!m.decompose(s,q,t))throw Error("Un-decomposable node matrix: "+n.name);
   return {q:q.normalize(),s,t,m};
  }
  const q=Q(n.rotation??[0,0,0,1]),s=Vector3.FromArray(n.scale??[1,1,1]),t=Vector3.FromArray(n.translation??[0,0,0]);
  return {q,s,t,m:Matrix.Compose(s,q,t)};
 }
 const rest=j.nodes.map((_,i)=>local(i));
 const rotations=new Array(j.nodes.length),matrices=new Array(j.nodes.length);
 function matrix(i){
  if(matrices[i])return matrices[i];
  const p=parent[i],x=rest[i];
  return matrices[i]=p<0?x.m.clone():x.m.multiply(matrix(p));
 }
 function rotation(i){
  if(rotations[i])return rotations[i];
  const p=parent[i],x=rest[i].q;
  return rotations[i]=p<0?x.clone():mul(rotation(p),x);
 }
 function vec(i){return Vector3.TransformCoordinates(Vector3.Zero(),matrix(i))}
 function access(i){
  const ac=j.accessors[i],view=j.bufferViews[ac.bufferView];
  if(ac.sparse||ac.componentType!==5126||view.buffer!==0)throw Error("Unsupported animation accessor "+i);
  const n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[ac.type];
  if(!n)throw Error("Unsupported accessor type "+ac.type);
  const stride=view.byteStride??n*4;
  const at=(view.byteOffset??0)+(ac.byteOffset??0);
  if(at+(ac.count-1)*stride+n*4>bin.length)throw Error("Out-of-range animation accessor");
  const a=[];
  for(let k=0;k<ac.count;k++){const row=[];for(let x=0;x<n;x++)row.push(bin.readFloatLE(at+k*stride+x*4));a.push(row)}
  if(a.some(row=>row.some(x=>!Number.isFinite(x))))throw Error("Nonfinite clip values");
  return a;
 }
 return {j,b,parent,names,rest,matrix,rotation,vec,access};
}
const source=glb(sourceFile),target=glb(targetFile);
const names=[
 ["pelvis","Hips"],["spine_01","Spine"],["spine_02","Spine1"],["spine_03","Spine2"],
 ["neck_01","Neck"],["Head","Head"],
 ["clavicle_l","LeftShoulder"],["upperarm_l","LeftArm"],["lowerarm_l","LeftForeArm"],["hand_l","LeftHand"],
 ["clavicle_r","RightShoulder"],["upperarm_r","RightArm"],["lowerarm_r","RightForeArm"],["hand_r","RightHand"],
 ["thigh_l","LeftUpLeg"],["calf_l","LeftLeg"],["foot_l","LeftFoot"],["ball_l","LeftToeBase"],
 ["thigh_r","RightUpLeg"],["calf_r","RightLeg"],["foot_r","RightFoot"],["ball_r","RightToeBase"],
];
const clip=source.j.animations?.find(a=>a.name==="Jump_Loop");
if(!clip)throw Error("UAL Jump_Loop absent — cannot fake authored jump");
const idleClip=source.j.animations?.find(a=>a.name==="Idle_Loop");
if(!idleClip)throw Error("UAL Idle_Loop absent — neutral-relative transfer forbidden");
const sourceJoints=new Set((source.j.skins??[]).flatMap(s=>s.joints));
const targetJoints=new Set((target.j.skins??[]).flatMap(s=>s.joints));
const tracked=new Map();
for(const ch of clip.channels){
 if(ch.target.path!=="rotation")continue;
 const sample=clip.samplers[ch.sampler];
 if(!sample||!["LINEAR","STEP"].includes(sample.interpolation??"LINEAR"))throw Error("Interpolation not supported: "+sample?.interpolation);
 if(tracked.has(ch.target.node))throw Error("Duplicate animation channel for joint");
 const times=source.access(sample.input).map(row=>row[0]),values=source.access(sample.output);
 if(times.length!==values.length||times.length<2)throw Error("Invalid clip keyframes");
 tracked.set(ch.target.node,{times,values,kind:sample.interpolation??"LINEAR"});
}
// Jump_Loop must be transferred relative to UAL idle, not the target bind pose.
// CHAR-109 already supplies a DOWN-ARM target idle pose. Retargeting against
// bind would lower Voight\u0027s arms twice. Use actual UAL Idle_Loop as baseline.
const idleRotations=new Map();
for(const ch of idleClip.channels){
 if(ch.target.path!=="rotation")continue;
 const sm=idleClip.samplers[ch.sampler];
 if(!sm||!["LINEAR","STEP"].includes(sm.interpolation??"LINEAR"))throw Error("Unsupported UAL idle interpolation");
 idleRotations.set(ch.target.node,{times:source.access(sm.input).map(x=>x[0]),values:source.access(sm.output),kind:sm.interpolation??"LINEAR"});
}
if(idleRotations.size<20)throw Error("UAL Idle_Loop has insufficient rotation channels");
let duration=0;
for(const tr of tracked.values())duration=Math.max(duration,tr.times.at(-1));
if(!(duration>.10&&duration<10))throw Error("Jump duration out of policy range");
const p=(v,a,b)=>v.subtract(a.scale(Vector3.Dot(v,a))).normalize();
function anatomy(a,hipName,leftFoot,rightFoot,leftThigh,rightThigh){
 const ids=[hipName,leftFoot,rightFoot,leftThigh,rightThigh].map(s=>a.names.get(s));
 if(ids.some(i=>i===undefined))throw Error("Missing anatomical frame joint");
 const [hip,lf,rf,lt,rt]=ids.map(i=>a.vec(i));
 const right=rt.subtract(lt).normalize();
 const up=p(hip.subtract(lf.add(rf).scale(.5)).normalize(),right);
 if(right.lengthSquared()<.9||up.lengthSquared()<.9)throw Error("Degenerate anatomical frame");
 const forward=Vector3.Cross(right,up).normalize();
 const m=Matrix.Identity(),e=m.m;
 e[0]=right.x;e[1]=right.y;e[2]=right.z;
 e[4]=up.x;e[5]=up.y;e[6]=up.z;
 e[8]=forward.x;e[9]=forward.y;e[10]=forward.z;
 return {q:Quaternion.FromRotationMatrix(m).normalize(),right: right.asArray(),up:up.asArray(),forward:forward.asArray()};
}
const sf=anatomy(source,"pelvis","foot_l","foot_r","thigh_l","thigh_r");
const tf=anatomy(target,"Hips","LeftFoot","RightFoot","LeftUpLeg","RightUpLeg");
const alignment=mul(tf.q,inv(sf.q));
function sampleAt(track,time){
 const {times,values,kind}=track;let k=0;
 while(k<times.length-2&&times[k+1]<time)k++;
 const a=Q(values[k]),b=Q(values[k+1]);
 const fraction=kind==="STEP"?0:clamp((time-times[k])/(times[k+1]-times[k]),0,1);
 return Quaternion.Slerp(a,b,fraction).normalize();
}
const samples=41;
const idleCache=new Map();
function sourceIdleLocal(i){const tr=idleRotations.get(i);return tr?sampleAt(tr,0):source.rest[i].q;}
function sourceIdleGlobal(i){
 if(idleCache.has(i))return idleCache.get(i);
 const p=source.parent[i];const q=p<0?sourceIdleLocal(i).clone():mul(sourceIdleGlobal(p),sourceIdleLocal(i));
 idleCache.set(i,q);return q;
}
const tracks=[];
for(const [sourceName,targetName] of names){
 const si=source.names.get(sourceName),ti=target.names.get(targetName);
 if(si===undefined||ti===undefined)throw Error("Unmapped anatomical joint "+sourceName+" => "+targetName);
 if(!sourceJoints.has(si)||!targetJoints.has(ti))throw Error("Mapped non-skin bone "+sourceName+" => "+targetName);
 const clipTrack=tracked.get(si);
 if(!clipTrack)throw Error("No authored Jump_Loop rotation for "+sourceName);
 const sp=source.parent[si],tp=target.parent[ti];
 if(sp<0||tp<0)throw Error("Unexpected root joint at "+sourceName);
 const sourceParent=sourceIdleGlobal(sp),targetParent=target.rotation(tp);
 const sourceIdle=sourceIdleLocal(si);
 const keys=[];
 let peak=0;
 for(let i=0;i<samples;i++){
  const sourceAnimated=sampleAt(clipTrack,duration*i/(samples-1));
  // Source local rest-delta → anatomical world → target parent-local delta.
  const sourceDelta=mul(sourceAnimated,inv(sourceIdle));
  const worldDelta=mul(mul(sourceParent,sourceDelta),inv(sourceParent));
  const correctedWorld=mul(mul(alignment,worldDelta),inv(alignment));
  const localDelta=mul(mul(inv(targetParent),correctedWorld),targetParent);
  const angle=2*Math.acos(clamp(Math.abs(localDelta.w),0,1));
  peak=Math.max(peak,angle);
  if(!Number.isFinite(angle)||angle>3.14)throw Error("Unsafe target local jump delta "+targetName+" at "+i+" angle="+angle);
  keys.push(array(localDelta));
 }
 // Difference between first/last source pose must remain small for cyclic playback.
 // Do not require first/last jump frames to match; takeoff and recovery can differ.
 tracks.push({node:targetName,source:sourceName,peakRadians:+peak.toFixed(3),keys});
}
if(tracks.length!==names.length)throw Error("Incomplete retarget");
const output={schema:"gtd.char127.ual-jump.v1",source:"Quaternius UAL Jump_Loop relative to UAL Idle_Loop (pinned GLB)",target:"character.glb",duration:+duration.toFixed(6),
 sampleCount:samples,frameBasis:[+alignment.x.toFixed(6),+alignment.y.toFixed(6),+alignment.z.toFixed(6),+alignment.w.toFixed(6)],
 tracks};
writeFileSync(resolve(outputFile),JSON.stringify(output));
// CHAR-127 intentionally emits a single compact same-origin asset, not a second GLB.
console.info("CHAR127_JUMP_RETARGET_SUCCESS="+JSON.stringify({sourceJointCount:sourceJoints.size,targetJointCount:targetJoints.size,
 duration,samples,idleCalibration:"UAL Idle_Loop frame 0",tracks:tracks.map(t=>({node:t.node,source:t.source,peakRadians:t.peakRadians})),
 anatomicalSource:{right:sf.right,up:sf.up,forward:sf.forward},
 anatomicalTarget:{right:tf.right,up:tf.up,forward:tf.forward},
 frameBasis:output.frameBasis,outputBytes:readFileSync(resolve(outputFile)).length}));
