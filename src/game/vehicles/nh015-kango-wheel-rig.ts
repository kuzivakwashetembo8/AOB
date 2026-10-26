/** NH-015 Renault Kangoo: source-correct four-wheel motion.
 * The compact 326KB Draco source retains ~226k triangles and merged real
 * wheels; the prebuild script isolates FOUR original tyre+alloy assemblies
 * into hub-centered, independently steerable nodes with no fake geometry.
 */
import {TransformNode} from "@babylonjs/core";
import {StreetVehicleWheelRig,type StreetVehicleWheelMapping,type WheelCorner}
 from "./street-vehicle-wheels";
export const NH015_KANGO_WHEELBASE=2.85;
export const NH015_KANGO_TRACK=1.55;
export const NH015_KANGO_SOURCE_UP_CORRECTION=-Math.PI/2; // author Z-up, Babylon Y-up
export const NH015_KANGO_HEADING_CORRECTION=0; // source front -Y -> fitted +Z
export function prepareKangoWheels015(anchor:TransformNode):StreetVehicleWheelRig{
 const wheelNames:Record<WheelCorner,string>={
   frontLeft:"NH015_KANGO_frontLeft_PIVOT",
   frontRight:"NH015_KANGO_frontRight_PIVOT",
   rearLeft:"NH015_KANGO_rearLeft_PIVOT",
   rearRight:"NH015_KANGO_rearRight_PIVOT",
 };
 for(const name of Object.values(wheelNames)){
   const matches=anchor.getDescendants(false).filter(n=>n.name.split(":").pop()===name);
   if(matches.length!==1||!(matches[0] instanceof TransformNode)||
      !matches[0].getChildMeshes(false).some(m=>m.getTotalVertices()>0))
     throw Error("NH015 four-wheel source qualification failed: "+name);
 }
 const mapping:StreetVehicleWheelMapping={
   wheelNames,spinAxis:"x",steerAxis:"z",steeringMode:"world-yaw",
   steeringSign:-1,fallbackRadiusMetres:.335,
 };
 const rig=new StreetVehicleWheelRig(anchor,mapping);
 if(!rig.ready||rig.frontWheelCount!==2||rig.absentNames.length)
   throw Error("NH015 did not rig exactly four original wheel corners");
 return rig;
}
