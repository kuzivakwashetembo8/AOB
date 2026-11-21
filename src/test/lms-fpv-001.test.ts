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
  expect(runtime).toContain("resolveNorthHeightsThirdPersonCamera");
 });
 it("uses a camera-space viewmodel and authored weapon grip landmarks",()=>{
  const player=read("src/game/character/reese-player-001.ts");
  const weapons=read("src/game/weapons/gun-runtime-001.ts");
  expect(player).toContain('new TransformNode("reese001-first-person-viewmodel"');
  expect(player).toContain("MeshBuilder.CreateCapsule");
  expect(weapons).toContain("gripL: gripL ? [...gripL] : null");
  expect(player).toContain("solveReeseWeaponGripOffset001");
 });
 it("does not expand the existing animation-and-audio-only combat contract",()=>{
  const player=read("src/game/character/reese-player-001.ts");
  expect(player).toContain("Animation-and-audio-only: never performs damage, rays or projectile simulation.");
  expect(player).not.toContain("Raycast");
 });
});
