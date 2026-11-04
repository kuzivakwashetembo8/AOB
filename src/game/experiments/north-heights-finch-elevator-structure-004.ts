/** POI-004: one permanent cut-out, identically applied to visual and Rapier floors.
 * The central shaft is in the eastern 53-floor tower only. */
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001} from "./north-heights-finch-hq-001";
/** The actual eastern tower footprint; keep terrain, camera and walk limits aligned. */
export const FINCH_LOBBY_FOOTPRINT_006={
 x:NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.position.x,
 z:NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.position.z,
 halfX:22.669/2,halfZ:33.889/2,
} as const;
export const FINCH_LOBBY_FLOOR_OFFSET_006=.27;
/** Avoid the legacy hillside ground minimum raising the player within a flat room. */
export function insideFinchLobby006(x:number,z:number,inset=.25):boolean{
 const r=FINCH_LOBBY_FOOTPRINT_006;
 return Math.abs(x-r.x)<r.halfX-inset&&Math.abs(z-r.z)<r.halfZ-inset;
}
/** Under-floor terrain is flat, with a short exterior blend to the original hill.
 * The shared visible terrain mesh and Rapier mesh both use these heights. */
export function finchTerrainHeight006(x:number,z:number,
 ground:(x:number,z:number)=>number):number{
 const r=FINCH_LOBBY_FOOTPRINT_006;
 const outside=Math.max(0,Math.abs(x-r.x)-r.halfX,Math.abs(z-r.z)-r.halfZ);
 if(outside>=1.6)return ground(x,z);
 const floorUnder=ground(r.x,r.z)+.08; // terrain mesh adds -0.04; effective floor step is 0.23m
 const t=Math.max(0,Math.min(1,outside/1.6));
 const blend=t*t*(3-2*t);
 return floorUnder*(1-blend)+ground(x,z)*blend;
}
/** Physical capsule centre cannot be forced higher by the outdoor hillside. */
export function finchLobbyMinimumCapsuleY006(x:number,z:number,
 ground:(x:number,z:number)=>number):number|null{
 return insideFinchLobby006(x,z)?
  ground(FINCH_LOBBY_FOOTPRINT_006.x,FINCH_LOBBY_FOOTPRINT_006.z)+
  FINCH_LOBBY_FLOOR_OFFSET_006+.92+.015:null;
}
export const FINCH_SHAFT_HALF_X_004=2.55;
export const FINCH_SHAFT_HALF_Z_004=2.55;
export const FINCH_ELEVATOR_TRAVEL_SECONDS_004=14;
export const FINCH_SHAFT_BUILDING_004=NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.buildingId;
export function finchShaft004(lot:{id:string;position:{x:number;z:number};overrides?:{width?:number;depth?:number;floors?:number;floorHeight?:number}}){
 if(lot.id!==FINCH_SHAFT_BUILDING_004)return null;
 const width=lot.overrides?.width??22.669,depth=lot.overrides?.depth??33.889;
 const floors=lot.overrides?.floors??53,fh=lot.overrides?.floorHeight??3.1;
 if(floors!==53)throw Error("POI-004 HQ unexpectedly changed floors");
 return {x:lot.position.x,z:lot.position.z-depth/2+5.35,
  halfX:FINCH_SHAFT_HALF_X_004,halfZ:FINCH_SHAFT_HALF_Z_004,
  bottomFloorOffset:.27,topFloorOffset:.8+(floors-1)*fh+.07,
  floors,fh,width,depth};
}
/** Exact stop elevation: the ground lobby is lower than the repeated upper slabs.
 * A linear (floor-1)/52 fraction stops below intermediate landings.
 */
export function finchFloorStopFraction004(floor:number,
 shaft:{floors:number;fh:number;bottomFloorOffset:number;topFloorOffset:number}):number{
 const selected=Math.max(1,Math.min(shaft.floors,Math.round(floor)));
 if(selected===1)return 0;
 const travel=shaft.topFloorOffset-shaft.bottomFloorOffset;
 if(travel<=0)return 0;
 const landing=shaft.topFloorOffset-(shaft.floors-selected)*shaft.fh;
 return Math.max(0,Math.min(1,(landing-shaft.bottomFloorOffset)/travel));
}
export type FinchFloorSection004={x:number;z:number;width:number;depth:number};
/** Four non-overlapping rectangles leave a full open core at every intermediate
 * level and at the top landing, with a walkable ring all around. */
export function finchFloorRing004(
 x:number,z:number,width:number,depth:number,
 shaft:{x:number;z:number;halfX:number;halfZ:number},
):FinchFloorSection004[]{
 const x0=x-width/2,x1=x+width/2,z0=z-depth/2,z1=z+depth/2;
 const sx0=shaft.x-shaft.halfX,sx1=shaft.x+shaft.halfX;
 const sz0=shaft.z-shaft.halfZ,sz1=shaft.z+shaft.halfZ;
 if(sx0<=x0+.4||sx1>=x1-.4||sz0<=z0+.4||sz1>=z1-.4)
  throw Error("POI-004 elevator is not inside its tower footprint");
 const rectangles=[
  {x:(x0+sx0)/2,z,width:sx0-x0,depth},
  {x:(sx1+x1)/2,z,width:x1-sx1,depth},
  {x:shaft.x,z:(z0+sz0)/2,width:sx1-sx0,depth:sz0-z0},
  {x:shaft.x,z:(sz1+z1)/2,width:sx1-sx0,depth:z1-sz1},
 ];
 if(rectangles.some(r=>r.width<=0||r.depth<=0))throw Error("Invalid Finch shaft cut-out");
 return rectangles;
}
