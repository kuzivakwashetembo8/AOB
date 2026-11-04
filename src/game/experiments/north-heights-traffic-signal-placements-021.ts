/** POI-011: four physical approaches, selected from real incoming lane geometry.
 * A single controlled junction can require multiple signal heads. */
import {buildNorthHeightsTrafficGraph012} from "@/game/traffic/nh012-lane-network";
import {FINCH_SIGNAL_NODE_021} from "@/game/traffic/nh021-traffic-signal-plan";
export type PilotSignalPlacement021=Readonly<{
 id:string;kind:"roadside"|"hanging";
 x:number;z:number;poleX:number;poleZ:number;
 faceX:number;faceZ:number;approach:"N"|"S"|"E"|"W";
}>;
export function planFinchTrafficSignals021():readonly PilotSignalPlacement021[]{
 const graph=buildNorthHeightsTrafficGraph012();
 const incoming=graph.incoming.get(FINCH_SIGNAL_NODE_021)??[];
 if(incoming.length!==4)throw Error("POI-011 pilot must have four incoming roads");
 const heads:PilotSignalPlacement021[]=[];
 for(const id of incoming){
  const edge=graph.edges.get(id)!;
  const rightX=edge.dz,rightZ=-edge.dx;
  const approach=edge.dx>0?"W":edge.dx<0?"E":edge.dz>0?"S":"N";
  // Real directed lanes end 10m before node; support stands outside
  // the 7.75m sidewalk envelope and away from the vehicle swept path.
  // The accepted curb/sidewalk envelope extends 7.75m from centre.
  // Keep the support outside its walkable surface with clearance.
  const poleX=edge.end.x+rightX*8.5;
  const poleZ=edge.end.z+rightZ*8.5;
  // Distinct, non-duplicated heads: two overhead N/S and two roadside E/W.
  // Both owner GLBs are used, never two overlapping supports at one corner.
  if(edge.dz!==0)
   heads.push({id:"poi011-hanging-"+approach,kind:"hanging",
    x:edge.end.x,z:edge.end.z,poleX,poleZ,
    faceX:-edge.dx,faceZ:-edge.dz,approach});
  else
   heads.push({id:"poi011-roadside-"+approach,kind:"roadside",
    x:poleX,z:poleZ,poleX,poleZ,faceX:-edge.dx,faceZ:-edge.dz,approach});
 }
 if(heads.length!==4)throw Error("POI-011 requires four distinct signaled approaches");
 return heads;
}
