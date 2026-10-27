import {describe,it,expect} from "vitest";
import {
 NH012TrafficSimulator,NH012_MANUAL_ACCEL,NH012_MANUAL_MAX_SPEED,
 NH012_MANUAL_REVERSE_LIMIT,NH012_MANUAL_TURN_ZONE,
} from "@/game/traffic/nh012-traffic-simulator";
import {nh012PointOnEdge,NH012_SIMULATION_DT} from "@/game/traffic/nh012-lane-network";

const make=()=>new NH012TrafficSimulator(125,120125);
const suitable=(s:NH012TrafficSimulator)=>s.agents.find(a=>{
 const e=s.graph.edges.get(a.edgeId)!;
 return a.connectorId===null&&a.s<17&&
   (s.graph.turns.get(e.id)??[]).some(c=>{
     const out=s.graph.edges.get(c.outgoing)!;
     return out.dx===e.dx&&out.dz===e.dz;
   });
})!;

describe("GTD Stage 5 — manual in-lane motion, owner-approved +30% and temporary car pass-through",()=>{
 it("maintains the byte-identical 125-agent autonomous trace with no manual rider",()=>{
   const a=make(),b=make();
   for(let i=0;i<500;i++){a.step();b.step();}
   expect(a.agents).toEqual(b.agents);
   expect(a.validate()).toEqual([]);
   expect(a.population).toBe(125);
 });
 it("applies exactly 2.6m/s² manual throttle, 10.4m/s cap, no 8m/s autonomous throttle clamp",()=>{
   const s=make(),a=suitable(s);
   s.beginManualDriving(a.id);
   const initial=s.manualSignedSpeed(a.id);
   s.setManualPedals(a.id,1,0);
   s.step();
   expect(s.manualSignedSpeed(a.id)).toBeCloseTo(initial+NH012_MANUAL_ACCEL*NH012_SIMULATION_DT,7);
   expect(a.speed).toBeCloseTo(initial+.13,7);
   for(let i=0;i<190;i++)s.step();
   expect(s.manualSignedSpeed(a.id)).toBeLessThanOrEqual(NH012_MANUAL_MAX_SPEED);
   expect(s.manualSignedSpeed(a.id)).toBeGreaterThan(8);
   expect(a.speed).toBeGreaterThan(8);
   expect(s.agents).toHaveLength(125);
   expect(s.validate()).toEqual([]);
 });
 it("releasing Up causes coast-down to a full STOP with no AI acceleration rebound",()=>{
   const s=make(),a=suitable(s);s.beginManualDriving(a.id);
   s.setManualPedals(a.id,0,0);
   const first=s.manualSignedSpeed(a.id);
   s.step();
   expect(s.manualSignedSpeed(a.id)).toBeLessThan(first);
   for(let i=0;i<150;i++)s.step();
   expect(s.manualSignedSpeed(a.id)).toBe(0);
   expect(a.speed).toBe(0);
   for(let i=0;i<15;i++)s.step();
   expect(a.speed).toBe(0);
   expect(s.isManualDriving(a.id)).toBe(true);
 });
 it("brakes to zero before entering REVERSE and always stays on graph",()=>{
   const s=make(),a=suitable(s);const edge=a.edgeId;const before=a.s;
   s.beginManualDriving(a.id);s.setManualPedals(a.id,0,1);
   const original=s.manualSignedSpeed(a.id);
   s.step();
   expect(s.manualSignedSpeed(a.id)).toBeCloseTo(original-3.5*.05,7);
   for(let i=0;i<80;i++)s.step();
   expect(s.manualSignedSpeed(a.id)).toBeLessThan(0);
   expect(s.manualSignedSpeed(a.id)).toBeGreaterThanOrEqual(-NH012_MANUAL_REVERSE_LIMIT);
   expect(a.s).toBeLessThan(before);
   expect(a.edgeId).toBe(edge);
   expect(a.speed).toBeGreaterThanOrEqual(0);
   for(let i=0;i<200;i++)s.step();
   expect(a.s).toBeGreaterThanOrEqual(0);
   expect(a.edgeId).toBe(edge);
   expect(s.manualSignedSpeed(a.id)).toBe(0); // clamps at earliest supported lane start
 });
 it("rejects left/right too EARLY without caching turn for an eventual future junction",()=>{
   const s=make(),a=suitable(s);const e=s.graph.edges.get(a.edgeId)!;
   const direction=s.legalDriverTurnConnector(a.id,"left")?"left":"right";
   s.beginManualDriving(a.id);
   expect(e.length-a.s).toBeGreaterThan(NH012_MANUAL_TURN_ZONE);
   expect(s.requestManualTurn(a.id,direction)).toBe("too-early");
   expect(a.plannedConnectorId).toBeNull();
   a.s=e.length-NH012_MANUAL_TURN_ZONE+.1;
   expect(s.requestManualTurn(a.id,direction)).toBe("turning");
   expect(a.plannedConnectorId).not.toBeNull();
 });
 it("enters a junction immediately WITHOUT all-way-stop or outgoing lane permission",()=>{
   const s=make(),a=suitable(s);
   const e=s.graph.edges.get(a.edgeId)!;
   const direction=s.legalDriverTurnConnector(a.id,"left")?"left":"right";
   const c=s.legalDriverTurnConnector(a.id,direction)!;
   a.s=e.length-.2;
   const p=nh012PointOnEdge(e,a.s);a.x=p.x;a.z=p.z;
   s.beginManualDriving(a.id);
   expect(s.requestManualTurn(a.id,direction)).toBe("turning");
   // Deliberately block both autonomous traffic permissions; manual must pass.
   const other=s.agents.find(b=>b.id!==a.id)!;
   other.edgeId=c.outgoing;other.connectorId=null;other.s=0;
   const out=s.graph.edges.get(other.edgeId)!;const outP=nh012PointOnEdge(out,0);
   other.x=outP.x;other.z=outP.z;
   const reservation=s as unknown as {reservations:Map<string,string>};
   reservation.reservations.set(c.junction,other.id);
   s.setManualPedals(a.id,1,0);
   for(let i=0;i<10;i++)s.step();
   expect(a.connectorId).toBe(c.id);
   expect(a.s).toBeGreaterThan(0);
   expect(a.speed).toBeGreaterThan(0);
   expect(s.isManualDriving(a.id)).toBe(true);
   expect(reservation.reservations.get(c.junction)).toBe(other.id);
 });
 it("keeps Stage 1 automatic passenger mode available by explicit takeover/handback",()=>{
   const s=make(),a=suitable(s);
   expect(s.isManualDriving(a.id)).toBe(false);
   s.beginManualDriving(a.id);
   expect(s.isManualDriving(a.id)).toBe(true);
   s.setManualPedals(a.id,0,1);
   for(let i=0;i<60;i++)s.step();
   s.endManualDriving();
   expect(s.isManualDriving(a.id)).toBe(false);
   expect(a.speed).toBeGreaterThanOrEqual(0);
   for(let i=0;i<20;i++)s.step();
   expect(s.agents).toHaveLength(125);
   expect(s.validate()).toEqual([]);
 });
});
