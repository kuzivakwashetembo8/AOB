/** POI-004: one permanent cut-out, identically applied to visual and Rapier floors.
 * The central shaft is in the eastern 53-floor tower only. */
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001} from "./north-heights-finch-hq-001";
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
