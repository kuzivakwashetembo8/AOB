import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

describe("North Heights exterior-only building policy",()=>{
  it("uses uninterrupted window glazing and a continuous foundation on every facade",()=>{
    const visual=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-reconstruction-001.ts"),"utf8");
    expect(visual).toContain("const entranceFace=false;");
    expect(visual).toContain("All facade bays are closed glazing");
    expect(visual).toContain('city.box("concrete",x,skirtY,z+d/2,w,skirt,.22)');
  });

  it("closes the physical +Z wall instead of retaining a pedestrian portal",()=>{
    const physics=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-physics-005.ts"),"utf8");
    expect(physics).toContain("wall(x,shellBase+shellH/2,z+d/2,w/2,shellH/2,t/2)");
    expect(physics).not.toContain("northHeightsDoorway010");
    const city=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-city-8.ts"),"utf8");
    expect(city).toContain("buildingInteriors=[]");
  });

  it("removes Finch HQ office and reception furnishing while preserving the lift",()=>{
    const lobby=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-finch-lobby-004.ts"),"utf8");
    const suite=readFileSync(resolve(process.cwd(),"src/game/experiments/north-heights-finch-suite-005.ts"),"utf8");
    expect(lobby).not.toContain('box("desk-front"');
    expect(lobby).not.toContain("PED002_NPC_FILES");
    expect(lobby).toContain("car-side-glass");
    expect(lobby).toContain("requestTravel");
    expect(suite).not.toContain("createFinchRoomTrial022");
    expect(suite).not.toContain("createFinchCafeFloor024");
    expect(suite).toContain("getFinchLocation");
  });
});
