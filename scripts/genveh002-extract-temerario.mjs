/** GTD-GEN-VEH-002
 * Offline source-authentic Lamborghini Temerario EXTERIOR extraction.
 * Node/face coordinates are from the committed owner's Draco-compressed GLB.
 * This runs ONLY during prebuild, never in browsers. The emitted TS file
 * contains compact native triangles: not GLB, no runtime import or fetch.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname,join} from "node:path";
import draco3d from "draco3dgltf";
const inPath=join("public","GLBs","Cars","Lamborghini+Temerario.glb");
const outPath=join("src","game","vehicles","temerario-source-data-002.ts");
const input=readFileSync(inPath);
if(input.toString("ascii",0,4)!=="glTF"||input.readUInt32LE(4)!==2||input.readUInt32LE(8)!==input.length)
 throw Error("GEN-VEH-002 invalid Lamborghini source GLB");
const jsonLength=input.readUInt32LE(12);
const gltf=JSON.parse(input.toString("utf8",20,20+jsonLength));
const binStart=20+jsonLength;
if(input.toString("ascii",binStart+4,binStart+8)!=="BIN\0")
 throw Error("GEN-VEH-002 GLB missing source BIN");
const binLength=input.readUInt32LE(binStart);
const bin=input.subarray(binStart+8,binStart+8+binLength);
if(gltf.meshes?.length!==782||gltf.materials?.length!==80||
 !gltf.extensionsRequired?.includes("KHR_draco_mesh_compression"))
 throw Error("GEN-VEH-002 source signature changed: inspect original before re-extracting");
const groups=["paint","glass","trim","frontLight","rearLight"];
const raw=Object.fromEntries(groups.map(k=>[k,{vertices:[],indices:[],sourceNodes:0}]));
const materialGroup=(name,nodeName)=>{
 const m=name.toLowerCase(),n=nodeName.toUpperCase();
 if(n.startsWith("GLS_")||/glass|window|blackplane/i.test(m))return "glass";
 if(n.startsWith("LGT_")||/daylight|led|lamp|luce|light/i.test(m)){
   return n.startsWith("LGT_R")||/tail|rear|rossa|rosso|red/i.test(m)?"rearLight":"frontLight";
 }
 if(/paint|primer|carpaint/i.test(m))return "paint";
 return "trim";
};
const nodeSelected=n=>/^(EXT_|DOOR_|GLS_|LGT_|Carpaint)/.test(n);
const identity=()=>[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
const matmul=(a,b)=>{
 const o=new Array(16).fill(0);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++)
  for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];
 return o;
};
function fromTRS(n){
 if(n.matrix)return n.matrix;
 const [x,y,z,w]=n.rotation??[0,0,0,1];
 const [sx,sy,sz]=n.scale??[1,1,1],t=n.translation??[0,0,0];
 const x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,
   yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
 return [(1-(yy+zz))*sx,(xy+wz)*sx,(xz-wy)*sx,0,
   (xy-wz)*sy,(1-(xx+zz))*sy,(yz+wx)*sy,0,
   (xz+wy)*sz,(yz-wx)*sz,(1-(xx+yy))*sz,0,
   t[0],t[1],t[2],1];
}
const parents=new Map();
for(let i=0;i<gltf.nodes.length;i++)
 for(const child of gltf.nodes[i].children??[])parents.set(child,i);
const worldCache=new Map();
function worldMatrix(id){
 if(worldCache.has(id))return worldCache.get(id);
 const m=fromTRS(gltf.nodes[id]),parent=parents.get(id);
 const result=parent===undefined?m:matmul(worldMatrix(parent),m);
 worldCache.set(id,result);return result;
}
const transformed=(p,m)=>[
 m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
 m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
 m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14],
];
const mod=await draco3d.createDecoderModule(),decoder=new mod.Decoder();
function decode(primitive){
 const ext=primitive.extensions?.KHR_draco_mesh_compression;
 if(!ext)throw Error("GEN-VEH-002 exterior primitive missing Draco");
 const view=gltf.bufferViews[ext.bufferView];
 const bytes=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
 const source=new mod.DecoderBuffer();source.Init(new Int8Array(bytes),bytes.length);
 const mesh=new mod.Mesh(),status=decoder.DecodeBufferToMesh(source,mesh);
 if(!status.ok())throw Error("GEN-VEH-002 Draco: "+status.error_msg());
 const a=decoder.GetAttributeByUniqueId(mesh,ext.attributes.POSITION);
 const numbers=new mod.DracoFloat32Array();
 decoder.GetAttributeFloatForAllPoints(mesh,a,numbers);
 const vertices=new Float32Array(numbers.size());
 for(let i=0;i<vertices.length;i++)vertices[i]=numbers.GetValue(i);
 const face=new mod.DracoInt32Array(),indices=[];
 for(let i=0;i<mesh.num_faces();i++){
  decoder.GetFaceFromMesh(mesh,i,face);
  indices.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));
 }
 mod.destroy(face);mod.destroy(numbers);mod.destroy(mesh);mod.destroy(source);
 return {vertices,indices};
}
let inspected=0,totalTriangles=0;
let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
for(let ni=0;ni<gltf.nodes.length;ni++){
 const n=gltf.nodes[ni];
 if(n.mesh===undefined||!nodeSelected(n.name??""))continue;
 const mesh=gltf.meshes[n.mesh],matrix=worldMatrix(ni);
 for(const primitive of mesh.primitives??[]){
  const group=materialGroup(gltf.materials[primitive.material??-1]?.name??"",n.name??"");
  const d=decode(primitive),acc=raw[group],offset=acc.vertices.length/3;
  for(let i=0;i<d.vertices.length;i+=3){
   const v=transformed([d.vertices[i],d.vertices[i+1],d.vertices[i+2]],matrix);
   acc.vertices.push(...v);
   for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}
  }
  for(const index of d.indices)acc.indices.push(index+offset);
  inspected++;acc.sourceNodes++;totalTriangles+=d.indices.length/3;
 }
}
mod.destroy(decoder);
if(inspected<250||totalTriangles<180000||groups.some(k=>!raw[k].indices.length))
 throw Error("GEN-VEH-002 exterior extraction incomplete "+JSON.stringify(
   {inspected,totalTriangles,parts:groups.map(k=>[k,raw[k].indices.length])}));
const spans=max.map((v,k)=>v-min[k]);
if(spans.some(v=>!Number.isFinite(v)||v<=0))throw Error("GEN-VEH-002 exterior bounds invalid");
const longAxis=spans[0]>spans[2]?0:2,wideAxis=longAxis===0?2:0;
const scale=Math.min(4.75/spans[longAxis],2.0/spans[wideAxis],1.28/spans[1]);
const middle=min.map((v,k)=>(v+max[k])/2);
function normalize(v){
 const rawX=(v[wideAxis]-middle[wideAxis])*scale;
 const forward=(v[longAxis]-middle[longAxis])*scale;
 // Lamborghini source control nodes confirm FRONT lies on -X; face +Z in GTD.
 return [rawX,(v[1]-min[1])*scale+0.07,-forward];
}
const budget={paint:9500,glass:1800,trim:4500,frontLight:600,rearLight:550};
const steps=[.004,.006,.009,.013,.018,.025,.035,.050,.070,.10,.14,.20];
function cluster(key,step){
 const g=raw[key],mapped=[],lookup=new Map(),indices=[];
 const val=g.vertices;
 const remap=new Int32Array(val.length/3);
 for(let i=0;i<remap.length;i++){
  const p=normalize([val[i*3],val[i*3+1],val[i*3+2]]);
  const q=p.map(x=>Math.round(x/step));
  const label=q.join(",");
  let v=lookup.get(label);
  if(v===undefined){v=mapped.length/3;lookup.set(label,v);mapped.push(...q.map(x=>x*step));}
  remap[i]=v;
 }
 const seen=new Set();
 for(let i=0;i<g.indices.length;i+=3){
  const a=remap[g.indices[i]],b=remap[g.indices[i+1]],c=remap[g.indices[i+2]];
  if(a===b||a===c||b===c)continue;
  const x0=mapped[a*3],y0=mapped[a*3+1],z0=mapped[a*3+2];
  const x1=mapped[b*3],y1=mapped[b*3+1],z1=mapped[b*3+2];
  const x2=mapped[c*3],y2=mapped[c*3+1],z2=mapped[c*3+2];
  const ux=x1-x0,uy=y1-y0,uz=z1-z0,vx=x2-x0,vy=y2-y0,vz=z2-z0;
  const area=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx);
  if(area<.000025)continue;
  const uniq=[a,b,c].sort((p,q)=>p-q).join(":");
  if(seen.has(uniq))continue;seen.add(uniq);
  indices.push(a,b,c);
 }
 return {mapped,indices};
}
function encoded(group){
 let result,step;
 for(const s of steps){
  result=cluster(group,s);step=s;
  if(result.indices.length/3<=budget[group]&&result.mapped.length/3<65536)break;
 }
 const positions=new Int16Array(result.mapped.length);
 for(let i=0;i<positions.length;i++){
  const packed=Math.round(result.mapped[i]*1000);
  if(packed<-32768||packed>32767)throw Error("GEN-VEH-002 out-of-range packed coordinate");
  positions[i]=packed;
 }
 const indices=new Uint16Array(result.indices);
 if(indices.length/3>budget[group]||indices.length<9)
  throw Error("GEN-VEH-002 excessive/empty geometry "+group+" "+indices.length/3);
 return {p:Buffer.from(positions.buffer).toString("base64"),
  i:Buffer.from(indices.buffer).toString("base64"),
  triangles:indices.length/3,vertices:positions.length/3,clusterMetres:step};
}
const result=Object.fromEntries(groups.map(k=>[k,encoded(k)]));
const output=[
 "/** GENERATED by scripts/genveh002-extract-temerario.mjs from ORIGINAL committed GLB.",
 " * This is compact SOURCE-DERIVED EXTERIOR triangle geometry, NOT a GLB runtime import.",
 " * Do not hand-edit: rerun node scripts/genveh002-extract-temerario.mjs. */",
 "export const TEMERARIO_SOURCE_PARTS_002 = "+JSON.stringify(result)+" as const;",
 "",
].join("\n");
mkdirSync(dirname(outPath),{recursive:true});
writeFileSync(outPath,output);
console.info("GEN_VEH_002_SOURCE_EXTERIOR "+JSON.stringify({
  sourceBytes:input.length,sourceMeshes:inspected,sourceTriangles:totalTriangles,
  exteriorBounds:min.map((v,k)=>[v,max[k]]),footprintScale:scale,
  outputBytes:Buffer.byteLength(output),
  parts:Object.fromEntries(groups.map(k=>[k,{triangles:result[k].triangles,
    vertices:result[k].vertices,clusterMetres:result[k].clusterMetres}])),
}));
