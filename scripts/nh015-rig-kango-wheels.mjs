/** NH-015 — compile-time extraction of authentic Renault Kangoo wheels.
 * The optimized source has 41 Draco-compressed materials spread over 12
 * generic meshes. Two wheels share each side's tyre / rim primitives.
 * Repartition ONLY original tyre/rim source triangles at four real hubs.
 * The unchanged owner asset is retained; no procedural cylinder is produced.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
import draco3d from "draco3dgltf";
const dir=join("public","GLBs","Cars");
const name="Renault Kango Optimized.glb";
const input=readFileSync(join(dir,name));
if(input.toString("ascii",0,4)!=="glTF"||input.readUInt32LE(4)!==2||
 input.readUInt32LE(8)!==input.length)throw Error("NH015 invalid optimized Kangoo source");
const jsonSize=input.readUInt32LE(12);
const json=JSON.parse(input.toString("utf8",20,20+jsonSize));
const binOffset=20+jsonSize;
if(input.toString("ascii",binOffset+4,binOffset+8)!=="BIN\0")
 throw Error("NH015 missing original Kangoo binary chunk");
const binarySize=input.readUInt32LE(binOffset);
const originalBin=input.subarray(binOffset+8,binOffset+8+binarySize);
if(json.nodes?.length!==13||json.materials?.length!==41||
 json.nodes[0]?.scale?.[0]!==0.00024016942)
 throw Error("NH015 Kangoo source hierarchy/scale changed; re-audit before splitting");
const sourceGroups=[
 {node:5,mesh:4,primitive:5,material:"_0-alu"},
 {node:5,mesh:4,primitive:6,material:"_0-tire"},
 {node:6,mesh:5,primitive:0,material:"Rat textile 2"},
 {node:6,mesh:5,primitive:2,material:"chrome08 210"},
];
for(const g of sourceGroups){
 const p=json.meshes?.[g.mesh]?.primitives?.[g.primitive];
 if(json.nodes[g.node]?.mesh!==g.mesh||json.materials?.[p?.material]?.name!==g.material)
   throw Error("NH015 unrecognized authored wheel material "+g.material);
}
const target=structuredClone(json);
const extra=[];let offset=originalBin.length;
const pad=()=>{const n=(4-offset%4)%4;if(n){extra.push(Buffer.alloc(n));offset+=n;}};
function addData(data){pad();const buf=Buffer.from(data.buffer,data.byteOffset,data.byteLength);
 const i=target.bufferViews.length;
 target.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buf.length});
 extra.push(buf);offset+=buf.length;return i;
}
function addAccessor(data,type,componentType,min,max,count){
 const i=target.accessors.length;
 target.accessors.push({bufferView:addData(data),componentType,count,type,min,max});
 return i;
}
const decoderModule=await draco3d.createDecoderModule();
const decoder=new decoderModule.Decoder();
function decodeSource(p){
 const ext=p.extensions?.KHR_draco_mesh_compression;
 if(!ext||Object.keys(ext.attributes).join(",")!=="POSITION")
  throw Error("NH015 expected original Draco POSITION-only wheel geometry");
 const bv=json.bufferViews[ext.bufferView];
 const data=originalBin.subarray(bv.byteOffset??0,(bv.byteOffset??0)+bv.byteLength);
 const src=new decoderModule.DecoderBuffer();src.Init(new Int8Array(data),data.length);
 const geom=new decoderModule.Mesh();
 const result=decoder.DecodeBufferToMesh(src,geom);
 if(!result.ok())throw Error("NH015 Draco decode failed "+result.error_msg());
 const dracoPos=decoder.GetAttributeByUniqueId(geom,ext.attributes.POSITION);
 const positionsArray=new decoderModule.DracoFloat32Array();
 decoder.GetAttributeFloatForAllPoints(geom,dracoPos,positionsArray);
 const positions=new Float32Array(positionsArray.size());
 for(let i=0;i<positions.length;i++)positions[i]=positionsArray.GetValue(i);
 const face=new decoderModule.DracoInt32Array(),idx=[];
 for(let i=0;i<geom.num_faces();i++){
   decoder.GetFaceFromMesh(geom,i,face);
   idx.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));
 }
 decoderModule.destroy(positionsArray);decoderModule.destroy(face);
 decoderModule.destroy(geom);decoderModule.destroy(src);
 if(positions.length!==json.accessors[p.attributes.POSITION].count*3)
  throw Error("NH015 source Draco point count mismatch");
 return {positions,idx};
}
const corners=["frontLeft","frontRight","rearLeft","rearRight"];
const grouped=new Map(corners.map(c=>[c,[]]));
const materialProof=new Map(corners.map(c=>[c,new Set()]));
const ranges=new Map(corners.map(c=>[c,{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]}]));
for(const {mesh:meshIndex,primitive:partIndex,material} of sourceGroups){
 const p=json.meshes[meshIndex].primitives[partIndex];
 const {positions,idx}=decodeSource(p);
 const faces=new Map(corners.map(c=>[c,[]]));
 for(let i=0;i<idx.length;i+=3){
   const t=[idx[i],idx[i+1],idx[i+2]];
   const mx=t.reduce((s,v)=>s+positions[3*v],0)/3;
   const my=t.reduce((s,v)=>s+positions[3*v+1],0)/3;
   // Authored wheels: |x| approx 63..82, y approx +/-150.
   // Never partition arbitrary body/carpet polygons as wheels.
   if(Math.abs(mx)<40||Math.abs(my)<100)throw Error("NH015 ambiguous wheel-source triangle "+material);
   const corner=(my<0?"front":"rear")+(mx<0?"Left":"Right");
   faces.get(corner).push(...t);
 }
 for(const corner of corners){
   const triangles=faces.get(corner);if(!triangles.length)continue;
   const indexRemap=new Map(),local=[],indices=[];
   for(const oldIndex of triangles){
     let next=indexRemap.get(oldIndex);
     if(next===undefined){next=local.length/3;indexRemap.set(oldIndex,next);
       local.push(positions[oldIndex*3],positions[oldIndex*3+1],positions[oldIndex*3+2]);
     }
     indices.push(next);
   }
   if(indices.length<150)throw Error("NH015 incomplete actual source wheel "+corner+" "+material);
   const rawBounds=ranges.get(corner),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<local.length;i+=3)for(let k=0;k<3;k++){
     min[k]=Math.min(min[k],local[i+k]);max[k]=Math.max(max[k],local[i+k]);
     rawBounds.min[k]=Math.min(rawBounds.min[k],local[i+k]);
     rawBounds.max[k]=Math.max(rawBounds.max[k],local[i+k]);
   }
   const attr=addAccessor(new Uint8Array(new Float32Array(local).buffer),"VEC3",5126,min,max,local.length/3);
   const ind=addAccessor(new Uint8Array(new Uint32Array(indices).buffer),"SCALAR",5125,
     [Math.min(...indices)],[Math.max(...indices)],indices.length);
   const mi=target.meshes.length;
   target.meshes.push({name:"NH015_KANGO_"+corner+"_"+material,
     primitives:[{attributes:{POSITION:attr},indices:ind,material:p.material}]});
   grouped.get(corner).push(mi);materialProof.get(corner).add(material);
 }
}
for(const corner of corners){
 const proof=materialProof.get(corner),b=ranges.get(corner);
 if(proof.size<2||!proof.has(corner.endsWith("Left")?"Rat textile 2":"_0-tire")||
   !Number.isFinite(b.min[0]))throw Error("NH015 source rubber/rim qualification failed "+corner);
 const hub=b.min.map((a,k)=>(a+b.max[k])/2);
 if(Math.abs(hub[0])<55||Math.abs(hub[0])>90||
    Math.abs(hub[1])<120||Math.abs(hub[1])>185||
    hub[2]<10||hub[2]>50)
   throw Error("NH015 wheel hub outside source regions "+corner+" "+JSON.stringify(hub));
 const pivot=target.nodes.length;
 target.nodes.push({name:"NH015_KANGO_"+corner+"_PIVOT",translation:hub,children:[]});
 target.nodes[0].children.push(pivot);
 for(const mesh of grouped.get(corner)){
   const child=target.nodes.length;
   target.nodes.push({name:"NH015_KANGO_SOURCE_"+corner+"_"+mesh,
     translation:hub.map(v=>-v),mesh});
   target.nodes[pivot].children.push(child);
 }
}
// Delete ONLY the four fused wheel primitives; keep every other original
// exterior/interior source material and all original geometry references.
for(const {mesh,primitive} of [...sourceGroups].sort((a,b)=>b.mesh-a.mesh||b.primitive-a.primitive))
 target.meshes[mesh].primitives.splice(primitive,1);
target.buffers[0].byteLength=offset;
target.asset={...target.asset,generator:"GTD NH015 source-authentic Kangoo Draco wheel isolation"};
const bytes=Buffer.from(JSON.stringify(target),"utf8"),paddedJSON=Buffer.alloc(Math.ceil(bytes.length/4)*4,32);bytes.copy(paddedJSON);
const binary=Buffer.concat([originalBin,...extra]);
if(binary.length!==offset)throw Error("NH015 appended wheel buffer misalignment");
const paddedBinary=Buffer.alloc(Math.ceil(binary.length/4)*4);binary.copy(paddedBinary);
const header=Buffer.alloc(20);header.write("glTF",0);header.writeUInt32LE(2,4);
header.writeUInt32LE(20+paddedJSON.length+8+paddedBinary.length,8);
header.writeUInt32LE(paddedJSON.length,12);header.write("JSON",16);
const binaryHeader=Buffer.alloc(8);binaryHeader.writeUInt32LE(paddedBinary.length,0);binaryHeader.write("BIN\0",4);
const output=Buffer.concat([header,paddedJSON,binaryHeader,paddedBinary]);
const dest=join(dir,"TrafficOptimized");mkdirSync(dest,{recursive:true});
writeFileSync(join(dest,"Renault-Kango-Source-Rigged.glb"),output);
decoderModule.destroy(decoder);
console.info("NH015_KANGO_WHEEL_SPLIT "+JSON.stringify({
 originalBytes:input.length,derivedBytes:output.length,sourcePivots:corners.length,
 wheelGroups:Object.fromEntries(corners.map(c=>[c,{parts:grouped.get(c).length,materials:[...materialProof.get(c)]}])),
 sourceGeometryPreserved:true,
}));
