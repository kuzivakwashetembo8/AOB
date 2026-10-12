import { describe, expect, it } from "vitest";
import { acceptedBrickSurfaceEnabled } from "../game/world-generation/brick-surface-policy";
import {
  BRICK_TRIAL_ASSIGNMENTS, BRICK_SCALE_PRESETS,
  BRICK_TRIAL_ASSET_PATH, brickTrialPresetForBuilding,
} from "../game/world-generation/experimental-brick-material";

describe("MAT-003 production brick material acceptance", () => {
  it("renders approved bricks on ordinary /game without a query parameter", () => {
    expect(acceptedBrickSurfaceEnabled(new URLSearchParams())).toBe(true);
    expect(acceptedBrickSurfaceEnabled(new URLSearchParams("gtdVehicleTrial=1"))).toBe(true);
    expect(acceptedBrickSurfaceEnabled(new URLSearchParams("gtdBrickTrial=1"))).toBe(true);
  });

  it("retains an explicit diagnostic opt-out without changing default acceptance", () => {
    expect(acceptedBrickSurfaceEnabled(new URLSearchParams("gtdBrickTrial=0"))).toBe(false);
    expect(acceptedBrickSurfaceEnabled(new URLSearchParams("gtdBrickTrial=0&gtdVehicleTrial=1"))).toBe(false);
  });

  it("limits accepted image surface to two exact buildings and preserves each physical scale", () => {
    const enabled = acceptedBrickSurfaceEnabled(new URLSearchParams());
    expect(Object.keys(BRICK_TRIAL_ASSIGNMENTS).sort())
      .toEqual(["sw-fl-garage", "sw-fl-south-apartment"]);
    expect(BRICK_TRIAL_ASSET_PATH).toBe("/brick-wall-image.webp");
    expect(brickTrialPresetForBuilding("sw-fl-south-apartment", enabled)).toBe("compactA");
    expect(brickTrialPresetForBuilding("sw-fl-garage", enabled)).toBe("standardB");
    expect(brickTrialPresetForBuilding("sw-fl-rear-workshop", enabled)).toBeNull();
    expect(brickTrialPresetForBuilding("sw-fl-south-apartment", false)).toBeNull();
    expect(BRICK_SCALE_PRESETS.compactA.width).toBe(1.35);
    expect(BRICK_SCALE_PRESETS.standardB.width).toBe(1.485);
    expect(new Set<string>(Object.values(BRICK_TRIAL_ASSIGNMENTS)).has("largeC")).toBe(false);
  });
});
