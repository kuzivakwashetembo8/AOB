/** NH-010 map projection: world X east, world Z north, screen Y down. */
import {NORTH_HEIGHTS_COORDS,
 NORTH_HEIGHTS_X_STREETS,NORTH_HEIGHTS_Z_STREETS,northHeightsAreaAt}
 from "@/game/world-generation/north-heights-location-009";
import {NORTH_HEIGHTS_PARKING_LOTS_010,NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010}
 from "./north-heights-spatial-plan-010";
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001}
 from "./north-heights-finch-hq-001";
export const NORTH_HEIGHTS_MAP_SIZE_010=640;
export const NORTH_HEIGHTS_MAP_ROADS_010=NORTH_HEIGHTS_COORDS.map((coord,i)=>({
  x:coord+320,z:320-coord,
  northSouth:NORTH_HEIGHTS_X_STREETS[i]!,
  eastWest:NORTH_HEIGHTS_Z_STREETS[i]!,
}));
export function northHeightsMapPoint010(position:{x:number;z:number}){
 const limit=(n:number)=>Math.min(640,Math.max(0,n));
 return {x:limit(position.x+320),y:limit(320-position.z)};
}
export const NORTH_HEIGHTS_MAP_BLOCKS_010=Array.from({length:100},(_,n)=>{
 const row=Math.floor(n/10),col=n%10;
 const id="NH-"+String(row+1).padStart(2,"0")+"-"+String(col+1).padStart(2,"0");
 const park=(col*5+row*7)%17===0||(row===7&&col===4);
 return {id,x:col*64,y:(9-row)*64,area:northHeightsAreaAt(row+1,col+1),
  kind:NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010.has(id)?"parking":park?"park":"building"};
});
export const NORTH_HEIGHTS_MAP_PARKING_010=NORTH_HEIGHTS_PARKING_LOTS_010
 .map(lot=>({...northHeightsMapPoint010(lot),id:lot.id}));

/** POI-002: stable headquarters pin, projected by the same world-to-map transform as Voight. */
export const NORTH_HEIGHTS_MAP_FINCH_HQ_001={
 ...NORTH_HEIGHTS_FINCH_HEADQUARTERS_001,
 ...northHeightsMapPoint010(NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.position),
} as const;
