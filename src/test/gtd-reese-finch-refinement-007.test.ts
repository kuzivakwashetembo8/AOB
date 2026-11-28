import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {reeseSafeLocomotion007} from "../game/character/reese-player-001";
import {finchElevatorFloorCounter007} from "../game/experiments/north-heights-finch-lobby-004";
const src=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");

describe("GTD-REESE-FINCH-007 owner gameplay corrections",()=>{
 it("does not select an unassigned prone or fall animation on any traversal speed",()=>{
  expect(reeseSafeLocomotion007(0,false)).toBe("idle");
  expect(reeseSafeLocomotion007(.2,false)).toBe("walk");
  expect(reeseSafeLocomotion007(3.4,false)).toBe("walk");
  expect(reeseSafeLocomotion007(7.5,true)).toBe("run");
  const actor=src("src/game/character/reese-player-001.ts");
  expect(actor).toContain("const next=reeseSafeLocomotion007(speed,sprint);");
  expect(actor).toContain('stableGait==="idle"&&next!=="idle"');
  expect(actor).toContain("transition+Math.max(0,dt)/.075");
  expect(actor).not.toContain("reeseGroundClip001(speed,sprint,grounded||");
 });
 it("toggles the existing GLB gun only, with no runtime pistol fabrication",()=>{
  const actor=src("src/game/character/reese-player-001.ts");
  // The current LMS path removes the imported pistol by mesh/ancestor/material
  // identity, then equips only the three extracted weapon roots on Reese's hand.
  expect(actor).toContain("const weaponRoots:Partial<Record<ReeseWeaponId001,TransformNode>>={}");
  expect(actor).toContain("const weaponPattern=");
  expect(actor).toContain("mesh.dispose(false,false)");
  expect(actor).toContain("createReeseWeapon001(scene,id)");
  expect(actor).toContain("solveReeseWeaponGripOffset001");
  expect(actor).toContain("applyWeaponVisibility()");
  expect(actor).not.toContain('MeshBuilder.CreateBox("reese001-gun"');
  expect(actor).not.toContain("fallbackGun");
 });
 it("reports actual floor numbers between one and fifty-three, not a height percentage",()=>{
  expect(finchElevatorFloorCounter007(-5)).toBe(1);
  expect(finchElevatorFloorCounter007(0)).toBe(1);
  expect(finchElevatorFloorCounter007(.5)).toBe(27);
  expect(finchElevatorFloorCounter007(.88)).toBe(47);
  expect(finchElevatorFloorCounter007(1)).toBe(53);
  expect(finchElevatorFloorCounter007(5)).toBe(53);
  const page=src("src/routes/north-heights-preview.tsx");
  expect(page).toContain("LIFT · FLOOR {buildingLift?.moving?buildingLift.currentFloor:elevator?.currentFloor}");
  expect(page).toContain("OF {buildingLift?.moving?buildingLift.floors:elevator?.floors}");
  expect(page).not.toContain("% HEIGHT");
 });
 it("uses Finch's embedded talking clip while dialogue is active and restores idle",()=>{
  const finch=src("src/game/experiments/north-heights-finch-suite-005.ts");
  const scene=src("src/game/experiments/north-heights-city-8.ts");
  const page=src("src/routes/north-heights-preview.tsx");
  expect(finch).toContain("setTalking(active:boolean)");
  expect(finch).toContain("talkingClip=groups.find");
  expect(finch).toContain("next.start(true)");
  expect(scene).toContain("setFinchTalking(active){finchSuite?.setTalking(active);}");
  expect(page).toContain("controller.current?.setFinchTalking(dialogueIndex!==null&&!paused");
  expect(page).toContain('max-w-[min(60vw,380px)]');
  expect(page).toContain("<ArrowRight size={17} strokeWidth={1.25}/>");
 });
 it("has five evenly spaced desktop header controls, a narrow-screen rail and a blurred game-backed focused map",()=>{
  const style=src("src/styles.css");
  const page=src("src/routes/north-heights-preview.tsx");
  const hud=src("src/ui/hud/game-hud.tsx");
  const map=src("src/ui/hud/north-heights-map-010.tsx");
  expect(style).toContain(".gtd-hand-always");
  expect(style).toContain(" + 65px");
  expect(style).toContain(" + 118px");
  expect(style).toContain(" + 171px");
  expect(style).toContain(" + 224px");
  expect(style).toContain("top:calc(max(8px,env(safe-area-inset-top)) + 53px)");
  expect(style).toContain("top:calc(max(8px,env(safe-area-inset-top)) + 106px)");
  expect(style).toContain("top:calc(max(8px,env(safe-area-inset-top)) + 159px)");
  expect(style).toContain("top:calc(max(8px,env(safe-area-inset-top)) + 212px)");
  expect(style).toContain("top:calc(max(8px,env(safe-area-inset-top)) + 265px)");
  expect(style).toContain("@media(max-width:740px) and (max-height:440px)");
  expect(page).toContain('className="gtd-hand-always');
  expect(page).toContain('className="gtd-first-person-always');
  expect(hud).toContain('className="gtd-header-reveal"');
  expect(hud).toContain('<Info size={18} aria-hidden="true" />');
  // POI-009 replaces the bespoke dark map frame with the uniform control-glass
  // panel while retaining its transparent square canvas and backdrop blur.
  expect(map).toContain("poi009-expanded-map");
  expect(map).toContain("poi-game-glass-panel");
  expect(map).toContain("aspect-square w-[min(82vh,92vw,760px)]");
  expect(map).toContain("bg-transparent");
  expect(style).toContain("backdrop-filter:blur(12px)");
 });
});
