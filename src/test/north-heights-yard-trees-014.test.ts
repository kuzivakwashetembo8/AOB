import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import type {BuildingSpec} from "../game/world-generation/schema";
import {planNorthHeightsYardTrees014} from "../game/experiments/north-heights-yard-trees-014";
import {NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010} from "../game/experiments/north-heights-spatial-plan-010";
const centres=Array.from({length:10},(_,i)=>-288+i*64);
const blocks=(i:number,j:number)=>"NH-"+String(j+1).padStart(2,"0")+"-"+String(i+1).padStart(2,"0");
const ground=(x:number,z:number)=>5+x*.02+z*.01;
const buildings:BuildingSpec[]=[];
for(let j=0;j<10;j++)for(let i=0;i<10;i++){
  const id=blocks(i,j);
  if(NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010.has(id)||(i*5+j*7)%17===0)continue;
  buildings.push({id:id+"-L1",seed:id,archetype:"office",yawRadians:0,
    position:{x:centres[i]!,z:centres[j]!,y:ground(centres[i]!,centres[j]!)},
    overrides:{width:32,depth:34,floors:6,floorHeight:3.2,lodProfile:"standard"}} as BuildingSpec);
}
describe("NH-YARD-014 safe additional street trees",()=>{
  const desktop=planNorthHeightsYardTrees014(buildings,[],ground,false);
  const mobile=planNorthHeightsYardTrees014(buildings,[],ground,true);
  it("plans a dense, deterministic and quality-adaptive forest",()=>{
    expect(desktop.length).toBeGreaterThan(120);
    expect(mobile.length).toBeLessThan(desktop.length);
    expect(planNorthHeightsYardTrees014(buildings,[],ground,false)).toEqual(desktop);
  });
  it("keeps roots off buildings, driveways, parking and sidewalks",()=>{
    const streets=Array.from({length:11},(_,i)=>-320+i*64);
    for(const tree of desktop){
      expect(tree.y).toBeCloseTo(ground(tree.x,tree.z),5);
      expect(Math.min(...streets.map(a=>Math.min(Math.abs(tree.x-a),Math.abs(tree.z-a)))))
        .toBeGreaterThanOrEqual(9);
      for(const building of buildings){
        const w=building.overrides?.width??12,d=building.overrides?.depth??12;
        expect(Math.abs(tree.x-building.position.x)>=w/2+2.35 ||
          Math.abs(tree.z-building.position.z)>=d/2+2.35).toBe(true);
        // An entry path belongs only to this building parcel, not every
        // matching X coordinate across the next city block.
        expect(Math.abs(tree.x-building.position.x)>=3.7 ||
          tree.z<building.position.z+d/2-.6 ||
          tree.z>building.position.z+22.8).toBe(true);
      }
    }
    for(let i=0;i<desktop.length;i++)for(let j=0;j<i;j++){
      const a=desktop[i]!,b=desktop[j]!;
      expect((a.x-b.x)**2+(a.z-b.z)**2).toBeGreaterThanOrEqual(7.4**2);
    }
  });
  it("uses existing GLB thin instances without touching traffic/physics",()=>{
    const src=(name:string)=>readFileSync(resolve(process.cwd(),name),"utf8");
    const trees=src("src/game/experiments/north-heights-trees-004.ts");
    const world=src("src/game/experiments/north-heights-reconstruction-001.ts");
    const city=src("src/game/experiments/north-heights-city-8.ts");
    expect(trees).toContain('thinInstanceSetBuffer("matrix"');
    expect(world).toContain("const parkPlan=[...establishedTrees,...addedYardTrees]");
    expect(city).toContain("treeHandle?.update(camera.position,dt)");
    expect(city).toContain("NH012TrafficSimulator");
  });
});