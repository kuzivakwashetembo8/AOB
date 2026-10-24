/** CHAR-129 Phase 0 — audit actual character.glb anatomical lanes before native flight.
 * No UAL import or mesh rewrite. Build fails if the target asset changes its
 * critical joint hierarchy, side ordering or geometry unexpectedly.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {Matrix,Quaternion,Vector3} from "@babylonjs/core";
const blob=readFileSync(resolve("public/GLBs/Characters/character.glb"));
if(blob.toString("ascii",0,4)!=="glTF"||blob.readUInt32LE(4)!==2||
 blob.readUInt32LE(8)!==blob.length||blob.readUInt32LE(16)!==0x4e4f534a)
 throw Error("CHAR129 actual character.glb unreadable or corrupt");
const gltf=JSON.parse(blob.toString("utf8",20,20+blob.readUInt32LE(12)));
const names=new Map(gltf.nodes.map((n,i)=>[n.name,i]));
const required=["Hips","Spine","Spine1","Spine2","Head",
 "LeftShoulder","RightShoulder","LeftArm","RightArm","LeftForeArm","RightForeArm",
 "LeftHand","RightHand","LeftUpLeg","RightUpLeg","LeftLeg","RightLeg",
 "LeftFoot","RightFoot","LeftToeBase","RightToeBase"];
for(const k of required)if(!names.has(k))throw Error("CHAR129 missing real target GLB joint "+k);
const parents=gltf.nodes.map(()=>-1);
gltf.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>{
 if(parents[c]!==-1)throw Error("CHAR129 ambiguous parent "+gltf.nodes[c]?.name);
 parents[c]=i;
}));
const skin=new Set((gltf.skins??[]).flatMap(s=>s.joints));
for(const k of required)if(!skin.has(names.get(k)))
 throw Error("CHAR129 unmapped skinned target "+k);
function local(i){
 const n=gltf.nodes[i];
 if(n.matrix)return Matrix.FromArray(n.matrix);
 const q=Quaternion.FromArray(n.rotation??[0,0,0,1]).normalize();
 return Matrix.Compose(Vector3.FromArray(n.scale??[1,1,1]),q,
  Vector3.FromArray(n.translation??[0,0,0]));
}
const matCache=new Map();
function world(i){
 if(matCache.has(i))return matCache.get(i);
 const p=parents[i],matrix=local(i);
 const result=p<0?matrix:matrix.multiply(world(p));
 matCache.set(i,result);return result;
}
const position=(key)=>Vector3.TransformCoordinates(Vector3.Zero(),world(names.get(key)));
const lS=position("LeftShoulder"),rS=position("RightShoulder");
const lateral=rS.subtract(lS);
const span=lateral.length();
if(!Number.isFinite(span)||span<.0001)throw Error("CHAR129 collapsed shoulder span");
const side=lateral.scale(1/span),hips=position("Hips");
const coordinates=Object.fromEntries(required.map(k=>[
 k,[...position(k).asArray()].map(x=>+x.toFixed(6))]));
const signed={};
for(const name of ["LeftHand","RightHand","LeftLeg","RightLeg","LeftFoot","RightFoot","LeftToeBase","RightToeBase"])
 signed[name]=+Vector3.Dot(position(name).subtract(hips),side).toFixed(6);
for(const [left,right] of [
 ["LeftHand","RightHand"],["LeftLeg","RightLeg"],
 ["LeftFoot","RightFoot"],["LeftToeBase","RightToeBase"]]){
 const l=signed[left],r=signed[right];
 if(!(Number.isFinite(l)&&Number.isFinite(r)&&l<r))
  throw Error("CHAR129 real GLB side ordering invalid: "+left+" "+l+" >= "+right+" "+r);
}
const ankleGap=Vector3.Distance(position("LeftFoot"),position("RightFoot"));
const wristGap=Vector3.Distance(position("LeftHand"),position("RightHand"));
if(!(ankleGap>span*.04&&wristGap>span*.04))
 throw Error("CHAR129 real GLB collapsed bilateral wrist/ankle baseline");
const result={schema:"gtd.char129.native-rig.audit.v1",
 sha256:createHash("sha256").update(blob).digest("hex"),bytes:blob.length,
 source:"character.glb",skinJoints:[...skin].length,shoulderSpan:span,
 wristGap,ankleGap,sideOrder:signed,
 parentChains:Object.fromEntries(required.map(k=>{
  let i=names.get(k),chain=[];
  while(i>=0){chain.push(gltf.nodes[i].name??i);i=parents[i];if(chain.length>50)throw Error("loop");}
  return [k,chain];
 })),jointPositions:coordinates};
console.info("CHAR129_NATIVE_RIG_AUDIT="+JSON.stringify(result));
