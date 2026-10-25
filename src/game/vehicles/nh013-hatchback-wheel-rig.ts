/** NH-013 G2 — both hatchback's real source rim nodes and offline-isolated
 * tyre/surface pivots roll and steer together. No synthetic wheels.
 */
import {TransformNode} from "@babylonjs/core";
import {StreetVehicleWheelRig,type StreetVehicleWheelMapping,type WheelCorner} from "./street-vehicle-wheels";
import type {NH013WheelPose} from "./nh013-sedan-wheel-rig";
export const NH013_HATCH_WHEELBASE=2.46;
export const NH013_HATCH_TRACK=1.56;
export type HatchRig013={
 rims:StreetVehicleWheelRig;tyres:StreetVehicleWheelRig;
 update(travel:number,steer:number):void;dispose():void;
};
const rimNames:Record<WheelCorner,string>={
 frontLeft:"Ford_Rim_FL",frontRight:"Ford_Rim_FR",
 rearLeft:"Ford_Rim.BL",rearRight:"Ford_Rim.BR",
};
const tireNames:Record<WheelCorner,string>={
 frontLeft:"NH013_HATCH_TIRE_frontLeft_PIVOT",
 frontRight:"NH013_HATCH_TIRE_frontRight_PIVOT",
 rearLeft:"NH013_HATCH_TIRE_rearLeft_PIVOT",
 rearRight:"NH013_HATCH_TIRE_rearRight_PIVOT",
};
export function prepareHatchbackWheelRig013(root:TransformNode):HatchRig013{
 const mapping=(wheelNames:Record<WheelCorner,string>,spinAxis:"x"|"y"):StreetVehicleWheelMapping=>
 ({wheelNames,spinAxis,steerAxis:"y",steeringMode:"world-yaw",
   steeringSign:-1,fallbackRadiusMetres:.31});
 const rims=new StreetVehicleWheelRig(root,mapping(rimNames,"y"));
 const tyres=new StreetVehicleWheelRig(root,mapping(tireNames,"x"));
 if(!rims.ready||!tyres.ready||rims.absentNames.length||tyres.absentNames.length)
   throw Error("NH013 Hatchback source wheels not separately qualified: "+
     [...rims.absentNames,...tyres.absentNames].join(","));
 return {
   rims,tyres,update(distance,steering){rims.update(distance,steering);tyres.update(distance,steering);},
   dispose(){rims.dispose();tyres.dispose();},
 };
}
export function hatchbackSteerFromPose013(previous:NH013WheelPose,current:NH013WheelPose){
 const d=Math.hypot(current.x-previous.x,current.z-previous.z);
 const delta=Math.atan2(Math.sin(current.heading-previous.heading),
   Math.cos(current.heading-previous.heading));
 return {distance:d,angle:d>.005?Math.max(-.72,Math.min(.72,
   Math.atan(NH013_HATCH_WHEELBASE*delta/d))):0};
}
