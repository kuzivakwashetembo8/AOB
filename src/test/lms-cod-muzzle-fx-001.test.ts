import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("LMS-COD-FX-001 extracted-weapon muzzle effects",()=>{
 it("uses Claude of Duty's rifle, SMG and pistol signatures",()=>{
  const fx=read("src/game/character/reese-muzzle-flash-011.ts");
  expect(fx).toContain('rifle: { scale: 1, lobes: 3, jet: 1, light: 200, smoke: 1, temp: 1, sparks: 8 }');
  expect(fx).toContain('smg: { scale: .78, lobes: 3, jet: .75, light: 135, smoke: .7, temp: 1.05, sparks: 6 }');
  expect(fx).toContain('pistol: { scale: .66, lobes: 2, jet: .6, light: 100, smoke: .55, temp: 1.06, sparks: 5 }');
  expect(fx).toContain('id === "mpx9"');
  expect(fx).toContain('id === "p19"');
 });
 it("replaces the yellow placeholder with a layered muzzle flash, smoke and point light",()=>{
  const fx=read("src/game/character/reese-muzzle-flash-011.ts");
  for(const feature of ["Incandescent crown","white-hot heart","tongues of burning gas","forward gas jet","Hot powder grains","powder puffs","barrel smoke","PointLight"])
   expect(fx).toContain(feature);
  expect(fx).toContain("blackbodyKelvin");
  expect(fx).toContain("b.light.range = 5 * scale");
  expect(fx).toContain("b.lightDuration = .09");
  expect(fx).toContain("profile.light * .18 * gain");
  expect(fx).toContain("Math.exp(-16 * elapsed)");
  expect(fx).not.toContain("Math.random");
  expect(fx).not.toContain('from "three"');
  const player=read("src/game/character/reese-player-001.ts");
  expect(player).not.toContain("reese-muzzle-spark-010");
  expect(player).not.toContain("poi010-muzzle-emissive");
 });
 it("emits at the selected extracted weapon's authored muzzle in the bore direction",()=>{
  const player=read("src/game/character/reese-player-001.ts");
  expect(player).toContain("muzzleForward.set(Math.sin(anchor.rotation.y),0,Math.cos(anchor.rotation.y))");
  expect(player).toContain('muzzleEffect.emit(muzzle,muzzleForward,selectedWeapon??"m4a1")');
  expect(player).toContain("muzzleEffect.update(dt)");
 });
 it("preallocates burst particles and advances them without per-frame particle arrays",()=>{
  const fx=read("src/game/character/reese-muzzle-flash-011.ts");
  expect(fx).toContain("const particles = [core, heart, jet, ...lobes, ...sparks, ...puffs, ...smoke]");
  expect(fx).toContain("for (const p of b.particles)");
  expect(fx).toContain("const bursts = Array.from({ length: 4 }");
 });
});
