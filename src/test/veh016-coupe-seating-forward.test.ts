import {describe,it,expect} from "vitest";
import {coupeDriverSeatWorldPose,ROVER_TEMPLATE_COUPE_ADJUSTMENTS}
  from "../game/vehicles/coupe-driver-fit-016";
import {rangeRoverDriverSeatWorldPose,planRangeRoverFootwellTargets}
  from "../game/vehicles/range-rover-drive-007";
import {MERCER_EXTRA_GLB_SPECS,resolveMercerGLBFit}
  from "../game/vehicles/mercer-additional-parked-glbs-006";
import {extraDriveProfile} from "../game/vehicles/ambient-fleet-driving-011";
import {Vector3} from "@babylonjs/core";

describe("VEH-017: both original coupes inherit accepted Rover seating and leg pipeline",()=>{
  const car={x:-25.95,y:0,z:10.55,yaw:Math.PI/2};
  const bmw={x:1.93,y:1.46,z:4.80};
  it("retains original accepted Rover pose, with a BMW-specific mirrored driver side",()=>{
    const rover=rangeRoverDriverSeatWorldPose(car,bmw);
    const driver=coupeDriverSeatWorldPose("BMW M4",car,bmw);
    expect(rover.z-car.z).toBeLessThan(0);
    expect(driver.z-car.z).toBeGreaterThan(0);
    expect(Math.abs(driver.z-car.z)).toBeCloseTo(bmw.x*.22);
    expect(driver.y).toBeCloseTo(rover.y);
    expect(driver.x).toBeCloseTo(car.x+bmw.z*.035);
    expect(driver.yaw).toBe(rover.yaw);
    expect(ROVER_TEMPLATE_COUPE_ADJUSTMENTS["BMW M4"].heightFraction).toBe(0);
  });
  it("places foot targets at the accepted Rover floor-relative level, NOT BMW's discontinued elevated value",()=>{
    const hipLeft=new Vector3(car.x,car.y+.7,car.z-.3);
    const hipRight=new Vector3(car.x,car.y+.7,car.z+.3);
    const targets=planRangeRoverFootwellTargets({
      vehicle:car,dimensions:bmw,leftHip:hipLeft,rightHip:hipRight,
    });
    expect(targets.leftFoot.y).toBeCloseTo(bmw.y*.37);
    expect(targets.rightFoot.y).toBeCloseTo(bmw.y*.37);
    expect(targets.minFootwellY).toBeCloseTo(bmw.y*.37);
    expect(targets.leftFoot.y).toBeLessThan(bmw.y*.50-.1);
  });
  it("inherits the same Rover-facing basis while allowing bounded Lamborghini roof clearance",()=>{
    const pose={x:-47.55,y:0,z:10.55,yaw:Math.PI/2};
    const dims={x:2.0,y:1.28,z:4.75};
    const rover=rangeRoverDriverSeatWorldPose(pose,dims);
    const driver=coupeDriverSeatWorldPose("Lamborghini Temerario",pose,dims);
    expect(driver.y).toBeCloseTo(dims.y*.43);
    expect(driver.y).toBeGreaterThan(dims.y*.30);
    expect(driver.y).toBeLessThan(rover.y);
    expect(driver.yaw).toBe(rover.yaw);
    expect(driver.z).toBeCloseTo(rover.z);
    expect(driver.x).toBeCloseTo(pose.x+dims.z*.04);
  });
  it("preserves corrected Lamborghini model nose, standard throttle, and accepted fleet spec",()=>{
    const bmwSpec=MERCER_EXTRA_GLB_SPECS.find(x=>x.id==="gtd-veh014-mercer-bmw-m4")!;
    const lamboSpec=MERCER_EXTRA_GLB_SPECS.find(x=>x.id==="gtd-veh014-mercer-lamborghini-temerario")!;
    expect(bmwSpec.visualHeadingCorrectionRadians).toBeUndefined();
    expect(lamboSpec.visualHeadingCorrectionRadians).toBe(Math.PI);
    expect(extraDriveProfile("Lamborghini Temerario").forwardAxisSign).toBe(1);
    expect(extraDriveProfile("BMW M4").forwardAxisSign).toBe(1);
    const fit=resolveMercerGLBFit({minX:-2.3,maxX:2.3,
      minY:0,maxY:1.25,minZ:-.97,maxZ:.97},lamboSpec);
    expect(fit.turn).toBe(Math.PI/2);
    expect((fit.turn+(lamboSpec.visualHeadingCorrectionRadians??0))-fit.turn)
      .toBe(Math.PI);
    expect(MERCER_EXTRA_GLB_SPECS.filter(x=>x.visualHeadingCorrectionRadians)).toHaveLength(1);
  });
  it("rejects invalid cabin bounds without altering the accepted Rover solver",()=>{
    const pose={x:0,y:0,z:0,yaw:0};
    expect(()=>coupeDriverSeatWorldPose("BMW M4",pose,{x:1,y:0,z:4})).toThrow();
    const rover=rangeRoverDriverSeatWorldPose(pose,{x:2,y:1.8,z:5});
    expect(rover.y).toBeCloseTo(1.8*.57);
  });
});
