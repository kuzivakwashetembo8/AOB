import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("LMS-COD-FX-001 extracted-weapon muzzle effects",()=>{
 it("maps each extracted gun to Claude of Duty's matching flash profile",()=>{
  const fx=read("src/game/character/reese-muzzle-flash-011.ts");
  expect(fx).toContain('rifle: { scale: 1, lobes: 3, jet: 1, light: 200, smoke: 1, sparks: 8 }');
  expect(fx).toContain('smg: { scale: .78, lobes: 3, jet: .75, light: 135, smoke: .7, sparks: 6 }');
  expect(fx).toContain('pistol: { scale: .66, lobes: 2, jet: .6, light: 100, smoke: .55, sparks: 5 }');
  expect(fx).toContain('id === "mpx9"');
  expect(fx).toContain('id === "p19"');
 });
 it("replaces the flat yellow sphere with the layered COD muzzle sequence",()=>{
  const fx=read("src/game/character/reese-muzzle-flash-011.ts");
  for(const feature of ["Incandescent crown","white-hot heart","tongues of burning gas","forward gas jet","Hot powder grains","powder puffs","barrel smoke","PointLight"])
   expect(fx).toContain(feature);
  expect(fx).toContain("b.light.range = 5 * scale");
  expect(fx).toContain("b.lightDuration = .09");
  expect(fx).not.toContain("Math.random");
  expect(fx).not.toContain('from "three"');
  const player=read("src/game/character/reese-player-001.ts");
  expect(player).not.toContain("fpv-muzzle-flash");
  expect(player).not.toContain("reese001-fpv-"+'id'+"-muzzle-flash");
 });
 it("emits from the authored muzzle in both third-person world space and first-person camera space",()=>{
  const player=read("src/game/character/reese-player-001.ts");
  expect(player).toContain("firstPersonMuzzle(weaponId)");
  expect(player).toContain("muzzleEffect.emit(fpMuzzle.position,fpMuzzle.direction,weaponId)");
  expect(player).toContain("muzzleEffect.emit(muzzle,muzzleForward,weaponId)");
  expect(player).toContain("muzzleEffect.setParent(firstPersonRoot)");
  expect(player).toContain("muzzleEffect.setParent(null)");
 });
 it("preallocates burst particles and advances them without allocating particle arrays per frame",()=>{
  const fx=read("src/game/character/reese-muzzle-flash-011.ts");
  expect(fx).toContain("const particles = [core, heart, jet, ...lobes, ...sparks, ...puffs, ...smoke]");
  expect(fx).toContain("for (const p of b.particles)");
  expect(fx).toContain("const bursts = Array.from({ length: 4 }");
 });
});
