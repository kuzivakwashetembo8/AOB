/** GEN-VEH-001: deterministic, authored-in-code vehicle silhouettes.
 * The four founding forms are wedge supercar, crew-cab pickup, lifted offroad
 * and angular commuter. No files, GLBs, textures or network calls.
 */
import {Mesh,Scene,VertexData} from "@babylonjs/core";
import {TEMERARIO_SOURCE_PARTS_002,TEMERARIO_SOURCE_WHEELS_003} from "./temerario-source-data-002";

export type GTDGeneratedStyle =
  "supercar"|"pickup"|"offroad"|"sedan"|"hatch"|"taxi"|
  "kango"|"coupe"|"muscle"|"suv";
export interface GTDGeneratedDimensions {
  width:number;length:number;height:number;style:GTDGeneratedStyle;
}
type Ring={z:number;w:number;bottom:number;top:number};
type Geometry={positions:number[];indices:number[];normals?:number[]};
type Cabin={front:number;frontRoof:number;backRoof:number;back:number;
  roof:number;base:number;wide:number};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

export function gtdGeneratedFamily001(style:GTDGeneratedStyle):
  "wedge"|"truck"|"offroad"|"commuter" {
  if(style==="supercar"||style==="coupe"||style==="muscle")return "wedge";
  if(style==="pickup")return "truck";
  if(style==="offroad"||style==="suv")return "offroad";
  return "commuter";
}
function cabin(s:GTDGeneratedDimensions):Cabin{
  const half=s.length*.5;
  switch(gtdGeneratedFamily001(s.style)){
    case "wedge":return {front:half*.46,frontRoof:half*.16,
      backRoof:-half*.57,back:-half*.77,roof:1.35,base:.88,wide:.77};
    case "truck":return {front:half*.36,frontRoof:half*.19,
      backRoof:-half*.25,back:-half*.36,roof:1.90,base:1.09,wide:.81};
    case "offroad":return {front:half*.55,frontRoof:half*.39,
      backRoof:-half*.78,back:-half*.87,roof:1.95,base:1.10,wide:.83};
    default:return {front:half*.49,frontRoof:half*.23,
      backRoof:-half*.55,back:-half*.80,roof:s.style==="kango"?1.83:1.55,
      base:1.00,wide:.80};
  }
}
function loft(g:Geometry,rings:readonly Ring[]){
  const start=g.positions.length/3;
  for(const r of rings){
    const w=r.w/2;
    g.positions.push(-w,r.bottom,r.z,w,r.bottom,r.z,
      w,r.top,r.z,-w,r.top,r.z);
  }
  for(let i=0;i<rings.length-1;i++){
    const a=start+i*4,b=a+4;
    for(let j=0;j<4;j++){
      const k=(j+1)%4;
      g.indices.push(a+j,a+k,b+j,a+k,b+k,b+j);
    }
  }
  const a=start,b=start+(rings.length-1)*4;
  g.indices.push(a,a+2,a+1,a,a+3,a+2);
  g.indices.push(b,b+1,b+2,b,b+2,b+3);
}
function box(g:Geometry,x:number,y:number,z:number,w:number,h:number,d:number){
  loft(g,[{z:z+d/2,w,bottom:y-h/2,top:y+h/2},
    {z:z-d/2,w,bottom:y-h/2,top:y+h/2}].map(r=>r));
  // x translation used only for centre-aligned boxes in this generator.
  if(x!==0)throw Error("GEN-VEH-001 body pieces must remain centred");
}
function toMesh(scene:Scene,name:string,g:Geometry):Mesh{
 const mesh=new Mesh(name,scene);
 const data=new VertexData();
 data.positions=g.positions;data.indices=g.indices;
 const normals:number[]=g.normals??[];
 if(!g.normals)VertexData.ComputeNormals(g.positions,g.indices,normals);
 data.normals=normals;data.applyToMesh(mesh);
 mesh.isPickable=false;mesh.receiveShadows=false;
 return mesh;
}
function hull(s:GTDGeneratedDimensions):Geometry{
  const f=gtdGeneratedFamily001(s.style),half=s.length/2;
  const roofBase=f==="truck"||f==="offroad"?1.11:f==="wedge"?.85:.98;
  const shoulder=f==="truck"?.94:f==="offroad"?.96:f==="wedge"?.90:.91;
  const hood=f==="wedge"?.70:f==="truck"?1.08:f==="offroad"?1.04:.92;
  const g:Geometry={positions:[],indices:[]};
  const rings:Ring[]=[
    {z:half*.99,w:s.width*.88,bottom:.42,top:hood*.92},
    {z:half*.79,w:s.width*.98,bottom:.40,top:hood},
    {z:half*.36,w:s.width*shoulder,bottom:.39,top:roofBase},
    {z:-half*.38,w:s.width*shoulder,bottom:.39,top:roofBase},
    {z:-half*.88,w:s.width*.96,bottom:.41,top:roofBase*.96},
    {z:-half*.99,w:s.width*.88,bottom:.43,top:roofBase*.89},
  ];
  loft(g,rings);
  const c=cabin(s);
  // Roof is painted, not glass. The greenhouse is drawn as another mesh.
  box(g,0,c.roof+.015,(c.frontRoof+c.backRoof)/2,
    s.width*c.wide,.055,Math.abs(c.frontRoof-c.backRoof)+.08);
  if(f==="truck"){
    // Flat load-bed rim and dark well are drawn as separate part materials.
    for(const side of [-1,1]){
      const x=side*s.width*.43;
      // Slim longitudinal bed rails follow the side; add them as loft offsets.
      const start=g.positions.length/3,wide=.13,z=-half*.65;
      g.positions.push(x-wide/2,1.12,z+.45,x+wide/2,1.12,z+.45,
        x+wide/2,1.27,z+.45,x-wide/2,1.27,z+.45,
        x-wide/2,1.12,z-.45,x+wide/2,1.12,z-.45,
        x+wide/2,1.27,z-.45,x-wide/2,1.27,z-.45);
      for(let i=0;i<4;i++){const j=(i+1)%4;g.indices.push(start+i,start+j,start+i+4,start+j,start+j+4,start+i+4);}
    }
  }
  return g;
}
function greenhouse(s:GTDGeneratedDimensions):Geometry{
  const c=cabin(s),g:Geometry={positions:[],indices:[]};
  const roof=c.roof-.005,side=s.width*c.wide;
  const rings:Ring[]=[
    {z:c.front,w:side*.94,bottom:c.base,top:c.base+.025},
    {z:c.frontRoof,w:side,bottom:c.base,top:roof},
    {z:c.backRoof,w:side,bottom:c.base,top:roof},
    {z:c.back,w:side*.91,bottom:c.base,top:c.base+.025},
  ];
  loft(g,rings);
  return g;
}
/** Source-derived exterior data is emitted during the OFFLINE prebuild.
 * Decode ONCE per module, not per frame/traffic agent. A prebuild placeholder
 * keeps source-level unit tests usable without requiring an original GLB decode.
 */
type ExteriorPart002="paint"|"glass"|"trim"|"frontLight"|"rearLight";
const sourceDecoded002=new Map<ExteriorPart002,Geometry>();
export function createTemerarioSourceMesh002(
 scene:Scene,name:string,part:ExteriorPart002,
):Mesh{
 let geom=sourceDecoded002.get(part);
 if(!geom){
  const record=TEMERARIO_SOURCE_PARTS_002[part];
  if(!record.p||!record.i)throw Error("GEN-VEH-002 source triangle extraction was not run");
  const pbytes=Uint8Array.from(atob(record.p),c=>c.charCodeAt(0));
  const ibytes=Uint8Array.from(atob(record.i),c=>c.charCodeAt(0));
  const nbytes=Uint8Array.from(atob(record.n),c=>c.charCodeAt(0));
  const coords=new Int16Array(pbytes.buffer);
  const indices=Number(record.indexBits)===32
    ?new Uint32Array(ibytes.buffer):new Uint16Array(ibytes.buffer);
  const positions=Array.from(coords,v=>v/1000);
  const normals=Array.from(new Int8Array(nbytes.buffer),v=>v/127);
  geom={positions,indices:Array.from(indices),normals};
  if(geom.positions.length/3!==record.vertices||
     geom.indices.length/3!==record.triangles||
     geom.normals?.length!==geom.positions.length)
     throw Error("GEN-VEH-002 native source count mismatch");
  sourceDecoded002.set(part,geom);
 }
 return toMesh(scene,name,geom);
}

/** GEN-VEH-003 source-measured original wheel placement; no body updates. */
export type GTDTemerarioWheelCorner003=
  "frontLeft"|"frontRight"|"rearLeft"|"rearRight";
export type GTDTemerarioWheelPart003="tire"|"rim";
const wheelDecoded003=new Map<string,Geometry>();
export function getTemerarioWheelFit003(corner:GTDTemerarioWheelCorner003){
 const info=TEMERARIO_SOURCE_WHEELS_003[corner];
 return {center:info.center,radius:info.radius,width:info.width,
   sourceParts:info.sourceParts};
}
/** Wheel source geometry is pivot-centered in the offline generator.
 * Construct one shared Babylon thin-instance template per corner/material. */
export function createTemerarioWheelMesh003(
 scene:Scene,name:string,corner:GTDTemerarioWheelCorner003,
 part:GTDTemerarioWheelPart003,
):Mesh{
 const record=TEMERARIO_SOURCE_WHEELS_003[corner][part];
 if(!record||!record.p||!record.i)throw Error(
   "GEN-VEH-003 source wheel missing "+corner+"/"+part);
 const key=corner+":"+part;
 let geometry=wheelDecoded003.get(key);
 if(!geometry){
   const p=Uint8Array.from(atob(record.p),c=>c.charCodeAt(0));
   const n=Uint8Array.from(atob(record.n),c=>c.charCodeAt(0));
   const i=Uint8Array.from(atob(record.i),c=>c.charCodeAt(0));
   const vertices=new Int16Array(p.buffer);
   const indices=Number(record.indexBits)===32?
     new Uint32Array(i.buffer):new Uint16Array(i.buffer);
   geometry={positions:Array.from(vertices,v=>v/1000),
     normals:Array.from(new Int8Array(n.buffer),v=>v/127),
     indices:Array.from(indices)};
   if(geometry.positions.length/3!==record.vertices||
     geometry.indices.length/3!==record.triangles||
     geometry.normals?.length!==geometry.positions.length)
     throw Error("GEN-VEH-003 source wheel corrupt "+key);
   wheelDecoded003.set(key,geometry);
 }
 return toMesh(scene,name,geometry);
}

export function createGTDGeneratedVehicleMesh001(
  scene:Scene,name:string,s:GTDGeneratedDimensions,part:"body"|"glass",
):Mesh{
  if(!(s.length>2&&s.width>1&&s.height>1))
    throw Error("GEN-VEH-001 invalid vehicle size");
  if(s.style==="supercar" && TEMERARIO_SOURCE_PARTS_002.paint.p)
    return createTemerarioSourceMesh002(scene,name,part==="body"?"paint":"glass");
  return toMesh(scene,name,part==="body"?hull(s):greenhouse(s));
}
export const GTD_GENERATED_STARTERS_001=[
  {id:"yellow-wedge-supercar",style:"supercar",paint:"#F3BE12"},
  {id:"white-crew-cab-pickup",style:"pickup",paint:"#E8E9E9"},
  {id:"lifted-compact-offroad",style:"offroad",paint:"#E1E5E5"},
  {id:"silver-angular-commuter",style:"sedan",paint:"#777E87"},
] as const;
export const GENERATED_CAR_FAMILIES_001=[
  "supercar","pickup","offroad","sedan","hatch","taxi",
  "kango","coupe","muscle","suv",
] as const;
export function generatedWheelRadius001(s:GTDGeneratedDimensions){
 const f=gtdGeneratedFamily001(s.style);
 return clamp(f==="offroad"?.41:f==="truck"?.39:f==="wedge"?.34:.35,.31,.45);
}
