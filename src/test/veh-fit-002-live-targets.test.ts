import { describe,expect,it } from "vitest";
import { Vector3 } from "@babylonjs/core";
import { planDriverContactTargets } from "../game/character/driver-cabin-pose";

const v=(x:number,y:number,z:number)=>new Vector3(x,y,z);
describe("VEH-FIT-002 G4 live-model target geometry from rejected owner sample",()=>{
  it("keeps feet within leg reach instead of placing them beyond the steering wheel",()=>{
    const leftHip=v(-25.48159027,0.43370822,8.63427544);
    const rightHip=v(-25.50181580,0.43370822,8.80634880);
    const wheel=v(-25.96162777,0.89731806,8.77943250);
    const targets=planDriverContactTargets({
      leftHip,rightHip,
      leftHand:v(-25.76318932,0.77614754,8.50940514),
      rightHand:v(-25.80655098,0.75755828,8.85643101),
      wheelCenter:wheel,wheelRadius:0.18165284,
      vehicleFloorY:0.01882379,
    });
    expect(targets).not.toBeNull();
    if(!targets)throw new Error("missing targets");
    for(const [hip,foot] of [[leftHip,targets.leftFoot],
      [rightHip,targets.rightFoot]]){
      expect(Vector3.Distance(hip,foot)).toBeLessThan(0.48);
      expect(foot.y).toBeGreaterThan(0.2);
      expect(foot.y).toBeLessThan(hip.y);
      const direction=wheel.subtract(hip);direction.y=0;
      const footForward=foot.subtract(hip);footForward.y=0;
      expect(Vector3.Dot(direction,footForward)).toBeGreaterThan(0);
    }
    // Before the patch, the measured foot target errors were 1.295 and
    // .988 metres, with shoes protruding through the car's lower body.
    expect(Vector3.Distance(leftHip,targets.leftFoot)).toBeLessThan(0.5);
    expect(Vector3.Distance(rightHip,targets.rightFoot)).toBeLessThan(0.5);
  });
  it("chooses physically nearby real-wheel rim grip points for both UAL arms",()=>{
    const leftHand=v(-25.76318932,0.77614754,8.50940514);
    const rightHand=v(-25.80655098,0.75755828,8.85643101);
    const wheel=v(-25.96162777,0.89731806,8.77943250);
    const targets=planDriverContactTargets({
      leftHip:v(-25.48159027,0.43370822,8.63427544),
      rightHip:v(-25.50181580,0.43370822,8.80634880),
      leftHand,rightHand,wheelCenter:wheel,wheelRadius:0.18165284,
      vehicleFloorY:0.01882379,
    });
    expect(targets).not.toBeNull();
    if(!targets)throw new Error("missing targets");
    for(const [hand,target] of [[leftHand,targets.leftHand],
      [rightHand,targets.rightHand]]){
      expect(Vector3.Distance(hand,target)).toBeLessThan(0.25);
      expect(Math.hypot(target.x-wheel.x,target.z-wheel.z))
        .toBeCloseTo(0.18165284*0.92,3);
    }
  });
  it("fails closed on invalid rim geometry",()=>{
    expect(planDriverContactTargets({
      leftHip:v(0,1,0),rightHip:v(0,1,0),
      leftHand:v(0,1,0),rightHand:v(0,1,0),
      wheelCenter:v(1,1,0),wheelRadius:0,vehicleFloorY:0,
    })).toBeNull();
  });
});
