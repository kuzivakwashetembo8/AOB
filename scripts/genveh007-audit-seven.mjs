/** GEN-VEH-007, offline census for rendered owner vehicle sources. */
import {readFile} from "node:fs/promises";
import {NodeIO} from "@gltf-transform/core";
import {ALL_EXTENSIONS} from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder":await draco3d.createDecoderModule()
});
export const models=[
 {id:"hilux",path:"public/GLBs/Cars/toyota hilux 002.glb",length:5.25,width:2.15,height:1.87},
 {id:"defender",path:"public/GLBs/Cars/Land rover defender 001.glb",length:4.75,width:2.1,height:2.02},
 {id:"dodge",path:"public/GLBs/Cars/dodge_HP.glb",length:5.10,width:2.06,height:1.87},
 {id:"sedan",path:"public/GLBs/Cars/Four Door Sedan.glb",length:4.75,width:1.85,height:1.48},
];
const xf=(p,m)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
 m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
 m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
for(const model of models){
 try{
  const bytes=await readFile(model.path);
  const d=await io.readBinary(bytes),root=d.getRoot(),ns=[],groups=new Map();
  const gMin=[Infinity,Infinity,Infinity],gMax=[-Infinity,-Infinity,-Infinity];
  let triangles=0,primitives=0;
  for(const node of root.listNodes()){
   const mesh=node.getMesh();if(!mesh)continue;
   const name=node.getName()||mesh.getName()||"";
   const m=node.getWorldMatrix();let localTriangles=0;
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],mats={};
   for(const prim of mesh.listPrimitives()){
    const p=prim.getAttribute("POSITION")?.getArray();
    const idx=prim.getIndices()?.getArray();
    if(!p||!idx)continue;
    const mat=prim.getMaterial()?.getName()??"";
    mats[mat]=(mats[mat]||0)+idx.length/3;
    groups.set(mat,(groups.get(mat)||0)+idx.length/3);
    primitives++;triangles+=idx.length/3;localTriangles+=idx.length/3;
    for(let j=0;j<p.length;j+=3){
      const v=xf([p[j],p[j+1],p[j+2]],m);
      for(let k=0;k<3;k++){
       min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);
       gMin[k]=Math.min(gMin[k],v[k]);gMax[k]=Math.max(gMax[k],v[k]);
      }
    }
   }
   if(localTriangles>0)ns.push({name,triangles:localTriangles,mats,
    center:min.map((v,k)=>+((v+max[k])/2).toFixed(2)),
    dims:min.map((v,k)=>+(max[k]-v).toFixed(2))});
  }
  console.info("GEN_VEH_007_AUDIT "+JSON.stringify({
    id:model.id,bytes:bytes.length,nodeCount:root.listNodes().length,
    primitives,triangles,materials:[...groups].sort((a,b)=>b[1]-a[1]),
    boundingBox:gMin.map((v,k)=>+(gMax[k]-v).toFixed(2)),
    nodes:ns.sort((a,b)=>b.triangles-a.triangles).slice(0,48)
  }));
 }catch(error){console.error("GEN_VEH_007_AUDIT_ERROR "+model.id+" "+String(error));process.exitCode=1;}
}
