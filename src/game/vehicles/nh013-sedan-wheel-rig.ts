/** NH-013 sedan wheel qualification.
 * VEH-007 / VEH-008 / WHEEL-001: isolate four real imported wheel assemblies,
 * measure source tyre hubs, preserve the exact visible rim, rubber and tread,
 * then animate through GTD's existing shared StreetVehicleWheelRig.
 *
 * Source audit (Four Door Sedan.glb): physical bonnet/headlamps -X; rear +X.
 * Four tyre hubs at source x +/-1.4015, z +/-0.810, y 0.334.
 * Wheels are authored in body-space vertices, NOT hub-centred transforms.
 * No synthetic cylinders, speculative mesh splitting or independent traffic AI.
 */
import {AbstractMesh,TransformNode,Vector3} from "@babylonjs/core";
import {StreetVehicleWheelRig,type StreetVehicleWheelMapping,type WheelCorner} from "./street-vehicle-wheels";

/** The imported Babylon glTF root includes source handedness conversion.
 * Accepted NH-013 screenshot shows current car body facing opposite its route.
 * Apply a visual-only half-turn AFTER Mercer fit, not to the traffic agent.
 */
export const NH013_SEDAN_HEADING_CORRECTION=Math.PI;
export const NH013_SEDAN_WHEELBASE_METRES=2.8;
export type NH013WheelPose=Readonly<{x:number;z:number;heading:number}>;
export function sedanSteeringFromMovement(
 previous:NH013WheelPose,current:NH013WheelPose,
):{travelMetres:number;steeringRadians:number}{
 const dx=current.x-previous.x,dz=current.z-previous.z;
 const travelMetres=Math.hypot(dx,dz);
 if(!Number.isFinite(travelMetres)||!Number.isFinite(current.heading)||
   !Number.isFinite(previous.heading))throw Error("NH013 wheel motion requires finite poses");
 const headingDelta=Math.atan2(Math.sin(current.heading-previous.heading),
   Math.cos(current.heading-previous.heading));
 const steer=travelMetres>.003
   ?Math.atan(NH013_SEDAN_WHEELBASE_METRES*headingDelta/travelMetres):0;
 return {travelMetres,steeringRadians:Math.max(-.48,Math.min(.48,steer))};
}
const corners=["frontLeft","frontRight","rearLeft","rearRight"] as const;
// Source coordinate proof: front = source negative X (headlamps -2.37,
// taillights +2.31); left/right are the two source Z axle positions.
const sourceSuffixByCorner:Record<WheelCorner,string>={
 frontLeft:"",frontRight:".001",rearLeft:".002",rearRight:".003",
};
const groups=[
 "107 reused Alloy_five_spoke_rim",
 "107 reused Sculpted_tyre",
 "Siped tread blocks",
] as const;
export interface NH013SedanWheelResult{
 ready:boolean;identified:number;reason:string;
 rig:StreetVehicleWheelRig|null;
}
function importedName(node:TransformNode):string{
 return node.name.split(":").pop()??node.name;
}
export function prepareNH013SedanWheelRig(
 root:TransformNode,
):NH013SedanWheelResult{
 const visible=root.getChildMeshes(false).filter(m=>m.getTotalVertices()>0);
 const selected=new Map<WheelCorner,{parts:AbstractMesh[];hub:Vector3;parent:TransformNode}>();
 for(const corner of corners){
   const suffix=sourceSuffixByCorner[corner];
   const parts:AbstractMesh[]=[];
   for(const group of groups){
     const matches=visible.filter(m=>importedName(m)===group+suffix);
     if(matches.length!==1)return {ready:false,identified:selected.size,
       reason:"Missing or ambiguous source wheel part "+corner+" / "+group+suffix,rig:null};
     parts.push(matches[0]!);
   }
   const tyre=parts[1]!;
   const parent=tyre.parent;
   if(!(parent instanceof TransformNode)||parts.some(m=>m.parent!==parent))
     return {ready:false,identified:selected.size,
       reason:"Wheel part parents are not a unique source transform for "+corner,rig:null};
   tyre.computeWorldMatrix(true);
   const box=tyre.getBoundingInfo().boundingBox;
   const size=box.maximumWorld.subtract(box.minimumWorld);
   const sorted=[size.x,size.y,size.z].sort((a,b)=>a-b);
   if(sorted[1]!<.38||sorted[1]!>1.05)
     return {ready:false,identified:selected.size,
       reason:"Unqualified true tyre diameter for "+corner,rig:null};
   selected.set(corner,{parts,hub:box.centerWorld.clone(),parent});
 }
 const hubs=corners.map(c=>selected.get(c)!.hub);
 // Four distinct original source hubs, with front vs rear and track width.
 const front=hubs[0]!.add(hubs[1]!).scale(.5);
 const rear=hubs[2]!.add(hubs[3]!).scale(.5);
 const wheelbase=Vector3.Distance(front,rear);
 const track=(Vector3.Distance(hubs[0]!,hubs[1]!)+
   Vector3.Distance(hubs[2]!,hubs[3]!))*.5;
 if(wheelbase<1.9||wheelbase>3.8||track<1.2||track>2.3)
   return {ready:false,identified:4,reason:"Original sedan hub geometry rejected",rig:null};
 const created:TransformNode[]=[];
 try{
   const names={} as Record<WheelCorner,string>;
   for(const corner of corners){
     const entry=selected.get(corner)!;
     entry.parent.computeWorldMatrix(true);
     const pivot=new TransformNode("nh013-sedan-wheel-"+corner,root.getScene());
     pivot.parent=entry.parent;
     pivot.position.copyFrom(Vector3.TransformCoordinates(entry.hub,
       entry.parent.getWorldMatrix().clone().invert()));
     pivot.computeWorldMatrix(true);
     for(const part of entry.parts)part.setParent(pivot);
     created.push(pivot);names[corner]=pivot.name;
   }
   const mapping:StreetVehicleWheelMapping={
     wheelNames:names,spinAxis:"z",steerAxis:"y",steeringMode:"world-yaw",
     steeringSign:-1,fallbackRadiusMetres:.335,
   };
   const rig=new StreetVehicleWheelRig(root,mapping);
   if(!rig.ready)throw Error("Shared GTD wheel rig did not bind all four hubs");
   return {ready:true,identified:4,reason:"Four source rim/tyre/tread groups rigged",rig};
 }catch(error){
   for(const pivot of created.reverse()){
     for(const child of pivot.getChildren())child.setParent(pivot.parent);
     pivot.dispose();
   }
   return {ready:false,identified:0,
     reason:error instanceof Error?error.message:String(error),rig:null};
 }
}
