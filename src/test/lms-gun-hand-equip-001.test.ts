import {describe,expect,it} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {GUNS_001} from "../game/weapons/gun-inspection-registry-001";
import {createReeseWeapon001} from "../game/weapons/gun-runtime-001";

describe("LMS extracted weapon runtime adapter",()=>{
 it("converts each gallery weapon into Babylon meshes without a second renderer",()=>{
  const engine=new NullEngine();
  const scene=new Scene(engine);
  const created=GUNS_001.map(gun=>{
   const weapon=createReeseWeapon001(scene,gun.id);
   expect(weapon.name).toContain(gun.id);
   expect(weapon.getChildMeshes(false).length).toBeGreaterThan(0);
   expect(weapon.isEnabled()).toBe(false);
   return weapon;
  });
  expect(new Set(created.map(weapon=>weapon.name)).size).toBe(3);
  for(const weapon of created)weapon.dispose(false,true);
  scene.dispose();
  engine.dispose();
 });
});
