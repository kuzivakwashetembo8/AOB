/** POI-011 curbside correction: four approach signal supports on the actual
 * raised sidewalk immediately behind its ROAD-FACING curb. The prior version
 * offset poles +8.5m from an already lane-offset endpoint, putting them in
 * building yards. Both support and overhead head placement use the actual
 * junction centre as their reference, never a lane endpoint. */
import {
 buildNorthHeightsTrafficGraph012,NH012_LANE_OFFSET,
} from "@/game/traffic/nh012-lane-network";
import {FINCH_SIGNAL_NODE_021} from "@/game/traffic/nh021-traffic-signal-plan";
import {
 NORTH_HEIGHTS_ROAD_HALF_WIDTH_003,
 NORTH_HEIGHTS_SIDEWALK_OUTER_003,
} from "./north-heights-roads-003";

export type PilotSignalPlacement021=Readonly<{
 id:string;kind:"roadside"|"hanging";
 x:number;z:number;poleX:number;poleZ:number;
 faceX:number;faceZ:number;approach:"N"|"S"|"E"|"W";
}>;

/** Centreline-to-curb = 4.00m. Inset the mast 0.35m INTO the sidewalk
 * so its 0.18m-radius collider never crosses the road-facing curb lip.
 * The junction corner extends to 7.75m and has a 1.8m road-facing arc;
 * 7.15m is inside its continuous straight curb region, before the zebra. */
export const POI011_POLE_CURB_INSET_021=.35;
export const POI011_CORNER_END_CLEARANCE_021=.60;
export function planFinchTrafficSignals021():readonly PilotSignalPlacement021[]{
 const graph=buildNorthHeightsTrafficGraph012();
 const node=graph.nodes.get(FINCH_SIGNAL_NODE_021);
 const incoming=graph.incoming.get(FINCH_SIGNAL_NODE_021)??[];
 if(!node||incoming.length!==4)throw Error("POI-011 requires four incoming roads at Finch HQ");
 const curbSide=NORTH_HEIGHTS_ROAD_HALF_WIDTH_003+POI011_POLE_CURB_INSET_021;
 const nearCorner=NORTH_HEIGHTS_SIDEWALK_OUTER_003-POI011_CORNER_END_CLEARANCE_021;
 // Keep the base on the corner paving's road-facing straight fascia,
 // clear of the 1.8m curved return, sidewalk outer boundary, and zebra.
 const roundedCornerEnd=NORTH_HEIGHTS_ROAD_HALF_WIDTH_003+1.8;
 if(curbSide>=NORTH_HEIGHTS_SIDEWALK_OUTER_003||
    nearCorner<=roundedCornerEnd||nearCorner>=NORTH_HEIGHTS_SIDEWALK_OUTER_003)
  throw Error("POI-011 curbside placement geometry outside accepted sidewalk");
 const heads:PilotSignalPlacement021[]=[];
 for(const id of incoming){
  const edge=graph.edges.get(id)!;
  // NH012 right-side offset is normalized from the ROAD AXIS, not from
  // edge.end (which is already 2m into a lane and 10m before the node).
  const rightX=edge.dz,rightZ=-edge.dx;
  const approach=edge.dx>0?"W":edge.dx<0?"E":edge.dz>0?"S":"N";
  const longitudinalX=node.x-edge.dx*nearCorner;
  const longitudinalZ=node.z-edge.dz*nearCorner;
  const poleX=longitudinalX+rightX*curbSide;
  const poleZ=longitudinalZ+rightZ*curbSide;
  // Hanging head over the incoming driving lane at the SAME chainage:
  // a short perpendicular cantilever, not an 8.5m diagonal across a yard.
  // Roadside heads sit directly atop their curbside mast.
  const hanging=edge.dz!==0;
  const x=hanging?longitudinalX+rightX*NH012_LANE_OFFSET:poleX;
  const z=hanging?longitudinalZ+rightZ*NH012_LANE_OFFSET:poleZ;
  heads.push({
   id:"poi011-"+(hanging?"hanging":"roadside")+"-"+approach,
   kind:hanging?"hanging":"roadside",
   x,z,poleX,poleZ,faceX:-edge.dx,faceZ:-edge.dz,approach,
  });
 }
 if(heads.length!==4||new Set(heads.map(h=>h.approach)).size!==4)
  throw Error("POI-011 requires four distinct approach signals");
 return heads;
}
