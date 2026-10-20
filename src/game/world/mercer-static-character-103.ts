/**
 * OBS-103: owner-authored, non-playable, unanimated character.glb on Mercer St.
 * Independent of playable Voight (UAL). This is a static display witness,
 * not an NPC controller: no animation playback, physics or update loop.
 */
import {AbstractMesh,Mesh,Space,TransformNode,Vector3,loadAssetContainerAsync} from "@babylonjs/core";
import type {AssetContainer,Scene,Skeleton} from "@babylonjs/core";
import {gtdLoadingLedger as audit} from "../../lib/real-loading-ledger";
import {createHumanDeformer105,humanVisualYaw105,type HumanDeformer105} from "../character/human-walking-105";

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

/** OBS-104: freeze the imported rig in a neutral standing arm position.
 * Rotates only the shoulder/upper-arm bones, keeping all clips stopped.
 * Uses measured shoulder→elbow direction instead of guessing left/right
 * local axes (Blender, Mixamo, and GLB armatures differ).
 */
export function lowerStaticCharacterHands(skeletons:readonly Skeleton[]):number{
  let lowered=0;
  const normalized=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,"");
  const side=(name:string):"left"|"right"|null=>{
    const n=normalized(name);
    if(n.includes("left")||/(?:upperarm|arm|uparm)l$/.test(n))return "left";
    if(n.includes("right")||/(?:upperarm|arm|uparm)r$/.test(n))return "right";
    return null;
  };
  for(const skeleton of skeletons){
    skeleton.prepare();
    for(const upper of skeleton.bones){
      const name=normalized(upper.name);
      const armSide=side(upper.name);
      if(!armSide||!name.includes("arm")||
         /forearm|lowerarm|twist|hand|wrist/.test(name))continue;
      // Only upper arms: e.g. mixamorigLeftArm, LeftUpperArm,
      // upper_arm_L. Clavicle/shoulder is never rotated.
      const forearm=skeleton.bones.find(b=>{
        const n=normalized(b.name);
        return side(b.name)===armSide&&/(?:forearm|lowerarm|elbow)/.test(n);
      });
      if(!forearm)continue;
      let ancestor=forearm.getParent();
      let descendant=false;
      for(let depth=0;ancestor&&depth<8;depth++){
        if(ancestor===upper){descendant=true;break;}
        ancestor=ancestor.getParent();
      }
      if(!descendant)continue;
      const shoulder=upper.getAbsolutePosition();
      const elbow=forearm.getAbsolutePosition();
      const vec=elbow.subtract(shoulder);
      if(vec.lengthSquared()<.000001)continue;
      const original=vec.normalize();
      // A relaxed hand follows the torso with a slight outward cant.
      const target=new Vector3(
        armSide==="left" ? -.16 : .16,-1,0).normalize();
      const angle=Math.acos(Math.max(-1,Math.min(1,Vector3.Dot(original,target))));
      if(angle<.12)continue;
      const axis=Vector3.Cross(original,target);
      if(axis.lengthSquared()<.000001)continue;
      upper.rotate(axis.normalize(),Math.min(angle,1.9),Space.WORLD);
      lowered++;
    }
    skeleton.prepare();
  }
  return lowered;
}

export function createMercerStaticCharacter(
  scene:Scene,
  load?:(path:string,scene:Scene)=>Promise<AssetContainer>,
){
  const anchor=new TransformNode("obs103-mercer-static-character",scene);
  let container:AssetContainer|null=null;
  let entries:ReturnType<AssetContainer["instantiateModelsToScene"]>|null=null;
  let closed=false;
  let deformer:HumanDeformer105|null=null;
  let controlled=false;
  let fittedRoot:TransformNode|null=null;
  let fittedCenterX=0,fittedCenterZ=0;
  const decodeId="asset:decode:mercer-character";
  const instantiateId="asset:instantiate:mercer-character";
  audit.start(decodeId,"Decode character.glb","asset",MERCER_STATIC_CHARACTER_PATH);
  const ready=(async()=>{
    if(!load)await import("@babylonjs/loaders/glTF");
    const asset=await (load?load(MERCER_STATIC_CHARACTER_PATH,scene):
      loadAssetContainerAsync(MERCER_STATIC_CHARACTER_PATH,scene));
    if(closed){asset.dispose();return;}
    audit.finish(decodeId,"Babylon GLB source loaded",MERCER_STATIC_CHARACTER_BYTES);
    audit.start(instantiateId,"Instantiate static Mercer Street human","asset");
    container=asset;
    // Neither imported source clips nor cloned animation groups may play.
    stopStaticCharacterAnimations(asset.animationGroups);
    entries=asset.instantiateModelsToScene(
      name=>"obs103-mercer-static:"+name,true);
    if(closed){entries.dispose();entries=null;return;}
    stopStaticCharacterAnimations(entries.animationGroups);
    // CHAR-105: source animation groups are not assumed to contain a walking
    // clip or usable armature. The character is posed by its own vertex data.
    const modelRoot=new TransformNode("obs103-mercer-static-fit",scene);
    fittedRoot=modelRoot;
    modelRoot.parent=anchor;
    for(const root of entries.rootNodes)root.parent=modelRoot;

    const meshes=new Set<AbstractMesh>();
    for(const root of entries.rootNodes){
      if(root instanceof AbstractMesh)meshes.add(root);
      for(const mesh of root.getChildMeshes(false))meshes.add(mesh);
    }
    deformer=createHumanDeformer105([...meshes].filter((m):m is import("@babylonjs/core").Mesh=>
      m instanceof Mesh));
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
    modelRoot.rotation.y=humanVisualYaw105(false);
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
    // The mesh is centered after its original PI facing correction. Reversing
    // that correction requires mirroring X/Z offsets, never its foot height.
    fittedCenterX=modelRoot.position.x;
    fittedCenterZ=modelRoot.position.z;
    anchor.position.set(MERCER_STATIC_CHARACTER_POSE.x,0,
      MERCER_STATIC_CHARACTER_POSE.z);
    audit.finish(instantiateId,count+" meshes; neutral hands down; "+
      (deformer?.vertexCount??0)+" pose vertices");
    console.info("[OBS-103] Static Mercer character loaded",{
      source:MERCER_STATIC_CHARACTER_PATH,meshes:count,
      heightMeters:MERCER_STATIC_CHARACTER_POSE.heightMeters,
      animated:false,pose:"relaxed-standing",
    });
  })().catch(error=>{
    audit.fail(decodeId,error);
    audit.fail(instantiateId,error);
    // Expose a real failure. The authoritative world readiness promise rejects
    // rather than falsely reporting a successful static-character preview.
    throw error;
  });
  return {
    anchor,ready,
    /** Walk mode takes control of this exact imported actor; no second GLB. */
    setControlled(enabled:boolean){
      controlled=enabled;
      if(fittedRoot){
        fittedRoot.rotation.y=humanVisualYaw105(enabled);
        fittedRoot.position.x=enabled?-fittedCenterX:fittedCenterX;
        fittedRoot.position.z=enabled?-fittedCenterZ:fittedCenterZ;
      }
      if(!enabled){
        deformer?.setWalking(false,.1);
        anchor.position.set(MERCER_STATIC_CHARACTER_POSE.x,0,
          MERCER_STATIC_CHARACTER_POSE.z);
        anchor.rotation.y=0;
      }
    },
    updateControlled(position:{x:number;y:number;z:number},
      headingYaw:number,walkSpeed:number,dt:number){
      if(!controlled||closed)return;
      // Shared Rapier capsule centre is 0.92 m above pavement. The fitted
      // human has a grounded foot origin, so do not transfer the capsule offset.
      anchor.position.set(position.x,position.y-.92,position.z);
      anchor.rotation.y=headingYaw;
      deformer?.setWalking(walkSpeed>.14,dt);
    },
    get poseReport(){return {meshCount:deformer?.meshCount??0,
      vertices:deformer?.vertexCount??0,controlled};},
    dispose(){
      if(closed)return;
      closed=true;
      deformer?.dispose();deformer=null;
      entries?.dispose();
      container?.dispose();
      anchor.dispose();
    },
  };
}
