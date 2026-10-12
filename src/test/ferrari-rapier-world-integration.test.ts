import { describe, expect, it } from "vitest";
import { NullEngine, Scene, TransformNode } from "@babylonjs/core";
import { FERRARI_STREET_PROFILE } from "../game/vehicles/street-vehicle-physics";
import { MeridianPhysics, type StaticCollisionHandle } from "../game/physics/rapier-world";
import {
  FirstDriveTrial,
  StreetVehicleActor,
  FERRARI_CURB_MAX_METRES,
  ferrariExitOffsets,
} from "../game/vehicles/first-drive-trial";

async function fixture(options: { curb?: number; wall?: number; garageThreshold?: boolean } = {}) {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const physics = await MeridianPhysics.create();
  physics.setPlayerPosition({ x: 30, y: 0.92, z: 30 }); // Walking actor is not our test obstruction.
  const floor = physics.addStaticBox({ x: 0, y: -0.25, z: 0 }, { x: 60, y: 0.25, z: 60 });
  const obstacles: StaticCollisionHandle[] = [];
  if (options.curb !== undefined) {
    const height = options.curb;
    obstacles.push(physics.addStaticBox({ x: 0, y: height / 2, z: 0 }, { x: 8, y: height / 2, z: 0.15 }));
    // There must be sufficient raised sidewalk beyond the narrow curb to step onto.
    obstacles.push(physics.addStaticBox({
      x: 0, y: height / 2, z: -4,
    }, { x: 8, y: height / 2, z: 3.85 }));
  }
  if (options.garageThreshold) {
    // Actual garage portal physical height = 0.22m; ordinary curb = 0.21m.
    // Garage threshold is tagged rather than inflated into a fake high wall.
    obstacles.push(physics.addStaticBox(
      { x: 0, y: 0.11, z: 0 },
      { x: 8, y: 0.11, z: 0.36 },
      0, { vehicleNoStep: true },
    ));
  }
  if (options.wall !== undefined) {
    obstacles.push(physics.addStaticBox({ x: 0, y: options.wall / 2, z: 0 }, { x: 8, y: options.wall / 2, z: 0.3 }));
  }
  const anchor = new TransformNode("real-ferrari-anchor", scene);
  anchor.position.set(0, 0, 4);
  const trial = new FirstDriveTrial(physics, anchor, { x: 2, y: 1.5, z: 4.53 });
  function step(inputX: number, inputY: number, frames = 1) {
    for (let i = 0; i < frames; i++) {
      trial.prepare(1 / 60, inputX, inputY);
      physics.movePlayer({ x: 0, y: 0, z: 0 });
      trial.finish(1 / 60);
    }
  }
  function dispose() {
    trial.dispose();
    for (const obstacle of obstacles) obstacle.dispose();
    floor.dispose();
    physics.destroy();
    scene.dispose();
    engine.dispose();
  }
  return { trial, anchor, physics, step, dispose };
}
describe("EXP-VEH-002 generic street vehicle actor inheritance", () => {
  it("allows a future sedan to supply +Z forward and class-specific curb limits", async () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    physics.setPlayerPosition({ x: 30, y: 0.92, z: 30 });
    const floor = physics.addStaticBox({ x: 0, y: -0.25, z: 0 },
      { x: 30, y: 0.25, z: 30 });
    const anchor = new TransformNode("future-sedan-actor", scene);
    anchor.position.z = 0;
    const actor = new StreetVehicleActor(physics, anchor, { x: 1.8, y: 1.45, z: 4.4 },
      { ...FERRARI_STREET_PROFILE, classId: "meridian-civilian-sedan",
        forwardAxisSign: 1, maxCurbAutostepMetres: 0.18 });
    try {
      for (let i = 0; i < 75; i++) {
        actor.prepare(1 / 60, 0, -1);
        physics.movePlayer({ x: 0, y: 0, z: 0 });
        actor.finish(1 / 60);
      }
      expect(actor.pose.z).toBeGreaterThan(2);
      expect(actor.status.classId).toBe("meridian-civilian-sedan");
      expect(actor.status.curbMaxMetres).toBe(0.18);
    } finally {
      actor.dispose(); floor.dispose(); physics.destroy(); scene.dispose(); engine.dispose();
    }
  }, 30000);
});

describe("EXP-VEH-002 live Rapier Ferrari corrections", () => {
  it("turns the authored vehicle in the intended signed direction", async () => {
    const right = await fixture();
    const left = await fixture();
    try {
      right.step(1, -1, 35); // right arrow / D
      left.step(-1, -1, 35); // left arrow / A
      expect(right.trial.headingYaw).toBeGreaterThan(0.05);
      expect(left.trial.headingYaw).toBeLessThan(-0.05);
    } finally { right.dispose(); left.dispose(); }
  }, 30000);

  it("allows a normal South Ward curb below the bounded Rapier step limit", async () => {
    const setup = await fixture({ curb: 0.12 });
    try {
      expect(FERRARI_CURB_MAX_METRES).toBeGreaterThan(0.12);
      const initialY = setup.trial.pose.y;
      let peakY = initialY;
      for (let tick = 0; tick < 160; tick++) {
        setup.step(0, -1);
        peakY = Math.max(peakY, setup.trial.pose.y);
      }
      // The test car moves beyond the short raised sidewalk by tick 160;
      // verify elevation DURING traversal, not after it has descended.
      expect(setup.trial.pose.z).toBeLessThan(-1.0);
      expect(peakY - initialY).toBeGreaterThan(0.06);
    } finally { setup.dispose(); }
  }, 30000);

  it("climbs a real 0.21m street curb, not just a 0.12m miniature", async () => {
    const setup = await fixture({ curb: 0.21 });
    try {
      let peakY = setup.trial.pose.y;
      for (let tick = 0; tick < 230; tick++) {
        setup.step(0, -1);
        peakY = Math.max(peakY, setup.trial.pose.y);
      }
      expect(setup.trial.pose.z).toBeLessThan(-1);
      expect(peakY).toBeGreaterThan(0.75 + 0.12);
      // The entire car (not merely its centre) must have cleared the sidewalk
      // before asserting that gravity has returned the chassis to road height.
      expect(setup.trial.pose.y).toBeLessThan(0.9);
    } finally { setup.dispose(); }
  }, 30000);

  it("blocks the real 0.22m garage sill despite permitting ordinary 0.21m pavement", async () => {
    const setup = await fixture({ garageThreshold: true });
    try {
      setup.step(0, -1, 160);
      expect(setup.trial.pose.z).toBeGreaterThan(2.0);
      expect(setup.trial.status.vehicleNoStepBlockedTicks).toBeGreaterThan(0);
    } finally { setup.dispose(); }
  }, 30000);

  it("does not walk through a wall higher than its curb threshold", async () => {
    const setup = await fixture({ wall: 2.2 });
    try {
      setup.step(0, -1, 120);
      expect(setup.trial.pose.z).toBeGreaterThan(1.7);
      expect(setup.trial.pose.y).toBeLessThan(2);
    } finally { setup.dispose(); }
  }, 30000);

  it("computes occupied-side-aware disembark locations at the CAR's current B", async () => {
    const setup = await fixture();
    try {
      setup.step(0, -1, 100);
      const b = setup.trial.pose;
      expect(b.z).toBeLessThan(0);
      const exits = ferrariExitOffsets(setup.trial.headingYaw, 2, 4.53);
      const obstacle = setup.physics.addStaticBox({
        x: b.x + exits[0].x, y: 1, z: b.z + exits[0].z,
      }, { x: 0.8, y: 1, z: 0.8 });
      try {
        const disembark = setup.trial.findSafeExitPosition();
        expect(disembark).not.toBeNull();
        expect(Math.hypot(disembark!.x - b.x, disembark!.z - b.z)).toBeLessThan(4);
        expect(Math.hypot(disembark!.x - b.x, disembark!.z - b.z)).toBeGreaterThan(1.8);
        expect(Math.hypot(disembark!.x, disembark!.z - 4)).toBeGreaterThan(3);
      } finally { obstacle.dispose(); }
    } finally { setup.dispose(); }
  }, 30000);
});
