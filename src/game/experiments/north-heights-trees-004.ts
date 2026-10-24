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
export async function placeNorthHeightsTrees004(
  scene:Scene, placements:readonly TreeLocation[],
):Promise<{trees:number;meshInstances:number;sourceMeshes:number;dispose:()=>void}>{
  const imported=await SceneLoader.ImportMeshAsync("","/GLBs/Infrastructure/","tree_low_poly_lowpoly.glb",scene);
  const meshes=imported.meshes.filter((m):m is Mesh=>m instanceof Mesh && m.getTotalVertices()>0 && m.isEnabled());
  if(!meshes.length)throw new Error("Owner tree GLB has no renderable mesh geometry");
  const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
  // Snapshot BEFORE hiding source. We keep Babylon's glTF hierarchy matrices
  // intact when spawning each individual imported mesh, unlike flattening
  // skeleton/pivot relationships into origin-aligned boxes.
  const originals: {mesh:Mesh; world:Matrix}[]=[];
  for(const mesh of meshes){
    const world=mesh.computeWorldMatrix(true).clone();
    const bounds=mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(bounds.minimumWorld);
    max.maximizeInPlace(bounds.maximumWorld);
    originals.push({mesh,world});
  }
  const physicalHeight=max.y-min.y;
  if(!Number.isFinite(physicalHeight)||physicalHeight<.00001){
    for(const root of imported.meshes)root.dispose();
    throw new Error("Tree GLB bounds invalid; cannot safely normalize height");
  }
  // Actual trees are normalized only by height, NOT rebuilt or retessellated.
  const targetHeight=7.3;
  const normalizedScale=targetHeight/physicalHeight;
  const midX=(min.x+max.x)*.5,midZ=(min.z+max.z)*.5;
  let instanceCount=0;
  const instances:AbstractMesh[]=[];
  for(const {mesh,world} of originals){
    // Instances are rendered separately from hidden glTF source meshes. The
    // source remains allocated as the Babylon instancing master geometry.
    mesh.isVisible=false;
    for(let i=0;i<placements.length;i++){
      const place=placements[i]!;
      const angle=Quaternion.RotationAxis(Vector3.Up(),place.angle);
      const scale=normalizedScale*place.size;
      const norm=Matrix.Compose(new Vector3(scale,scale,scale),angle,
        new Vector3(
          place.x-(Math.cos(place.angle)*midX+Math.sin(place.angle)*midZ)*scale,
          place.y-min.y*scale,
          place.z-(-Math.sin(place.angle)*midX+Math.cos(place.angle)*midZ)*scale,
        ));
      const full=world.multiply(norm);
      const s=new Vector3(),q=new Quaternion(),p=new Vector3();
      if(!full.decompose(s,q,p))continue;
      const instance=mesh.createInstance("nh004-tree-"+i+"-"+mesh.name);
      instance.position.copyFrom(p);
      instance.rotationQuaternion=q;
      instance.scaling.copyFrom(s);
      instance.isPickable=false;
      instance.receiveShadows=false;
      instances.push(instance);
      instanceCount++;
    }
  }
  return {
    trees:placements.length,meshInstances:instanceCount,sourceMeshes:meshes.length,
    dispose(){
      for(const item of instances)item.dispose();
      for(const mesh of imported.meshes)mesh.dispose();
      for(const transform of imported.transformNodes)transform.dispose();
    },
  };
}

/** SOUTH WARD's deterministic organic 64x64 grass distribution; no cube lawns. */
export function attachNorthHeightsGrass004(scene:Scene,material:StandardMaterial){
  const pixels=new Uint8Array(64*64*4),rand=rng(71421);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const i=(y*64+x)*4,n=rand(),b=rand();
    pixels[i]=45+Math.round(n*18+b*10);
    pixels[i+1]=78+Math.round(n*28+b*18);
    pixels[i+2]=42+Math.round(n*16);
    pixels[i+3]=255;
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
