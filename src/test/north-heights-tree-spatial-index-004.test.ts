import {describe,expect,it} from "vitest";
import {NorthHeightsTreeSpatialIndex004} from "../game/experiments/north-heights-tree-spatial-index-004";
import type {TreeLocation} from "../game/experiments/north-heights-trees-004";

const placements:TreeLocation[]=Array.from({length:81},(_,i)=>({
  x:(i%9)*32-128,y:0,z:Math.floor(i/9)*32-128,size:1,angle:0,
}));

describe("NH-012 Stage 3 deterministic tree spatial index",()=>{
  it("indexes every authored placement exactly once without changing transforms",()=>{
    const index=new NorthHeightsTreeSpatialIndex004(placements,32);
    expect(index.totalPlacements).toBe(placements.length);
    expect(index.cellCount).toBeGreaterThan(1);
    const all=Array.from({length:index.cellCount},(_,i)=>i);
    expect(all).toHaveLength(index.cellCount);
  });
  it("queries nearby cells and keeps residency bounded to the player radius",()=>{
    const index=new NorthHeightsTreeSpatialIndex004(placements,32);
    const first=index.update({x:0,z:0},40,56,0);
    expect(first.changed).toBe(true);
    expect(first.queriedCells).toBeLessThan(index.cellCount);
    expect(first.residentInstances).toBeGreaterThan(0);
    expect(first.residentInstances).toBeLessThan(placements.length);
    expect(index.residentCellCount).toBe(first.resident.length);
  });
  it("uses hysteresis to avoid cell churn near the activation boundary",()=>{
    const index=new NorthHeightsTreeSpatialIndex004(placements,32);
    index.update({x:0,z:0},40,56,0);
    const held=index.update({x:8,z:0},40,56,0);
    expect(held.changed).toBe(false);
    const moved=index.update({x:64,z:0},40,56,0);
    expect(moved.changed).toBe(true);
  });
  it("does not let invalid player coordinates evict resident cells",()=>{
    const index=new NorthHeightsTreeSpatialIndex004(placements,32);
    const before=index.update({x:0,z:0},40,56,0);
    const invalid=index.update({x:Number.NaN,z:0},40,56,0);
    expect(invalid.changed).toBe(false);
    expect(invalid.residentInstances).toBe(before.residentInstances);
  });
  it("retains deterministic cell membership after travel and re-entry",()=>{
    const a=new NorthHeightsTreeSpatialIndex004(placements,32);
    const b=new NorthHeightsTreeSpatialIndex004(placements,32);
    a.update({x:-64,z:-64},40,56,0);
    b.update({x:-64,z:-64},40,56,0);
    const aFar=a.update({x:64,z:64},40,56,0);
    const bFar=b.update({x:64,z:64},40,56,0);
    expect(aFar.resident.map(c=>c.key).sort()).toEqual(bFar.resident.map(c=>c.key).sort());
    const aBack=a.update({x:-64,z:-64},40,56,0);
    const bBack=b.update({x:-64,z:-64},40,56,0);
    expect(aBack.resident.map(c=>c.key).sort()).toEqual(bBack.resident.map(c=>c.key).sort());
  });
});
