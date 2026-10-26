/** GEN-VEH-007: seven original GLBs -> budgeted native moving-traffic meshes.
 * Original files remain untouched; all decoding is offline in prebuild.
 * Source wheel isolation is labelled per model; opaque wheel meshes that
 * cannot be separated are clearly reported, not claimed as source-exact.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {NodeIO} from "@gltf-transform/core";
import {ALL_EXTENSIONS} from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import {dirname} from "node:path";
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
 .registerDependencies({"draco3d.decoder":await draco3d.createDecoderModule()});
const models=[
 {id:"hilux",source:"public/GLBs/Cars/toyota hilux 002.glb",L:5.25,W:2.15,H:1.87,axis:"z",budget:26000},
 {id:"defender",source:"public/GLBs/Cars/Land rover defender 001.glb",L:4.75,W:2.10,H:2.02,axis:"z",budget:26000},
 {id:"dodge",source:"public/GLBs/Cars/dodge_HP.glb",L:5.10,W:2.06,H:1.87,axis:"z",budget:30000},
 {id:"sedan",source:"public/GLBs/Cars/Four Door Sedan.glb",L:4.75,W:1.85,H:1.55,axis:"x",budget:22000},
 {id:"hatchback",source:"public/GLBs/Cars/Fourd Confusion Hatchback.glb",L:4.35,W:1.78,H:1.60,axis:"z",budget:22000},
 {id:"taxi",source:"public/GLBs/Cars/Taxi.glb",L:4.50,W:1.85,H:1.90,axis:"z",budget:17000},
 {id:"kangoo",source:"public/GLBs/Cars/Renault Kango Optimized.glb",L:4.45,W:1.85,H:1.88,axis:"z",budget:26000},
];
const corners=["frontLeft","frontRight","rearLeft","rearRight"];
const groups=["paint","glass","trim","frontLight","rearLight"];
const posWorld=(v,m)=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],
 m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],
 m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]];
function normWorld(v,m){
 const a=m[0],b=m[4],c=m[8],d=m[1],e=m[5],f=m[9],g=m[2],h=m[6],i=m[10];
 const A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,D=c*h-b*i,E=a*i-c*g,F=b*g-a*h,G=b*f-c*e,H=c*d-a*f,I=a*e-b*d;
 const det=a*A+b*B+c*C||1;
 const w=[(A*v[0]+B*v[1]+C*v[2])/det,(D*v[0]+E*v[1]+F*v[2])/det,(G*v[0]+H*v[1]+I*v[2])/det];
 const len=Math.hypot(...w)||1;return w.map(n=>n/len);
}
const bounds=points=>{
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<points.length;i+=3)for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],points[i+a]);hi[a]=Math.max(hi[a],points[i+a]);}
 return {lo,hi,center:lo.map((v,i)=>(v+hi[i])/2),dims:lo.map((v,i)=>hi[i]-v)};
};
const groupFor=(model,seg)=>{
 const m=seg.mat.toLowerCase(),name=seg.name.toLowerCase();
 if(["hilux","defender","dodge"].includes(model.id))return "paint";
 if(/glass|window|windscreen|windshield|clearlens|wind_screen/.test(m+" "+name))return "glass";
 if(/headlight|front.?light|fl_(lens|halo|glass)|light_white|light_.*shine/.test(m+" "+name))return "frontLight";
 if(/tail.?light|redlens|redlight|_0-red|_0-3stop|tailight/.test(m+" "+name))return "rearLight";
 if(/paint|colormain|body|livery|shield|croco/.test(m))return "paint";
 if(model.id==="taxi"&&/taxiSign/.test(seg.mat))return "trim";
 if(model.id==="taxi"&&m==="material")return "paint";
 if(model.id==="sedan"&&m==="chrome")return "trim";
 if(model.id==="hatchback"&&/lattice|plastic|chrome/.test(m))return "trim";
 return "trim";
};
// Components are detected from triangle connectivity within a primitive;
// never merge separate GLB nodes even when coordinates occupy the same voxel.
function islands(seg){
 const count=seg.p.length/3,parents=new Int32Array(count),rank=new Uint8Array(count);
 for(let j=0;j<count;j++)parents[j]=j;
 const find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i]}return i;};
 const join=(a,b)=>{a=find(a);b=find(b);if(a===b)return;if(rank[a]<rank[b])parents[a]=b;else if(rank[a]>rank[b])parents[b]=a;else{parents[b]=a;rank[a]++;}};
 for(let j=0;j<seg.i.length;j+=3){join(seg.i[j],seg.i[j+1]);join(seg.i[j],seg.i[j+2]);}
 const grouped=new Map();
 for(let j=0;j<seg.i.length;j+=3){
  const key=find(seg.i[j]),g=grouped.get(key)||[];g.push(seg.i[j],seg.i[j+1],seg.i[j+2]);grouped.set(key,g);
 }
 if(grouped.size<2)return [seg];
 const result=[];
 for(const idx of grouped.values()){
  if(idx.length<12)continue;
  const map=new Map(),p=[],n=[],remapped=[];
  for(const original of idx){
   let i=map.get(original);
   if(i===undefined){i=p.length/3;map.set(original,i);
    for(let k=0;k<3;k++){p.push(seg.p[original*3+k]);n.push(seg.n[original*3+k]);}}
   remapped.push(i);
  }
  result.push({name:seg.name,mat:seg.mat,p,n,i:remapped});
 }
 return result;
}
function compactIndices(seg,subset){
 const p=[],n=[],idx=[],mapping=new Map();
 for(const old of subset){
  let a=mapping.get(old);
  if(a===undefined){
   a=p.length/3;mapping.set(old,a);
   for(let k=0;k<3;k++){
    p.push(seg.p[old*3+k]);if(seg.n.length===seg.p.length)n.push(seg.n[old*3+k]);
   }
  }
  idx.push(a);
 }
 return {...seg,p,n,i:idx};
}
function rimOrTire(name,material){
 const n=(name+" "+material).toLowerCase();
 if(/tire|tyre|rubber|tread|_0-tire/.test(n))return "tire";
 if(/rim|alloy|spoke|lug_|center_cap|hub|_0-alu|chrome08/.test(n))return "rim";
 return null;
}
function knownWheel(model,seg){
 const n=seg.name,mat=seg.mat;
 if(model.id==="sedan")return /107 reused (Sculpted_tyre|Siped tread blocks|Alloy_five_spoke_rim|Center_cap|Lug_|Valve_stem)/i.test(n);
 if(model.id==="hatchback")return /Ford_Rim|Wheel_Tires_/i.test(n)||/M_Wheel_(Rim|Tire)/i.test(mat);
 if(model.id==="taxi")return /^Object_(7|33|35|37)$/.test(n);
 if(model.id==="kangoo")return /_0-tire|_0-alu|chrome08/i.test(mat);
 return false;
}
function sourceGroup(model,segs){
 const all=segs.flatMap(x=>x.p),b=bounds(all);if(!Number.isFinite(b.dims[0]))throw Error("empty source "+model.id);
 const long=model.axis==="x"?0:2,wide=model.axis==="x"?2:0;
 const scale=Math.min(model.L/b.dims[long],model.W/b.dims[wide],model.H/b.dims[1]);
 const canonical=p=>[
   (model.axis==="x"?p[2]-b.center[2]:p[0]-b.center[0])*scale,
   (p[1]-b.lo[1])*scale+.015,
   (model.axis==="x"?p[0]-b.center[0]:p[2]-b.center[2])*scale
 ];
 const normal=p=>{
   const v=model.axis==="x"?[p[2],p[1],p[0]]:p;
   const m=Math.hypot(...v)||1;return v.map(t=>t/m);
 };
 const transformed=segs.map(s=>({name:s.name,mat:s.mat,
   p:s.p.flatMap((_,i)=>i%3===0?canonical(s.p.slice(i,i+3)):[]),
   n:s.n.flatMap((_,i)=>i%3===0?normal(s.n.slice(i,i+3)):[]),i:s.i}));
 return {segments:transformed,sourceBounds:b,scale,extents:bounds(transformed.flatMap(x=>x.p))};
}
function componentIsWheel(seg,total){
 const b=bounds(seg.p),d=b.dims,c=b.center,extent=total.dims;
 const radial=Math.max(d[1],d[2]),ratio=Math.min(d[1],d[2])/Math.max(.0001,radial);
 // Wheels near the lower left/right extremes and front/rear quarters.
 return d[0]<Math.max(.13,extent[0]*.40)&&
   radial>.29&&radial<1.06&&ratio>.66&&
   Math.abs(c[0])>extent[0]*.24&&Math.abs(c[2])>extent[2]*.19&&
   c[1]<extent[1]*.53;
}
function cornerFor(seg){
 const c=bounds(seg.p).center;
 return (c[2]>=0?"front":"rear")+(c[0]>=0?"Left":"Right");
}
function simplify(seg,step){
 const {p,n,i:idx}=seg;
 const count=p.length/3,hasNormal=n.length===p.length;
 const boundary=new Uint8Array(count),edges=new Map();
 const edge=(a,b)=>{const k=a<b?a+":"+b:b+":"+a;edges.set(k,(edges.get(k)||0)+1);};
 for(let k=0;k<idx.length;k+=3){edge(idx[k],idx[k+1]);edge(idx[k+1],idx[k+2]);edge(idx[k+2],idx[k]);}
 for(const [key,c] of edges)if(c!==2){const [a,b]=key.split(":").map(Number);boundary[a]=1;boundary[b]=1;}
 edges.clear();
 const sums=[],lookup=new Map(),mapped=new Uint32Array(count);
 for(let j=0;j<count;j++){
  const i=j*3,nrm=hasNormal?[n[i],n[i+1],n[i+2]]:[0,0,0];
  const q=step? [Math.round(p[i]/step),Math.round(p[i+1]/step),Math.round(p[i+2]/step)].join(","):"v"+j;
  const dir=hasNormal?nrm.map(x=>Math.round(x*6)).join(","):"0";
  const key=boundary[j]?"b"+j:q+":"+dir;
  let id=lookup.get(key);
  if(id===undefined){id=sums.length;sums.push([0,0,0,0,0,0,0]);lookup.set(key,id);}
  const v=sums[id];v[0]+=p[i];v[1]+=p[i+1];v[2]+=p[i+2];v[3]+=nrm[0];v[4]+=nrm[1];v[5]+=nrm[2];v[6]++;mapped[j]=id;
 }
 const pp=[],nn=[],ii=[],seen=new Set();
 for(const v of sums){pp.push(v[0]/v[6],v[1]/v[6],v[2]/v[6]);const t=Math.hypot(v[3],v[4],v[5])||1;nn.push(v[3]/t,v[4]/t,v[5]/t);}
 for(let j=0;j<idx.length;j+=3){
  const a=mapped[idx[j]],b=mapped[idx[j+1]],c=mapped[idx[j+2]];
  if(a===b||b===c||a===c)continue;
  const A=a*3,B=b*3,C=c*3;
  const u=[pp[B]-pp[A],pp[B+1]-pp[A+1],pp[B+2]-pp[A+2]],
    v=[pp[C]-pp[A],pp[C+1]-pp[A+1],pp[C+2]-pp[A+2]];
  const cross=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
  if(cross<1e-7)continue;
  const k=[a,b,c].sort((a,b)=>a-b).join(":");if(seen.has(k))continue;seen.add(k);ii.push(a,b,c);
 }
 if(!hasNormal){
  nn.fill(0);
  for(let j=0;j<ii.length;j+=3){
   const [a,b,c]=ii.slice(j,j+3),A=a*3,B=b*3,C=c*3;
   const u=[pp[B]-pp[A],pp[B+1]-pp[A+1],pp[B+2]-pp[A+2]],
     v=[pp[C]-pp[A],pp[C+1]-pp[A+1],pp[C+2]-pp[A+2]];
   const x=u[1]*v[2]-u[2]*v[1],y=u[2]*v[0]-u[0]*v[2],z=u[0]*v[1]-u[1]*v[0];
   for(const k of [A,B,C]){nn[k]+=x;nn[k+1]+=y;nn[k+2]+=z;}
  }
  for(let j=0;j<nn.length;j+=3){const mag=Math.hypot(nn[j],nn[j+1],nn[j+2])||1;nn[j]/=mag;nn[j+1]/=mag;nn[j+2]/=mag;}
 }
 return {p:pp,n:nn,i:ii};
}
function pack(segments,shift=[0,0,0]){
 const p=[],n=[],i=[];
 for(const seg of segments){
  const off=p.length/3;
  for(let j=0;j<seg.p.length;j+=3)p.push(seg.p[j]-shift[0],seg.p[j+1]-shift[1],seg.p[j+2]-shift[2]);
  for(const nn of seg.n)n.push(nn);
  for(const idx of seg.i)i.push(idx+off);
 }
 if(!i.length)return null;
 const P=new Int16Array(p.length),N=new Int8Array(n.length);
 for(let j=0;j<p.length;j++){
  const q=Math.round(p[j]*1000);
  if(!Number.isFinite(q)||q<-32768||q>32767)throw Error("GEN-VEH-007 invalid coordinate "+q);
  P[j]=q;N[j]=Math.round(Math.max(-1,Math.min(1,n[j]||0))*127);
 }
 const idx=p.length/3>65535?new Uint32Array(i):new Uint16Array(i);
 return {p:Buffer.from(P.buffer).toString("base64"),n:Buffer.from(N.buffer).toString("base64"),
  i:Buffer.from(idx.buffer).toString("base64"),indexBits:idx.BYTES_PER_ELEMENT*8,
  vertices:p.length/3,triangles:i.length/3};
}
const output={};const diagnostics=[];
for(const model of models){
 const bytes=await readFile(model.source),doc=await io.readBinary(bytes),raw=[];
 for(const node of doc.getRoot().listNodes()){
  if(!node.getMesh())continue;
  const m=node.getWorldMatrix(),name=node.getName()||"";
  for(const primitive of node.getMesh().listPrimitives()){
   const p=primitive.getAttribute("POSITION")?.getArray(),
     n=primitive.getAttribute("NORMAL")?.getArray(),idx=primitive.getIndices()?.getArray();
   if(!p||!idx)continue;
   const positions=[],normals=[];
   for(let j=0;j<p.length;j+=3){
    positions.push(...posWorld([p[j],p[j+1],p[j+2]],m));
    if(n&&n.length===p.length)normals.push(...normWorld([n[j],n[j+1],n[j+2]],m));
   }
   raw.push({name,mat:primitive.getMaterial()?.getName()||"",p:positions,n:normals,i:Array.from(idx)});
  }
 }
 const norm=sourceGroup(model,raw),parts=Object.fromEntries(groups.map(k=>[k,[]])),wheels=Object.fromEntries(corners.map(k=>[k,{rim:[],tire:[]}]));
 const wheelCandidates=[];
 for(const seg of norm.segments){
  const known=knownWheel(model,seg),rtype=rimOrTire(seg.name,seg.mat);
  if(known){
    // Four-labelled rims and tyres: large combined tyre material is cut by
    // triangle-centroid nearest axle, keeping source face topology intact.
    const b=bounds(seg.p),spread=b.dims[0]>model.W*.45&&b.dims[2]>model.L*.4;
    if(spread&&rtype){
      const group={};
      for(let j=0;j<seg.i.length;j+=3){
       const ix=seg.i.slice(j,j+3);
       const centre=[0,0,0];
       for(const index of ix)for(let k=0;k<3;k++)centre[k]+=seg.p[index*3+k]/3;
       const c=(centre[2]>=0?"front":"rear")+(centre[0]>=0?"Left":"Right");
       (group[c]??=[]).push(...ix);
      }
      for(const [c,idx] of Object.entries(group))wheels[c][rtype].push(compactIndices(seg,idx));
    }else if(rtype){wheels[cornerFor(seg)][rtype].push(seg);}
    else{wheelCandidates.push(seg);}
    continue;
  }
  if(["hilux","defender","dodge","kangoo"].includes(model.id)){
   for(const island of islands(seg)){
     if(componentIsWheel(island,norm.extents)){
      wheelCandidates.push(island);
     }else parts[groupFor(model,island)].push(island);
   }
  }else parts[groupFor(model,seg)].push(seg);
 }
 for(const seg of wheelCandidates){
  const c=cornerFor(seg),b=bounds(seg.p);
  const kind=rimOrTire(seg.name,seg.mat)||
   (Math.max(b.dims[1],b.dims[2])>.4?"tire":"rim");
  wheels[c][kind].push(seg);
 }
 // If a mono-mesh wheel cannot be isolated confidently, retain full source
 // body and use inexpensive native procedural rolling wheels in the renderer.
 let originalTriangles=raw.reduce((a,s)=>a+s.i.length/3,0);
 const target=model.budget;
 let packed=null,chosen=0,triangleCount=Infinity;
 for(const step of [.012,.024,.040,.06,.085,.12,.17,.24]){
  const geom={};let sum=0;
  for(const k of groups){
   const gs=parts[k].map(x=>simplify(x,step*(k==="glass"?.5:1)));
   geom[k]=pack(gs);sum+=geom[k]?.triangles||0;
  }
  triangleCount=sum;packed=geom;chosen=step;
  if(sum<=target)break;
 }
 // If even very aggressive conservative clustering cannot reach the budget,
 // the model must stay procedural rather than causing another BMW regression.
 const sourceUsable=triangleCount<=target;
 const fittedWheels={};let genuine=0;
 for(const corner of corners){
   const rim=wheels[corner].rim,tire=wheels[corner].tire;
   if(!rim.length&&!tire.length)continue;
   const source=[...rim,...tire],bb=bounds(source.flatMap(x=>x.p));
   const centre=bb.center,rad=Math.max(bb.dims[1],bb.dims[2])/2;
   if(!(rad>.22&&rad<.66))continue;
   const wheelParts={};
   for(const kind of ["rim","tire"]){
     const gs=wheels[corner][kind].map(x=>simplify(x,.024));
     wheelParts[kind]=pack(gs,centre);
   }
   if(!wheelParts.rim||!wheelParts.tire)continue;
   fittedWheels[corner]={center:centre.map(v=>+v.toFixed(3)),
     radius:+rad.toFixed(3),width:+bb.dims[0].toFixed(3),
     ...wheelParts};
   genuine++;
 }
 // We never claim fully extracted wheels unless all 4 original source units
 // have both independently identifiable rubber and rim.
 const completeWheels=genuine===4;
 output[model.id]={source:model.source,sourceTriangles:originalTriangles,
   geometryTriangles:triangleCount,cluster:chosen,
   status:sourceUsable?"source":"procedural-budget",
   wheelsStatus:completeWheels?"source":"procedural-wheel-fallback",
   body:sourceUsable?packed:null,wheels:completeWheels?fittedWheels:null};
 const report={id:model.id,sourceTriangles:originalTriangles,
  geometryTriangles:triangleCount,cluster:chosen,
  bodyReady:sourceUsable,genuineWheels:genuine,wheelsReady:completeWheels,
  sourceParts:Object.fromEntries(groups.map(k=>[k,parts[k].length])),
  wheelPrimitives:Object.fromEntries(corners.map(k=>[k,{
    tire:wheels[k].tire.length,rim:wheels[k].rim.length}]))};
 diagnostics.push(report);console.info("GEN_VEH_007_RESULT "+JSON.stringify(report));
}
const path="src/game/vehicles/native-seven-source-data-007.ts";
const text=[
"/** Offline generated by genveh007-extract-seven.mjs. BMW is excluded. */",
"export type SevenNativeEncoded007={p:string;n:string;i:string;indexBits:number;vertices:number;triangles:number};",
"export type SevenNativeWheel007={center:number[];radius:number;width:number;rim:SevenNativeEncoded007;tire:SevenNativeEncoded007};",
"export type SevenNativeEntry007={source:string;sourceTriangles:number;geometryTriangles:number;cluster:number;status:string;wheelsStatus:string;body:Record<string,SevenNativeEncoded007|null>|null;wheels:Record<string,SevenNativeWheel007>|null};",
"export const SEVEN_SOURCE_NATIVE_007:Record<string,SevenNativeEntry007> = "+JSON.stringify(output)+";",""
].join("\n");
await mkdir(dirname(path),{recursive:true});
await writeFile(path,text);
console.info("GEN_VEH_007_COMPLETE "+JSON.stringify({
  models:diagnostics.map(x=>x.id),sourceReady:diagnostics.filter(x=>x.bodyReady).length,
  wheelReady:diagnostics.filter(x=>x.wheelsReady).length,bytes:Buffer.byteLength(text)}));
