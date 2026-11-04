import { describe, expect, it } from "vitest";
import {
  Color3, NullEngine, Scene, StandardMaterial, VertexBuffer,
} from "@babylonjs/core";
import { createNorthHeightsRoads003 } from "../game/experiments/north-heights-roads-003";

describe("NH-REBUILD-003 isolated South Ward-patterned road/curb checkpoint", () => {
  it("batches the road junctions, sidewalks, curb faces and zebra crossings into four surface meshes", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const make = (name: string) => {
        const material = new StandardMaterial(name, scene);
        material.diffuseColor = Color3.White();
        material.backFaceCulling = false;
        return material;
      };
      const materials = {
        asphalt: make("road"), pavement: make("pavement"),
        curb: make("curb"), crossing: make("crossing"), marking: make("marking"),
      };
      const axes = [-128,-64,0,64,128];
      const plan = createNorthHeightsRoads003(scene, axes,() => 0,materials);
      expect(plan.roads).toBe(10);
      expect(plan.crossings).toBeGreaterThan(0);
      expect(plan.curbs).toBeGreaterThan(0);
      expect(plan.sidewalks).toBeGreaterThan(0);
      expect(plan.surfaceMeshes).toBe(5);
      const layers=scene.meshes.filter(m=>m.name.startsWith("nh003-road:"));
      expect(layers).toHaveLength(5);
      const names=new Set(layers.map(m=>m.name));
      for(const kind of ["asphalt","pavement","curb","crossing","marking"])
        expect(names.has("nh003-road:"+kind)).toBe(true);
      const asphalt=scene.getMeshByName("nh003-road:asphalt")!;
      const walk=scene.getMeshByName("nh003-road:pavement")!;
      const curbs=scene.getMeshByName("nh003-road:curb")!;
      expect(asphalt.getTotalIndices()).toBeGreaterThan(100);
      expect(walk.getTotalIndices()).toBeGreaterThan(100);
      expect(curbs.getTotalIndices()).toBeGreaterThan(100);
      // NH-004: at the central four-way junction there must be precisely one
      // asphalt surface quad; duplicate long road-axis strips previously
      // created black/grey fighting and visible elevated cover bridges.
      // POI-010 appends three-vertex asphalt corner infill to the original
      // four-vertex strips. Never infer quad boundaries from raw vertex strides.
      // The central junction still owns exactly one pad, or two triangles.
      const asphaltPositions=asphalt.getVerticesData(VertexBuffer.PositionKind)!;
      const indices=asphalt.getIndices()!;
      let centralTriangles=0;
      for(let i=0;i<indices.length;i+=3){
        const points=[indices[i]!,indices[i+1]!,indices[i+2]!].map(id=>({
          x:asphaltPositions[id*3]!,z:asphaltPositions[id*3+2]!,
        }));
        if(points.every(p=>Math.abs(p.x)<=4.000001&&Math.abs(p.z)<=4.000001))
          centralTriangles++;
      }
      expect(centralTriangles).toBe(2);
      // NH-005: both perpendicular carriageways and crossing paint must
      // have upward-facing normals. NH-004's +X road strips faced DOWN,
      // making half the road grid render black with identical asphalt.
      for(const part of ["asphalt","pavement","crossing"]){
        const target=scene.getMeshByName("nh003-road:"+part)!;
        const normals=target.getVerticesData(VertexBuffer.NormalKind)!;
        let minNormalY=Infinity;
        for(let i=1;i<normals.length;i+=3)minNormalY=Math.min(minNormalY,normals[i]!);
        expect(minNormalY).toBeGreaterThan(.80);
      }
      const positions=curbs.getVerticesData(VertexBuffer.PositionKind)!;
      const curbY:number[]=[];
      for(let i=1;i<positions.length;i+=3)curbY.push(positions[i]!);
      // Real curb faces run from road top to sidewalk top; not only painted lines.
      expect(curbY.some(y=>Math.abs(y-.075)<.001)).toBe(true);
      expect(curbY.some(y=>Math.abs(y-.20)<.001)).toBe(true);
    } finally { scene.dispose();engine.dispose(); }
  });
});
