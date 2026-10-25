import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {northHeightsActionControl007,northHeightsUnavailableAction007} from "../game/experiments/north-heights-controls-007";
const route=readFileSync(new URL("../routes/north-heights-preview.tsx",import.meta.url),"utf8");
const engine=readFileSync(new URL("../game/experiments/north-heights-city-8.ts",import.meta.url),"utf8");
describe("NH-007 shared settings and controls",()=>{
  it("renders the exact GTD touch and desktop control components, rather than local buttons",()=>{
    expect(route).toContain("<TouchControls settings={settings} send={send}");
    expect(route).toContain("<DesktopControls send={send}");
    expect(route).toContain("<SettingsEditor inGame initialSettings={settings}");
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
    expect(engine).toContain("createMercerStaticCharacter(scene)");
    expect(engine).toContain("actor.anchor.setEnabled(enabled)");
    expect(engine).toContain("humanoid.root.setEnabled(!enabled)");
    expect(engine).toContain("controller.setMode(mode===\"walk\"?\"fly\":\"walk\")");
    expect(engine).not.toContain("loadWitness(scene");
  });
});
