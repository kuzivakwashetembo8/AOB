/**
 * VEH-012: non-procedural wheel separation for a genuine single-mesh GLB.
 *
 * Babylon has already decoded the owner's Draco geometry. This adapter does
 * NOT make replacement wheels. It isolates FOUR validated, disconnected tire
 * surface islands and reparents the original triangles around actual hubs.
 *
 * A wheel welded to body geometry, an ambiguous silhouette, a non-wheel
 * component, a skinned/instanced model, or incomplete quadrants FAILS CLOSED.
 * It never assigns arbitrary body triangles to a rolling pivot.
 */
import { AbstractMesh, Matrix, Mesh, TransformNode, Vector3, VertexBuffer } from "@babylonjs/core";
import type {WheelCorner,StreetVehicleWheelMapping} from "./street-vehicle-wheels";

const CORNERS=["frontLeft","frontRight","rearLeft","rearRight"] as const;
type Corner=(typeof CORNERS)[number];
interface Point{x:number;y:number;z:number}
interface Island{
  root:number;
  triangles:number[];
  vertexSet:Set<number>;
  center:Point;
  min:Point;max:Point;
  sourceCenter:Point;
}
export interface SplitWheelEvidence{
  identified:number;
  sourceMeshCount:number;
  separatedTriangles:number;
  reason:string;
  mapping:StreetVehicleWheelMapping|null;
}
const failure=(reason:string,count:number):SplitWheelEvidence=>({
  identified:0,sourceMeshCount:count,separatedTriangles:0,
  reason,mapping:null,
});
const bounds=()=>({
  min:{x:Infinity,y:Infinity,z:Infinity},
  max:{x:-Infinity,y:-Infinity,z:-Infinity},
});
function expand(b:{min:Point;max:Point},p:Point){
  b.min.x=Math.min(b.min.x,p.x);b.min.y=Math.min(b.min.y,p.y);
  b.min.z=Math.min(b.min.z,p.z);
  b.max.x=Math.max(b.max.x,p.x);b.max.y=Math.max(b.max.y,p.y);
  b.max.z=Math.max(b.max.z,p.z);
}
function center(b:{min:Point;max:Point}):Point{
  return {x:(b.min.x+b.max.x)/2,y:(b.min.y+b.max.y)/2,
    z:(b.min.z+b.max.z)/2};
}
function size(b:{min:Point;max:Point}):Point{
  return {x:b.max.x-b.min.x,y:b.max.y-b.min.y,z:b.max.z-b.min.z};
}
const distance=(a:number,b:number)=>Math.abs(a-b);
const maxDiff=(values:readonly number[])=>Math.max(...values)-Math.min(...values);
const rounded=(n:number)=>Math.round(n*1000)/1000;
function wheelCorner(p:Point):Corner{
  const front=p.z>0,left=p.x>0;
  return front?(left?"frontLeft":"frontRight"):(left?"rearLeft":"rearRight");
}
/** Source data must be ordinary static triangle geometry. No deformed meshes. */
function supportedAttributes(mesh:Mesh,vertexCount:number):
  {kind:string;stride:number;values:Float32Array}[]|null{
  if(mesh.skeleton||mesh.morphTargetManager)return null;
  const allowed=new Set<string>([
    VertexBuffer.PositionKind,VertexBuffer.NormalKind,VertexBuffer.UVKind,
    VertexBuffer.UV2Kind,VertexBuffer.ColorKind,VertexBuffer.TangentKind,
  ]);
  const kinds=mesh.getVerticesDataKinds();
  if(kinds.some(k=>!allowed.has(k)))return null;
  const result:{kind:string;stride:number;values:Float32Array}[]=[];
  for(const kind of kinds){
    const data=mesh.getVerticesData(kind);
    const stride=mesh.getVertexBuffer(kind)?.getSize();
    if(!data||!stride||data.length!==vertexCount*stride)return null;
    result.push({kind,stride,values:Float32Array.from(data)});
  }
  if(!result.some(x=>x.kind===VertexBuffer.PositionKind))return null;
  return result;
}
function createWheelMesh(
 source:Mesh,pivot:TransformNode,corner:Corner,
 attributeData:readonly {kind:string;stride:number;values:Float32Array}[],
 triangles:readonly number[],
 centerLocal:Point,
):Mesh{
  const remap=new Map<number,number>();
  const indices:number[]=[];
  const streams=attributeData.map(a=>({kind:a.kind,stride:a.stride,values:[] as number[]}));
  for(const oldIndex of triangles){
    let dest=remap.get(oldIndex);
    if(dest===undefined){
      dest=remap.size;
      remap.set(oldIndex,dest);
      for(let s=0;s<attributeData.length;s++){
        const attr=attributeData[s]!,target=streams[s]!;
        for(let i=0;i<attr.stride;i++){
          let v=attr.values[oldIndex*attr.stride+i]!;
          if(attr.kind===VertexBuffer.PositionKind){
            if(i===0)v-=centerLocal.x;
            if(i===1)v-=centerLocal.y;
            if(i===2)v-=centerLocal.z;
          }
          target.values.push(v);
        }
      }
    }
    indices.push(dest);
  }
  const wheel=new Mesh("veh012-real-wheel-"+corner,source.getScene());
  for(const stream of streams)wheel.setVerticesData(stream.kind,stream.values,false,stream.stride);
  wheel.setIndices(indices,null,false);
  wheel.material=source.material;
  wheel.visibility=source.visibility;
  wheel.isVisible=source.isVisible;
  wheel.isPickable=false;
  wheel.receiveShadows=source.receiveShadows;
  wheel.alwaysSelectAsActiveMesh=source.alwaysSelectAsActiveMesh;
  wheel.parent=pivot;
  return wheel;
}
/**
 * Triangular connectivity is based on source vertex indices (not world-space
 * slicing). Connected chassis/fenders cannot be separated accidentally.
 */
export function splitOriginalMergedWheelGeometry(
  anchor:TransformNode,fallbackRadiusMetres:number,
):SplitWheelEvidence{
  const meshes=anchor.getChildMeshes(false).filter(
    (m):m is Mesh=>m instanceof Mesh&&m.getTotalVertices()>0);
  if(meshes.length!==1)return failure("requires-exactly-one-source-render-mesh",meshes.length);
  const source=meshes[0]!;
  if(source.hasInstances||source.getClassName()!=="Mesh")
    return failure("shared-or-instanced-source",meshes.length);
  const indices=source.getIndices();
  const positions=source.getVerticesData(VertexBuffer.PositionKind);
  if(!indices||!positions)return failure("missing-position-or-indices",1);
  const count=positions.length/3;
  if(!Number.isInteger(count)||count<400||count>140000||
    indices.length<900||indices.length>900000||indices.length%3!==0)
    return failure("source-geometry-outside-bounds",1);
  if(!Array.from(indices).every(v=>Number.isInteger(v)&&v>=0&&v<count))
    return failure("invalid-source-indices",1);
  const attributes=supportedAttributes(source,count);
  if(!attributes)return failure("unsupported-source-vertex-data",1);

  source.computeWorldMatrix(true);anchor.computeWorldMatrix(true);
  const matrix=source.getWorldMatrix().multiply(
    anchor.getWorldMatrix().clone().invert());
  const sourceToAnchor=(i:number):Point=>{
    const p=Vector3.TransformCoordinates(new Vector3(
      positions[i*3]!,positions[i*3+1]!,positions[i*3+2]!),matrix);
    return {x:p.x,y:p.y,z:p.z};
  };
  const transformed:Point[]=Array.from({length:count},(_,i)=>sourceToAnchor(i));
  const all=bounds();
  for(const p of transformed)expand(all,p);
  const sizeAll=size(all);
  // Work exclusively in the fitted vehicle's measured, axis-aligned frame.
  if(sizeAll.x<1.1||sizeAll.x>3.5||
     sizeAll.y<.9||sizeAll.y>3.5||
     sizeAll.z<2.6||sizeAll.z>7)
    return failure("source-not-vehicle-scale",1);

  const parent=new Int32Array(count);
  const rank=new Uint8Array(count);
  for(let i=0;i<count;i++)parent[i]=i;
  const root=(start:number)=>{
    let i=start;
    while(parent[i]!==i){parent[i]=parent[parent[i]!]!;i=parent[i]!;}
    return i;
  };
  const union=(a:number,b:number)=>{
    a=root(a);b=root(b);if(a===b)return;
    if(rank[a]!<rank[b]!)parent[a]=b;
    else if(rank[a]!>rank[b]!)parent[b]=a;
    else {parent[b]=a;rank[a]!++;}
  };
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i]!,b=indices[i+1]!,c=indices[i+2]!;
    union(a,b);union(b,c);
  }
  const groups=new Map<number,Island>();
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i]!,id=root(a);
    let component=groups.get(id);
    if(!component){
      component={root:id,triangles:[],vertexSet:new Set<number>(),
        ...bounds(),center:{x:0,y:0,z:0},sourceCenter:{x:0,y:0,z:0}};
      groups.set(id,component);
    }
    for(let j=0;j<3;j++){
      const vertex=indices[i+j]!;
      component.triangles.push(vertex);
      if(component.vertexSet.has(vertex))continue;
      component.vertexSet.add(vertex);expand(component,transformed[vertex]!);
    }
  }
  const halfWidth=sizeAll.x/2,halfLength=sizeAll.z/2;
  const byCorner=new Map<Corner,Island[]>();
  for(const comp of groups.values()){
    if(comp.triangles.length<240)continue; // >=80 original source triangles
    comp.center=center(comp);
    const d=size(comp),p=comp.center;
    // A radial ring in the wheel plane, not a glass, bumper or body panel.
    if(d.x<.065||d.x>.62||d.y<.42||d.y>1.25||
      d.z<.42||d.z>1.25||
      Math.max(d.y,d.z)/Math.min(d.y,d.z)>1.24)continue;
    if(Math.abs(p.x-(all.min.x+all.max.x)/2)<halfWidth*.47)continue;
    if(Math.abs(p.z-(all.min.z+all.max.z)/2)<halfLength*.39)continue;
    if(p.y<all.min.y+.16||p.y>all.min.y+1.0)continue;
    const corner=wheelCorner({
      x:p.x-(all.min.x+all.max.x)/2,y:p.y,
      z:p.z-(all.min.z+all.max.z)/2,
    });
    const list=byCorner.get(corner)??[];
    list.push(comp);byCorner.set(corner,list);
  }
  if(CORNERS.some(c=>(byCorner.get(c)?.length??0)===0))
    return failure("four-independent-tire-islands-not-proven",1);
  // Pick the most complete outer tire in each corner. Ambiguities with equal
  // area/coverage do not justify removing any source geometry.
  const selected=new Map<Corner,Island>();
  for(const corner of CORNERS){
    const sorted=byCorner.get(corner)!.sort((a,b)=>{
      const aa=size(a),bb=size(b);
      return bb.y*bb.z-aa.y*aa.z;
    });
    const best=sorted[0]!,second=sorted[1];
    if(second&&size(second).y*size(second).z>size(best).y*size(best).z*.9)
      return failure("duplicate-or-ambiguous-wheel-candidates",1);
    selected.set(corner,best);
  }
  const centers=CORNERS.map(c=>selected.get(c)!.center);
  const dims=CORNERS.map(c=>size(selected.get(c)!));
  if(
    maxDiff(centers.map(c=>c.y))>.19||
    distance(centers[0]!.z,centers[1]!.z)>.19||
    distance(centers[2]!.z,centers[3]!.z)>.19||
    distance(centers[0]!.x,centers[2]!.x)>.2||
    distance(centers[1]!.x,centers[3]!.x)>.2||
    maxDiff(dims.map(d=>d.y))>.21||
    maxDiff(dims.map(d=>d.z))>.21||
    centers[0]!.z-centers[2]!.z<1.5||
    centers[0]!.x-centers[1]!.x<.95
  )return failure("wheel-quadrants-not-symmetric",1);
  // One hub per original corner, with source-space axial orientation. Never
  // infer axes from global chassis X after glTF coordinate-root rotation.
  const sourceWorld=source.getWorldMatrix();
  const localRight=Vector3.TransformNormal(
    Vector3.TransformNormal(Vector3.Right(),anchor.getWorldMatrix()),
    sourceWorld.clone().invert(),
  ).normalize();
  const parts=[Math.abs(localRight.x),Math.abs(localRight.y),Math.abs(localRight.z)];
  const major=Math.max(...parts);
  if(major<.9)return failure("wheel-axle-not-axis-aligned",1);
  const spinAxis=(["x","y","z"] as const)[parts.indexOf(major)]!;
  // Material, attribute streams and intact body are preserved. Only the
  // selected wheel triangles are transferred, at their ORIGINAL vertices.
  const remove=new Set<number>();
  const wheelIndices=new Map<Corner,number[]>();
  for(const corner of CORNERS){
    const p=selected.get(corner)!;
    const selectedIndices=p.triangles;
    if(selectedIndices.length<240)return failure("wheel-surface-incomplete",1);
    wheelIndices.set(corner,selectedIndices);
    // Mark triangles by signature, NOT index ownership: other components may
    // contain a coincident vertex index but must remain intact.
    remove.add(p.root);
  }
  const body:number[]=[];
  for(let i=0;i<indices.length;i+=3){
    const id=root(indices[i]!);
    if(!remove.has(id))body.push(indices[i]!,indices[i+1]!,indices[i+2]!);
  }
  const removedTriangles=(indices.length-body.length)/3;
  if(body.length<indices.length*.3 || removedTriangles<320)
    return failure("invalid-body-wheel-triangle-partition",1);
  const inversed=matrix.clone().invert();
  const pivotNodes:TransformNode[]=[];
  const wheelMeshes:Mesh[]=[];
  const names={} as Record<Corner,string>;
  try{
    for(const corner of CORNERS){
      const originalCenter=selected.get(corner)!.center;
      const p=Vector3.TransformCoordinates(new Vector3(
        originalCenter.x,originalCenter.y,originalCenter.z),inversed);
      const centerSource={x:p.x,y:p.y,z:p.z};
      const pivot=new TransformNode("veh012-actual-hub-"+corner,anchor.getScene());
      pivot.parent=source;
      pivot.position.set(p.x,p.y,p.z);
      pivotNodes.push(pivot);
      const wheel=createWheelMesh(source,pivot,corner,attributes,
        wheelIndices.get(corner)!,centerSource);
      wheelMeshes.push(wheel);
      names[corner]=pivot.name;
    }
    // Before touching the body, all four original wheel meshes must exist
    // with real triangles and unchanged fitted source materials.
    if(wheelMeshes.some(m=>m.getTotalVertices()<80||m.getTotalIndices()<240))
      throw Error("one or more wheel surfaces incomplete");
    source.makeGeometryUnique();
    source.setIndices(body,null,false);
  }catch{
    for(const wheel of wheelMeshes)wheel.dispose();
    for(const pivot of pivotNodes)pivot.dispose();
    return failure("transactional-wheel-separation-failed",1);
  }
  return {
    identified:4,sourceMeshCount:1,separatedTriangles:removedTriangles,
    reason:"four-source-tires-separated-with-original-materials-and-positions",
    mapping:{
      wheelNames:names,spinAxis,steerAxis:"y",steeringMode:"world-yaw",
      steeringSign:-1,fallbackRadiusMetres,
    },
  };
}
