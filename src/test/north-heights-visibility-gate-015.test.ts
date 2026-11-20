import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {createNorthHeightsVisibilityGate015} from "../game/experiments/north-heights-visibility-gate-015";
const read=(name:string)=>readFileSync(resolve(process.cwd(),name),"utf8");
describe("NH-VIS-015: one movement-gated GPU instance-buffer optimization",()=>{
  it("avoids repeated static-tree and streetlamp rebuilds when stationary",()=>{
    const gate=createNorthHeightsVisibilityGate015(8);
    expect(gate.shouldRefresh({x:0,z:0})).toBe(true);
    for(let i=0;i<300;i++)
      expect(gate.shouldRefresh({x:0,z:0})).toBe(false);
    expect(gate.shouldRefresh({x:7.99,z:0})).toBe(false);
    expect(gate.shouldRefresh({x:8,z:0})).toBe(true);
    expect(gate.shouldRefresh({x:8,z:0})).toBe(false);
  });
  it("rebuilds after horizontal travel, teleport and a day/night change",()=>{
    const gate=createNorthHeightsVisibilityGate015(8);
    expect(gate.shouldRefresh({x:-200,z:25})).toBe(true);
    expect(gate.shouldRefresh({x:-200,z:32})).toBe(false);
    expect(gate.shouldRefresh({x:-200,z:33})).toBe(true);
    expect(gate.shouldRefresh({x:220,z:-130})).toBe(true);
    gate.invalidate();
    expect(gate.shouldRefresh({x:220,z:-130})).toBe(true);
    expect(gate.shouldRefresh({x:220,z:-130})).toBe(false);
  });
  it("shares one optimization without reducing any tree/lamp population",()=>{
    const trees=read("src/game/experiments/north-heights-trees-004.ts");
    const lamps=read("src/game/experiments/north-heights-street-lamps-012.ts");
    const city=read("src/game/experiments/north-heights-city-8.ts");
    const yards=read("src/game/experiments/north-heights-yard-trees-014.ts");
    expect(trees).toContain("NorthHeightsTreeSpatialIndex004");
    expect(trees).toContain("spatialIndex.update(center,residencyRadius,residencyRadius+24,24)");
    expect(lamps).toContain("createNorthHeightsVisibilityGate015()");
    expect(lamps).toContain("visibilityGate.invalidate()");
    expect(trees).toContain('tree_low_poly_lowpoly.glb');
    expect(lamps).toContain('medellin:"Medellin Street Lamp Optimized.glb"');
    expect(lamps).toContain('modern:"Modern Street Lamp.glb"');
    expect(yards).toContain("planNorthHeightsYardTrees014");
    expect(city).toContain("treeHandle?.update(new Vector3(treeCenter.x,treeCenter.y,treeCenter.z),dt)");
    expect(city).toContain("lampHandle?.update(camera.position,dt)");
  });
});
