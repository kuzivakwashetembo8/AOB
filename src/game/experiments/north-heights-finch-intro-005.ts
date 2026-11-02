/** POI-005/LVL-001: four-message dialogue limit applies to the Finch assignment. */
export {DIANE_DIALOGUE_ASSIGNMENT_001 as FINCH_INTRO_005} from "./level001-diane-007";

export const FINCH_INTRO_STORAGE_KEY_005 = "gtd:poi005:finch-intro-completed:v1";
export const FINCH_START_005 = {
 buildingId:"NH-04-06-L2",
 spawn:{x:47.4,z:-73.2},
 starterCar:{x:52,z:-69.25,heading:-Math.PI/2},
} as const;
export function finchProximity005(
 player:{x:number;y:number;z:number}|null,
 finch:{x:number;y:number;z:number},ready:boolean,
){
 if(!player||!ready)return false;
 const horizontal=Math.hypot(player.x-finch.x,player.z-finch.z);
 return horizontal<=3.8&&Math.abs(player.y-finch.y)<2.5;
}
