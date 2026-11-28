import { describe, expect, it } from "vitest";
import { NullEngine, PointLight, Scene, Vector3 } from "@babylonjs/core";
import { createReeseMuzzleSpark010 } from "../game/character/reese-muzzle-spark-010";

describe("LMS-GUN-011 muzzle lighting without visible flame", () => {
  it("retains short-lived muzzle lights for all extracted weapons and creates no visual meshes", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const fx = createReeseMuzzleSpark010(scene);
    const origin = new Vector3(1, 1.4, 2);
    for (const weapon of ["m4a1", "mpx9", "p19"]) fx.emit(origin, Math.PI / 2, weapon);
    expect(fx.emitted).toBe(3);
    expect(scene.meshes).toHaveLength(0);
    const lights = scene.lights.filter((light): light is PointLight => light instanceof PointLight);
    expect(lights).toHaveLength(4);
    expect(lights.some(light => light.intensity > 0)).toBe(true);
    expect(lights.some(light => Vector3.Distance(light.position, origin) < 1e-6)).toBe(true);
    fx.update(.5);
    expect(lights.every(light => light.intensity === 0)).toBe(true);
    fx.dispose();
    scene.dispose();
    engine.dispose();
  });

  it("reuses the preallocated light pool rather than creating lights per shot", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const fx = createReeseMuzzleSpark010(scene);
    const lightCount = scene.lights.length;
    for (let i = 0; i < 30; i++) fx.emit(new Vector3(0, 1, 0), 0, "m4a1");
    expect(scene.lights.length).toBe(lightCount);
    expect(fx.emitted).toBe(30);
    fx.dispose();
    scene.dispose();
    engine.dispose();
  });
});
