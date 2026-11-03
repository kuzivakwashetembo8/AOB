/** NH-LIFT-019 — one deterministic shaft for EVERY multi-floor lot.
 * Geometry and Rapier must call exactly this plan; Finch HQ retains its
 * established 53-floor shaft without changing its story coordinates.
 */
import {finchShaft004} from "./north-heights-finch-elevator-structure-004";
export type LiftLot019={id:string;position:{x:number;z:number};
 overrides?:{width?:number;depth?:number;floors?:number;floorHeight?:number}};
export type BuildingShaft019={id:string;x:number;z:number;halfX:number;halfZ:number;
 bottomFloorOffset:number;topFloorOffset:number;floors:number;fh:number;
 width:number;depth:number;finch:boolean};
export function northHeightsBuildingShaft019(lot:LiftLot019):BuildingShaft019|null{
 const width=lot.overrides?.width??12,depth=lot.overrides?.depth??12;
 const floors=lot.overrides?.floors??1,fh=lot.overrides?.floorHeight??3.1;
 if(floors<2||width<9||depth<9)return null;
 const hq=finchShaft004(lot);
 if(hq)return {id:lot.id,...hq,finch:true};
 const halfX=Math.min(1.55,width*.14),halfZ=Math.min(1.65,depth*.12);
 // Towards rear of the open ground-floor room, with entry facing +Z.
 const z=lot.position.z-depth/2+halfZ+1.18;
 return {id:lot.id,x:lot.position.x,z,halfX,halfZ,
  bottomFloorOffset:.27,
  topFloorOffset:.87+(floors-1)*fh,
  floors,fh,width,depth,finch:false};
}
export function buildingLiftFloorHeight019(shaft:BuildingShaft019,floor:number):number{
 const n=Math.max(1,Math.min(shaft.floors,Math.round(floor)));
 return n===1?shaft.bottomFloorOffset:shaft.topFloorOffset-(shaft.floors-n)*shaft.fh;
}
export function buildingLiftTravelSeconds019(from:number,to:number):number{
 return Math.max(1.5,Math.min(14,Math.abs(to-from)*.30));
}
