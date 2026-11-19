import {describe,expect,it} from "vitest";
import {
 pedestrianCharacterEligible001,pedestrianCharacterPriority001,
} from "@/game/experiments/north-heights-pedestrian-characters-001";

describe("NH-012 Stage 2 player-centred pedestrian residency",()=>{
 const centre={x:0,z:0};
 const agent=(x:number,z:number,state:"walk"|"wait"|"cross"|"inside"="walk")=>({x,z,state});
 it("uses desktop enter and exit radii with hysteresis",()=>{
  expect(pedestrianCharacterEligible001(agent(135,0),centre,false,false)).toBe(true);
  expect(pedestrianCharacterEligible001(agent(205,0),centre,true,false)).toBe(true);
  expect(pedestrianCharacterEligible001(agent(205.01,0),centre,true,false)).toBe(false);
  expect(pedestrianCharacterEligible001(agent(135.01,0),centre,false,false)).toBe(false);
 });
 it("uses the narrower mobile profile",()=>{
  expect(pedestrianCharacterEligible001(agent(105,0),centre,false,true)).toBe(true);
  expect(pedestrianCharacterEligible001(agent(170,0),centre,true,true)).toBe(true);
  expect(pedestrianCharacterEligible001(agent(170.01,0),centre,true,true)).toBe(false);
  expect(pedestrianCharacterEligible001(agent(105.01,0),centre,false,true)).toBe(false);
 });
 it("never activates pedestrians in their logical inside state",()=>{
  expect(pedestrianCharacterEligible001(agent(0,0,"inside"),centre,false,false)).toBe(false);
 });
 it("prioritizes crossing and waiting pedestrians over ordinary walkers",()=>{
  expect(pedestrianCharacterPriority001("cross")).toBe(0);
  expect(pedestrianCharacterPriority001("wait")).toBe(0);
  expect(pedestrianCharacterPriority001("walk")).toBe(1);
 });
});
