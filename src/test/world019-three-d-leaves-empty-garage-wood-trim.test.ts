import {describe,it,expect} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {NullEngine,Scene} from "@babylonjs/core";
import {planBuilding} from "../game/world-generation/architecture-plan";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {resolveCityBuildings} from "../game/world-generation/defaults";
import {generateBuilding} from "../game/world-generation/building-generator";
import {cleanWoodBuildingSurrounds,isExcessWoodSurround}
  from "../game/world-generation/wood-exterior-cleanup-019";
import {woodSurfaceForBuilding} from "../game/world-generation/wood-south-ward-field-trial";
import {planTreeCanopy} from "../game/world-generation/tree-canopy";
import {planStreetContext} from "../game/world-generation/street-context";

describe("GTD-TREE/MAT/WORLD-019 owner-directed cleanups",()=>{
  it("retires leaves.glb and preserves deterministic procedural tree canopy",()=>{
    expect(existsSync(join(process.cwd(),"public/GLBs/Nature/leaves.glb"))).toBe(false);
    const tree=planStreetContext(FIRST_LIGHT_CITY_SPEC).items.find(i=>i.kind==="tree")!;
    const plan=planTreeCanopy(tree,FIRST_LIGHT_CITY_SPEC.generatorVersion);
    expect(plan.cards).toHaveLength(30);
    expect(planTreeCanopy(tree,FIRST_LIGHT_CITY_SPEC.generatorVersion)).toEqual(plan);
  });
  it("preserves original wood-family WALL mesh surfaces and roof shells, removes only surrounds",()=>{
    const buildings=resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
    const engine=new NullEngine(),scene=new Scene(engine);
    try{
      const chosen=buildings.filter(b=>!!woodSurfaceForBuilding(b.id,true));
      expect(chosen.map(b=>b.id)).toEqual(["sw-fl-west-support","sw-fl-rear-residential"]);
      for(const b of chosen){
        const plan=planBuilding(b,FIRST_LIGHT_CITY_SPEC.generatorVersion);
        const untouchedRoof=plan.primitives.filter(p=>p.role==="roof").length;
        const originalWalls=plan.primitives.filter(p=>p.role==="wall").length;
        const cleaned=cleanWoodBuildingSurrounds(plan.primitives,true);
        expect(cleaned.filter(p=>p.role==="wall")).toHaveLength(originalWalls);
        expect(cleaned.filter(p=>p.role==="roof")).toHaveLength(untouchedRoof);
        expect(cleaned.some(isExcessWoodSurround)).toBe(false);
        expect(cleaned.some(p=>p.role==="trim")).toBe(false);
        expect(cleaned.filter(p=>p.role==="glass").length)
          .toBe(plan.primitives.filter(p=>p.role==="glass").length);
        expect(cleaned.filter(p=>p.id.startsWith("door-panel:")).length)
          .toBe(plan.primitives.filter(p=>p.id.startsWith("door-panel:")).length);
        expect(cleanWoodBuildingSurrounds(plan.primitives,false))
          .toEqual(cleaned);
        const building=generateBuilding(scene,null,b,{
          generatorVersion:FIRST_LIGHT_CITY_SPEC.generatorVersion,
          enableWoodSurfaceFieldTrial:true,enableFacadeDetails:true,
        });
        expect(building.meshes.some(m=>m.material?.name.startsWith("experiment:wood-")))
          .toBe(true);
        expect(building.meshes.some(m=>m.name.includes(":roof:")&&m.name.includes(":slab")))
          .toBe(true);
        expect(building.meshes.some(m=>m.name.includes(":roof:")&&m.name.includes(":parapet:")))
          .toBe(false);
        expect(building.meshes.some(m=>m.name.includes("frame:"))).toBe(false);
        expect(building.meshes.some(m=>m.metadata?.templateId?.startsWith("facade-")))
          .toBe(false);
        expect(building.meshes.some(m=>m.metadata?.architecturalRole==="trim"))
          .toBe(false);
        building.dispose();
      }
    }finally{scene.dispose();engine.dispose();}
  });
});
