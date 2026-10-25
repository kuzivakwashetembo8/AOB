/** NH-013 G2: front-wheel yaw predicted from the REAL junction curve.
 * Avoid interpolated frame-to-frame tiny or zero distance wiping front toe.
 * No path modification; NH-012 TrafficSimulator still owns the traffic.
 */
import {nh012HeadingBetween,nh012PointOnConnector,type TrafficGraph012} from "@/game/traffic/nh012-lane-network";
import type {NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
export function trafficTurnSteering013(
 agent:Pick<NH012Agent,"connectorId"|"s"|"heading"|"speed">,
 graph:TrafficGraph012,
 wheelbase:number,
):number{
 if(!Number.isFinite(agent.heading)||!Number.isFinite(agent.s)||!Number.isFinite(agent.speed))return 0;
 if(!agent.connectorId)return 0;
 const c=graph.connectors.get(agent.connectorId);
 if(!c)return 0;
 const ahead=Math.min(c.length,agent.s+Math.max(1.9,Math.min(3.4,agent.speed*.7)));
 const p=nh012PointOnConnector(c,agent.s);
 const target=nh012PointOnConnector(c,ahead);
 const dist=Math.hypot(target.x-p.x,target.z-p.z);
 if(dist<.08)return 0;
 const lookYaw=nh012HeadingBetween(p,target);
 const delta=Math.atan2(Math.sin(lookYaw-agent.heading),Math.cos(lookYaw-agent.heading));
 const radius=wheelbase*Math.tan(delta)/dist;
 return Math.max(-.72,Math.min(.72,Math.atan(radius)));
}
export function smoothTrafficToe013(previous:number,target:number,changedTick:boolean):number{
 if(!Number.isFinite(previous)||!Number.isFinite(target))return 0;
 if(!changedTick)return previous;
 const updated=previous+(target-previous)*.62;
 return Math.abs(updated)<.003?0:updated;
}
