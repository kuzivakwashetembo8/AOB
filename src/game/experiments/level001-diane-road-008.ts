/** Level 001: reproducible cross-city road route using NH012 legal turns.
 * Uses actual lane and connector geometry, never travels through buildings. */
import {
 nh012PointOnEdge,type TrafficEdge012,type TrafficGraph012,type TrafficPoint012,
} from "@/game/traffic/nh012-lane-network";
import type {TargetedRoadRoute003} from "./north-heights-finch-routing-003";

export type DianeRoadStop008={edgeId:string;s:number;position:TrafficPoint012;distance:number};
export function dianeRoadStop008(graph:TrafficGraph012,point:TrafficPoint012):DianeRoadStop008{
 const choices=[...graph.edges.values()].map((edge:TrafficEdge012)=>{
  const along=(point.x-edge.start.x)*edge.dx+(point.z-edge.start.z)*edge.dz;
  const s=Math.max(8,Math.min(edge.length-8,along));
  const position=nh012PointOnEdge(edge,s);
  return {edgeId:edge.id,s,position,distance:Math.hypot(point.x-position.x,point.z-position.z)};
 }).sort((a,b)=>a.distance-b.distance||a.edgeId.localeCompare(b.edgeId));
 const found=choices[0];
 if(!found||found.distance>30)throw Error("LVL-001 waypoint is not accessible by road");
 return found;
}
export function dianeCrossCityRoute008(graph:TrafficGraph012,
  from:string,fromS:number,to:DianeRoadStop008):TargetedRoadRoute003|null{
 if(!graph.edges.has(from)||!graph.edges.has(to.edgeId))return null;
 if(from===to.edgeId&&fromS<to.s-2)
  return {edges:[from],destinationEdge:from,stopS:to.s,stop:to.position,doorDistance:to.distance};
 const seen=new Set<string>([from]);
 const queue:{id:string;path:string[]}[]=[{id:from,path:[from]}];
 for(let i=0;i<queue.length;i++){
  const {id,path}=queue[i]!;
  for(const turn of graph.turns.get(id)??[]){
   if(turn.outgoing===to.edgeId){
    return {edges:[...path,to.edgeId],destinationEdge:to.edgeId,
      stopS:to.s,stop:to.position,doorDistance:to.distance};
   }
   if(seen.has(turn.outgoing))continue;
   seen.add(turn.outgoing);
   queue.push({id:turn.outgoing,path:[...path,turn.outgoing]});
  }
 }
 return null;
}
export function dianeRoadMeters008(graph:TrafficGraph012,route:TargetedRoadRoute003,fromS:number){
 return route.edges.reduce((sum,id,i)=>{
  const edge=graph.edges.get(id)!;
  return sum+(i===0?edge.length-fromS:
    i===route.edges.length-1?route.stopS:edge.length);
 },0);
}
