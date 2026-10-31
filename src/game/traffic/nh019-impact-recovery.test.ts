import {describe,expect,it} from "vitest";
import {NH012TrafficSimulator} from "./nh012-traffic-simulator";
import {NH012_SIMULATION_DT} from "./nh012-lane-network";
import {createNorthHeightsSolidField017} from "@/game/vehicles/nh-solid-vehicle-collision-017";

/** Traffic is allowed to queue behind a real obstruction, but ordinary
 * contact MUST NOT permanently convert an AI Sedan into a parked vehicle. */
describe("NH-TRAFFIC-019 unintended congestion recovery",()=>{
  function scenario(speed=5){
    const sim=new NH012TrafficSimulator(2,120125);
    const target=sim.agents[1]!,driver=sim.agents[0]!;
    const sin=Math.sin(target.heading),cos=Math.cos(target.heading);
    driver.x=target.x-sin*4.85;driver.z=target.z-cos*4.85;
    driver.heading=target.heading;driver.speed=speed;
    target.speed=0;target.state="stopped";
    const field=createNorthHeightsSolidField017({
      buildings:[],trees:[],lamps:[],cars:()=>sim.agents,
    });
    sim.configureStage6FreeDriving((p,l,w,id)=>field.isCarClear(p,l,w,id));
    sim.configureSolidTraffic((a,p)=>field.isCarClear(p,a.length,a.width,a.id));
    sim.configureContactImpulses((a,p)=>field.carImpactAt(p,a.id));
    sim.beginManualDriving(driver.id);
    sim.setManualPedals(driver.id,1,0);
    return {sim,driver,target};
  }
  it("a traffic crash cannot set the intentional player-parking flag",()=>{
    const {sim,driver,target}=scenario();
    sim.step();
    expect(target.speed).toBeGreaterThanOrEqual(0);
    expect(sim.isStage6FreeParked(target.id)).toBe(false);
    sim.setManualPedals(driver.id,0,1);
    for(let i=0;i<180;i++)sim.step(NH012_SIMULATION_DT);
    expect(sim.isStage6FreeParked(target.id)).toBe(false);
    expect(sim.agents).toHaveLength(2);
    expect(Number.isFinite(target.x)&&Number.isFinite(target.z)).toBe(true);
  });
  it("low-speed bumper queues remain ordinary yielding, not crash recovery",()=>{
    const {sim,target}=scenario(.65);
    sim.step();
    expect(sim.recoveringTrafficCount).toBe(0);
    expect(sim.isStage6FreeParked(target.id)).toBe(false);
  });
  it("keeps the autonomous route and its junction metadata through a high-speed hit",()=>{
    const {sim,driver,target}=scenario();
    const original={edgeId:target.edgeId,connectorId:target.connectorId};
    sim.step();
    expect(target.edgeId).toBe(original.edgeId);
    expect(target.connectorId).toBe(original.connectorId);
    expect(sim.isStage6FreeParked(target.id)).toBe(false);
    sim.setManualPedals(driver.id,0,1);
  });
});
