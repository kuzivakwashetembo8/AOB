/** PED-001 VIS-004: terrain-relative contact elevation derived from the
 * accepted NH003 road footprints. Does not affect graph paths or locomotion. */
import {NORTH_HEIGHTS_COORDS} from "@/game/world-generation/north-heights-location-009";
import {
 NORTH_HEIGHTS_ROAD_HALF_WIDTH_003,
 NORTH_HEIGHTS_SIDEWALK_OUTER_003,
 NORTH_HEIGHTS_SIDEWALK_ELEVATION_003,
 NORTH_HEIGHTS_ASPHALT_ELEVATION_003,
} from "./north-heights-roads-003";

export const NORTH_HEIGHTS_DOOR_FOUNDATION_ELEVATION_001=.19;
const nearestStreet=(v:number)=>{
 let closest=Infinity;
 for(const street of NORTH_HEIGHTS_COORDS)closest=Math.min(closest,Math.abs(v-street));
 return closest;
};
/** Sidewalk and junction pad: +.20; asphalt and zebra: +.075;
 * parks/ordinary building approaches: grade; near portal: +.19 foundation.
 * Caller supplies a route endpoint door only when applicable. */
export function northHeightsPedestrianSurfaceOffset001(
 x:number,z:number,door?:{x:number;z:number}|null,
):number{
 const nearest=Math.min(nearestStreet(x),nearestStreet(z));
 if(nearest<=NORTH_HEIGHTS_ROAD_HALF_WIDTH_003+1e-3)
   return NORTH_HEIGHTS_ASPHALT_ELEVATION_003;
 if(nearest<=NORTH_HEIGHTS_SIDEWALK_OUTER_003+1e-3)
   return NORTH_HEIGHTS_SIDEWALK_ELEVATION_003;
 if(door&&Math.hypot(x-door.x,z-door.z)<=1.0)
   return NORTH_HEIGHTS_DOOR_FOUNDATION_ELEVATION_001;
 return 0;
}
