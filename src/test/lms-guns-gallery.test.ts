import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {GUNS_001,gunAt001} from "@/game/weapons/gun-inspection-registry-001";
describe("LMS-GUN-001 extracted weapon gallery",()=>{
 it("registers three source models and wraps carousel indices",()=>{
  expect(GUNS_001.map(g=>g.name)).toEqual(["M4A1","MPX-9","P-19"]);
  expect(gunAt001(-1).id).toBe("p19");
  expect(gunAt001(GUNS_001.length).id).toBe("m4a1");
 });
 it("replaces Development Build with a Guns link beside Cars",()=>{
  const home=readFileSync("src/routes/index.tsx","utf8");
  expect(home).toContain('to="/vehicles"');
  expect(home).toContain("Cars");
  expect(home).toContain('to="/guns"');
  expect(home).not.toContain("Development Build");
 });
 it("keeps the inspection scene isolated from North Heights gameplay",()=>{
  const route=readFileSync("src/routes/guns.tsx","utf8");
  const scene=readFileSync("src/game/weapons/gun-inspection-scene-001.ts","utf8");
  expect(route).toContain('createFileRoute("/guns")');
  expect(scene).toContain("new THREE.WebGLRenderer");
  expect(scene).not.toContain("Rapier");
  expect(scene).not.toContain("NH012TrafficSimulator");
 });
 it("retains the source builders and MIT attribution",()=>{
  for(const path of ["src/game/weapons/source/models/rifle.js","src/game/weapons/source/models/smg.js","src/game/weapons/source/models/pistol.js"])
   expect(readFileSync(path,"utf8")).toContain("export function build");
  expect(readFileSync("THIRD_PARTY_NOTICES.md","utf8")).toContain("Copyright (c) 2026 mshumer");
 });
});
