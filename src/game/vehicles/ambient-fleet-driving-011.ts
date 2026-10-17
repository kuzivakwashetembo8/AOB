/**
 * VEH-011 — generic author-GLB driving adapter.
 *
 * Four real, independently transformable tire/wheel meshes are required
 * before wheel animation is enabled. A combined body/wheel mesh (including
 * the inspected single-mesh Defender 001) remains untouched: the vehicle
 * can drive using Rapier but wheel-rig availability is reported as false.
 * Never fabricate cylinders, detach unverified geometry, or silently spin
 * the entire body to simulate wheel motion.
 */
import {AbstractMesh,TransformNode,Vector3} from "@babylonjs/core";
import {FERRARI_STREET_PROFILE,type StreetVehiclePhysicsProfile} from "./street-vehicle-physics";
import type {StreetVehicleWheelMapping,WheelCorner} from "./street-vehicle-wheels";
export type FiveModelName="Ferrari"|"Range Rover"|"Toyota Hilux"|"Land Rover Defender"|"Dodge HP";
export type ExtraDriveName=Exclude<FiveModelName,"Ferrari"|"Range Rover">;

const reviewClasses:Record<ExtraDriveName,{id:string;wheelRadius:number}>={
  "Toyota Hilux":{id:"toyota-hilux-002",wheelRadius:.39},
  "Land Rover Defender":{id:"land-rover-defender-001",wheelRadius:.40},
  "Dodge HP":{id:"dodge-hp",wheelRadius:.37},
};
export function extraDriveName(sourceId:string):ExtraDriveName|null{
  if(sourceId==="gtd-veh008-mercer-toyota-hilux")return "Toyota Hilux";
  if(sourceId==="gtd-veh009-mercer-land-rover-defender")return "Land Rover Defender";
  if(sourceId==="gtd-veh010-mercer-dodge-hp")return "Dodge HP";
  return null;
}
export function extraDriveProfile(name:ExtraDriveName):StreetVehiclePhysicsProfile{
  const cls=reviewClasses[name];
  return {...FERRARI_STREET_PROFILE,classId:cls.id,
    forwardAxisSign:1,wheelRadiusFallbackMetres:cls.wheelRadius};
}
const corners=["frontLeft","frontRight","rearLeft","rearRight"] as const;
const EMPTY:Record<WheelCorner,string>={
  frontLeft:"veh011-missing-front-left",frontRight:"veh011-missing-front-right",
  rearLeft:"veh011-missing-rear-left",rearRight:"veh011-missing-rear-right",
};
// Accept ordinary authoring labels such as Wheel_01, Wheel001, Tire.FR;
 // ambiguous labels still require measured geometry and four unique corners.
const approvedWheelName=/(?:^|[^a-z])(?:wheel|tyre|tire)(?:[\s_.-]*\d+)?(?:[^a-z]|$)/i;
const exclusions=/(?:arch|fender|brake|caliper|steer(?:ing)?wheel|axle|hubcap)/i;
interface Candidate{
 mesh:AbstractMesh;
 center:Vector3;
 local:Vector3;
}
export interface NativeWheelEvidence{
 readonly identified:number;
 readonly missing:readonly WheelCorner[];
 readonly mapping:StreetVehicleWheelMapping;
 readonly sourceMeshCount:number;
 readonly description:string;
}
function unavailable(name:ExtraDriveName,identified=0,count=0):NativeWheelEvidence{
  return {
    identified,missing:[...corners],sourceMeshCount:count,
    mapping:{wheelNames:{...EMPTY},spinAxis:"x",steerAxis:"y",
      steeringMode:"world-yaw",steeringSign:-1,
      fallbackRadiusMetres:reviewClasses[name].wheelRadius},
    description:"Four independent, identifiable original tire meshes are required",
  };
}
/** Source wheel discovery is intentionally conservative: a complete car
 * silhouette in one mesh is never subdivided on speculative vertex indices.
 * Mutations occur only after all four original geometry candidates pass. */
export function prepareNativeFleetWheelRig(
 anchor:TransformNode,name:ExtraDriveName,
):NativeWheelEvidence{
  // MVRS-1: actual original wheel surface islands may be separated OFFLINE
  // during build into source-backed glTF wheel-pivot nodes. Their geometry
  // and source materials remain from the supplied original GLB.
  const expected={
    frontLeft:"MVRS_"+reviewClasses[name].id+"_frontLeft_PIVOT",
    frontRight:"MVRS_"+reviewClasses[name].id+"_frontRight_PIVOT",
    rearLeft:"MVRS_"+reviewClasses[name].id+"_rearLeft_PIVOT",
    rearRight:"MVRS_"+reviewClasses[name].id+"_rearRight_PIVOT",
  };
  const allNodes=anchor.getDescendants(false);
  const matched=corners.map(corner=>allNodes.find(node=>
    node instanceof TransformNode &&
    (node.name===expected[corner]||
     node.name.endsWith(":"+expected[corner]))));
  if(matched.every((node):node is TransformNode=>
    node instanceof TransformNode &&
    node.getChildMeshes(false).some(mesh=>mesh.getTotalVertices()>40))){
    return {
      identified:4,missing:[],sourceMeshCount:anchor.getChildMeshes(false).length,
      mapping:{wheelNames:expected,spinAxis:"x",steerAxis:"y",
        steeringMode:"world-yaw",steeringSign:-1,
        fallbackRadiusMetres:reviewClasses[name].wheelRadius},
      description:"Four build-time separated original tire/rim assemblies with measured source pivots",
    };
  }
  anchor.computeWorldMatrix(true);
  const inverse=anchor.getWorldMatrix().clone().invert();
  const meshes=anchor.getChildMeshes(false)
    .filter(m=>m.getTotalVertices()>0);
  const candidates:Candidate[]=[];
  for(const mesh of meshes){
    const sourceName=mesh.name.split(":").pop()??mesh.name;
    if(!approvedWheelName.test(sourceName)||exclusions.test(sourceName))continue;
    mesh.computeWorldMatrix(true);
    const bounds=mesh.getBoundingInfo().boundingBox;
    const dimensions=bounds.maximumWorld.subtract(bounds.minimumWorld);
    const ordered=[dimensions.x,dimensions.y,dimensions.z].sort((a,b)=>a-b);
    if(!ordered.every(Number.isFinite)||ordered[1]!<.25||ordered[1]!>1.65)continue;
    const center=bounds.centerWorld.clone();
    const local=Vector3.TransformCoordinates(center,inverse);
    if(![local.x,local.y,local.z].every(Number.isFinite))continue;
    if(Math.abs(local.x)<.12||Math.abs(local.z)<.3)continue;
    candidates.push({mesh,center,local});
  }
  // At most one original tire mesh per corner. Never select arbitrary parts
  // when there are duplicate inner/outer tire meshes or ambiguous metadata.
  const found=new Map<WheelCorner,Candidate>();
  for(const candidate of candidates){
    const front=candidate.local.z>0,left=candidate.local.x>0;
    const corner:WheelCorner=front
      ?left?"frontLeft":"frontRight"
      :left?"rearLeft":"rearRight";
    if(found.has(corner))return unavailable(name,0,meshes.length);
    found.set(corner,candidate);
  }
  if(found.size!==4)return unavailable(name,found.size,meshes.length);
  const all=corners.map(c=>found.get(c)!);
  const wheelbase=all[0]!.local.z-all[2]!.local.z;
  const track=Math.abs(all[0]!.local.x-all[1]!.local.x);
  if(wheelbase<.7||track<.55)return unavailable(name,0,meshes.length);

  // All candidate wheels must have compatible parent orientation. The spin
  // axis is source-local, resolved from the chassis transverse direction.
  const axes:("x"|"y"|"z")[]=[];
  for(const wheel of all){
    const parent=wheel.mesh.parent;
    if(!(parent instanceof TransformNode))return unavailable(name,0,meshes.length);
    parent.computeWorldMatrix(true);
    const lateral=Vector3.TransformNormal(
      Vector3.TransformNormal(Vector3.Right(),anchor.getWorldMatrix()),
      parent.getWorldMatrix().clone().invert(),
    ).normalize();
    const components=[Math.abs(lateral.x),Math.abs(lateral.y),Math.abs(lateral.z)];
    const max=Math.max(...components);
    if(max<.82)return unavailable(name,0,meshes.length);
    axes.push((["x","y","z"] as const)[components.indexOf(max)]!);
  }
  if(axes.some(a=>a!==axes[0]))return unavailable(name,0,meshes.length);
  // Preserve exact wheel geometry and world transform while changing the
  // hierarchical parent. A new real pivot is placed at the measured hub.
  const pivots:TransformNode[]=[];
  try{
    for(let i=0;i<corners.length;i++){
      const w=all[i]!,parent=w.mesh.parent as TransformNode;
      const pivot=new TransformNode("veh011-hub-"+name.replace(/\W+/g,"-")+"-"+corners[i],
        anchor.getScene());
      pivot.parent=parent;
      pivot.position.copyFrom(Vector3.TransformCoordinates(
        w.center,parent.getWorldMatrix().clone().invert()));
      pivot.computeWorldMatrix(true);
      w.mesh.setParent(pivot);
      pivots.push(pivot);
    }
  }catch(error){
    for(const pivot of pivots.reverse()){
      for(const child of pivot.getChildren())child.parent=pivot.parent;
      pivot.dispose();
    }
    throw error;
  }
  const wheelNames={
    frontLeft:pivots[0]!.name,frontRight:pivots[1]!.name,
    rearLeft:pivots[2]!.name,rearRight:pivots[3]!.name,
  };
  return {
    identified:4,missing:[],sourceMeshCount:meshes.length,
    mapping:{wheelNames,spinAxis:axes[0]!,steerAxis:"y",
      steeringMode:"world-yaw",steeringSign:-1,
      fallbackRadiusMetres:reviewClasses[name].wheelRadius},
    description:"Four distinct source wheel meshes reparented around measured original hubs",
  };
}
