import {describe,it,expect} from "vitest";
import {PED002_NPC_FILES,PED002_NPC_BYTES,PED002_NPC_TOTAL_BYTES,ped002FileForAppearance} from "@/game/experiments/north-heights-pedestrian-asset-manifest-002";
import {PED001_OPTIMIZED_FILES,pedestrianCharacterEligible001,pedestrianCharacterClip001} from "@/game/experiments/north-heights-pedestrian-characters-001";
import {PED001_POPULATION,NorthHeightsPedestrianSimulator001} from "@/game/experiments/north-heights-pedestrian-simulator-001";
import type {BuildingSpec} from "@/game/world-generation/schema";
const building=(id:string,x:number,z:number):BuildingSpec=>({
 id,seed:id,archetype:"residential",yawRadians:0,position:{x,y:0,z},
 overrides:{width:10,depth:12,floors:3,floorHeight:3.1},
});
describe("PED-002 unique character appearance",()=>{
 it("maps all 100 reproducible IDs and seeds to one distinct committed GLB",()=>{
   expect(PED002_NPC_FILES).toHaveLength(100);
   expect(new Set(PED002_NPC_FILES).size).toBe(100);
   for(let i=0;i<100;i++)
     expect(ped002FileForAppearance(i+1)).toBe("GTD_NPC_"+String(i+1).padStart(3,"0")+"_S"+(42027+i*7919)+".glb");
   expect(PED002_NPC_FILES.slice(0,10)).toEqual(PED001_OPTIMIZED_FILES.slice(0,10));
   expect(ped002FileForAppearance(0)).toBeNull();
   expect(ped002FileForAppearance(101)).toBeNull();
 });
 it("preserves the 87% under-1 MB optimization checkpoint",()=>{
   expect(PED002_NPC_BYTES.filter(n=>n<1_000_000)).toHaveLength(87);
   expect(PED002_NPC_TOTAL_BYTES).toBe(77245264);
 });
 it("binds the 100 independent routes to 100 distinct appearances",()=>{
   const sim=new NorthHeightsPedestrianSimulator001([
      building("A",-294,-288),building("B",-286,-288),
      building("C",-278,-288),building("D",-270,-288),
   ]);
   expect(sim.population).toBe(PED001_POPULATION);
   expect(new Set(sim.agents.map(a=>a.id)).size).toBe(100);
   expect(new Set(sim.agents.map(a=>a.appearanceId)).size).toBe(100);
   for(let i=0;i<100;i++){
      expect(sim.agents[i]!.id).toBe("PED-"+String(i+1).padStart(3,"0"));
      expect(sim.agents[i]!.appearanceId).toBe(i+1);
   }
 });
 it("retains character visibility hysteresis and interior exclusion",()=>{
   const point={x:0,z:0},a={x:130,z:0,state:"walk" as const};
   expect(pedestrianCharacterEligible001(a,point,false,false)).toBe(true);
   expect(pedestrianCharacterEligible001({...a,x:180},point,false,false)).toBe(false);
   expect(pedestrianCharacterEligible001({...a,x:180},point,true,false)).toBe(true);
   expect(pedestrianCharacterEligible001({...a,state:"inside"},point,true,false)).toBe(false);
 });
 it("preserves the accepted Idle/Walk mappings",()=>{
   expect(pedestrianCharacterClip001("wait")).toBe("idle");
   for(const state of ["walk","park","cross","depart","arrive"] as const)
     expect(pedestrianCharacterClip001(state)).toBe("walk");
 });
});
