import { describe, expect, it } from "vitest";
import {
  FreeCamera, MeshBuilder, NullEngine, Scene, ShaderMaterial,
  StandardMaterial, Vector3,
} from "@babylonjs/core";
import { isolateCharacterTrialGroundShaders } from "../game/character/character-trial-ground-isolation";
import { renderWorldEvidenceFrame } from "../game/core/world-render-warmup";

describe("GTD-CHAR-001 world shader isolation", () => {
  it("reuses real ground, asphalt and sidewalks, with minimal shader effects and no witness spoofing", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const camera = new FreeCamera("trial-camera", new Vector3(0, 3.5, -8), scene);
    camera.setTarget(new Vector3(0, 0.8, 0));
    scene.activeCamera = camera;
    const ground = MeshBuilder.CreateGround("generated-first-light-ground", { width: 30, height: 30 }, scene);
    const road = MeshBuilder.CreateBox("generated-parity-main-road", { width: 4, depth: 10, height: 0.08 }, scene);
    road.position.y = 0.04;
    const walk = MeshBuilder.CreateBox("generated-parity-north-walk", { width: 2, depth: 10, height: 0.15 }, scene);
    walk.position.set(3, 0.075, 0);
    const voight = MeshBuilder.CreateBox("gtd-char001-humanoid", { width: 0.5, height: 1.8, depth: 0.5 }, scene);
    voight.position.y = 0.9;
    const originalGroundMaterial = new StandardMaterial("generated-ground-material", scene);
    const originalRoadMaterial = new StandardMaterial("generated-asphalt", scene);
    const originalWalkMaterial = new StandardMaterial("generated-sidewalk", scene);
    ground.material = originalGroundMaterial;
    road.material = originalRoadMaterial;
    walk.material = originalWalkMaterial;
    voight.material = new StandardMaterial("character-material", scene);
    const vertices = [ground.getTotalVertices(), road.getTotalVertices(), walk.getTotalVertices()];
    try {
      const report = isolateCharacterTrialGroundShaders(ground, [road], [walk]);
      expect(report).toMatchObject({
        strategy: "original-meshes-direct-uv-shader-no-light-ubos",
        meshes: 3,
      });
      expect(ground.material).toBeInstanceOf(ShaderMaterial);
      expect(road.material).toBeInstanceOf(ShaderMaterial);
      expect(walk.material).toBeInstanceOf(ShaderMaterial);
      expect(scene.meshes).toContain(ground);
      expect([ground.getTotalVertices(), road.getTotalVertices(), walk.getTotalVertices()]).toEqual(vertices);
      expect(scene.lights.length).toBe(0);
      expect(ground.receiveShadows).toBe(false);
      expect(road.receiveShadows).toBe(false);
      await scene.whenReadyAsync();
      let evidence = renderWorldEvidenceFrame(scene, {
        ground, roadSurfaces: [road], sidewalkSurfaces: [walk], voight,
      });
      for (let i = 0; i < 8 && !evidence.complete; i++) {
        evidence = renderWorldEvidenceFrame(scene, {
          ground, roadSurfaces: [road], sidewalkSurfaces: [walk], voight,
        });
      }
      expect(evidence.voightDrawn).toBe(true);
      expect(evidence.complete).toBe(true);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
