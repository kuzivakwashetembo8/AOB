import {describe,expect,it} from "vitest";
import {selectFlightPose, type FlightPoseInput} from "../game/character/locomotion/flight-pose";

const neutral:FlightPoseInput = {
  forward:false,backward:false,left:false,right:false,
  ascending:false,descending:false,accelerated:false,
};
const withInput=(input:Partial<FlightPoseInput>)=>({...neutral,...input});

describe("CHAR-002 aerial survey directional flying animation",()=>{
  it("uses upright hover when no input is active, even with Shift held",()=>{
    expect(selectFlightPose(neutral)).toBe("flyIdle");
    expect(selectFlightPose(withInput({accelerated:true}))).toBe("flyIdle");
  });
  it("uses modest forward/back lean without Shift",()=>{
    expect(selectFlightPose(withInput({forward:true}))).toBe("flyHoverForward");
    expect(selectFlightPose(withInput({backward:true}))).toBe("flyHoverBack");
  });
  it("reserves horizontal prone flying for deliberate accelerated travel",()=>{
    expect(selectFlightPose(withInput({forward:true,accelerated:true}))).toBe("fly");
    expect(selectFlightPose(withInput({backward:true,accelerated:true}))).toBe("fly");
    expect(selectFlightPose(withInput({forward:true,accelerated:false}))).toBe("flyHoverForward");
  });
  it("uses upright lateral and vertical animations",()=>{
    expect(selectFlightPose(withInput({left:true}))).toBe("flyHoverLeft");
    expect(selectFlightPose(withInput({right:true}))).toBe("flyHoverRight");
    expect(selectFlightPose(withInput({ascending:true}))).toBe("flyHoverUp");
    expect(selectFlightPose(withInput({descending:true}))).toBe("flyHoverDown");
    expect(selectFlightPose(withInput({left:true,accelerated:true}))).toBe("flyHoverLeft");
  });
  it("matches the upstream fork's planar-before-vertical pose precedence",()=>{
    expect(selectFlightPose(withInput({forward:true,ascending:true}))).toBe("flyHoverForward");
    expect(selectFlightPose(withInput({backward:true,descending:true}))).toBe("flyHoverBack");
  });
});
