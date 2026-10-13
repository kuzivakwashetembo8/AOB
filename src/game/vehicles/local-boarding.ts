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
