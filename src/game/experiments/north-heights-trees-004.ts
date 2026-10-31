/**
 * NH-REBUILD-004 — actual user-committed tree_low_poly_lowpoly.glb.
 * Imports ONE owner-provided tree once. Places lightweight Babylon instances
 * of its original mesh parts and retains original mesh materials/textures.
 * Do not use the rejected leaves.glb or generated flat canopy cards.
 *
 * Attribution: "Tree low poly lowpoly" by 00amza (Sketchfab skfb.ly/pO6MX),
 * CC BY 4.0, as specified by source commit 56c55dfd4d4f1a1ccd4798ad1e5e0caaeb2574af.
 */
import {
  AbstractMesh, Color3, Matrix, Mesh, Quaternion, RawTexture, Scene,
  SceneLoader, StandardMaterial, Texture, Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {sampleSouthWardGrassPixel} from "@/game/world-generation/ground-land-surface";
import {createNorthHeightsVisibilityGate015} from "./north-heights-visibility-gate-015";

export const NORTH_HEIGHTS_TREE_URI="/GLBs/Infrastructure/tree_low_poly_lowpoly.glb";
export type TreeLocation={x:number;y:number;z:number;size:number;angle:number};
const rng=(seed:number)=>{
  let s=seed>>>0;
  return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
};

/** Parks plus street-facing lots. Avoid asphalt, crossings, and 3.75m pavements. */
export function planNorthHeightsTrees004(
  middle:readonly number[],
  occupied:ReadonlySet<string>,
  ground:(x:number,z:number)=>number,
  mobile:boolean,
):readonly TreeLocation[]{
  const rand=rng(313957), placements:TreeLocation[]=[];
  for(let j=0;j<middle.length;j++)for(let i=0;i<middle.length;i++){
    const block="NH-"+String(j+1).padStart(2,"0")+"-"+String(i+1).padStart(2,"0");
    const x=middle[i]!,z=middle[j]!;
    if(!occupied.has(block)){
      const count=mobile?5:7;
      for(let t=0;t<count;t++){
        const px=x+(rand()-.5)*37,pz=z+(rand()-.5)*37;
        placements.push({x:px,y:ground(px,pz),z:pz,size:.78+rand()*.34,angle:rand()*Math.PI*2});
      }
    }
    // Street-facing vegetation belongs to the landscaping setback, never
    // on the carriageway or the 3.75m sidewalk; closest road axis is 32m
    // from block centre and sidewalk extends 7.75m from road centre.
    if((i+j)%2===0){
      const px=x+(i%2===0?21.2:-21.2),pz=z+(rand()-.5)*19;
      placements.push({x:px,y:ground(px,pz),z:pz,size:.78+rand()*.31,angle:rand()*Math.PI*2});
    }
  }
  return placements;
}
/** Batched owner-GLB trees. Two source meshes, each drawn via one culled
 * thin-instance buffer, regardless of how many urban planting positions exist.
 */
export async function placeNorthHeightsTrees004(
  scene:Scene, placements:readonly TreeLocation[],mobile=false,
):Promise<{trees:number;meshInstances:number;sourceMeshes:number;
  update:(camera:Vector3,dt:number)=>void;dispose:()=>void}>{
  const imported=await SceneLoader.ImportMeshAsync("","/GLBs/Infrastructure/","tree_low_poly_lowpoly.glb",scene);
  const meshes=imported.meshes.filter((m):m is Mesh=>m instanceof Mesh&&m.getTotalVertices()>0&&m.isEnabled());
  if(!meshes.length)throw new Error("Owner tree GLB has no renderable geometry");
  const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
  const originalWorld=new Map<Mesh,Matrix>();
  for(const mesh of meshes){
    const world=mesh.computeWorldMatrix(true).clone();
    const bounds=mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(bounds.minimumWorld);
    max.maximizeInPlace(bounds.maximumWorld);
    originalWorld.set(mesh,world);
  }
  const physicalHeight=max.y-min.y;
  if(!Number.isFinite(physicalHeight)||physicalHeight<.00001){
    for(const mesh of imported.meshes)mesh.dispose();
    throw new Error("Tree GLB bounds invalid; cannot normalize height");
  }
  const normalizedScale=7.3/physicalHeight;
  const midX=(min.x+max.x)*.5,midZ=(min.z+max.z)*.5;
  // Baking source parent transforms makes every thin instance independent of
  // Sketchfab's glTF hierarchy. Geometry/materials remain from the real GLB.
  for(const mesh of meshes){
    mesh.bakeTransformIntoVertices(originalWorld.get(mesh)!);
    mesh.parent=null;
    mesh.position.set(0,0,0);
    mesh.rotationQuaternion=null;
    mesh.rotation.set(0,0,0);
    mesh.scaling.set(1,1,1);
    mesh.isPickable=false;
    mesh.receiveShadows=false;
    mesh.thinInstanceSetBuffer("matrix",new Float32Array(0),16,true);
    mesh.setEnabled(false);
  }
  const matrices=placements.map(place=>{
    const angle=place.angle,scale=normalizedScale*place.size;
    return Matrix.Compose(new Vector3(scale,scale,scale),
      Quaternion.RotationAxis(Vector3.Up(),angle),
      new Vector3(
        place.x-(Math.cos(angle)*midX+Math.sin(angle)*midZ)*scale,
        place.y-min.y*scale,
        place.z-(-Math.sin(angle)*midX+Math.cos(angle)*midZ)*scale,
      ));
  });
  const maxRadius=mobile?125:180;
  const maxDistanceSq=maxRadius*maxRadius;
  let disposed=false;
  const visibilityGate=createNorthHeightsVisibilityGate015();
  function refresh(camera:Vector3){
    if(disposed||!visibilityGate.shouldRefresh(camera))return;
    const data:number[]=[];
    for(let i=0;i<placements.length;i++){
      const p=placements[i]!;
      if((p.x-camera.x)**2+(p.z-camera.z)**2>maxDistanceSq)continue;
      data.push(...matrices[i]!.toArray());
    }
    const buffer=new Float32Array(data);
    for(const mesh of meshes){
      mesh.thinInstanceSetBuffer("matrix",buffer,16,true);
      mesh.thinInstanceRefreshBoundingInfo();
      mesh.setEnabled(buffer.length>0);
    }
  }
  // Only crossing a camera movement threshold triggers new GPU buffers;
  // standing, turning and vertical-only flight never rebuild this static forest.
  refresh(scene.activeCamera?.position??Vector3.Zero());
  return {
    trees:placements.length,
    meshInstances:placements.length*meshes.length,
    sourceMeshes:meshes.length,
    update(camera,_dt){refresh(camera);},
    dispose(){
      if(disposed)return;
      disposed=true;
      for(const mesh of imported.meshes)mesh.dispose(false,true);
      for(const node of imported.transformNodes)node.dispose();
    },
  };
}

/** SOUTH WARD's deterministic organic 64x64 grass distribution; no cube lawns. */
export function attachNorthHeightsGrass004(scene:Scene,material:StandardMaterial){
  const pixels=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    pixels.set(sampleSouthWardGrassPixel((x+.5)/8,(y+.5)/8,x,y),(y*64+x)*4);
  }
  const tex=RawTexture.CreateRGBATexture(pixels,64,64,scene,true,false,Texture.TRILINEAR_SAMPLINGMODE);
  tex.name="nh004-south-ward-grass";
  tex.wrapU=Texture.WRAP_ADDRESSMODE;
  tex.wrapV=Texture.WRAP_ADDRESSMODE;
  tex.uScale=3.2;tex.vScale=2.4;
  material.diffuseTexture=tex;
  material.diffuseColor=Color3.White();
  return tex;
}
