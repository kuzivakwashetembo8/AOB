/**
 * WORLD-018 — connected 10x South Ward open-land and road extension.
 * New road corridors are entirely outside First Light's accepted 160x130 m
 * building/camera/parking core except at the four flush Mercer/Foundry mouths.
 * No new lots, buildings, props, traffic actors, or texture assets.
 *
 * This is data-first: the same RoadNetworkSpec feeds world-space 4-way/T
 * topology, batch visuals, real curb collision, and named street HUD.
 */
import {Mesh,VertexData} from "@babylonjs/core";
import type {Material,Scene} from "@babylonjs/core";
import {planRoadGraph} from "./road-graph";
import type {RoadNetworkSpec,WorldPosition} from "./schema";
import type {MeridianPhysics,StaticCollisionHandle} from "../physics/rapier-world";

export const SOUTH_WARD_018_BASE_AREA_M2=160*130;
export const SOUTH_WARD_018_BOUNDS=Object.freeze({
  left:-250,right:250,north:-188,south:228,
});
export const SOUTH_WARD_018_EXPANDED_AREA_M2=
  (SOUTH_WARD_018_BOUNDS.right-SOUTH_WARD_018_BOUNDS.left)*
  (SOUTH_WARD_018_BOUNDS.south-SOUTH_WARD_018_BOUNDS.north);

type AxisPath={
  readonly name:string;
  readonly position:number;
  readonly breaks:readonly (readonly number[])[];
};
const eastWest:readonly AxisPath[]=[
  {name:"North Reach Road",position:-145,breaks:[[-225,-190,-125,125,190,225]]},
  {name:"Pine Road",position:-80,breaks:[[-225,-190,-125,125,190,225]]},
  // The existing First Light parity streets reach precisely to x=±80.
  {name:"Mercer Street",position:8,
   breaks:[[-225,-190,-125,-80],[80,125,190,225]]},
  {name:"Foundry Lane",position:48,
   breaks:[[-225,-190,-125,-80],[80,125,190,225]]},
  {name:"South Field Road",position:120,breaks:[[-225,-190,-125,125,190,225]]},
  {name:"Outer Ward Road",position:190,breaks:[[-225,-190,-125,125,190,225]]},
];
const northSouth:readonly AxisPath[]=[
  {name:"West Loop Road",position:-190,breaks:[[-175,-145,-80,8,48,120,190,210]]},
  {name:"Birch Avenue",position:-125,breaks:[[-175,-145,-80,8,48,120,190,210]]},
  {name:"Cedar Avenue",position:125,breaks:[[-175,-145,-80,8,48,120,190,210]]},
  {name:"East Loop Road",position:190,breaks:[[-175,-145,-80,8,48,120,190,210]]},
];
const points=new Map<string,{id:string;position:WorldPosition}>();
const edges:RoadNetworkSpec["segments"][number][]=[];
function node(x:number,z:number):string{
  const id=`sw-018-node:${x}:${z}`;
  if(!points.has(id))points.set(id,{id,position:{x,y:0,z}});
  return id;
}
function line(name:string,axis:"x"|"z",fixed:number,breaks:readonly (readonly number[])[]){
  for(const [path,coords] of breaks.entries()){
    for(let i=0;i<coords.length-1;i++){
      const a=coords[i]!,b=coords[i+1]!;
      if(!(b>a))throw Error("WORLD-018 nonascending road network");
      const start=axis==="x"?node(a,fixed):node(fixed,a);
      const end=axis==="x"?node(b,fixed):node(fixed,b);
      edges.push({
        id:`sw-018-${axis}-${fixed}-${path}-${i}`,
        startNodeId:start,endNodeId:end,name,roadClass:"local",
        width:8,laneCount:2,sidewalkWidth:3.75,
      });
    }
  }
}
for(const p of eastWest)line(p.name,"x",p.position,p.breaks);
for(const p of northSouth)line(p.name,"z",p.position,p.breaks);
export const SOUTH_WARD_018_ROADS:RoadNetworkSpec=Object.freeze({
  nodes:[...points.values()],segments:edges,intersections:[],
});
export const SOUTH_WARD_018_BASE_ROAD_METRES=85+45+40+77+41;
export const SOUTH_WARD_018_NEW_ROAD_METRES=edges.reduce((sum,segment)=>{
  const a=points.get(segment.startNodeId)!.position;
  const b=points.get(segment.endNodeId)!.position;
  return sum+Math.hypot(a.x-b.x,a.z-b.z);
},0);

type Layer="asphalt"|"sidewalk"|"curb"|"marking";
type Quad=readonly [WorldPosition,WorldPosition,WorldPosition,WorldPosition];
const p=(x:number,z:number):WorldPosition=>({x,y:0,z});
function strip(a:WorldPosition,b:WorldPosition,width:number):Quad{
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  if(length<.00001)throw Error("WORLD-018 invalid curb line");
  const nx=-dz/length*width/2,nz=dx/length*width/2;
  return [p(a.x+nx,a.z+nz),p(b.x+nx,b.z+nz),
    p(b.x-nx,b.z-nz),p(a.x-nx,a.z-nz)];
}
function batch(scene:Scene,name:string,polygons:readonly Quad[],height:number,
  material:Material):Mesh{
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(const q of polygons){
    const start=positions.length/3;
    for(const point of q){
      positions.push(point.x,height,point.z);
      normals.push(0,1,0);
      uvs.push(point.x/8,point.z/8);
    }
    const signed=(q[1]!.z-q[0]!.z)*(q[2]!.x-q[0]!.x)-
      (q[1]!.x-q[0]!.x)*(q[2]!.z-q[0]!.z);
    if(signed>=0)indices.push(start,start+1,start+2,start,start+2,start+3);
    else indices.push(start,start+2,start+1,start,start+3,start+2);
  }
  const mesh=new Mesh(name,scene);
  const data=new VertexData();
  data.positions=positions;data.normals=normals;data.uvs=uvs;data.indices=indices;
  data.applyToMesh(mesh);
  mesh.material=material;
  mesh.isPickable=false;
  mesh.receiveShadows=true;
  mesh.metadata={spatialRole:"world018-connected-road",layer:name,quads:polygons.length};
  mesh.freezeWorldMatrix();
  return mesh;
}
export interface OpenSouthWard018 {
  readonly meshes:readonly Mesh[];
  readonly colliderCount:number;
  readonly network:RoadNetworkSpec;
  dispose():void;
}
export function createOpenSouthWard018(scene:Scene,physics:MeridianPhysics):OpenSouthWard018{
  // Reuse exactly the already accepted First Light parity materials.
  const materials={
    asphalt:scene.getMaterialByName("generated-asphalt"),
    sidewalk:scene.getMaterialByName("generated-sidewalk"),
    curb:scene.getMaterialByName("generated-curb"),
    marking:scene.getMaterialByName("generated-road-marking"),
  };
  if(Object.values(materials).some(material=>!material))
    throw Error("WORLD-018 needs accepted First Light road materials");
  const layers:Record<Layer,Quad[]>={asphalt:[],sidewalk:[],curb:[],marking:[]};
  const curbs:[WorldPosition,WorldPosition][]=[];
  const graph=planRoadGraph(SOUTH_WARD_018_ROADS);
  const addCurb=(a:WorldPosition,b:WorldPosition)=>{
    layers.curb.push(strip(a,b,.20));curbs.push([a,b]);
  };
  for(const road of graph.surfaces){
    layers.asphalt.push(road.asphalt as Quad);
    layers.sidewalk.push(road.leftSidewalk as Quad,road.rightSidewalk as Quad);
    addCurb(road.leftCurb[0]!,road.leftCurb[1]!);
    addCurb(road.rightCurb[0]!,road.rightCurb[1]!);
    // Restrict lane dashes to the road-owned segment; no z-fighting at mouths.
    const q=road.asphalt;
    const a=p((q[0]!.x+q[3]!.x)/2,(q[0]!.z+q[3]!.z)/2);
    const b=p((q[1]!.x+q[2]!.x)/2,(q[1]!.z+q[2]!.z)/2);
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    if(len<3)continue;
    const ux=dx/len,uz=dz/len;
    for(let advance=3;advance+3.2<len-2;advance+=9){
      const s=p(a.x+ux*advance,a.z+uz*advance);
      const e=p(s.x+ux*3.2,s.z+uz*3.2);
      layers.marking.push(strip(s,e,.14));
    }
  }
  for(const j of graph.junctions){
    layers.asphalt.push(j.asphalt as Quad);
    for(const corner of j.sidewalkCorners)layers.sidewalk.push(corner as Quad);
    for(const [a,b] of j.curbSegments)addCurb(a,b);
  }
  const heights={asphalt:.035,sidewalk:.11,curb:.21,marking:.055};
  const meshes:Mesh[]=[];
  const collisions:StaticCollisionHandle[]=[];
  try{
    for(const key of ["asphalt","sidewalk","curb","marking"] as const){
      meshes.push(batch(scene,"world018-"+key,layers[key],heights[key],materials[key]!));
    }
    // Registered raised curb edges match the rendered line segments exactly.
    // The continuous existing ground is still the sole collision road support.
    for(const [a,b] of curbs){
      const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
      if(length<.025)continue;
      collisions.push(physics.addStaticBox(
        {x:(a.x+b.x)/2,y:.105,z:(a.z+b.z)/2},
        {x:.10,y:.105,z:length/2},
        Math.atan2(dx,dz),
      ));
    }
  }catch(error){
    for(const handle of collisions)handle.dispose();
    for(const mesh of meshes)mesh.dispose();
    throw error;
  }
  return {
    meshes,colliderCount:collisions.length,network:SOUTH_WARD_018_ROADS,
    dispose(){
      for(const handle of collisions)handle.dispose();
      for(const mesh of meshes)mesh.dispose();
    },
  };
}
