import {describe,it,expect} from "vitest";
import {NullEngine,Scene,StandardMaterial} from "@babylonjs/core";
import {SOUTH_WARD_018_BOUNDS,SOUTH_WARD_018_BASE_AREA_M2,
  SOUTH_WARD_018_EXPANDED_AREA_M2,SOUTH_WARD_018_BASE_ROAD_METRES,
  SOUTH_WARD_018_NEW_ROAD_METRES,SOUTH_WARD_018_ROADS,createOpenSouthWard018}
  from "../game/world-generation/south-ward-open-roads-018";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {planRoadGraph,projectToRoad} from "../game/world-generation/road-graph";
import {southWardLocationAt} from "../game/world-generation/south-ward-location";
import type {MeridianPhysics} from "../game/physics/rapier-world";

describe("WORLD-018 10x connected, grass-only open South Ward",()=>{
  it("grows exactly 10x playable terrain area without modifying original building plan",()=>{
    expect(SOUTH_WARD_018_BASE_AREA_M2).toBe(20800);
    expect(SOUTH_WARD_018_EXPANDED_AREA_M2).toBe(208000);
    expect(SOUTH_WARD_018_EXPANDED_AREA_M2/SOUTH_WARD_018_BASE_AREA_M2).toBe(10);
    expect(SOUTH_WARD_018_NEW_ROAD_METRES).toBeGreaterThan(
      10*SOUTH_WARD_018_BASE_ROAD_METRES);
    expect(FIRST_LIGHT_CITY_SPEC.districts.flatMap(d=>d.neighborhoods.flatMap(n=>
      n.blocks.flatMap(b=>b.lots))).filter(l=>!!l.building)).toHaveLength(10);
    expect(FIRST_LIGHT_CITY_SPEC.roads.segments).toHaveLength(5);
    expect(SOUTH_WARD_018_ROADS.segments.every(s=>s.roadClass==="local"&&
      s.width===8&&s.sidewalkWidth===3.75)).toBe(true);
  });
  it("generates one collision-ready connected topology, including 4 flush legacy endpoints",()=>{
    const plan=planRoadGraph(SOUTH_WARD_018_ROADS);
    expect(plan.surfaces.length).toBe(SOUTH_WARD_018_ROADS.segments.length);
    expect(plan.junctions.filter(j=>j.kind==="four-way").length).toBeGreaterThan(12);
    const nodes=new Map(SOUTH_WARD_018_ROADS.nodes.map(n=>[n.id,n.position]));
    for(const s of SOUTH_WARD_018_ROADS.segments){
      for(const p of [nodes.get(s.startNodeId)!,nodes.get(s.endNodeId)!]){
        expect(p.x).toBeGreaterThan(SOUTH_WARD_018_BOUNDS.left);
        expect(p.x).toBeLessThan(SOUTH_WARD_018_BOUNDS.right);
        expect(p.z).toBeGreaterThan(SOUTH_WARD_018_BOUNDS.north);
        expect(p.z).toBeLessThan(SOUTH_WARD_018_BOUNDS.south);
      }
    }
    for(const x of [-80,80])for(const z of [8,48]){
      const ends=SOUTH_WARD_018_ROADS.segments.filter(s=>{
        const n=nodes.get(x===-80?s.endNodeId:s.startNodeId);
        return n?.x===x&&n?.z===z;
      });
      expect(ends).toHaveLength(1);
    }
    // Connected when the four matching legacy parity road mouths are counted.
    expect(projectToRoad(SOUTH_WARD_018_ROADS,{x:190,y:0,z:120})!.distance).toBe(0);
    expect(southWardLocationAt({x:190,y:0,z:120})).toBe("South Ward // South Field Road");
    expect(southWardLocationAt({x:-25,y:0,z:8})).toBe("South Ward // Mercer Street");
  });
  it("renders asphalt/sidewalk/curb/markings in exactly four batches with disposable curbs",()=>{
    const engine=new NullEngine();
    const scene=new Scene(engine);
    for(const name of ["generated-asphalt","generated-sidewalk",
      "generated-curb","generated-road-marking"])new StandardMaterial(name,scene);
    let live=0;
    const physics={
      addStaticBox(_position:unknown,_half:unknown,_yaw?:number){
        live++;
        let disposed=false;
        return {dispose(){if(!disposed){disposed=true;live--;}}};
      },
    } as unknown as MeridianPhysics;
    try{
      const added=createOpenSouthWard018(scene,physics);
      expect(added.meshes).toHaveLength(4);
      expect(added.meshes.every(m=>m.getTotalVertices()>0)).toBe(true);
      expect(added.colliderCount).toBeGreaterThan(100);
      expect(live).toBe(added.colliderCount);
      expect(added.meshes.reduce((sum,m)=>sum+m.getTotalVertices(),0))
        .toBeLessThan(25000);
      added.dispose();
      expect(live).toBe(0);
    }finally{scene.dispose();engine.dispose();}
  });
});
