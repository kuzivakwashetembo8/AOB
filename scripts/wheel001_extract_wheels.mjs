// WHEEL-001: offline, fail-closed extraction of real source wheel geometry.
// Runs during BUILD only. No procedural tires, no modifications to originals.
// A derivative is published only when all four wheel islands qualify.
import {createHash} from "node:crypto";
import {readFile,writeFile,mkdir,copyFile} from "node:fs/promises";
import {NodeIO} from "@gltf-transform/core";
import {ALL_EXTENSIONS,KHRDracoMeshCompression} from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const models=[
 ["toyota-hilux-002","public/toyota hilux 002.glb"],
 ["land-rover-defender-001","public/Land rover defender 001.glb"],
 ["dodge-hp","public/dodge_HP.glb"],
];
const corners=["frontLeft","frontRight","rearLeft","rearRight"];
const sha=b=>createHash("sha256").update(b).digest("hex");
function mul(p,m){return [
 m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
 m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
 m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14],
]}
function inv(p,m){
 const q=[p[0]-m[12],p[1]-m[13],p[2]-m[14]];
 return [m[0]*q[0]+m[1]*q[1]+m[2]*q[2],
         m[4]*q[0]+m[5]*q[1]+m[6]*q[2],
         m[8]*q[0]+m[9]*q[1]+m[10]*q[2]];
}
function islands(pos,idx,m){
 const count=pos.length/3,p=new Int32Array(count),rank=new Uint8Array(count);
 for(let i=0;i<count;i++)p[i]=i;
 function find(i){while(p[i]!==i){p[i]=p[p[i]];i=p[i]}return i;}
 function join(a,b){a=find(a);b=find(b);if(a===b)return;
  if(rank[a]<rank[b])p[a]=b;else if(rank[a]>rank[b])p[b]=a;
  else{p[b]=a;rank[a]++;}
 }
 for(let i=0;i<idx.length;i+=3){join(idx[i],idx[i+1]);join(idx[i],idx[i+2]);}
 const groups=new Map(),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<count;i++){
  const q=mul([pos[3*i],pos[3*i+1],pos[3*i+2]],m),r=find(i);
  let g=groups.get(r);
  if(!g){g={id:r,min:[Infinity,Infinity,Infinity],
   max:[-Infinity,-Infinity,-Infinity],tris:[],vertices:0};groups.set(r,g);}
  g.vertices++;
  for(let a=0;a<3;a++){
   g.min[a]=Math.min(g.min[a],q[a]);g.max[a]=Math.max(g.max[a],q[a]);
   min[a]=Math.min(min[a],q[a]);max[a]=Math.max(max[a],q[a]);
  }
 }
 for(let i=0;i<idx.length;i+=3){
  groups.get(find(idx[i])).tris.push(idx[i],idx[i+1],idx[i+2]);
 }
 const list=[...groups.values()];
 for(const g of list){
  g.center=g.min.map((x,i)=>(x+g.max[i])/2);
  g.ext=g.min.map((x,i)=>g.max[i]-x);
 }
 const dim=min.map((x,i)=>max[i]-x),long=dim[0]>dim[2]?0:2,lat=long===0?2:0;
 const center=min.map((x,i)=>(x+max[i])/2);
 return {groups:list,dim,long,lat,center,min,max};
}
function identify(g){
 const {groups,dim,long,lat,center,min}=g;
 const candidates={frontLeft:[],frontRight:[],rearLeft:[],rearRight:[]};
 for(const c of groups){
  const d=c.ext,h=Math.max(d[1],d[long]);
  if(c.tris.length<210||h<dim[1]*.13||h>dim[1]*.8||
   Math.abs(d[1]-d[long])>h*.24||
   d[lat]>dim[lat]*.42||
   Math.abs(c.center[lat]-center[lat])<dim[lat]*.22||
   Math.abs(c.center[long]-center[long])<dim[long]*.21||
   c.center[1]>min[1]+dim[1]*.62)continue;
  const k=(c.center[long]>center[long]?"front":"rear")+
         (c.center[lat]>center[lat]?"Left":"Right");
  candidates[k].push(c);
 }
 if(corners.some(k=>!candidates[k].length))throw Error("four-real-wheel-rings-not-identified");
 // Match the SAME diameter and axle height across all four real wheel
 // positions, rather than taking the largest circle at each corner (which
 // can select a headlight, wheel arch or a tire's distinct inner rim).
 const radius=c=>Math.max(c.ext[1],c.ext[long]);
 const options={};
 for(const k of corners)
   options[k]=candidates[k].sort((a,b)=>radius(b)-radius(a)).slice(0,24);
 let chosen=null,best=Infinity;
 for(const first of options.frontLeft){
   const proposal={frontLeft:first};
   let score=0,possible=true;
   for(const k of ["frontRight","rearLeft","rearRight"]){
     const reference=radius(first);
     const matched=options[k]
       .map(c=>{
         const r=Math.abs(radius(c)-reference)/reference;
         const y=Math.abs(c.center[1]-first.center[1])/reference;
         const axle=k==="frontRight"
           ?Math.abs(c.center[long]-first.center[long])/reference:0;
         return {c,penalty:5*r+3*y+2*axle};
       }).sort((a,b)=>a.penalty-b.penalty)[0];
     if(!matched||
       Math.abs(radius(matched.c)-reference)>reference*.20||
       Math.abs(matched.c.center[1]-first.center[1])>reference*.28){
       possible=false;break;
     }
     proposal[k]=matched.c;score+=matched.penalty;
   }
   if(!possible)continue;
   if(Math.abs(proposal.rearLeft.center[long]-
               proposal.rearRight.center[long])>radius(first)*.36)continue;
   // Prefer large genuine tire rings among equally symmetric options.
   score-=radius(first)/Math.max(.001,dim[1])*2;
   if(score<best){best=score;chosen=proposal;}
 }
 if(!chosen)throw Error("no-four-symmetric-source-tire-rings");
 // WHEEL-002: The earlier selection discarded small rims, spoke fragments,
 // center caps and bolt faces. Those kept rendering inside the static chassis,
 // visually doubling or tearing the wheel when the extracted ring steered.
 // Admit complete ORIGINAL geometric islands in the tire's bounded cylinder,
 // irrespective of the island's vertex count, material or radial diameter.
 // Reject significant unassigned circular geometry inside that cylinder.
 const selected={},consumed=new Set(),sourcePartCount=groups.length;
 for(const k of corners){
  const c=chosen[k],r=Math.max(c.ext[1],c.ext[long])*.51,parts=[];
  const lateralHalfWidth=Math.min(dim[lat]*.30,
    Math.max(c.ext[lat]*1.5,r*.80));
  const enclosure=part=>
   part.tris.length>=3 &&
   part.min[1]>=c.center[1]-r*1.08 &&
   part.max[1]<=c.center[1]+r*1.08 &&
   part.min[long]>=c.center[long]-r*1.08 &&
   part.max[long]<=c.center[long]+r*1.08 &&
   part.min[lat]>=c.center[lat]-lateralHalfWidth &&
   part.max[lat]<=c.center[lat]+lateralHalfWidth;
  for(const part of groups){
   if(!enclosure(part))continue;
   if(consumed.has(part.id))throw Error("wheel-components-overlap");
   parts.push(part);
  }
  if(!parts.includes(c))throw Error("primary-tire-surface-not-contained:"+k);
  if(!parts.length)throw Error("wheel-components-incomplete:"+k);
  // A circular residual part big enough to be a second visible tire/rim is
  // unacceptable: abort rather than deliver yet another stationary duplicate.
  const leftovers=groups.filter(part=>{
   if(parts.includes(part)||part.tris.length<90)return false;
   if(Math.abs(part.center[lat]-c.center[lat])>lateralHalfWidth)return false;
   const diam=Math.max(part.ext[1],part.ext[long]);
   return diam>r*.55&&diam<r*2.3 &&
    Math.abs(part.center[1]-c.center[1])<r*.28 &&
    Math.abs(part.center[long]-c.center[long])<r*.28 &&
    Math.abs(part.ext[1]-part.ext[long])<diam*.30 &&
    part.ext[lat]<dim[lat]*.45;
  });
  if(leftovers.length)
   throw Error("unmoved-circular-wheel-surface:"+k+":"+leftovers.length);
  for(const part of parts)consumed.add(part.id);
  selected[k]={center:c.center,parts,radius:r,
    sourceComponentCount:parts.length,sourceTriangles:
      parts.reduce((n,p)=>n+p.tris.length/3,0)};
 }
 return {selected,removed:consumed,sourcePartCount};
}
function isolatedPrimitive(doc,old,indices,pivot){
 const ref=old.getAttribute("POSITION"),buffer=ref.getBuffer(),
  remap=new Map(),outIdx=[];
 for(const id of indices){
  if(!remap.has(id))remap.set(id,remap.size);
  outIdx.push(remap.get(id));
 }
 const next=doc.createPrimitive()
   .setMaterial(old.getMaterial())
   .setMode(old.getMode());
 for(const name of old.listSemantics()){
  const accessor=old.getAttribute(name),arr=accessor.getArray(),stride=accessor.getElementSize();
  const values=new arr.constructor(remap.size*stride);
  for(const [before,after] of remap)for(let a=0;a<stride;a++){
   let v=arr[before*stride+a];
   if(name==="POSITION"&&a<3)v-=pivot[a];
   values[after*stride+a]=v;
  }
  // COLOR_0 and texture coordinates in real owner GLBs can be normalized
  // 8-/16-bit integers. Dropping normalized=true makes pixel RGB saturate
  // to WHITE even though the original color bytes were copied exactly.
  next.setAttribute(name,doc.createAccessor().setType(accessor.getType())
   .setArray(values).setNormalized(accessor.getNormalized())
   .setBuffer(buffer));
 }
 next.setIndices(doc.createAccessor().setType("SCALAR")
  .setArray(new Uint32Array(outIdx)).setBuffer(buffer));
 return next;
}
async function convert(binary,model,io){
 const doc=await io.readBinary(binary),root=doc.getRoot();
 if(root.listMeshes().length!==1)throw Error("multi-mesh-requires-manual-review");
 const mesh=root.listMeshes()[0],prims=mesh.listPrimitives();
 if(prims.length!==1)throw Error("multi-material-primitive-requires-manual-review");
 const prim=prims[0],owner=root.listNodes().find(n=>n.getMesh()===mesh);
 if(!owner)throw Error("original-mesh-node-not-found");
 const matrix=owner.getWorldMatrix(),scale=[0,4,8].map(i=>
  Math.hypot(matrix[i],matrix[i+1],matrix[i+2]));
 if(scale.some(x=>Math.abs(x-1)>.002))throw Error("non-rigid-source-transform");
 const pos=prim.getAttribute("POSITION")?.getArray(),idx=prim.getIndices()?.getArray();
 if(!pos||!idx)throw Error("missing-triangles");
 const graph=islands(pos,idx,matrix),{selected,removed}=identify(graph);
 const originalTriangles=idx.length/3;
 const originalAttributes=Object.fromEntries(prim.listSemantics().map(name=>[
  name,{componentType:prim.getAttribute(name).getComponentType(),
    normalized:prim.getAttribute(name).getNormalized()},
 ]));
 const body=[];
 for(const c of graph.groups)if(!removed.has(c.id))body.push(...c.tris);
 if(body.length<idx.length*.4)throw Error("wheel-extraction-removes-body");
 const redistributedTriangles=body.length/3+corners.reduce(
  (n,k)=>n+selected[k].sourceTriangles,0);
 if(redistributedTriangles!==originalTriangles)
  throw Error("source-triangle-partition-not-bijective");
 const buf=prim.getIndices().getBuffer();
 prim.setIndices(doc.createAccessor().setType("SCALAR")
  .setArray(new Uint32Array(body)).setBuffer(buf));
 const mappings={};
 for(const k of corners){
  const parts=selected[k].parts,hub=inv(selected[k].center,matrix);
  const pivot=doc.createNode("MVRS_"+model+"_"+k+"_PIVOT")
    .setTranslation(hub);
  const wheelMesh=doc.createMesh("MVRS_"+model+"_"+k+"_WHEEL")
    .addPrimitive(isolatedPrimitive(doc,prim,
      parts.flatMap(p=>p.tris),hub));
  const geometry=doc.createNode("MVRS_"+model+"_"+k+"_GEOMETRY")
    .setMesh(wheelMesh);
  owner.addChild(pivot);pivot.addChild(geometry);
  mappings[k]={pivot:pivot.getName(),originalParts:parts.length,
    originalTriangles:parts.reduce((n,p)=>n+p.tris.length/3,0),
    sourceComponentCount:selected[k].sourceComponentCount};
 }
 const glb=await io.writeBinary(doc);
 const verify=await io.readBinary(glb);
 const names=new Set(verify.getRoot().listNodes().map(n=>n.getName()));
 if(corners.some(k=>!names.has(mappings[k].pivot)))
  throw Error("wheel-nodes-not-preserved-on-export");
 // Source-real fidelity gate, after the final GLB has been reencoded:
 // four pivots are insufficient if geometry/colors have changed.
 const result=verify.getRoot();
 const meshes=result.listMeshes();
 for(const k of corners){
  const extracted=meshes.find(m=>m.getName()==="MVRS_"+model+"_"+k+"_WHEEL")
    ?.listPrimitives()[0];
  if(!extracted)throw Error("wheel-mesh-not-exported:"+k);
  if(extracted.getMaterial()?.getName()!==prim.getMaterial()?.getName())
    throw Error("wheel-original-material-not-preserved:"+k);
  if(extracted.getMode()!==prim.getMode())
    throw Error("wheel-primitive-mode-changed:"+k);
  for(const [name,meta] of Object.entries(originalAttributes)){
   const attr=extracted.getAttribute(name);
   if(!attr||attr.getNormalized()!==meta.normalized||
      attr.getComponentType()!==meta.componentType)
    throw Error("wheel-attribute-format-changed:"+k+":"+name);
  }
 }
 return {glb,mappings,retainedBodyTriangles:body.length/3,
   originalTriangles,originalAttributes,redistributedTriangles,
   sourceComponentCount:graph.groups.length};
}
async function main(){
 const base="public/wheel001-generated";await mkdir(base,{recursive:true});
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder":await draco3d.createDecoderModule(),
  "draco3d.encoder":await draco3d.createEncoderModule(),
 });
 const report={schemaVersion:"MVRS-1",vehicles:[]};
 for(const [model,path] of models){
  const bytes=await readFile(path),dst=base+"/"+model+".glb";
  const item={model,sourceSha256:sha(bytes),
   sourceBytes:bytes.length,status:"repair-required",reason:null};
  report.vehicles.push(item);
  try{
   const output=await convert(bytes,model,io);
   if(output.glb.length>Math.max(bytes.length*8,16_000_000))
    throw Error("derived-asset-too-large:"+output.glb.length);
   await writeFile(dst,output.glb);
   item.status="rig-candidate-needs-visual-acceptance";
   item.qualifiedSha256=sha(output.glb);
   item.derivedBytes=output.glb.length;
   item.mappings=output.mappings;
   item.retainedBodyTriangles=output.retainedBodyTriangles;
   item.originalTriangles=output.originalTriangles;
   item.redistributedTriangles=output.redistributedTriangles;
   item.originalAttributes=output.originalAttributes;
   item.sourceComponentCount=output.sourceComponentCount;
  }catch(e){
   await copyFile(path,dst);
   item.reason=String(e instanceof Error?e.message:e).slice(0,200);
  }
 }
 await writeFile(base+"/registry.json",JSON.stringify(report,null,2)+"\n");
 console.log("[WHEEL-001] Source-derived wheel candidates",report.vehicles);
}
// Safe for unit tests to import individual validators without generating files.
if(import.meta.url===new URL("file://"+process.argv[1]).href)
 await main();
export {isolatedPrimitive,identify,islands};
