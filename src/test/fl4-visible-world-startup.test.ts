import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FreeCamera, MeshBuilder, NullEngine, Scene, StandardMaterial, Vector3,
} from "@babylonjs/core";
import {
  beginWorldRenderWarmup,
  renderWorldEvidenceFrame,
} from "../game/core/world-render-warmup";

function worldScene() {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const camera = new FreeCamera("camera", new Vector3(0, 3, -9), scene);
  camera.setTarget(new Vector3(0, 1, 0));
  scene.activeCamera = camera;
  const ground = MeshBuilder.CreateGround("generated-first-light-ground", {
    width: 30, height: 30,
  }, scene);
  ground.material = new StandardMaterial("ground-material", scene);
  const voight = MeshBuilder.CreateBox("voight-prototype-body", {
    height: 1.6, width: 0.5, depth: 0.5,
  }, scene);
  voight.position.y = 0.8;
  voight.material = new StandardMaterial("voight-material", scene);
  return { engine, scene, ground, voight };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FL4 world-visible startup acceptance on actual Babylon draws", () => {
  it("only accepts an actual render containing ground and Voight", () => {
    const { engine, scene, ground, voight } = worldScene();
    try {
      const evidence = renderWorldEvidenceFrame(scene, { ground, voight });
      expect(evidence).toEqual({
        groundDrawn: true, voightDrawn: true, complete: true,
      });
      ground.setEnabled(false);
      const skyOnly = renderWorldEvidenceFrame(scene, { ground, voight });
      expect(skyOnly.groundDrawn).toBe(false);
      expect(skyOnly.complete).toBe(false);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("does not treat a scene render exception as completed world evidence", () => {
    const { engine, scene, ground, voight } = worldScene();
    const failure = new Error("GPU device lost during world draw");
    vi.spyOn(scene, "render").mockImplementation(() => { throw failure; });
    try {
      expect(() => renderWorldEvidenceFrame(scene, { ground, voight })).toThrow(failure);
      expect(ground.onAfterRenderObservable.hasObservers()).toBe(false);
      expect(voight.onAfterRenderObservable.hasObservers()).toBe(false);
    } finally {
      vi.restoreAllMocks();
      scene.dispose();
      engine.dispose();
    }
  });

  it("keeps gameplay gated until genuine vehicle settlement and a subsequent complete world frame", async () => {
    const { engine, scene, ground, voight } = worldScene();
    const pending = new Map<number, FrameRequestCallback>();
    let nextId = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      pending.set(++nextId, callback);
      return nextId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      pending.delete(id);
    });
    const tick = (time: number) => {
      const frame = pending.entries().next().value;
      if (!frame) throw new Error("No real-render tick scheduled");
      const [id, callback] = frame;
      pending.delete(id);
      callback(time);
    };
    const warmup = beginWorldRenderWarmup(scene, { ground, voight });
    try {
      tick(20); // actual pre-import world frame; not yet sufficient
      expect(pending.size).toBe(1); // rendering continues behind loading screen
      const completed = warmup.awaitWorldAfterVehicleSettlement();
      tick(60); // real post-import world frame
      expect(await completed).toMatchObject({
        groundDrawn: true, voightDrawn: true, complete: true,
      });
      expect(pending.size).toBe(0);
    } finally {
      warmup.cancel();
      scene.dispose();
      engine.dispose();
    }
  });
});
