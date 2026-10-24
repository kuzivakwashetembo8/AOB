// @vitest-environment jsdom
import {describe,it,expect,vi} from "vitest";
import {NullEngine,Scene,TransformNode} from "@babylonjs/core";
import {GTDGameRuntime} from "../game/core/gtd-runtime";
import {currentVehicleDisembark} from "../game/vehicles/local-boarding";

type Point={x:number;y:number;z:number};
function harness(human=false) {
 const engine=new NullEngine(),scene=new Scene(engine);
 const root=new TransformNode("playable-ual",scene);
 const runtime=new GTDGameRuntime();
 type RuntimeProbe={
  lifecycle:string;
  physics:unknown;
  voight:unknown;
  camera:unknown;
  sportsCars:Map<string,unknown>;
  driveVehicleNames:Map<string,string>;
  characterTrial:unknown;
  humanCharacterEnabled:boolean;
  world:unknown;
  publishSnapshot:ReturnType<typeof vi.fn>;
  emit:ReturnType<typeof vi.fn>;
  context:string;
  toggleVehicleDriving:()=>void;
  fixedUpdate:(dt:number)=>void;
  switchHumanCharacter:(enabled:boolean)=>void;
 };
 const state=runtime as unknown as RuntimeProbe;
 let carPos:Point={x:2,y:.90,z:0},carSpeed=0,carYaw=0;
 let legalExit=true;
 const car={
  get pose(){return {...carPos};},
  get headingYaw(){return carYaw;},
  get speedMps(){return carSpeed;},
  prepare:vi.fn(),finish:vi.fn(()=>{
   carPos={x:carPos.x+12,y:carPos.y,z:carPos.z+8};
   carYaw=.65;
  }),
  findSafeExitPosition:vi.fn(()=>legalExit?{
   x:carPos.x+3,y:carPos.y+.02,z:carPos.z+1,
  }:null),
 };
 const physics={
  playerPosition:vi.fn(()=>({x:0,y:.92,z:0})),
  setPlayerPosition:vi.fn(),
  movePlayer:vi.fn(()=>({movement:{x:0,y:0,z:0},grounded:true})),
 };
 const target={set:vi.fn()};
 const camera={alpha:0,beta:1.7,radius:8,target};
 const native={
  setDrivingHidden:vi.fn(),
  syncHiddenDrivingPose:vi.fn(),
  updateControlled:vi.fn(),
  setControlled:vi.fn(),
 };
 const legacy={
  enterDrivingPose:vi.fn(()=>true),updateDrivingPose:vi.fn(),
  exitDrivingPose:vi.fn(),
 };
 state.lifecycle="running";
 state.physics=physics;
 state.voight={root};
 state.camera=camera;
 state.sportsCars.set("supported-rover",car);
 state.driveVehicleNames.set("supported-rover","Range Rover Sport 2018");
 state.characterTrial=legacy;
 state.humanCharacterEnabled=human;
 // Generated-world discriminator is buildings-in-world.
 state.world={buildings:[],staticMercerCharacter:native,update:vi.fn()};
 state.publishSnapshot=vi.fn();
 state.emit=vi.fn();
 return {engine,scene,root,runtime,state,physics,car,native,legacy,
  target,getPosition:()=>({...carPos}),setSpeed:(v:number)=>{carSpeed=v},
  setExitLegal:(v:boolean)=>{legalExit=v},
  dispose:()=>{scene.dispose();engine.dispose();}};
}
describe("VEH-BASIC-001 car-only temporary driving",()=>{
 it("never restores a previous boarding location; rejects nonfinite exit coordinates",()=>{
  const at={x:103,y:1,z:-21};
  expect(currentVehicleDisembark({findSafeExitPosition:()=>at})).toEqual(at);
  expect(currentVehicleDisembark({findSafeExitPosition:()=>null})).toBeNull();
  expect(currentVehicleDisembark({findSafeExitPosition:()=>({x:NaN,y:1,z:0})}))
   .toBeNull();
 });
 it.each([false,true])("hides active playable model, follows current car and exits beside current car (human=%s)",human=>{
  const h=harness(human);
  try{
   (h.state.toggleVehicleDriving as ()=>void).call(h.runtime);
   expect(h.state.context).toBe("driving");
   expect(h.root.isEnabled()).toBe(false);
   if(human)expect(h.native.setDrivingHidden).toHaveBeenCalledWith(true);
   else expect(h.native.setDrivingHidden).not.toHaveBeenCalled();
   expect(h.legacy.enterDrivingPose).not.toHaveBeenCalled();
   // Fixed step proves original steering, drive preparation and physics tick
   // are still called; the invisible character follows the MOVING vehicle.
   (h.state.fixedUpdate as (dt:number)=>void).call(h.runtime,1/60);
   expect(h.car.prepare).toHaveBeenCalled();
   expect(h.car.finish).toHaveBeenCalled();
   expect(h.physics.movePlayer).toHaveBeenCalledWith({x:0,y:0,z:0});
   expect(h.root.position.x).toBeCloseTo(h.getPosition().x);
   expect(h.root.position.z).toBeCloseTo(h.getPosition().z);
   if(human)expect(h.native.syncHiddenDrivingPose).toHaveBeenCalledWith(
    h.getPosition(),h.car.headingYaw);
   const exit={x:h.getPosition().x+3,y:h.getPosition().y+.02,z:h.getPosition().z+1};
   (h.state.toggleVehicleDriving as ()=>void).call(h.runtime);
   expect(h.state.context).toBe("walking");
   expect(h.physics.setPlayerPosition).toHaveBeenCalledWith(exit);
   expect(h.root.position.x).toBeCloseTo(exit.x);
   expect(h.root.position.z).toBeCloseTo(exit.z);
   expect(h.root.isEnabled()).toBe(!human);
   if(human){
    expect(h.native.updateControlled).toHaveBeenCalledWith(exit,h.car.headingYaw,0,0);
    expect(h.native.setDrivingHidden).toHaveBeenLastCalledWith(false);
    expect(h.native.updateControlled.mock.invocationCallOrder.at(-1))
     .toBeLessThan(h.native.setDrivingHidden.mock.invocationCallOrder.at(-1)!);
   }
   expect(h.legacy.updateDrivingPose).not.toHaveBeenCalled();
   expect(h.legacy.exitDrivingPose).not.toHaveBeenCalled();
  }finally{h.dispose();}
 });
 it("keeps character hidden when the car is moving or no clear disembark exists",()=>{
  const h=harness(true);
  try{
   (h.state.toggleVehicleDriving as ()=>void).call(h.runtime);
   h.setSpeed(2);
   (h.state.toggleVehicleDriving as ()=>void).call(h.runtime);
   expect(h.state.context).toBe("driving");
   expect(h.car.findSafeExitPosition).not.toHaveBeenCalled();
   h.setSpeed(0);h.setExitLegal(false);
   (h.state.toggleVehicleDriving as ()=>void).call(h.runtime);
   expect(h.state.context).toBe("driving");
   expect(h.physics.setPlayerPosition).not.toHaveBeenCalled();
   expect(h.native.setDrivingHidden).toHaveBeenCalledTimes(1);
   expect(h.root.isEnabled()).toBe(false);
  }finally{h.dispose();}
 });
 it("refuses to switch visual character mode while inside a vehicle",()=>{
  const h=harness(true);
  try{
   (h.state.toggleVehicleDriving as ()=>void).call(h.runtime);
   (h.state.switchHumanCharacter as (enabled:boolean)=>void).call(h.runtime,false);
   expect(h.state.context).toBe("driving");
   expect(h.state.humanCharacterEnabled).toBe(true);
   expect(h.root.isEnabled()).toBe(false);
   expect(h.native.setControlled).not.toHaveBeenCalled();
  }finally{h.dispose();}
 });
});
