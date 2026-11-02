import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
 REESE_PLAYER_PATH_001,REESE_PLAYER_EXPECTED_ANIMATIONS_001,
 REESE_PLAYER_HEIGHT_001,findReeseClip001,reeseGroundClip001,
} from "../game/character/reese-player-001";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");

describe("REESE-001 playable actor replacement",()=>{
 it("references exactly the owner-committed asset and requires the full clip set",()=>{
  expect(REESE_PLAYER_PATH_001).toBe("/GLBs/Reese%20(1).glb");
  expect(REESE_PLAYER_EXPECTED_ANIMATIONS_001).toBe(70);
  expect(REESE_PLAYER_HEIGHT_001).toBe(1.78);
 });
 it("selects only compatible plain-idle and locomotion clips",()=>{
  const list=["Sit idle","Walk back","Reese|Run","Reese|Idle","Reese|Walk","Jump air","Fall"]
   .map(name=>({name}));
  expect(findReeseClip001(list,"idle")?.name).toBe("Reese|Idle");
  expect(findReeseClip001(list,"walk")?.name).toBe("Reese|Walk");
  expect(findReeseClip001(list,"run")?.name).toBe("Reese|Run");
  expect(findReeseClip001(list,"jump_air","jump")?.name).toBe("Jump air");
  expect(findReeseClip001([{name:"Sit idle"}],"idle")).toBeNull();
 });
 it("derives gait and airborne states from the existing physical controller",()=>{
  expect(reeseGroundClip001(0,false,true,0)).toBe("idle");
  expect(reeseGroundClip001(2,false,true,0)).toBe("walk");
  expect(reeseGroundClip001(7,true,true,0)).toBe("run");
  expect(reeseGroundClip001(0,false,false,2)).toBe("jump");
  expect(reeseGroundClip001(0,false,false,-2)).toBe("fall");
 });
 it("uses Reese for North Heights while retaining physics, camera, traffic, and Finch",()=>{
  const game=read("src/game/experiments/north-heights-city-8.ts");
  expect(game).toContain('import { createReesePlayer001 }');
  expect(game).toContain('actor=createReesePlayer001(scene)');
  expect(game).not.toContain('actor=createMercerStaticCharacter(scene)');
  expect(game).toContain("createNorthHeightsWalk005");
  expect(game).toContain("resolveNorthHeightsThirdPersonCamera");
  expect(game).toContain("createFinchSuite005");
  expect(game).toContain("toggleVehicle=()=>");
  expect(read("src/game/world/mercer-static-character-103.ts"))
   .toContain('MERCER_STATIC_CHARACTER_PATH="/GLBs/Characters/character.glb"');
 });
});
