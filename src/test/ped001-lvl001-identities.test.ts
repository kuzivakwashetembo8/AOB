import {describe,it,expect} from "vitest";
import {PED001_POPULATION} from "@/game/experiments/north-heights-pedestrian-simulator-001";
import {
 DIANE_AGENT_ID_001,DIANE_APPEARANCE_001,DIANE_OFFICERS_001,
} from "@/game/experiments/level001-diane-007";

describe("LVL-001 mission identities against reduced pedestrian population",()=>{
 it("keeps Diane and all three officers inside the 60-agent population",()=>{
  const missionIds=[DIANE_AGENT_ID_001,...DIANE_OFFICERS_001];
  expect(PED001_POPULATION).toBe(60);
  expect(DIANE_AGENT_ID_001).toBe("PED-060");
  expect(DIANE_APPEARANCE_001).toBe(60);
  expect(new Set(missionIds).size).toBe(4);
  for(const id of missionIds){
   const index=Number(id.slice(4));
   expect(Number.isInteger(index)).toBe(true);
   expect(index).toBeGreaterThanOrEqual(1);
   expect(index).toBeLessThanOrEqual(PED001_POPULATION);
  }
 });
});
