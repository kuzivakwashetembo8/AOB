// @vitest-environment jsdom
/** Read-only structural audit of the OWNER's actual source GLB; executes in
 * Vercel build checkout, avoiding GitHub binary UTF-8 decoding errors. */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,it,expect} from "vitest";
function extractGltfJson(file:Uint8Array){
 const bytes=Buffer.from(file);
 if(bytes.readUInt32LE(0)!==0x46546c67 || bytes.readUInt32LE(4)!==2)
   throw new Error("Not a glTF 2.0 GLB");
 if(bytes.readUInt32LE(8)!==bytes.length)throw new Error("GLB length mismatch");
 const size=bytes.readUInt32LE(12),type=bytes.readUInt32LE(16);
 if(type!==0x4e4f534a)throw new Error("First GLB chunk not JSON");
 return JSON.parse(bytes.toString("utf8",20,20+size)) as {
 nodes?:Array<{name?:string;children?:number[];translation?:number[];rotation?:number[];scale?:number[];mesh?:number;skin?:number}>;
 skins?:Array<{name?:string;joints:number[];skeleton?:number}>;
 animations?:Array<{name?:string;channels?:Array<{target?:{node:number;path:string}}>;}>;
 meshes?:Array<{name?:string;primitives?:Array<{attributes?:Record<string,number>}>}>;
 };
}
describe("CHAR-106 owner human GLB source capability audit",()=>{
 it("prints exact native source rig, node hierarchy, skin weights and authored pose clips",()=>{
   const bytes=readFileSync(resolve(process.cwd(),"public/GLBs/Characters/character.glb"));
   const gltf=extractGltfJson(bytes);
   const nodes=gltf.nodes??[],skins=gltf.skins??[],animations=gltf.animations??[];
   const joints=skins.flatMap(s=>s.joints??[]);
   const interesting=(name:string)=>/arm|shoulder|clavicle|elbow|forearm|hand|hips|spine|chest|neck|wrist|idle|walk/i.test(name);
   const names=nodes.map((n,i)=>({id:i,name:n.name??"",parent:nodes.findIndex(p=>p.children?.includes(i)),children:n.children??[],translation:n.translation??null,rotation:n.rotation??null}));
   const summary={
     bytes:bytes.length,nodes:nodes.length,skins:skins.length,skinJoints:skins.map(s=>({name:s.name??"",count:s.joints.length,root:s.skeleton,
       jointNames:s.joints.map(i=>nodes[i]?.name??String(i)).filter(interesting).slice(0,90)})),
     namedArmNodes:names.filter(n=>interesting(n.name)).slice(0,100),
     meshCount:gltf.meshes?.length??0,
     skinnedMeshes:gltf.meshes?.map((m,i)=>({i,name:m.name??"",hasJoints:(m.primitives??[]).some(p=>Object.keys(p.attributes??{}).some(k=>/^JOINTS_/i.test(k))),hasWeights:(m.primitives??[]).some(p=>Object.keys(p.attributes??{}).some(k=>/^WEIGHTS_/i.test(k)))})).filter(m=>m.hasJoints||m.hasWeights).slice(0,35),
     animations:animations.map(a=>({name:a.name??"",channels:a.channels?.length??0,animatedNames:[...new Set((a.channels??[]).map(c=>nodes[c.target?.node??-1]?.name??"unknown"))].slice(0,25)})),
   };
   console.info("CHAR106_SOURCE_AUDIT_JSON="+JSON.stringify(summary));
   expect(bytes.length).toBeGreaterThan(100000);
   expect(nodes.length).toBeGreaterThan(0);
 });
});
