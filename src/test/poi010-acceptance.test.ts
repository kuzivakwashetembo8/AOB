import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NH012TrafficSimulator} from "../game/traffic/nh012-traffic-simulator";
import {visibleTouchActions} from "../ui/hud/touch-controls";
import {findReeseClip001} from "../game/character/reese-player-001";
const source=(p:string)=>readFileSync(p,"utf8");
describe("POI-010 nine-work-package contracts",()=>{
 it("keeps exactly three on-foot actions and relocates vehicle/elevator to context host",()=>{
  expect(visibleTouchActions(false).map(x=>x.action)).toEqual(["jump","sprint","combat"]);
  expect(visibleTouchActions(false,false,true).map(x=>x.action)).toEqual(["jump","sprint","combat"]);
  expect(visibleTouchActions(true).map(x=>x.action)).toEqual([]);
  const route=source("src/routes/north-heights-preview.tsx");
  expect(route).toContain("poi010-context-actions");
  expect(route).toContain('data-testid="poi010-vehicle-context"');
  expect(route).toContain('data-testid="poi005-lift-independent"');
  expect(route).toContain("Machine Camera Activate · Disable to return to John");
 });
 it("keeps the unarmed actions in separate jump, sprint and fight grid positions",()=>{
  const css=source("src/styles.css");
  expect(css).toContain('.touch-actions:has(.gtd-uniform-action):not(:has(.gtd-action-crouch)){grid-template-areas:"jump sprint combat"');
  expect(css).toContain('.touch-actions:not(:has(.gtd-action-crouch)) .gtd-action-jump{grid-area:jump;}');
  expect(css).toContain('.touch-actions:not(:has(.gtd-action-crouch)) .gtd-action-sprint{grid-area:sprint;}');
  expect(css).toContain('.touch-actions:not(:has(.gtd-action-crouch)) .gtd-action-combat{grid-area:combat;}');
 });
 it("sizes controls exactly ten percent larger and aligns jump and fight with movement",()=>{
  const css=source("src/styles.css");
  for(const size of ["76.56px","71.28px","55.44px"])expect(css).toContain(size);
  expect(css).toContain("var(--poi010-joystick-actual) * .5");
  expect(css).toContain(".touch-actions .gtd-action-sprint{translate:0 -8px;}");
 });
 it("joins the building pillars and rounds street-facing corner without exposed terrain",()=>{
  const roads=source("src/game/experiments/north-heights-roads-003.ts");
  expect(roads).toContain("x+sx*HALF,z+sz*HALF");
  expect(roads).toContain("roundedJunctionPavement(batch.pavement,batch.curb,batch.asphalt");
  expect(roads).toContain("Math.abs(corner.x-roadX)");
  const build=source("src/game/experiments/north-heights-reconstruction-001.ts");
  expect(build).toContain("const pierHeight=slabUnder-pierBase+.035");
 });
 it("uses the authored Jump in air rather than selecting the wrong Jump clip",()=>{
  const names=[{name:"Jump start"},{name:"Jump (in air)"},{name:"Jump land"},{name:"Jump"}];
  expect(findReeseClip001(names,"Jump (in air)","jump_air")?.name).toBe("Jump (in air)");
  const reese=source("src/game/character/reese-player-001.ts");
  expect(reese).toContain("const airborne=!grounded||verticalVelocity>.65");
  expect(reese).toContain("groups.jumpStart");
  expect(reese).toContain("landingRemaining=groups.land ? .35 : 0");
 });
 it("pairs each accepted rapid pistol shot with pooled muzzle lighting and its audio event",()=>{
  const reese=source("src/game/character/reese-player-001.ts");
  expect(reese).toContain("overlay.stop();else fireOverlay?.stop()");
  expect(reese).toContain('muzzleEffect.emit(muzzle,anchor.rotation.y,selectedWeapon??"m4a1")');
  expect(reese).not.toContain('attack==="shoot"?260:550');
  const muzzle=source("src/game/character/reese-muzzle-spark-010.ts");
  expect(muzzle).toContain("new PointLight");
  expect(muzzle).not.toContain("MeshBuilder");
  expect(muzzle).not.toContain("CreateSphere");
  expect(muzzle).not.toContain("CreateCylinder");
  const game=source("src/game/experiments/north-heights-city-8.ts");
  expect(game).toContain('vehicleAudio.playCombatCue("shoot")');
  expect(game).toContain("vehicleAudio.startAutomaticFire(weapon,100)");
 });
 it("reconciles stale junction reservations in ordinary traffic without collisions",()=>{
  const t=new NH012TrafficSimulator(25,120125);
  for(let i=0;i<500;i++)t.step();
  expect(t.validate()).toEqual([]);
  expect(t.deadlockMetrics010().tick).toBe(500);
  expect(source("src/game/traffic/nh012-traffic-simulator.ts")).not.toContain("if(!this.dianePace001)return; // preserve baseline/manual traffic semantics");
 });
});
