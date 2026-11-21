/**
 * REESE-001 — playable Agent Reese from the owner's GLB.
 *
 * This is intentionally NOT the CHAR-109/110 Voight retarget path: that path
 * calibrates fixed joint names in character.glb. Reese is an Ara/Mixamo game
 * rig with authored embedded clips. Reuse the accepted North Heights Rapier
 * capsule and controller; replace only the visual actor and its clip driver.
 */
import {
  AbstractMesh, AnimationGroup, Camera, Color3, Material, Matrix, Mesh, MeshBuilder, MultiMaterial,
  Quaternion, StandardMaterial, TransformNode, loadAssetContainerAsync,
  Vector3, type AssetContainer, type Scene,
} from "@babylonjs/core";
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
export function createReesePlayer001(scene:Scene,
 load?:(path:string,scene:Scene)=>Promise<AssetContainer>,
){
 const anchor=new TransformNode("reese001-player-capsule-foot-origin",scene);
 let asset:AssetContainer|null=null;
 let instance:ReturnType<AssetContainer["instantiateModelsToScene"]>|null=null;
 let tilt:TransformNode|null=null;
 let offset:TransformNode|null=null;
 let fit:TransformNode|null=null;
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
 let selectedWeapon:ReeseWeaponId001|null=null;
 let weaponMount:Mesh|null=null;
 const weaponRoots:Partial<Record<ReeseWeaponId001,TransformNode>>={};
 let firstPersonRoot:TransformNode|null=null;
 let firstPersonActive=false;
 const firstPersonWeapons:Partial<Record<ReeseWeaponId001,TransformNode>>={};
 const firstPersonParts:Partial<Record<ReeseWeaponId001,Mesh[]>>={};
 const firstPersonMaterials:StandardMaterial[]=[];
 let combatRemaining=0;
 let lastAttackAt=-Infinity;
 let shotSerial=0,wasAirborne=false,takeoffRemaining=0,landingRemaining=0;
 const muzzleEffect=createReeseMuzzleSpark010(scene);
 const removedLegacyWeaponMeshes:string[]=[];
 const weaponPattern=/(?:^|[^a-z])(gun|pistol|weapon|revolver|firearm|handgun)(?:$|[^a-z])/i;
 function buildFirstPersonViewmodel(camera:Camera){
  if(firstPersonRoot)return;
  firstPersonRoot=new TransformNode("reese001-first-person-viewmodel",scene);
  firstPersonRoot.parent=camera;
  firstPersonRoot.position.set(0,0,0);
  firstPersonRoot.rotation.set(0,0,0);
  const sleeve=new StandardMaterial("reese001-fpv-sleeve",scene);
  sleeve.diffuseColor=Color3.FromHexString("#202831");
  sleeve.specularColor=new Color3(.12,.14,.16);
  const glove=new StandardMaterial("reese001-fpv-glove",scene);
  glove.diffuseColor=Color3.FromHexString("#101418");
  glove.specularColor=new Color3(.08,.08,.08);
  firstPersonMaterials.push(sleeve,glove);
  const addArm=(id:ReeseWeaponId001,start:Vector3,end:Vector3)=>{
   const delta=end.subtract(start),length=delta.length();
   if(length<.08)return null;
   const mesh=MeshBuilder.CreateCapsule("reese001-fpv-"+id+"-sleeve",{
    height:length+.12,radius:.072,tessellation:8,
   },scene);
   mesh.parent=firstPersonRoot;
   mesh.position.copyFrom(start.add(end).scale(.5));
   const rotation=new Quaternion();
   Quaternion.FromUnitVectorsToRef(Vector3.Up(),delta.normalize(),rotation);
   mesh.rotationQuaternion=rotation;
   mesh.material=sleeve;
   mesh.renderingGroupId=1;mesh.isPickable=false;mesh.checkCollisions=false;
   return mesh;
  };
  const addGlove=(id:ReeseWeaponId001,position:Vector3)=>{
   const mesh=MeshBuilder.CreateSphere("reese001-fpv-"+id+"-glove",{diameter:.15,segments:8},scene);
   mesh.parent=firstPersonRoot;
   mesh.position.copyFrom(position);
   mesh.scaling.set(1,.78,1.22);
   mesh.material=glove;
   mesh.renderingGroupId=1;mesh.isPickable=false;mesh.checkCollisions=false;
   return mesh;
  };
  const rotation=Quaternion.RotationAxis(Vector3.Up(),Math.PI);
  const rotationMatrix=Matrix.Identity();
  rotation.toRotationMatrix(rotationMatrix);
  for(const id of ["m4a1","mpx9","p19"] as const){
   const weapon=createReeseWeapon001(scene,id);
   weapon.parent=firstPersonRoot;
   weapon.rotationQuaternion=rotation.clone();
   const grip=weapon.metadata?.gripR as number[]|undefined;
   if(!grip||grip.length<3)throw Error("REESE-001 first-person weapon missing gripR");
   const rightTarget=new Vector3(.205,-.265,.72);
   const gripVector=new Vector3(grip[0]??0,grip[1]??0,grip[2]??0);
   weapon.position.copyFrom(rightTarget.add(solveReeseWeaponGripOffset001(gripVector,rotation)));
   weapon.computeWorldMatrix(true);
   const gripL=weapon.metadata?.gripL as number[]|null|undefined;
   const leftTarget=gripL&&gripL.length>=3
    ?weapon.position.add(Vector3.TransformNormal(new Vector3(gripL[0]??0,gripL[1]??0,gripL[2]??0),rotationMatrix))
    :new Vector3(-.16,-.34,.62);
   const parts:Mesh[]=[];
   const rightSleeve=addArm(id,new Vector3(.38,-.48,1.02),rightTarget);
   const rightHand=addGlove(id,rightTarget);
   const leftSleeve=addArm(id,new Vector3(-.38,-.49,1.02),leftTarget);
   const leftHand=addGlove(id,leftTarget);
   for(const part of [rightSleeve,rightHand,leftSleeve,leftHand])if(part)parts.push(part);
   weapon.renderingGroupId=1;
   for(const mesh of weapon.getChildMeshes(false))mesh.renderingGroupId=1;
   weapon.setEnabled(false);
   for(const part of parts)part.setEnabled(false);
   firstPersonWeapons[id]=weapon;
   firstPersonParts[id]=parts;
  }
 }
 function setFirstPersonPresentation(camera:Camera|null,enabled:boolean){
  if(closed)return;
  if(enabled&&camera){
   buildFirstPersonViewmodel(camera);
   if(firstPersonRoot&&firstPersonRoot.parent!==camera)firstPersonRoot.parent=camera;
   firstPersonActive=true;
   anchor.setEnabled(false);
   firstPersonRoot?.setEnabled(true);
  }else{
   firstPersonActive=false;
   firstPersonRoot?.setEnabled(false);
   anchor.setEnabled(controlled&&!hiddenDriving);
  }
  applyWeaponVisibility();
 }
 function applyWeaponVisibility(){
  // Legacy GLB weapon meshes are removed during import; only extracted LMS
  // weapon roots participate in equipment visibility.
  for(const [id,root] of Object.entries(weaponRoots))
   root?.setEnabled(handItem==="gun"&&selectedWeapon===id&&controlled&&!hiddenDriving&&!firstPersonActive);
  for(const [id,root] of Object.entries(firstPersonWeapons))
   root?.setEnabled(handItem==="gun"&&selectedWeapon===id&&controlled&&!hiddenDriving&&firstPersonActive);
  for(const [id,parts] of Object.entries(firstPersonParts))
   for(const part of parts??[])part.setEnabled(handItem==="gun"&&selectedWeapon===id&&controlled&&!hiddenDriving&&firstPersonActive);
 }
 const groups:Record<"idle"|"walk"|"run"|"jumpStart"|"jump"|"fall"|"land"|"punch"|"pistolAim"|"pistolFire",AnimationGroup|null>={
  idle:null,walk:null,run:null,jumpStart:null,jump:null,fall:null,land:null,punch:null,pistolAim:null,pistolFire:null,
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
  // Link a stable Babylon transform to Reese's actual right-hand bone. The
  // procedural LMS weapons use the web-of-thumb as their local origin.
  const rightHand=instance.skeletons.flatMap(skeleton=>skeleton.bones)
   .find(bone=>/(right.?hand|hand[._:-]?r|r[._:-]?hand)$/i.test(bone.name));
  if(rightHand){
   const handSkeleton=rightHand.getSkeleton();
   const referenceMesh=[...meshes]
    .filter(mesh=>mesh.skeleton===handSkeleton&&mesh.getTotalVertices()>0)
    .sort((a,b)=>b.getTotalVertices()-a.getTotalVertices())[0];
   if(!referenceMesh)throw Error("REESE-001 right-hand skeleton has no skinned reference mesh");
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
  anchor.setEnabled(false);
  audit.finish(instantiateId,`${meshCount} meshes; ${boneCount} rig bones; ${report.animations} embedded clips`);
  console.info("[REESE-001] playable GLB ready",report);
 })().catch(error=>{
  audit.fail(decodeId,error);audit.fail(instantiateId,error);
  throw error;
 });

 function play(group:AnimationGroup|null,loop=true){
  if(!group||closed||active===group)return;
  outgoing?.stop();
  outgoing=active;
  active=group;active.start(loop);
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
  alignWeaponMountToCharacterForward();
  applyWeaponVisibility();
  if(handItem==="gun"&&groups.pistolAim)play(groups.pistolAim);
  else play(groups.idle);
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
   controlled=enabled;hiddenDriving=false;combatRemaining=0;
   wasAirborne=false;takeoffRemaining=0;landingRemaining=0;muzzleEffect.clear();
   anchor.setEnabled(enabled&&!firstPersonActive);
   if(enabled){resetFlight();play(groups.idle);}
   applyWeaponVisibility();
  },
  setDrivingHidden(hidden:boolean){
   if(closed||!controlled)return;
   hiddenDriving=hidden;
   if(hidden)muzzleEffect.clear();
   anchor.setEnabled(!hidden&&!firstPersonActive);
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
   positionAt(p,yaw);
   alignWeaponMountToCharacterForward();
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
   const next=reeseSafeLocomotion007(speed,sprint);
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
   play(handItem==="gun"&&stableGait==="idle"&&groups.pistolAim?groups.pistolAim:
    groups[stableGait]??groups.idle);
   advance(dt);
  },
  updateControlledFlight(
   p:{x:number;y:number;z:number},yaw:number,
   input:FlightPoseInput&{dt:number},
  ){
   if(!controlled||closed)return;
   flight=true;
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
  },
  /** Animation-and-audio-only: never performs damage, rays or projectile simulation. */
  triggerCombat(): "punch"|"shoot"|null {
   if(!controlled||closed||hiddenDriving||flight||wasAirborne||landingRemaining>0)return null;
   const attack=handItem==="gun"?"shoot":"punch";
   const clip=attack==="shoot"?groups.pistolFire:groups.punch;
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
    muzzleEffect.emit(muzzle,anchor.rotation.y);
    combatRemaining=.10;
   }else{combatRemaining=.55;play(clip,false);}
   lastAttackAt=now;
   return attack;
  },
  get combatReady(){return !!groups.punch&&!!groups.pistolAim&&!!groups.pistolFire;},
  get shotsFired(){return shotSerial;},
  clearCombatFX(){muzzleEffect.clear();},
  get handItem(){return handItem;},
  get poseReport(){
   return {meshCount,boneCount,animations:report.animations,
    activeClip:report.activeClip,scale:report.scale,controlled};
  },
  dispose(){
   if(closed)return;
   closed=true;
   active?.stop();outgoing?.stop();muzzleEffect.dispose();
   firstPersonRoot?.dispose(false,true);firstPersonRoot=null;
   for(const material of firstPersonMaterials)material.dispose();
   firstPersonMaterials.length=0;
   weaponMount?.dispose(false,true);weaponMount=null;
   for(const id of Object.keys(weaponRoots) as ReeseWeaponId001[])delete weaponRoots[id];
   instance?.dispose();instance=null;
   asset?.dispose();asset=null;
   fit?.dispose();offset?.dispose();tilt?.dispose();
   anchor.dispose();
  },
 };
}
