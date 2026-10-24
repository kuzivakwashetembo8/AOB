/**
 * GTD-NH-REBUILD-003 — South Ward-patterned local road renderer on upland terrain.
 *
 * REBUILD-002 drew independent full-length road/sidewalk ribbons over each other,
 * causing black/grey z-fighting and pedestrian corners with no paved surface.
 * Batch all strips by MATERIAL; clip paved walks at each intersection, join
 * corner pavements, build curb faces, and add measured crossings. Trial-only.
 */
import { Mesh, Scene, StandardMaterial, VertexData } from "@babylonjs/core";

export type NorthHeightsRoadMaterials = Readonly<{
  asphalt: StandardMaterial;
  pavement: StandardMaterial;
  curb: StandardMaterial;
  crossing: StandardMaterial;
}>;
export type NorthHeightsRoadResult = Readonly<{
  roads: number;
  crossings: number;
  sidewalks: number;
  curbs: number;
  surfaceMeshes: number;
}>;
type Layer = "asphalt" | "pavement" | "curb" | "crossing";
type Builder = { p:number[];uv:number[];indices:number[] };
type Point = Readonly<{x:number;y:number;z:number}>;
const WIDTH=8, HALF=WIDTH/2, WALK=3.75, OUTER=HALF+WALK;
const CURB_TOP=.205, WALK_TOP=.20, ASPHALT_TOP=.075;
const STEP=6; // metres between grade samples

function empty():Builder{return {p:[],uv:[],indices:[]};}
function addQuad(b:Builder,a:Point,c:Point,d:Point,e:Point,flip=false) {
  const n=b.p.length/3;
  for(const v of [a,c,d,e]) {
    b.p.push(v.x,v.y,v.z);
    b.uv.push(v.x/8,v.z/8);
  }
  // X-axis strips and rectangular pads require reversed winding to face UP.
  // This was the cause of one road axis appearing black at identical material.
  if(flip)b.indices.push(n,n+2,n+1,n,n+3,n+2);
  else b.indices.push(n,n+1,n+2,n,n+2,n+3);
}
function projected(x:number,z:number,at:(x:number,z:number)=>number,elevation:number):Point{
  return {x,y:at(x,z)+elevation,z};
}
function runStrip(
  batch:Builder,
  axis:"x"|"z",
  fixed:number,
  left:number,
  right:number,
  start:number,
  end:number,
  elevation:number,
  at:(x:number,z:number)=>number,
  offsetStart=0,
  offsetEnd=0,
) {
  if(end-start<.01)return;
  const steps=Math.max(1,Math.ceil((end-start)/STEP));
  const v=(t:number,offset:number,e:number)=>axis==="z"?
    projected(fixed+offset,t,at,e):projected(t,fixed+offset,at,e);
  for(let i=0;i<steps;i++){
    const t0=start+(end-start)*i/steps;
    const t1=start+(end-start)*(i+1)/steps;
    const x0=v(t0,left,elevation+offsetStart);
    const x1=v(t1,left,elevation+offsetStart);
    const y1=v(t1,right,elevation+offsetEnd);
    const y0=v(t0,right,elevation+offsetEnd);
    addQuad(batch,x0,x1,y1,y0,axis==="x");
  }
}
function curbFace(batch:Builder,axis:"x"|"z",fixed:number,edge:number,start:number,end:number,at:(x:number,z:number)=>number){
  if(end-start<.01)return;
  const steps=Math.max(1,Math.ceil((end-start)/STEP));
  const pt=(t:number,elev:number):Point=>axis==="z"?
    projected(fixed+edge,t,at,elev):projected(t,fixed+edge,at,elev);
  for(let i=0;i<steps;i++){
    const t0=start+(end-start)*i/steps, t1=start+(end-start)*(i+1)/steps;
    addQuad(batch,pt(t0,ASPHALT_TOP),pt(t1,ASPHALT_TOP),pt(t1,CURB_TOP),pt(t0,CURB_TOP));
  }
}
function pad(batch:Builder,x0:number,z0:number,x1:number,z1:number,elevation:number,at:(x:number,z:number)=>number){
  addQuad(batch,projected(x0,z0,at,elevation),projected(x1,z0,at,elevation),
    projected(x1,z1,at,elevation),projected(x0,z1,at,elevation),true);
}
function materialMesh(scene:Scene,name:string,data:Builder,material:StandardMaterial){
  if(!data.indices.length)return false;
  const normal:number[]=[];
  VertexData.ComputeNormals(data.p,data.indices,normal);
  const v=new VertexData();
  v.positions=data.p;v.indices=data.indices;v.uvs=data.uv;v.normals=normal;
  const mesh=new Mesh("nh003-road:"+name,scene);
  v.applyToMesh(mesh);
  mesh.material=material;
  mesh.isPickable=false;
  mesh.receiveShadows=false;
  mesh.freezeWorldMatrix();
  return true;
}
/**
 * A city of 11 X and 11 Z road axes yields 121 junction pads. The renderer
 * explicitly separates sidewalks from crossing asphalt, so no walkway layer
 * covers a four-way intersection. Corner paving closes the pedestrian circuit.
 */
export function createNorthHeightsRoads003(
  scene:Scene,streets:readonly number[],at:(x:number,z:number)=>number,
  material:NorthHeightsRoadMaterials,
):NorthHeightsRoadResult{
  const batch:Record<Layer,Builder>={
    asphalt:empty(),pavement:empty(),curb:empty(),crossing:empty(),
  };
  let sidewalkCount=0,curbCount=0,crossings=0;
  // IMPORTANT: generate DISJOINT road spans. Previously both full-length axes
  // covered every intersection; a raised cover pad only disguised the resulting
  // coplanar z-fighting, producing intermittent grey/black junction bands.
  // Now each 8m intersection owns ONE asphalt quad. Street spans begin and end
  // precisely at its boundaries. Pavement and curb have independent footprints.
  for(const axis of ["x","z"] as const) for(const fixed of streets){
    for(let i=0;i<streets.length-1;i++){
      runStrip(batch.asphalt,axis,fixed,-HALF,HALF,streets[i]!+HALF,
        streets[i+1]!-HALF,ASPHALT_TOP,at);
      const start=streets[i]!+OUTER, end=streets[i+1]!-OUTER;
      // Clip every footpath and face curb at next crossroads.
      for(const side of [-1,1]){
        const inner=side<0?-HALF-.20:HALF+.20;
        const outer=side*OUTER;
        runStrip(batch.pavement,axis,fixed,Math.min(inner,outer),Math.max(inner,outer),
          start,end,WALK_TOP,at); sidewalkCount++;
        runStrip(batch.curb,axis,fixed,
          side<0?-HALF-.20:HALF,side<0?-HALF:HALF+.20,
          start,end,CURB_TOP,at);curbCount++;
        curbFace(batch.curb,axis,fixed,side*HALF,start,end,at);
      }
    }
  }
  for(let iz=0;iz<streets.length;iz++)for(let ix=0;ix<streets.length;ix++){
    const x=streets[ix]!,z=streets[iz]!;
    // Exactly one quad per asphalt junction, at the same grade as joined roads.
    // There is no grey pad or second coplanar asphalt surface beneath it.
    pad(batch.asphalt,x-HALF,z-HALF,x+HALF,z+HALF,ASPHALT_TOP,at);
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const x0=x+sx*HALF,x1=x+sx*OUTER;
      const z0=z+sz*HALF,z1=z+sz*OUTER;
      pad(batch.pavement,Math.min(x0,x1),Math.min(z0,z1),
        Math.max(x0,x1),Math.max(z0,z1),WALK_TOP,at);
      sidewalkCount++;
    }
    // Every third junction gets explicit pedestrian zebra crossing approaches.
    if(ix>0&&ix<streets.length-1&&iz>0&&iz<streets.length-1&&(ix+iz)%3===0){
      const stop=HALF+WALK+1.8;
      // Rectangular painted road bars, with no overlap against sidewalk tops.
      for(let k=0;k<5;k++){
        const delta=(k-2)*.78;
        pad(batch.crossing,x-3.35,z+stop+delta-.22,
          x+3.35,z+stop+delta+.22,.097,at);
        pad(batch.crossing,x+stop+delta-.22,z-3.35,
          x+stop+delta+.22,z+3.35,.097,at);
      }
      crossings+=2;
    }
  }
  const materials:Record<Layer,StandardMaterial>={
    asphalt:material.asphalt,pavement:material.pavement,
    curb:material.curb,crossing:material.crossing,
  };
  let surfaceMeshes=0;
  for(const name of ["asphalt","pavement","curb","crossing"] as const)
    if(materialMesh(scene,name,batch[name],materials[name]))surfaceMeshes++;
  return {roads:streets.length*2,crossings,sidewalks:sidewalkCount,curbs:curbCount,surfaceMeshes};
}
