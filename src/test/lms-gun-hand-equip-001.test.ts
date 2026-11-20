import {describe,expect,it} from "vitest";
import {Matrix,NullEngine,Quaternion,Scene,Vector3} from "@babylonjs/core";
import {GUNS_001} from "../game/weapons/gun-inspection-registry-001";
import {createReeseWeapon001,solveReeseWeaponGripOffset001,solveReeseWeaponMountRotation001} from "../game/weapons/gun-runtime-001";

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

describe("LMS weapon coordinate contract",()=>{
 it.each([
  [0,new Vector3(0,0,1)],
  [Math.PI/2,new Vector3(1,0,0)],
  [-Math.PI/2,new Vector3(-1,0,0)],
 ] as const)("maps weapon -Z to character forward at yaw %s",(yaw,expected)=>{
  const mountWorld=Matrix.Compose(Vector3.One(),Quaternion.RotationYawPitchRoll(0.7,-0.45,0.3),new Vector3(2,1,-3));
  const forward=new Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const solved=solveReeseWeaponMountRotation001(mountWorld,forward);
  const weaponWorld=Matrix.Compose(Vector3.One(),solved,Vector3.Zero()).multiply(mountWorld);
  const worldForward=Vector3.TransformNormal(new Vector3(0,0,-1),weaponWorld).normalize();
  expect(Vector3.Dot(worldForward,expected)).toBeGreaterThan(0.999);
  const worldUp=Vector3.TransformNormal(Vector3.Up(),weaponWorld).normalize();
  expect(worldUp.y).toBeGreaterThan(0.999);
 });
});

describe("LMS weapon grip landmark placement",()=>{
 it.each([
  ["M4A1",new Vector3(0.0251,0.06,0.1223)],
  ["MPX-9",new Vector3(0.024,0.028,0.064)],
  ["P-19",new Vector3(0.028,0.003,0.07)],
 ])("places the %s grip landmark at the hand-mount origin",(_,grip)=>{
  const rotation=Quaternion.RotationYawPitchRoll(1.1,-0.2,0.15);
  const rootOffset=solveReeseWeaponGripOffset001(grip,rotation);
  const rotatedGrip=Vector3.TransformNormal(grip,Matrix.FromQuaternion(rotation));
  expect(Vector3.Distance(rootOffset.add(rotatedGrip),Vector3.Zero())).toBeLessThan(1e-6);
 });
});
