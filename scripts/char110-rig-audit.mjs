/** CHAR-110A: audit actual UAL and Voight GLB skeletal frames before retargeting.
 * Uses independently staged pinned UAL bytes and owner GLB; does not mutate assets.
 * Intentionally reports only anatomy, animation channels and coord frames.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
function glb(path){
 const b=readFileSync(resolve(path));if(b.toString("ascii",0,4)!=="glTF"||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error(path+" invalid GLB");
 if(b.readUInt32LE(16)!==0x4e4f534a)throw Error(path+" missing JSON chunk");
 const j=JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12)));
 const parent=(j.nodes??[]).map(()=>-1);
 for(let i=0;i<(j.nodes??[]).length;i++)for(const c of j.nodes[i].children??[])parent[c]=i;
 const name=i=>(j.nodes[i]?.name??"["+i+"]");
 const chain=i=>{const v=[];for(let n=0;i>=0&&n<8;n++,i=parent[i])v.push(name(i));return v.join(" > ")};
 return {j,b,parent,name,chain};
}
const u=glb("public/GLBs/Characters/ual.glb"),v=glb("public/GLBs/Characters/character.glb");
function basic(a,tag){
 const {j,name,chain}=a; const normalized=s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
 const joints=(j.skins??[]).flatMap(s=>s.joints??[]);
 const critical=joints.filter(i=>/(pelvis|hips|spine|neck|head|clavicle|shoulder|arm|hand|thigh|upleg|leg|calf|foot|ball|toe)/i.test(name(i))&&!/(finger|thumb|index|middle|ring|pinky|twist|end|ik)/i.test(name(i)));
 console.log("CHAR110_"+tag+"_HEAD="+JSON.stringify({bytes:a.b.length,nodes:j.nodes.length,skins:j.skins?.map(s=>s.joints.length),meshes:j.meshes?.length,clips:j.animations?.map(x=>x.name),criticalCount:critical.length}));
 for(const i of critical) console.log("CHAR110_"+tag+"_JOINT="+JSON.stringify({name:name(i),chain:chain(i),t:j.nodes[i].translation??null,r:j.nodes[i].rotation??null,s:j.nodes[i].scale??null,matrix:j.nodes[i].matrix?.slice(0,16)??null}));
}
basic(u,"UAL");basic(v,"VOIGHT");
const clip=u.j.animations?.find(x=>x.name==="Walk_Loop");if(!clip)throw Error("CHAR110 source UAL Walk_Loop missing");
const counts={};const sample=[];
for(const ch of clip.channels??[]){
 const node=ch.target?.node;
 const n=u.name(node);
 const path=ch.target?.path??"?";
 counts[path]=(counts[path]??0)+1;
 const sampler=clip.samplers[ch.sampler],inAcc=u.j.accessors?.[sampler.input],outAcc=u.j.accessors?.[sampler.output];
 if(/^(pelvis|root|hips|thigh_l|calf_l|foot_l|thigh_r|calf_r|foot_r|upperarm_l|lowerarm_l|upperarm_r|lowerarm_r|spine_01|spine_02|head)$/i.test(n)){
  sample.push({node:n,path,interpolation:sampler.interpolation??"LINEAR",samples:inAcc?.count,times:[inAcc?.min,inAcc?.max],vtype:outAcc?.type,component:outAcc?.componentType});
 }
}
console.log("CHAR110_WALK_CLIP="+JSON.stringify({channels:clip.channels?.length,samplers:clip.samplers?.length,paths:counts,sample}));
