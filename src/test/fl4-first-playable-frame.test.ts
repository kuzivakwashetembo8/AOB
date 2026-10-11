import { describe, expect, it, vi } from "vitest";
import { FreeCamera, NullEngine, Scene, Vector3 } from "@babylonjs/core";
import { renderFirstPlayableFrame } from "../game/core/first-playable-frame";

describe("FL4 actual Babylon first-frame completion gate", () => {
  it("completes after a real Babylon render emits onAfterRender (without global whenReadyAsync)", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    scene.activeCamera = new FreeCamera("first-light-test-camera", new Vector3(0, 2, -3), scene);
    let completedFrames = 0;
    scene.onAfterRenderObservable.add(() => {
      completedFrames++;
    });
    try {
      renderFirstPlayableFrame(scene);
      expect(completedFrames).toBeGreaterThan(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("does not report the checkpoint successful if actual first-frame rendering throws", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const error = new Error("WebGL context failed during first frame");
    vi.spyOn(scene, "render").mockImplementation(() => {
      throw error;
    });
    try {
      expect(() => renderFirstPlayableFrame(scene)).toThrow(error);
      expect(scene.onAfterRenderObservable.hasObservers()).toBe(false);
    } finally {
      vi.restoreAllMocks();
      scene.dispose();
      engine.dispose();
    }
  });
});
