import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {defaults} from "../ui/menus/settings-state";

const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");

describe("LMS-FPV-001 optional first-person shooting view",()=>{
 it("keeps third person as the default and normalizes absent saved preferences off",()=>{
  expect(defaults.firstPersonShooting).toBe(false);
  const settings=read("src/ui/menus/settings-state.ts");
  expect(settings).toContain("firstPersonShooting: stored.firstPersonShooting === true");
 });
 it("exposes one shared preference in Settings and a direct gameplay toggle",()=>{
  const editor=read("src/ui/menus/settings-editor.tsx");
  const route=read("src/routes/north-heights-preview.tsx");
  expect(editor).toContain('toggle("firstPersonShooting", "First-person shooting view")');
  expect(route).toContain('data-testid="lms-first-person-toggle"');
  expect(route).toContain("save(next);controller.current?.applySettings(next)");
 });
 it("keeps first-person camera presentation scoped to on-foot Reese gameplay",()=>{
  const runtime=read("src/game/experiments/north-heights-city-8.ts");
  expect(runtime).toContain("settings.firstPersonShooting&&settings.enableCharacter");
  expect(runtime).toContain('mode==="walk"&&!ridingSedanId&&!machineView&&!paused');
  expect(runtime).toContain("actor?.setFirstPersonPresentation(camera,firstPerson)");
  expect(runtime).toContain("!liftFrame?.cameraCabin&&!genericLiftFrame?.cameraCabin");
  expect(runtime).toContain("resolveNorthHeightsThirdPersonCamera");
  const firstPersonBlock=runtime.split("if(firstPerson){")[1]?.split("const computed=")[0]??"";
  expect(firstPersonBlock).toContain("Math.sin(pitch),");
  expect(firstPersonBlock).not.toContain("-Math.sin(pitch)");
 });
 it("uses Reese's live skinned arms and the same bone-mounted weapon in first person",()=>{
  const player=read("src/game/character/reese-player-001.ts");
  const weapons=read("src/game/weapons/gun-runtime-001.ts");
  expect(player).toContain("firstPersonHiddenMeshes");
  expect(player).toContain("firstPersonHeadPattern");
  expect(player).toContain("entry.mesh.visibility=enabled?0:entry.visibility");
  expect(player).toContain("anchor.setEnabled(controlled&&!hiddenDriving)");
  expect(player).toContain('root?.setEnabled(handItem==="gun"&&selectedWeapon===id&&controlled&&!hiddenDriving)');
  expect(player).toContain("weaponMount.attachToBone(rightHand,referenceMesh)");
  expect(player).not.toContain("MeshBuilder.CreateCapsule");
  expect(player).not.toContain("MeshBuilder.CreateSphere");
  expect(player).not.toContain("reese001-first-person-viewmodel");
  expect(weapons).toContain("gripL: gripL ? [...gripL] : null");
  expect(player).toContain("solveReeseWeaponGripOffset001");
  expect(player).toContain('muzzleEffect.emit(muzzle,anchor.rotation.y,selectedWeapon??"m4a1")');
 });
 it("activates the existing weapon-ready aim pose on POV entry and restores it on exit",()=>{
  const player=read("src/game/character/reese-player-001.ts");
  const presentation=player.split("function setFirstPersonPresentation")[1]?.split("function applyWeaponVisibility")[0]??"";
  expect(player).toContain("function weaponAimGroup():AnimationGroup|null");
  expect(presentation).toContain('if(handItem==="gun")');
  expect(presentation).toContain("if(enabled)play(weaponAimGroup(),true,true)");
  expect(presentation).toContain("else play(weaponAimGroup())");
  expect(player).toContain("return groups.rifleReadyAim??groups.rifleCrouchAimMinimal??groups.rifleAim??groups.rifleIdle??groups.idle");
  expect(player).toContain("return groups.pistolReadyAim??groups.pistolCrouchAimMinimal??groups.pistolAim??groups.idle");
 });
 it("shows a centered accessible reticle only for an armed first-person on-foot view",()=>{
  const route=read("src/routes/north-heights-preview.tsx");
  const css=read("src/styles.css");
  expect(route).toContain('data-testid="lms-first-person-reticle"');
  expect(route).toContain('settings.firstPersonShooting&&');
  expect(route).toContain('settings.enableCharacter&&heldItem!=="hand"');
  expect(route).toContain("!vehicle&&!mapOpen&&!machineView");
  expect(route).toContain('aria-label={heldItem.toUpperCase()+" aiming reticle"}');
  expect(css).toContain(".gtd-first-person-reticle");
  expect(css).toContain("pointer-events:none");
 });
 it("does not expand the existing animation-and-audio-only combat contract",()=>{
  const player=read("src/game/character/reese-player-001.ts");
  expect(player).toContain("Animation-and-audio-only: never performs damage, rays or projectile simulation.");
  expect(player).not.toContain("Raycast");
 });
});
