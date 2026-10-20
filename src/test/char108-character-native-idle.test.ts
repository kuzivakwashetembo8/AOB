// @vitest-environment jsdom
/**
 * CHAR-108 read-only capability check of the OWNED binary. The GLB JSON chunk
 * tells us exactly which animation tracks exist; bone names alone do not prove
 * a usable idle clip. Build farm checks local source bytes, not a GitHub text API.
 */
import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
export type GltfRig108={
  nodes?:Array<{name?:string;children?:number[];rotation?:number[];translation?:number[];scale?:number[]}>;
  skins?:Array<{joints:number[];inverseBindMatrices?:number;skeleton?:number}>;
  meshes?:Array<{primitives?:Array<{attributes?:Record<string,number>}>}>;
  animations?:Array<{name?:string;samplers?:unknown[];channels?:Array<{target:{node?:number;path:string}}>}>;};
export function readGlbSource108():GltfRig108{
 const b=readFileSync(resolve(process.cwd(),"public/GLBs/Characters/character.glb"));
 if(b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error("invalid GLB");
 if(b.readUInt32LE(16)!==0x4e4f534a)throw Error("missing JSON first chunk");
 return JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12))) as GltfRig108;
}
const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
export function findNativeIdle108(animations:NonNullable<GltfRig108["animations"]>){
 return animations.find(a=>/^idle(?:\d+|loop)?$/.test(norm(a.name??""))&&(a.channels??[]).length>0)??null;
}
describe("CHAR-108 native human GLB animation and rig inventory",()=>{
 it("inspects source animation names and skeletal capability, without inventing a clip",()=>{
  const j=readGlbSource108(),nodes=j.nodes??[],skins=j.skins??[],animations=j.animations??[];
  const armNames=["LeftShoulder","LeftArm","LeftForeArm","RightShoulder","RightArm","RightForeArm"];
  for(const name of armNames)expect(nodes.some(n=>norm(n.name??"")===norm(name))).toBe(true);
  expect(skins[0]?.joints.length).toBe(73);
  const evidence={
   skinCount:skins.length,boneCount:skins.map(s=>s.joints.length),
   nativeIdle:findNativeIdle108(animations)?.name??null,
   animations:animations.map(a=>({name:a.name??"",channels:a.channels?.length??0,
     targetBones:[...new Set((a.channels??[]).map(c=>nodes[c.target.node??-1]?.name??"?"))].slice(0,16)})),
   armJointBases:nodes.filter(n=>armNames.includes(n.name??"")).map(n=>({
     name:n.name,rot:n.rotation??null,translation:n.translation??null,children:n.children??[]
   })),
   skinnedMeshes:(j.meshes??[]).filter(m=>m.primitives?.some(p=>p.attributes?.['JOINTS_0']!==undefined&&p.attributes?.['WEIGHTS_0']!==undefined)).length
  };
  console.info("CHAR108_GLB_EVIDENCE="+JSON.stringify(evidence));
  expect(evidence.skinnedMeshes).toBe(12);
  // Exact source audit: this GLB has 0 animation clips, not a hidden idle.
  expect(animations).toHaveLength(0);
  expect(findNativeIdle108(animations)).toBeNull();
 });
});
