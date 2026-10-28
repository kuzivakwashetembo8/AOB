import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const css=readFileSync("src/styles.css","utf8");
const desktop=readFileSync("src/ui/hud/desktop-controls.tsx","utf8");
const touch=readFileSync("src/ui/hud/touch-controls.tsx","utf8");
describe("NH-OPT2: accepted uniform action layout",()=>{
 it("uses the same three-column grid and equal-sized action cells on touch",()=>{
  expect(css).toContain("grid-template-columns: repeat(3, 48px)");
  expect(css).toContain("grid-auto-rows: 48px");
  expect(css).toMatch(/\.touch-actions \.gtd-uniform-action\.control-button \{[\s\S]*?width: 48px;[\s\S]*?height: 48px;/);
  expect(css).toContain("grid-template-columns: repeat(3, 42px)");
 });
 it("keeps desktop actions equal and does not promote sprint",()=>{
  expect(css).toMatch(/\.desktop-action-pad \.gtd-uniform-action\.desktop-control-button \{[\s\S]*?width: 42px;[\s\S]*?height: 42px;/);
  expect(css).not.toContain(".desktop-action-pad .gtd-action-sprint");
  expect(css).not.toContain(".touch-actions .gtd-action-sprint");
  expect(css).not.toContain("grid-column:2; grid-row:2");
 });
 it("uses the uniform class on both control surfaces without changing action filtering",()=>{
  expect(desktop).toContain("desktop-control-button gtd-uniform-action gtd-action-");
  expect(touch).toContain("gtd-uniform-action gtd-action-");
  expect(desktop).toContain('driving ? action==="vehicle"&&canExitVehicle');
  expect(touch).toContain("visibleTouchActions(driving,flying,canEnterVehicle,canExitVehicle)");
 });
});
