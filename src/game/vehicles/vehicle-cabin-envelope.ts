/** VEH-CABIN-FIT-003 — explicit, specimen-specific cockpit boundaries.
 * Do not turn a vehicle's exterior bounding box into an assumed cabin floor.
 * The Ferrari GLB supplies an actual Carpet mesh. The Buggy is deliberately
 * uncalibrated until a corresponding source-surface witness is verified.
 */
import { AbstractMesh, Matrix, TransformNode, Vector3 } from "@babylonjs/core";

export type VehicleCabinKind = "ferrari" | "buggy" | "unknown";
export type CabinEvidence =
  | "verified-floor-mesh" | "missing-floor-mesh" | "outside-floor-footprint"
  | "invalid-floor-geometry" | "uncalibrated-vehicle";
export interface VehicleCabinDefinition {
  readonly kind: VehicleCabinKind;
  readonly floorMeshSuffix: string | null;
  readonly floorMaterial: string | null;
  /** Bounds on height variation within one genuine imported floor surface. */
  readonly maxFloorReliefMetres: number;
  readonly clearanceMetres: number;
  readonly maxSoleLiftMetres: number;
}
export const FERRARI_CABIN_003:VehicleCabinDefinition=Object.freeze({
  kind:"ferrari",floorMeshSuffix:"carpet",floorMaterial:"Carpet",
  maxFloorReliefMetres:0.28,clearanceMetres:0.010,maxSoleLiftMetres:0.080,
});
export const BUGGY_CABIN_PENDING:VehicleCabinDefinition=Object.freeze({
  kind:"buggy",floorMeshSuffix:null,floorMaterial:null,
  maxFloorReliefMetres:0.28,clearanceMetres:0.010,maxSoleLiftMetres:0.080,
});
const definition=(kind:VehicleCabinKind):VehicleCabinDefinition=>
  kind==="ferrari"?FERRARI_CABIN_003:kind==="buggy"?BUGGY_CABIN_PENDING:
  {kind:"unknown",floorMeshSuffix:null,floorMaterial:null,
   maxFloorReliefMetres:0.28,clearanceMetres:0.010,maxSoleLiftMetres:0.080};

type Triangle={a:Vector3;b:Vector3;c:Vector3};
type Sample={evidence:CabinEvidence;floorY:number|null;surface:string|null};
function interpolateXZ(x:number,z:number,t:Triangle):number|null{
  const {a,b,c}=t;
  const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  if(Math.abs(den)<1e-9)return null;
  const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den;
  const v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;
  const w=1-u-v;
  if(Math.min(u,v,w)<-0.00001)return null;
  return a.y*u+b.y*v+c.y*w;
}
/** A local-space, immutable floor map; vehicle motion only changes its world matrix. */
export class VehicleCabinFloor {
  readonly kind:VehicleCabinKind;
  readonly meshName:string|null;
  readonly evidence:CabinEvidence;
  readonly definition:VehicleCabinDefinition;
  private readonly polygons:Triangle[];
  private readonly floorMinimum:number;
  private constructor(private readonly anchor:TransformNode,
    def:VehicleCabinDefinition, meshName:string|null,
    evidence:CabinEvidence,polygons:Triangle[],floorMinimum:number) {
    this.kind=def.kind;this.definition=def;this.meshName=meshName;
    this.evidence=evidence;this.polygons=polygons;this.floorMinimum=floorMinimum;
  }
  static fromVehicle(anchor:TransformNode,kind:VehicleCabinKind):VehicleCabinFloor{
    const def=definition(kind);
    if(!def.floorMeshSuffix||!def.floorMaterial)
      return new VehicleCabinFloor(anchor,def,null,"uncalibrated-vehicle",[],NaN);
    const candidates=anchor.getChildMeshes(false).filter(m=>
      m.getTotalVertices()>0 &&
      m.name.split(":").pop()?.toLowerCase()===def.floorMeshSuffix!.toLowerCase() &&
      m.material?.name===def.floorMaterial);
    if(candidates.length!==1)
      return new VehicleCabinFloor(anchor,def,null,"missing-floor-mesh",[],NaN);
    const mesh=candidates[0]!;
    return VehicleCabinFloor.fromMesh(anchor,mesh,def);
  }
  /** Public for deterministic geometry fixtures of future vehicles. */
  static fromMesh(anchor:TransformNode,mesh:AbstractMesh,
    def:VehicleCabinDefinition):VehicleCabinFloor {
    const raw=mesh.getVerticesData("position"),indices=mesh.getIndices();
    if(!raw||!indices||indices.length<3)
      return new VehicleCabinFloor(anchor,def,mesh.name,"invalid-floor-geometry",[],NaN);
    anchor.computeWorldMatrix(true);mesh.computeWorldMatrix(true);
    const meshToCar=mesh.getWorldMatrix().multiply(
      anchor.getWorldMatrix().clone().invert());
    const polygons:Triangle[]=[];
    let low=Infinity;
    for(let i=0;i<indices.length-2;i+=3) {
      const xyz=[] as Vector3[];
      for(const k of [0,1,2]){
        const n=indices[i+k]!*3;
        if(n+2>=raw.length){xyz.length=0;break;}
        xyz.push(Vector3.TransformCoordinates(
          new Vector3(raw[n]!,raw[n+1]!,raw[n+2]!),meshToCar));
      }
      if(xyz.length!==3)continue;
      const [a,b,c]=xyz;
      const cross=Vector3.Cross(b!.subtract(a!),c!.subtract(a!));
      const len=cross.length();
      if(len<1e-9||Math.abs(cross.y)/len<0.65)continue;
      if(![a!,b!,c!].every(v=>[v.x,v.y,v.z].every(Number.isFinite)))continue;
      polygons.push({a:a!,b:b!,c:c!});
      low=Math.min(low,a!.y,b!.y,c!.y);
    }
    return new VehicleCabinFloor(anchor,def,mesh.name,
      polygons.length?"verified-floor-mesh":"invalid-floor-geometry",
      polygons,low);
  }
  sample(world:Vector3):Sample{
    if(this.evidence!=="verified-floor-mesh")
      return {evidence:this.evidence,floorY:null,surface:this.meshName};
    this.anchor.computeWorldMatrix(true);
    const matrix=this.anchor.getWorldMatrix();
    const local=Vector3.TransformCoordinates(world,matrix.clone().invert());
    let localFloor=Infinity;
    for(const poly of this.polygons){
      const y=interpolateXZ(local.x,local.z,poly);
      if(y!==null&&y>=this.floorMinimum-0.01&&
         y<=this.floorMinimum+this.definition.maxFloorReliefMetres)
        localFloor=Math.min(localFloor,y);
    }
    if(!Number.isFinite(localFloor))
      return {evidence:"outside-floor-footprint",floorY:null,surface:this.meshName};
    const projected=Vector3.TransformCoordinates(
      new Vector3(local.x,localFloor,local.z),matrix);
    return Number.isFinite(projected.y)?
      {evidence:"verified-floor-mesh",floorY:projected.y,surface:this.meshName}:
      {evidence:"invalid-floor-geometry",floorY:null,surface:this.meshName};
  }
  status(){return {kind:this.kind,evidence:this.evidence,
    floorMesh:this.meshName,triangleCount:this.polygons.length,
    clearanceMetres:this.definition.clearanceMetres,
    maxSoleLiftMetres:this.definition.maxSoleLiftMetres};}
}
