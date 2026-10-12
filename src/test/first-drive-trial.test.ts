import { describe, expect, it } from "vitest";
import { stepDriveControl, type DriveState } from "../game/vehicles/drive-kinematics";

const still: DriveState = { speedMps: 0, steeringRadians: 0 };
const dt = 1 / 60;
describe("EXP-VEH-002 Ferrari L0 motion", () => {
  it("accelerates forward, then brakes before reversing", () => {
    let state = still;
    for (let n = 0; n < 60; n++) state = stepDriveControl(state, { throttle: 1, steering: 0 }, dt);
    expect(state.speedMps).toBeGreaterThan(4);
    for (let n = 0; n < 120; n++) state = stepDriveControl(state, { throttle: -1, steering: 0 }, dt);
    expect(state.speedMps).toBeLessThan(0);
    expect(state.speedMps).toBeGreaterThanOrEqual(-3);
  });
  it("turns opposite directions and reverses its yaw with reverse speed", () => {
    const moving = { speedMps: 4, steeringRadians: 0 };
    const right = stepDriveControl(moving, { throttle: 1, steering: 1 }, dt);
    const left = stepDriveControl(moving, { throttle: 1, steering: -1 }, dt);
    expect(right.yawRateRadiansPerSecond).toBeGreaterThan(0);
    expect(left.yawRateRadiansPerSecond).toBeLessThan(0);
    const reverse = stepDriveControl({ speedMps: -2, steeringRadians: 0 }, { throttle: -1, steering: 1 }, dt);
    expect(reverse.yawRateRadiansPerSecond).toBeLessThan(0);
  });
  it("coasts to rest and returns steering toward centre", () => {
    let state: DriveState = { speedMps: 2, steeringRadians: 0.4 };
    for (let n = 0; n < 120; n++) state = stepDriveControl(state, { throttle: 0, steering: 0 }, dt);
    expect(state.speedMps).toBe(0);
    expect(state.steeringRadians).toBe(0);
  });
  it("ignores invalid inputs instead of contaminating the runtime", () => {
    const state = stepDriveControl(still, { throttle: Number.NaN, steering: Number.POSITIVE_INFINITY }, dt);
    expect(state.speedMps).toBe(0);
    expect(state.steeringRadians).toBe(0);
  });
});
