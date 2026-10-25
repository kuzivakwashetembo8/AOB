/** NH-013: build source-derived, reduced part-count vehicle GLBs OFFLINE.
 * Preserve the original GLB, buffer geometry, paint, wheels, UVs and transforms.
 * This pass suppresses costly decorative nodes; no runtime mesh decimation. */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
const source=join("public","GLBs","Cars","Four Door Sedan.glb");
const target=join("public","GLBs","Cars","TrafficOptimized");
const input=readFileSync(source);
if(input.toString("ascii",0,4)!=="glTF"||input.readUInt32LE(4)!==2)throw Error("NH013 invalid sedan GLB");
const jsonLength=input.readUInt32LE(12);
const original=JSON.parse(input.toString("utf8",20,20+jsonLength));
const binOffset=20+jsonLength; // preserve every binary chunk byte-for-byte
const bin=input.subarray(binOffset);
if(original.meshes?.length===0)throw Error("NH013 missing sedan geometry");
mkdirSync(target,{recursive:true});
const keepPrimitive=(primitive,level)=>{
 const n=original.materials?.[primitive.material??-1]?.name?.toLowerCase()??"";
 const vert=original.accessors?.[primitive.attributes?.POSITION??-1]?.count??0;
 const indices=original.accessors?.[primitive.indices??-1]?.count??vert;
 const tri=Math.floor(indices/3);
 const essential=/paint|glass|window|tyre|tire|rubber|lens|headlight|taillight/.test(n);
 if(level===1)return essential||tri>=180;
 return /paint/.test(n)||
   ((/glass|window|lens/.test(n))&&tri>=150)||
   ((/tyre|tire|rubber/.test(n))&&tri>=1100)||
   ((/chrome|steel|black|lamp|light|trim/.test(n))&&tri>=2000);
};
for(const level of [1,2]){
 const gltf=JSON.parse(JSON.stringify(original));
 let primitives=0,triangles=0,removedNodes=0,retainedNodes=0;
 for(const m of gltf.meshes??[])m.primitives=m.primitives.filter(p=>keepPrimitive(p,level));
 for(const node of gltf.nodes??[]){
   if(node.mesh===undefined)continue;
   const primitivesForMesh=gltf.meshes?.[node.mesh]?.primitives;
   if(!primitivesForMesh?.length){delete node.mesh;removedNodes++;continue;}
   retainedNodes++;primitives+=primitivesForMesh.length;
   for(const p of primitivesForMesh)triangles+=Math.floor(
    (gltf.accessors?.[p.indices??-1]?.count??gltf.accessors?.[p.attributes?.POSITION??-1]?.count??0)/3);
 }
 // Referenced meshes have at least one primitive, unreferenced empty meshes
 // must also be valid glTF: leave a single original primitive for empty mesh
 // definitions without making their unused geometry visible again.
 for(let i=0;i<(gltf.meshes?.length??0);i++)
   if(!gltf.meshes[i].primitives?.length)gltf.meshes[i].primitives=[original.meshes[i].primitives[0]];
 gltf.asset={...gltf.asset,generator:"GTD NH013 derived LOD"+level+" from user-owned Four Door Sedan.glb"};
 const jsonBuffer=Buffer.from(JSON.stringify(gltf),"utf8");
 const paddedLength=Math.ceil(jsonBuffer.length/4)*4;
 const json=Buffer.alloc(paddedLength,32);jsonBuffer.copy(json);
 const header=Buffer.alloc(20);
 header.write("glTF",0);header.writeUInt32LE(2,4);
 header.writeUInt32LE(header.length+paddedLength+bin.length,8);
 header.writeUInt32LE(paddedLength,12);header.write("JSON",16);
 const out=Buffer.concat([header,json,bin]);
 const name="Four-Door-Sedan-LOD"+level+".glb";
 writeFileSync(join(target,name),out);
 console.info("NH013_LOD_BUILT "+JSON.stringify({level,name,bytes:out.length,
   renderedPrimitives:primitives,renderedTriangles:triangles,
   retainedNodes,removedNodes,originalSourceBytes:input.length}));
}
