import {describe,it,expect} from "vitest";
import { Quaternion, Vector3 } from "@babylonjs/core";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
 REESE_PLAYER_PATH_001,REESE_PLAYER_EXPECTED_ANIMATIONS_001,
 REESE_PLAYER_HEIGHT_001,findReeseClip001,reeseGroundClip001,reeseFootGroundCorrection001,
 reeseFootContactPoint001,reeseFootGroundSamples001,
 reeseGunReadyLegAngle001,reeseGunReadyLegRotation001,
 reeseIsLongGun001,reeseLongGunClipKey001,reeseCanFire001,
} from "../game/character/reese-player-001";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");

describe("REESE-001 animated foot grounding",()=>{
 it("lifts only the rendered rig when the lowest animated sole is below the floor",()=>{
  expect(reeseFootGroundCorrection001(0,[.02,.01])).toBe(0);
  expect(reeseFootGroundCorrection001(0,[-.08,.01])).toBeCloseTo(.08);
 });
 it("is stable after the visual correction has been applied",()=>{
  expect(reeseFootGroundCorrection001(0,[0,.09],.12)).toBeCloseTo(.12);
 });
 it("caps abnormal corrections and safely handles missing foot samples",()=>{
  expect(reeseFootGroundCorrection001(0,[-.5])).toBe(.18);
  expect(reeseFootGroundCorrection001(0,[])).toBe(0);
  expect(reeseFootGroundCorrection001(Number.NaN,[-.1])).toBe(0);
 });
 it("rotates the calibrated sole point with the animated foot bone",()=>{
  const point=reeseFootContactPoint001(
   new Vector3(0,1,0),Quaternion.RotationAxis(new Vector3(0,0,1),Math.PI/2),
   new Vector3(0,-1,0),
  );
  expect(point.x).toBeCloseTo(1);
  expect(point.y).toBeCloseTo(1);
 });
 it("adds rotation-aware probes for standing but preserves low-crouch grounding samples",()=>{
  const legacy=[.02,.01],rotated=[-.08,.03];
  const standing=reeseFootGroundSamples001("idle",false,legacy,rotated);
  const lowCrouch=reeseFootGroundSamples001("idle",true,legacy,rotated);
  expect(standing).toEqual([...legacy,...rotated]);
  expect(reeseFootGroundCorrection001(0,standing)).toBeCloseTo(.08);
  expect(lowCrouch).toEqual(legacy);
  expect(reeseFootGroundCorrection001(0,lowCrouch)).toBe(0);
  expect(reeseFootGroundSamples001("walk",false,legacy,rotated)).toEqual(legacy);
 });
});

describe("REESE-001 rendered ground contact wiring",()=>{
 it("samples animated foot/toe bones and adjusts only the visual fit node",()=>{
  const actor=read("src/game/character/reese-player-001.ts");
  expect(actor).toContain("scene.onBeforeRenderObservable.add");
  expect(actor).toContain("footGroundOffsets");
  expect(actor).toContain("footGroundContactOffsets");
  expect(actor).toContain('["foot","toe"]');
  expect(actor).toContain('["foot","toeBase","toeEnd"]');
  expect(actor).toContain("bone.getPosition(Space.WORLD,supportHandReferenceMesh)");
  expect(actor).toContain("bone.getRotationQuaternion(Space.WORLD,supportHandReferenceMesh)");
  expect(actor).toContain("localSoleOffset");
  expect(actor).toContain("reeseFootGroundSamples001(currentGait,lowCrouch,legacySoleYs,rotatedSoleYs)");
  expect(actor).toContain("fit.position.y=fitBaseY+fitGroundCorrection");
  expect(actor).not.toContain("anchor.position.y+=fitGroundCorrection");
 });
});

describe("REESE-001 armed standing leg stance",()=>{
 it("places the right thigh forward and the left thigh behind while counter-rotating the shins",()=>{
  const identity=Quaternion.Identity();
  const rightThigh=reeseGunReadyLegRotation001("mixamorig:RightUpLeg",identity);
  const rightShin=reeseGunReadyLegRotation001("mixamorig:RightLeg",identity);
  const leftThigh=reeseGunReadyLegRotation001("mixamorig:LeftUpLeg",identity);
  const leftShin=reeseGunReadyLegRotation001("mixamorig:LeftLeg",identity);
  const down=new Vector3(0,-1,0);
  expect(reeseGunReadyLegAngle001("mixamorig:RightUpLeg")).toBeCloseTo(-.12);
  expect(reeseGunReadyLegAngle001("mixamorig:LeftUpLeg")).toBeCloseTo(.08);
  expect(down.applyRotationQuaternion(rightThigh).z).toBeGreaterThan(0);
  expect(down.applyRotationQuaternion(leftThigh).z).toBeLessThan(0);
  expect(down.applyRotationQuaternion(rightThigh.multiply(rightShin)).z).toBeCloseTo(0);
  expect(down.applyRotationQuaternion(leftThigh.multiply(leftShin)).z).toBeCloseTo(0);
  expect(reeseGunReadyLegAngle001("mixamorig:Spine2")).toBe(0);
 });
 it("applies the stance only to standing gun-ready idle and stationary-fire blends, not cover or walk clips",()=>{
  const actor=read("src/game/character/reese-player-001.ts");
  expect(actor).toContain("if(gunReadyStance)softened=applyGunReadyLegStance001(softened,targetName)");
  expect(actor).toContain("groups.rifleCrouchAim,groups.rifleAim,groups.idle,groups.rifleAim?.to,.12,true");
  expect(actor).toContain("groups.rifleCrouchAim,groups.rifleFire,groups.idle,undefined,.12,true");
  expect(actor).toContain("groups.rifleCrouchAim,groups.pistolAim,groups.idle,groups.pistolAim?.to,.12,true");
  expect(actor).toContain("groups.rifleCrouchAim,groups.pistolFire,groups.idle,undefined,.12,true");
  expect(actor).toContain("groups.rifleCrouchWalk,groups.rifleWalk,groups.idle,groups.rifleWalk?.to,.12);");
  expect(actor).toContain("groups.rifleCrouchAim,groups.rifleFire,groups.idle,undefined);");
 });
});

describe("REESE-001 playable actor replacement",()=>{
 it("references exactly the owner-committed asset and requires the full clip set",()=>{
  expect(REESE_PLAYER_PATH_001).toBe("/GLBs/Reese%20(1).glb");
  expect(REESE_PLAYER_EXPECTED_ANIMATIONS_001).toBe(70);
  expect(REESE_PLAYER_HEIGHT_001).toBe(1.78);
 });
 it("selects only compatible plain-idle and locomotion clips",()=>{
  const list=["Sit idle","Walk back","Reese|Run","Reese|Idle","Reese|Walk","Jump air","Fall"]
   .map(name=>({name}));
  expect(findReeseClip001(list,"idle")?.name).toBe("Reese|Idle");
  expect(findReeseClip001(list,"walk")?.name).toBe("Reese|Walk");
  expect(findReeseClip001(list,"run")?.name).toBe("Reese|Run");
  expect(findReeseClip001(list,"jump_air","jump")?.name).toBe("Jump air");
  expect(findReeseClip001([{name:"Sit idle"}],"idle")).toBeNull();
 });
 it("binds the authored rifle clips and keeps weapon classes separate",()=>{
  const names=[
   "Rifle idle (low ready)","Rifle aim idle","Rifle fire (single)",
   "Rifle walk (aiming)","Rifle run","Rifle sprint",
   "Crouch aim idle","Crouch walk (aiming)",
  ].map(name=>({name}));
  expect(findReeseClip001(names,"rifle_idle","Rifle idle (low ready)")?.name).toBe("Rifle idle (low ready)");
  expect(findReeseClip001(names,"rifle_aim","Rifle aim idle")?.name).toBe("Rifle aim idle");
  expect(findReeseClip001(names,"rifle_fire","Rifle fire (single)")?.name).toBe("Rifle fire (single)");
  expect(findReeseClip001(names,"rifle_walk","Rifle walk (aiming)")?.name).toBe("Rifle walk (aiming)");
  expect(findReeseClip001(names,"rifle_run","Rifle run")?.name).toBe("Rifle run");
  expect(findReeseClip001(names,"rifle_sprint","Rifle sprint")?.name).toBe("Rifle sprint");
  expect(findReeseClip001(names,"rifle_crouch_aim","Crouch aim idle")?.name).toBe("Crouch aim idle");
  expect(findReeseClip001(names,"rifle_crouch_walk","Crouch walk (aiming)")?.name).toBe("Crouch walk (aiming)");
  expect(reeseIsLongGun001("m4a1")).toBe(true);
  expect(reeseIsLongGun001("mpx9")).toBe(true);
  expect(reeseIsLongGun001("p19")).toBe(false);
  expect(reeseIsLongGun001(null)).toBe(false);
  expect(reeseLongGunClipKey001("idle",false)).toBe("rifleCrouchAim");
  expect(reeseLongGunClipKey001("walk",false)).toBe("rifleCrouchWalk");
  expect(reeseLongGunClipKey001("run",false)).toBe("rifleRun");
  expect(reeseLongGunClipKey001("run",true)).toBe("rifleSprint");
  expect(reeseCanFire001(0,false)).toBe(true);
  expect(reeseCanFire001(3.8,false)).toBe(true);
  expect(reeseCanFire001(5.1,false)).toBe(false);
  expect(reeseCanFire001(2,false)).toBe(true);
  expect(reeseCanFire001(2,true)).toBe(false);
 });
 it("softens authored crouch lower-body motion toward neutral idle instead of retaining a deep squat",()=>{
  const actor=read("src/game/character/reese-player-001.ts");
  expect(actor).toContain("softenCrouchAnimation001");
  expect(actor).toContain("Quaternion.Slerp(neutralValue,value,weight)");
  expect(actor).toContain("Vector3.Lerp(neutralValue,value,weight)");
  expect(actor).toContain("groups.pistolCrouchAimMinimal=createCrouchedFireGroup001");
  expect(actor).toContain("groups.rifleCrouchAimMinimal=createCrouchedFireGroup001");
  expect(actor).toContain("groups.rifleCrouchAim,groups.rifleAim,groups.idle,groups.rifleAim?.to,.12");
  expect(actor).toContain("groups.rifleCrouchWalk,groups.rifleFire,groups.idle,undefined,.12");
 });
 it("uses rifle fire and the support weapon's authored gripL without changing P-19 selection",()=>{
  const actor=read("src/game/character/reese-player-001.ts");
  expect(actor).toContain("lowCrouch?(moving?groups.rifleCrouchWalkFire:groups.rifleCrouchFire)");
  expect(actor).toContain("lowCrouch?(moving?groups.pistolCrouchWalkFire:groups.pistolCrouchFire)");
  expect(actor).toContain('currentRunning))return null');
  expect(actor).toContain('createCrouchedFireGroup001');
  expect(actor).toContain('root?.metadata?.gripL');
  expect(actor).toContain('supportHandBone.getAbsolutePosition(supportHandReferenceMesh)');
  expect(actor).toContain("setLowCrouch(enabled:boolean)");
  expect(actor).toContain("get lowCrouch(){return lowCrouch;}");
  expect(actor).toContain("lowCrouch?groups.pistolCrouchAim:groups.pistolCrouchAimMinimal");
 });
 it("derives gait and airborne states from the existing physical controller",()=>{
  expect(reeseGroundClip001(0,false,true,0)).toBe("idle");
  expect(reeseGroundClip001(2,false,true,0)).toBe("walk");
  expect(reeseGroundClip001(7,true,true,0)).toBe("run");
  expect(reeseGroundClip001(0,false,false,2)).toBe("jump");
  expect(reeseGroundClip001(0,false,false,-2)).toBe("fall");
 });
 it("uses Reese for North Heights while retaining physics, camera, traffic, and Finch",()=>{
  const game=read("src/game/experiments/north-heights-city-8.ts");
  expect(game).toContain('import { createReesePlayer001 }');
  expect(game).toContain('actor=createReesePlayer001(scene)');
  expect(game).not.toContain('actor=createMercerStaticCharacter(scene)');
  expect(game).toContain("createNorthHeightsWalk005");
  expect(game).toContain("resolveNorthHeightsThirdPersonCamera");
  expect(game).toContain("createFinchSuite005");
  expect(game).toContain("toggleVehicle=()=>");
  expect(game).toContain('(active("fast")||key("ShiftLeft")||key("ShiftRight"))&&!actor?.lowCrouch');
  expect(read("src/game/world/mercer-static-character-103.ts"))
   .toContain('MERCER_STATIC_CHARACTER_PATH="/GLBs/Characters/character.glb"');
 });
});
