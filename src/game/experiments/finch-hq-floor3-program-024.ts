/** FINCH-CAFE-024: accepted AppDeploy Floor 3 spatial brief as DATA.
 * Zones/recipes are supplied to the common organization function, not
 * hardcoded in Babylon. Later floors pass different grammar configurations.
 */
import {organizeRoomFloor024,connectableRooms024,
 type RoomFloorRequest024,type RoomComponentRule024}
 from "@/game/interiors/organize-floor-024";
import type {BuildingSpec} from "@/game/world-generation/schema";
import {finchShaft004} from "./north-heights-finch-elevator-structure-004";

const anchor=(x:number,z:number,yaw=0,elevation=0)=>({x,z,yaw,elevation});
const rule=(id:string,zoneId:string,kind:RoomComponentRule024["kind"],
 anchors:readonly ReturnType<typeof anchor>[],dimensions?:{
 width?:number;depth?:number;height?:number;
}):RoomComponentRule024=>({
 id,zoneId,kind,layout:"anchors",anchors,
 ...(dimensions??{}),
});
export const FINCH_CAFE_FLOOR_024=3;
export function finchCafeFloorProgram024(lot:BuildingSpec):RoomFloorRequest024{
 if(lot.id!=="NH-04-06-L2")
  throw new Error("Floor 3 cafe is only approved for Finch HQ");
 const shaft=finchShaft004(lot);
 if(!shaft)throw new Error("Finch HQ shaft missing");
 const width=lot.overrides?.width??22.669;
 const depth=lot.overrides?.depth??33.889;
 const minZ=shaft.z-lot.position.z;
 const zones=[
  {id:"lift",purpose:"Existing glass elevator and clear lift landing",
   minX:-2.55,maxX:2.55,minZ:minZ-2.55,maxZ:minZ+2.55},
  {id:"cafe",purpose:"Cafe seating, main circulation and counter",
   minX:-10.90,maxX:10.90,minZ:-8.96,maxZ:16.72},
  {id:"meeting",purpose:"Private casual meeting room",
   minX:-10.80,maxX:-4.12,minZ:7.88,maxZ:13.90},
  {id:"pantry",purpose:"Cafe service pantry, sink and storage",
   minX:5.52,maxX:10.32,minZ:7.18,maxZ:14.42},
 ] as const;
 // Accepted viewer: six groups, wood-and-marble service counter, two-chair
 // meeting suite, separate pantry, greenery and warm suspended lighting.
 const rules:RoomComponentRule024[]=[
  rule("visitor-tables","cafe","cafe-table-group",[
   anchor(-6,-4),anchor(-6,0),anchor(-5.7,4),
   anchor(-3.05,-3),anchor(3,-3),anchor(.25,2),
  ]),
  rule("cafe-counter","cafe","cafe-counter",[anchor(5.3,3.2)]),
  // Countertop apparatus rests 1.30m above the structural floor.
  rule("espresso-station","cafe","espresso-machine",[
   anchor(6.36,3.09,0,1.30),
  ]),
  rule("counter-menu","cafe","sign-panel",[anchor(5.4,2.65)],
   {width:1.58}),
  rule("counter-planting","cafe","indoor-plant",[
   anchor(-9,-4),anchor(9,-4),anchor(-8.9,5),
   anchor(8.50,2.0),anchor(-9,0),anchor(.2,13.65),
  ]),
  rule("meeting-floor-rug","meeting","floor-rug",[
   anchor(-7.4,10.82),
  ],{width:5.50,depth:4.90}),
  rule("meeting-table","meeting","meeting-table",[
   anchor(-7.4,10.95),
  ]),
  rule("meeting-chairs","meeting","meeting-chair",[
   anchor(-8.95,10.90),anchor(-5.85,10.90),
  ]),
  rule("meeting-display","meeting","meeting-display",[
   anchor(-7.4,13.59),
  ],{width:2.25}),
  rule("meeting-west-glass","meeting","partition-glass",[
   anchor(-10.70,10.85,Math.PI/2),
  ],{width:5.70,depth:.075,height:2.90}),
  rule("meeting-east-glass","meeting","partition-glass",[
   anchor(-4.30,10.85,Math.PI/2),
  ],{width:5.70,depth:.075,height:2.90}),
  rule("meeting-back-glass","meeting","partition-glass",[
   anchor(-7.50,13.70),
  ],{width:6.40,depth:.075,height:2.90}),
  // These two separate panels leave a real 2.4m meeting-room doorway.
  rule("meeting-front-left","meeting","partition-glass",[
   anchor(-9.30,8.0),
  ],{width:2.80,depth:.075,height:2.90}),
  rule("meeting-front-right","meeting","partition-glass",[
   anchor(-4.90,8.0),
  ],{width:1.20,depth:.075,height:2.90}),
  rule("meeting-pendant","meeting","pendant-light",[
   anchor(-7.40,10.90),
  ]),
  rule("service-prep","pantry","pantry-bench",[
   anchor(8.35,11.4),
  ],{width:2.35}),
  rule("service-cabinet","pantry","storage-cabinet",[
   anchor(7.0,13.62),
  ],{width:.76,depth:.64}),
  rule("service-shelves","pantry","pantry-shelf",[
   anchor(9.65,8.3),anchor(9.65,9.35),
   anchor(9.65,10.4),anchor(9.65,11.45),
   anchor(9.65,12.5),
  ],{width:1.10}),
  // South and north pantry walls, east perimeter, and the divided west
  // entrance frame a genuine 2.1m service access.
  rule("pantry-front","pantry","wall-segment",[
   anchor(7.90,7.30),
  ],{width:4.50,depth:.095,height:2.90}),
  rule("pantry-back","pantry","wall-segment",[
   anchor(7.90,14.30),
  ],{width:4.50,depth:.095,height:2.90}),
  rule("pantry-east","pantry","wall-segment",[
   anchor(10.25,10.80,Math.PI/2),
  ],{width:7.0,depth:.095,height:2.90}),
  rule("pantry-west-lower","pantry","wall-segment",[
   anchor(5.60,8.92,Math.PI/2),
  ],{width:2.0,depth:.095,height:2.90}),
  rule("pantry-west-upper","pantry","wall-segment",[
   anchor(5.60,13.18,Math.PI/2),
  ],{width:2.0,depth:.095,height:2.90}),
  rule("cafe-lift-carpet","cafe","floor-rug",[
   anchor(0,-6.38),
  ],{width:2.48,depth:5.30}),
  rule("warm-hanging-lights","cafe","pendant-light",[
   anchor(-5,-4),anchor(-5,3),anchor(2,-3),
   anchor(2,3),anchor(5.15,3.2),
  ]),
 ];
 return {
  id:"NH-04-06-L2:F03",buildingId:lot.id,floor:3,width,depth,
  shaft:{x:shaft.x-lot.position.x,z:minZ,
   halfX:shaft.halfX,halfZ:shaft.halfZ},
  zones,rules,
  openings:[
   {id:"F03-LIFT-ARRIVAL",from:"lift",to:"cafe",x:0,z:minZ+2.55,width:2.55},
   {id:"F03-CAFE-MEETING",from:"cafe",to:"meeting",x:-6.70,z:8.0,width:2.40},
   {id:"F03-CAFE-PANTRY",from:"cafe",to:"pantry",x:5.60,z:11.1,width:2.1},
  ],
 };
}
export function organizeFinchCafeFloor024(lot:BuildingSpec){
 const planned=organizeRoomFloor024(finchCafeFloorProgram024(lot));
 if(!connectableRooms024(planned))
  throw new Error("Finch cafe room graph is not connected to glass lift");
 return planned;
}
