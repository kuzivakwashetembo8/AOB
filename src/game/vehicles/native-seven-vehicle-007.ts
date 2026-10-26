/** GEN-VEH-007 — seven source-derived native traffic meshes.
 * Source buffers emitted offline; never load a GLB while driving/flying.
 */
import {Mesh,Scene,VertexData} from "@babylonjs/core";
import {SEVEN_SOURCE_NATIVE_007,
 type SevenNativeEncoded007,type SevenNativeEntry007
} from "./native-seven-source-data-007";
export type SevenSourceModel007="hilux"|"defender"|"dodge"|"sedan"|"hatchback"|"taxi"|"kangoo";
export type SevenSourceBody007="paint"|"glass"|"trim"|"frontLight"|"rearLight";
export type SevenSourceCorner007="frontLeft"|"frontRight"|"rearLeft"|"rearRight";
export type SevenSourceWheelPart007="tire"|"rim";
export const SEVEN_TRAFFIC_MODELS_007:Readonly<Record<string,SevenSourceModel007>>={
 "gtd-veh008-mercer-toyota-hilux":"hilux",
 "gtd-veh009-mercer-land-rover-defender":"defender",
 "gtd-veh010-mercer-dodge-hp":"dodge",
 "gtd-traffic-sedan-013":"sedan",
 "gtd-traffic-hatchback-013":"hatchback",
 "gtd-traffic-taxi-014":"taxi",
 "gtd-traffic-kango-015":"kangoo"
};
const cached=new Map<string,{positions:number[];normals:number[];indices:number[]}>();
const base64=(bytes:string)=>Uint8Array.from(atob(bytes),c=>c.charCodeAt(0));
function geometryFor(key:string,src:SevenNativeEncoded007){
 let g=cached.get(key);if(g)return g;
 const p=new Int16Array(base64(src.p).buffer),
  n=new Int8Array(base64(src.n).buffer);
 const indicesData=base64(src.i);
 const i=src.indexBits===32?new Uint32Array(indicesData.buffer):
   new Uint16Array(indicesData.buffer);
 const positions=Array.from(p,v=>v/1000),normals=Array.from(n,v=>v/127),
   indices=Array.from(i);
 if(positions.length!==normals.length||positions.length/3!==src.vertices||
    indices.length/3!==src.triangles)
   throw Error("GEN-VEH-007 native buffer corrupt "+key);
 g={positions,normals,indices};cached.set(key,g);return g;
}
function create(scene:Scene,name:string,key:string,src:SevenNativeEncoded007){
 const mesh=new Mesh(name,scene),data=new VertexData(),g=geometryFor(key,src);
 data.positions=g.positions;data.indices=g.indices;data.normals=g.normals;
 data.applyToMesh(mesh);mesh.receiveShadows=false;mesh.isPickable=false;
 return mesh;
}
export function sourceRecord007(model:SevenSourceModel007):SevenNativeEntry007|null{
 const r=SEVEN_SOURCE_NATIVE_007[model];return r??null;
}
export function hasNativeBody007(model:SevenSourceModel007):boolean{
 const r=sourceRecord007(model);return r?.status==="source"&&
 !!r.body&&Object.values(r.body).some(p=>p&&p.triangles>0);
}
export function hasNativeWheels007(model:SevenSourceModel007):boolean{
 const r=sourceRecord007(model);return r?.wheelsStatus==="source"&&
 !!r.wheels&&Object.keys(r.wheels).length===4;
}
export function hasSourcePart007(model:SevenSourceModel007,part:SevenSourceBody007){
 return !!sourceRecord007(model)?.body?.[part]?.triangles;
}
export function createNativeBodyPart007(scene:Scene,name:string,
 model:SevenSourceModel007,part:SevenSourceBody007):Mesh{
 const src=sourceRecord007(model)?.body?.[part];
 if(!src)throw Error("GEN-VEH-007 missing body "+model+":"+part);
 return create(scene,name,model+":body:"+part,src);
}
export function sourceWheelFit007(model:SevenSourceModel007,corner:SevenSourceCorner007){
 const w=sourceRecord007(model)?.wheels?.[corner];
 if(!w)throw Error("GEN-VEH-007 missing wheel fit "+model+":"+corner);
 return {center:w.center,radius:w.radius,width:w.width};
}
export function createNativeWheel007(scene:Scene,name:string,model:SevenSourceModel007,
 corner:SevenSourceCorner007,part:SevenSourceWheelPart007):Mesh{
 const src=sourceRecord007(model)?.wheels?.[corner]?.[part];
 if(!src)throw Error("GEN-VEH-007 missing source wheel "+model+":"+corner+":"+part);
 return create(scene,name,model+":wheel:"+corner+":"+part,src);
}
