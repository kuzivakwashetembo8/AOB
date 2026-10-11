import { describe, expect, it } from "vitest";
import { MeshBuilder, NullEngine, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { isolateCharacterTrialGroundShaders } from "../game/character/character-trial-ground-isolation";
import { isMeridiaCharacterTrialRequested } from "../game/character/voight-humanoid-trial";

describe("GTD-CHAR-001 experimental ground shader isolation", () => {
  it("keeps genuine terrain/asphalt/sidewalk meshes and their textures, but excludes costly light/shadow defines", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const ground = MeshBuilder.CreateGround("generated-first-light-ground", { width: 100, height: 100 }, scene);
    const road = MeshBuilder.CreateBox("generated-parity-main-road", { width: 20, height: 0.03, depth: 8 }, scene);
    const sidewalk = MeshBuilder.CreateBox("generated-parity-north-walk", { width: 20, height: 0.1, depth: 3 }, scene);
    const meshes = [ground, road, sidewalk];
    const materials = meshes.map((mesh, index) => {
      const material = new StandardMaterial("generated-" + index, scene);
      material.maxSimultaneousLights = 16;
      material.diffuseTexture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", scene);
      mesh.material = material;
      mesh.receiveShadows = true;
      return material;
    });
    const originalTextures = materials.map(m => m.diffuseTexture);
    const indices = meshes.map(m => m.getTotalIndices());
    const vertices = meshes.map(m => m.getTotalVertices());
    try {
      const summary = isolateCharacterTrialGroundShaders(ground, [road], [sidewalk]);
      expect(summary).toMatchObject({ strategy: "original-textured-meshes-unlit-no-receive-shadows", meshes: 3 });
      expect(summary.materials).toHaveLength(3);
      for (let i = 0; i < meshes.length; i++) {
        expect(meshes[i]!.getTotalIndices()).toBe(indices[i]);
        expect(meshes[i]!.getTotalVertices()).toBe(vertices[i]);
        expect(meshes[i]!.material).toBe(materials[i]);
        expect(meshes[i]!.receiveShadows).toBe(false);
        expect(materials[i]!.disableLighting).toBe(true);
        expect(materials[i]!.maxSimultaneousLights).toBe(1);
        expect(materials[i]!.diffuseTexture).toBe(originalTextures[i]);
      }
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
  it("does not enable the trial for the production host or an ordinary preview", () => {
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", "grand-theft-division.vercel.app")).toBe(false);
    expect(isMeridiaCharacterTrialRequested("", "gtd-preview.vercel.app")).toBe(false);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", "gtd-preview.vercel.app")).toBe(true);
  });
});
