import {describe,it,expect} from "vitest";
import {coupeDriverSeatWorldPose,bmw016FootwellHeight,COUPE_SEAT_016}
  from "../game/vehicles/coupe-driver-fit-016";
import {rangeRoverDriverSeatWorldPose} from "../game/vehicles/range-rover-drive-007";
import {MERCER_EXTRA_GLB_SPECS,resolveMercerGLBFit}
  from "../game/vehicles/mercer-additional-parked-glbs-006";
import {extraDriveProfile} from "../game/vehicles/ambient-fleet-driving-011";

describe("VEH-016 distinct coupe geometry/driver corrections",()=>{
  const car={x:-25.95,y:0,z:10.55,yaw:Math.PI/2};
  const bmw={x:1.93,y:1.46,z:4.80};
  it("puts BMW in the OPPOSITE lateral cockpit position to inherited Rover/passenger",()=>{
    const rover=rangeRoverDriverSeatWorldPose(car,bmw);
    const driver=coupeDriverSeatWorldPose("BMW M4",car,bmw);
    // At 90deg, longitudinal coordinate is world X and lateral is world Z.
    expect(rover.z-car.z).toBeLessThan(0);
    expect(driver.z-car.z).toBeGreaterThan(0);
    expect(Math.abs(driver.z-car.z)).toBeCloseTo(bmw.x*.22);
    expect(driver.y).toBeCloseTo(rover.y);
    expect(driver.x).toBeLessThan(rover.x); // backrest vs passenger-template advance
  });
  it("raises only BMW's interior IK shoe targets, not the entire human root",()=>{
    const rider=coupeDriverSeatWorldPose("BMW M4",car,bmw);
    const provisional=bmw.y*.37;
    const target=bmw016FootwellHeight(car.y,bmw.y);
    expect(target).toBeGreaterThan(provisional+.15);
    expect(target).toBeLessThan(bmw.y*.55);
    expect(rider.y).toBeCloseTo(bmw.y*.57);
    expect(()=>bmw016FootwellHeight(0,-1)).toThrow();
    expect(()=>coupeDriverSeatWorldPose("BMW M4",car,{...bmw,y:0})).toThrow();
  });
  it("lowers the Lamborghini's driver root beneath the compact roof without shrinking the UAL rig",()=>{
    const coupe={x:-47.55,y:0,z:10.55,yaw:Math.PI/2};
    const dims={x:2.00,y:1.28,z:4.75};
    const before=rangeRoverDriverSeatWorldPose(coupe,dims);
    const after=coupeDriverSeatWorldPose("Lamborghini Temerario",coupe,dims);
    expect(after.y).toBeCloseTo(dims.y*.30);
    expect(before.y-after.y).toBeGreaterThan(.30);
    expect(after.yaw).toBe(coupe.yaw);
    expect(COUPE_SEAT_016["Lamborghini Temerario"].verticalFraction).toBeLessThan(.4);
  });
  it("rotates ONLY the Lamborghini visual nose to agree with standard +Z forward throttle",()=>{
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
});
