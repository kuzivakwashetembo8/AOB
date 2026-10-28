import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("PED-002 pre-merge checklist 01: no pedestrian proxy dots",()=>{
 const city=readFileSync("src/game/experiments/north-heights-city-8.ts","utf8");
 const ui=readFileSync("src/routes/north-heights-preview.tsx","utf8");
 const renderer=readFileSync("src/game/experiments/north-heights-pedestrian-characters-001.ts","utf8");
 it("does not create, update, or dispose pedestrian dots in the world scene",()=>{
   expect(city).not.toMatch(/createNorthHeightsPedestrianDots001|pedestrianDots|visiblePedestrianDots/);
   expect(city).not.toContain("pedestrianVisualMode");
 });
 it("keeps 100 logical pedestrians and updates only animated character models",()=>{
   expect(city).toContain("new NorthHeightsPedestrianSimulator001(world.lotSpecs,world.treeLocations)");
   expect(city).toContain("pedestrianCharacters.update(pedestrians,camera)");
   expect(city).not.toContain("pedestrianCharacters?.setVisible(");
 });
 it("removes the pedestrian dot toggle from the game HUD",()=>{
   expect(ui).not.toMatch(/ped001-character-dot-toggle|pedestrianVisualMode|setPedestrianVisualMode|COLORED DOTS/);
 });
 it("never substitutes placeholder dots while unique models are loading or fail",()=>{
   expect(renderer).toContain("requestAsset(a.appearanceId)");
   expect(renderer).toContain("pending.size>=maxConcurrentLoads");
   expect(renderer).not.toMatch(/showCharacters|diagnostic dot|keeping dot|showing diagnostic dot/);
 });
});
