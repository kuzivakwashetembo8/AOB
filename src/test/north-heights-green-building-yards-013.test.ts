import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {NullEngine,Scene,StandardMaterial,VertexBuffer} from "@babylonjs/core";
import {
  createNorthHeightsBlockSurfaces008,planNorthHeightsBlockSurfaces008,
} from "../game/experiments/north-heights-block-surfaces-008";
import {NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010} from
  "../game/experiments/north-heights-spatial-plan-010";
import {
  NORTH_HEIGHTS_COORDS,
} from "../game/world-generation/north-heights-location-009";

const middle=Array.from({length:10},(_,i)=>-288+i*64);
const ground=(x:number,z:number)=>x*.018+z*.007+5;
const near=(a:number,b:number)=>Math.abs(a-b)<.0001;
const hasCenter=(vertices:ArrayLike<number>,x:number,z:number)=>{
  for(let i=0;i<vertices.length;i+=3)
    if(near(vertices[i]!,x)&&near(vertices[i+2]!,z))return true;
  return false;
};

describe("NH-YARD-013 replace white building-land panels with authentic park grass",()=>{
  it("keeps exactly two parking pads concrete and greens the other 98 parcels",()=>{
    expect(NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010.size).toBe(2);
    const surfacePlan=planNorthHeightsBlockSurfaces008(
      middle,NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010,[]);
    expect(surfacePlan).toEqual({parks:98,concreteBlocks:2,treeWells:0});

    const engine=new NullEngine(),scene=new Scene(engine);
    try{
      const grass=new StandardMaterial("existing-park-grass",scene);
      const concrete=new StandardMaterial("parking-concrete",scene);
      const result=createNorthHeightsBlockSurfaces008(scene,{
        middle,occupied:NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010,
        ground,trees:[],grass,concrete,
      });
      expect(result).toEqual({parks:98,pavements:2,wells:0});

      const lawn=scene.getMeshByName("nh008-block:grass")!;
      const paved=scene.getMeshByName("nh008-block:concrete")!;
      expect(lawn.material).toBe(grass);
      expect(paved.material).toBe(concrete);
      const lawnPos=lawn.getVerticesData(VertexBuffer.PositionKind)!;
      const pavedPos=paved.getVerticesData(VertexBuffer.PositionKind)!;
      expect(lawnPos.length/3).toBe(98*25);
      expect(pavedPos.length/3).toBe(2*25);
      // Two downtown examples with building facades; neither is a park.
      expect(hasCenter(lawnPos,32,-96)).toBe(true); // NH-04-06
      expect(hasCenter(lawnPos,-32,-32)).toBe(true); // NH-05-05
      // Both parking blocks remain solid concrete, with no grass paint.
      expect(hasCenter(pavedPos,-32,-160)).toBe(true); // NH-03-05
      expect(hasCenter(pavedPos,96,-96)).toBe(true); // NH-04-07
      expect(hasCenter(lawnPos,-32,-160)).toBe(false);
      expect(hasCenter(lawnPos,96,-96)).toBe(false);
      // Exact same height treatment and material as existing parks; no
      // overlay over the 8m two-lane roadway or 3.75m raised sidewalk.
      for(let p=0;p<lawnPos.length;p+=3){
        const x=lawnPos[p]!,y=lawnPos[p+1]!,z=lawnPos[p+2]!;
        expect(y).toBeCloseTo(ground(x,z)+.065,4);
        const roadDistance=Math.min(...NORTH_HEIGHTS_COORDS.map(c=>
          Math.min(Math.abs(c-x),Math.abs(c-z))));
        expect(roadDistance).toBeGreaterThanOrEqual(7.85-.0001);
      }
    }finally{scene.dispose();engine.dispose();}
  });

  it("changes only yard material selection, retaining road geometry and white interiors",()=>{
    const reconstruction=readFileSync(resolve(process.cwd(),
      "src/game/experiments/north-heights-reconstruction-001.ts"),"utf8");
    const roads=readFileSync(resolve(process.cwd(),
      "src/game/experiments/north-heights-roads-003.ts"),"utf8");
    expect(reconstruction).toContain("occupied:NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010");
    expect(reconstruction).toContain('grass:city.mat("grass"),concrete:city.mat("concrete")');
    expect(reconstruction).toContain('city.box("interior-white"');
    expect(reconstruction).toContain('createNorthHeightsRoads003(scene,STREETS,northHeightsGround');
    expect(roads).toContain("NORTH_HEIGHTS_SIDEWALK_OUTER_003=7.75");
  });
});
