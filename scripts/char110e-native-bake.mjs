/** CHAR-110E Babylon 9 reference-matrix retarget A/B, build-only.
 * Implements the documented AnimatorAvatar.retargetAnimationGroup quaternion
 * change-of-basis exactly, on the original GLB joint reference matrices.
 * Does not change runtime until source/native/corrected phase metrics pass.
 * Source: BabylonJS/packages/dev/core/src/Animations/animatorAvatar.ts.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {Matrix,Quaternion,Vector3} from "@babylonjs/core";
const sourceFile="public/GLBs/Characters/ual.glb";
const targetFile="public/GLBs/Characters/character.glb";
const rawFile=".char110-raw-walk.json";
function glb(path){
 const b=readFileSync(path),n=b.readUInt32LE(12);
 if(b.toString("ascii",0,4)!=="glTF")throw Error("Invalid GLB");
 const j=JSON.parse(b.toString("utf8",20,20+n)),offset=20+n;
 const bin=b.subarray(offset+8,offset+8+b.readUInt32LE(offset));
 const parents=j.nodes.map(()=>-1);
 j.nodes.forEach((v,i)=>(v.children??[]).forEach(c=>parents[c]=i));
 const names=new Map(j.nodes.map((v,i)=>[v.name,i]));
 const rest=j.nodes.map(v=>{
  if(v.matrix){const sc=new Vector3(),rot=Quaternion.Identity(),pos=new Vector3();if(!Matrix.FromArray(v.matrix).decompose(sc,rot,pos))throw Error("bad rest");return {sc,rot,pos};}
  return {sc:Vector3.FromArray(v.scale??[1,1,1]),rot:new Quaternion(...(v.rotation??[0,0,0,1])).normalize(),pos:Vector3.FromArray(v.translation??[0,0,0])};
 });
 const matrices=new Array(j.nodes.length);
 function world(i){if(matrices[i])return matrices[i];const p=parents[i],r=rest[i],m=Matrix.Compose(r.sc,r.rot,r.pos);
   return matrices[i]=p<0?m:m.multiply(world(p));}
 function access(i){const a=j.accessors[i],v=j.bufferViews[a.bufferView];
  const count={SCALAR:1,VEC3:3,VEC4:4}[a.type];
  if(!count||a.componentType!==5126||a.sparse)throw Error("Unsupported accessor "+i);
  const stride=v.byteStride??count*4;
  return Array.from({length:a.count},(_,k)=>Array.from({length:count},(_,x)=>
    bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+k*stride+x*4)));
 }
 return {j,names,parents,rest,world,access};
}
const src=glb(sourceFile),dst=glb(targetFile);
const data=JSON.parse(readFileSync(rawFile,"utf8")),output=structuredClone(data);
const clip=src.j.animations.find(x=>x.name==="Walk_Loop");if(!clip)throw Error("Missing Walk_Loop");
const byJoint=new Map();
for(const c of clip.channels){
 if(c.target.path!=="rotation")continue;
 const sampler=clip.samplers[c.sampler];
 if((sampler.interpolation??"LINEAR")!=="LINEAR")throw Error("Unsupported interpolation");
 byJoint.set(c.target.node,{times:src.access(sampler.input).map(t=>t[0]),
    rots:src.access(sampler.output).map(q=>new Quaternion(...q).normalize())});
}
function sample(tr,time){
 let a=0;
 while(a<tr.times.length-2&&tr.times[a+1]<time)a++;
 const span=Math.max(1e-7,tr.times[a+1]-tr.times[a]);
 return Quaternion.Slerp(tr.rots[a],tr.rots[a+1],Math.min(1,Math.max(0,(time-tr.times[a])/span))).normalize();
}
const changed=[];
const anatomical=new Map([
 ["Hips","pelvis"],["LeftUpLeg","thigh_l"],["LeftLeg","calf_l"],["LeftFoot","foot_l"],["LeftToeBase","ball_l"],
 ["RightUpLeg","thigh_r"],["RightLeg","calf_r"],["RightFoot","foot_r"],["RightToeBase","ball_r"]
]);
for(const track of output.tracks){
 if(!anatomical.has(track.node))continue;
 const sourceName=anatomical.get(track.node);
 const si=src.names.get(sourceName),ti=dst.names.get(track.node);
 if(si===undefined||ti===undefined)throw Error("Missing target joint: "+track.node);
 const sp=src.parents[si],tp=dst.parents[ti];
 if(sp<0||tp<0)throw Error("Unexpected parent on "+sourceName);
 // Mirror the core AnimatorAvatar._retargetAnimationKeys transform:
 // targetWorldRest * sourceWorldRest^-1 * localAnim * sourceParentRest *
 // targetParentRest^-1. Each joint gets its own reference frame.
 const sourceInv=Matrix.Invert(src.world(si)),targetParentInv=Matrix.Invert(dst.world(tp));
 const srcParentWorld=src.world(sp),targetWorld=dst.world(ti);
 const rS=src.rest[si],rT=dst.rest[ti],tr=byJoint.get(si);
 if(!tr)throw Error("Missing source native track: "+sourceName);
 const baseline=track.keys.map(q=>new Quaternion(...q).normalize());
 const keys=[];
 for(let k=0;k<data.sampleCount;k++){
  const time=data.duration*k/(data.sampleCount-1);
  const local=Matrix.Compose(rS.sc,sample(tr,time),rS.pos);
  const x=sourceInv.multiply(local).multiply(srcParentWorld);
  const newLocal=targetWorld.multiply(x).multiply(targetParentInv);
  const q=Quaternion.Identity(),scale=new Vector3(),trans=new Vector3();
  if(!newLocal.decompose(scale,q,trans))throw Error("Cannot decompose "+track.node+" @ "+k);
  const delta=q.normalize().multiply(Quaternion.Inverse(rT.rot)).normalize();
  if(!Number.isFinite(delta.x)||!Number.isFinite(delta.y)||!Number.isFinite(delta.z)||!Number.isFinite(delta.w))throw Error("Bad native delta");
  const angle=2*Math.acos(Math.min(1,Math.abs(delta.w)));
  if(angle>2.8)throw Error("Native delta too large "+track.node+" "+angle);
  keys.push([delta.x,delta.y,delta.z,delta.w].map(x=>+x.toFixed(6)));
 }
 track.keys=keys;
 const maxDifference=Math.max(...keys.map((q,i)=>{
   const d=Math.abs(Quaternion.Dot(new Quaternion(...q),baseline[i]));
   return 2*Math.acos(Math.max(0,Math.min(1,d)));
 }));
 changed.push({joint:track.node,maxDifference:+maxDifference.toFixed(4)});
}
output.retargetMethod="Babylon9 per-bone reference-matrix quaternion, compared without downstream lane/shoe/forearm correction";
writeFileSync(".char110-native-walk.json",JSON.stringify(output));
console.info("CHAR110E_NATIVE_BAKE="+JSON.stringify({joints:changed,mode:"AB research candidate only",bytes:readFileSync(".char110-native-walk.json").length}));
