/** PED-001 stages 1-2: pedestrian-only graph derived from accepted North Heights geometry.
 * Pure TypeScript: no Babylon meshes, Rapier actors, or GLB imports. */
import type {BuildingSpec} from "@/game/world-generation/schema";
import {NORTH_HEIGHTS_COORDS} from "@/game/world-generation/north-heights-location-009";
import {NORTH_HEIGHTS_MAP_BLOCKS_010} from "./north-heights-map-data-010";
import {northHeightsDoorway010} from "./north-heights-spatial-plan-010";
import type {TreeLocation} from "./north-heights-trees-004";

export type PedPoint001={x:number;z:number};
export type PedNode001=PedPoint001&{id:string;kind:"corner"|"sidewalk"|"entrance"|"park"};
export type PedEdgeKind001="sidewalk"|"entrance"|"park"|"crossing";
export type PedLink001={to:string;kind:PedEdgeKind001;length:number};
export type PedGraph001={
 nodes:Map<string,PedNode001>;
 links:Map<string,PedLink001[]>;
 entrances:Map<string,string>;
 parks:readonly string[];
 crossings:number;
 unreachable:readonly string[];
};
const STREETS=NORTH_HEIGHTS_COORDS;
const WALK_CENTER=6; // within the existing 4m..7.75m pavement bands
const CROSSING_OFFSET=8+3.75+1.8-4; // 9.55m: same as NH-REBUILD-003 painted zebra location
const corner=(ix:number,iz:number,sx:number,sz:number)=>"c:"+ix+":"+iz+":"+sx+":"+sz;
const lane=(axis:"x"|"z",ix:number,iz:number,side:number)=>axis+":"+ix+":"+iz+":"+side;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const isZebra=(ix:number,iz:number)=>ix>0&&ix<10&&iz>0&&iz<10&&(ix+iz)%3===0;

export function buildPedestrianGraph001(
 buildings:readonly BuildingSpec[],trees:readonly TreeLocation[]=[],
):PedGraph001{
 const nodes=new Map<string,PedNode001>();
 const links=new Map<string,PedLink001[]>();
 const extras=new Map<string,string[]>();
 const entrances=new Map<string,string>();
 const parks:string[]=[];
 const addNode=(id:string,x:number,z:number,kind:PedNode001["kind"])=>{
   if(nodes.has(id))throw new Error("PED-001 duplicate graph node: "+id);
   nodes.set(id,{id,x,z,kind});links.set(id,[]);return id;
 };
 const extra=(key:string,id:string)=>{
   const list=extras.get(key)??[];list.push(id);extras.set(key,list);
 };
 const connect=(a:string,b:string,kind:PedEdgeKind001)=>{
   if(a===b)return;
   const p=nodes.get(a),q=nodes.get(b);
   if(!p||!q)throw new Error("PED-001 missing node for "+a+" -> "+b);
   const length=Math.hypot(p.x-q.x,p.z-q.z);
   if(length<.001)return;
   if(!links.get(a)!.some(e=>e.to===b&&e.kind===kind)){
     links.get(a)!.push({to:b,kind,length});
     links.get(b)!.push({to:a,kind,length});
   }
 };
 // Corner paving has four independent quadrants; crossing links connect them
 // only at the actual zebra-painted road approaches.
 for(let iz=0;iz<11;iz++)for(let ix=0;ix<11;ix++)
   for(const sx of [-1,1])for(const sz of [-1,1])
     addNode(corner(ix,iz,sx,sz),STREETS[ix]!+sx*WALK_CENTER,
       STREETS[iz]!+sz*WALK_CENTER,"corner");
 let crossings=0;
 for(let iz=1;iz<10;iz++)for(let ix=1;ix<10;ix++){
   if(!isZebra(ix,iz))continue;
   const x=STREETS[ix]!,z=STREETS[iz]!;
   const eastPlus=addNode("zebra:e:"+ix+":"+iz+":+",x+CROSSING_OFFSET,z+WALK_CENTER,"sidewalk");
   const eastMinus=addNode("zebra:e:"+ix+":"+iz+":-",x+CROSSING_OFFSET,z-WALK_CENTER,"sidewalk");
   extra(lane("x",ix,iz,1),eastPlus);
   extra(lane("x",ix,iz,-1),eastMinus);
   connect(eastPlus,eastMinus,"crossing");crossings++;
   const northPlus=addNode("zebra:n:"+ix+":"+iz+":+",x+WALK_CENTER,z+CROSSING_OFFSET,"sidewalk");
   const northMinus=addNode("zebra:n:"+ix+":"+iz+":-",x-WALK_CENTER,z+CROSSING_OFFSET,"sidewalk");
   extra(lane("z",ix,iz,1),northPlus);
   extra(lane("z",ix,iz,-1),northMinus);
   connect(northPlus,northMinus,"crossing");crossings++;
 }
 // Actual door opening is centered on +Z wall; approach northwards through
 // building setback to the nearest pavement, not through a wall.
 for(const b of buildings){
   const door=northHeightsDoorway010(b);
   const north=clamp(Math.ceil((b.position.z+320)/64),1,10);
   const col=clamp(Math.floor((door.x+320)/64),0,9);
   const accessZ=STREETS[north]!-WALK_CENTER;
   if(door.z>accessZ+0.1)continue; // reject blocked or non-accessible geometry
   const id=addNode("door:"+b.id,door.x,door.z,"entrance");
   const sidewalk=addNode("access:"+b.id,door.x,accessZ,"sidewalk");
   connect(id,sidewalk,"entrance");
   extra(lane("x",col,north,-1),sidewalk);
   entrances.set(b.id,id);
 }
 // Park centre lines link north and south pavements of unbuilt city blocks.
 // Choose a centre candidate with the largest clearance from placed trees.
 for(const b of NORTH_HEIGHTS_MAP_BLOCKS_010){
   if(b.kind!=="park")continue;
   const row=Number(b.id.slice(3,5))-1,col=Number(b.id.slice(6,8))-1;
   const cx=STREETS[col]!+32,cz=STREETS[row]!+32;
   const north=addNode("park:n:"+b.id,cx,STREETS[row+1]!-WALK_CENTER,"sidewalk");
   const south=addNode("park:s:"+b.id,cx,STREETS[row]!+WALK_CENTER,"sidewalk");
   extra(lane("x",col,row+1,-1),north);
   extra(lane("x",col,row,1),south);
   let best={x:cx,z:cz,clearance:-1};
   for(const dx of [-10,-5,0,5,10])for(const dz of [-8,0,8]){
     const x=cx+dx,z=cz+dz;
     const clearance=trees.reduce((v,t)=>Math.min(v,Math.hypot(x-t.x,z-t.z)),99);
     if(clearance>best.clearance)best={x,z,clearance};
   }
   const center=addNode("park:center:"+b.id,best.x,best.z,"park");
   connect(south,center,"park");connect(center,north,"park");parks.push(center);
 }
 // Sidewalk spans: split by all door/park/crossing anchor nodes, so every
 // entrance and crossing connects to the same continuous street network.
 for(let iz=0;iz<11;iz++)for(let ix=0;ix<10;ix++)
   for(const side of [-1,1]){
     const a=corner(ix,iz,1,side),b=corner(ix+1,iz,-1,side);
     const ids=[a,...(extras.get(lane("x",ix,iz,side))??[]),b]
       .sort((u,v)=>nodes.get(u)!.x-nodes.get(v)!.x);
     for(let k=1;k<ids.length;k++)connect(ids[k-1]!,ids[k]!,"sidewalk");
   }
 for(let ix=0;ix<11;ix++)for(let iz=0;iz<10;iz++)
   for(const side of [-1,1]){
     const a=corner(ix,iz,side,1),b=corner(ix,iz+1,side,-1);
     const ids=[a,...(extras.get(lane("z",ix,iz,side))??[]),b]
       .sort((u,v)=>nodes.get(u)!.z-nodes.get(v)!.z);
     for(let k=1;k<ids.length;k++)connect(ids[k-1]!,ids[k]!,"sidewalk");
   }
 const unreachable=[...entrances.entries()].filter(([,id])=>!(links.get(id)?.length)).map(([id])=>id);
 return {nodes,links,entrances,parks,crossings,unreachable};
}

/** A* route; configurable cost callback reserved for the owner's pending
 * walking-distance variation policy. No fixed journey-distance rules. */
export function pedestrianRoute001(
 graph:PedGraph001,from:string,to:string,
 cost?:(edge:PedLink001)=>number,
):string[]{
 if(!graph.nodes.has(from)||!graph.nodes.has(to))return [];
 if(from===to)return [from];
 const goal=graph.nodes.get(to)!;
 const heuristic=(id:string)=>{
   const p=graph.nodes.get(id)!;return Math.hypot(p.x-goal.x,p.z-goal.z);
 };
 const frontier:[number,string][]=[[heuristic(from),from]];
 const distance=new Map<string,number>([[from,0]]);
 const previous=new Map<string,string>();
 const visited=new Set<string>();
 while(frontier.length){
   // Binary heap unnecessary for this ~1k-node sparse grid at prototype scale.
   let best=0;
   for(let i=1;i<frontier.length;i++)if(frontier[i]![0]<frontier[best]![0])best=i;
   const [,id]=frontier.splice(best,1)[0]!;
   if(visited.has(id))continue;
   if(id===to){
     const path=[to];let cursor=to;
     while(cursor!==from){cursor=previous.get(cursor)!;path.push(cursor);}
     return path.reverse();
   }
   visited.add(id);
   for(const edge of graph.links.get(id)??[]){
     if(visited.has(edge.to))continue;
     const weight=cost?cost(edge):edge.length;
     if(!Number.isFinite(weight)||weight<edge.length-1e-5)
       throw new Error("PED-001 routing costs must be >= geometric length");
     const tentative=distance.get(id)!+weight;
     if(tentative<(distance.get(edge.to)??Infinity)){
       distance.set(edge.to,tentative);previous.set(edge.to,id);
       frontier.push([tentative+heuristic(edge.to),edge.to]);
     }
   }
 }
 return [];
}
