import {describe,expect,it} from "vitest";
import {selectUalDrivingLoop} from "../game/character/voight-humanoid-trial";
import {ferrariSeatWorldPose} from "../game/vehicles/driver-seat-placement";

describe("VEH-SEAT-001 — existing UAL driving animation and Ferrari seat",()=>{
  it("requires an actual named Driving_Loop clip rather than inferring it from demo settings",()=>{
    const anims=[{name:"Idle_Loop"},{name:"Driving_Loop"},{name:"Walk_Loop"}];
    expect(selectUalDrivingLoop(anims)).toBe(anims[1]);
    expect(selectUalDrivingLoop([{name:"Idle_Loop"},{name:"Walk_Loop"}])).toBeNull();
    expect(selectUalDrivingLoop([{name:"driving_loop"}])?.name).toBe("driving_loop");
    expect(selectUalDrivingLoop([{name:"NotDriving_Loop"}])).toBeNull();
  });

  it("calibrates driver position from actual Ferrari width, height and length",()=>{
    const origin={x:10,y:0,z:20,yaw:0};
    const size={x:2,y:1.4,z:4.5};
    const seat=ferrariSeatWorldPose(origin,size);
    expect(seat.x).toBeCloseTo(10.4,5);
    expect(seat.y).toBeCloseTo(0.784,5);
    expect(seat.z).toBeCloseTo(19.46,5);
    expect(seat.yaw).toBeCloseTo(Math.PI,5);
  });

  it("follows Ferrari rotation and world translation without changing physical vehicle pose",()=>{
    const vehicle={x:-3,y:0.1,z:7,yaw:Math.PI/2};
    const before={...vehicle};
    const seat=ferrariSeatWorldPose(vehicle,{x:2,y:1.5,z:4.53});
    expect(seat.x).toBeCloseTo(-3-4.53*0.12,6);
    expect(seat.z).toBeCloseTo(7-2*0.20,6);
    expect(seat.y).toBeCloseTo(0.1+1.5*0.56,6);
    expect(vehicle).toEqual(before);
  });

  it("rejects malformed seat inputs without affecting gameplay",()=>{
    expect(()=>ferrariSeatWorldPose(
      {x:0,y:0,z:0,yaw:NaN},{x:2,y:1.5,z:4.53}
    )).toThrow();
    expect(()=>ferrariSeatWorldPose(
      {x:0,y:0,z:0,yaw:0},{x:0,y:1.5,z:4.53}
    )).toThrow();
  });
});