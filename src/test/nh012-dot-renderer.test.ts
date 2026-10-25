import {describe,it,expect} from "vitest";
import {NullEngine,Scene,Mesh} from "@babylonjs/core";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {createNorthHeightsTrafficDots012} from "@/game/experiments/north-heights-traffic-dots-012";

describe("NH-012 inexpensive Babylon traffic-dot representation",()=>{
 it("creates only four reusable mesh/material groups and no car GLBs",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const sim=new NH012TrafficSimulator();
   const dots=createNorthHeightsTrafficDots012(scene);
   const own=()=>scene.meshes.filter((m):m is Mesh=>m instanceof Mesh&&m.name.startsWith("nh012-traffic-dot:"));
   expect(own()).toHaveLength(4);
   expect(sim.agents).toHaveLength(125);
   for(let i=0;i<100;i++)sim.step();
   const visible=dots.update(sim.snapshot(),{x:0,z:0});
   expect(visible).toBeGreaterThan(0);
   expect(visible).toBeLessThanOrEqual(125);
   expect(own().reduce((sum,m)=>sum+m.thinInstanceCount,0)).toBe(visible);
   expect(own()).toHaveLength(4);
   dots.dispose();expect(own()).toHaveLength(0);
   scene.dispose();engine.dispose();
 });
});
