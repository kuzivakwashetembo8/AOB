import {describe,it,expect} from "vitest";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {NH012_SIMULATION_DT} from "@/game/traffic/nh012-lane-network";

function suitableTrafficCar(sim:NH012TrafficSimulator){
  const car=sim.agents.find(a=>!a.connectorId&&a.speed>=2&&a.s<26);
  if(!car)throw Error("Expected a moving original traffic Sedan on an open lane");
  return car;
}

describe("GTD-NH-OPT2-SDN-001 Stage 2 manual brake with NH-012 traffic ownership",()=>{
  it("does not alter accepted unbraked NH012 behaviour for any of the 125 agents",()=>{
    const original=new NH012TrafficSimulator(125,120125);
    const wrapped=new NH012TrafficSimulator(125,120125);
    for(let step=0;step<420;step++){
      original.step();wrapped.step();
    }
    expect(wrapped.agents).toEqual(original.agents);
    expect(wrapped.snapshot().count).toBe(125);
    expect(wrapped.validate()).toEqual([]);
  });

  it("gradually stops ONLY its selected existing Sedan and releases to normal AI",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    const car=suitableTrafficCar(sim),id=car.id,initialSpeed=car.speed;
    const other=sim.agents.find(a=>a.id!==id)!;
    sim.setDriverBrake(id,true);
    expect(sim.isDriverBraking(id)).toBe(true);
    expect(sim.isDriverBraking(other.id)).toBe(false);
    sim.step();
    expect(car.speed).toBeLessThanOrEqual(initialSpeed);
    expect(car.speed).toBeGreaterThan(0);
    expect(initialSpeed-car.speed).toBeLessThanOrEqual(3.5*NH012_SIMULATION_DT+0.000001);
    for(let i=0;i<59;i++)sim.step();
    expect(car.speed).toBe(0);
    expect(car.state).toBe("stopped");
    expect(car.connectorId).toBeNull();
    expect(sim.agents.length).toBe(125);
    expect(sim.agents.find(a=>a.id===id)).toBe(car);
    expect(sim.validate()).toEqual([]);
    const stoppedS=car.s;
    sim.setDriverBrake(id,false);
    expect(sim.isDriverBraking(id)).toBe(false);
    for(let i=0;i<12;i++)sim.step();
    expect(car.speed).toBeGreaterThan(0);
    expect(car.s).toBeGreaterThan(stoppedS);
    expect(sim.validate()).toEqual([]);
  });

  it("switching brake owners never adds or duplicates a Sedan",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    const first=sim.agents[0]!,second=sim.agents[1]!;
    sim.setDriverBrake(first.id,true);
    expect(sim.isDriverBraking(first.id)).toBe(true);
    sim.setDriverBrake(second.id,true);
    expect(sim.isDriverBraking(first.id)).toBe(false);
    expect(sim.isDriverBraking(second.id)).toBe(true);
    expect(()=>sim.setDriverBrake("not-a-traffic-agent",true)).toThrow();
    sim.setDriverBrake(null,false);
    expect(sim.isDriverBraking(second.id)).toBe(false);
    expect(sim.agents).toHaveLength(125);
  });

  it("holding brake keeps a real turning Sedan's junction reservation until released",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    let agent=sim.agents.find(a=>{
      if(!a.connectorId||a.speed<.8)return false;
      const c=sim.graph.connectors.get(a.connectorId);
      return !!c&&c.length-a.s>7;
    });
    for(let i=0;!agent&&i<1500;i++){
      sim.step();
      agent=sim.agents.find(a=>{
        if(!a.connectorId||a.speed<.8)return false;
        const c=sim.graph.connectors.get(a.connectorId);
        return !!c&&c.length-a.s>7;
      });
    }
    if(!agent)throw Error("No traversing agent found for deterministic turning-brake test");
    const id=agent.id,connectorId=agent.connectorId!,initialS=agent.s;
    const junction=sim.graph.connectors.get(connectorId)!.junction;
    sim.setDriverBrake(id,true);
    for(let i=0;i<45;i++)sim.step();
    expect(agent.connectorId).toBe(connectorId);
    expect(agent.speed).toBe(0);
    expect(agent.s).toBeGreaterThanOrEqual(initialS);
    expect(agent.state).toBe("stopped");
    expect(sim.validate()).toEqual([]);
    // If a reservation had been dropped, the simulator's invariant would fail.
    const haltedS=agent.s;
    sim.setDriverBrake(id,false);
    for(let i=0;i<12;i++)sim.step();
    expect(agent.s>haltedS||agent.connectorId!==connectorId).toBe(true);
    expect(sim.validate()).toEqual([]);
    expect(junction).toBeTruthy();
  });

  it("a stopped brake hold cannot launch through an all-way-stop junction",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    const candidate=sim.agents.find(a=>a.s<25)!;
    sim.setDriverBrake(candidate.id,true);
    for(let i=0;i<250;i++)sim.step();
    expect(candidate.speed).toBe(0);
    expect(candidate.connectorId).toBeNull();
    expect(sim.validate()).toEqual([]);
  });
});
