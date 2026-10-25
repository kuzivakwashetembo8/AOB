import { describe, expect, it } from "vitest";
import { planNorthHeightsTrees004 } from "../game/experiments/north-heights-trees-004";

describe("NH-REBUILD-004 owner tree asset placement", () => {
  it("plans deterministic planting sites away from all local roads and raised sidewalks", () => {
    const centres=Array.from({length:10},(_,i)=>-288+i*64);
    const axes=Array.from({length:11},(_,i)=>-320+i*64);
    // Production plans lots in roughly 90 of 100 blocks; reserve scattered
    // unoccupied park pockets rather than making 97 blocks tree parks.
    const occupied=new Set<string>();
    for(let j=0;j<10;j++)for(let i=0;i<10;i++)
      if((i*5+j*7)%17!==0 && !(i===4&&j===7))
        occupied.add("NH-"+String(j+1).padStart(2,"0")+"-"+String(i+1).padStart(2,"0"));
    const ground=(x:number,z:number)=>3+z*.02+x*.01;
    const desktop=planNorthHeightsTrees004(centres,occupied,ground,false);
    const again=planNorthHeightsTrees004(centres,occupied,ground,false);
    const mobile=planNorthHeightsTrees004(centres,occupied,ground,true);
    expect(desktop.length).toBeGreaterThan(50);
    expect(desktop.length).toBeLessThan(200);
    expect(again).toEqual(desktop);
    expect(mobile.length).toBeLessThanOrEqual(desktop.length);
    for(const tree of desktop){
      expect(tree.y).toBeCloseTo(ground(tree.x,tree.z),5);
      const edge=Math.min(...axes.map(v=>Math.abs(tree.x-v)),...axes.map(v=>Math.abs(tree.z-v)));
      expect(edge).toBeGreaterThan(7.75); // outside 8m road + 3.75m sidewalk
      expect(tree.size).toBeGreaterThan(.70);
      expect(tree.angle).toBeGreaterThanOrEqual(0);
      expect(tree.angle).toBeLessThan(Math.PI*2);
    }
  });
});
