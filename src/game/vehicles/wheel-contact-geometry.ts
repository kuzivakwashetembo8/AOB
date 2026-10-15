import { AbstractMesh, TransformNode, Vector3 } from "@babylonjs/core";

/** AR1-4: spin-independent cylindrical tire support, in wheel-pivot space.
 * This is an explicitly approximate round tire envelope, NOT wheel AABB.minY.
 * Measure its radial shape from imported VERTICES, never bbox corners.
 */
export type TireAxle = "x"|"y"|"z";
export type TireContactProfile={
  radius:number;
  halfWidth:number;
  center:Vector3;
  source:"tire-mesh"|"largest-radial-candidate";
  vertexCount:number;
  confidence:"verified-shape"|"unverified-mesh";
};
const basis=(axis:TireAxle)=>axis==="x"?{
  a:new Vector3(1,0,0),u:new Vector3(0,1,0),v:new Vector3(0,0,1),
}:axis==="y"?{
  a:new Vector3(0,1,0),u:new Vector3(1,0,0),v:new Vector3(0,0,1),
}:{
  a:new Vector3(0,0,1),u:new Vector3(1,0,0),v:new Vector3(0,1,0),
};
type Candidate={mesh:AbstractMesh; points:Vector3[];radius:number;
  width:number; center:Vector3;isTire:boolean};
export function buildTireContactProfile(
  pivot:TransformNode,meshes:readonly AbstractMesh[], axle:TireAxle,
):TireContactProfile|null{
  if(!meshes.length)return null;
  pivot.computeWorldMatrix(true);
  const inverse=pivot.getWorldMatrix().clone().invert();
  const {a,u,v}=basis(axle);
  const candidates:Candidate[]=[];
  for(const mesh of meshes){
    const data=mesh.getVerticesData("position");
    if(!data||data.length<24)continue;
    mesh.computeWorldMatrix(true);
    const toPivot=mesh.getWorldMatrix().multiply(inverse);
    const points:Vector3[]=[];
    let minA=Infinity,maxA=-Infinity,minU=Infinity,maxU=-Infinity,minV=Infinity,maxV=-Infinity;
    for(let j=0;j<data.length-2;j+=3){
      const point=Vector3.TransformCoordinates(
        new Vector3(data[j]!,data[j+1]!,data[j+2]!),toPivot);
      if(![point.x,point.y,point.z].every(Number.isFinite))continue;
      const ia=Vector3.Dot(point,a),iu=Vector3.Dot(point,u),iv=Vector3.Dot(point,v);
      minA=Math.min(minA,ia);maxA=Math.max(maxA,ia);
      minU=Math.min(minU,iu);maxU=Math.max(maxU,iu);
      minV=Math.min(minV,iv);maxV=Math.max(maxV,iv);
      points.push(point);
    }
    if(points.length<8)continue;
    const midA=(minA+maxA)*0.5,midU=(minU+maxU)*0.5,midV=(minV+maxV)*0.5;
    const center=a.scale(midA).add(u.scale(midU)).add(v.scale(midV));
    let radius=0;
    for(const p of points){
      const delta=p.subtract(center);
      radius=Math.max(radius,Math.hypot(Vector3.Dot(delta,u),Vector3.Dot(delta,v)));
    }
    if(radius<0.10||radius>1.2)continue;
    const isTire=/tire|tyre|rubber|pneu/i.test(
      mesh.name+" "+(mesh.material?.name??""));
    candidates.push({mesh,points,radius,width:maxA-minA,center,isTire});
  }
  if(!candidates.length)return null;
  const named=candidates.filter(x=>x.isTire);
  // One tire's explicit rubber mesh is authoritative. Without a name, this
  // is a candidate whose confidence remains "unverified-mesh" in telemetry.
  const candidate=(named.length?named:candidates).sort((a,b)=>b.radius-a.radius)[0]!;
  if(candidate.width>candidate.radius*1.6 || candidate.radius<0.13)
    return null;
  return {radius:candidate.radius,halfWidth:candidate.width*0.5,
    center:candidate.center.clone(),source:candidate.isTire?"tire-mesh":"largest-radial-candidate",
    confidence:candidate.isTire?"verified-shape":"unverified-mesh",
    vertexCount:candidate.points.length};
}
/** Exact support of a cylinder with radius r and halfWidth h under a linear
 * transform, independent of spin about its axle. Works for reflected and
 * nonuniform scales; not an exact irregular/flattened rubber tire.
 */
export function tireContactBottomY(
  wheelWorld:import("@babylonjs/core").Matrix,
  profile:TireContactProfile,axle:TireAxle,
):number|null {
  if(!Number.isFinite(profile.radius)||profile.radius<=0 ||
    !Number.isFinite(profile.halfWidth)||profile.halfWidth<0)return null;
  const {a,u,v}=basis(axle);
  const center=Vector3.TransformCoordinates(profile.center,wheelWorld);
  const U=Vector3.TransformNormal(u,wheelWorld).y;
  const V=Vector3.TransformNormal(v,wheelWorld).y;
  const A=Vector3.TransformNormal(a,wheelWorld).y;
  const bottom=center.y-profile.radius*Math.hypot(U,V)-
    profile.halfWidth*Math.abs(A);
  return Number.isFinite(bottom)?bottom:null;
}
