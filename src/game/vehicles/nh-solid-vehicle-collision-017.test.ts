import {describe,expect,it} from "vitest";
import {
  createNorthHeightsSolidField017,nh017CircleOverlapsCar,
  NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH,
} from "./nh-solid-vehicle-collision-017";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {MeridianPhysics} from "@/game/physics/rapier-world";

const sedan=(id:string,x:number,z:number,heading=0)=>({id,x,z,heading});

describe("NH-SOLID-017 physical contacts",()=>{
  it("blocks vehicles from entering another car from front and side",()=>{
    const cars=[sedan("parked",0,0)];
    const field=createNorthHeightsSolidField017({
      buildings:[],trees:[],lamps:[],cars:()=>cars,
    });
    expect(field.isCarClear(sedan("driven",0,4),NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH,"driven")).toBe(false);
    expect(field.isCarClear(sedan("driven",1.5,0),NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH,"driven")).toBe(false);
    expect(field.isCarClear(sedan("driven",0,5.3),NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH,"driven")).toBe(true);
    expect(field.isCarClear(sedan("parked",0,0),NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH,"parked")).toBe(true);
  });

  it("collides with a trunk/pole rather than the tree canopy or light cone",()=>{
    const field=createNorthHeightsSolidField017({
      buildings:[],trees:[{x:0,z:0,size:1}],
      lamps:[{x:20,z:0}],cars:()=>[],
    });
    expect(field.isCarClear(sedan("car",0,2.5),4.75,1.85,"car")).toBe(false);
    expect(field.isCarClear(sedan("car",20,2.5),4.75,1.85,"car")).toBe(true);
    field.activateLampPoles();
    expect(field.isCarClear(sedan("car",20,2.5),4.75,1.85,"car")).toBe(false);
    expect(field.isCarClear(sedan("car",0,6),4.75,1.85,"car")).toBe(true);
  });

  it("prevents people and NPC pedestrians crossing into a solid hull",()=>{
    const cars=[sedan("moving",0,0)];
    const people=[{x:0,z:5,state:"walk"}];
    const field=createNorthHeightsSolidField017({
      buildings:[],trees:[],lamps:[],cars:()=>cars,people:()=>people,
    });
    expect(field.personClear({x:0,z:0})).toBe(false);
    expect(field.personClear({x:3,z:0})).toBe(true);
    expect(field.isCarClear(sedan("other",0,5),4.75,1.85,"other")).toBe(false);
    expect(nh017CircleOverlapsCar({x:0,z:0},.3,sedan("moving",0,0))).toBe(true);
  });

  it("stops a moving car before its chassis reaches standing Voight",()=>{
    const field=createNorthHeightsSolidField017({
      buildings:[],trees:[],lamps:[],cars:()=>[],
      player:()=>({x:0,z:0}),
    });
    expect(field.isCarClear(sedan("car",0,2.5),4.75,1.85,"car")).toBe(false);
    expect(field.isCarClear(sedan("car",0,6),4.75,1.85,"car")).toBe(true);
  });

  it("uses a solid Rapier hull to stop Voight without modifying the player",async()=>{
    const physics=await MeridianPhysics.create();
    const hull=physics.addSolidTrafficVehicle(
      {x:0,y:0,z:0,heading:0},NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH);
    try{
      physics.setPlayerPosition({x:0,y:.92,z:-5});
      const blocked=physics.movePlayer({x:0,y:0,z:5});
      expect(blocked.movement.z).toBeLessThan(3.5);
      // With no car collider the same player movement remains legal.
      hull.dispose();
      physics.setPlayerPosition({x:0,y:.92,z:-5});
      const clear=physics.movePlayer({x:0,y:0,z:5});
      expect(clear.movement.z).toBeGreaterThan(blocked.movement.z+1);
    }finally{
      hull.dispose();
      physics.destroy();
    }
  });

  it("does not allow a scripted AI agent to move when contact is denied",()=>{
    const simulator=new NH012TrafficSimulator(1);
    const initial={...simulator.agents[0]!};
    simulator.configureSolidTraffic(()=>false);
    simulator.step();
    const after=simulator.agents[0]!;
    expect(after.x).toBe(initial.x);
    expect(after.z).toBe(initial.z);
    expect(after.speed).toBe(0);
  });
});
