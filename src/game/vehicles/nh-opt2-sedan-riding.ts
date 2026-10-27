/**
 * GTD-NH-OPT2-SDN-001 Stage 1: attach a rider to an existing NH-012 agent.
 * The simulator and GEN-VEH-009 thin-instance renderer remain authoritative.
 * There is no Sedan rigidbody, GLB import, wheel reconstruction or traffic mutation.
 */
import {
  nearestAccessibleCar, type BoardingBlocker, type Point3,
} from "./local-boarding";

export interface BoardingCandidate {
  id:string;
  pose:Point3;
  kind:"parked-glb"|"traffic-sedan";
}

/** Same wall/height/distance test and deterministic nearest rule for both fleets. */
export function nearestBoardableVehicle(
  actor:Point3,
  parked:readonly {id:string;pose:Point3}[],
  moving:readonly {id:string;pose:Point3}[],
  blockers:readonly BoardingBlocker[],
):BoardingCandidate|null{
  const candidates:BoardingCandidate[]=[
    ...parked.map(car=>({id:car.id,pose:car.pose,kind:"parked-glb" as const})),
    ...moving.map(car=>({id:car.id,pose:car.pose,kind:"traffic-sedan" as const})),
  ];
  return nearestAccessibleCar(actor,candidates,blockers);
}

/** Foot placement around the *current* traffic Sedan, never its boarding spot.
 * Heading is the accepted NH-012 +Z forward heading in world coordinates. */
export function sedanExitCandidates(
  pose:{x:number;z:number;heading:number},
  width=1.85,length=4.75,
):readonly {x:number;z:number}[]{
  const dx=Math.cos(pose.heading),dz=-Math.sin(pose.heading);
  const fx=Math.sin(pose.heading),fz=Math.cos(pose.heading);
  const side=width/2+.85,rear=length/2+.85;
  return [
    {x:pose.x+dx*side,z:pose.z+dz*side},
    {x:pose.x-dx*side,z:pose.z-dz*side},
    {x:pose.x-fx*rear+dx*side*.45,z:pose.z-fz*rear+dz*side*.45},
    {x:pose.x-fx*rear-dx*side*.45,z:pose.z-fz*rear-dz*side*.45},
  ];
}

/** Conservative occupied area: original source Sedan is still a traffic view
 * and therefore has no Rapier collider. Check other 124 traffic bodies by ID. */
export function overlapsAnotherTrafficSedan(
  point:{x:number;z:number},
  selectedId:string,
  cars:readonly {id:string;x:number;z:number;heading:number}[],
):boolean{
  for(const car of cars){
    if(car.id===selectedId)continue;
    const x=point.x-car.x,z=point.z-car.z;
    const lateral=x*Math.cos(car.heading)-z*Math.sin(car.heading);
    const longitudinal=x*Math.sin(car.heading)+z*Math.cos(car.heading);
    if(Math.abs(lateral)<1.85/2+.49&&Math.abs(longitudinal)<4.75/2+.49)
      return true;
  }
  return false;
}

/** Respect rotated North Heights building envelopes even at open doorways:
 * vehicles cannot occupy the buildings and Voight must not exit inside one. */
export function insideBuildingFootprint(
  point:{x:number;z:number},
  footprints:readonly {x:number;z:number;halfX:number;halfZ:number;yaw:number}[],
  clearance=.45,
):boolean{
  for(const b of footprints){
    const x=point.x-b.x,z=point.z-b.z,c=Math.cos(b.yaw),s=Math.sin(b.yaw);
    const localX=x*c+z*s,localZ=-x*s+z*c;
    if(Math.abs(localX)<b.halfX+clearance&&Math.abs(localZ)<b.halfZ+clearance)
      return true;
  }
  return false;
}

/** Never allow disembark simply because an autonomous car slows to turn. */
export function trafficSedanCanExit(speedMps:number):boolean{
  return Number.isFinite(speedMps)&&Math.abs(speedMps)<=.25;
}

/** Stable wrap-safe turn delta for a chase camera without changing car yaw. */
export function trafficHeadingDelta(previous:number,next:number):number{
  return Math.atan2(Math.sin(next-previous),Math.cos(next-previous));
}
