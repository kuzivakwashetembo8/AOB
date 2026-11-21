import { describe, expect, it } from "vitest";
import { NullEngine, PointLight, Scene, Vector3 } from "@babylonjs/core";
import { createReeseMuzzleSpark010 } from "../game/character/reese-muzzle-spark-010";

describe("LMS-GUN-011 COD-profiled muzzle FX", () => {
  it("emits pooled Babylon flash, gas, embers, smoke and short-lived lights for all extracted weapons", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const fx = createReeseMuzzleSpark010(scene);
    const origin = new Vector3(1, 1.4, 2);
    for (const weapon of ["m4a1", "mpx9", "p19"]) {
      fx.emit(origin, Math.PI / 2, weapon);
    }
    expect(fx.emitted).toBe(3);
    expect(scene.meshes.some(mesh => mesh.name === "lms-muzzle-core" && mesh.isVisible)).toBe(true);
    expect(scene.meshes.some(mesh => mesh.name === "lms-muzzle-forward-jet" && mesh.isVisible)).toBe(true);
    expect(scene.meshes.some(mesh => mesh.name.startsWith("lms-muzzle-ember-") && mesh.isVisible)).toBe(true);
    expect(scene.meshes.some(mesh => mesh.name.startsWith("lms-muzzle-smoke-") && mesh.isVisible)).toBe(true);
    expect(scene.lights.filter(light => light instanceof PointLight).length).toBe(4);
    fx.update(0.5);
    expect(scene.meshes.every(mesh => !mesh.name.startsWith("lms-muzzle-") || !mesh.isVisible)).toBe(true);
    fx.dispose();
    scene.dispose();
    engine.dispose();
  });

  it("reuses the preallocated effect pool rather than adding meshes per shot", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const fx = createReeseMuzzleSpark010(scene);
    const meshCount = scene.meshes.length;
    for (let i = 0; i < 30; i++) fx.emit(new Vector3(0, 1, 0), 0, "m4a1");
    expect(scene.meshes.length).toBe(meshCount);
    expect(fx.emitted).toBe(30);
    fx.dispose();
    scene.dispose();
    engine.dispose();
  });
});
