/** NH-013 G2: reproducible source-authentic hatchback tyre split.
 * The incoming GLB has ONE combined tyre mesh for 4 distinct rings; keep
 * every original vertex/material/UV and split only indexed triangles by
 * measured original wheel-center quadrant. Add actual wheel-centered pivots.
 * This is offline processing, NEVER executed in players' WebGL runtime.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
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
function readPosition(p,index){
 const accessor=json.accessors[p.attributes.POSITION];
 const view=json.bufferViews[accessor.bufferView];
 if(accessor.componentType!==5126||accessor.type!=="VEC3")
   throw Error("NH013 only certified float VEC3 tyre geometry");
 const stride=view.byteStride??12;
 const at=(view.byteOffset??0)+(accessor.byteOffset??0)+index*stride;
 return [originalBin.readFloatLE(at),originalBin.readFloatLE(at+4),
   originalBin.readFloatLE(at+8)];
}
function readIndices(p){
 const a=json.accessors[p.indices],v=json.bufferViews[a.bufferView];
 const at=(v.byteOffset??0)+(a.byteOffset??0);
 const width=a.componentType===5125?4:a.componentType===5123?2:
  a.componentType===5121?1:0;
 if(!width)throw Error("NH013 unexpected tire index type");
 const out=[];
 for(let i=0;i<a.count;i++){
   const p=at+i*width;
   out.push(width===4?originalBin.readUInt32LE(p):
     width===2?originalBin.readUInt16LE(p):originalBin.readUInt8(p));
 }
 if(out.length%3)throw Error("NH013 indexed triangle count invalid");
 return out;
}
const grouped=new Map();
for(const corner of wheels)grouped.set(corner.name,[]);
for(const meshIndex of [36,37]){
 const sourceMesh=json.meshes[meshIndex];
 for(const primitive of sourceMesh.primitives){
   const inds=readIndices(primitive);
   const pieces=new Map(wheels.map(c=>[c.name,[]]));
   for(let i=0;i<inds.length;i+=3){
     const a=readPosition(primitive,inds[i]);
     const b=readPosition(primitive,inds[i+1]);
     const c=readPosition(primitive,inds[i+2]);
     const mx=(a[0]+b[0]+c[0])/3,my=(a[1]+b[1]+c[1])/3;
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
     target.meshes.push({name:"NH013_"+name+"_"+sourceMesh.name,
       primitives:[{...primitive,indices:acc}]});
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
console.info("NH013_HATCH_WHEEL_SPLIT "+JSON.stringify({
 originalBytes:input.length,derivativeBytes:out.length,
 pivots:wheels.length,originalTyreMeshes:[36,37],
 sourceGeometryPreserved:true,originalMeshNodesDisabled:[65,66],
 originalAndDerivedWheels:wheels.map(c=>({corner:c.name,parts:grouped.get(c.name).length})),
}));
