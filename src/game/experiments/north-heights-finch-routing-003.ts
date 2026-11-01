/** POI-003: deterministic route for a selected NH012 car to Finch's curbside entrance.
 * Pure road topology: no teleport, no diagonal through blocks, no GLB/scene ownership. */
import {nh012PointOnEdge,type TrafficGraph012,type TrafficEdge012}
 from "@/game/traffic/nh012-lane-network";
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001} from "./north-heights-finch-hq-001";

export type TargetedRoadRoute003=Readonly<{
 edges:readonly string[];destinationEdge:string;stopS:number;
 stop:{x:number;z:number};doorDistance:number;
}>;

/** Find a road segment nearest the entrance and leave a safe shoulder-to-door walk.
 * Ignore junction endpoints: cars must stop with room to disembark, not in crossings. */
export function finchRoadStop003(graph:TrafficGraph012){
 const door=NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.entrance;
 const choices=[...graph.edges.values()].map(edge=>{
  const along=(door.x-edge.start.x)*edge.dx+(door.z-edge.start.z)*edge.dz;
  const s=Math.max(6,Math.min(edge.length-6,along));
  const p=nh012PointOnEdge(edge,s);
  return {edge,s,p,dist:Math.hypot(p.x-door.x,p.z-door.z)};
 }).sort((a,b)=>a.dist-b.dist||a.edge.id.localeCompare(b.edge.id));
 const preferred=choices[0]!;
 if(!preferred||preferred.dist>35)throw Error("POI-003 Finch driveway is not road-accessible");
 return {edge:preferred.edge,s:preferred.s,position:preferred.p,distance:preferred.dist};
}

/** BFS over legal directional connectors, including legal loops if already beyond stopS.
 * Current connector means the sedan must finish its turn before re-routing. */
export function planFinchTargetedRoute003(
 graph:TrafficGraph012,startEdgeId:string,startS:number,occupiedConnectorId:string|null=null,
):TargetedRoadRoute003|null{
 const target=finchRoadStop003(graph);
 const connector=occupiedConnectorId?graph.connectors.get(occupiedConnectorId):null;
 if(occupiedConnectorId&&!connector)return null;
 const current=connector?.outgoing??startEdgeId;
 if(!graph.edges.has(current))return null;
 const needLoop=current===target.edge.id&&!connector&&startS>=target.s-2;
 if(current===target.edge.id&&!needLoop){
  return {edges:[current],destinationEdge:current,stopS:target.s,
   stop:target.position,doorDistance:target.distance};
 }
 const queue:{edgeId:string;path:string[]}[]=[{edgeId:current,path:[current]}];
 const seen=new Set<string>([current]);
 for(let i=0;i<queue.length;i++){
  const entry=queue[i]!;
  for(const turn of graph.turns.get(entry.edgeId)??[]){
   const next=turn.outgoing;
   if(next===target.edge.id){
    return {edges:[...entry.path,next],destinationEdge:next,stopS:target.s,
     stop:target.position,doorDistance:target.distance};
   }
   if(seen.has(next))continue;
   seen.add(next);queue.push({edgeId:next,path:[...entry.path,next]});
  }
 }
 return null;
}
