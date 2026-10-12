import { describe, expect, it } from "vitest";
import {
  ferrariForwardVelocity,
  ferrariRearCameraAlpha,
  advanceFerrariCameraAlpha,
} from "../game/vehicles/ferrari-camera";

describe("EXP-VEH-002 Ferrari rear-follow camera", () => {
  it("spawns behind the car, not at its nose, for every cardinal heading", () => {
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const rearAlpha = ferrariRearCameraAlpha(yaw);
      const forward = ferrariForwardVelocity(yaw, 1);
      const cameraOffset = { x: Math.cos(rearAlpha), z: Math.sin(rearAlpha) };
      // Rear-camera location must be directly opposite the driving direction.
      expect(cameraOffset.x * forward.x + cameraOffset.z * forward.z).toBeCloseTo(-1, 8);
    }
  });

  it("pressing forward follows the actual pinned GLB convention (-Z)", () => {
    expect(ferrariForwardVelocity(0, 4)).toEqual({ x: -0, z: -4 });
    expect(ferrariForwardVelocity(0, -2).z).toBe(2);
    expect(ferrariForwardVelocity(Math.PI / 2, 4).x).toBeCloseTo(-4, 8);
  });

  it("preserves the orbit the user chose while the vehicle turns", () => {
    const carYaw = 0.25;
    const manualOrbit = 0.9;
    const camera = ferrariRearCameraAlpha(carYaw) + manualOrbit;
    const newYaw = carYaw + 0.35;
    const next = advanceFerrariCameraAlpha(camera, carYaw, newYaw);
    expect(next - ferrariRearCameraAlpha(newYaw)).toBeCloseTo(manualOrbit, 8);
  });

  it("wraps heading changes across ±π without snapping the camera around", () => {
    const previous = Math.PI - 0.01;
    const current = -Math.PI + 0.02;
    const start = ferrariRearCameraAlpha(previous);
    const next = advanceFerrariCameraAlpha(start, previous, current);
    expect(next - start).toBeCloseTo(-0.03, 7);
  });

  it("maintains the user's reverse-facing orbit until the next entry reset", () => {
    const frontView = ferrariRearCameraAlpha(0) + Math.PI;
    expect(advanceFerrariCameraAlpha(frontView, 0, 0)).toBeCloseTo(frontView, 8);
    expect(ferrariRearCameraAlpha(0)).toBeCloseTo(Math.PI / 2, 8);
  });
});
