import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {NH012TrafficSimulator,NH012_MANUAL_MAX_SPEED}
  from "@/game/traffic/nh012-traffic-simulator";
import {
 stage6SolidBuildingCheck,stage6RectanglesOverlap,
 stage6SteerStep,stage6SweepSedan,STAGE6_WORLD_EDGE,STAGE6_STEER_RADIANS,
} from "@/game/vehicles/nh-opt2-sedan-free-steering-stage6";
const make=()=>new NH012TrafficSimulator(125,120125);
const start=(s:NH012TrafficSimulator)=>{
  const a=s.agents.find(v=>v.connectorId===null&&v.speed>1.5)!;
  s.configureStage6FreeDriving(()=>true);
  s.beginManualDriving(a.id);
  return a;
};
describe("GTD-NH-OPT2 Stage 6 independent free steering and off-road",()=>{
  it("moves laterally on a straight street before ANY intersection or legal turn window",()=>{
    const s=make(),a=start(s);
    const e=s.graph.edges.get(a.edgeId)!;
    const startS=a.s,px=a.x,pz=a.z;
    expect(e.length-startS).toBeGreaterThan(8);
    s.setManualPedals(a.id,1,0);
    s.setManualSteering(a.id,1);
    for(let i=0;i<38;i++)s.step();
    // No connector requirement, no lane center snap.
    expect(a.connectorId).toBeNull();
    const p0={x:px+(a.z-pz)*e.dx,z:pz+(a.x-px)*e.dz};
    const lateral=Math.abs((a.x-px)*e.dz-(a.z-pz)*e.dx);
    expect(lateral).toBeGreaterThan(.6);
    expect(Math.abs(a.heading-Math.atan2(e.dx,e.dz))).toBeGreaterThan(.3);
    expect(s.isStage6FreeDriving(a.id)).toBe(true);
    expect(s.agents).toHaveLength(125);
    expect(s.validate()).toEqual([]);
  });
  it("steering is gradual, bounded and reverses yaw when moving backwards",()=>{
    let angle=0;
    for(let i=0;i<5;i++)angle=stage6SteerStep(angle,-1,5,.05).angle;
    expect(angle).toBeCloseTo(-.8,6);
    const f=stage6SteerStep(angle,-1,3,.05);
    const r=stage6SteerStep(angle,-1,-3,.05);
    expect(f.yawDelta).toBeLessThan(0);
    expect(r.yawDelta).toBeGreaterThan(0);
    expect(Math.abs(f.angle*STAGE6_STEER_RADIANS)).toBeLessThanOrEqual(STAGE6_STEER_RADIANS);
    expect(Math.abs(stage6SteerStep(1,1,10,.05).yawDelta)).toBeLessThan(
      Math.abs(stage6SteerStep(1,1,4,.05).yawDelta)*3);
  });
  it("can drive off a lane and still accelerate within the accepted Stage 5 limit",()=>{
    const s=make(),a=start(s);
    s.setManualPedals(a.id,1,0);
    s.setManualSteering(a.id,1);
    for(let i=0;i<100;i++)s.step();
    expect(a.speed).toBeLessThanOrEqual(NH012_MANUAL_MAX_SPEED);
    expect(a.speed).toBeGreaterThan(0);
    const e=s.graph.edges.get(a.edgeId)!;
    const offset=Math.abs((a.x-e.start.x)*e.dz-(a.z-e.start.z)*e.dx);
    expect(offset).toBeGreaterThan(2);
    expect(a.connectorId).toBeNull();
  });
  it("solid rotated building rectangles block Sedan BODY, not merely the center",()=>{
    const admitted=stage6SolidBuildingCheck([{x:0,z:8,halfX:6,halfZ:1,yaw:0}]);
    expect(admitted({x:0,z:0,heading:0},4.8,2)).toBe(true);
    expect(admitted({x:0,z:5,heading:0},4.8,2)).toBe(false);
    expect(stage6RectanglesOverlap(
      {x:0,z:0,hw:1,hl:2,heading:0},
      {x:1,z:1,hw:1,hl:2,heading:Math.PI/4},
    )).toBe(true);
    expect(stage6RectanglesOverlap(
      {x:0,z:0,hw:1,hl:2,heading:0},
      {x:8,z:8,hw:1,hl:2,heading:Math.PI/4},
    )).toBe(false);
  });
  it("swept driving cannot tunnel through walls even at maximum speed and during a turn",()=>{
    const admitted=stage6SolidBuildingCheck([{x:0,z:8,halfX:6,halfZ:1,yaw:0}]);
    let p={x:0,z:0,heading:0};
    for(let i=0;i<30;i++){
      const moved=stage6SweepSedan(p,p.heading,10.4*.05,4.8,2,admitted);
      p={...moved.pose};
      if(moved.blocked)break;
    }
    expect(p.z).toBeGreaterThan(0);
    expect(p.z).toBeLessThan(5);
    expect(admitted(p,4.8,2)).toBe(true);
    // Building and terrain bounds stay solid irrespective of traffic cars.
    expect(admitted({x:STAGE6_WORLD_EDGE,z:0,heading:0},4.8,2)).toBe(false);
  });
  it("manual off-road pose remains separate; autopilot refuses to teleport back",()=>{
    const s=make(),a=start(s);
    s.setManualPedals(a.id,1,0);s.setManualSteering(a.id,1);
    for(let i=0;i<90;i++)s.step();
    expect(s.canResumeStage6Autopilot(a.id)).toBe(false);
    const before={x:a.x,z:a.z,heading:a.heading};
    expect(s.endManualDriving()).toBe(false);
    expect(s.isManualDriving(a.id)).toBe(true);
    expect({x:a.x,z:a.z,heading:a.heading}).toEqual(before);
    s.parkManualOffRoad(a.id);
    expect(s.isStage6FreeParked(a.id)).toBe(true);
    for(let i=0;i<20;i++)s.step();
    expect({x:a.x,z:a.z,heading:a.heading}).toEqual(before);
    s.beginManualDriving(a.id);
    expect(s.isStage6FreeParked(a.id)).toBe(false);
  });
  it("all 124 other vehicles continue autonomous traffic and preserve identities",()=>{
    const s=make(),a=start(s),others=s.agents.filter(x=>x.id!==a.id);
    const identities=new Set(others.map(x=>x.id));
    const before=others.map(x=>({id:x.id,x:x.x,z:x.z}));
    s.setManualSteering(a.id,-1);s.setManualPedals(a.id,1,0);
    for(let i=0;i<220;i++)s.step();
    expect(s.agents).toHaveLength(125);
    expect(new Set(others.map(x=>x.id))).toEqual(identities);
    expect(others.some((v,i)=>Math.hypot(v.x-before[i]!.x,v.z-before[i]!.z)>3)).toBe(true);
    expect(others.every(v=>v.speed>=0&&v.speed<=8)).toBe(true);
    expect(s.validate()).toEqual([]);
  });
  it("North Heights no longer imports or loads the six parked GLB cars",()=>{
    const code=readFileSync("src/game/experiments/north-heights-city-8.ts","utf8");
    expect(code).not.toContain("createMercerExtraParkedGLBs");
    expect(code).not.toContain("MERCER_EXTRA_GLB_SPECS");
    expect(code).not.toContain("fleet.ready");
    expect(code).not.toContain("new FirstDriveTrial");
    expect(code).not.toContain("prepareNativeFleetWheelRig");
  });
});
