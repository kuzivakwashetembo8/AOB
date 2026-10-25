/** NH-012: directed lane topology over the existing, accepted North Heights grid.
 * Deterministic pure data; no WebGL, physics worlds or new road geometry. */
import {NORTH_HEIGHTS_COORDS} from "@/game/world-generation/north-heights-location-009";

export type TrafficPoint012=Readonly<{x:number;z:number}>;
export type TrafficNode012=Readonly<{id:string;ix:number;iz:number;x:number;z:number}>;
export type TrafficEdge012=Readonly<{
 id:string;from:string;to:string;dx:number;dz:number;
 start:TrafficPoint012;end:TrafficPoint012;length:number;
}>;
export type TrafficConnector012=Readonly<{
 id:string;junction:string;incoming:string;outgoing:string;
 p0:TrafficPoint012;p1:TrafficPoint012;p2:TrafficPoint012;p3:TrafficPoint012;
 length:number;sampleDistances:readonly number[];
}>;
export type TrafficGraph012=Readonly<{
 nodes:ReadonlyMap<string,TrafficNode012>;
 edges:ReadonlyMap<string,TrafficEdge012>;
 connectors:ReadonlyMap<string,TrafficConnector012>;
 outgoing:ReadonlyMap<string,readonly string[]>;
 incoming:ReadonlyMap<string,readonly string[]>;
 turns:ReadonlyMap<string,readonly TrafficConnector012[]>;
}>;
export const NH012_LANE_OFFSET=2;
export const NH012_JUNCTION_APPROACH=10;
export const NH012_SIMULATION_DT=.05;
const SAMPLE_COUNT=24;
const id=(ix:number,iz:number)=>"NH012:N:"+ix+":"+iz;
const edgeId=(a:string,b:string)=>"NH012:E:"+a+">"+b;
export function nh012Bezier(c:TrafficConnector012,t:number):TrafficPoint012{
 const u=1-Math.max(0,Math.min(1,t)),v=1-u;
 return {x:u*u*u*c.p0.x+3*u*u*v*c.p1.x+3*u*v*v*c.p2.x+v*v*v*c.p3.x,
 z:u*u*u*c.p0.z+3*u*u*v*c.p1.z+3*u*v*v*c.p2.z+v*v*v*c.p3.z};
}
export function nh012PointOnEdge(edge:TrafficEdge012,s:number):TrafficPoint012{
 const ratio=Math.max(0,Math.min(1,s/edge.length));
 return {x:edge.start.x+(edge.end.x-edge.start.x)*ratio,
 z:edge.start.z+(edge.end.z-edge.start.z)*ratio};
}
export function nh012PointOnConnector(c:TrafficConnector012,s:number):TrafficPoint012{
 const wanted=Math.max(0,Math.min(c.length,s));
 const distances=c.sampleDistances;
 let i=0;while(i<SAMPLE_COUNT-1 && (distances[i+1]??Infinity)<wanted)i++;
 const a=distances[i]??0,b=distances[i+1]??c.length;
 return nh012Bezier(c,(i+(b>a?(wanted-a)/(b-a):0))/SAMPLE_COUNT);
}
export function nh012HeadingBetween(a:TrafficPoint012,b:TrafficPoint012):number{
 return Math.atan2(b.x-a.x,b.z-a.z);
}
export function buildNorthHeightsTrafficGraph012():TrafficGraph012{
 const nodes=new Map<string,TrafficNode012>(),edges=new Map<string,TrafficEdge012>();
 const outgoing=new Map<string,string[]>(),incoming=new Map<string,string[]>();
 for(let iz=0;iz<11;iz++)for(let ix=0;ix<11;ix++){
   const node={id:id(ix,iz),ix,iz,x:NORTH_HEIGHTS_COORDS[ix]!,z:NORTH_HEIGHTS_COORDS[iz]!};
   nodes.set(node.id,node);outgoing.set(node.id,[]);incoming.set(node.id,[]);
 }
 const add=(a:TrafficNode012,b:TrafficNode012)=>{
   const dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z);
   const right={x:dz*NH012_LANE_OFFSET,z:-dx*NH012_LANE_OFFSET};
   const edge:TrafficEdge012={
     id:edgeId(a.id,b.id),from:a.id,to:b.id,dx,dz,
     start:{x:a.x+dx*NH012_JUNCTION_APPROACH+right.x,z:a.z+dz*NH012_JUNCTION_APPROACH+right.z},
     end:{x:b.x-dx*NH012_JUNCTION_APPROACH+right.x,z:b.z-dz*NH012_JUNCTION_APPROACH+right.z},
     length:64-2*NH012_JUNCTION_APPROACH,
   };
   edges.set(edge.id,edge);
   outgoing.get(a.id)!.push(edge.id);incoming.get(b.id)!.push(edge.id);
 };
 for(const a of nodes.values()){
   if(a.ix<10){const b=nodes.get(id(a.ix+1,a.iz))!;add(a,b);add(b,a);}
   if(a.iz<10){const b=nodes.get(id(a.ix,a.iz+1))!;add(a,b);add(b,a);}
 }
 const connectors=new Map<string,TrafficConnector012>();
 const turns=new Map<string,TrafficConnector012[]>();
 for(const edge of edges.values()){
   const options:TrafficConnector012[]=[];
   for(const nextId of outgoing.get(edge.to)??[]){
     const next=edges.get(nextId)!;
     if(next.to===edge.from)continue; // No teleport U-turn or illegal wrong-side reversal.
     const control=6.5;
     const p0=edge.end,p3=next.start;
     const p1={x:p0.x+edge.dx*control,z:p0.z+edge.dz*control};
     const p2={x:p3.x-next.dx*control,z:p3.z-next.dz*control};
     const seed={id:"NH012:C:"+edge.id+">"+next.id,junction:edge.to,
       incoming:edge.id,outgoing:next.id,p0,p1,p2,p3,length:0,sampleDistances:[]};
     const cumulative=[0];let previous=p0;
     for(let k=1;k<=SAMPLE_COUNT;k++){
       const v=nh012Bezier(seed,k/SAMPLE_COUNT);
       cumulative.push(cumulative[k-1]!+Math.hypot(v.x-previous.x,v.z-previous.z));
       previous=v;
     }
     const connector:TrafficConnector012={...seed,length:cumulative[SAMPLE_COUNT]!,
       sampleDistances:cumulative};
     if(connector.length<=0||!Number.isFinite(connector.length))throw Error("NH012 invalid connector");
     connectors.set(connector.id,connector);options.push(connector);
   }
   turns.set(edge.id,options);
 }
 if(nodes.size!==121||edges.size!==440||[...nodes.values()].some(n=>(incoming.get(n.id)?.length??0)<2))
   throw Error("NH012 physical North Heights network contract changed unexpectedly");
 return {nodes,edges,connectors,outgoing,incoming,turns};
}
