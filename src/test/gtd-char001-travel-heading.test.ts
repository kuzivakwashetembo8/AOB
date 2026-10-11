import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRAVEL_HEADING,
  normalizeHeadingSettings,
  signedYawDifference,
  stepTravelHeading,
} from "../game/character/locomotion/travel-heading";

const base = DEFAULT_TRAVEL_HEADING;
const rad = Math.PI / 180;

describe("GTD-CHAR-001 L1 travel-facing heading", () => {
  it("walks forward when aligned and never emits sideways or backward travel", () => {
    const r = stepTravelHeading(0, 0, 1, 1 / 60, base);
    expect(r.yaw).toBeCloseTo(0);
    expect(r.travelScale).toBeCloseTo(1);
    expect(r.travelZ).toBeCloseTo(1);
    expect(r.travelX).toBeCloseTo(0);
  });

  it("rotates toward left and right while advancing along the facing heading", () => {
    for (const side of [-1, 1]) {
      let yaw = 0;
      for (let k = 0; k < 36; k++) {
        const r = stepTravelHeading(yaw, side, 0, 1 / 60, base);
        yaw = r.yaw;
        expect(Math.hypot(r.travelX, r.travelZ)).toBeLessThanOrEqual(1 + 1e-8);
        // Translation, when nonzero, is parallel to the facing vector.
        expect(r.travelX * Math.cos(yaw) - r.travelZ * Math.sin(yaw)).toBeCloseTo(0, 6);
      }
      expect(Math.abs(signedYawDifference(yaw, side * Math.PI / 2))).toBeLessThan(1e-5);
    }
  });

  it("down input rotates ~180 degrees before walking forward in the new direction", () => {
    let heading = 0;
    const outputs = [];
    for (let i = 0; i < 38; i++) {
      const s = stepTravelHeading(heading, 0, -1, 1 / 60, base);
      heading = s.yaw;
      outputs.push(s);
    }
    expect(outputs[0]!.turnSign).toBe(1);
    expect(outputs[0]!.travelScale).toBe(0);
    expect(Math.abs(signedYawDifference(heading, Math.PI))).toBeLessThan(1e-5);
    expect(outputs.at(-1)!.travelZ).toBeCloseTo(-1);
    expect(outputs.at(-1)!.travelX).toBeCloseTo(0);
  });

  it("uses a deterministic 180-degree side and avoids jitter across +/-PI", () => {
    expect(signedYawDifference(0, -Math.PI, 1)).toBeCloseTo(Math.PI);
    expect(signedYawDifference(0, Math.PI, -1)).toBeCloseTo(-Math.PI);
    const first = stepTravelHeading(0, 0, -1, 1 / 60, base, -1);
    expect(first.turnSign).toBe(-1);
    const follow = stepTravelHeading(first.yaw, 0, -1, 1 / 60, base, first.turnSign);
    expect(follow.turnSign).toBe(-1);
  });

  it("normalizes diagonals and keeps facing camera-relative intended travel", () => {
    let heading = 0;
    for (let k = 0; k < 20; k++) {
      heading = stepTravelHeading(heading, 1, 1, 1 / 60, base).yaw;
    }
    expect(heading).toBeCloseTo(Math.PI / 4);
    const s = stepTravelHeading(heading, 1, 1, 1 / 60, base);
    expect(Math.hypot(s.travelX, s.travelZ)).toBeCloseTo(1);
  });

  it("holds heading on release, and keeps stopped and blocked states available", () => {
    const stopped = stepTravelHeading(0.68, 0, 0, 1 / 60, base);
    expect(stopped.yaw).toBeCloseTo(0.68);
    expect(stopped.travelScale).toBe(0);
    const zeroDelta = stepTravelHeading(0.68, 1, 0, 0, base);
    expect(zeroDelta.yaw).toBeCloseTo(0.68);
  });

  it("turning behavior is time-based and independent of display frame slicing", () => {
    const full = stepTravelHeading(0, 1, 0, 1 / 30, base);
    const a = stepTravelHeading(0, 1, 0, 1 / 60, base);
    const b = stepTravelHeading(a.yaw, 1, 0, 1 / 60, base, a.turnSign);
    expect(full.yaw).toBeCloseTo(b.yaw, 9);
    expect(full.yaw).toBeCloseTo(base.turnRateDeg * rad / 30);
  });

  it("clamps live trial inputs and rejects NaN settings", () => {
    expect(normalizeHeadingSettings({ turnRateDeg: Infinity, turnMobility: NaN })).toMatchObject({
      turnRateDeg: base.turnRateDeg, turnMobility: base.turnMobility,
    });
    expect(normalizeHeadingSettings({ turnRateDeg: 3, turnMobility: 9, visualForwardDeg: 900 })).toEqual({
      turnRateDeg: 90, turnMobility: 1, visualForwardDeg: 180,
    });
    expect(stepTravelHeading(0, NaN, 0, 1 / 60, base).travelScale).toBe(0);
  });

  it("mobile/desktop identical intents produce identical turn traces at the same dt", () => {
    const simulate = () => {
      const output: number[] = [];
      let yaw = 0;
      let sign: -1 | 1 = 1;
      for (const [x, z] of [[0,1],[1,0],[-1,0],[0,-1],[1,1]] as const) {
        for (let k=0;k<10;k++) {
          const s = stepTravelHeading(yaw,x,z,1/60,base,sign);
          yaw=s.yaw; sign=s.turnSign; output.push(s.travelScale);
        }
      }
      return {yaw,output};
    };
    expect(simulate()).toEqual(simulate());
  });
});
