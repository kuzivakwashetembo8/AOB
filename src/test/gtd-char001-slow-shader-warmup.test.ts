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
  it("permits another real draw attempt after one slow incomplete post-import frame", () => {
    const { engine, scene, ground, voight } = makeScene();
    const raf = stubRaf();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    // A completed render may still draw neither witness while shaders compile.
    // One 12.5s shader frame must not exhaust the deadline and stop warmup.
    vi.spyOn(scene, "render").mockImplementationOnce(() => { now = 12500; });
    const warmup = beginWorldRenderWarmup(scene, { ground, voight }, {
      postImportDeadlineMs: 12000, minimumPostImportRenderAttempts: 2,
    });
    try {
      const ready = warmup.awaitWorldAfterVehicleSettlement();
      // This single expensive frame must schedule another real attempt rather
      // than calling fail(); a separate FL-4 test verifies successful real draw.
      raf.tick(20);
      expect(raf.pending.size).toBe(1);
      void ready.catch(() => {}); // Expected cancellation in this isolated test.
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
