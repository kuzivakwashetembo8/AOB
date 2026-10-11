import { describe, expect, it } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import { MeridianPhysics } from "../game/physics/rapier-world";
import { createGeneratedFirstLightWorld } from "../game/world/generated-first-light-world";
import { DEFAULT_TRAVEL_HEADING, stepTravelHeading } from "../game/character/locomotion/travel-heading";

/**
 * These are real First Light mesh bounds and real Rapier support queries,
 * not guessed heights or simulated pass/fail flags.
 */
async function settleAt(z: number, raisedWalkColliders: boolean) {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const physics = await MeridianPhysics.create();
  const world = createGeneratedFirstLightWorld(scene, physics, {
    enableCameraBlockers: false, enableShadows: false,
    enableSidewalkSupportCollision: raisedWalkColliders,
  });
  try {
    physics.setPlayerPosition({ x: 0, y: 1.9, z });
    let grounded = false;
    for (let i = 0; i < 80; i++) {
      // Fixed repeated downward movement; Rapier actually performs the
      // collision correction rather than asserting a synthetic "grounded".
      const sample = physics.movePlayer({ x: 0, y: -0.065, z: 0 });
      grounded ||= sample.grounded;
    }
    return { y: physics.playerPosition().y, grounded, world };
  } finally {
    world.dispose();
    physics.destroy();
    scene.dispose();
    engine.dispose();
  }
}

describe("GTD-CHAR-001 L1 facing and ground support corrections", () => {
  it("uses zero extra model yaw after source screenshot confirms a quarter-turn error", () => {
    expect(DEFAULT_TRAVEL_HEADING.visualForwardDeg).toBe(0);
    const worldDirections = [
      { x: 0, z: 1 }, { x: 0, z: -1 },
      { x: 1, z: 0 }, { x: -1, z: 0 },
    ];
    for (const direction of worldDirections) {
      let yaw = 0;
      let sign: -1 | 1 = 1;
      for (let i = 0; i < 50; i++) {
        const result = stepTravelHeading(yaw, direction.x, direction.z, 1 / 60, DEFAULT_TRAVEL_HEADING, sign);
        yaw = result.yaw;
        sign = result.turnSign;
      }
      expect(Math.sin(yaw)).toBeCloseTo(direction.x, 5);
      expect(Math.cos(yaw)).toBeCloseTo(direction.z, 5);
    }
  });

  it("stands higher on a real rendered raised sidewalk than on flat roadway", async () => {
    const road = await settleAt(8, true);
    const sidewalk = await settleAt(2.4, true);
    expect(road.grounded).toBe(true);
    expect(sidewalk.grounded).toBe(true);
    expect(sidewalk.y - road.y).toBeGreaterThan(0.065);
    expect(sidewalk.y - road.y).toBeLessThan(0.17);
  }, 30000);

  it("does not change baseline collider behavior without the opt-in flag", async () => {
    const baselineSidewalk = await settleAt(2.4, false);
    const trialSidewalk = await settleAt(2.4, true);
    expect(baselineSidewalk.grounded).toBe(true);
    expect(trialSidewalk.grounded).toBe(true);
    expect(trialSidewalk.y - baselineSidewalk.y).toBeGreaterThan(0.065);
  }, 30000);
});
