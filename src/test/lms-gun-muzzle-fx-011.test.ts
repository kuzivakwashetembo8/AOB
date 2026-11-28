import { describe, expect, it } from "vitest";
import { NullEngine, PointLight, Scene, Vector3 } from "@babylonjs/core";
import { createReeseMuzzleSpark010 } from "../game/character/reese-muzzle-spark-010";

describe("LMS-GUN-011 light-only muzzle presentation", () => {
  it("removes visible muzzle geometry while preserving the existing light profile", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const fx = createReeseMuzzleSpark010(scene);
    const origin = new Vector3(1, 1.4, 2);
    const lights = scene.lights.filter((light) => light instanceof PointLight) as PointLight[];
    expect(lights).toHaveLength(4);
    expect(lights[0]!.diffuse.asArray()).toEqual([1, 0.58, 0.28]);
    expect(lights[0]!.specular.asArray()).toEqual([1, 0.72, 0.42]);
    expect(lights[0]!.range).toBe(5);
    for (const [weapon, intensity] of [
      ["m4a1", 200],
      ["mpx9", 135],
      ["p19", 100],
    ] as const) {
      fx.emit(origin, Math.PI / 2, weapon);
      expect(lights.some((light) => light.intensity === intensity)).toBe(true);
      expect(lights.some((light) => light.position.equals(origin))).toBe(true);
    }
    expect(fx.emitted).toBe(3);
    expect(scene.meshes).toHaveLength(0);
    expect(scene.materials).toHaveLength(0);
    fx.update(0.5);
    expect(lights.every((light) => light.intensity === 0)).toBe(true);
    fx.dispose();
    expect(scene.lights.every((light) => light.isDisposed())).toBe(true);
    scene.dispose();
    engine.dispose();
  });

  it("reuses the preallocated light pool rather than allocating per shot", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const fx = createReeseMuzzleSpark010(scene);
    const lightCount = scene.lights.length;
    for (let i = 0; i < 30; i++) fx.emit(new Vector3(0, 1, 0), 0, "m4a1");
    expect(scene.lights.length).toBe(lightCount);
    expect(scene.meshes).toHaveLength(0);
    expect(fx.emitted).toBe(30);
    fx.dispose();
    scene.dispose();
    engine.dispose();
  });
});
