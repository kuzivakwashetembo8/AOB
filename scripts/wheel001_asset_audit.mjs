/**
 * WHEEL-001: inspect the ACTUAL source geometry from the repository at build
 * time, after Draco decode and before deployment. No source files mutate.
 *
 * Reports original GLB topology, possible independent tire islands and
 * explicit reasons a rig cannot be safely generated. This is intentionally
 * an AUDIT ONLY: it must not pass a wheelless asset as approved.
 */
import {createHash} from "node:crypto";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {NodeIO} from "@gltf-transform/core";
import {ALL_EXTENSIONS} from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const SOURCES=[
 ["toyota-hilux-002","public/toyota hilux 002.glb"],
 ["land-rover-defender-001","public/Land rover defender 001.glb"],
 ["dodge-hp","public/dodge_HP.glb"],
];
function analyzePositions(sourcePositions,idx,matrix){
 const pos=new Float32Array(sourcePositions.length);
 // GLB accessor coordinates are source-local. Toyota and Defender use an
 // actual +90 degree X glTF node transform (source Y is length, not height).
 // Always measure wheel geometry in source-world (+Y up) coordinates.
 for(let i=0;i<sourcePositions.length;i+=3){
   const x=sourcePositions[i],y=sourcePositions[i+1],z=sourcePositions[i+2];
   pos[i]=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];
   pos[i+1]=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];
   pos[i+2]=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];
 }
 const n=Math.floor(pos.length/3),t=Math.floor(idx.length/3);
 if(n<12||t<4)return {error:"insufficient-geometry"};
 const B=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
 for(let i=0;i<n;i++)for(let axis=0;axis<3;axis++){
   const v=pos[i*3+axis];if(v<B[axis*2])B[axis*2]=v;
   if(v>B[axis*2+1])B[axis*2+1]=v;
 }
 const ext=[B[1]-B[0],B[3]-B[2],B[5]-B[4]];
 const longitudinal=ext[0]>ext[2]?0:2,lateral=longitudinal===0?2:0;
 const parent=new Int32Array(n),rank=new Uint8Array(n);
 for(let i=0;i<n;i++)parent[i]=i;
 const find=start=>{
   let x=start;
   while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}
   return x;
 };
 function union(a,b){
   a=find(a);b=find(b);if(a===b)return;
   if(rank[a]<rank[b])parent[a]=b;
   else if(rank[a]>rank[b])parent[b]=a;
   else {parent[b]=a;rank[a]++;}
 }
 for(let i=0;i<idx.length;i+=3){
   const a=idx[i],b=idx[i+1],c=idx[i+2];
   if(a>=n||b>=n||c>=n||a<0||b<0||c<0)
     return {error:"source-indices-outside-accessor"};
   union(a,b);union(a,c);
 }
 const groups=new Map();
 for(let i=0;i<n;i++){
   const root=find(i);
   let g=groups.get(root);
   if(!g){g={vertices:0,triangles:0,min:[Infinity,Infinity,Infinity],
     max:[-Infinity,-Infinity,-Infinity]};groups.set(root,g);}
   g.vertices++;
   for(let axis=0;axis<3;axis++){
     const p=pos[i*3+axis];
     g.min[axis]=Math.min(g.min[axis],p);g.max[axis]=Math.max(g.max[axis],p);
   }
 }
 for(let i=0;i<idx.length;i+=3){const g=groups.get(find(idx[i]));g.triangles++;}
 const candidates=[];
 for(const g of groups.values()){
   const d=g.min.map((v,i)=>g.max[i]-v);
   const c=g.min.map((v,i)=>(g.max[i]+v)/2);
   const minor=d[lateral],diamH=d[1],diamL=d[longitudinal];
   const nearAxle=Math.abs(c[longitudinal]-(B[longitudinal*2]+B[longitudinal*2+1])/2)>ext[longitudinal]*.22;
   const nearSide=Math.abs(c[lateral]-(B[lateral*2]+B[lateral*2+1])/2)>ext[lateral]*.25;
   const nearRoad=c[1]<B[2]+ext[1]*.56;
   if(g.triangles>=40&&nearAxle&&nearSide&&nearRoad&&
      minor<ext[lateral]*.45&&
      diamH>ext[1]*.11&&diamH<ext[1]*.72&&
      diamL>ext[1]*.11&&diamL<ext[1]*.85&&
      Math.max(diamH,diamL)/Math.max(.001,Math.min(diamH,diamL))<1.35)
      candidates.push({center:c.map(x=>+x.toFixed(4)),
        extents:d.map(x=>+x.toFixed(4)),vertices:g.vertices,triangles:g.triangles});
 }
 const topComponents=[...groups.values()].sort((a,b)=>b.triangles-a.triangles)
 .slice(0,24).map(g=>({vertices:g.vertices,triangles:g.triangles,
   extents:g.min.map((v,i)=>+(g.max[i]-v).toFixed(4))}));
 return {
   vertices:n,triangles:t,topologicalComponents:groups.size,
   rawBounds:B.map(x=>+x.toFixed(5)),rawDimensions:ext.map(x=>+x.toFixed(5)),
   longAxis:longitudinal===0?"X":"Z",topComponents,
   possibleIndependentTireIslands:candidates.slice(0,20),
   status:candidates.length>=4?"inspect-wheel-candidates":"repair-required",
 };
}
async function main(){
 const out={schemaVersion:"MVRS-1",type:"real-source-wheel-topology",
   generatedAt:new Date().toISOString(),results:[]};
 let io;
 try{
   io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
     "draco3d.decoder":await draco3d.createDecoderModule()
   });
 }catch(e){out.error="decoder-init:"+String(e);}
 for(const [modelId,path] of SOURCES){
   const item={modelId,sourceName:path.split("/").at(-1)};
   out.results.push(item);
   try{
     const binary=await readFile(path);
     item.sourceBytes=binary.length;
     item.sha256=createHash("sha256").update(binary).digest("hex");
     if(!io)throw Error("decoder not available");
     const doc=await io.readBinary(binary);
     const roots=doc.getRoot();
     item.nodeNames=roots.listNodes().map(n=>n.getName()).slice(0,100);
     item.meshCount=roots.listMeshes().length;
     item.primitives=[];
     for(const mesh of roots.listMeshes())for(const primitive of mesh.listPrimitives()){
       const p=primitive.getAttribute("POSITION")?.getArray();
       const i=primitive.getIndices()?.getArray();
       if(!p||!i){item.primitives.push({error:"missing-position-or-indices"});continue;}
       const owner=roots.listNodes().find(n=>n.getMesh()===mesh);
       if(!owner)throw Error("source mesh has no owning glTF node");
       item.sourceNode=owner.getName();
       item.sourceWorldTransform=[...owner.getWorldMatrix()].map(v=>+v.toFixed(6));
       item.primitives.push(analyzePositions(p,i,owner.getWorldMatrix()));
     }
     item.state=item.primitives.some(p=>p.error)
       ?"repair-required":item.primitives.every(p=>p.status==="inspect-wheel-candidates")
       ?"needs-supervised-wheel-labeling":"repair-required";
   }catch(e){
     item.state="repair-required";
     item.error=(e instanceof Error?e.message:String(e)).slice(0,350);
   }
 }
 await mkdir("public",{recursive:true});
 await writeFile("public/wheel001-source-audit.json",JSON.stringify(out,null,2)+"\n");
 console.log("[WHEEL-001] source GLB audit",out.results.map(x=>({
    modelId:x.modelId,state:x.state,meshCount:x.meshCount,
    candidateCount:x.primitives?.reduce((n,p)=>n+(p.possibleIndependentTireIslands?.length??0),0),
    error:x.error,
 })));
}
await main();
