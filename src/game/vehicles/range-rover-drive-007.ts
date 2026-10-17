/** VEH-007 — SUV-specific adapter for the accepted generic StreetVehicleActor.
 * No second driving solver. The pictured Rover's front points toward its
 * authored +Z axis, unlike the Ferrari's -Z; handle that here, not in physics.
 * GLB wheel pivots are discovered only if four independent pivots exist.
 */
import {AbstractMesh,TransformNode,Vector3} from "@babylonjs/core";
import {FERRARI_STREET_PROFILE,type StreetVehiclePhysicsProfile} from "./street-vehicle-physics";
import {type StreetVehicleWheelMapping,type WheelCorner} from "./street-vehicle-wheels";
import type {SeatVehiclePose,SeatVehicleDimensions,DriverWorldPose} from "./driver-seat-placement";
import {ferrariRearCameraAlpha} from "./ferrari-camera";

/** Owner-authorized VEH-007 release: /game always mounts the Range Rover
 * unless an explicit opt-out is supplied. Unrelated parameters are ignored.
 * No dependency on any Sedan, renderer or debug preview flag. */
export function rangeRoverDriveEnabled(params:URLSearchParams):boolean{
  return params.get("gtdRangeRoverDrive")!=="0";
}

/** Ferrari's -Z rear-camera bearing must be reversed for the Rover +Z nose. */
export function rangeRoverRearCameraAlpha(yaw:number){
  if(!Number.isFinite(yaw))throw Error("VEH007 invalid camera heading");
  return ferrariRearCameraAlpha(yaw)+Math.PI;
}
export const RANGE_ROVER_STREET_PROFILE:StreetVehiclePhysicsProfile=Object.freeze({
  ...FERRARI_STREET_PROFILE,
  classId:"range-rover-sport-2018",
  forwardAxisSign:1,
  wheelRadiusFallbackMetres:.38,
});

export function rangeRoverDriverSeatWorldPose(
  vehicle:SeatVehiclePose,dimensions:SeatVehicleDimensions,
):DriverWorldPose{
  const values=[vehicle.x,vehicle.y,vehicle.z,vehicle.yaw,
    dimensions.x,dimensions.y,dimensions.z];
  if(!values.every(Number.isFinite)||
    dimensions.x<=0||dimensions.y<=0||dimensions.z<=0)
    throw Error("VEH007 requires finite calibrated SUV pose and dimensions");
  // Provisional owner-visual seat fit. The right-hand driving position is
  // deliberately distinct from the Ferrari, whose cockpit faces -Z.
  const dx=dimensions.x*.22,dz=dimensions.z*.11;
  const cos=Math.cos(vehicle.yaw),sin=Math.sin(vehicle.yaw);
  return {x:vehicle.x+cos*dx+sin*dz,
    y:vehicle.y+dimensions.y*.57,
    z:vehicle.z-sin*dx+cos*dz,
    yaw:vehicle.yaw};
}
/** VEH-007 provisional SUV lower-limb targets derived from the same fitted
 * dimensions and live vehicle pose used by StreetVehicleActor. This affects
 * visual leg IK ONLY. It is not an assertion about an unmeasured cabin carpet.
 * Local +Z is the Rover's verified driving-forward direction.
 */
export function planRangeRoverFootwellTargets(args:{
  vehicle:SeatVehiclePose;dimensions:SeatVehicleDimensions;
  leftHip:Vector3;rightHip:Vector3;
}){
  const {vehicle,dimensions,leftHip,rightHip}=args;
  const n=[vehicle.x,vehicle.y,vehicle.z,vehicle.yaw,
    dimensions.x,dimensions.y,dimensions.z,
    ...leftHip.asArray(),...rightHip.asArray()];
  if(!n.every(Number.isFinite)||dimensions.x<=0||
    dimensions.y<=0||dimensions.z<=0)
    throw Error("VEH007 invalid footwell source");
  const c=Math.cos(vehicle.yaw),si=Math.sin(vehicle.yaw);
  const y=vehicle.y+dimensions.y*.37;
  const halfWidth=dimensions.x*.32;
  const maxForward=dimensions.z*.27;
  const target=(hip:Vector3)=>{
    const dx=hip.x-vehicle.x,dz=hip.z-vehicle.z;
    const localX=Math.max(-halfWidth,Math.min(halfWidth,c*dx-si*dz));
    const localZ=si*dx+c*dz;
    // Toe pivots advance toward the pedals, remaining inside the cabin
    // planform rather than dropping directly beneath the seat.
    const forward=Math.max(-dimensions.z*.05,Math.min(maxForward,
      localZ+Math.min(.43,dimensions.z*.12)));
    return new Vector3(vehicle.x+c*localX+si*forward,y,
      vehicle.z-si*localX+c*forward);
  };
  return {leftFoot:target(leftHip),rightFoot:target(rightHip),
    minFootwellY:y};
}

/** One bounded update of a measured *skinned shoe* visual contact target.
 * This is not a floor claim: the Range Rover has no verified footwell
 * triangle mesh. Correct only a proven below-target sole; no car/actor lifts.
 */
export function planRangeRoverSoleLift(args:{
  soleY:number;anchorY:number;bodyHeight:number;appliedLift:number;
}):number{
  const {soleY,anchorY,bodyHeight,appliedLift}=args;
  if(![soleY,anchorY,bodyHeight,appliedLift].every(Number.isFinite)||
    bodyHeight<=0||appliedLift<0)return 0;
  const provisionalMin=anchorY+bodyHeight*.43+.025;
  return Math.max(0,Math.min(.075,.46-appliedLift,provisionalMin-soleY));
}

/** Source GLB audit on the actual 24,349,788-byte owner asset:
 * 7 glTF nodes, including exactly four independently movable meshes
 * "FL Wheel", "FR Wheel", "BL Wheel", "BR Wheel". Their axle is GLB local Z;
 * the imported model's chassis axis is X, unlike Ferrari's Z orientation.
 * Do not infer corner labels from generic world X/Z signs after the
 * source-specific modelRoot rotation. Never rotate brake discs or Body.
 */
/** Four distinct, SOURCE wheel meshes are verified before creating pivots.
 * Source tire geometry is never manufactured or substituted. A GLB mesh may
 * have hub-centred geometry but an origin at (0,0,0) or at the chassis; the
 * generic rig legitimately rejects that offset node. Reparent the authentic
 * wheel mesh under a new hub-centred TransformNode, preserving its world pose.
 * The existing Ferrari/Buggy rig then provides all wheel roll and steer.
 */
export const RANGE_ROVER_HUB_PIVOTS={
  frontLeft:"veh007-hub-front-left",
  frontRight:"veh007-hub-front-right",
  rearLeft:"veh007-hub-rear-left",
  rearRight:"veh007-hub-rear-right",
} as const;

export function prepareRangeRoverWheelRig(anchor:TransformNode):RangeRoverWheelEvidence{
  anchor.computeWorldMatrix(true);
  const corners=["frontLeft","frontRight","rearLeft","rearRight"] as const;
  const candidates=anchor.getChildMeshes(false).filter(m=>m.getTotalVertices()>0);
  const found=corners.map(corner=>{
    const wanted=RANGE_ROVER_SOURCE_WHEEL_NAMES[corner].toLowerCase();
    const match=candidates.filter(mesh=>
      mesh.name.split(":").pop()?.trim().toLowerCase()===wanted);
    return match.length===1?match[0]!:null;
  });
  const missing=corners.filter((_,i)=>!found[i]);
  if(missing.length){
    const wheelNames:Record<WheelCorner,string>={...unmapped};
    return {mapping:{wheelNames,spinAxis:"z",steerAxis:"y",
      steeringSign:1,fallbackRadiusMetres:.38},
      identified:corners.length-missing.length,missing};
  }
  // Validate all genuine wheels before modifying a single hierarchy.
  const centers=found.map(node=>{
    node!.computeWorldMatrix(true);
    const box=node!.getBoundingInfo().boundingBox;
    const size=box.maximumWorld.subtract(box.minimumWorld);
    const sorted=[size.x,size.y,size.z].sort((a,b)=>a-b);
    if(!sorted.every(Number.isFinite)||sorted[1]!<.38||
      sorted[1]!>1.65)return null;
    return box.centerWorld.clone();
  });
  if(centers.some(x=>x===null)){
    return {mapping:{wheelNames:{...unmapped},spinAxis:"z",steerAxis:"y",
      steeringSign:1,fallbackRadiusMetres:.38},
      identified:centers.filter(Boolean).length,
      missing:corners.filter((_,i)=>!centers[i])};
  }
  // One transaction: existing mesh geometry, material, world position and
  // axle orientation remain identical before wheel animation begins.
  const pivots:TransformNode[]=[];
  try{
    for(let i=0;i<corners.length;i++){
      const mesh=found[i]!,parent=mesh.parent;
      if(!(parent instanceof TransformNode))
        throw Error("VEH007 wheel mesh has no transform parent");
      parent.computeWorldMatrix(true);
      const pivot=new TransformNode(RANGE_ROVER_HUB_PIVOTS[corners[i]!],anchor.getScene());
      pivot.parent=parent;
      const inv=parent.getWorldMatrix().clone().invert();
      pivot.position.copyFrom(Vector3.TransformCoordinates(centers[i]!,inv));
      pivot.computeWorldMatrix(true);
      mesh.setParent(pivot); // Babylon retains exact pre-parent world matrix.
      pivots.push(pivot);
    }
  }catch(error){
    // Never leave a partially reparented wheel hierarchy after rejection.
    for(const pivot of pivots.reverse()){
      for(const child of pivot.getChildren())child.parent=pivot.parent;
      pivot.dispose();
    }
    throw error;
  }
  return {mapping:{wheelNames:{...RANGE_ROVER_HUB_PIVOTS},
    // GLB car longitudinal X and tire axle Z: pivot inherits source parent
    // frame, rather than Meridian's rotated east-west chassis frame.
    spinAxis:"z",steerAxis:"y",steeringSign:1,
    fallbackRadiusMetres:.38},
    identified:4,missing:[]};
}

export const RANGE_ROVER_SOURCE_WHEEL_NAMES={
  frontLeft:"FL Wheel",frontRight:"FR Wheel",
  rearLeft:"BL Wheel",rearRight:"BR Wheel",
} as const;
const unmapped={
  frontLeft:"veh007-unverified-front-left",
  frontRight:"veh007-unverified-front-right",
  rearLeft:"veh007-unverified-rear-left",
  rearRight:"veh007-unverified-rear-right",
} as const;
export type RangeRoverWheelEvidence={
  readonly mapping:StreetVehicleWheelMapping;
  readonly identified:number;
  readonly missing:readonly string[];
};
/** Name-based mapping proven against the source binary, plus centre and
 * uniqueness checks on the instantiated in-world geometry. */
export function discoverRangeRoverWheelMapping(anchor:TransformNode):RangeRoverWheelEvidence{
  const candidates=anchor.getDescendants(false).filter(
    (node):node is AbstractMesh=>node instanceof AbstractMesh &&
      node.getTotalVertices()>0);
  const names:Record<WheelCorner,string>={...unmapped};
  let identified=0;
  const used=new Set<TransformNode>();
  for(const corner of ["frontLeft","frontRight","rearLeft","rearRight"] as const){
    const expected=RANGE_ROVER_SOURCE_WHEEL_NAMES[corner].toLowerCase();
    const matching=candidates.filter(node=>
      node.name.split(":").pop()?.trim().toLowerCase()===expected);
    if(matching.length!==1 || used.has(matching[0]!))continue;
    const node=matching[0]!;
    node.computeWorldMatrix(true);
    const meshes=[node,...node.getChildMeshes(false)].filter(mesh=>
      mesh.getTotalVertices()>0);
    const bounds=meshes.map(mesh=>{
      mesh.computeWorldMatrix(true);
      return mesh.getBoundingInfo().boundingBox;
    });
    const min=new Vector3(Infinity,Infinity,Infinity);
    const max=new Vector3(-Infinity,-Infinity,-Infinity);
    for(const b of bounds){
      min.minimizeInPlace(b.minimumWorld);
      max.maximizeInPlace(b.maximumWorld);
    }
    const center=Vector3.Center(min,max);
    // The GLB wheel nodes are hub-centered. A false match to a chassis or
    // combined car mesh must fail closed, never spin a whole vehicle.
    if(Vector3.Distance(center,node.getAbsolutePosition())>.28)continue;
    const sizes=max.subtract(min);
    const sorted=[sizes.x,sizes.y,sizes.z].sort((a,b)=>a-b);
    // Accept real small wheels and reject implausibly huge/body-like geometry.
    if(!sorted.every(Number.isFinite) || sorted[1]!<.38 ||
      sorted[1]!>1.65)continue;
    used.add(node);names[corner]=RANGE_ROVER_SOURCE_WHEEL_NAMES[corner];identified++;
  }
  return {mapping:{
    wheelNames:identified===4?names:{...unmapped},
    // The source GLB's car length is local X; wheel axles run along local Z.
    spinAxis:"z",steerAxis:"y",
    steeringSign:1,fallbackRadiusMetres:.38,
  },identified,missing:(Object.keys(names) as (keyof typeof names)[])
    .filter(corner=>names[corner]===unmapped[corner])};
}
