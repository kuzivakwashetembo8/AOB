/**
 * GEN-VEH-006: owner BMW M4 Competition M Package -> native Babylon triangle buffers.
 * Runs offline during prebuild. Does not mutate the original GLB or the
 * accepted Lamborghini. Deliberately fails closed for missing wheel corners.
 */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {dirname} from "node:path";
import {NodeIO} from "@gltf-transform/core";
import {ALL_EXTENSIONS} from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const source="public/GLBs/Cars/bmw_m4_competition_m_package (1).glb";
const sourceWheels="public/GLBs/Cars/Generated/bmw-m4-competition.glb";
const output="src/game/vehicles/bmw-source-data-006.ts";
// The standalone npm prebuild must also succeed without the custom Vercel
// preflight: populate the verified WHEEL-001 derivative only if absent.
if(!existsSync(sourceWheels))
 execFileSync(process.execPath,["scripts/wheel001_extract_wheels.mjs"],{stdio:"inherit"});
const bytes=await readFile(source);
if(bytes.byteLength!==1928276)throw Error("GEN-VEH-006 unexpected source GLB size");
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
 "draco3d.decoder":await draco3d.createDecoderModule()
});
const document=await io.readBinary(bytes),root=document.getRoot();
const derivedWheels=await io.readBinary(await readFile(sourceWheels));
const wheelTree=root.listNodes().find(n=>n.getName()==="WHeelsandrims_2");
if(!wheelTree)throw Error("GEN-VEH-006 source BMW wheel group absent");
const wheelOwners=new Set(wheelTree.listChildren().filter(n=>n.getMesh()));
const bodyGroups=["paint","glass","trim","frontLight","rearLight"];
const raw=Object.fromEntries(bodyGroups.map(k=>[k,[]]));
const corners=["frontLeft","frontRight","rearLeft","rearRight"];
const wheelSources=Object.fromEntries(corners.map(k=>[k,[]]));
const longNodeToCorner=Object.fromEntries(corners.map(k=>[
 "MVRS_bmw-m4-competition_"+k+"_GEOMETRY",k
]));
const all=[];
const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
const xf=(p,m)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
 m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
 m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
const normal=(p,m)=>{
 const a=m[0],b=m[4],c=m[8],d=m[1],e=m[5],f=m[9],g=m[2],h=m[6],i=m[10];
 const A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,D=c*h-b*i,E=a*i-c*g,F=b*g-a*h,
       G=b*f-c*e,H=c*d-a*f,I=a*e-b*d;
 const det=a*A+b*B+c*C||1;
 let x=(A*p[0]+B*p[1]+C*p[2])/det,
     y=(D*p[0]+E*p[1]+F*p[2])/det,z=(G*p[0]+H*p[1]+I*p[2])/det;
 const mag=Math.hypot(x,y,z)||1;return [x/mag,y/mag,z/mag];
};
const groupOf=mat=>{
 if(/Meshesbody15|Mesheslivery|Mesheswhite4/i.test(mat))return "paint";
 if(/Mesheswindows/i.test(mat))return "glass";
 if(/Meshesheadlight|Meshesled|Mesheslight5|Meshesff4/i.test(mat))return "frontLight";
 if(/Meshesredlight|Meshestail7/i.test(mat))return "rearLight";
 return "trim";
};
for(const node of root.listNodes()){
 const mesh=node.getMesh();if(!mesh)continue;
 const name=node.getName();
 if(/Meshesinterior|Meshesdash|Meshesengine|Meshesraidiator/i.test(
    node.getMesh()?.listPrimitives()[0]?.getMaterial()?.getName()??""))continue;
 if(wheelOwners.has(node))continue; // exact wheel geometry comes from derived four-source-wheel GLB
 const m=node.getWorldMatrix();
 for(const primitive of mesh.listPrimitives()){
  const p=primitive.getAttribute("POSITION")?.getArray();
  const n=primitive.getAttribute("NORMAL")?.getArray();
  const idx=primitive.getIndices()?.getArray();
  if(!p||!idx)continue;
  const verts=[],normals=[];
  for(let i=0;i<p.length;i+=3){
   const v=xf([p[i],p[i+1],p[i+2]],m);
   verts.push(...v);
   if(n?.length===p.length)normals.push(...normal([n[i],n[i+1],n[i+2]],m));
   for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}
  }
  const mat=primitive.getMaterial()?.getName()??"Unknown";
  const seg={name,mat,p:verts,n:normals,i:Array.from(idx)};
  raw[groupOf(mat)].push(seg);
  all.push({name,mat,tri:idx.length/3});
 }
}
// The existing WHEEL-001 BMW job already split 3 ORIGINAL wheel materials
// into four wheel groups with bijective face assignment. Read that build-only
// derivative; its geometry still comes from the owner's exact BMW GLB.
for(const node of derivedWheels.getRoot().listNodes()){
 const corner=longNodeToCorner[node.getName()];
 if(!corner||!node.getMesh())continue;
 const m=node.getWorldMatrix();
 for(const primitive of node.getMesh().listPrimitives()){
  const p=primitive.getAttribute("POSITION")?.getArray(),
    n=primitive.getAttribute("NORMAL")?.getArray(),
    idx=primitive.getIndices()?.getArray();
  if(!p||!idx?.length)continue;
  const verts=[],normals=[];
  for(let i=0;i<p.length;i+=3){
   const v=xf([p[i],p[i+1],p[i+2]],m);verts.push(...v);
   if(n?.length===p.length)normals.push(...normal([n[i],n[i+1],n[i+2]],m));
  }
  const mat=primitive.getMaterial()?.getName()??"Unknown";
  wheelSources[corner].push({name:node.getName(),mat,p:verts,n:normals,i:Array.from(idx)});
 }
}
for(const k of corners)if(wheelSources[k].length<2)
 throw Error("GEN-VEH-006 derived BMW wheel source incomplete "+k+" "+wheelSources[k].length);
if(raw.paint.length<1||raw.glass.length<1||raw.trim.length<1)
 throw Error("GEN-VEH-006 failed source exterior material split");
const centerX=(min[0]+max[0])/2,centerZ=(min[2]+max[2])/2;
const dims=[max[0]-min[0],max[1]-min[1],max[2]-min[2]];
if(dims[2]<7||dims[0]<3||dims[1]<2)throw Error("GEN-VEH-006 invalid world bounds "+dims);
const scale=Math.min(4.80/dims[2],1.93/dims[0],1.46/dims[1]);
const cv=v=>[ (v[0]-centerX)*scale,(v[1]-min[1])*scale+.025,
                (v[2]-centerZ)*scale];
const nv=v=>{const r=[v[0],v[1],v[2]],mag=Math.hypot(...r)||1;return r.map(a=>a/mag);};
function simplify(seg,step){
 const p=seg.p,n=seg.n,idx=seg.i,c=p.length/3;
 const points=new Float32Array(c*3),norms=new Float32Array(c*3);
 for(let v=0;v<c;v++){
  points.set(cv(p.slice(v*3,v*3+3)),v*3);
  if(n.length===p.length)norms.set(nv(n.slice(v*3,v*3+3)),v*3);
 }
 // Preserve original open boundary vertices and vertex-normal discontinuities
 // within each source primitive; NEVER merge independent source materials.
 const ec=new Map();
 const edge=(a,b)=>{const key=a<b?a+":"+b:b+":"+a;ec.set(key,(ec.get(key)||0)+1);};
 for(let j=0;j<idx.length;j+=3){edge(idx[j],idx[j+1]);edge(idx[j+1],idx[j+2]);edge(idx[j+2],idx[j]);}
 const boundary=new Uint8Array(c);
 for(const [key,count] of ec)if(count!==2){const [a,b]=key.split(":").map(Number);boundary[a]=1;boundary[b]=1;}
 ec.clear();
 const lookup=new Map(),sums=[],remap=new Uint32Array(c);
 for(let v=0;v<c;v++){
  const off=v*3,x=points[off],y=points[off+1],z=points[off+2];
  const nn=[norms[off],norms[off+1],norms[off+2]];
  const q=step? [Math.round(x/step),Math.round(y/step),Math.round(z/step)].join(","):"v"+v;
  const heading=n.length===p.length?nn.map(v=>Math.round(v*12)).join(","):"none";
  const key=boundary[v]?"boundary"+v:q+":"+heading;
  let i=lookup.get(key);
  if(i===undefined){i=sums.length;sums.push([0,0,0,0,0,0,0]);lookup.set(key,i);}
  const a=sums[i];a[0]+=x;a[1]+=y;a[2]+=z;a[3]+=nn[0];a[4]+=nn[1];a[5]+=nn[2];a[6]++;
  remap[v]=i;
 }
 const op=[],on=[],oi=[],seen=new Set();
 for(const a of sums){
  op.push(a[0]/a[6],a[1]/a[6],a[2]/a[6]);
  const len=Math.hypot(a[3],a[4],a[5])||1;on.push(a[3]/len,a[4]/len,a[5]/len);
 }
 for(let j=0;j<idx.length;j+=3){
  const oa=idx[j],ob=idx[j+1],oc=idx[j+2],a=remap[oa],b=remap[ob],c=remap[oc];
  if(a===b||b===c||a===c)continue;
  const A=a*3,B=b*3,C=c*3;
  const ux=op[B]-op[A],uy=op[B+1]-op[A+1],uz=op[B+2]-op[A+2];
  const vx=op[C]-op[A],vy=op[C+1]-op[A+1],vz=op[C+2]-op[A+2];
  if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-7)continue;
  const key=[a,b,c].sort((a,b)=>a-b).join(",");
  if(seen.has(key))continue;
  seen.add(key);oi.push(a,b,c);
 }
 // Source normals are best, but calculate normals within ONLY this primitive
 // when the source lacks them.
 if(n.length!==p.length){
  on.fill(0);
  for(let j=0;j<oi.length;j+=3){
   const a=oi[j]*3,b=oi[j+1]*3,c=oi[j+2]*3;
   const ux=op[b]-op[a],uy=op[b+1]-op[a+1],uz=op[b+2]-op[a+2];
   const vx=op[c]-op[a],vy=op[c+1]-op[a+1],vz=op[c+2]-op[a+2];
   const x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;
   for(const k of [a,b,c]){on[k]+=x;on[k+1]+=y;on[k+2]+=z;}
  }
  for(let j=0;j<on.length;j+=3){
   const r=Math.hypot(on[j],on[j+1],on[j+2])||1;on[j]/=r;on[j+1]/=r;on[j+2]/=r;
  }
 }
 return {p:op,n:on,i:oi};
}
function pack(geoms,shift=[0,0,0]){
 const p=[],n=[],i=[];
 for(const g of geoms){
  const off=p.length/3;
  for(let j=0;j<g.p.length;j+=3)p.push(g.p[j]-shift[0],g.p[j+1]-shift[1],g.p[j+2]-shift[2]);
  for(const normal of g.n)n.push(normal);
  for(const idx of g.i)i.push(idx+off);
 }
 if(i.length<3)throw Error("GEN-VEH-006 empty geometry group");
 const P=new Int16Array(p.length),N=new Int8Array(n.length);
 for(let j=0;j<p.length;j++){
  const q=Math.round(p[j]*1000);
  if(q>32767||q<-32768)throw Error("GEN-VEH-006 coordinate overflow");
  P[j]=q;N[j]=Math.round(Math.max(-1,Math.min(1,n[j]||0))*127);
 }
 const wide=p.length/3>65535,I=wide?new Uint32Array(i):new Uint16Array(i);
 return {p:Buffer.from(P.buffer).toString("base64"),n:Buffer.from(N.buffer).toString("base64"),
  i:Buffer.from(I.buffer).toString("base64"),indexBits:wide?32:16,
  triangles:i.length/3,vertices:p.length/3};
}
const step={paint:.012,glass:.005,trim:.022,frontLight:.008,rearLight:.008};
const body={};
for(const k of bodyGroups){
 let gs=raw[k].map(x=>simplify(x,step[k]));
 let triangleCount=gs.reduce((a,g)=>a+g.i.length/3,0);
 if(triangleCount>300000)throw Error("GEN-VEH-006 exterior "+k+" exceeds mobile limits "+triangleCount);
 body[k]=pack(gs);
}
// Four disconnected wheel groups from the source; world-space bounding box
// gives true centers. Build tyre and visible outer rim from the original
// mesh, not guessed cylinders or an invented source pivot.
const wheels={};
for(const corner of corners){
 const items=wheelSources[corner];
 const pts=items.flatMap(x=>x.p);
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let j=0;j<pts.length;j+=3){const v=cv(pts.slice(j,j+3));for(let k=0;k<3;k++){
  lo[k]=Math.min(lo[k],v[k]);hi[k]=Math.max(hi[k],v[k]);}}
 const center=lo.map((v,k)=>(v+hi[k])/2);
 const radius=Math.max(hi[1]-lo[1],hi[2]-lo[2])*.5;
 if(radius<.25||radius>.55)throw Error("GEN-VEH-006 invalid wheel radius "+corner+" "+radius);
 const sections={tire:[],rim:[]};
 const sourceRimTagged=items.some(seg=>/m8rim/i.test(seg.mat));
 for(const seg of items){
  const g=simplify(seg,.016);
  const groups={tire:[],rim:[]};
  for(let j=0;j<g.i.length;j+=3){
   const index=[g.i[j],g.i[j+1],g.i[j+2]];
   let meanRad=0,meanX=0;
   for(const a of index){const b=a*3;meanRad+=Math.hypot(g.p[b+1]-center[1],g.p[b+2]-center[2])/3;
    meanX+=g.p[b]/3;}
   const outward=corner.endsWith("Left")?1:-1;
   const faceDepth=(meanX-center[0])*outward;
   const rim=sourceRimTagged?/m8rim/i.test(seg.mat):(meanRad<radius*.79 && faceDepth>-.03);
   (rim?groups.rim:groups.tire).push(...index);
  }
  for(const kind of ["tire","rim"])if(groups[kind].length)
   sections[kind].push({p:g.p,n:g.n,i:groups[kind]});
 }
 if(!sections.rim.length||!sections.tire.length)
  throw Error("GEN-VEH-006 missing rim/tire split "+corner);
 const result={center:center.map(x=>Math.round(x*1000)/1000),
    radius:+radius.toFixed(3),width:+(hi[0]-lo[0]).toFixed(3),
    rim:pack(sections.rim,center),tire:pack(sections.tire,center)};
 wheels[corner]=result;
}
const front=(wheels.frontLeft.center[2]+wheels.frontRight.center[2])/2,
      rear=(wheels.rearLeft.center[2]+wheels.rearRight.center[2])/2;
if(Math.abs(front-rear)<2||Math.abs(front-rear)>3.8)
 throw Error("GEN-VEH-006 bad wheelbase "+(front-rear));
if(Math.abs(wheels.frontLeft.center[2]-wheels.frontRight.center[2])>.18||
   Math.abs(wheels.rearLeft.center[2]-wheels.rearRight.center[2])>.18)
 throw Error("GEN-VEH-006 axle mismatch "+JSON.stringify(wheels));
const ts=[
 "/** GENERATED by scripts/genveh006-extract-bmw.mjs from original BMW M4 GLB.",
 " * Build-only extraction, native runtime meshes, no source GLB loading. */",
 "export const BMW_SOURCE_PARTS_006 = "+JSON.stringify(body)+" as const;",
 "export const BMW_SOURCE_WHEELS_006 = "+JSON.stringify(wheels)+" as const;",""
].join("\n");
await mkdir(dirname(output),{recursive:true});await writeFile(output,ts);
console.info("GEN_VEH_006_NATIVE "+JSON.stringify({
 sourceBytes:bytes.length,sourceTriangles:all.reduce((a,b)=>a+b.tri,0),
 bounds:{raw:dims,scale},body:Object.fromEntries(bodyGroups.map(k=>[k,{
 source:raw[k].reduce((a,v)=>a+v.i.length/3,0),triangles:body[k].triangles}])),
 wheels:Object.fromEntries(corners.map(k=>[k,{center:wheels[k].center,
 radius:wheels[k].radius,tire:wheels[k].tire.triangles,rim:wheels[k].rim.triangles}])),
 outputBytes:Buffer.byteLength(ts),wheelbase:+Math.abs(front-rear).toFixed(3)}));
