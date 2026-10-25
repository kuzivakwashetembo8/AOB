/** NH-013 G2: reproducible source-authentic hatchback tyre split.
 * The incoming GLB has ONE combined tyre mesh for 4 distinct rings; keep
 * every original vertex/material/UV and split only indexed triangles by
 * measured original wheel-center quadrant. Add actual wheel-centered pivots.
 * This is offline processing, NEVER executed in players' WebGL runtime.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
import draco3d from "draco3dgltf";
const dir=join("public","GLBs","Cars");
const input=readFileSync(join(dir,"Fourd Confusion Hatchback.glb"));
if(input.toString("ascii",0,4)!=="glTF"||input.readUInt32LE(4)!==2||
 input.readUInt32LE(8)!==input.length)throw Error("NH013 invalid hatch source");
const jsonBytes=input.readUInt32LE(12);
const json=JSON.parse(input.toString("utf8",20,20+jsonBytes));
const binAt=20+jsonBytes;
if(input.toString("ascii",binAt+4,binAt+8)!=="BIN\0")throw Error("NH013 GLB binary chunk missing");
const rawBinLength=input.readUInt32LE(binAt);
const originalBin=input.subarray(binAt+8,binAt+8+rawBinLength);
if(json.nodes?.[64]?.name!=="Wheel_Tires"||
 json.nodes?.[65]?.mesh!==36||json.nodes?.[66]?.mesh!==37)
 throw Error("NH013 source wheel grouping changed; never guess tyre regions");
const wheels=[
 {name:"frontLeft",x: .78,y:-1.23},
 {name:"frontRight",x:-.78,y:-1.23},
 {name:"rearLeft",x: .78,y: 1.23},
 {name:"rearRight",x:-.78,y: 1.23},
];
const target=JSON.parse(JSON.stringify(json));
const binaryExtra=[];
let currentOffset=originalBin.length;
const align4=()=>{const p=(4-currentOffset%4)%4;if(p){binaryExtra.push(Buffer.alloc(p));currentOffset+=p;}};
const decoderModule=await draco3d.createDecoderModule();
const decoder=new decoderModule.Decoder();
const appendBytes=(bytes)=>{
 align4();const offset=currentOffset;
 const buffer=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 binaryExtra.push(buffer);currentOffset+=buffer.length;
 const bv=target.bufferViews.length;
 target.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buffer.length});
 return bv;
};
function decodeDraco(p){
 const ext=p.extensions?.KHR_draco_mesh_compression;
 if(!ext)throw Error("NH013 only certified Draco wheel primitives");
 const view=json.bufferViews[ext.bufferView];
 const compressed=originalBin.subarray(view.byteOffset??0,
   (view.byteOffset??0)+view.byteLength);
 const buf=new decoderModule.DecoderBuffer();
 buf.Init(new Int8Array(compressed),compressed.length);
 const mesh=new decoderModule.Mesh();
 const status=decoder.DecodeBufferToMesh(buf,mesh);
 if(!status.ok())throw Error("NH013 Draco wheel decode failed: "+status.error_msg());
 const index=[];
 const face=new decoderModule.DracoInt32Array();
 for(let i=0;i<mesh.num_faces();i++){
   decoder.GetFaceFromMesh(mesh,i,face);
   index.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));
 }
 const newAttributes={};
 const localPositions=[];
 for(const [semantic,attributeId] of Object.entries(ext.attributes)){
   const attribute=decoder.GetAttributeByUniqueId(mesh,attributeId);
   if(!attribute||!attribute.ptr)throw Error("Missing Draco wheel attribute "+semantic);
   const array=new decoderModule.DracoFloat32Array();
   decoder.GetAttributeFloatForAllPoints(mesh,attribute,array);
   const length=array.size(),values=new Float32Array(length);
   for(let i=0;i<length;i++)values[i]=array.GetValue(i);
   const originalAccessor=json.accessors[p.attributes[semantic]];
   const components=originalAccessor.type==="VEC4"?4:
     originalAccessor.type==="VEC3"?3:originalAccessor.type==="VEC2"?2:1;
   if(values.length!==mesh.num_points()*components)
     throw Error("Incorrect Draco wheel attribute size "+semantic);
   const bv=appendBytes(new Uint8Array(values.buffer));
   const ai=target.accessors.length;
   target.accessors.push({
      bufferView:bv,componentType:5126,count:mesh.num_points(),
      type:originalAccessor.type,...(originalAccessor.min?{min:originalAccessor.min}:{}),
      ...(originalAccessor.max?{max:originalAccessor.max}:{}),
   });
   newAttributes[semantic]=ai;
   if(semantic==="POSITION")localPositions.push(values);
   decoderModule.destroy(array);
 }
 if(localPositions.length!==1)throw Error("Draco wheel POS failed");
 decoderModule.destroy(face);decoderModule.destroy(mesh);decoderModule.destroy(buf);
 return {indices:index,positions:localPositions[0],attributes:newAttributes};
}
const grouped=new Map();
for(const corner of wheels)grouped.set(corner.name,[]);
for(const meshIndex of [36,37]){
 const sourceMesh=json.meshes[meshIndex];
 for(const primitive of sourceMesh.primitives){
   const decoded=decodeDraco(primitive);
   const inds=decoded.indices,pos=decoded.positions;
   const pieces=new Map(wheels.map(c=>[c.name,[]]));
   for(let i=0;i<inds.length;i+=3){
     const i0=inds[i]*3,i1=inds[i+1]*3,i2=inds[i+2]*3;
     const mx=(pos[i0]+pos[i1]+pos[i2])/3;
     const my=(pos[i0+1]+pos[i1+1]+pos[i2+1])/3;
     if(Math.abs(mx)<.35||Math.abs(my)<.5)
       throw Error("NH013 triangle crossing distinct source wheel region");
     const name=(my<0?"front":"rear")+(mx>0?"Left":"Right");
     pieces.get(name).push(inds[i],inds[i+1],inds[i+2]);
   }
   for(const corner of wheels){
     const picked=pieces.get(corner.name);
     if(picked.length<150)throw Error("NH013 missing real tyre surfaces "+corner.name);
     const name=corner.name,arr=Buffer.alloc(picked.length*4);
     for(let i=0;i<picked.length;i++)arr.writeUInt32LE(picked[i],i*4);
     align4();const offset=currentOffset;binaryExtra.push(arr);currentOffset+=arr.length;
     const bv=target.bufferViews.length;
     target.bufferViews.push({buffer:0,byteOffset:offset,byteLength:arr.length});
     const acc=target.accessors.length;
     target.accessors.push({bufferView:bv,componentType:5125,count:picked.length,
       type:"SCALAR",min:[Math.min(...picked)],max:[Math.max(...picked)]});
     const mesh=target.meshes.length;
     // Material/UV/normal/tangent attributes come from EXACT decoded
     // source geometry. The resulting primitive no longer needs Draco.
     const {extensions:unusedExtensions,...originalSettings}=primitive;
     target.meshes.push({name:"NH013_"+name+"_"+sourceMesh.name,
       primitives:[{...originalSettings,attributes:decoded.attributes,indices:acc}]});
     grouped.get(name).push(mesh);
   }
 }
}
// Suppress only the two original fused visual nodes; their complete exact
// geometry is now referenced by the four separate pivot assemblies.
delete target.nodes[65].mesh;delete target.nodes[66].mesh;
for(const corner of wheels){
 const pivotId=target.nodes.length;
 const cx=corner.x,cy=corner.y,cz=.31;
 target.nodes.push({name:"NH013_HATCH_TIRE_"+corner.name+"_PIVOT",
   translation:[cx,cy,cz],children:[]});
 target.nodes[64].children.push(pivotId);
 for(const mesh of grouped.get(corner.name)){
   const child=target.nodes.length;
   target.nodes.push({name:"NH013_HATCH_SOURCE_"+corner.name+"_"+mesh,
     translation:[-cx,-cy,-cz],mesh});
   target.nodes[pivotId].children.push(child);
 }
}
target.buffers[0].byteLength=currentOffset;
target.asset={...target.asset,generator:"GTD NH013 G2 verified source-wheel extraction"};
const finalBin=Buffer.concat([originalBin,...binaryExtra]);
if(finalBin.length!==currentOffset)throw Error("NH013 incorrect appended BIN size");
const outJson=Buffer.from(JSON.stringify(target),"utf8");
const jlen=Math.ceil(outJson.length/4)*4;
const jsonChunk=Buffer.alloc(jlen,32);outJson.copy(jsonChunk);
const binLength=Math.ceil(finalBin.length/4)*4;
const paddedBin=Buffer.alloc(binLength);finalBin.copy(paddedBin);
const hdr=Buffer.alloc(20);hdr.write("glTF",0);hdr.writeUInt32LE(2,4);
hdr.writeUInt32LE(20+jlen+8+binLength,8);hdr.writeUInt32LE(jlen,12);hdr.write("JSON",16);
const bh=Buffer.alloc(8);bh.writeUInt32LE(binLength,0);bh.write("BIN\0",4);
const out=Buffer.concat([hdr,jsonChunk,bh,paddedBin]);
const dest=join(dir,"TrafficOptimized");mkdirSync(dest,{recursive:true});
writeFileSync(join(dest,"Fourd-Confusion-Hatchback-Rigged.glb"),out);
decoderModule.destroy(decoder);
console.info("NH013_HATCH_WHEEL_SPLIT "+JSON.stringify({
 originalBytes:input.length,derivativeBytes:out.length,
 pivots:wheels.length,originalTyreMeshes:[36,37],
 sourceGeometryPreserved:true,originalMeshNodesDisabled:[65,66],
 originalAndDerivedWheels:wheels.map(c=>({corner:c.name,parts:grouped.get(c.name).length})),
}));
