import {describe,it,expect} from "vitest";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {NH012_SIMULATION_DT} from "@/game/traffic/nh012-lane-network";

const movingCar=(sim:NH012TrafficSimulator)=>
  sim.agents.find(a=>a.connectorId===null&&a.s<26&&a.speed<4)!;

describe("GTD-NH-OPT2-SDN-001 Stage 3 NH012 manual accelerator",()=>{
  it("preserves the identical accepted 125-agent automatic traffic path with no throttle request",()=>{
    const ai=new NH012TrafficSimulator(125,120125),stage3=new NH012TrafficSimulator(125,120125);
    for(let i=0;i<420;i++){
      stage3.setDriverThrottle(null,0);
      ai.step();stage3.step();
    }
    expect(stage3.agents).toEqual(ai.agents);
    expect(stage3.snapshot().count).toBe(125);
    expect(stage3.validate()).toEqual([]);
  });

  it("applies partial Up pedal demand at 20Hz while full Up remains within accepted 2m/s²",()=>{
    const ai=new NH012TrafficSimulator(125,120125);
    const part=new NH012TrafficSimulator(125,120125);
    const full=new NH012TrafficSimulator(125,120125);
    const id=movingCar(ai).id;
    const b=part.agents.find(a=>a.id===id)!,c=full.agents.find(a=>a.id===id)!;
    const previous=c.speed;
    part.setDriverThrottle(id,.25);
    full.setDriverThrottle(id,1);
    expect(part.driverThrottleFor(id)).toBe(.25);
    expect(full.driverThrottleFor(id)).toBe(1);
    ai.step();part.step();full.step();
    const auto=ai.agents.find(a=>a.id===id)!;
    expect(b.speed).toBeGreaterThan(previous);
    expect(b.speed).toBeLessThan(auto.speed);
    // The AI already accelerates at the approved maximum rate. Full Up does
    // not invent new engine power and therefore matches the automatic trace.
    expect(c.speed).toBeCloseTo(previous+2*NH012_SIMULATION_DT,7);
    expect(c.speed).toBeCloseTo(auto.speed,7);
    expect(part.agents).toHaveLength(125);
    expect(part.validate()).toEqual([]);
  });

  it("preserves Stage 2 Down-brake priority over simultaneous full accelerator",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    const a=movingCar(sim),initial=a.speed;
    sim.setDriverBrake(a.id,true);
    sim.setDriverThrottle(a.id,1);
    sim.step();
    expect(a.speed).toBeLessThan(initial);
    expect(a.speed).toBeCloseTo(initial-3.5*.05,7);
    for(let i=0;i<50;i++)sim.step();
    expect(a.speed).toBe(0);
    sim.setDriverBrake(null,false);
    sim.step();
    expect(a.speed).toBeGreaterThan(0);
    sim.setDriverThrottle(null,0);
    expect(sim.driverThrottleFor(a.id)).toBe(0);
    expect(sim.validate()).toEqual([]);
  });

  it("prevents pedal demand from bypassing stop-line geometry or available gap",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    const a=movingCar(sim),edge=sim.graph.edges.get(a.edgeId)!;
    a.s=edge.length-.01;a.speed=0;
    sim.setDriverThrottle(a.id,1);
    sim.step();
    expect(a.s).toBeLessThanOrEqual(edge.length+1e-8);
    expect(a.speed).toBeLessThanOrEqual(Math.sqrt(2*3.5*.01)+1e-8);
    expect(sim.validate()).toEqual([]);
  });

  it("obeys 4 m/s speed cap and reservation safety on an active junction connector",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    const eligible=(a:(typeof sim.agents)[number])=>
      a.connectorId!==null&&a.speed>=.5&&
      sim.graph.connectors.get(a.connectorId)!.length-a.s>5;
    let agent=sim.agents.find(eligible);
    for(let i=0;!agent&&i<1500;i++){
      sim.step();
      agent=sim.agents.find(eligible);
    }
    if(!agent)throw Error("No connector occupant available");
    const id=agent.id;
    sim.setDriverThrottle(id,1);
    for(let i=0;i<5;i++)sim.step();
    expect(agent.speed).toBeLessThanOrEqual(4);
    expect(sim.validate()).toEqual([]);
  });

  it("validates selected identity and clears input without affecting other traffic agents",()=>{
    const sim=new NH012TrafficSimulator(125,120125);
    const a=sim.agents[0]!,b=sim.agents[1]!;
    expect(()=>sim.setDriverThrottle("nonexistent",.8)).toThrow();
    sim.setDriverThrottle(a.id,3);
    expect(sim.driverThrottleFor(a.id)).toBe(1);
    expect(sim.driverThrottleFor(b.id)).toBe(0);
    sim.setDriverThrottle(b.id,.3);
    expect(sim.driverThrottleFor(a.id)).toBe(0);
    expect(sim.driverThrottleFor(b.id)).toBe(.3);
    sim.setDriverThrottle(null,0);
    expect(sim.driverThrottleFor(b.id)).toBe(0);
    sim.setDriverThrottle(a.id,NaN);
    expect(sim.driverThrottleFor(a.id)).toBe(0);
    expect(new Set(sim.agents.map(v=>v.id)).size).toBe(125);
  });
});
