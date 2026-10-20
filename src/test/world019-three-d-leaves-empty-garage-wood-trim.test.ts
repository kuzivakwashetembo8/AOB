import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {NullEngine,Scene} from "@babylonjs/core";
import {planBuilding} from "../game/world-generation/architecture-plan";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {resolveCityBuildings} from "../game/world-generation/defaults";
import {generateBuilding} from "../game/world-generation/building-generator";
import {cleanWoodBuildingSurrounds,isExcessWoodSurround}
  from "../game/world-generation/wood-exterior-cleanup-019";
import {woodSurfaceForBuilding} from "../game/world-generation/wood-south-ward-field-trial";
import {AUTHORED_3D_LEAVES_PATH,AUTHORED_3D_LEAVES_GIT_BLOB,
  LEAVES_019_GROUPS_PER_TREE}
  from "../game/world-generation/authored-leaves-019";
import {planTreeCanopy} from "../game/world-generation/tree-canopy";
import {planStreetContext} from "../game/world-generation/street-context";

describe("GTD-TREE/MAT/WORLD-019 owner-directed cleanups",()=>{
  it("uses the exact latest committed owner-authored leaves GLB with actual 3D mesh geometry",()=>{
    expect(AUTHORED_3D_LEAVES_PATH).toBe("/GLBs/Nature/leaves.glb");
    const bytes=readFileSync(join(process.cwd(),"public/GLBs/Nature/GLBs/Nature/leaves.glb"));
    const gitBlob=createHash("sha1")
      .update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
    expect(gitBlob).toBe(AUTHORED_3D_LEAVES_GIT_BLOB);
    expect(bytes.length).toBe(2074384);
    expect(bytes.toString("ascii",0,4)).toBe("glTF");
    expect(bytes.readUInt32LE(4)).toBe(2);
    expect(bytes.readUInt32LE(8)).toBe(bytes.length);
    const jsonBytes=bytes.readUInt32LE(12);
    expect(bytes.toString("ascii",16,20)).toBe("JSON");
    const source=JSON.parse(bytes.subarray(20,20+jsonBytes).toString("utf8"));
    expect(source.meshes.length).toBeGreaterThan(0);
    const primitives=source.meshes.flatMap((mesh:{primitives:{attributes:Record<string,number>}[]})=>mesh.primitives);
    expect(primitives.some((p:{attributes:Record<string,number>})=>Number.isInteger(p.attributes["POSITION"]))).toBe(true);
    expect(source.accessors.some((accessor:{type:string})=>accessor.type==="VEC3")).toBe(true);
    console.info("[TREE-019 SOURCE AUDIT]",JSON.stringify({
      meshes:source.meshes.length,primitives:primitives.length,
      nodes:source.nodes?.length??0,materials:source.materials?.length??0,
      geometries:source.accessors?.length??0,
      sceneRoots:source.scenes?.map((s:{nodes:number[]})=>s.nodes.length)??[],
    }));
  });
  it("spreads foliage deterministically across the existing ten tree-crown centres",()=>{
    const tree=planStreetContext(FIRST_LIGHT_CITY_SPEC).items.find(i=>i.kind==="tree")!;
    const first=planTreeCanopy(tree,FIRST_LIGHT_CITY_SPEC.generatorVersion);
    expect(first.cards).toHaveLength(LEAVES_019_GROUPS_PER_TREE*3);
    const centres=Array.from({length:LEAVES_019_GROUPS_PER_TREE},(_,i)=>first.cards[i*3]!);
    expect(new Set(centres.map(c=>c.x.toFixed(2)+":"+c.z.toFixed(2))).size)
      .toBe(LEAVES_019_GROUPS_PER_TREE);
    expect(centres.some(c=>c.x<-.8)).toBe(true);
    expect(centres.some(c=>c.x>.8)).toBe(true);
    expect(centres.every(c=>c.y>4.5&&c.y<7)).toBe(true);
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
        expect(cleanWoodBuildingSurrounds(plan.primitives,false)).toEqual(plan.primitives);
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
        expect(building.meshes.some(m=>m.name.includes("frame:")&&m.name.includes("ma:pedestrian-door")))
          .toBe(false);
        building.dispose();
      }
    }finally{scene.dispose();engine.dispose();}
  });
});
