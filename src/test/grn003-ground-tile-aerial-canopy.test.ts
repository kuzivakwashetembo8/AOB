import { describe, expect, it } from "vitest";
import { FreeCamera, NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { createGeneratedStreetContext } from "../game/world-generation/street-context-renderer";

describe("GRN-005: generated foliage remains stable at pedestrian and aerial camera positions", () => {
  it("never switches tree cards into photo or experimental 3D foliage", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const context = createGeneratedStreetContext(scene, FIRST_LIGHT_CITY_SPEC,
        { skipPocketParkGround: true });
      const cards = context.meshes.filter(mesh =>
        mesh.name.startsWith("generated-tree-foliage:"));
      expect(cards.length).toBeGreaterThan(0);
      const original = cards.map(mesh => ({ material: mesh.material, enabled: mesh.isEnabled() }));
      const camera = new FreeCamera("grn005-camera", new Vector3(0, 0, 0), scene);
      scene.activeCamera = camera;
      for (const [position, target] of [
        [new Vector3(0, 1.7, 0), new Vector3(0, 5, 0)],
        [new Vector3(0, 30, 10), new Vector3(0, 3, 0)],
        [new Vector3(0, 30, 10), new Vector3(0, 29.5, 0)],
      ] as const) {
        camera.position.copyFrom(position);
        camera.setTarget(target);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(cards.every((mesh, i) => mesh.material === original[i]?.material &&
          mesh.isEnabled() === original[i]?.enabled)).toBe(true);
      }
      expect(context.meshes.some(mesh => mesh.name.startsWith("grn003-aerial-foliage:")))
        .toBe(false);
      context.dispose();
      expect(cards.every(mesh => mesh.isDisposed())).toBe(true);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
