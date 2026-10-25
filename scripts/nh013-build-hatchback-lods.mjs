/** NH-013 G2: source-derived 3D hatchback LODs from the user GLB.
 * Keep source wheel/tyre assemblies, glazing and color main; omit very small
 * ancillary geometry progressively. This does NOT claim triangle decimation.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
const dir=join("public","GLBs","Cars");
const source=readFileSync(join(dir,"TrafficOptimized","Fourd-Confusion-Hatchback-Rigged.glb"));
if(source.toString("ascii",0,4)!=="glTF"||source.readUInt32LE(4)!==2||
 source.readUInt32LE(8)!==source.length)throw Error("NH013 hatchback source corrupted");
const jsonLength=source.readUInt32LE(12);
const input=JSON.parse(source.toString("utf8",20,20+jsonLength));
const bin=source.subarray(20+jsonLength);
const outputDir=join(dir,"TrafficOptimized");mkdirSync(outputDir,{recursive:true});
const keep=(p,m,level)=>{
 const material=(input.materials?.[p.material??-1]?.name??"").toLowerCase();
 const name=(m.name??"").toLowerCase();
 const count=input.accessors?.[p.indices??-1]?.count??
   input.accessors?.[p.attributes?.POSITION??-1]?.count??0;
 const triangles=Math.floor(count/3);
 const wheel=/wheel|rim|tyre|tire|nh013_hatch/.test(name+" "+material);
 const required=/body_colormain|glass_main|glass_rubber/.test(material)||wheel;
 if(level===1)return required||triangles>=350;
 return required||(/light|chrome|body_plastic|mirror/.test(material)&&triangles>=500);
};
for(const level of [1,2]){
 const gltf=JSON.parse(JSON.stringify(input));let kept=0,triangles=0,removed=0;
 for(let i=0;i<(gltf.meshes?.length??0);i++){
   const mesh=gltf.meshes[i],original=input.meshes[i];
   mesh.primitives=mesh.primitives.filter(p=>keep(p,original,level));
 }
 for(const node of gltf.nodes??[]){
   if(node.mesh===undefined)continue;
   const primitives=gltf.meshes[node.mesh]?.primitives??[];
   if(!primitives.length){delete node.mesh;removed++;continue;}
   kept+=primitives.length;
   for(const p of primitives){
     triangles+=Math.floor((gltf.accessors?.[p.indices??-1]?.count??
       gltf.accessors?.[p.attributes?.POSITION??-1]?.count??0)/3);
   }
 }
 // glTF requires every declared mesh to have at least one primitive;
 // nodes with empty meshes are no longer referenced after omission.
 for(let i=0;i<gltf.meshes.length;i++){
   if(gltf.meshes[i].primitives.length===0)
     gltf.meshes[i].primitives=[input.meshes[i].primitives[0]];
 }
 gltf.asset={...gltf.asset,generator:"GTD NH013 hatchback derived from user source LOD"+level};
 const js=Buffer.from(JSON.stringify(gltf),"utf8"),pad=Math.ceil(js.length/4)*4;
 const header=Buffer.alloc(20);header.write("glTF",0);header.writeUInt32LE(2,4);
 header.writeUInt32LE(20+pad+bin.length,8);header.writeUInt32LE(pad,12);
 header.write("JSON",16);
 const buf=Buffer.alloc(pad,32);js.copy(buf);
 const out=Buffer.concat([header,buf,bin]);
 const filename="Fourd-Confusion-Hatchback-LOD"+level+".glb";
 writeFileSync(join(outputDir,filename),out);
 console.info("NH013_HATCH_LOD "+JSON.stringify({
   level,filename,parts:kept,triangles,removedNodes:removed,bytes:out.length,
 }));
}
