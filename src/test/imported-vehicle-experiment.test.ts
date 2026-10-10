import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import {
  VEHICLE_PROBE_SOURCES,
  planImportedVehicleFit,
  sourceForExistingSlot,
} from "../game/experiments/vehicle-probe-plan";
import { MeridianPhysics } from "../game/physics/rapier-world";
import { createGeneratedFirstLightWorld } from "../game/world/generated-first-light-world";
import { FIRST_LIGHT_CITY_SPEC, planStreetContext } from "../game/world-generation";

describe("EXP-VEH-001 imported parked-car experiment contract", () => {
  it("assigns both immutable specimens deterministically to existing car slots", () => {
    const existing = planStreetContext(FIRST_LIGHT_CITY_SPEC).items
      .filter((item) => item.kind === "parked-car")
      .sort((a, b) => a.id.localeCompare(b.id));
    expect(existing.length).toBeGreaterThanOrEqual(2);
    expect(new Set(existing.map((car) => car.id)).size).toBe(existing.length);
    expect(VEHICLE_PROBE_SOURCES.map((source) => source.id)).toEqual(["offroad", "sports"]);
    expect(sourceForExistingSlot(0).id).toBe("offroad");
    expect(sourceForExistingSlot(1).id).toBe("sports");
    expect(existing.map((_, index) => sourceForExistingSlot(index).id))
      .toEqual(existing.map((_, index) => index % 2 === 0 ? "offroad" : "sports"));
  });

  it("normalizes car length in world metres without changing source proportions", () => {
    const sports = sourceForExistingSlot(1);
    const offroad = sourceForExistingSlot(0);
    expect(sports.targetLengthMeters).toBeCloseTo(4.53);
    expect(offroad.targetLengthMeters).toBeCloseTo(4.05);

    const original = { x: 1.94, y: 1.21, z: 4.53 };
    for (const parkingScale of [0.92, 0.97, 1, 1.04]) {
      const fit = planImportedVehicleFit(original, sports.targetLengthMeters, parkingScale);
      expect(fit.rotateYRadians).toBe(0);
      expect(fit.uniformScale).toBeCloseTo(1 / parkingScale);
      expect(fit.worldDimensions.z).toBeCloseTo(4.53);
      expect(fit.worldDimensions.x).toBeCloseTo(1.94);
      expect(fit.worldDimensions.y).toBeCloseTo(1.21);
      expect(fit.worldDimensions.x / fit.worldDimensions.z).toBeCloseTo(original.x / original.z);
      expect(fit.worldDimensions.y / fit.worldDimensions.z).toBeCloseTo(original.y / original.z);
      expect(fit.warnings).toHaveLength(0);
    }

    const rotated = planImportedVehicleFit(
      { x: 4.53, y: 1.21, z: 1.94 },
      sports.targetLengthMeters,
      0.96,
    );
    expect(rotated.rotateYRadians).toBeCloseTo(Math.PI / 2);
    expect(rotated.worldDimensions.x).toBeCloseTo(1.94);
    expect(rotated.worldDimensions.z).toBeCloseTo(4.53);

    const tallBuggy = planImportedVehicleFit(
      { x: 2.1, y: 2.2, z: 3.8 },
      offroad.targetLengthMeters,
    );
    expect(tallBuggy.worldDimensions.z).toBeCloseTo(4.05);
    expect(tallBuggy.worldDimensions.y).toBeGreaterThan(2.2);
    expect(tallBuggy.worldDimensions.x).toBeLessThan(2.5);

    expect(() => planImportedVehicleFit({ x: 0, y: 1.5, z: 4.5 }, 4.53)).toThrow();
    expect(() => planImportedVehicleFit({ x: Infinity, y: 1.5, z: 4.5 }, 4.53)).toThrow();
    expect(() => planImportedVehicleFit(original, 0)).toThrow();
    expect(() => planImportedVehicleFit(original, 4.53, 0)).toThrow();
  });

  it("tests buggy width, sports height and the iteration-4 sports width independently", () => {
    const sourceBounds = { x: 1.94, y: 1.35, z: 4.2 };
    const buggy = sourceForExistingSlot(0);
    const sports = sourceForExistingSlot(1);
    expect(buggy.widthMultiplier).toBeCloseTo(1.1);
    expect(buggy.heightMultiplier).toBe(1);
    expect(sports.widthMultiplier).toBeCloseTo(1.05);
    expect(sports.heightMultiplier).toBeCloseTo(1.1);
    // User-approved iteration 3 is the exact comparator; only sports width
    // may change in iteration 4. Buggy stance and both lengths are locked.
    const specimenBounds = { x: 1.94, y: 1.35, z: 4.2 };
    for (const slotScale of [0.92, 1, 1.04]) {
      const iteration3 = planImportedVehicleFit(specimenBounds, sports.targetLengthMeters, slotScale, {
        widthMultiplier: 1,
        heightMultiplier: 1.10,
      });
      const iteration4 = planImportedVehicleFit(specimenBounds, sports.targetLengthMeters, slotScale, {
        widthMultiplier: sports.widthMultiplier,
        heightMultiplier: sports.heightMultiplier,
      });
      expect(iteration4.worldDimensions.x).toBeCloseTo(iteration3.worldDimensions.x * 1.05);
      expect(iteration4.worldDimensions.y).toBeCloseTo(iteration3.worldDimensions.y);
      expect(iteration4.worldDimensions.z).toBeCloseTo(iteration3.worldDimensions.z);
      expect(iteration4.worldDimensions.z).toBeCloseTo(4.53);
    }

    for (const slotScale of [0.92, 1, 1.04]) {
      for (const specimen of [buggy, sports]) {
        const before = planImportedVehicleFit(sourceBounds, specimen.targetLengthMeters, slotScale);
        const fitted = planImportedVehicleFit(sourceBounds, specimen.targetLengthMeters, slotScale, {
          widthMultiplier: specimen.widthMultiplier,
          heightMultiplier: specimen.heightMultiplier,
        });
        expect(fitted.worldDimensions.z).toBeCloseTo(before.worldDimensions.z);
        expect(fitted.worldDimensions.z).toBeCloseTo(specimen.targetLengthMeters);
        expect(fitted.worldDimensions.x).toBeCloseTo(before.worldDimensions.x * specimen.widthMultiplier);
        expect(fitted.worldDimensions.y).toBeCloseTo(before.worldDimensions.y * specimen.heightMultiplier);
        expect(fitted.uniformScale).toBeCloseTo(before.uniformScale);
        expect(fitted.shapeAdjustment).toEqual({
          widthMultiplier: specimen.widthMultiplier,
          heightMultiplier: specimen.heightMultiplier,
        });
      }
    }
    expect(() => planImportedVehicleFit(sourceBounds, 4.5, 1,
      { widthMultiplier: 0, heightMultiplier: 1 })).toThrow();
    expect(() => planImportedVehicleFit(sourceBounds, 4.5, 1,
      { widthMultiplier: 1, heightMultiplier: Number.NaN })).toThrow();
  });

  it("replaces only existing car colliders without leaks or affecting other world physics", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    const baseColliders = physics.world.colliders.len();
    const baseBodies = physics.world.bodies.len();
    try {
      const world = createGeneratedFirstLightWorld(scene, physics, {
        enableCameraBlockers: true, enableShadows: false,
      });
      const cars = planStreetContext(FIRST_LIGHT_CITY_SPEC).items.filter((item) => item.kind === "parked-car");
      const originalColliders = physics.world.colliders.len();
      const originalBodies = physics.world.bodies.len();
      const id = cars[0]!.id;
      // FL4-06: the old models must not leave invisible collisions while
      // approved GLBs are loading or if a download fails.
      world.suspendParkedCarColliders();
      expect(physics.world.colliders.len()).toBe(originalColliders - cars.length);
      expect(physics.world.bodies.len()).toBe(originalBodies - cars.length);
      world.suspendParkedCarColliders(); // idempotent
      expect(physics.world.colliders.len()).toBe(originalColliders - cars.length);
      // Successful imported slots alone re-register body-sized collision.
      world.replaceParkedCarCollider(id, { x: 1.94, y: 1.21, z: 4.53 });
      expect(physics.world.colliders.len()).toBe(originalColliders - cars.length + 1);
      expect(physics.world.bodies.len()).toBe(originalBodies - cars.length + 1);
      world.replaceParkedCarCollider(id, { x: 1.85, y: 1.35, z: 4.4 });
      expect(physics.world.colliders.len()).toBe(originalColliders - cars.length + 1);
      expect(physics.world.bodies.len()).toBe(originalBodies - cars.length + 1);
      expect(() => world.replaceParkedCarCollider("no-such-car", { x: 1.8, y: 1.5, z: 4.5 })).toThrow();
      expect(() => world.replaceParkedCarCollider(id, { x: -1, y: 1.5, z: 4.5 })).toThrow();
      world.dispose();
      expect(physics.world.colliders.len()).toBe(baseColliders);
      expect(physics.world.bodies.len()).toBe(baseBodies);
    } finally {
      physics.destroy();
      scene.dispose();
      engine.dispose();
    }
  });

  it("keeps third-party GLBs external and pinned rather than bundling them in GTD", () => {
    for (const specimen of VEHICLE_PROBE_SOURCES) {
      expect(specimen.rootUrl).toMatch(/^https:\/\/raw\.githubusercontent\.com\/interlinkglobal\//);
      expect(specimen.rootUrl).toMatch(/[0-9a-f]{40}/);
      expect(specimen.fileName).toMatch(/\.glb$/);
      expect(specimen.bytes).toBeGreaterThan(0);
      expect(specimen.targetLengthMeters).toBeGreaterThan(3.8);
    }
  });
});
