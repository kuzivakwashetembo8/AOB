/**
 * REESE-001 — playable Agent Reese from the owner's GLB.
 *
 * This is intentionally NOT the CHAR-109/110 Voight retarget path: that path
 * calibrates fixed joint names in character.glb. Reese is an Ara/Mixamo game
 * rig with authored embedded clips. Reuse the accepted North Heights Rapier
 * capsule and controller; replace only the visual actor and its clip driver.
 */
import {
  AbstractMesh, AnimationGroup, Material, TransformNode, MeshBuilder, StandardMaterial, Color3, loadAssetContainerAsync,
  type AssetContainer, type Scene,
} from "@babylonjs/core";
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
 let lastGrounded=.15, pendingGaitSeconds=0;
 let stableGait:"idle"|"walk"|"run"|"jump"|"fall"="idle";
 let pendingGait:"idle"|"walk"|"run"|"jump"|"fall"="idle";
 let handItem:"hand"|"gun"="hand";
 const weaponMeshes:AbstractMesh[]=[];
 let fallbackGun:ReturnType<typeof MeshBuilder.CreateBox>|null=null;
 let fallbackGrip:ReturnType<typeof MeshBuilder.CreateBox>|null=null;
 let gunMat:StandardMaterial|null=null;
 const groups:Record<"idle"|"walk"|"run"|"jump"|"fall"|"land",AnimationGroup|null>={
  idle:null,walk:null,run:null,jump:null,fall:null,land:null,
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
  groups.jump=findReeseClip001(instance.animationGroups,"jump_air","jump");
  groups.fall=findReeseClip001(instance.animationGroups,"fall","jump_air","jump");
  groups.land=findReeseClip001(instance.animationGroups,"jump_land");
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
   const box=mesh.getBoundingInfo().boundingBox;
   minX=Math.min(minX,box.minimumWorld.x);
   minY=Math.min(minY,box.minimumWorld.y);
   minZ=Math.min(minZ,box.minimumWorld.z);
   maxX=Math.max(maxX,box.maximumWorld.x);
   maxY=Math.max(maxY,box.maximumWorld.y);
   maxZ=Math.max(maxZ,box.maximumWorld.z);
   mesh.isPickable=false;mesh.receiveShadows=true;
   if(/(?:gun|pistol|weapon|revolver)/i.test(mesh.name))weaponMeshes.push(mesh);
   meshCount++;
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
  // Limit only imported PBR shader light count, not city lights.
  for(const m of source.materials){
   if(!m.getClassName().startsWith("PBR"))continue;
   const pbr=m as Material&{maxSimultaneousLights?:number};
   if(typeof pbr.maxSimultaneousLights==="number"&&pbr.maxSimultaneousLights>4){
    pbr.maxSimultaneousLights=4;
    m.markAsDirty(Material.LightDirtyFlag);
   }
  }
  if(!weaponMeshes.length){
    const rightHand=instance.skeletons.flatMap(s=>s.bones)
      .find(b=>/righthand|rightwrist/i.test(b.name.replace(/[^a-z]/gi,"")));
    const skinMesh=[...meshes].find(m=>m.skeleton===instance!.skeletons[0]);
    if(rightHand&&skinMesh){
      gunMat=new StandardMaterial("reese001-gun-mat",scene);
      gunMat.diffuseColor=new Color3(.04,.046,.052);
      fallbackGun=MeshBuilder.CreateBox("reese001-gun",{width:.06,height:.06,depth:.24},scene);
      fallbackGun.material=gunMat;
      fallbackGun.attachToBone(rightHand,skinMesh);
      fallbackGun.position.set(.035,0,.13);
      fallbackGrip=MeshBuilder.CreateBox("reese001-gun-grip",{width:.05,height:.13,depth:.085},scene);
      fallbackGrip.material=gunMat;
      fallbackGrip.attachToBone(rightHand,skinMesh);
      fallbackGrip.position.set(.035,-.08,.07);
    }
  }
  for(const mesh of weaponMeshes)mesh.setEnabled(false);
  fallbackGun?.setEnabled(false);fallbackGrip?.setEnabled(false);
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
 function advance(dt:number){
  if(!active)return;
  if(outgoing){
   transition=Math.min(1,transition+Math.max(0,dt)/.18);
   active.setWeightForAllAnimatables(transition);
   outgoing.setWeightForAllAnimatables(1-transition);
   if(transition>=1){outgoing.stop();outgoing=null;}
  }
 }
 function resetFlight(){
  flight=false;flightPitch=0;flightRoll=0;
  if(tilt)tilt.rotation.set(0,0,0);
 }
 function positionAt(p:{x:number;y:number;z:number},yaw:number){
  anchor.position.set(p.x,p.y-.92,p.z);
  anchor.rotation.y=yaw;
 }
 return {
  anchor,ready,
  setControlled(enabled:boolean){
   if(closed)return;
   controlled=enabled;hiddenDriving=false;
   anchor.setEnabled(enabled);
   if(enabled){resetFlight();play(groups.idle);}
   for(const mesh of weaponMeshes)mesh.setEnabled(enabled&&handItem==="gun");
   fallbackGun?.setEnabled(enabled&&handItem==="gun");
   fallbackGrip?.setEnabled(enabled&&handItem==="gun");
  },
  setDrivingHidden(hidden:boolean){
   if(closed||!controlled)return;
   hiddenDriving=hidden;
   anchor.setEnabled(!hidden);
   for(const mesh of weaponMeshes)mesh.setEnabled(!hidden&&handItem==="gun");
   fallbackGun?.setEnabled(!hidden&&handItem==="gun");
   fallbackGrip?.setEnabled(!hidden&&handItem==="gun");
  },
  syncHiddenDrivingPose(p:{x:number;y:number;z:number},yaw:number){
   if(closed||!controlled||!hiddenDriving)return;
   positionAt(p,yaw);
  },
  updateControlled(
   p:{x:number;y:number;z:number},yaw:number,speed:number,dt:number,
   sprint=false,grounded=true,verticalVelocity=0,
  ){
   if(!controlled||closed)return;
   if(flight)resetFlight();
   positionAt(p,yaw);
   // Preserve the active gait across momentary Rapier contact/speed jitter.
   lastGrounded=grounded?.18:Math.max(0,lastGrounded-dt);
   const next=reeseGroundClip001(speed,sprint,grounded||lastGrounded>0,verticalVelocity);
   if(next===stableGait){pendingGait=next;pendingGaitSeconds=0;}
   else if(next!==pendingGait){pendingGait=next;pendingGaitSeconds=0;}
   else{
     pendingGaitSeconds+=Math.max(0,dt);
     if(pendingGaitSeconds>=.18){
       stableGait=next;pendingGaitSeconds=0;
     }
   }
   const selected=groups[stableGait]??groups.idle;
   play(selected,stableGait!=="jump"&&stableGait!=="fall");
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
  setHandItem(item:"hand"|"gun"){
   handItem=item;
   for(const mesh of weaponMeshes)mesh.setEnabled(item==="gun"&&controlled&&!hiddenDriving);
   fallbackGun?.setEnabled(item==="gun"&&controlled&&!hiddenDriving);
   fallbackGrip?.setEnabled(item==="gun"&&controlled&&!hiddenDriving);
  },
  get handItem(){return handItem;},
  get poseReport(){
   return {meshCount,boneCount,animations:report.animations,
    activeClip:report.activeClip,scale:report.scale,controlled};
  },
  dispose(){
   if(closed)return;
   closed=true;
   active?.stop();outgoing?.stop();
   fallbackGun?.dispose();fallbackGrip?.dispose();gunMat?.dispose();
   instance?.dispose();instance=null;
   asset?.dispose();asset=null;
   fit?.dispose();offset?.dispose();tilt?.dispose();
   anchor.dispose();
  },
 };
}
