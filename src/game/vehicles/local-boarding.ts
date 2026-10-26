/** Board only a local vehicle; restore precise original position when stationary. */
export interface Point3 {x:number;y:number;z:number}
export const VEHICLE_BOARD_RADIUS=3.5;
export function nearestSportsCar<T extends {id:string;pose:Point3}>(
 actor:Point3,cars:readonly T[]):T|null{
 const sorted=cars.map(car=>({car,d:Math.hypot(car.pose.x-actor.x,car.pose.z-actor.z)}))
 .filter(x=>x.d<=VEHICLE_BOARD_RADIUS && Math.abs(x.car.pose.y-actor.y)<3)
 .sort((a,b)=>a.d-b.d||a.car.id.localeCompare(b.car.id));
 return sorted[0]?.car??null;
}
export function stationaryDisembark(
 player:Point3|null,atBoarding:Point3|null,atExit:Point3):Point3|null{
 if(!player||!atBoarding)return null;
 return Math.hypot(atBoarding.x-atExit.x,atBoarding.z-atExit.z)<0.12
 ? {...player}:null;
}

/**
 * VEH-BASIC-001: a hidden driver exits beside the CURRENT stopped vehicle.
 * The live vehicle's Rapier-backed method already checks ground, clearance,
 * body footprint and collisions. Do not fall back to the boarding coordinates.
 */
export function currentVehicleDisembark(
 car:{findSafeExitPosition:()=>Point3|null},
):Point3|null{
 const exit=car.findSafeExitPosition();
 return exit&&[exit.x,exit.y,exit.z].every(Number.isFinite)?{...exit}:null;
}

/** OPT-03: reject physical building volumes intersecting the boarding line.
 * Uses the same world-space solid envelope that constrains the game camera.
 * Candidate range is a first filter, never proof that a wall is passable. */
export interface BoardingBlocker {x:number;y:number;z:number;halfX:number;halfY:number;halfZ:number}
export function unobstructedBoardingLine(start:Point3,end:Point3,blockers:readonly BoardingBlocker[]):boolean {
  for(const box of blockers){
    const origin={x:start.x,y:start.y+.5,z:start.z};
    const d={x:end.x-start.x,y:end.y-start.y,z:end.z-start.z};
    let enter=0,exit=1;
    for(const axis of ["x","y","z"] as const){
      const lo=box[axis]-box[axis==="x"?"halfX":axis==="y"?"halfY":"halfZ"];
      const hi=box[axis]+box[axis==="x"?"halfX":axis==="y"?"halfY":"halfZ"];
      if(Math.abs(d[axis])<1e-7){if(origin[axis]<lo||origin[axis]>hi)exit=-1;continue;}
      const ta=(lo-origin[axis])/d[axis],tb=(hi-origin[axis])/d[axis];
      enter=Math.max(enter,Math.min(ta,tb));exit=Math.min(exit,Math.max(ta,tb));
    }
    if(enter<=exit&&exit>=0&&enter<=1)return false;
  }
  return true;
}
export function nearestAccessibleCar<T extends {id:string;pose:Point3}>(actor:Point3,cars:readonly T[],blockers:readonly BoardingBlocker[]):T|null{
  return cars.filter(car=>Math.hypot(car.pose.x-actor.x,car.pose.z-actor.z)<=VEHICLE_BOARD_RADIUS&&
    Math.abs(car.pose.y-actor.y)<3&&unobstructedBoardingLine(actor,car.pose,blockers))
    .sort((a,b)=>Math.hypot(a.pose.x-actor.x,a.pose.z-actor.z)-Math.hypot(b.pose.x-actor.x,b.pose.z-actor.z)||a.id.localeCompare(b.id))[0]??null;
}

/** South Ward building footprints may be rotated; test actual plan-view path to
 * the candidate vehicle, not merely nearest-car distance. */
export interface PlanarBuildingFootprint {x:number;z:number;halfX:number;halfZ:number;yaw:number}
export function accessibleAcrossPlan(start:Point3,end:Point3,blocks:readonly PlanarBuildingFootprint[]):boolean {
  for(const b of blocks){
    const c=Math.cos(b.yaw),q=Math.sin(b.yaw);
    const rel=(p:Point3)=>({x:(p.x-b.x)*c+(p.z-b.z)*q,z:-(p.x-b.x)*q+(p.z-b.z)*c});
    const a=rel(start),d=rel(end);
    const dx=d.x-a.x,dz=d.z-a.z;
    let low=0,high=1;
    for(const [v,delta,half] of [[a.x,dx,b.halfX],[a.z,dz,b.halfZ]]){
      if(Math.abs(delta)<1e-8){if(Math.abs(v)>half)high=-1;continue;}
      const first=(-half-v)/delta,last=(half-v)/delta;
      low=Math.max(low,Math.min(first,last));high=Math.min(high,Math.max(first,last));
    }
    if(low<=high&&high>=0&&low<=1)return false;
  }
  return true;
}
export function nearestAccessiblePlanarCar<T extends {id:string;pose:Point3}>(
 actor:Point3,cars:readonly T[],blocks:readonly PlanarBuildingFootprint[]):T|null{
 return cars.filter(car=>Math.hypot(car.pose.x-actor.x,car.pose.z-actor.z)<=VEHICLE_BOARD_RADIUS&&
   Math.abs(car.pose.y-actor.y)<3&&accessibleAcrossPlan(actor,car.pose,blocks))
   .sort((a,b)=>Math.hypot(a.pose.x-actor.x,a.pose.z-actor.z)-Math.hypot(b.pose.x-actor.x,b.pose.z-actor.z)||a.id.localeCompare(b.id))[0]??null;
}
