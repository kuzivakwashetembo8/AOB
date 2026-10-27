import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {
  nearestBoardableVehicle,sedanExitCandidates,overlapsAnotherTrafficSedan,
  insideBuildingFootprint,trafficSedanCanExit,trafficHeadingDelta,
} from "@/game/vehicles/nh-opt2-sedan-riding";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";

const pedestrian={x:0,y:.99,z:0};
const parked={id:"parked-a",pose:{x:3,y:.08,z:0}};
const moving={id:"NH012:sedan-a",pose:{x:2,y:.075,z:0}};
const wall={x:1,y:1,z:0,halfX:.15,halfY:4,halfZ:3};

describe("NH-OPT2-SDN-001 Stage 1: existing Sedan passenger session",()=>{
  it("boards the closer moving Sedan without testing for stopped state",()=>{
    expect(nearestBoardableVehicle(pedestrian,[parked],[moving],[])).toMatchObject({
      kind:"traffic-sedan",id:moving.id,
    });
    expect(nearestBoardableVehicle(pedestrian,[parked],[],[])?.kind).toBe("parked-glb");
  });
  it("will not board through a wall, outside radius, or across large altitude",()=>{
    expect(nearestBoardableVehicle(pedestrian,[],[moving],[wall])).toBeNull();
    expect(nearestBoardableVehicle(pedestrian,[],[{...moving,pose:{x:4,y:0,z:0}}],[])).toBeNull();
    expect(nearestBoardableVehicle(pedestrian,[],[{...moving,pose:{x:2,y:4,z:0}}],[])).toBeNull();
  });
  it("never relies on a transient thin instance index for identity",()=>{
    const a={...moving,id:"Z-agent"};
    const b={...moving,id:"A-agent"};
    expect(nearestBoardableVehicle(pedestrian,[],[a,b],[])?.id).toBe("A-agent");
    expect(nearestBoardableVehicle(pedestrian,[],[b,a],[])?.id).toBe("A-agent");
  });
  it("uses the stopped traffic car's current direction and location for exit",()=>{
    const at={x:100,z:-50,heading:Math.PI/2};
    const exits=sedanExitCandidates(at);
    expect(exits).toHaveLength(4);
    expect(exits[0]!.z).toBeLessThan(at.z);
    expect(exits[1]!.z).toBeGreaterThan(at.z);
    expect(exits.every(v=>Math.hypot(v.x-at.x,v.z-at.z)>1.5)).toBe(true);
    expect(trafficSedanCanExit(0)).toBe(true);
    expect(trafficSedanCanExit(.24)).toBe(true);
    expect(trafficSedanCanExit(.26)).toBe(false);
    expect(trafficSedanCanExit(5)).toBe(false);
  });
  it("rejects an exit occupied by another uncollided traffic view or building",()=>{
    const agents=[
      {id:"aboard",x:0,z:0,heading:0},
      {id:"nearby",x:2,z:0,heading:0},
    ];
    expect(overlapsAnotherTrafficSedan({x:1.8,z:0},"aboard",agents)).toBe(true);
    expect(overlapsAnotherTrafficSedan({x:-3,z:0},"aboard",agents)).toBe(false);
    expect(insideBuildingFootprint({x:3,z:3},[
      {x:3,z:3,halfX:2,halfZ:2,yaw:Math.PI/4},
    ])).toBe(true);
    expect(insideBuildingFootprint({x:20,z:20},[
      {x:3,z:3,halfX:2,halfZ:2,yaw:Math.PI/4},
    ])).toBe(false);
  });
  it("follows wrap-safe heading changes without modifying traffic",()=>{
    expect(trafficHeadingDelta(Math.PI-.03,-Math.PI+.03)).toBeCloseTo(.06,6);
  });
  it("uncontrolled NH012 traffic remains exactly deterministic for 125 cars",()=>{
    const a=new NH012TrafficSimulator(125,120125),b=new NH012TrafficSimulator(125,120125);
    const observedId=a.agents[7]!.id;
    for(let i=0;i<400;i++){
      a.step();b.step();
    }
    expect(a.agents.find(x=>x.id===observedId)).toEqual(b.agents.find(x=>x.id===observedId));
    expect(a.validate()).toEqual([]);
    expect(a.snapshot().count).toBe(125);
  });
  it("does not reconstruct a Rapier Sedan or mutate accepted native wheel rig",()=>{
    const city=readFileSync("src/game/experiments/north-heights-city-8.ts","utf8");
    const renderer=readFileSync("src/game/experiments/north-heights-sedan-traffic-009.ts","utf8");
    expect(city).toContain("ridingSedanId=agent.id");
    expect(city).toContain('onVehicleChange?.("Sedan · Autopilot",agent.speed)');
    expect(city).toContain("traffic3D.update(traffic.snapshot(),new Set(),camera)");
    expect(renderer).toContain("createNativeWheel007");
    expect(renderer).toContain("sourceWheelFit007");
    expect(renderer).not.toContain("FirstDriveTrial");
    expect(city).toContain("new NH012TrafficSimulator(125,120125)");
  });
});
