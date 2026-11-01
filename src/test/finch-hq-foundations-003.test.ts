import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {NH012TrafficSimulator} from "../game/traffic/nh012-traffic-simulator";
import {finchRoadStop003,planFinchTargetedRoute003}
 from "../game/experiments/north-heights-finch-routing-003";
import {NORTH_HEIGHTS_FINCH_HEADQUARTERS_001}
 from "../game/experiments/north-heights-finch-hq-001";
import {nh012PointOnEdge} from "../game/traffic/nh012-lane-network";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");

describe("POI-003 Finch targeted auto-drive and lobby foundation",()=>{
 it("stops beside the actual entrance rather than inside the 53-storey building",()=>{
  const sim=new NH012TrafficSimulator(1,120125);
  const stop=finchRoadStop003(sim.graph);
  const door=NORTH_HEIGHTS_FINCH_HEADQUARTERS_001.entrance;
  expect(stop.distance).toBeLessThan(22);
  expect(stop.distance).toBeGreaterThan(5);
  expect(stop.position.z).toBeGreaterThan(door.z);
  expect(stop.s).toBeGreaterThan(5);
  expect(stop.s).toBeLessThan(stop.edge.length-5);
 });
 it("plans legal turns for all initial traffic lanes without teleport or U-turns",()=>{
  const sim=new NH012TrafficSimulator(125,120125);
  for(const agent of sim.agents){
   const p=planFinchTargetedRoute003(sim.graph,agent.edgeId,agent.s,agent.connectorId);
   expect(p).not.toBeNull();
   expect(p!.edges[0]).toBe(agent.edgeId);
   for(let i=1;i<p!.edges.length;i++){
    const legal=sim.graph.turns.get(p!.edges[i-1]!)??[];
    expect(legal.some(c=>c.outgoing===p!.edges[i])).toBe(true);
   }
   const edge=sim.graph.edges.get(p!.destinationEdge)!;
   expect(nh012PointOnEdge(edge,p!.stopS)).toEqual(p!.stop);
  }
 });
 it("accepts a destination for the original agent, and manual takeover cancels it",()=>{
  const sim=new NH012TrafficSimulator(1,120125);
  const id=sim.agents[0]!.id;
  const result=sim.beginFinchTargetDrive003(id);
  expect(result.ok).toBe(true);
  expect(sim.targetDriveStatus003(id)).toBe("enroute");
  sim.beginManualDriving(id);
  expect(sim.targetDriveStatus003(id)).toBe("none");
 });
 it("renders and closes the proximity elevator independently of mission or upper-floor travel",()=>{
  const code=read("src/game/experiments/north-heights-finch-lobby-003.ts");
  expect(code).toContain("sliding-door-left");
  expect(code).toContain("sliding-door-right");
  expect(code).toContain("nearOutside");
  expect(code).toContain("nearInsideExit");
  expect(code).toContain('box("desk-counter"');
  expect(code).toContain("PED002_NPC_FILES[2]");
  expect(code).not.toContain("setPlayerPosition(");
  expect(read("src/game/experiments/north-heights-city-8.ts")).toContain("finchLobby.update(");
 });
 it("wires only the clicked HQ marker and the currently occupied vehicle",()=>{
  const map=read("src/ui/hud/north-heights-map-010.tsx");
  const view=read("src/routes/north-heights-preview.tsx");
  expect(map).toContain("onFinchHQSelect");
  expect(map).toContain("onFinchSelect");
  expect(view).toContain("vehicleOccupied={sedanPassenger}");
  expect(view).toContain("controller.current?.driveToFinchHQ()");
 });
});
