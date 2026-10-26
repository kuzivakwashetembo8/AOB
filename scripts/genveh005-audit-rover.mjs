/** GEN-VEH-005: Range Rover Sport 2018 source asset census. Build-only, diagnostic. */
import {readFile} from "node:fs/promises";
import {NodeIO} from "@gltf-transform/core";
import {ALL_EXTENSIONS} from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
const path="public/GLBs/Cars/Range Rover Sports 2018 (.GLB).glb";
const b=await readFile(path);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
 "draco3d.decoder":await draco3d.createDecoderModule(),
});
const d=await io.readBinary(b),root=d.getRoot();
const nodes=root.listNodes(),meshes=root.listMeshes(),materials=root.listMaterials();
const all=[],matCount=new Map(),names=new Map();
let nFaces=0;
for(const node of nodes){
 const mesh=node.getMesh();
 if(!mesh)continue;
 for(const p of mesh.listPrimitives()){
   const pos=p.getAttribute("POSITION")?.getArray(),idx=p.getIndices()?.getArray();
   if(!pos||!idx)continue;
   const mat=p.getMaterial()?.getName()??"none";matCount.set(mat,(matCount.get(mat)||0)+idx.length/3);
   const name=node.getName()||mesh.getName()||"unnamed";
   names.set(name,(names.get(name)||0)+idx.length/3);
   const world=node.getWorldMatrix();
   let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<pos.length;i+=3){
    const x=pos[i],y=pos[i+1],z=pos[i+2],v=[
      world[0]*x+world[4]*y+world[8]*z+world[12],
      world[1]*x+world[5]*y+world[9]*z+world[13],
      world[2]*x+world[6]*y+world[10]*z+world[14]
    ];
    for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],v[k]);hi[k]=Math.max(hi[k],v[k]);}
   }
   const mid=lo.map((v,k)=>+(v+hi[k])/2),dim=lo.map((v,k)=>+(hi[k]-v));
   all.push({name,mat,tri:idx.length/3,mid:mid.map(x=>+x.toFixed(3)),dim:dim.map(x=>+x.toFixed(3)),
    vertices:pos.length/3});
   nFaces+=idx.length/3;
 }
}
const byTri=(a,b)=>b.tri-a.tri;
const report={bytes:b.length,nodes:nodes.length,meshes:meshes.length,materials:materials.length,
  totalTriangles:nFaces,primitives:all.length,
  materialSummary:[...matCount].sort((a,b)=>b[1]-a[1]).slice(0,50),
  topNodes:[...all].sort(byTri).slice(0,40),
  wheelLike:all.filter(x=>/wheel|tire|tyre|rim|brake|disc|caliper|whe_/i.test(x.name+" "+x.mat)).sort(byTri).slice(0,75),
  compactNodeNames:[...names].sort((a,b)=>b[1]-a[1]).slice(0,100),
  materialNames:materials.map(x=>x.getName()).slice(0,90),
};
console.info("GEN_VEH_005_ROVER_AUDIT "+JSON.stringify(report));
