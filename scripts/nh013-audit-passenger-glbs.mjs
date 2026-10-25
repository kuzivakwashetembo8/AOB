/** NH-013 G0 reproducible, read-only inspection of user-committed GLB binaries. */
import {readFileSync} from "node:fs";
import {join} from "node:path";
const files=["Four Door Sedan.glb","Fourd Confusion Hatchback.glb","Renault Kango.glb","Renault Kango Optimized.glb","Taxi.glb"];
for(const file of files){
 const buf=readFileSync(join("public/GLBs/Cars",file));
 if(buf.toString("ascii",0,4)!=="glTF"||buf.readUInt32LE(4)!==2||buf.readUInt32LE(8)!==buf.length)
   throw Error("Invalid binary GLB container "+file);
 const chunkLength=buf.readUInt32LE(12);
 if(buf.toString("ascii",16,20)!=="JSON"||chunkLength+20>buf.length)throw Error("Missing valid GLB JSON "+file);
 const gltf=JSON.parse(buf.toString("utf8",20,20+chunkLength));
 const primitiveRows=(gltf.meshes??[]).flatMap((m,i)=>(m.primitives??[]).map((p,j)=>({
   mesh:m.name??"Mesh"+i,material:p.material??null,
   vertices:gltf.accessors?.[p.attributes?.POSITION??-1]?.count??0,
   indices:gltf.accessors?.[p.indices??-1]?.count??0,
   triangles:Math.floor((gltf.accessors?.[p.indices??-1]?.count??gltf.accessors?.[p.attributes?.POSITION??-1]?.count??0)/3),
 })));
 const mats=(gltf.materials??[]).map((m,i)=>({
   index:i,name:m.name??"unnamed",baseColorTexture:m.pbrMetallicRoughness?.baseColorTexture?.index??null,
   baseColorFactor:m.pbrMetallicRoughness?.baseColorFactor??null,
   metallicFactor:m.pbrMetallicRoughness?.metallicFactor??null,
 }));
 const used=new Map();
 for(const p of primitiveRows){
   const k=p.material??-1,x=used.get(k)??{parts:0,triangles:0,meshNames:[]};
   x.parts++;x.triangles+=p.triangles;if(x.meshNames.length<4)x.meshNames.push(p.mesh);used.set(k,x);
 }
 console.info("NH013_ASSET_AUDIT "+JSON.stringify({
   file,bytes:buf.length,nodes:gltf.nodes?.length??0,meshes:gltf.meshes?.length??0,
   primitives:primitiveRows.length,triangles:primitiveRows.reduce((s,x)=>s+x.triangles,0),
   materials:mats.map(m=>({...m,usage:used.get(m.index)??null})),
   sceneRoots:gltf.scenes?.[gltf.scene??0]?.nodes??[],
   images:(gltf.images??[]).map(i=>({name:i.name??"",mimeType:i.mimeType??"",uri:i.uri??null})),
   extensionsUsed:gltf.extensionsUsed??[],
 }));
}
