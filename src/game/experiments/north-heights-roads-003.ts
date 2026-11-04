/**
 * GTD-NH-REBUILD-003 — South Ward-patterned local road renderer on upland terrain.
 *
 * REBUILD-002 drew independent full-length road/sidewalk ribbons over each other,
 * causing black/grey z-fighting and pedestrian corners with no paved surface.
 * Batch all strips by MATERIAL; clip paved walks at each intersection, join
 * corner pavements, build curb faces, and add measured crossings. Trial-only.
 */
import { Mesh, Scene, StandardMaterial, VertexData } from "@babylonjs/core";
import {northHeightsPedestrianZebra001} from "./north-heights-pedestrian-crossings-001";

export type NorthHeightsRoadMaterials = Readonly<{
  asphalt: StandardMaterial;
  pavement: StandardMaterial;
  curb: StandardMaterial;
  marking: StandardMaterial;
  crossing: StandardMaterial;
}>;
export type NorthHeightsRoadResult = Readonly<{
  roads: number;
  crossings: number;
  sidewalks: number;
  curbs: number;
  markings: number;
  surfaceMeshes: number;
}>;
type Layer = "asphalt" | "pavement" | "curb" | "crossing" | "marking";
type Builder = { p:number[];uv:number[];indices:number[] };
type Point = Readonly<{x:number;y:number;z:number}>;
export const NORTH_HEIGHTS_ROAD_HALF_WIDTH_003=4;
export const NORTH_HEIGHTS_SIDEWALK_OUTER_003=7.75;
export const NORTH_HEIGHTS_SIDEWALK_ELEVATION_003=.20;
export const NORTH_HEIGHTS_ASPHALT_ELEVATION_003=.075;
const WIDTH=8, HALF=NORTH_HEIGHTS_ROAD_HALF_WIDTH_003, WALK=3.75, OUTER=NORTH_HEIGHTS_SIDEWALK_OUTER_003;
const CURB_TOP=NORTH_HEIGHTS_SIDEWALK_ELEVATION_003, WALK_TOP=NORTH_HEIGHTS_SIDEWALK_ELEVATION_003, ASPHALT_TOP=NORTH_HEIGHTS_ASPHALT_ELEVATION_003;
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
/** Solid fascia of a pavement edge: vertical surface follows actual grade.
 * Exposed outer faces run from terrain to WALK_TOP rather than floating in air.
 * Group into one shared curb mesh, never independent geometry per sidewalk. */
function solidSide(batch:Builder,x0:number,z0:number,x1:number,z1:number,
  bottom:number,top:number,at:(x:number,z:number)=>number){
  const len=Math.hypot(x1-x0,z1-z0),segments=Math.max(1,Math.ceil(len/STEP));
  for(let i=0;i<segments;i++){
    const t0=i/segments,t1=(i+1)/segments;
    const aX=x0+(x1-x0)*t0,aZ=z0+(z1-z0)*t0;
    const bX=x0+(x1-x0)*t1,bZ=z0+(z1-z0)*t1;
    addQuad(batch,projected(aX,aZ,at,bottom),projected(bX,bZ,at,bottom),
      projected(bX,bZ,at,top),projected(aX,aZ,at,top));
  }
}
function curbFace(batch:Builder,axis:"x"|"z",fixed:number,edge:number,
  start:number,end:number,at:(x:number,z:number)=>number,bottom=ASPHALT_TOP,top=CURB_TOP){
  if(axis==="z")solidSide(batch,fixed+edge,start,fixed+edge,end,bottom,top,at);
  else solidSide(batch,start,fixed+edge,end,fixed+edge,bottom,top,at);
}
function pad(batch:Builder,x0:number,z0:number,x1:number,z1:number,elevation:number,at:(x:number,z:number)=>number){
  addQuad(batch,projected(x0,z0,at,elevation),projected(x1,z0,at,elevation),
    projected(x1,z1,at,elevation),projected(x0,z1,at,elevation),true);
}
/** POI-010: round ONLY the road-facing convex corner. The land-side
 * rear corner stays square; pavement, vertical fascia and complementary
 * asphalt infill share an identical tangent arc (no detached blocks). */
function roundedJunctionPavement(top:Builder,wall:Builder,asphalt:Builder,
 xa:number,za:number,xb:number,zb:number,
 roadX:number,roadZ:number,at:(x:number,z:number)=>number){
 const r=Math.min(1.8,(xb-xa)*.49,(zb-za)*.49);
 const corners=[
  {x:xa,z:za,start:180,cx:xa+r,cz:za+r},
  {x:xb,z:za,start:270,cx:xb-r,cz:za+r},
  {x:xb,z:zb,start:0,cx:xb-r,cz:zb-r},
  {x:xa,z:zb,start:90,cx:xa+r,cz:zb-r},
 ];
 const points:{x:number;z:number}[]=[];
 for(const corner of corners){
  if(Math.abs(corner.x-roadX)>.01||Math.abs(corner.z-roadZ)>.01){
   points.push({x:corner.x,z:corner.z});continue;
  }
  const arc:{x:number;z:number}[]=[];
  const steps=Math.ceil(Math.PI*r/.4);
  for(let j=0;j<=steps;j++){
   const angle=(corner.start+j*90/steps)*Math.PI/180;
   const vertex={x:corner.cx+r*Math.cos(angle),z:corner.cz+r*Math.sin(angle)};
   arc.push(vertex);points.push(vertex);
  }
  // The cut-away pavement wedge is still asphalt, not empty terrain.
  for(let j=0;j<arc.length-1;j++){
   const a=arc[j]!,b=arc[j+1]!;
   const n=asphalt.p.length/3;
   for(const p of [{x:corner.x,z:corner.z},a,b]){
    const v=projected(p.x,p.z,at,ASPHALT_TOP);
    asphalt.p.push(v.x,v.y,v.z);asphalt.uv.push(v.x/8,v.z/8);
   }
   asphalt.indices.push(n,n+1,n+2);
  }
 }
 const cx=(xa+xb)/2,cz=(za+zb)/2;
 for(let i=0;i<points.length;i++){
  const p=points[i]!,q=points[(i+1)%points.length]!;
  const n=top.p.length/3;
  for(const v of [projected(cx,cz,at,WALK_TOP),
   projected(p.x,p.z,at,WALK_TOP),projected(q.x,q.z,at,WALK_TOP)]){
   top.p.push(v.x,v.y,v.z);top.uv.push(v.x/8,v.z/8);
  }
  top.indices.push(n,n+1,n+2);
  solidSide(wall,p.x,p.z,q.x,q.z,0,WALK_TOP,at);
 }
}
function ensureWalkableFacesPointUp(data:Builder){
  // Generated surfaces have mixed X/Z parametrization. Resolve orientation
  // from the real vertex coordinates, never from the road direction or
  // material label. A negative signed XZ area means downward triangle.
  for(let i=0;i<data.indices.length;i+=3){
    const ia=data.indices[i]!*3,ib=data.indices[i+1]!*3,ic=data.indices[i+2]!*3;
    const ax=data.p[ia]!,az=data.p[ia+2]!;
    const bx=data.p[ib]!,bz=data.p[ib+2]!;
    const cx=data.p[ic]!,cz=data.p[ic+2]!;
    const crossY=(bz-az)*(cx-ax)-(bx-ax)*(cz-az);
    if(crossY<0){
      const tmp=data.indices[i+1]!;
      data.indices[i+1]=data.indices[i+2]!;
      data.indices[i+2]=tmp;
    }
  }
}
function materialMesh(scene:Scene,name:string,data:Builder,material:StandardMaterial){
  if(!data.indices.length)return false;
  if(name!=="curb")ensureWalkableFacesPointUp(data);
  const normal:number[]=[];
  VertexData.ComputeNormals(data.p,data.indices,normal);
  {
    // Match sky-facing pavement-top normals on curb fascia as well: a
    // vertical geometric normal would darken the identical shared concrete.
    // Both Babylon left/right-handed imported winding and the batch's
    // internal ribbon direction can invert computed lighting normals.
    // Carriageway, paving, and painted marks are walkable top surfaces,
    // so their shading normal must always point to the sky. Rapier still
    // receives the original triangulated collision geometry separately.
    if(name!=="curb")for(let i=0;i<normal.length;i+=3){
      normal[i]=0;normal[i+1]=1;normal[i+2]=0;
    }
  }
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
    asphalt:empty(),pavement:empty(),curb:empty(),crossing:empty(),marking:empty(),
  };
  let sidewalkCount=0,curbCount=0,crossings=0,markings=0;
  // IMPORTANT: generate DISJOINT road spans. Previously both full-length axes
  // covered every intersection; a raised cover pad only disguised the resulting
  // coplanar z-fighting, producing intermittent grey/black junction bands.
  // Now each 8m intersection owns ONE asphalt quad. Street spans begin and end
  // precisely at its boundaries. Pavement and curb have independent footprints.
  for(const axis of ["x","z"] as const) for(const fixed of streets){
    for(let i=0;i<streets.length-1;i++){
      runStrip(batch.asphalt,axis,fixed,-HALF,HALF,streets[i]!+HALF,
        streets[i+1]!-HALF,ASPHALT_TOP,at);
      // Paint is co-generated with the road strips and conforms to the same grade.
      // It never uses independent floating boxes or separate terrain instance transforms.
      const laneStart=streets[i]!+HALF,laneEnd=streets[i+1]!-HALF;
      for(let mark=laneStart+3;mark+3.4<laneEnd-2;mark+=9){
        runStrip(batch.marking,axis,fixed,-.067,.067,mark,mark+3.4,ASPHALT_TOP+.003,at);
        markings++;
      }
      const start=streets[i]!+OUTER, end=streets[i+1]!-OUTER;
      // Clip every footpath and face curb at next crossroads.
      for(const side of [-1,1]){
        const inner=side<0?-HALF:HALF;
        const outer=side*OUTER;
        runStrip(batch.pavement,axis,fixed,Math.min(inner,outer),Math.max(inner,outer),
          start,end,WALK_TOP,at); sidewalkCount++;
        // A physical curb/pavement block has a hidden terrain base, the
        // road-facing lip, and the full OUTER face descending to terrain.
        // Keep the accepted 7.5cm asphalt and 20cm paving elevations.
        runStrip(batch.curb,axis,fixed,Math.min(inner,outer),Math.max(inner,outer),
          start,end,0,at);
        curbFace(batch.curb,axis,fixed,side*HALF,start,end,at,0,ASPHALT_TOP);
        curbFace(batch.curb,axis,fixed,side*HALF,start,end,at,ASPHALT_TOP,CURB_TOP);
        curbFace(batch.curb,axis,fixed,outer,start,end,at,0,WALK_TOP);
        curbCount++;
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
      const xa=Math.min(x0,x1),xb=Math.max(x0,x1);
      const za=Math.min(z0,z1),zb=Math.max(z0,z1);
      roundedJunctionPavement(batch.pavement,batch.curb,batch.asphalt,xa,za,xb,zb,
        x+sx*HALF,z+sz*HALF,at);
       // No block/cap under the corner: fascia already reaches the terrain,
       // and the roadway-facing edges remain uncut.
       sidewalkCount++;
    }
    // Every third junction gets explicit pedestrian zebra crossing approaches.
    if(ix<streets.length-1&&iz<streets.length-1&&northHeightsPedestrianZebra001(ix,iz)){
      const stop=HALF+WALK+1.8;
      // Rectangular painted road bars, with no overlap against sidewalk tops.
      for(let k=0;k<5;k++){
        const delta=(k-2)*.78;
        if(ix>0)pad(batch.crossing,x-3.35,z+stop+delta-.22,
          x+3.35,z+stop+delta+.22,ASPHALT_TOP+.003,at);
        if(iz>0)pad(batch.crossing,x+stop+delta-.22,z-3.35,
          x+stop+delta+.22,z+3.35,ASPHALT_TOP+.003,at);
      }
      crossings+=Number(ix>0)+Number(iz>0);
    }
  }
  const materials:Record<Layer,StandardMaterial>={
    asphalt:material.asphalt,pavement:material.pavement,
    // Fascia and top MUST use the identical material, not merely similar hexes.
    curb:material.pavement,crossing:material.crossing,marking:material.marking,
  };
  let surfaceMeshes=0;
  for(const name of ["asphalt","pavement","curb","crossing","marking"] as const)
    if(materialMesh(scene,name,batch[name],materials[name]))surfaceMeshes++;
  return {roads:streets.length*2,crossings,sidewalks:sidewalkCount,curbs:curbCount,markings,surfaceMeshes};
}
