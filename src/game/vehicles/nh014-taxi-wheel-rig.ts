/** NH-014: source-authentic Taxi.glb four-wheel qualification.
 * GLB glTF audit: authored wheels lgnWFL_1, lgnWFR_9, lgnWRL_8, lgnWRR_10;
 * each has a dedicated hub transform and the original Object_* tyre/rim mesh.
 * Wrapped neutral pivots compensate for the source's opposite left/right hub
 * quaternions, so one uniform world roll axis works on all four corners.
 * No synthetic tyre geometry, no in-browser topology processing.
 */
import {TransformNode,Quaternion} from "@babylonjs/core";
import {StreetVehicleWheelRig,type StreetVehicleWheelMapping,type WheelCorner}
 from "./street-vehicle-wheels";

export const NH014_TAXI_WHEELBASE=2.865;
export const NH014_TAXI_TRACK=1.50;
export const NH014_TAXI_HEADING_CORRECTION=0; // source front -Z; Babylon left-handed import faces +Z
const sourceNodes:Record<WheelCorner,string>={
 frontLeft:"lgnWFL_1",frontRight:"lgnWFR_9",
 rearLeft:"lgnWRL_8",rearRight:"lgnWRR_10",
};
const corners=Object.keys(sourceNodes) as WheelCorner[];
function authoredName(name:string){return name.split(":").pop()??name;}
export function prepareTaxiWheelRig014(anchor:TransformNode):StreetVehicleWheelRig{
 const descendants=anchor.getDescendants(false);
 const selected=new Map<WheelCorner,TransformNode>();
 for(const corner of corners){
   const found=descendants.filter(node=>node instanceof TransformNode &&
     authoredName(node.name)===sourceNodes[corner]);
   if(found.length!==1||!(found[0] instanceof TransformNode))
     throw Error("NH014 taxi: missing/ambiguous original wheel "+corner);
   const node=found[0];
   if(!node.parent||!node.getChildMeshes(false).some(mesh=>mesh.getTotalVertices()>0))
     throw Error("NH014 taxi: original wheel geometry not independently rigged "+corner);
   selected.set(corner,node);
 }
 if(new Set(selected.values()).size!==4)throw Error("NH014 taxi wheel hubs duplicated");
 const created:{pivot:TransformNode;original:TransformNode;parent:TransformNode}[]=[];
 try{
   const names={} as Record<WheelCorner,string>;
   for(const corner of corners){
     const original=selected.get(corner)!;
     const parent=original.parent;
     if(!(parent instanceof TransformNode))throw Error("NH014 taxi parent is not a transform");
     const pivot=new TransformNode("nh014-taxi-wheel-"+corner,anchor.getScene());
     pivot.parent=parent;
     pivot.position.copyFrom(original.position);
     pivot.rotationQuaternion=Quaternion.Identity();
     original.setParent(pivot); // Babylon preserves source-world rotation/materials.
     created.push({pivot,original,parent});
     names[corner]=pivot.name;
   }
   const mapping:StreetVehicleWheelMapping={
     wheelNames:names,spinAxis:"x",steerAxis:"y",
     steeringMode:"world-yaw",steeringSign:-1,fallbackRadiusMetres:.36,
   };
   const rig=new StreetVehicleWheelRig(anchor,mapping);
   if(!rig.ready||rig.absentNames.length||rig.frontWheelCount!==2)
     throw Error("NH014 taxi: four independent imported hubs not qualified");
   return rig;
 }catch(error){
   for(const {pivot,original,parent} of created.reverse()){
     original.setParent(parent);
     pivot.dispose();
   }
   throw error;
 }
}
