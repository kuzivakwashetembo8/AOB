import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {northHeightsActionControl007,northHeightsUnavailableAction007} from "../game/experiments/north-heights-controls-007";
const route=readFileSync(resolve(process.cwd(),"src/routes/north-heights-preview.tsx"),"utf8");
const engine=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-city-8.ts"),"utf8");
describe("NH-007 shared settings and controls",()=>{
  it("renders the exact GTD touch and desktop control components, rather than local buttons",()=>{
    expect(route).toContain("<TouchControls settings={settings} send={send}");
    expect(route).toContain("<DesktopControls send={send}");
    expect(route).toContain("<GTDSettingsOverlay");
    expect(route).not.toContain("const button=(c:Control");
  });
  it("maps jump, sprint and descend to the existing world commands",()=>{
    expect(northHeightsActionControl007("jump")).toBe("up");
    expect(northHeightsActionControl007("sprint")).toBe("fast");
    expect(northHeightsActionControl007("descend")).toBe("down");
    expect(northHeightsActionControl007("fly")).toBeNull();
    expect(northHeightsUnavailableAction007("vehicle")).toMatch(/No drivable vehicle/);
  });
  it("uses one Rapier player with two switchable actual GLB visual actors",()=>{
    expect(engine).toContain("loadMeridiaCharacterTrial(scene)");
    expect(engine).toContain("createReesePlayer001(scene)");
    expect(engine).toContain("actor.anchor.setEnabled(enabled)");
    expect(engine).toContain("humanoid.root.setEnabled(!enabled)");
    // P.O.I: former G key toggles camera-only Machine surveillance, not character flight.
    expect(engine).toContain("controller.toggleMachineCamera()");
    expect(engine).toContain("machineView=!machineView");
    expect(engine).not.toContain("controller.setMode(mode===\"walk\"?\"fly\":\"walk\")");
    expect(engine).not.toContain("loadWitness(scene");
  });
});
