/**
 * OBS-103: owner-authored, non-playable, unanimated character.glb on Mercer St.
 * Independent of playable Voight (UAL). This is a static display witness,
 * not an NPC controller: no animation playback, physics or update loop.
 */
import {AbstractMesh,TransformNode,loadAssetContainerAsync} from "@babylonjs/core";
import type {AssetContainer,Scene} from "@babylonjs/core";

export const MERCER_STATIC_CHARACTER_PATH="/GLBs/Characters/character.glb";
export const MERCER_STATIC_CHARACTER_BYTES=12197104;
export const MERCER_STATIC_CHARACTER_POSE={
  x:-19.5,y:0.15,z:13.35,yaw:Math.PI,
  heightMeters:1.78,
} as const;

export function stopStaticCharacterAnimations(
  groups:readonly {stop:()=>unknown}[],
):void {
  for(const group of groups)group.stop();
}

export function createMercerStaticCharacter(
  scene:Scene,
  load?:(path:string,scene:Scene)=>Promise<AssetContainer>,
){
  const anchor=new TransformNode("obs103-mercer-static-character",scene);
  let container:AssetContainer|null=null;
  let entries:ReturnType<AssetContainer["instantiateModelsToScene"]>|null=null;
  let closed=false;
  const ready=(async()=>{
    if(!load)await import("@babylonjs/loaders/glTF");
    const asset=await (load?load(MERCER_STATIC_CHARACTER_PATH,scene):
      loadAssetContainerAsync(MERCER_STATIC_CHARACTER_PATH,scene));
    if(closed){asset.dispose();return;}
    container=asset;
    // Neither imported source clips nor cloned animation groups may play.
    stopStaticCharacterAnimations(asset.animationGroups);
    entries=asset.instantiateModelsToScene(
      name=>"obs103-mercer-static:"+name,true);
    if(closed){entries.dispose();entries=null;return;}
    stopStaticCharacterAnimations(entries.animationGroups);
    const modelRoot=new TransformNode("obs103-mercer-static-fit",scene);
    modelRoot.parent=anchor;
    for(const root of entries.rootNodes)root.parent=modelRoot;

    const meshes=new Set<AbstractMesh>();
    for(const root of entries.rootNodes){
      if(root instanceof AbstractMesh)meshes.add(root);
      for(const mesh of root.getChildMeshes(false))meshes.add(mesh);
    }
    let count=0,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,
      minZ=Infinity,maxZ=-Infinity;
    for(const mesh of meshes){
      if(mesh.getTotalVertices()<=0)continue;
      mesh.computeWorldMatrix(true);
      const bb=mesh.getBoundingInfo().boundingBox;
      minX=Math.min(minX,bb.minimumWorld.x);
      maxX=Math.max(maxX,bb.maximumWorld.x);
      minY=Math.min(minY,bb.minimumWorld.y);
      maxY=Math.max(maxY,bb.maximumWorld.y);
      minZ=Math.min(minZ,bb.minimumWorld.z);
      maxZ=Math.max(maxZ,bb.maximumWorld.z);
      mesh.isPickable=false;
      mesh.receiveShadows=true;
      count++;
    }
    const actualHeight=maxY-minY;
    if(!count||!Number.isFinite(actualHeight)||actualHeight<=0.0001)
      throw Error("OBS-103 static character has no valid render geometry");
    // Normalization is visual only; the owner model remains unchanged.
    const scale=MERCER_STATIC_CHARACTER_POSE.heightMeters/actualHeight;
    if(!Number.isFinite(scale)||scale<=0||scale>1000)
      throw Error("OBS-103 invalid character scale");
    modelRoot.scaling.setAll(scale);
    modelRoot.rotation.y=MERCER_STATIC_CHARACTER_POSE.yaw;
    // Measure after scaling/rotation to align the actual feet with pavement,
    // not an assumed exported origin.
    minX=Infinity;maxX=-Infinity;minY=Infinity;minZ=Infinity;maxZ=-Infinity;
    for(const mesh of meshes){
      if(mesh.getTotalVertices()<=0)continue;
      mesh.computeWorldMatrix(true);
      const bb=mesh.getBoundingInfo().boundingBox;
      minX=Math.min(minX,bb.minimumWorld.x);
      maxX=Math.max(maxX,bb.maximumWorld.x);
      minY=Math.min(minY,bb.minimumWorld.y);
      minZ=Math.min(minZ,bb.minimumWorld.z);
      maxZ=Math.max(maxZ,bb.maximumWorld.z);
    }
    // Bounding box is measured with anchor at origin.
    modelRoot.position.set(-(minX+maxX)/2,
      MERCER_STATIC_CHARACTER_POSE.y-minY,
      -(minZ+maxZ)/2);
    anchor.position.set(MERCER_STATIC_CHARACTER_POSE.x,0,
      MERCER_STATIC_CHARACTER_POSE.z);
    console.info("[OBS-103] Static Mercer character loaded",{
      source:MERCER_STATIC_CHARACTER_PATH,meshes:count,
      heightMeters:MERCER_STATIC_CHARACTER_POSE.heightMeters,
      animated:false,
    });
  })().catch(error=>{
    // Expose a real failure. The authoritative world readiness promise rejects
    // rather than falsely reporting a successful static-character preview.
    throw error;
  });
  return {
    anchor,ready,
    dispose(){
      if(closed)return;
      closed=true;
      entries?.dispose();
      container?.dispose();
      anchor.dispose();
    },
  };
}
