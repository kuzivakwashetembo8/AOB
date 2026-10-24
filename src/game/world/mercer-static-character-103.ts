/**
 * OBS-103: owner-authored, non-playable, unanimated character.glb on Mercer St.
 * Independent of playable Voight (UAL). This is a static display witness,
 * not an NPC controller: no animation playback, physics or update loop.
 */
import {AbstractMesh,TransformNode,loadAssetContainerAsync} from "@babylonjs/core";
import {createNativeFlightPlayer129,type NativeFlightPlayer129} from "../character/native-flight-129";
import type {FlightPoseInput} from "../character/locomotion/flight-pose";
import type {AssetContainer,Scene} from "@babylonjs/core";
import {gtdLoadingLedger as audit} from "../../lib/real-loading-ledger";
import {humanVisualYaw105} from "../character/human-walking-105";
import {createWalkPlayer110,fetchWalkClip110,type WalkPlayer110} from "../character/retargeted-walk-110";
import {fetchSprintClip120} from "../character/retargeted-sprint-120";
import {createJumpPlayer127,fetchJumpClip127,type JumpPlayer127} from "../character/retargeted-jump-127";
import {createFootPhysicsInspector110,type FootPhysicsDebugOptions,type GroundQuery110} from "../character/foot-ik-inspector-110";
import {createNativePoseController109,type NativePose109Controller} from "../character/native-neutral-pose-109";

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
  let walk:WalkPlayer110|null=null;
  let jump:JumpPlayer127|null=null;
  let flight:NativeFlightPlayer129|null=null;
  let flightActive=false;
  let flightPivot:TransformNode|null=null;
  let flightOffset:TransformNode|null=null;
  let footInspector:ReturnType<typeof createFootPhysicsInspector110>|null=null;
  let footDebugOptions:FootPhysicsDebugOptions|null=null;
  let footGroundQuery:GroundQuery110|null=null;
  let meshCount=0;
  let controlled=false;
  let fittedRoot:TransformNode|null=null;
  let fittedCenterX=0,fittedCenterZ=0;
  let neutralPose:NativePose109Controller|null=null;
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
    // CHAR-108 confirms there are ZERO animation groups in character.glb.
    // Babylon glTF skins link bones to TransformNodes. Bone.rotate() is
    // overwritten by those nodes, which explains CHAR-107's T-pose regression.
    // CHAR-109 calibrates the authoritative local transforms instead.
    neutralPose=createNativePoseController109(entries.skeletons);
    console.info("[CHAR-109] Native neutral pose",neutralPose.report);
    if(neutralPose.report.status!=="native-joints")
      throw Error("CHAR-109 native neutral pose was not established: "+
        (neutralPose.report.reason??"unknown"));
    // CHAR-129: pivot in the RENDER hierarchy only, near the torso centre.
    // At zero rotation the +.95/- .95 offsets cancel, preserving the exact
    // original CHAR-109/110 bounding box, foot level, and accepted pose.
    flightPivot=new TransformNode("char129-native-flight-torso-pivot",scene);
    flightPivot.parent=anchor;
    flightPivot.position.y=.95;
    flightOffset=new TransformNode("char129-native-flight-pivot-offset",scene);
    flightOffset.parent=flightPivot;
    flightOffset.position.y=-.95;
    const modelRoot=new TransformNode("obs103-mercer-static-fit",scene);
    fittedRoot=modelRoot;
    modelRoot.parent=flightOffset;
    for(const root of entries.rootNodes)root.parent=modelRoot;

    const meshes=new Set<AbstractMesh>();
    for(const root of entries.rootNodes){
      if(root instanceof AbstractMesh)meshes.add(root);
      for(const mesh of root.getChildMeshes(false))meshes.add(mesh);
    }
    // CHAR-110: no vertex deformation. All motion must target actual linked joints.
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
    meshCount=count;
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
    // Capture accepted CHAR-109 relaxed-arm rest pose before creating animation.
    // Animation deltas use this calibrated rest pose; no shoulder T-pose on stop.
    // Blink both head and eyelash morphs from this cloned instance only.
    const blinkTargets:{influence:number}[]=[];
    const seenTargets=new Set<object>();
    for(const mesh of meshes){
      const manager=mesh.morphTargetManager;
      if(!manager)continue;
      for(let i=0;i<manager.numTargets;i++){
        const target=manager.getTarget(i);
        if(/^eyeBlink(Left|Right)$/i.test(target.name)&&!seenTargets.has(target)){
          seenTargets.add(target);blinkTargets.push(target);
        }
      }
    }
    // Both source motions are baked offline to Voight's 22 mapped linked joints.
    // A missing sprint file must fail visibly; never silently run the walking clip faster.
    const [walkClip,sprintClip,jumpClip]=await Promise.all([fetchWalkClip110(),fetchSprintClip120(),fetchJumpClip127()]);
    walk=createWalkPlayer110(entries.skeletons,walkClip,blinkTargets,sprintClip);
    jump=createJumpPlayer127(entries.skeletons,jumpClip);
    flight=createNativeFlightPlayer129(entries.skeletons,anchor,flightPivot);
    footInspector=createFootPhysicsInspector110(scene,entries.skeletons);
    if(footDebugOptions&&footGroundQuery)footInspector.configure(footDebugOptions,footGroundQuery);
    audit.finish(instantiateId,count+" meshes; "+
      neutralPose.report.applied.length+" linked upper-arm joints; "+
      walk.report.jointCount+" retargeted UAL walk joints");
    console.info("[CHAR-110] UAL walking transfer ready",walk.report);
    console.info("[OBS-103] Static Mercer character loaded",{
      source:MERCER_STATIC_CHARACTER_PATH,meshes:count,
      heightMeters:MERCER_STATIC_CHARACTER_POSE.heightMeters,
      animated:false,pose:"linked-TransformNode-neutral-pose",
      adjustedArmJoints:neutralPose.report.applied,
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
    /** Connect the existing Rapier collision query to opt-in Foot IK diagnostics. */
    configureFootDebug(options:FootPhysicsDebugOptions,query:GroundQuery110){
      footDebugOptions=options;footGroundQuery=query;
      footInspector?.configure(options,query);
    },
    /** Walk mode takes control of this exact imported actor; no second GLB. */
    setControlled(enabled:boolean){
      controlled=enabled;
      if(!enabled){
        flight?.leave();flightActive=false;
        walk?.reset();jump?.reset();footInspector?.hide();
      }
      neutralPose?.ensure();
      if(fittedRoot){
        fittedRoot.rotation.y=humanVisualYaw105(enabled);
        fittedRoot.position.x=enabled?-fittedCenterX:fittedCenterX;
        fittedRoot.position.z=enabled?-fittedCenterZ:fittedCenterZ;
      }
      if(!enabled){
        anchor.position.set(MERCER_STATIC_CHARACTER_POSE.x,0,
          MERCER_STATIC_CHARACTER_POSE.z);
        anchor.rotation.y=0;
      }
    },
    updateControlled(position:{x:number;y:number;z:number},
      headingYaw:number,walkSpeed:number,dt:number,sprintHeld=false,
      grounded=true,verticalVelocity=0){
      if(!controlled||closed)return;
      if(flightActive){
        flight?.leave();flightActive=false;
        walk?.reset();jump?.reset();neutralPose?.ensure();
      }
      // Shared Rapier capsule centre is 0.92 m above pavement. The fitted
      // human has a grounded foot origin, so do not transfer the capsule offset.
      anchor.position.set(position.x,position.y-.92,position.z);
      anchor.rotation.y=headingYaw;
      // CHAR-109 owns idle posture. During walking, the authored clip owns
      // arms and legs, preventing the old per-tick idle shoulder clamp.
      walk?.update(grounded?walkSpeed:0,dt,grounded&&sprintHeld);
      jump?.update({grounded,verticalVelocity,dt});
      footInspector?.update(position,dt);
    },
    /** CHAR-129: the SAME native actor follows Rapier flight, with no UAL
     * joints or meshes and no concurrent walk/jump animation writers. */
    updateControlledFlight(position:{x:number;y:number;z:number},
      headingYaw:number,input:FlightPoseInput&{dt:number}){
      if(!controlled||closed)return;
      anchor.position.set(position.x,position.y-.92,position.z);
      anchor.rotation.y=headingYaw;
      if(!flightActive){
        // These accepted controllers own ground pose only. Exit on their
        // neutral basis, snapshot actual world-space arm and foot corridors.
        walk?.reset();jump?.reset();neutralPose?.ensure();
        flight?.enter();flightActive=true;
      }
      flight?.update(input);
      footInspector?.hide();
    },
    get poseReport(){return {meshCount,
      vertices:0,controlled,
      pose:neutralPose?.report??null,walk:walk?.report??null,jump:jump?.report??null,
      flight:flight?.report??null,
      footGeometry:footInspector?.report??null};},
    dispose(){
      if(closed)return;
      closed=true;
      walk?.dispose();walk=null;
      jump?.dispose();jump=null;
      flight?.dispose();flight=null;
      flightOffset?.dispose();flightOffset=null;
      flightPivot?.dispose();flightPivot=null;
      footInspector?.dispose();footInspector=null;
      neutralPose?.dispose();neutralPose=null;
      entries?.dispose();
      container?.dispose();
      anchor.dispose();
    },
  };
}

