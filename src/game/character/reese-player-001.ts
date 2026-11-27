/**
 * REESE-001 — playable Agent Reese from the owner's GLB.
 *
 * This is intentionally NOT the CHAR-109/110 Voight retarget path: that path
 * calibrates fixed joint names in character.glb. Reese is an Ara/Mixamo game
 * rig with authored embedded clips. Reuse the accepted North Heights Rapier
 * capsule and controller; replace only the visual actor and its clip driver.
 */
import {
  AbstractMesh, AnimationGroup, Material, Mesh, MultiMaterial, TransformNode, loadAssetContainerAsync,
  Bone, Quaternion, Vector3, type AssetContainer, type Camera, type Scene,
} from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import {createReeseMuzzleSpark010} from "./reese-muzzle-spark-010";
import {createReeseWeapon001,solveReeseWeaponGripOffset001,solveReeseWeaponMountRotation001,type ReeseWeaponId001} from "../weapons/gun-runtime-001";
import type { FlightPoseInput } from "./locomotion/flight-pose";
import { gtdLoadingLedger as audit } from "../../lib/real-loading-ledger";

export const REESE_PLAYER_PATH_001="/GLBs/Reese%20(1).glb";
export const REESE_PLAYER_HEIGHT_001=1.78;
export const REESE_PLAYER_EXPECTED_ANIMATIONS_001=70;

const keyOf=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"");

/**
 * Match glTF/Babylon names like Walk, walk, Reese|Walk, or Anim_Walk
 * without confusing the plain Idle with Sit idle or the walk with walk back.
 */
export function findReeseClip001<T extends {name:string}>(
 groups:readonly T[],...names:string[]
):T|null{
 for(const wanted of names){
  const k=keyOf(wanted);
  const exact=groups.find(g=>keyOf(g.name)===k);
  if(exact)return exact;
 }
 for(const wanted of names){
  const k=keyOf(wanted);
  const suffixed=groups.find(g=>{
   const n=keyOf(g.name);
   return n.endsWith(k)&&n.length>k.length&&!n.endsWith("sit"+k);
  });
  if(suffixed)return suffixed;
 }
 return null;
}

/** Raise only the rendered rig when an animated foot penetrates its floor plane. */
export function reeseFootGroundCorrection001(
 groundY:number,footSoleYs:readonly number[],currentCorrection=0,
):number{
 const finite=footSoleYs.filter(Number.isFinite).map(y=>y-currentCorrection);
 if(!Number.isFinite(groundY)||!finite.length)return 0;
 return Math.max(0,Math.min(.18,groundY-Math.min(...finite)));
}

/** Transform a bind-pose sole point with its animated foot bone. */
export function reeseFootContactPoint001(
 bonePosition:Vector3,boneRotation:Quaternion,localSoleOffset:Vector3,
):Vector3{
 return bonePosition.add(localSoleOffset.applyRotationQuaternion(boneRotation));
}

/** Keep the accepted cover pose on its existing grounding probes. */
export function reeseFootGroundSamples001(
 gait:"idle"|"walk"|"run",lowCrouch:boolean,
 bindRelativeSoleYs:readonly number[],rotatedSoleYs:readonly number[],
):number[]{
 return gait==="idle"&&!lowCrouch
  ?[...bindRelativeSoleYs,...rotatedSoleYs]
  :[...bindRelativeSoleYs];
}

/**
 * Small sagittal-plane offsets for the default armed standing base.
 * Reese faces +Z: the right thigh advances and the left thigh supports behind.
 * Counter-rotation at each shin keeps the ankle/foot orientation level.
 */
export function reeseGunReadyLegAngle001(targetName:string):number{
 const name=keyOf(targetName);
 if(name.includes("rightupleg")||name.includes("rightthigh"))return -.12;
 if(name.includes("rightleg")||name.includes("rightcalf"))return .12;
 if(name.includes("leftupleg")||name.includes("leftthigh"))return .08;
 if(name.includes("leftleg")||name.includes("leftcalf"))return -.08;
 return 0;
}

/** Apply the authored gun-ready leg bias without touching torso/arm tracks. */
export function reeseGunReadyLegRotation001(targetName:string,rotation:Quaternion):Quaternion{
 const angle=reeseGunReadyLegAngle001(targetName);
 return angle===0?rotation.clone():rotation.clone().multiply(
  Quaternion.RotationAxis(new Vector3(1,0,0),angle));
}

function applyGunReadyLegStance001(
 animation:import("@babylonjs/core").Animation,targetName:string,
):import("@babylonjs/core").Animation{
 const angle=reeseGunReadyLegAngle001(targetName);
 if(!angle||!animation.targetProperty.toLowerCase().includes("rotation"))return animation;
 const keys=animation.getKeys().map(key=>{
  if(key.value instanceof Quaternion)
   return {...key,value:reeseGunReadyLegRotation001(targetName,key.value)};
  if(key.value instanceof Vector3)
   return {...key,value:new Vector3(key.value.x+angle,key.value.y,key.value.z)};
  return key;
 });
 animation.setKeys(keys);
 return animation;
}

export function reeseGroundClip001(
 speed:number,sprint:boolean,grounded:boolean,verticalVelocity:number,
):"idle"|"walk"|"run"|"jump"|"fall"{
 if(!grounded)return verticalVelocity<-.3?"fall":"jump";
 if(speed<=.15)return "idle";
 return sprint||speed>5.0?"run":"walk";
}

/** No involuntary airborne poses until an authored jump/fall mechanic exists. */
export function reeseSafeLocomotion007(speed:number,sprint:boolean):"idle"|"walk"|"run"{
 return speed<=.15?"idle":sprint||speed>5?"run":"walk";
}

/** Running and shooting are mutually exclusive in the third-person actor. */
export function reeseCanFire001(speed:number,sprint:boolean):boolean{
 return reeseSafeLocomotion007(speed,sprint)!=="run";
}

/**
 * Build one coherent full-body shot clip: lower-body tracks come from the
 * authored crouch pose/locomotion; upper-body tracks come from the weapon's
 * authored firing clip. This avoids blending two full-body clips together.
 */
/** Blend the authored deep-crouch lower-body keys toward Reese's neutral idle pose. */
function softenCrouchAnimation001(
 animation:import("@babylonjs/core").Animation,
 neutral:import("@babylonjs/core").Animation|null,
 weight=.38,
):import("@babylonjs/core").Animation{
 if(!neutral)return animation;
 const neutralValue=neutral.getKeys()[0]?.value;
 if(neutralValue===undefined)return animation;
 const keys=animation.getKeys().map(key=>{
  const value=key.value;
  let softened=value;
  if(value instanceof Quaternion&&neutralValue instanceof Quaternion)
   softened=Quaternion.Slerp(neutralValue,value,weight);
  else if(value instanceof Vector3&&neutralValue instanceof Vector3)
   softened=Vector3.Lerp(neutralValue,value,weight);
  return {...key,value:softened};
 });
 animation.setKeys(keys);
 return animation;
}

/**
 * Build one coherent full-body shot clip: lower-body tracks come from the
 * authored crouch pose/locomotion, softened toward neutral idle; upper-body
 * tracks come from the weapon's authored firing clip.
 */
function createCrouchedFireGroup001(
 scene:Scene,name:string,lower:AnimationGroup|null,upper:AnimationGroup|null,
 neutral:AnimationGroup|null,playTo?:number,crouchWeight=.38,gunReadyStance=false,
):AnimationGroup|null{
 if(!lower||!upper)return null;
 const group=new AnimationGroup(name,scene);
 const lowerTrack=/(hips|pelvis|upleg|leg|foot|toebase|spine)$/i;
 const upperTrack=/(spine1|spine2|neck|head|shoulder|arm|forearm|hand|thumb|index|middle|ring|pinky)\d*$/i;
 let lowerCount=0,upperCount=0;
 for(const entry of lower.targetedAnimations){
  const targetName=String((entry.target as {name?:string;id?:string}).name??
   (entry.target as {id?:string}).id??"");
  if(!lowerTrack.test(targetName))continue;
  const neutralTrack=neutral?.targetedAnimations.find(candidate=>
   String((candidate.target as {name?:string;id?:string}).name??
    (candidate.target as {id?:string}).id??"")===targetName);
  let softened=softenCrouchAnimation001(entry.animation.clone(),
   neutralTrack?.animation??null,crouchWeight);
  if(gunReadyStance)softened=applyGunReadyLegStance001(softened,targetName);
  group.addTargetedAnimation(softened,entry.target);
  lowerCount++;
 }
 for(const entry of upper.targetedAnimations){
  const targetName=String((entry.target as {name?:string;id?:string}).name??
   (entry.target as {id?:string}).id??"");
  if(!upperTrack.test(targetName))continue;
  group.addTargetedAnimation(entry.animation.clone(),entry.target);
  upperCount++;
 }
 if(!lowerCount||!upperCount){group.dispose();return null;}
 group.metadata={...(group.metadata??{}),playTo:playTo??upper.to};
 return group;
}

/** M4A1 and MPX-9 share Reese's authored two-handed long-gun animation set. */
export function reeseIsLongGun001(id:ReeseWeaponId001|null):boolean{
 return id==="m4a1"||id==="mpx9";
}
export function reeseLongGunClipKey001(
 gait:"idle"|"walk"|"run",sprint:boolean,
):"rifleCrouchAim"|"rifleCrouchWalk"|"rifleRun"|"rifleSprint"{
 if(sprint)return "rifleSprint";
 if(gait==="walk")return "rifleCrouchWalk";
 if(gait==="run")return "rifleRun";
 return "rifleCrouchAim";
}
export function createReesePlayer001(scene:Scene,
 load?:(path:string,scene:Scene)=>Promise<AssetContainer>,
){
 const anchor=new TransformNode("reese001-player-capsule-foot-origin",scene);
 let asset:AssetContainer|null=null;
 let instance:ReturnType<AssetContainer["instantiateModelsToScene"]>|null=null;
 let tilt:TransformNode|null=null;
 let offset:TransformNode|null=null;
 let fit:TransformNode|null=null;
 let fitBaseY=0,fitGroundCorrection=0,groundingEnabled=false;
 let groundingObserver:import("@babylonjs/core").Observer<Scene>|null=null;
 const footGroundOffsets:{bone:Bone;soleOffset:number}[]=[];
 const footGroundContactOffsets:{bone:Bone;localSoleOffset:Vector3}[]=[];
 let active:AnimationGroup|null=null;
 let outgoing:AnimationGroup|null=null;
 let transition=1;
 let controlled=false,hiddenDriving=false,closed=false;
 let flight=false,meshCount=0,boneCount=0;
 let flightPitch=0,flightRoll=0;
 let pendingGaitSeconds=0;
 let stableGait:"idle"|"walk"|"run"|"jump"|"fall"="idle";
 let pendingGait:"idle"|"walk"|"run"|"jump"|"fall"="idle";
 let handItem:"hand"|"gun"="hand";
 let lowCrouch=false;
 let selectedWeapon:ReeseWeaponId001|null=null;
 let weaponMount:Mesh|null=null;
 let supportHandBone:Bone|null=null;
 let supportHandReferenceMesh:AbstractMesh|null=null;
 let supportGripDiagnosticSeconds=0;
 const weaponRoots:Partial<Record<ReeseWeaponId001,TransformNode>>={};
 let firstPersonActive=false;
 const firstPersonHiddenMeshes:{mesh:AbstractMesh;visibility:number;isVisible:boolean}[]=[];
 const removedLegacyWeaponMeshes:string[]=[];
 const weaponPattern=/(?:^|[^a-z])(gun|pistol|weapon|revolver|firearm|handgun)(?:$|[^a-z])/i;
 const firstPersonHeadPattern=/(head|hair|eyebrow|eye|face|teeth|tongue)/i;
 let combatRemaining=0;
 let lastAttackAt=-Infinity;
 let currentGait:"idle"|"walk"|"run"="idle";
 let currentRunning=false;
 const composedGroups:AnimationGroup[]=[];
 let shotSerial=0,wasAirborne=false,takeoffRemaining=0,landingRemaining=0;
 const muzzleEffect=createReeseMuzzleSpark010(scene);
 function setFirstPersonPresentation(_camera:Camera|null,enabled:boolean){
  if(closed||enabled===firstPersonActive)return;
  firstPersonActive=enabled;
  // Keep the real Reese GLB, skeleton and weapon hand mount alive. Only hide
  // facial/head meshes on this local camera so the camera does not sit inside
  // Reese's face. Other clients retain the complete character representation.
  for(const entry of firstPersonHiddenMeshes){
   entry.mesh.visibility=enabled?0:entry.visibility;
   entry.mesh.isVisible=enabled?false:entry.isVisible;
  }
  anchor.setEnabled(controlled&&!hiddenDriving);
  applyWeaponVisibility();
 }
 function applyWeaponVisibility(){
  // One character and one weapon mount serve both camera modes. No duplicate
  // camera-space gun, substitute arms, or substitute hands are created.
  for(const [id,root] of Object.entries(weaponRoots))
   root?.setEnabled(handItem==="gun"&&selectedWeapon===id&&controlled&&!hiddenDriving);
 }
 const groups:Record<"idle"|"walk"|"run"|"jumpStart"|"jump"|"fall"|"land"|"punch"|"pistolAim"|"pistolFire"|"rifleIdle"|"rifleAim"|"rifleFire"|"rifleWalk"|"rifleRun"|"rifleSprint"|"rifleCrouchAim"|"rifleCrouchWalk"|"pistolCrouchAim"|"pistolCrouchWalk"|"rifleCrouchFire"|"rifleCrouchWalkFire"|"pistolCrouchFire"|"pistolCrouchWalkFire"|"rifleCrouchAimMinimal"|"rifleCrouchWalkMinimal"|"rifleCrouchFireMinimal"|"rifleCrouchWalkFireMinimal"|"pistolCrouchAimMinimal"|"pistolCrouchWalkMinimal"|"pistolCrouchFireMinimal"|"pistolCrouchWalkFireMinimal",AnimationGroup|null>={
  idle:null,walk:null,run:null,jumpStart:null,jump:null,fall:null,land:null,punch:null,
  pistolAim:null,pistolFire:null,rifleIdle:null,rifleAim:null,rifleFire:null,
  rifleWalk:null,rifleRun:null,rifleSprint:null,rifleCrouchAim:null,rifleCrouchWalk:null,
  pistolCrouchAim:null,pistolCrouchWalk:null,rifleCrouchFire:null,rifleCrouchWalkFire:null,
  pistolCrouchFire:null,pistolCrouchWalkFire:null,
  rifleCrouchAimMinimal:null,rifleCrouchWalkMinimal:null,
  rifleCrouchFireMinimal:null,rifleCrouchWalkFireMinimal:null,
  pistolCrouchAimMinimal:null,pistolCrouchWalkMinimal:null,
  pistolCrouchFireMinimal:null,pistolCrouchWalkFireMinimal:null,
 };
 const report={source:REESE_PLAYER_PATH_001,animations:0,scale:1,
  height:REESE_PLAYER_HEIGHT_001,activeClip:"idle"};

 const decodeId="asset:decode:reese-player-001";
 const instantiateId="asset:instantiate:reese-player-001";
 audit.start(decodeId,"Decode Reese (1).glb","asset",REESE_PLAYER_PATH_001);
 const ready=(async()=>{
  if(!load)await import("@babylonjs/loaders/glTF");
  const source=await (load?load(REESE_PLAYER_PATH_001,scene):
   loadAssetContainerAsync(REESE_PLAYER_PATH_001,scene));
  if(closed){source.dispose();return;}
  asset=source;
  audit.finish(decodeId,"Reese source GLB loaded");
  audit.start(instantiateId,"Instantiate rigged Agent Reese","asset");
  source.animationGroups.forEach(group=>group.stop());
  instance=source.instantiateModelsToScene(name=>"reese001:"+name,true);
  if(closed){instance.dispose();instance=null;return;}
  instance.animationGroups.forEach(group=>group.stop());
  report.animations=instance.animationGroups.length;
  boneCount=instance.skeletons.reduce((n,s)=>n+s.bones.length,0);
  if(!instance.skeletons.length||boneCount<60)
   throw Error("REESE-001 requires the exported skinned game rig");
  if(report.animations<REESE_PLAYER_EXPECTED_ANIMATIONS_001)
   throw Error("REESE-001 requires the 70 embedded animations; received "+report.animations);

  groups.idle=findReeseClip001(instance.animationGroups,"idle");
  groups.walk=findReeseClip001(instance.animationGroups,"walk");
  groups.run=findReeseClip001(instance.animationGroups,"run");
  groups.jumpStart=findReeseClip001(instance.animationGroups,"jump_start","Jump start");
  groups.jump=findReeseClip001(instance.animationGroups,"Jump (in air)","jump_air");
  if(!groups.jump)groups.jump=findReeseClip001(instance.animationGroups,"jump");
  groups.fall=findReeseClip001(instance.animationGroups,"fall","jump_air","jump");
  groups.land=findReeseClip001(instance.animationGroups,"jump_land");
  // Verified Ara 3D Gen clip ids: punch, pistol_aim, pistol_fire.
  // Source exports all 70 clips in this same Reese GLB; no second actor is loaded.
  groups.punch=findReeseClip001(instance.animationGroups,"punch");
  groups.pistolAim=findReeseClip001(instance.animationGroups,"pistol_aim","Pistol aim");
  groups.pistolFire=findReeseClip001(instance.animationGroups,"pistol_fire","Pistol fire");
  // These display names are authored by 3d-gen's shooter clip catalogue and
  // exported verbatim into the existing Reese GLB. The clips bake both-arm IK.
  groups.rifleIdle=findReeseClip001(instance.animationGroups,"rifle_idle","Rifle idle (low ready)");
  groups.rifleAim=findReeseClip001(instance.animationGroups,"rifle_aim","Rifle aim idle");
  groups.rifleFire=findReeseClip001(instance.animationGroups,"rifle_fire","Rifle fire (single)");
  groups.rifleWalk=findReeseClip001(instance.animationGroups,"rifle_walk","Rifle walk (aiming)");
  groups.rifleRun=findReeseClip001(instance.animationGroups,"rifle_run","Rifle run");
  groups.rifleSprint=findReeseClip001(instance.animationGroups,"rifle_sprint","Rifle sprint");
  groups.rifleCrouchAim=findReeseClip001(instance.animationGroups,
   "rifle_crouch_aim","Crouch aim idle","Rifle crouch aim");
  groups.rifleCrouchWalk=findReeseClip001(instance.animationGroups,
   "rifle_crouch_walk","Crouch walk (aiming)","Rifle crouch walk");
  if(!groups.rifleCrouchAim||!groups.rifleCrouchWalk)
   console.warn("[COMBAT-001] Reese GLB is missing one or more authored crouch clips",{
    crouchAim:groups.rifleCrouchAim?.name??null,
    crouchWalk:groups.rifleCrouchWalk?.name??null,
   });
  groups.pistolCrouchAim=createCrouchedFireGroup001(scene,"reese-pistol-crouch-aim",
   groups.rifleCrouchAim,groups.pistolAim,groups.idle,groups.rifleCrouchAim?.to);
  groups.pistolCrouchWalk=createCrouchedFireGroup001(scene,"reese-pistol-crouch-walk",
   groups.rifleCrouchWalk,groups.pistolAim,groups.idle,groups.rifleCrouchWalk?.to);
  // The default armed stance uses a restrained 12% crouch contribution.
  groups.rifleCrouchAimMinimal=createCrouchedFireGroup001(scene,"reese-rifle-crouch-aim-minimal",groups.rifleCrouchAim,groups.rifleAim,groups.idle,groups.rifleAim?.to,.12,true);
  groups.rifleCrouchWalkMinimal=createCrouchedFireGroup001(scene,"reese-rifle-crouch-walk-minimal",groups.rifleCrouchWalk,groups.rifleWalk,groups.idle,groups.rifleWalk?.to,.12);
  groups.rifleCrouchFireMinimal=createCrouchedFireGroup001(scene,"reese-rifle-crouch-fire-minimal",groups.rifleCrouchAim,groups.rifleFire,groups.idle,undefined,.12,true);
  groups.rifleCrouchWalkFireMinimal=createCrouchedFireGroup001(scene,"reese-rifle-crouch-walk-fire-minimal",groups.rifleCrouchWalk,groups.rifleFire,groups.idle,undefined,.12);
  groups.pistolCrouchAimMinimal=createCrouchedFireGroup001(scene,"reese-pistol-crouch-aim-minimal",groups.rifleCrouchAim,groups.pistolAim,groups.idle,groups.pistolAim?.to,.12,true);
  groups.pistolCrouchWalkMinimal=createCrouchedFireGroup001(scene,"reese-pistol-crouch-walk-minimal",groups.rifleCrouchWalk,groups.pistolAim,groups.idle,groups.pistolAim?.to,.12);
  groups.pistolCrouchFireMinimal=createCrouchedFireGroup001(scene,"reese-pistol-crouch-fire-minimal",groups.rifleCrouchAim,groups.pistolFire,groups.idle,undefined,.12,true);
  groups.pistolCrouchWalkFireMinimal=createCrouchedFireGroup001(scene,"reese-pistol-crouch-walk-fire-minimal",groups.rifleCrouchWalk,groups.pistolFire,groups.idle,undefined,.12);
  groups.rifleCrouchFire=createCrouchedFireGroup001(scene,"reese-rifle-crouch-fire",
   groups.rifleCrouchAim,groups.rifleFire,groups.idle);
  groups.rifleCrouchWalkFire=createCrouchedFireGroup001(scene,"reese-rifle-crouch-walk-fire",
   groups.rifleCrouchWalk,groups.rifleFire,groups.idle);
  groups.pistolCrouchFire=createCrouchedFireGroup001(scene,"reese-pistol-crouch-fire",
   groups.rifleCrouchAim,groups.pistolFire,groups.idle);
  groups.pistolCrouchWalkFire=createCrouchedFireGroup001(scene,"reese-pistol-crouch-walk-fire",
   groups.rifleCrouchWalk,groups.pistolFire,groups.idle);
  for(const group of [groups.pistolCrouchAim,groups.pistolCrouchWalk,
   groups.rifleCrouchFire,groups.rifleCrouchWalkFire,
   groups.pistolCrouchFire,groups.pistolCrouchWalkFire,
  groups.rifleCrouchAimMinimal,groups.rifleCrouchWalkMinimal,groups.rifleCrouchFireMinimal,groups.rifleCrouchWalkFireMinimal,
  groups.pistolCrouchAimMinimal,groups.pistolCrouchWalkMinimal,groups.pistolCrouchFireMinimal,groups.pistolCrouchWalkFireMinimal])
   if(group)composedGroups.push(group);
  console.info("[LMS-GUN-002] Reese long-gun clip binding",{
   rifleIdle:groups.rifleIdle?.name??null,rifleAim:groups.rifleAim?.name??null,
   rifleFire:groups.rifleFire?.name??null,rifleWalk:groups.rifleWalk?.name??null,
   rifleRun:groups.rifleRun?.name??null,rifleSprint:groups.rifleSprint?.name??null,
  });
  if(!groups.rifleIdle||!groups.rifleAim||!groups.rifleFire)
   console.warn("[LMS-GUN-002] Required Reese rifle clips are incomplete; long-gun presentation will use available rifle clips only.",{
    idle:!!groups.rifleIdle,aim:!!groups.rifleAim,fire:!!groups.rifleFire,
    available:instance.animationGroups.map(group=>group.name),
   });
  if(!groups.jump||!groups.land)console.warn("[POI-010] Missing jump phases",instance.animationGroups.map(g=>g.name));
  if(!groups.punch||!groups.pistolAim||!groups.pistolFire)
   console.warn("[POI-009] combat animation group missing in Reese export",{
    punch:!!groups.punch,aim:!!groups.pistolAim,fire:!!groups.pistolFire,
    available:instance.animationGroups.map(group=>group.name),
   });
  if(!groups.idle||!groups.walk||!groups.run)
   throw Error("REESE-001 missing embedded idle/walk/run clips: "+
    instance.animationGroups.map(a=>a.name).join(", "));

  // A child-only visual pitch/roll pivot preserves the fixed collision body.
  tilt=new TransformNode("reese001-flight-pivot",scene);
  tilt.parent=anchor;tilt.position.y=.92;
  offset=new TransformNode("reese001-flight-offset",scene);
  offset.parent=tilt;offset.position.y=-.92;
  fit=new TransformNode("reese001-visual-fit",scene);
  fit.parent=offset;
  for(const root of instance.rootNodes)root.parent=fit;
  const meshes=new Set<AbstractMesh>();
  for(const root of instance.rootNodes){
   if(root instanceof AbstractMesh)meshes.add(root);
   for(const child of root.getChildMeshes(false))meshes.add(child);
  }
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for(const mesh of meshes){
   if(mesh.getTotalVertices()<=0)continue;
   mesh.computeWorldMatrix(true);
   const names=[mesh.name];
   let parent=mesh.parent;
   while(parent){names.push(parent.name);parent=parent.parent;}
   const namedWeapon=names.some(name=>weaponPattern.test(name));
   const mats=mesh.material instanceof MultiMaterial
    ?mesh.material.subMaterials.filter((m):m is Material=>m!==null)
    :mesh.material?[mesh.material]:[];
   const materialWeapon=mats.some(material=>weaponPattern.test(material.name));
   if(namedWeapon||materialWeapon){
    // Remove the embedded default pistol geometry, rather than merely hiding
    // it or changing a potentially shared material's alpha.
    removedLegacyWeaponMeshes.push(mesh.name);
    mesh.dispose(false,false);
    continue;
   }
   if(firstPersonHeadPattern.test(names.join(" "))||
    mats.some(material=>firstPersonHeadPattern.test(material.name))){
    firstPersonHiddenMeshes.push({mesh,visibility:mesh.visibility,isVisible:mesh.isVisible});
    if(firstPersonActive){mesh.visibility=0;mesh.isVisible=false;}
   }
   const box=mesh.getBoundingInfo().boundingBox;
   minX=Math.min(minX,box.minimumWorld.x);
   minY=Math.min(minY,box.minimumWorld.y);
   minZ=Math.min(minZ,box.minimumWorld.z);
   maxX=Math.max(maxX,box.maximumWorld.x);
   maxY=Math.max(maxY,box.maximumWorld.y);
   maxZ=Math.max(maxZ,box.maximumWorld.z);
   mesh.isPickable=false;mesh.receiveShadows=true;
   meshCount++;
  }
  if(removedLegacyWeaponMeshes.length){
   console.info("[LMS-GUN-001] Removed embedded legacy weapon meshes",removedLegacyWeaponMeshes);
  }else{
   console.warn("[LMS-GUN-001] No legacy weapon mesh matched the import-name/material filter; inspect Reese GLB hierarchy before accepting pistol removal.");
  }
  const h=maxY-minY;
  if(!meshCount||!Number.isFinite(h)||h<.05)
   throw Error("REESE-001 invalid GLB geometry or bounds");
  const scale=REESE_PLAYER_HEIGHT_001/h;
  if(!Number.isFinite(scale)||scale<=0||scale>100)
   throw Error("REESE-001 invalid avatar scale");
  report.scale=scale;
  fit.scaling.setAll(scale);
  // Ara exports +Y up, +Z forward. No Voight-specific PI flip.
  fit.position.set(-(minX+maxX)*.5*scale,-minY*scale,-(minZ+maxZ)*.5*scale);
  const bones=instance.skeletons.flatMap(skeleton=>skeleton.bones);
  fitBaseY=fit.position.y;
  fitGroundCorrection=0;
  // Link a stable Babylon transform to Reese's actual right-hand bone. The
  // procedural LMS weapons use the web-of-thumb as their local origin.
  const rightHand=bones.find(bone=>/(right.?hand|hand[._:-]?r|r[._:-]?hand)$/i.test(bone.name));
  const leftHand=bones.find(bone=>/(left.?hand|hand[._:-]?l|l[._:-]?hand)$/i.test(bone.name));
  if(rightHand){
   const handSkeleton=rightHand.getSkeleton();
   const referenceMesh=[...meshes]
    .filter(mesh=>mesh.skeleton===handSkeleton&&mesh.getTotalVertices()>0)
    .sort((a,b)=>b.getTotalVertices()-a.getTotalVertices())[0];
   if(!referenceMesh)throw Error("REESE-001 right-hand skeleton has no skinned reference mesh");
   supportHandBone=leftHand??null;
   supportHandReferenceMesh=referenceMesh;
   if(!supportHandBone)console.warn("[LMS-GUN-002] Reese left-hand bone was not found; support-grip alignment cannot be measured.");
   // attachToBone keeps the GLB's existing linked bone TransformNode intact.
   // The mount has no geometry; it only provides a rigid parent for the guns.
   weaponMount=new Mesh("reese-lms-right-hand-mount",scene);
   weaponMount.isPickable=false;weaponMount.checkCollisions=false;
   weaponMount.attachToBone(rightHand,referenceMesh);
   // Prebuild once: rapid taps only switch visibility and never allocate meshes.
   for(const id of ["m4a1","mpx9","p19"] as const){
    const root=createReeseWeapon001(scene,id);
    root.parent=weaponMount;
    root.setEnabled(false);
    weaponRoots[id]=root;
   }
  }else{
   console.error("[LMS-GUN-001] Reese right-hand bone was not found; extracted weapons will remain unequipped.");
  }
  // Preserve the original ankle/toe scalar probes for movement and cover.
  const legacyFootBones=["left","right"].flatMap(side=>
   ["foot","toe"].map(part=>bones.find(bone=>
    new RegExp(side+".*"+part+"|"+part+".*"+side,"i").test(bone.name))))
   .filter((bone):bone is Bone=>bone!==undefined);
  // Add rotation-aware contact points under each foot, toe base and toe tip
  // for a stationary standing pose, where foot rotation can bury the sole
  // even while the ankle/toe joint origins remain above the floor.
  const contactFootBones=["left","right"].flatMap(side=>
   ["foot","toeBase","toeEnd"].map(part=>bones.find(bone=>
    keyOf(bone.name)===keyOf(side+part))))
   .filter((bone):bone is Bone=>bone!==undefined);
  // The Rapier capsule remains authoritative; only the rendered rig is lifted.
  if(supportHandReferenceMesh&&legacyFootBones.length&&contactFootBones.length){
   fit.computeWorldMatrix(true);
   supportHandReferenceMesh.computeWorldMatrix(true);
   for(const bone of legacyFootBones){
    const bindFoot=bone.getAbsolutePosition(supportHandReferenceMesh);
    footGroundOffsets.push({bone,soleOffset:bindFoot.y-anchor.position.y});
   }
   for(const bone of contactFootBones){
    const bindFoot=bone.getPosition(Space.WORLD,supportHandReferenceMesh);
    const bindRotation=bone.getRotationQuaternion(Space.WORLD,supportHandReferenceMesh)??Quaternion.Identity();
    const bindFloorPoint=new Vector3(bindFoot.x,anchor.position.y,bindFoot.z);
    const localSoleOffset=bindFloorPoint.subtract(bindFoot)
     .applyRotationQuaternion(Quaternion.Inverse(bindRotation));
    footGroundContactOffsets.push({bone,localSoleOffset});
   }
   groundingObserver=scene.onBeforeRenderObservable.add(()=>{
    if(!fit||!supportHandReferenceMesh||!groundingEnabled||!controlled||
     hiddenDriving||flight){
     if(fit&&fitGroundCorrection!==0){
      fitGroundCorrection=0;fit.position.y=fitBaseY;
     }
     return;
    }
    fit.computeWorldMatrix(true);
    supportHandReferenceMesh.computeWorldMatrix(true);
    const legacySoleYs=footGroundOffsets.map(({bone,soleOffset})=>
     bone.getAbsolutePosition(supportHandReferenceMesh!).y-soleOffset);
    const rotatedSoleYs=footGroundContactOffsets.map(({bone,localSoleOffset})=>{
     const bonePosition=bone.getPosition(Space.WORLD,supportHandReferenceMesh!);
     const boneRotation=bone.getRotationQuaternion(Space.WORLD,supportHandReferenceMesh!)??Quaternion.Identity();
     return reeseFootContactPoint001(bonePosition,boneRotation,localSoleOffset).y;
    });
    const soleYs=reeseFootGroundSamples001(currentGait,lowCrouch,legacySoleYs,rotatedSoleYs);
    fitGroundCorrection=reeseFootGroundCorrection001(
     anchor.position.y,soleYs,fitGroundCorrection);
    fit.position.y=fitBaseY+fitGroundCorrection;
    fit.computeWorldMatrix(true);
    supportHandReferenceMesh.computeWorldMatrix(true);
   });
  }else{
   console.warn("[REESE-001] Animated foot grounding unavailable: left/right foot bones or skinned reference mesh missing.");
  }
  // Limit only imported PBR shader light count, not city lights.
  for(const m of source.materials){
   if(!m.getClassName().startsWith("PBR"))continue;
   const pbr=m as Material&{maxSimultaneousLights?:number};
   if(typeof pbr.maxSimultaneousLights==="number"&&pbr.maxSimultaneousLights>4){
    pbr.maxSimultaneousLights=4;
    m.markAsDirty(Material.LightDirtyFlag);
   }
  }
  // Hide the legacy embedded pistol; the three extracted LMS models are
  // prebuilt and managed by the right-hand mount above.
   applyWeaponVisibility();
   if(!Object.keys(weaponRoots).length)
    console.warn("[LMS-GUN-001] Extracted weapons unavailable: Reese's right-hand bone was not found.");
   active=groups.idle;
  active.start(true);
  report.activeClip=active.name;
  anchor.setEnabled(controlled&&!hiddenDriving);
  if(firstPersonHiddenMeshes.length===0)console.warn("[LMS-FPV-001] Reese head mesh was not identified by name/material; inspect first-person camera clipping.");
  audit.finish(instantiateId,`${meshCount} meshes; ${boneCount} rig bones; ${report.animations} embedded clips`);
  console.info("[REESE-001] playable GLB ready",report);
 })().catch(error=>{
  audit.fail(decodeId,error);audit.fail(instantiateId,error);
  throw error;
 });

 function play(group:AnimationGroup|null,loop=true,immediate=false){
  if(!group||closed||active===group)return;
  if(immediate){
   outgoing?.stop();outgoing=null;
   active?.stop();
   active=group;
   active.start(loop,1,0,Number(active.metadata?.playTo??active.to));
   active.setWeightForAllAnimatables(1);
   transition=1;
   report.activeClip=active.name;
   return;
  }
  outgoing?.stop();
  outgoing=active;
  active=group;
  active.start(loop,1,0,Number(active.metadata?.playTo??active.to));
  active.setWeightForAllAnimatables(0);
  transition=0;
  report.activeClip=active.name;
 }
 function muzzleWorld():Vector3|null{
  const root=selectedWeapon?weaponRoots[selectedWeapon]:null;
  if(root&&!root.isDisposed()){
   root.computeWorldMatrix(true);
   const muzzle=root.metadata?.muzzle as number[]|undefined;
   if(muzzle&&muzzle.length>=3){
    const point=Vector3.TransformCoordinates(
     new Vector3(muzzle[0]??0,muzzle[1]??0,muzzle[2]??0),root.getWorldMatrix());
    if(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.z))return point;
   }
  }
  return null;
 }
 function advance(dt:number){
  if(!active)return;
  if(outgoing){
   transition=Math.min(1,transition+Math.max(0,dt)/.075);
   active.setWeightForAllAnimatables(transition);
   outgoing.setWeightForAllAnimatables(1-transition);
   if(transition>=1){outgoing.stop();outgoing=null;}
  }
 }
 function selectWeapon(id:"hand"|ReeseWeaponId001){
  combatRemaining=0;muzzleEffect.clear();
  if(id==="hand"){
   handItem="hand";
  }else if(weaponMount&&weaponRoots[id]){
   selectedWeapon=id;handItem="gun";
  }else{
   console.error("[LMS-GUN-001] Cannot equip "+id+": right-hand mount unavailable.");
   handItem="hand";
  }
  supportGripDiagnosticSeconds=0;
  alignWeaponMountToCharacterForward();
  applyWeaponVisibility();
  if(handItem==="gun"){
   if(reeseIsLongGun001(selectedWeapon))
    play(groups.rifleCrouchAimMinimal??groups.rifleCrouchAim??groups.rifleAim??groups.rifleIdle??groups.idle);
   else play(groups.pistolCrouchAimMinimal??groups.pistolCrouchAim??groups.pistolAim??groups.idle);
  }else{lowCrouch=false;play(groups.idle);}
 }
 function resetFlight(){
  flight=false;flightPitch=0;flightRoll=0;
  if(tilt)tilt.rotation.set(0,0,0);
 }
 function positionAt(p:{x:number;y:number;z:number},yaw:number){
  anchor.position.set(p.x,p.y-.92,p.z);
  anchor.rotation.y=yaw;
 }
 let weaponGripDiagnosticsLogged=false;
 function reportSupportGripAlignment(dt:number){
  if(handItem!=="gun"||!reeseIsLongGun001(selectedWeapon)||
   !supportHandBone||!supportHandReferenceMesh||!selectedWeapon)return;
  supportGripDiagnosticSeconds+=Math.max(0,dt);
  if(supportGripDiagnosticSeconds<1)return;
  supportGripDiagnosticSeconds=0;
  const root=weaponRoots[selectedWeapon];
  const grip=root?.metadata?.gripL as number[]|null|undefined;
  if(!root||!grip||grip.length<3)return;
  root.computeWorldMatrix(true);
  supportHandReferenceMesh.computeWorldMatrix(true);
  const target=Vector3.TransformCoordinates(
   new Vector3(grip[0]??0,grip[1]??0,grip[2]??0),root.getWorldMatrix());
  const wrist=supportHandBone.getAbsolutePosition(supportHandReferenceMesh);
  const error=Vector3.Distance(wrist,target);
  const result={weapon:selectedWeapon,errorMetres:Number(error.toFixed(4))};
  if(error>.04)console.warn("[LMS-GUN-002] Support wrist is not on authored gripL target",result);
  else console.info("[LMS-GUN-002] Support wrist/gripL alignment",result);
 }
 function alignWeaponMountToCharacterForward(){
  if(!weaponMount)return;
  weaponMount.computeWorldMatrix(true);
  const forward=new Vector3(Math.sin(anchor.rotation.y),0,Math.cos(anchor.rotation.y));
  const solved=solveReeseWeaponMountRotation001(weaponMount.getWorldMatrix(),forward);
  for(const root of Object.values(weaponRoots)){
   if(!root)continue;
   root.rotationQuaternion=solved.clone();
   const grip=root.metadata?.gripR as number[]|undefined;
   if(!grip||grip.length<3)throw Error("LMS weapon is missing its authored gripR landmark");
   const gripOffset=new Vector3(grip[0]??0,grip[1]??0,grip[2]??0);
   // Place the grip landmark at the hand-mount origin without changing
   // the solved weapon orientation: p + Qg = 0.
   root.position.copyFrom(solveReeseWeaponGripOffset001(gripOffset,solved));
  }
  if(!weaponGripDiagnosticsLogged){
   weaponMount.computeWorldMatrix(true);
   const handWorld=weaponMount.getAbsolutePosition().clone();
   const measurements:Record<string,{hand:[number,number,number];grip:[number,number,number];error:number}>={};
   for(const [id,root] of Object.entries(weaponRoots)){
    if(!root)continue;
    root.computeWorldMatrix(true);
    const grip=root.metadata?.gripR as number[];
    const gripWorld=Vector3.TransformCoordinates(new Vector3(grip[0]??0,grip[1]??0,grip[2]??0),root.getWorldMatrix());
    measurements[id]={hand:[handWorld.x,handWorld.y,handWorld.z],
     grip:[gripWorld.x,gripWorld.y,gripWorld.z],
     error:Vector3.Distance(handWorld,gripWorld)};
   }
   console.info("[LMS-GUN-001] Runtime hand/grip alignment (world metres)",measurements);
   weaponGripDiagnosticsLogged=true;
  }
 }
 return {
  anchor,ready,
  setFirstPersonPresentation,
  setControlled(enabled:boolean){
   if(closed)return;
   controlled=enabled;hiddenDriving=false;groundingEnabled=enabled;combatRemaining=0;
   wasAirborne=false;takeoffRemaining=0;landingRemaining=0;muzzleEffect.clear();
   anchor.setEnabled(enabled&&!hiddenDriving);
   if(enabled){resetFlight();play(groups.idle);}
   applyWeaponVisibility();
  },
  setDrivingHidden(hidden:boolean){
   if(closed||!controlled)return;
   hiddenDriving=hidden;
   if(hidden)muzzleEffect.clear();
   anchor.setEnabled(!hidden);
   applyWeaponVisibility();
  },
  syncHiddenDrivingPose(p:{x:number;y:number;z:number},yaw:number){
   if(closed||!controlled||!hiddenDriving)return;
   positionAt(p,yaw);
   alignWeaponMountToCharacterForward();
  },
  updateControlled(
   p:{x:number;y:number;z:number},yaw:number,speed:number,dt:number,
   sprint=false,grounded=true,verticalVelocity=0,
  ){
   if(!controlled||closed)return;
   if(flight)resetFlight();
   groundingEnabled=grounded&&verticalVelocity<=.65;
   positionAt(p,yaw);
   alignWeaponMountToCharacterForward();
   const next=reeseSafeLocomotion007(speed,sprint);
   currentGait=next;
   currentRunning=!reeseCanFire001(speed,sprint);
   const interruptedShot=currentRunning&&combatRemaining>0;
   if(interruptedShot)combatRemaining=0;
   reportSupportGripAlignment(dt);
   muzzleEffect.update(dt);
   // The Rapier capsule determines physical Y; glTF clips only articulate bones.
   const airborne=!grounded||verticalVelocity>.65;
   if(airborne){
    landingRemaining=0;
    if(!wasAirborne){
     wasAirborne=true;takeoffRemaining=verticalVelocity>.7 ? .15 : 0;
     play(takeoffRemaining>0?(groups.jumpStart??groups.jump):(groups.fall??groups.jump),takeoffRemaining<=0);
    }
    if(takeoffRemaining>0){
     takeoffRemaining=Math.max(0,takeoffRemaining-dt);
     if(takeoffRemaining===0)play(groups.jump??groups.fall);
    }else play(verticalVelocity<-.45?(groups.fall??groups.jump):(groups.jump??groups.fall));
    advance(dt);return;
   }
   if(wasAirborne){
    wasAirborne=false;takeoffRemaining=0;landingRemaining=groups.land ? .35 : 0;
    if(groups.land)play(groups.land,false);
   }
   if(landingRemaining>0){
    landingRemaining=Math.max(0,landingRemaining-dt);
    if(landingRemaining>0){advance(dt);return;}
   }
   if(next===stableGait){pendingGait=next;pendingGaitSeconds=0;}
   else if(stableGait==="idle"&&next!=="idle"){
    // Begin the alternating first step on the same frame as movement.
    stableGait=next;pendingGait=next;pendingGaitSeconds=0;
   }else if(next!==pendingGait){pendingGait=next;pendingGaitSeconds=0;}
   else if((pendingGaitSeconds+=Math.max(0,dt))>=.15){
    stableGait=next;pendingGaitSeconds=0;
   }
   if(combatRemaining>0){
    combatRemaining=Math.max(0,combatRemaining-Math.max(0,dt));
    if(combatRemaining>0){advance(dt);return;}
   }
   if(handItem==="gun"&&reeseIsLongGun001(selectedWeapon)){
    const key=reeseLongGunClipKey001(currentGait,sprint);
    const target=currentRunning?(groups[key]??groups.rifleRun):
     currentGait==="walk"
      ?(lowCrouch?groups.rifleCrouchWalk:groups.rifleCrouchWalkMinimal)??groups.rifleWalk
      :(lowCrouch?groups.rifleCrouchAim:groups.rifleCrouchAimMinimal)??groups.rifleAim??groups.idle;
    play(target,true,interruptedShot);
   }else if(handItem==="gun"&&!currentRunning){
    const target=currentGait==="walk"
     ?(lowCrouch?groups.pistolCrouchWalk:groups.pistolCrouchWalkMinimal)??groups.pistolAim??groups.walk
     :(lowCrouch?groups.pistolCrouchAim:groups.pistolCrouchAimMinimal)??groups.pistolAim??groups.idle;
    play(target,true,interruptedShot);
   }else{
    play(currentRunning?(groups.run??groups.idle):(groups[stableGait]??groups.idle),
    true,interruptedShot);
   }
   advance(dt);
  },
  updateControlledFlight(
   p:{x:number;y:number;z:number},yaw:number,
   input:FlightPoseInput&{dt:number},
  ){
   if(!controlled||closed)return;
   flight=true;groundingEnabled=false;
   positionAt(p,yaw);
   // Owner requested no Reese flying animation. Preserve only movement physics.
   resetFlight();
   play(groups.idle);
   advance(input.dt);
  },
  setWeapon(id:"hand"|ReeseWeaponId001){
   selectWeapon(id);
  },
  setHandItem(item:"hand"|"gun"){
   selectWeapon(item==="hand"?"hand":selectedWeapon??"m4a1");
   if(item==="hand")lowCrouch=false;
  },
  setLowCrouch(enabled:boolean){
   lowCrouch=handItem==="gun"&&enabled;
  },
  /** Animation-and-audio-only: never performs damage, rays or projectile simulation. */
  triggerCombat(): "punch"|"shoot"|null {
   if(!controlled||closed||hiddenDriving||flight||wasAirborne||landingRemaining>0||
    (handItem==="gun"&&currentRunning))return null;
   const attack=handItem==="gun"?"shoot":"punch";
   const moving=currentGait==="walk";
   const clip=attack==="shoot"
    ?(reeseIsLongGun001(selectedWeapon)
      ?(lowCrouch?(moving?groups.rifleCrouchWalkFire:groups.rifleCrouchFire):
        (moving?groups.rifleCrouchWalkFireMinimal:groups.rifleCrouchFireMinimal))??groups.rifleFire
      :(lowCrouch?(moving?groups.pistolCrouchWalkFire:groups.pistolCrouchFire):
        (moving?groups.pistolCrouchWalkFireMinimal:groups.pistolCrouchFireMinimal))??groups.pistolFire)
    :groups.punch;
   if(!clip)return null;
   const now=typeof performance!=="undefined"?performance.now():Date.now();
   if(attack==="punch"&&(combatRemaining>0||now-lastAttackAt<550))return null;
   if(attack==="shoot"&&now-lastAttackAt<12)return null;
   if(attack==="shoot"){
    const muzzle=muzzleWorld();if(!muzzle)return null;
    shotSerial++;
    // Rapid distinct taps restart one existing clip, never stack animation groups.
    if(active===clip){outgoing?.stop();outgoing=null;clip.stop();clip.start(false);
      clip.setWeightForAllAnimatables(1);transition=1;}
    else play(clip,false);
    muzzleEffect.emit(muzzle,anchor.rotation.y,selectedWeapon??"m4a1");
    combatRemaining=.10;
   }else{combatRemaining=.55;play(clip,false);}
   lastAttackAt=now;
   return attack;
  },
  get combatReady(){return !!groups.punch&&!!groups.pistolAim&&!!groups.pistolFire;},
  get shotsFired(){return shotSerial;},
  clearCombatFX(){
   muzzleEffect.clear();
  },
  get handItem(){return handItem;},
  get lowCrouch(){return lowCrouch;},
  get poseReport(){
   return {meshCount,boneCount,animations:report.animations,
    activeClip:report.activeClip,scale:report.scale,controlled};
  },
  dispose(){
   if(closed)return;
   closed=true;
   if(groundingObserver)scene.onBeforeRenderObservable.remove(groundingObserver);
   active?.stop();outgoing?.stop();muzzleEffect.dispose();
   for(const group of composedGroups){group.stop();group.dispose();}
   composedGroups.length=0;
   weaponMount?.dispose(false,true);weaponMount=null;
   for(const id of Object.keys(weaponRoots) as ReeseWeaponId001[])delete weaponRoots[id];
   instance?.dispose();instance=null;
   asset?.dispose();asset=null;
   fit?.dispose();offset?.dispose();tilt?.dispose();
   anchor.dispose();
  },
 };
}
