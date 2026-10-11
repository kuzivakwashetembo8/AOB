import { describe, expect, it } from "vitest";
import {
  Matrix, MeshBuilder, NullEngine, Scene, ShaderMaterial,
  StandardMaterial, TransformNode,
} from "@babylonjs/core";
import {
  CHAR_TRIAL_WORLD_VERTEX_GLSL,
  isolateCharacterTrialGroundShaders,
} from "../game/character/character-trial-ground-isolation";

describe("GTD-CHAR-001 thin-instanced building reconstruction", () => {
  it("declares the exact Babylon instance matrix attributes and multiplies thin matrices by mesh world", () => {
    const vertex = CHAR_TRIAL_WORLD_VERTEX_GLSL;
    expect(vertex).toContain("#ifdef INSTANCES");
    expect(vertex).toContain("#ifdef THIN_INSTANCES");
    for (let column = 0; column < 4; column++) {
      expect(vertex).toContain("attribute vec4 world" + column + ";");
    }
    expect(vertex).toContain("vertexWorld = mat4(world0, world1, world2, world3);");
    expect(vertex).toContain("vertexWorld = world * vertexWorld;");
    expect(vertex).toContain("gl_Position = viewProjection * vertexWorld * vec4(position, 1.0);");
    expect(vertex).not.toContain("worldViewProjection");
  });
  it("retains per-instance facade positions and scales rather than replacing geometry with proxy boxes", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const root = new TransformNode("generated-building:sw-fl-garage", scene);
    root.position.set(11, 0, 9);
    const terrain = MeshBuilder.CreateGround("generated-first-light-ground", { width: 10, height: 10 }, scene);
    terrain.material = new StandardMaterial("ground", scene);
    const wallBatch = MeshBuilder.CreateBox(
      "generated-batch:sw-fl-garage:base:wall", { size: 1 }, scene,
    );
    wallBatch.parent = root;
    wallBatch.material = new StandardMaterial("brick", scene);
    const a = Matrix.Scaling(10, 4, 0.25).multiply(Matrix.Translation(0, 2, -5));
    const b = Matrix.Scaling(4, 3, 0.25).multiply(Matrix.Translation(6, 1.5, 1));
    wallBatch.thinInstanceAdd(a);
    wallBatch.thinInstanceAdd(b);
    wallBatch.thinInstanceRefreshBoundingInfo();
    const count = wallBatch.thinInstanceCount;
    const matrices = wallBatch.thinInstanceGetWorldMatrices().map(m => m.asArray().join(","));
    try {
      const report = isolateCharacterTrialGroundShaders(terrain, [], [], [wallBatch]);
      expect(report.sceneryMeshes).toBe(1);
      expect(wallBatch.material).toBeInstanceOf(ShaderMaterial);
      expect(wallBatch.thinInstanceCount).toBe(count);
      expect(count).toBe(2);
      expect(wallBatch.thinInstanceGetWorldMatrices().map(m => m.asArray().join(","))).toEqual(matrices);
      expect(wallBatch.computeWorldMatrix(true).getTranslation().x).toBe(11);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
