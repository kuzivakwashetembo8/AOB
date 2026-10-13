import {describe,it,expect} from "vitest";
import {
  flightDisplacement, toggleInspectionFlight, FLIGHT_TOGGLE_KEY,
  FLIGHT_MAX_HEIGHT_METRES,
} from "../game/character/locomotion/inspection-flight";

describe("CHAR-002 aerial survey flight", () => {
  it("toggles only on foot, preserving the existing F vehicle mapping", () => {
    const grounded = {enabled:false,verticalSpeed:0};
    const flight = toggleInspectionFlight(grounded,"walking");
    expect(flight.enabled).toBe(true);
    expect(toggleInspectionFlight(flight,"walking").enabled).toBe(false);
    expect(toggleInspectionFlight(grounded,"driving")).toEqual(grounded);
    expect(FLIGHT_TOGGLE_KEY).toBe("KeyG");
  });
  it("hovers at zero input, with no gravity displacement", () => {
    expect(flightDisplacement({
      horizontalX:0,horizontalZ:0,ascend:false,descend:false,sprint:false,
    },1/60,5)).toEqual({x:0,y:0,z:0});
  });
  it("moves horizontally and vertically while preserving diagonal speed", () => {
    const motion=flightDisplacement({
      horizontalX:1,horizontalZ:1,ascend:true,descend:false,sprint:false,
    },1/60,10);
    expect(Math.hypot(motion.x,motion.z)).toBeCloseTo(7.5/60,5);
    expect(motion.y).toBeCloseTo(5/60,5);
  });
  it("descends using held CTRL and returns to neutral hover on release", () => {
    const down=flightDisplacement({
      horizontalX:0,horizontalZ:0,ascend:false,descend:true,sprint:true,
    },1/60,12);
    expect(down.y).toBeLessThan(0);
    expect(flightDisplacement({
      horizontalX:0,horizontalZ:0,ascend:false,descend:false,sprint:true,
    },1/60,12).y).toBe(0);
  });
  it("limits survey ascent and rejects nonfinite/infinite frame impulses", () => {
    const input={horizontalX:0,horizontalZ:0,ascend:true,descend:false,sprint:false};
    expect(flightDisplacement(input,1/60,FLIGHT_MAX_HEIGHT_METRES).y).toBe(0);
    expect(flightDisplacement(input,1/60,FLIGHT_MAX_HEIGHT_METRES-0.02).y).toBeCloseTo(0.02);
    expect(flightDisplacement(input,NaN,10)).toEqual({x:0,y:0,z:0});
    expect(flightDisplacement(input,1/60,10).y).toBeGreaterThan(0);
  });
});
