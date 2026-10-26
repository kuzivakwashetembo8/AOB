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
const raw=Object.fromEntries(groups.map(k=>[k,{segments:[],sourceNodes:0}]));
// The accepted five exterior groups are frozen in Step 3: wheel-only additions.
const wheelCorners={FL:"frontLeft",FR:"frontRight",RL:"rearLeft",RR:"rearRight"};
const wheelRaw=Object.fromEntries(Object.values(wheelCorners).map(k=>[k,{segments:[]}]));
const sourceWheelNames=new Set();
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

/** Inverse-transpose of the source node linear transform; protects highlights
 * on rotated/non-uniformly scaled body panels. */
function transformedNormal(v,m){
 const a=m[0],b=m[4],c=m[8],d=m[1],e=m[5],f=m[9],g=m[2],h=m[6],i=m[10];
 const A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,D=c*h-b*i,E=a*i-c*g,F=b*g-a*h,
       G=b*f-c*e,H=c*d-a*f,I=a*e-b*d;
 const det=a*A+b*B+c*C;
 if(Math.abs(det)<1e-12)throw Error("GEN-VEH-002 degenerate source normal transform");
 const x=(A*v[0]+B*v[1]+C*v[2])/det,
       y=(D*v[0]+E*v[1]+F*v[2])/det,
       z=(G*v[0]+H*v[1]+I*v[2])/det;
 const n=Math.hypot(x,y,z)||1;return [x/n,y/n,z/n];
}

const mod=await draco3d.createDecoderModule(),decoder=new mod.Decoder();
function decode(primitive){
 const ext=primitive.extensions?.KHR_draco_mesh_compression;
 if(!ext)throw Error("GEN-VEH-002 exterior primitive missing Draco");
 const view=gltf.bufferViews[ext.bufferView];
 const bytes=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
 const source=new mod.DecoderBuffer();source.Init(new Int8Array(bytes),bytes.length);
 const mesh=new mod.Mesh(),status=decoder.DecodeBufferToMesh(source,mesh);
 if(!status.ok())throw Error("GEN-VEH-002 Draco: "+status.error_msg());
 const positionsAttribute=decoder.GetAttributeByUniqueId(mesh,ext.attributes.POSITION);
 const numbers=new mod.DracoFloat32Array();
 decoder.GetAttributeFloatForAllPoints(mesh,positionsAttribute,numbers);
 const vertices=new Float32Array(numbers.size());
 for(let i=0;i<vertices.length;i++)vertices[i]=numbers.GetValue(i);
 let normals=null;
 if(ext.attributes.NORMAL!==undefined){
   const attribute=decoder.GetAttributeByUniqueId(mesh,ext.attributes.NORMAL);
   if(attribute){
     decoder.GetAttributeFloatForAllPoints(mesh,attribute,numbers);
     if(numbers.size()===vertices.length){
       normals=new Float32Array(numbers.size());
       for(let i=0;i<normals.length;i++)normals[i]=numbers.GetValue(i);
     }
   }
 }
 const face=new mod.DracoInt32Array(),indices=[];
 for(let i=0;i<mesh.num_faces();i++){
   decoder.GetFaceFromMesh(mesh,i,face);
   indices.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));
 }
 mod.destroy(face);mod.destroy(numbers);mod.destroy(mesh);mod.destroy(source);
 return {vertices,normals,indices};
}
let inspected=0,totalTriangles=0;
let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
for(let ni=0;ni<gltf.nodes.length;ni++){
 const n=gltf.nodes[ni];
 const wheelMatch=/^WHL_(FL|FR|RL|RR)(?:_|$)/i.exec(n.name??"");
 if(n.mesh===undefined||(!nodeSelected(n.name??"")&&!wheelMatch))continue;
 const mesh=gltf.meshes[n.mesh],matrix=worldMatrix(ni);
 for(const primitive of mesh.primitives??[]){
  const group=materialGroup(gltf.materials[primitive.material??-1]?.name??"",n.name??"");
  const d=decode(primitive),acc=wheelMatch
    ?wheelRaw[wheelCorners[wheelMatch[1].toUpperCase()]]:raw[group];
  const positions=[],normals=[];
  for(let i=0;i<d.vertices.length;i+=3){
   const v=transformed([d.vertices[i],d.vertices[i+1],d.vertices[i+2]],matrix);
   positions.push(...v);
   if(d.normals)normals.push(...transformedNormal(
     [d.normals[i],d.normals[i+1],d.normals[i+2]],matrix));
   if(!wheelMatch)for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}
  }
  // A distinct primitive is a hard barrier for merging. In particular never
  // join adjacent GLB surfaces that merely occupy the same voxel.
  acc.segments.push({positions,normals,indices:d.indices,
    name:n.name??"",material:gltf.materials[primitive.material??-1]?.name??""});
  if(wheelMatch){sourceWheelNames.add(n.name??"");}
  else {inspected++;acc.sourceNodes++;totalTriangles+=d.indices.length/3;}
 }
}
mod.destroy(decoder);
if(inspected<250||totalTriangles<180000||groups.some(k=>!raw[k].segments.length))
 throw Error("GEN-VEH-002 exterior extraction incomplete "+JSON.stringify(
   {inspected,totalTriangles,parts:groups.map(k=>[k,raw[k].segments.length])}));
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
// Step 2: conservative, source-island-local simplification. The old code
// merged ENTIRE paint / glass groups and snapped into one world-position grid,
// fusing independent roof/door/panel sheets and ruining surface normals.
const stepByPart={paint:.012,glass:.007,trim:.018,frontLight:.006,rearLight:.006};
const maxTriangles={paint:120000,glass:28000,trim:72000,frontLight:20000,rearLight:20000};
const maxTotalTriangles=230000;
let rejectedDegenerate=0,rejectedInversion=0,sourceNormalsPresent=0;
// Remapping is a +Z-front coordinate convention. It must match the position
// conversion. A normal is *direction*, never translated.
function normalizedNormal(v){
 const length=v[longAxis],width=v[wideAxis];
 const p=[width,v[1],-length];
 const norm=Math.hypot(...p)||1;return p.map(x=>x/norm);
}
function clusterSegment(seg,step){
 const {positions:vertices,normals:originalNormals,indices:triangles}=seg;
 const vertexCount=vertices.length/3;
 const p=new Float32Array(vertexCount*3),n=new Float32Array(vertexCount*3);
 for(let v=0;v<vertexCount;v++){
   const point=normalize(vertices.slice(v*3,v*3+3));
   p.set(point,v*3);
   if(originalNormals.length){
     const normal=normalizedNormal(originalNormals.slice(v*3,v*3+3));
     n.set(normal,v*3);sourceNormalsPresent++;
   }
 }
 // Vertices on topology edges are never moved or welded. This protects
 // bonnet/door/glass boundaries and isolated islands within a primitive.
 const edges=new Map(),boundary=new Uint8Array(vertexCount);
 const edge=(a,b)=>{
   const label=a<b?a+":"+b:b+":"+a;
   edges.set(label,(edges.get(label)??0)+1);
 };
 for(let j=0;j<triangles.length;j+=3){
   const a=triangles[j],b=triangles[j+1],c=triangles[j+2];
   edge(a,b);edge(b,c);edge(c,a);
 }
 for(const [key,count] of edges){
   if(count!==2){const [a,b]=key.split(":").map(Number);boundary[a]=1;boundary[b]=1;}
 }
 edges.clear();
 // A local vertex neighborhood plus source-normal class is the only weld
 // domain. Do not weld between different GLB mesh nodes or primitives.
 const lookup=new Map(),verticesOut=[],normalsOut=[],sums=[],remap=new Uint32Array(vertexCount);
 for(let v=0;v<vertexCount;v++){
   const i=v*3,x=p[i],y=p[i+1],z=p[i+2];
   const nx=n[i],ny=n[i+1],nz=n[i+2];
   const cell=[Math.round(x/step),Math.round(y/step),Math.round(z/step)].join(",");
   const direction=originalNormals.length?[Math.round(nx*8),Math.round(ny*8),Math.round(nz*8)].join(","):"none";
   const key=boundary[v]?"b:"+v:cell+":"+direction;
   let id=lookup.get(key);
   if(id===undefined){
     id=sums.length;
     lookup.set(key,id);
     sums.push({x:0,y:0,z:0,nx:0,ny:0,nz:0,count:0});
   }
   const accum=sums[id];accum.x+=x;accum.y+=y;accum.z+=z;
   accum.nx+=nx;accum.ny+=ny;accum.nz+=nz;accum.count++;
   remap[v]=id;
 }
 for(const accum of sums){
   verticesOut.push(accum.x/accum.count,accum.y/accum.count,accum.z/accum.count);
   const mag=Math.hypot(accum.nx,accum.ny,accum.nz);
   normalsOut.push(mag>1e-8?accum.nx/mag:0,
     mag>1e-8?accum.ny/mag:0,mag>1e-8?accum.nz/mag:0);
 }
 const indicesOut=[],seen=new Set();
 for(let j=0;j<triangles.length;j+=3){
   const oa=triangles[j],ob=triangles[j+1],oc=triangles[j+2];
   const a=remap[oa],b=remap[ob],c=remap[oc];
   if(a===b||a===c||b===c){rejectedDegenerate++;continue;}
   const cross=(coords,ia,ib,ic)=>{
     const A=ia*3,B=ib*3,C=ic*3;
     const ux=coords[B]-coords[A],uy=coords[B+1]-coords[A+1],uz=coords[B+2]-coords[A+2];
     const vx=coords[C]-coords[A],vy=coords[C+1]-coords[A+1],vz=coords[C+2]-coords[A+2];
     return [uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
   };
   const after=cross(verticesOut,a,b,c),area=Math.hypot(...after);
   if(area<1e-7){rejectedDegenerate++;continue;}
   const before=cross(p,oa,ob,oc),oldArea=Math.hypot(...before);
   // Never keep inverted or catastrophically flattened polygons.
   if(oldArea>1e-9&&((after[0]*before[0]+after[1]*before[1]+after[2]*before[2])/(oldArea*area)<.35)){
     rejectedInversion++;continue;
   }
   const key=[a,b,c].sort((x,y)=>x-y).join(":");
   if(seen.has(key))continue;
   seen.add(key);indicesOut.push(a,b,c);
 }
 // Missing Draco normal channels: use geometric normals for this source
 // primitive alone, not across different body panels.
 if(!originalNormals.length){
   for(let i=0;i<normalsOut.length;i++)normalsOut[i]=0;
   for(let j=0;j<indicesOut.length;j+=3){
     const a=indicesOut[j],b=indicesOut[j+1],c=indicesOut[j+2];
     const A=a*3,B=b*3,C=c*3;
     const ux=verticesOut[B]-verticesOut[A],uy=verticesOut[B+1]-verticesOut[A+1],uz=verticesOut[B+2]-verticesOut[A+2];
     const vx=verticesOut[C]-verticesOut[A],vy=verticesOut[C+1]-verticesOut[A+1],vz=verticesOut[C+2]-verticesOut[A+2];
     const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx;
     for(const k of [A,B,C]){normalsOut[k]+=cx;normalsOut[k+1]+=cy;normalsOut[k+2]+=cz;}
   }
   for(let i=0;i<normalsOut.length;i+=3){
     const mag=Math.hypot(normalsOut[i],normalsOut[i+1],normalsOut[i+2])||1;
     normalsOut[i]/=mag;normalsOut[i+1]/=mag;normalsOut[i+2]/=mag;
   }
 }
 return {positions:verticesOut,normals:normalsOut,indices:indicesOut};
}
function sourcePriority(item){
 // Preserve original mesh boundaries; select complete source mesh surfaces
 // instead of deleting alternating individual triangles (which creates holes).
 // Large area and silhouette footprint win; small decorative seams lose.
 const p=item.result.positions,idx=item.result.indices;
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++){
   lo[k]=Math.min(lo[k],p[i+k]);hi[k]=Math.max(hi[k],p[i+k]);
 }
 const ex=hi[0]-lo[0],ey=hi[1]-lo[1],ez=hi[2]-lo[2];
 const footprint=Math.max(ex*ez,ey*ez,ey*ex);
 let area=0;
 for(let j=0;j<idx.length;j+=3){
   const a=idx[j]*3,b=idx[j+1]*3,c=idx[j+2]*3;
   const ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2];
   const vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];
   area+=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)*.5;
 }
 const important=/intake|grill|vent|blackparts|splitter|bumper|door|front|rear|glass/i.test(
   item.seg.name+" "+item.seg.material);
 return (Math.sqrt(Math.max(footprint,.00001))+
   Math.sqrt(Math.max(area,.00001)))*(important?1.25:1)/
   Math.pow(Math.max(1,idx.length/3),.33);
}
function encoded(group){
 const outP=[],outN=[],outI=[];
 let empty=0,skipped=0,skippedTriangles=0,srcTriangles=0,keptNodes=0;
 const segments=[];
 for(const seg of raw[group].segments){
   srcTriangles+=seg.indices.length/3;
   const result=clusterSegment(seg,stepByPart[group]);
   if(!result.indices.length){empty++;continue;}
   segments.push({seg,result});
 }
 if(group==="trim"){
   segments.sort((a,b)=>sourcePriority(b)-sourcePriority(a)||
     a.seg.name.localeCompare(b.seg.name));
 }
 let used=0;
 for(const {seg,result} of segments){
   const count=result.indices.length/3;
   if(group==="trim" && used+count>maxTriangles.trim){
     skipped++;skippedTriangles+=count;continue;
   }
   const off=outP.length/3;
   for(const v of result.positions)outP.push(v);
   for(const n of result.normals)outN.push(n);
   for(const i of result.indices)outI.push(i+off);
   used+=count;keptNodes++;
 }
 if(!outI.length||outP.length/3>500000||outI.length/3>maxTriangles[group])
   throw Error("GEN-VEH-002 source detail limits exceeded: "+group+
     " input="+srcTriangles+" output="+outI.length/3+" vertices="+outP.length/3);
 const positions=new Int16Array(outP.length),normals=new Int8Array(outN.length);
 for(let i=0;i<positions.length;i++){
   const value=Math.round(outP[i]*1000);
   if(value<-32768||value>32767)throw Error("GEN-VEH-002 out-of-range source position");
   positions[i]=value;normals[i]=Math.max(-127,Math.min(127,Math.round(outN[i]*127)));
 }
 const wide=outP.length/3>65535;
 const indices=wide?new Uint32Array(outI):new Uint16Array(outI);
 return {p:Buffer.from(positions.buffer).toString("base64"),
  n:Buffer.from(normals.buffer).toString("base64"),
  i:Buffer.from(indices.buffer).toString("base64"),
  indexBits:wide?32:16,
  triangles:indices.length/3,vertices:positions.length/3,
  sourceTriangles:srcTriangles,sourcePrimitives:raw[group].segments.length,
  keptPrimitives:keptNodes,skippedPrimitives:skipped,
  skippedTriangles,emptyPrimitives:empty,clusterMetres:stepByPart[group]};
}


/** Step 3: source-labelled wheel assemblies. Transform into the SAME
 * canonical GTD frame as accepted body; pivot about measured wheel centre.
 * No source wheel geometry enters the accepted body/trim extraction.
 */
const wheels={};
const wheelGroups=["frontLeft","frontRight","rearLeft","rearRight"];
const isRubber=seg=>/tire|tyre|rubber|pneumatic|pneu|gomma/i.test(seg.name+" "+seg.material);
const projectedBounds=seg=>{
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<seg.positions.length;i+=3){
   const v=normalize(seg.positions.slice(i,i+3));
   for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}
 }
 return {min,max,span:min.map((v,k)=>max[k]-v)};
};
function nativeWheelPart(segments,centre,kind){
 const positions=[],normals=[],indices=[];
 let sourceTriangles=0;
 for(const seg of segments){
   sourceTriangles+=seg.indices.length/3;
   // Preserve original rim-spoke openings and contours; no cross-mesh weld.
   const g=clusterSegment(seg,kind==="rim"?.002:.003);
   if(!g.indices.length)continue;
   const offset=positions.length/3;
   for(let i=0;i<g.positions.length;i+=3){
     positions.push(g.positions[i]-centre[0],g.positions[i+1]-centre[1],
       g.positions[i+2]-centre[2]);
   }
   normals.push(...g.normals);
   for(const k of g.indices)indices.push(k+offset);
 }
 if(indices.length<9||indices.length/3>30000)throw Error(
   "GEN-VEH-003 source wheel "+kind+" geometry unusable "+indices.length/3);
 const p=new Int16Array(positions.length),n=new Int8Array(normals.length);
 for(let i=0;i<p.length;i++){
   const q=Math.round(positions[i]*1000);
   if(q<-32768||q>32767)throw Error("GEN-VEH-003 wheel coordinate overflow");
   p[i]=q;n[i]=Math.round(Math.max(-1,Math.min(1,normals[i]))*127);
 }
 const wide=positions.length/3>65535;
 const idx=wide?new Uint32Array(indices):new Uint16Array(indices);
 return {p:Buffer.from(p.buffer).toString("base64"),
   n:Buffer.from(n.buffer).toString("base64"),
   i:Buffer.from(idx.buffer).toString("base64"),
   indexBits:wide?32:16,triangles:indices.length/3,vertices:positions.length/3,
   sourceTriangles,sourcePrimitives:segments.length};
}
for(const corner of wheelGroups){
 const all=wheelRaw[corner].segments;
 if(all.length<3)throw Error("GEN-VEH-003 missing source wheel group "+corner+" "+all.length);
 const rubber=all.filter(isRubber);
 // The GLB names outer tyre rubber surfaces; use their actual transformed
 // bounds to locate each axle. Conservative fallback uses roundest/large
 // radial extents, NEVER hardcoded nominal car dimensions.
 const candidates=rubber.length?rubber:all;
 let best=null,bestScore=-Infinity;
 for(const seg of candidates){
   const b=projectedBounds(seg),dia=Math.max(b.span[1],b.span[2]);
   const circleRatio=Math.min(b.span[1],b.span[2])/Math.max(dia,.0001);
   const score=dia*circleRatio*(1+Math.min(2,seg.indices.length/9000));
   if(circleRatio>.72&&score>bestScore){best=b;bestScore=score;}
 }
 if(!best)throw Error("GEN-VEH-003 no circular tyre mesh at "+corner+
   " source nodes="+all.map(s=>s.name).slice(0,25).join("|"));
 const centre=best.min.map((v,i)=>(v+best.max[i])/2);
 // Axle points are measured separately for each wheel, from its rim/tire.
 const radius=Math.max(best.span[1],best.span[2])*.5;
 const lateralWidth=best.span[0];
 if(radius<.20||radius>.65||lateralWidth<.05||lateralWidth>.65)
   throw Error("GEN-VEH-003 nonphysical "+corner+" radius="+radius+" width="+lateralWidth);
 const rims=all.filter(s=>!rubber.includes(s));
 if(!rims.length)throw Error("GEN-VEH-003 missing source rim at "+corner);
 const tyres=rubber.length?rubber:[candidates.find(s=>projectedBounds(s)===best)].filter(Boolean);
 // Without explicit tire tags source rim extraction remains truthful: any
 // black wheel detail is kept, and a cheap tire shell can be used at runtime.
 wheels[corner]={center:centre.map(v=>Math.round(v*1000)/1000),
   radius:Math.round(radius*1000)/1000,width:Math.round(lateralWidth*1000)/1000,
   tire:rubber.length?nativeWheelPart(tyres,centre,"tire"):null,
   rim:nativeWheelPart(rims,centre,"rim"),
   sourceParts:all.length,usedTaggedRubber:rubber.length>0};
}
const wf=wheels.frontLeft,wr=wheels.frontRight,
      wl=wheels.rearLeft,wrr=wheels.rearRight;
if(Math.abs(wf.center[2]-wr.center[2])>.15||
   Math.abs(wl.center[2]-wrr.center[2])>.15||
   Math.abs(wf.center[1]-wr.center[1])>.15||
   Math.abs(wl.center[1]-wrr.center[1])>.15||
   Math.abs(Math.abs(wf.center[0])-Math.abs(wr.center[0]))>.18||
   Math.abs(Math.abs(wl.center[0])-Math.abs(wrr.center[0]))>.18||
   Math.abs(wf.center[2]-wl.center[2])<1.8)
 throw Error("GEN-VEH-003 wheel centres not four symmetric source axles "+
   JSON.stringify(wheelGroups.map(k=>[k,wheels[k].center])));

const result=Object.fromEntries(groups.map(k=>[k,encoded(k)]));
const finalTriangles=groups.reduce((s,k)=>s+result[k].triangles,0);
if(finalTriangles>maxTotalTriangles)throw Error("GEN-VEH-002 excessive native triangle load "+finalTriangles);
const output=[
 "/** GENERATED by scripts/genveh002-extract-temerario.mjs from ORIGINAL committed GLB.",
 " * This is compact SOURCE-DERIVED EXTERIOR triangle geometry, NOT a GLB runtime import.",
 " * Do not hand-edit: rerun node scripts/genveh002-extract-temerario.mjs. */",
 "export const TEMERARIO_SOURCE_PARTS_002 = "+JSON.stringify(result)+" as const;",
 "export const TEMERARIO_SOURCE_WHEELS_003 = "+JSON.stringify(wheels)+" as const;",
 "",
].join("\n");
mkdirSync(dirname(outPath),{recursive:true});
writeFileSync(outPath,output);
console.info("GEN_VEH_002_SOURCE_EXTERIOR "+JSON.stringify({
  sourceBytes:input.length,sourceMeshes:inspected,sourceTriangles:totalTriangles,
  exteriorBounds:min.map((v,k)=>[v,max[k]]),footprintScale:scale,
  outputBytes:Buffer.byteLength(output),
  parts:Object.fromEntries(groups.map(k=>[k,{triangles:result[k].triangles,
    vertices:result[k].vertices,sourceTriangles:result[k].sourceTriangles,sourcePrimitives:result[k].sourcePrimitives,keptPrimitives:result[k].keptPrimitives,skippedPrimitives:result[k].skippedPrimitives,skippedTriangles:result[k].skippedTriangles,clusterMetres:result[k].clusterMetres}])),
  finalTriangles,rejectedDegenerate,rejectedInversion,sourceNormalsPresent,
  wheelParts:[...sourceWheelNames].length,wheels:Object.fromEntries(wheelGroups.map(k=>[k,{center:wheels[k].center,radius:wheels[k].radius,width:wheels[k].width,sourceParts:wheels[k].sourceParts,rimTriangles:wheels[k].rim.triangles,tireTriangles:wheels[k].tire?.triangles??0,usedTaggedRubber:wheels[k].usedTaggedRubber}])),
}));
