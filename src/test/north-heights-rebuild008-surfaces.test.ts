import {describe,it,expect} from "vitest";
import {Color3,NullEngine,Scene,StandardMaterial,VertexBuffer} from "@babylonjs/core";
import {createNorthHeightsBlockSurfaces008,planNorthHeightsBlockSurfaces008}
  from "../game/experiments/north-heights-block-surfaces-008";
describe("NH-008 park lawns, cement-lot infill and non-striped curbs",()=>{
  it("keeps grass only in vacant park blocks and planting wells",()=>{
    const middle=[-32,32],occupied=new Set(["NH-01-01","NH-02-01"]);
    const trees=[{x:-18,y:0,z:-32,size:1,angle:0},{x:32,y:0,z:32,size:1,angle:0}];
    const plan=planNorthHeightsBlockSurfaces008(middle,occupied,trees);
    expect(plan).toEqual({parks:2,concreteBlocks:2,treeWells:1});
    const engine=new NullEngine(),scene=new Scene(engine);
    try{
      const concrete=new StandardMaterial("concrete",scene),grass=new StandardMaterial("grass",scene);
      concrete.diffuseColor=new Color3(.65,.65,.64);
      grass.diffuseColor=new Color3(.3,.5,.25);
      const result=createNorthHeightsBlockSurfaces008(scene,{
        middle,occupied,ground:()=>0,trees,concrete,grass,
      });
      expect(result).toEqual({parks:2,pavements:2,wells:1});
      const paving=scene.getMeshByName("nh008-block:concrete")!;
      const grassMesh=scene.getMeshByName("nh008-block:grass")!;
      expect(paving.material).toBe(concrete);
      expect(grassMesh.material).toBe(grass);
      for(const p of [paving,grassMesh]){
        const normals=p.getVerticesData(VertexBuffer.NormalKind)!;
        for(let n=1;n<normals.length;n+=3)expect(normals[n]).toBe(1);
      }
    }finally{scene.dispose();engine.dispose();}
  });
});
