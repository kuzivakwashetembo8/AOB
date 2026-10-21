/** CHAR-110E research-driven sagittal gate: source UAL -> raw retarget -> corrected.
 * Quantifies both feet overtaking one another; previous lane checks were X-only.
 * No animation is modified by this script.
 */
import {readFileSync} from "node:fs";
import {Matrix,Quaternion,Vector3} from "@babylonjs/core";

const Q=v=>new Quaternion(...v).normalize();
const sourcePath="public/GLBs/Characters/ual.glb";
const targetPath="public/GLBs/Characters/character.glb";
function loadGLB(path){
 const buf=readFileSync(path);
 if(buf.toString("ascii",0,4)!=="glTF")throw Error("CHAR110E GLB magic: "+path);
 const len=buf.readUInt32LE(12),json=JSON.parse(buf.toString("utf8",20,20+len));
 const offset=20+len, bin=buf.subarray(offset+8,offset+8+buf.readUInt32LE(offset));
 const names=new Map(json.nodes.map((n,i)=>[n.name,i]));
 const parent=json.nodes.map(()=>-1);
 json.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>parent[c]=i));
 const rest=json.nodes.map(n=>{
  if(n.matrix){const s=new Vector3(),q=Quaternion.Identity(),t=new Vector3();if(!Matrix.FromArray(n.matrix).decompose(s,q,t))throw Error("Bad matrix");return {s,q,t};}
  return {s:Vector3.FromArray(n.scale??[1,1,1]),q:Q(n.rotation??[0,0,0,1]),t:Vector3.FromArray(n.translation??[0,0,0])};
 });
 function accessor(i){
  const a=json.accessors[i],v=json.bufferViews[a.bufferView],count={SCALAR:1,VEC3:3,VEC4:4}[a.type];
  if(!count||a.componentType!==5126||a.sparse)throw Error("Unsupported glTF accessor: "+i);
  const stride=v.byteStride??count*4;
  return Array.from({length:a.count},(_,k)=>Array.from({length:count},(_,j)=>
   bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+k*stride+j*4)));
 }
 return {json,names,parent,rest,accessor};
}
const source=loadGLB(sourcePath),target=loadGLB(targetPath);
const raw=JSON.parse(readFileSync(".char110-raw-walk.json","utf8"));
const corrected=JSON.parse(readFileSync("public/GLBs/Characters/char110-ual-walk.json","utf8"));
const native=JSON.parse(readFileSync(".char110-native-walk.json","utf8"));
const COUNT=81;
function timeKeys(values,times,at,path){
 let i=0;while(i<times.length-2&&times[i+1]<at)i++;
 const alpha=Math.max(0,Math.min(1,(at-times[i])/(times[i+1]-times[i])));
 if(path==="rotation"){const a=Q(values[i]),b=Q(values[i+1]);return Quaternion.Slerp(a,b,alpha);}
 return Vector3.Lerp(Vector3.FromArray(values[i]),Vector3.FromArray(values[i+1]),alpha);
}
const walk=source.json.animations.find(a=>a.name==="Walk_Loop");
if(!walk)throw Error("Missing UAL source walk");
const chs=new Map();const translationAudit=[];
for(const ch of walk.channels){
 const s=walk.samplers[ch.sampler],node=ch.target.node;
 const track={path:ch.target.path,interp:s.interpolation??"LINEAR",
  times:source.accessor(s.input).map(x=>x[0]),values:source.accessor(s.output)};
 if(!["LINEAR","STEP"].includes(track.interp))throw Error("Unsupported source interpolation");
 if(!chs.has(node))chs.set(node,new Map());
 chs.get(node).set(track.path,track);
 if(track.path==="translation"){
  const origin=track.values[0];
  const excursion=Math.max(...track.values.map(v=>Math.hypot(...v.map((x,i)=>x-origin[i]))));
  translationAudit.push({name:source.json.nodes[node].name,maxExcursion:+excursion.toFixed(4)});
 }
}
const samples=Math.max(...[...chs.values()].flatMap(m=>[...m.values()].map(t=>t.times.at(-1))));
function pose(joint,duration,clip,idx){
 const durationPos=duration*idx/(COUNT-1);
 const cache=new Array(joint.json.nodes.length);
 const tracks=clip?.tracks?new Map(clip.tracks.map(t=>[t.node,t])):null;
 function calculate(i){
  if(cache[i])return cache[i];
  const {s,q,t}=joint.rest[i],node=joint.json.nodes[i];
  let rotation=q,translation=t;
  if(tracks?.has(node.name)){
   const k=tracks.get(node.name).keys,scaled=idx*(k.length-1)/(COUNT-1);
   const first=Math.min(k.length-2,Math.floor(scaled));
   const rot=Quaternion.Slerp(Q(k[first]),Q(k[first+1]),scaled-first);
   rotation=rot.multiply(q).normalize();
  }else if(!tracks){
   const anim=chs.get(i);
   if(anim?.has("rotation")){const tr=anim.get("rotation");rotation=timeKeys(tr.values,tr.times,durationPos,"rotation");}
   if(anim?.has("translation")){const tr=anim.get("translation");translation=timeKeys(tr.values,tr.times,durationPos,"translation");}
  }
  const own=Matrix.Compose(s,rotation,translation),p=joint.parent[i];
  return cache[i]=p===-1?own:own.multiply(calculate(p));
 }
 const hip=joint.names.get(clip?"Hips":"pelvis");
 const left=joint.names.get(clip?"LeftFoot":"foot_l");
 const right=joint.names.get(clip?"RightFoot":"foot_r");
 if([hip,left,right].some(x=>x===undefined))throw Error("Rig missing hip or feet");
 const parentInv=Matrix.Invert(calculate(hip));
 const relative=i=>Vector3.TransformCoordinates(Vector3.Zero(),calculate(i).multiply(parentInv));
 return {left:relative(left),right:relative(right)};
}
function measure(label,asset,clip){
 const values=Array.from({length:COUNT},(_,i)=>pose(asset,samples,clip,i));
 const zs=values.map(v=>v.left.z-v.right.z),ts=values.map((v,i)=>({phase:+(i/(COUNT-1)).toFixed(3),left:+v.left.z.toFixed(4),right:+v.right.z.toFixed(4),lead:+zs[i].toFixed(4),
  leftH:+v.left.y.toFixed(4),rightH:+v.right.y.toFixed(4)}));
 const pos=zs.filter(v=>v>.035).length,neg=zs.filter(v=>v<-.035).length;
 const min=Math.min(...zs),max=Math.max(...zs);
 const excursion=v=>Math.max(...v)-Math.min(...v);
 const leftZ=values.map(v=>v.left.z),rightZ=values.map(v=>v.right.z);
 const amplitudeRatio=Math.min(excursion(leftZ),excursion(rightZ))/Math.max(excursion(leftZ),excursion(rightZ));
 const crossings=zs.reduce((acc,v,i)=>i>0&&Math.sign(v)!==Math.sign(zs[i-1])&&Math.abs(v)>0.01&&Math.abs(zs[i-1])>0.01?acc+1:acc,0);
 const result={label,steps:COUNT,minLead:+min.toFixed(4),maxLead:+max.toFixed(4),
  leftLeadingFrames:pos,rightLeadingFrames:neg,crossings,
  leftExcursion:+excursion(leftZ).toFixed(4),rightExcursion:+excursion(rightZ).toFixed(4),
  excursionRatio:+amplitudeRatio.toFixed(3),head:ts.filter((_,i)=>i%5===0)};
 console.info("CHAR110E_PHASE_"+label+"="+JSON.stringify(result));
 return result;
}
const sourceResult=measure("UAL",source,null);
const rawResult=measure("RAW",target,raw);
const fixedResult=measure("CORRECTED",target,corrected);
const nativeResult=measure("NATIVE",target,native);
const translated=translationAudit.filter(t=>t.maxExcursion>.005).sort((a,b)=>b.maxExcursion-a.maxExcursion);
console.info("CHAR110E_TRANSLATION="+JSON.stringify({totalTranslationChannels:translationAudit.length,animated:translated.slice(0,35)}));
const gate=r=>r.leftLeadingFrames>=5&&r.rightLeadingFrames>=5&&r.minLead<-.04&&r.maxLead>.04&&r.excursionRatio>.4;
const balanced=r=>{
 const a=Math.abs(r.minLead),b=Math.abs(r.maxLead);
 const ratio=Math.min(a,b)/Math.max(a,b);
 return r.leftLeadingFrames>=32&&r.rightLeadingFrames>=32&&ratio>=.75&&ratio<=1&&r.excursionRatio>=.7;
};
const assessment={source:gate(sourceResult),raw:gate(rawResult),corrected:gate(fixedResult),native:gate(nativeResult),
 sourceBalanced:balanced(sourceResult),rawBalanced:balanced(rawResult),correctedBalanced:balanced(fixedResult),nativeBalanced:balanced(nativeResult),
 sourceWasAlternating:sourceResult.minLead<-.04&&sourceResult.maxLead>.04};
console.info("CHAR110E_VERDICT="+JSON.stringify(assessment));
if(!assessment.sourceWasAlternating||!assessment.sourceBalanced)throw Error("CHAR110E source measurements invalid; calibration requires investigation");
if(!assessment.nativeBalanced||!assessment.correctedBalanced)
 throw Error("CHAR110E gait FAIL: Voight must alternately lead with both feet for similar fractions and distances (source matched but target not)");
// A/B diagnostic pass is informational until a candidate is chosen; DO NOT
// mistake this diagnostic-only build for the accepted walking checkpoint.
