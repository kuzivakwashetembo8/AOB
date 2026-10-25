/** NH-010: one deterministic site plan for parking, entrances and collision.
 * No rendering dependency. Reserved parcels precede trees and buildings. */
export interface NorthHeightsParkingStall010{
  id:string; x:number; z:number; yaw:number;
}
export interface NorthHeightsParkingLot010{
  id:string; blockId:string; x:number; z:number; width:number; depth:number;
  entry:{x:number;z:number;roadX:number};
  stalls:readonly NorthHeightsParkingStall010[];
}
export const NORTH_HEIGHTS_PARKING_LOTS_010:readonly NorthHeightsParkingLot010[]=[
  {id:"NH-PARKING-GLASS-01",blockId:"NH-03-05",x:-32,z:-160,width:47,depth:47,
   entry:{x:-8,z:-160,roadX:0},
   // Two staggered rows. Each stall has >4m to its neighbours.
   stalls:[
     {id:"NH-P01",x:-45,z:-173,yaw:Math.PI/2},
     {id:"NH-P02",x:-32,z:-173,yaw:Math.PI/2},
     {id:"NH-P03",x:-19,z:-173,yaw:Math.PI/2},
     {id:"NH-P04",x:-45,z:-147,yaw:Math.PI/2},
     {id:"NH-P05",x:-32,z:-147,yaw:Math.PI/2},
     {id:"NH-P06",x:-19,z:-147,yaw:Math.PI/2},
   ]},
  // An additional *empty* parcel provides safe future fleet capacity without
  // instantiating more GLBs. Its stalls share the identical world contract.
  {id:"NH-PARKING-GLASS-02",blockId:"NH-04-07",x:96,z:-96,width:47,depth:47,
   entry:{x:120,z:-96,roadX:128},
   stalls:[
     {id:"NH-P07",x:83,z:-109,yaw:Math.PI/2},
     {id:"NH-P08",x:96,z:-109,yaw:Math.PI/2},
     {id:"NH-P09",x:109,z:-109,yaw:Math.PI/2},
     {id:"NH-P10",x:83,z:-83,yaw:Math.PI/2},
     {id:"NH-P11",x:96,z:-83,yaw:Math.PI/2},
     {id:"NH-P12",x:109,z:-83,yaw:Math.PI/2},
   ]},
] as const;
export const NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010=new Set(
  NORTH_HEIGHTS_PARKING_LOTS_010.map(l=>l.blockId),
);
/** Stable single unblocked +Z opening; re-used by glass, frame and Rapier. */
export const NORTH_HEIGHTS_PORTAL_WIDTH_010=3.2;
export const NORTH_HEIGHTS_PORTAL_HEIGHT_010=3.05;
export function northHeightsDoorway010(lot:{position:{x:number;z:number};overrides?:{width?:number;depth?:number}}){
 const w=lot.overrides?.width??12,d=lot.overrides?.depth??12;
 return {x:lot.position.x,z:lot.position.z+d/2,
  width:Math.min(NORTH_HEIGHTS_PORTAL_WIDTH_010,w*.45),
  height:NORTH_HEIGHTS_PORTAL_HEIGHT_010};
}
export function parkingLotCarOverlaps010(
 stall:NorthHeightsParkingStall010,width:number,length:number,
 rect:{minX:number;maxX:number;minZ:number;maxZ:number},
 margin=.35,
){
 const c=Math.abs(Math.cos(stall.yaw)),s=Math.abs(Math.sin(stall.yaw));
 const halfX=(c*width+s*length)/2+margin;
 const halfZ=(s*width+c*length)/2+margin;
 return stall.x+halfX>rect.minX&&stall.x-halfX<rect.maxX&&
        stall.z+halfZ>rect.minZ&&stall.z-halfZ<rect.maxZ;
}
export function validateNorthHeightsParking010(
 lots:readonly {position:{x:number;z:number};overrides?:{width?:number;depth?:number}}[],
 carDimensions:readonly {width:number;length:number}[],
){
 const parking=NORTH_HEIGHTS_PARKING_LOTS_010[0]!;
 if(carDimensions.length!==parking.stalls.length)throw Error("NH-010 requires six accepted cars");
 for(let i=0;i<parking.stalls.length;i++){
   const stall=parking.stalls[i]!,size=carDimensions[i]!;
   if(Math.abs(stall.x-parking.x)+size.length/2>parking.width/2-.5||
      Math.abs(stall.z-parking.z)+size.length/2>parking.depth/2-.5)
     throw Error("NH-010 stall outside parking lot: "+stall.id);
   for(const lot of lots){
     const w=lot.overrides?.width??12,d=lot.overrides?.depth??12;
     if(parkingLotCarOverlaps010(stall,size.width,size.length,{
       minX:lot.position.x-w/2,maxX:lot.position.x+w/2,
       minZ:lot.position.z-d/2,maxZ:lot.position.z+d/2,
     }))throw Error("NH-010 vehicle overlaps a building at "+stall.id);
   }
   for(let j=0;j<i;j++){
     const other=parking.stalls[j]!,dims=carDimensions[j]!;
     if(parkingLotCarOverlaps010(stall,size.width,size.length,{
       minX:other.x-dims.length/2-.6,maxX:other.x+dims.length/2+.6,
       minZ:other.z-dims.width/2-.6,maxZ:other.z+dims.width/2+.6,
     }))throw Error("NH-010 overlapping parked cars");
   }
 }
 return true;
}
