// @vitest-environment jsdom
import {describe,it,expect,afterEach} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {visibleTouchActions,TouchControls} from "../ui/hud/touch-controls";
import {NorthHeightsLiftKeypad019} from "../ui/hud/north-heights-lift-keypad-019";
import {clampNorthHeightsPitch,northHeightsSkyLookTarget,resolveNorthHeightsThirdPersonCamera} from "../game/camera/third-person-camera-constraints";
import {defaults} from "../ui/menus/settings-state";
import {findReeseClip001} from "../game/character/reese-player-001";
const source=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
afterEach(()=>cleanup());

describe("POI-009 owner-approved refinement contracts",()=>{
 it("keeps the 53-floor elevator reachable with a shorter native-scroll viewport and custom thumb",()=>{
  const floors=53;
  render(<NorthHeightsLiftKeypad019 lift={{buildingId:"finch",label:"Finch HQ",floors,currentFloor:1,available:true,moving:false,finch:true}}
   onClose={()=>{}} onSelect={()=>{}}/>);
  expect(screen.getByRole("group",{name:"Available floors"})).toBeTruthy();
  expect(screen.getByRole("button",{name:"Go to floor 53"})).toBeTruthy();
  expect(screen.getByRole("region",{name:"Elevator floor keypad"}).className).toContain("55dvh");
  expect(source("src/styles.css")).toContain(".poi009-scroll-thumb");
 });
 it("shows no MOVE label, has three touch combat actions, and switches fist/gun accessible text",()=>{
  const send=()=>{};
  const {rerender}=render(<TouchControls settings={defaults} send={send} onAction={()=>{}} armed={false}/>);
  expect(screen.getByRole("button",{name:"Punch"})).toBeTruthy();
  expect(screen.queryByText("MOVE")).toBeNull();
  expect(visibleTouchActions(false).map(x=>x.action)).toEqual(["jump","sprint","combat"]);
  rerender(<TouchControls settings={defaults} send={send} onAction={()=>{}} armed={true}/>);
  expect(screen.getByRole("button",{name:"Fire pistol"})).toBeTruthy();
  expect(visibleTouchActions(true).map(x=>x.action)).toEqual(["vehicle"]);
  expect(visibleTouchActions(false,true).map(x=>x.action)).not.toContain("combat");
 });
 it("applies exact 20 percent action size to current POI-008 CSS in both touch viewports and desktop",()=>{
  const css=source("src/styles.css");
  for(const size of ["69.6px","64.8px","50.4px"])expect(css).toContain(size);
  expect(css).toContain("repeat(3,69.6px)");
  expect(css).toContain("repeat(3,64.8px)");
 });
 it("supports skyward look while never placing the orbit under terrain",()=>{
  expect(clampNorthHeightsPitch(3)).toBe(1.55);
  const camera={x:0,y:2,z:-4},actor={x:0,y:1.3,z:0};
  expect(northHeightsSkyLookTarget(camera,actor,0,1.55).y).toBeGreaterThan(30);
  const terrain=()=>.5;
  const resolved=resolveNorthHeightsThirdPersonCamera(actor,0,1.55,4.5,terrain);
  expect(resolved.position.y).toBeGreaterThanOrEqual(1.35);
 });
 it("sources combat from the existing 70-clip Reese actor without damage or second GLB",()=>{
  const names=[{name:"Pistol aim"},{name:"Pistol fire"},{name:"Punch"}];
  expect(findReeseClip001(names,"pistol_aim")?.name).toBe("Pistol aim");
  expect(findReeseClip001(names,"pistol_fire")?.name).toBe("Pistol fire");
  const reese=source("src/game/character/reese-player-001.ts");
  expect(reese).toContain('triggerCombat(): "punch"|"shoot"|null');
  expect(reese).toContain("groups.pistolFire");
  expect(reese).not.toContain("applyDamage(");
  const engine=source("src/game/experiments/north-heights-city-8.ts");
  expect(engine).toContain("vehicleAudio.playCombatCue(kind)");
 });
 it("reuses a spatial hash and bounded Rapier NPC body pool, not per-frame all-pairs physics",()=>{
  const ped=source("src/game/experiments/north-heights-pedestrian-simulator-001.ts");
  expect(ped).toContain("const cells=new Map<string,PedAgent001[]>()");
  expect(ped).toContain("clearPerson(a,x,z)");
  expect(ped).toContain("setPlayerOccupancy");
  const physics=source("src/game/physics/rapier-world.ts");
  expect(physics).toContain("syncNearbyPedestrians");
  expect(physics).toContain(".slice(0,24)");
 });
 it("has no eager non-Sedan vehicle GLB import in the North Heights game entrypoint",()=>{
  const engine=source("src/game/experiments/north-heights-city-8.ts");
  const render=source("src/game/experiments/north-heights-sedan-traffic-009.ts");
  expect(engine).not.toContain("createMercerExtraParkedGLBs");
  expect(engine).toContain("0 parked GLB vehicle loads");
  expect(render).toContain("sourceGLBs:0");
  expect(existsSync(resolve(process.cwd(),"public/GLBs/Cars"))).toBe(true);
 });
 it("retains map gestures and uses the same glass treatment for time and music",()=>{
  const map=source("src/ui/hud/north-heights-map-010.tsx");
  const hud=source("src/ui/hud/game-hud.tsx");
  const route=source("src/routes/north-heights-preview.tsx");
  expect(map).toContain("poi009-expanded-map-closing");
  expect(map).toContain("onMachineTarget(");
  expect(map).toContain("pinch.current");
  expect(hud).toContain("poi-game-glass-panel");
  expect(route).toContain('aria-label="Vehicle music"');
  expect(route).toContain('playMapCue("open")');
 });
});
