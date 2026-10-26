import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {NullEngine,Scene} from "@babylonjs/core";
import {createTemerarioRimFaceOverlay007} from "@/game/vehicles/native-vehicle-geometry-001";

/** A/B control intentionally does not load high-poly BMW mesh.
 * Source extraction is preserved in original feature branch and script. */
describe("GEN-VEH-006 BMW render cost isolation A/B",()=>{
 it("retains all 125 deterministic agents and all 21 BMW IDs",()=>{
   const sim=new NH012TrafficSimulator(125,120125);
   const s=sim.snapshot();
   expect(s.count).toBe(125);
   expect(s.agents.filter(a=>a.modelId==="gtd-veh014-mercer-bmw-m4")).toHaveLength(21);
   expect(sim.validate()).toEqual([]);
 });
 it("keeps original extractor documented while removing detailed BMW rendering",()=>{
   const traffic=readFileSync("src/game/experiments/north-heights-traffic-3d-016.ts","utf8");
   const geometry=readFileSync("src/game/vehicles/native-vehicle-geometry-001.ts","utf8");
   const pkg=JSON.parse(readFileSync("package.json","utf8"));
   expect(readFileSync("scripts/genveh006-extract-bmw.mjs","utf8")).toContain("WHeelsandrims_2");
   expect(traffic).not.toContain("createBMWSourceMesh006");
   expect(traffic).not.toContain("write(bmwBody(");
   expect(traffic).not.toContain("write(bmwWheel(");
   expect(geometry).not.toContain("BMW_SOURCE_PARTS_006");
   expect(pkg.scripts.prebuild).not.toContain("genveh006-extract-bmw");
   expect(traffic).toContain('get("body:"+a.modelId+":"+paint,paint,"body",spec)');
   expect(traffic).toContain('write(roverPart("paint",paint),world)');
   expect(traffic).toContain('write(sourcedWheel(corner,"tire"),transform)');
 });
 it("retains Lamborghini split-spoke improvement as controlled constant",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   try{
     const m=createTemerarioRimFaceOverlay007(scene,"a/b rim");
     expect(m.getTotalIndices()).toBeGreaterThan(200);
   }finally{scene.dispose();engine.dispose();}
 });
});