import {describe,expect,it} from "vitest";
import {MeshBuilder,NullEngine,Scene} from "@babylonjs/core";
import {createNorthHeightsWalk005,northHeightsBuildingCollision005} from "../game/experiments/north-heights-physics-005";
import {northHeightsGround} from "../game/experiments/north-heights-reconstruction-001";
import type {BuildingSpec} from "../game/world-generation/schema";

describe("NH-REBUILD-005 real Rapier walking and solid buildings",()=>{
  const lot:BuildingSpec={
    id:"NH-TEST-01",seed:"NH-TEST-01",archetype:"office",yawRadians:0,
    position:{x:4,y:0,z:-31},
    overrides:{width:2,depth:10,floors:6,floorHeight:3.2},
  };
  it("builds a blocking collider aligned to actual authored lot footprint and height",()=>{
    const box=northHeightsBuildingCollision005([lot])[0]!;
    expect(box.position.x).toBe(4);
    expect(box.halfExtents.x).toBe(1);
    expect(box.halfExtents.z).toBe(5);
    expect(box.halfExtents.y).toBeCloseTo(9.6,5);
    expect(box.position.y).toBeGreaterThan(northHeightsGround(4,-31));
  });
  it("grounds capsule on terrain and blocks horizontal movement through building",async()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    let walk:Awaited<ReturnType<typeof createNorthHeightsWalk005>>|null=null;
    try{
      const surface=northHeightsGround(0,-31);
      for(const [name,dy] of [
        ["nh-ridge-terrain",-.04],
        ["nh003-road:asphalt",.075],
        ["nh003-road:pavement",.20],
      ] as const){
        const plane=MeshBuilder.CreateGround(name,{width:96,height:96,subdivisions:1},scene);
        plane.position.set(0,surface+dy,-31);
        plane.bakeCurrentTransformIntoVertices();
      }
      walk=await createNorthHeightsWalk005(scene,[lot],{x:0,z:-31});
      expect(walk.buildingCount).toBe(1);
      expect(walk.surfaceCount).toBe(3);
      let last=walk.physics.playerPosition(),grounded=false;
      for(let i=0;i<125;i++){
        const v=walk.step({x:1,z:0,speed:5,dt:1/60,jump:false});
        last=v.position;grounded=v.grounded;
      }
      expect(grounded).toBe(true);
      expect(last.x).toBeGreaterThan(0);
      expect(last.x).toBeLessThan(2.8);
      expect(last.y).toBeGreaterThan(surface+.75);
    }finally{walk?.dispose();scene.dispose();engine.dispose();}
  });
});
