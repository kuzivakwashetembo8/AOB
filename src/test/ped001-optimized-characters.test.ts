import {describe,it,expect} from "vitest";
import {PED001_OPTIMIZED_FILES,PED001_OPTIMIZED_SOURCE_BYTES,PED001_OPTIMIZED_TOTAL_BYTES,
 pedestrianCharacterEligible001,pedestrianCharacterClip001}
 from "@/game/experiments/north-heights-pedestrian-characters-001";
import {PED001_POPULATION,NorthHeightsPedestrianSimulator001}
 from "@/game/experiments/north-heights-pedestrian-simulator-001";
import type {BuildingSpec} from "@/game/world-generation/schema";
const building=(id:string,x:number,z:number):BuildingSpec=>({
 id,seed:id,archetype:"residential",yawRadians:0,position:{x,y:0,z},
 overrides:{width:10,depth:12,floors:3,floorHeight:3.1},
});
describe("PED-001 optimized character representation",()=>{
 it("uses ten distinct optimized files and no unoptimized GLB variants",()=>{
   expect(PED001_OPTIMIZED_FILES).toHaveLength(10);
   expect(new Set(PED001_OPTIMIZED_FILES).size).toBe(10);
   expect(PED001_OPTIMIZED_SOURCE_BYTES.every(size=>size<1048576)).toBe(true);
   expect(PED001_OPTIMIZED_TOTAL_BYTES).toBe(7285620);
 });
 it("assigns ten appearances to 100 stable identities, without changing routes",()=>{
   const sim=new NorthHeightsPedestrianSimulator001([
     building("A",-294,-288),building("B",-286,-288),
     building("C",-278,-288),building("D",-270,-288),
   ]);
   expect(sim.population).toBe(PED001_POPULATION);
   expect(new Set(sim.agents.map(a=>a.id)).size).toBe(100);
   const counts=new Map<number,number>();
   for(const a of sim.agents)counts.set(a.appearanceId,(counts.get(a.appearanceId)??0)+1);
   expect([...counts.values()]).toEqual(Array(10).fill(10));
 });
 it("keeps active pedestrians across visibility hysteresis and removes inside agents",()=>{
   const point={x:0,z:0};
   const a={x:130,z:0,state:"walk" as const};
   expect(pedestrianCharacterEligible001(a,point,false,false)).toBe(true);
   expect(pedestrianCharacterEligible001({...a,x:180},point,false,false)).toBe(false);
   expect(pedestrianCharacterEligible001({...a,x:180},point,true,false)).toBe(true);
   expect(pedestrianCharacterEligible001({...a,state:"inside"},point,true,false)).toBe(false);
 });
 it("maps waiting to Idle and sidewalk, park and crossing to Walk",()=>{
   expect(pedestrianCharacterClip001("wait")).toBe("idle");
   for(const state of ["walk","park","cross","depart","arrive"] as const)
     expect(pedestrianCharacterClip001(state)).toBe("walk");
 });
});
