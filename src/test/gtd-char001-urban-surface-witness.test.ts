import { describe, expect, it } from "vitest";
import { FreeCamera, MeshBuilder, NullEngine, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { renderWorldEvidenceFrame } from "../game/core/world-render-warmup";

function setup() {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const camera = new FreeCamera("camera", new Vector3(0, 3.5, -8), scene);
  camera.setTarget(new Vector3(0, 0.8, 0));
  scene.activeCamera = camera;
  const terrain = MeshBuilder.CreateGround("generated-first-light-ground", {
    width: 40, height: 40,
  }, scene);
  terrain.material = new StandardMaterial("terrain", scene);
  terrain.setEnabled(false);
  const road = MeshBuilder.CreateBox("generated-asphalt:test-road", {
    width: 4, height: 0.08, depth: 10,
  }, scene);
  road.position.y = 0.04;
  road.material = new StandardMaterial("asphalt", scene);
  const sidewalk = MeshBuilder.CreateBox("generated-sidewalk-left:test-road", {
    width: 2, height: 0.15, depth: 10,
  }, scene);
  sidewalk.position.set(3, 0.075, 0);
  sidewalk.material = new StandardMaterial("sidewalk", scene);
  const voight = MeshBuilder.CreateBox("imported-trial-humanoid", {
    width: 0.5, height: 1.8, depth: 0.5,
  }, scene);
  voight.position.y = 0.9;
  voight.material = new StandardMaterial("humanoid", scene);
  return { engine, scene, terrain, road, sidewalk, voight };
}

describe("GTD-CHAR-001 genuine street surface draw gate", () => {
  it("accepts separately rendered road + sidewalk + humanoid even if hidden base terrain never draws", async () => {
    const x = setup();
    try {
      // Babylon's NullEngine needs its async material/scene readiness cycle.
      // Repeated synchronous render calls alone do not advance that cycle.
      await x.scene.whenReadyAsync();
      let last = renderWorldEvidenceFrame(x.scene, {
        ground: x.terrain, voight: x.voight,
        roadSurfaces: [x.road], sidewalkSurfaces: [x.sidewalk],
      });
      for (let i = 0; i < 6 && !last.complete; i++) {
        last = renderWorldEvidenceFrame(x.scene, {
          ground: x.terrain, voight: x.voight,
          roadSurfaces: [x.road], sidewalkSurfaces: [x.sidewalk],
        });
      }
      expect(last).toMatchObject({
        groundDrawn: false, roadDrawn: true, sidewalkDrawn: true,
        voightDrawn: true, visibleUrbanSurfaceDrawn: true, complete: true,
      });
    } finally {
      x.scene.dispose(); x.engine.dispose();
    }
  });
  it("cannot accept the imported human and asphalt alone when sidewalk and terrain are absent", async () => {
    const x = setup();
    x.sidewalk.setEnabled(false);
    try {
      await x.scene.whenReadyAsync();
      for (let i = 0; i < 6; i++) {
        const evidence = renderWorldEvidenceFrame(x.scene, {
          ground: x.terrain, voight: x.voight,
          roadSurfaces: [x.road], sidewalkSurfaces: [x.sidewalk],
        });
        expect(evidence.complete).toBe(false);
        expect(evidence.visibleUrbanSurfaceDrawn).toBe(false);
        expect(evidence.sidewalkDrawn).toBe(false);
      }
    } finally {
      x.scene.dispose(); x.engine.dispose();
    }
  });
});
