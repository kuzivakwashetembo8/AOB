// @vitest-environment node
import {describe,it,expect,vi} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {MERCER_EXTRA_GLB_SPECS} from "../game/vehicles/mercer-additional-parked-glbs-006";
import {
  MERCER_STATIC_CHARACTER_PATH,MERCER_STATIC_CHARACTER_POSE,
  stopStaticCharacterAnimations,
} from "../game/world/mercer-static-character-103";

describe("OBS-103 optimized assets and static Mercer character",()=>{
  it("loads the optimized owner Rover and Hilux only",()=>{
    const folder=resolve(process.cwd(),"public/GLBs/Cars");
    const rover=MERCER_EXTRA_GLB_SPECS.find(x=>x.id==="gtd-veh006-mercer-range-rover");
    const hilux=MERCER_EXTRA_GLB_SPECS.find(x=>x.id==="gtd-veh008-mercer-toyota-hilux");
    expect(rover).toMatchObject({
      url:"/GLBs/Cars/Range%20Rover%20Sports%202018%20(.GLB).glb",
      sourceBytesKnown:1605108,
    });
    expect(hilux).toMatchObject({
      url:"/GLBs/Cars/toyota%20hilux%20002.glb",
      sourceBytesKnown:323576,
    });
    expect(readFileSync(resolve(folder,"Range Rover Sports 2018 (.GLB).glb")).length)
      .toBe(rover?.sourceBytesKnown);
    expect(readFileSync(resolve(folder,"toyota hilux 002.glb")).length)
      .toBe(hilux?.sourceBytesKnown);
    expect(existsSync(resolve(folder,"Range Rover Sports 2018 (.GLB) (1).glb")))
      .toBe(false);
  });
  it("uses a single static, categorized owner character with no animation requests",()=>{
    expect(MERCER_STATIC_CHARACTER_PATH).toBe("/GLBs/Characters/character.glb");
    expect(existsSync(resolve(process.cwd(),"public/GLBs/character.glb"))).toBe(false);
    const bytes=readFileSync(resolve(process.cwd(),"public/GLBs/Characters/character.glb"));
    expect(bytes.length).toBe(12197104);
    expect(bytes.toString("ascii",0,4)).toBe("glTF");
    expect(MERCER_STATIC_CHARACTER_POSE.x).toBe(-19.5);
    expect(MERCER_STATIC_CHARACTER_POSE.z).toBe(13.35);
    const one={stop:vi.fn()},two={stop:vi.fn()};
    stopStaticCharacterAnimations([one,two]);
    expect(one.stop).toHaveBeenCalledOnce();
    expect(two.stop).toHaveBeenCalledOnce();
  });
});