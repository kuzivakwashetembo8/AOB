import { afterEach, describe, expect, it, vi } from "vitest";
import { FreeCamera, MeshBuilder, NullEngine, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { beginWorldRenderWarmup } from "../game/core/world-render-warmup";

function makeScene() {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const camera = new FreeCamera("camera", new Vector3(0, 4, -8), scene);
  camera.setTarget(new Vector3(0, 1, 0));
  scene.activeCamera = camera;
  const ground = MeshBuilder.CreateGround("generated-first-light-ground", { width: 30, height: 30 }, scene);
  const voight = MeshBuilder.CreateBox("trial-real-character-witness", { height: 1.8, width: 0.5, depth: 0.5 }, scene);
  voight.position.y = 0.9;
  ground.material = new StandardMaterial("trial-ground", scene);
  voight.material = new StandardMaterial("trial-voight", scene);
  return { engine, scene, ground, voight };
}

function stubRaf() {
  const pending = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pending.set(++id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (handle: number) => { pending.delete(handle); });
  return {
    pending,
    tick(time: number) {
      const next = pending.entries().next().value;
      if (!next) throw new Error("Missing world warmup frame callback");
      const [handle, callback] = next;
      pending.delete(handle);
      callback(time);
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GTD-CHAR-001 first-frame shader warmup regression", () => {
  it("does not fail after one slow incomplete draw; requires a subsequent real ground and character frame", async () => {
    const { engine, scene, ground, voight } = makeScene();
    const raf = stubRaf();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const warmup = beginWorldRenderWarmup(scene, { ground, voight }, {
      postImportDeadlineMs: 12000, minimumPostImportRenderAttempts: 2,
    });
    try {
      raf.tick(20); // Real pre-import warmup, matching the existing runtime sequence.
      // Emulate expensive post-import shader work: render completes but
      // neither required mesh submits a visible draw on this particular frame.
      vi.spyOn(scene, "render").mockImplementationOnce(() => { now = 12500; });
      const ready = warmup.awaitWorldAfterVehicleSettlement();
      raf.tick(60);
      expect(raf.pending.size).toBe(1); // Do not reject after one slow empty frame.
      raf.tick(100); // Subsequent actual NullEngine draw, never synthesized callbacks.
      await expect(ready).resolves.toMatchObject({
        groundDrawn: true, voightDrawn: true, complete: true,
      });
    } finally {
      warmup.cancel(); scene.dispose(); engine.dispose();
    }
  });

  it("fails if the required geometry still never draws after repeated elapsed attempts", async () => {
    const { engine, scene, ground, voight } = makeScene();
    const raf = stubRaf();
    ground.setEnabled(false);
    voight.setEnabled(false);
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const warmup = beginWorldRenderWarmup(scene, { ground, voight }, {
      postImportDeadlineMs: 1000, minimumPostImportRenderAttempts: 3,
    });
    try {
      const ready = warmup.awaitWorldAfterVehicleSettlement();
      raf.tick(20);
      now = 1100;
      expect(raf.pending.size).toBe(1);
      raf.tick(60);
      expect(raf.pending.size).toBe(1);
      raf.tick(100);
      await expect(ready).rejects.toThrow(/3 post-import/);
    } finally {
      warmup.cancel(); scene.dispose(); engine.dispose();
    }
  });
});
