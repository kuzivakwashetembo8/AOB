import { describe, expect, it } from "vitest";
import { MeshBuilder, NullEngine, Quaternion, Scene, TransformNode } from "@babylonjs/core";
import {
  FERRARI_WHEEL_MAPPING, StreetVehicleWheelRig,
  type StreetVehicleWheelMapping,
} from "../game/vehicles/street-vehicle-wheels";
import {
  FERRARI_STREET_PROFILE,
  INITIAL_VERTICAL_VEHICLE_STATE,
  clampVehicleClimb,
  settleVehicleVerticalState,
  stepVehicleVerticalMotion,
} from "../game/vehicles/street-vehicle-physics";

function makeRig(map: StreetVehicleWheelMapping = FERRARI_WHEEL_MAPPING) {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const anchor = new TransformNode("test-vehicle", scene);
  const names = Object.values(map.wheelNames);
  const wheels = names.map((name, i) => {
    const pivot = new TransformNode("vehicle-probe:slot:" + name, scene);
    pivot.parent = anchor;
    pivot.position.x = i % 2 ? 0.85 : -0.85;
    pivot.position.z = i < 2 ? -1.5 : 1.5;
    pivot.rotationQuaternion = Quaternion.Identity(); // Actual glTF convention
    const mesh = MeshBuilder.CreateCylinder("tire-" + i, { height: 0.23, diameter: 0.7 }, scene);
    mesh.parent = pivot;
    return pivot;
  });
  const rig = new StreetVehicleWheelRig(anchor, map);
  return { engine, scene, rig, wheels, dispose: () => {
    rig.dispose(); scene.dispose(); engine.dispose();
  } };
}
describe("GTD reusable street vehicle wheel/grounding contracts", () => {
  it("finds all four real source pivots, including importer namespaced node names", () => {
    const setup = makeRig();
    try {
      expect(setup.rig.wheelCount).toBe(4);
      expect(setup.rig.frontWheelCount).toBe(2);
      expect(setup.rig.absentNames).toEqual([]);
      expect(setup.rig.ready).toBe(true);
    } finally { setup.dispose(); }
  });
  it("rotates all four quaternion-driven wheels by travel; steering only the front axle", () => {
    const setup = makeRig();
    try {
      setup.rig.update(0.45, 0.23);
      expect(setup.rig.distanceDrivenMetres).toBeCloseTo(0.45);
      for (const wheel of setup.wheels) {
        expect(wheel.rotationQuaternion).not.toEqual(Quaternion.Identity());
      }
      expect(setup.wheels[0]!.rotationQuaternion).not.toEqual(setup.wheels[2]!.rotationQuaternion);
      expect(setup.wheels[2]!.rotationQuaternion).toEqual(setup.wheels[3]!.rotationQuaternion);
      setup.rig.update(-0.45, 0);
      for (const wheel of setup.wheels) {
        expect(wheel.rotationQuaternion!.w).toBeCloseTo(1, 6);
      }
    } finally { setup.dispose(); }
  });
  it("requires actual wheel pivots and does not fake animation by spinning the chassis", () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    const anchor = new TransformNode("car", scene);
    const rig = new StreetVehicleWheelRig(anchor, FERRARI_WHEEL_MAPPING);
    try {
      rig.update(1, 0.25);
      expect(rig.wheelCount).toBe(0);
      expect(rig.absentNames).toHaveLength(4);
      expect(anchor.rotationQuaternion).toBeNull();
    } finally { rig.dispose(); scene.dispose(); engine.dispose(); }
  });
  it("permits the next sedan to inherit grounding with a different approved profile", () => {
    const profile = { ...FERRARI_STREET_PROFILE, classId: "meridian-sedan-test",
      maxCurbAutostepMetres: 0.18, wheelRadiusFallbackMetres: 0.36 };
    let vertical = INITIAL_VERTICAL_VEHICLE_STATE;
    for (let i = 0; i < 15; i++) {
      const step = stepVehicleVerticalMotion(vertical, 1 / 60, profile);
      vertical = settleVehicleVerticalState(step, false);
    }
    expect(vertical.descentSpeedMps).toBeCloseTo(9.81 * 0.25, 4);
    expect(vertical.airborneSeconds).toBeCloseTo(0.25, 4);
    expect(settleVehicleVerticalState(vertical, true).descentSpeedMps).toBe(0);
    expect(clampVehicleClimb(0.23, 1 / 60, profile)).toEqual({
      y: 0.09, suspendPlanarTravel: true,
    });
  });
});
