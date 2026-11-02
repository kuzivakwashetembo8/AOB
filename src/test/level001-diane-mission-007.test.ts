import {describe,it,expect} from "vitest";
import {
 DianeLevel001,DIANE_AGENT_ID_001,DIANE_OFFICERS_001,
 DIANE_DIALOGUE_ASSIGNMENT_001,DIANE_DIALOGUE_REPORT_001,
 DIANE_FICTIONAL_SSN_001,parseDianeProgress001,
} from "../game/experiments/level001-diane-007";
import type {PedAgent001,NorthHeightsPedestrianSimulator001} from "../game/experiments/north-heights-pedestrian-simulator-001";
import type {PedGraph001} from "../game/experiments/north-heights-pedestrian-graph-001";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
function rig(){
 const start="sidewalk:start",end="sidewalk:end";
 const graph:PedGraph001={
  nodes:new Map([
   [start,{id:start,x:70,z:-58,kind:"sidewalk"}],
   [end,{id:end,x:70,z:-6,kind:"sidewalk"}],
   ["door:HQ",{id:"door:HQ",x:46,z:-75,kind:"entrance"}],
  ]),
  links:new Map([
   [start,[{to:end,kind:"sidewalk",length:52}]],
   [end,[{to:start,kind:"sidewalk",length:52}]],
   ["door:HQ",[]],
  ]),entrances:new Map([["HQ","door:HQ"]]),
  parks:[],crossings:0,unreachable:[],
 };
 const agents=Array.from({length:100},(_,i)=>({
  id:"PED-"+String(i+1).padStart(3,"0"),
  appearanceId:i+1,origin:"HQ",destination:"HQ",
  x:46,z:-75,speed:1.4,state:"inside",
 })) as PedAgent001[];
 const reserved=new Set<string>();
 const sim={agents,graph,population:100,
  reserveAgents001:(ids:readonly string[])=>ids.forEach(id=>reserved.add(id)),
  releaseAgents001:(ids:readonly string[])=>ids.forEach(id=>reserved.delete(id)),
 } as unknown as NorthHeightsPedestrianSimulator001;
 return {sim,reserved};
}
describe("LVL-001 Diane",()=>{
 it("enforces the four/two dialogue ceiling and stable invalid fictional identity",()=>{
  expect(DIANE_DIALOGUE_ASSIGNMENT_001).toHaveLength(4);
  expect(DIANE_DIALOGUE_REPORT_001).toHaveLength(2);
  expect(DIANE_FICTIONAL_SSN_001.startsWith("000-")).toBe(true);
  expect(parseDianeProgress001("invalid").phase).toBe("unassigned");
  expect(parseDianeProgress001(JSON.stringify({phase:"return",ssn:DIANE_FICTIONAL_SSN_001})).phase)
   .toBe("return");
  expect(parseDianeProgress001(JSON.stringify({phase:"unknown",ssn:DIANE_FICTIONAL_SSN_001})).phase)
   .toBe("unassigned");
 });
 it("uses four of 100 existing unique NPC identities and the accepted sidewalk path",()=>{
  const {sim,reserved}=rig(),history:string[]=[];
  const m=new DianeLevel001(sim,parseDianeProgress001(null),state=>history.push(state.phase));
  expect(sim.agents).toHaveLength(100);
  expect(m.target.id).toBe(DIANE_AGENT_ID_001);
  expect(m.target.appearanceId).toBe(63);
  expect(m.officers.map(a=>a.id)).toEqual([...DIANE_OFFICERS_001]);
  expect(reserved.size).toBe(4);
  expect(m.stage).toBe("unassigned");
  expect(m.assign()).toBe(true);
  expect(m.view.poi).toEqual({x:70,z:-58});
  expect(m.assign()).toBe(false);
  const ground=()=>0;
  m.tick(.05,{x:70,y:.92,z:-58},0,true,ground);
  expect(m.stage).toBe("follow");
  expect(m.view.poi).toBeNull();
  // Deterministic walking with Reese close behind, no teleport or extra NPC.
  for(let i=0;i<500;i++){
   const position=m.npcPosition;
   m.tick(.1,{x:position.x,y:.92,z:position.z-3.5},0,true,ground);
  }
  expect(Math.hypot(m.target.x-70,m.target.z+8.1)).toBeLessThan(.5);
  for(let i=0;i<30;i++)
   m.tick(.1,{x:70,y:.92,z:-13},0,true,ground);
  expect(m.stage).toBe("return");
  expect(m.view.objective).toContain("Finch");
  expect(m.report()).toBe(true);
  expect(m.stage).toBe("complete");
  expect(reserved.size).toBe(0);
  expect(sim.agents).toHaveLength(100);
  expect(history).toEqual(["unassigned","find","follow","return","complete"]);
 });
 it("requires nearby forward-looking observation and rejects distance or floor shortcuts",()=>{
  const {sim}=rig();
  const m=new DianeLevel001(sim,{phase:"return",ssn:DIANE_FICTIONAL_SSN_001},()=>undefined);
  expect(m.stage).toBe("return");
  expect(m.view.poi).toBeNull();
  const far=new DianeLevel001(rig().sim,{phase:"find",ssn:DIANE_FICTIONAL_SSN_001},()=>undefined);
  far.tick(.05,{x:70,y:180,z:-58},0,true,()=>0);
  expect(far.stage).toBe("find");
 });
 it("does not expose Diane's identity as a visible map label",()=>{
  const map=read("src/ui/hud/north-heights-map-010.tsx");
  expect(map).toContain('data-testid="level001-anonymous-poi"');
  expect(map).toContain('fontSize={labels?19:26}>i</text>');
  expect(map).not.toContain("Diane");
  const view=read("src/routes/north-heights-preview.tsx");
  expect(view).toContain("poi={dianeMission.poi}");
  expect(view).toContain("startDianeMission()");
  expect(view).toContain("reportDianeMission()");
 });
});
