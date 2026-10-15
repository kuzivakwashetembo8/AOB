import { AbstractMesh, Scene, Vector3 } from "@babylonjs/core";

/** AR1-4/5: Identify the actual rendered surface beneath each tire, not a
 * generic ground ray. A missing visual witness is UNKNOWN, never a road.
 * On-demand stage/diagnostic query; consumer caches no disposed mesh pointers.
 */
export type RoadContactSurface={
  name:string; kind:"asphalt"|"sidewalk"; y:number;normal:Vector3;
  source:"authored-box"|"triangulated-surface";
};
const inside=(x:number,z:number,a:Vector3,b:Vector3,c:Vector3)=>{
  const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  if(Math.abs(den)<1e-10)return null;
  const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den;
  const v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;
  const w=1-u-v;
  if(Math.min(u,v,w)<-1e-5)return null;
  const cross=Vector3.Cross(b.subtract(a),c.subtract(a));
  if(cross.lengthSquared()<1e-9)return null;
  return {y:a.y*u+b.y*v+c.y*w,normal:cross.normalize()};
};
function classify(mesh:AbstractMesh):"asphalt"|"sidewalk"|null{
  if(mesh.name.startsWith("generated-parity-")&&
      (mesh.name.endsWith("-road") || mesh.material?.name==="generated-asphalt"))
    return "asphalt";
  if(mesh.name.startsWith("generated-parity-") &&
      mesh.material?.name==="generated-sidewalk")return "sidewalk";
  if(mesh.name.startsWith("generated-asphalt:") ||
      mesh.name.startsWith("generated-asphalt-repair:"))return "asphalt";
  return null;
}
export function sampleRenderedVehicleSurface(
  scene:Scene,x:number,z:number,
):RoadContactSurface|null{
  if(!Number.isFinite(x)||!Number.isFinite(z))return null;
  let best:RoadContactSurface|null=null;
  for(const mesh of scene.meshes){
    const kind=classify(mesh);
    if(!kind||!mesh.isEnabled()||!mesh.isVisible||mesh.visibility<=0)continue;
    mesh.computeWorldMatrix(true);
    const bounds=mesh.getBoundingInfo().boundingBox;
    if(x<bounds.minimumWorld.x-0.001||x>bounds.maximumWorld.x+0.001||
       z<bounds.minimumWorld.z-0.001||z>bounds.maximumWorld.z+0.001)continue;
    if(mesh.name.startsWith("generated-parity-")){
      const candidate:RoadContactSurface={
        name:mesh.name,kind,y:bounds.maximumWorld.y,
        normal:Vector3.Up(),source:"authored-box",
      };
      if(!best||candidate.y>best.y)best=candidate;
      continue;
    }
    // Polygons: AABB containment alone is invalid. Project actual triangles
    // into the road XZ plane and barycentrically sample their rendered Y.
    const raw=mesh.getVerticesData("position");
    const indices=mesh.getIndices();
    if(!raw||!indices)continue;
    const world=mesh.getWorldMatrix();
    for(let j=0;j<indices.length-2;j+=3){
      const ids=[indices[j]!,indices[j+1]!,indices[j+2]!];
      if(ids.some(id=>id*3+2>=raw.length))continue;
      const verts=ids.map(id=>Vector3.TransformCoordinates(
        new Vector3(raw[id*3]!,raw[id*3+1]!,raw[id*3+2]!),world));
      const hit=inside(x,z,verts[0]!,verts[1]!,verts[2]!);
      if(hit&&(best===null||hit.y>best.y))best={
        name:mesh.name,kind,y:hit.y,normal:hit.normal,
        source:"triangulated-surface",
      };
    }
  }
  return best;
}
