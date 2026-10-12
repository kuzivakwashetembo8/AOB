import { describe, expect, it } from "vitest";
import { MeshBuilder, NullEngine, Scene, ShaderMaterial, StandardMaterial, Texture } from "@babylonjs/core";
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
      expect(summary).toMatchObject({ strategy: "original-meshes-direct-uv-shader-no-light-ubos", meshes: 3 });
      expect(summary.materials).toHaveLength(3);
      for (let i = 0; i < meshes.length; i++) {
        expect(meshes[i]!.getTotalIndices()).toBe(indices[i]);
        expect(meshes[i]!.getTotalVertices()).toBe(vertices[i]);
        expect(meshes[i]!.material).toBeInstanceOf(ShaderMaterial);
        expect(meshes[i]!.material).not.toBe(materials[i]);
        expect(meshes[i]!.receiveShadows).toBe(false);
        // The original material and owned texture remain unchanged; the trial
        // shader borrows its diffuse sampler without destroying the asset.
        expect(materials[i]!.maxSimultaneousLights).toBe(16);
        expect(materials[i]!.diffuseTexture).toBe(originalTextures[i]);
        expect((meshes[i]!.material as ShaderMaterial).getActiveTextures()).toContain(originalTextures[i]);
      }
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
  it("retains a real building's geometry and alpha-blended facade while isolating shader lighting", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const ground = MeshBuilder.CreateGround("real-terrain", { width: 100, height: 100 }, scene);
    const wall = MeshBuilder.CreateBox("generated-batch:sw-fl-south-apartment:base:wall", {
      width: 8, height: 9, depth: 2,
    }, scene);
    const glass = MeshBuilder.CreateBox("generated-batch:sw-fl-south-apartment:base:window", {
      width: 5, height: 4, depth: 0.1,
    }, scene);
    const surface = new StandardMaterial("real-terrain-source", scene);
    const masonry = new StandardMaterial("original-masonry", scene);
    const glazing = new StandardMaterial("original-glass", scene);
    glazing.alpha = 0.72;
    ground.material = surface;
    wall.material = masonry;
    glass.material = glazing;
    const originalWallVertices = wall.getTotalVertices();
    try {
      const report = isolateCharacterTrialGroundShaders(ground, [], [], [wall, glass]);
      expect(report.sceneryMeshes).toBe(2);
      expect(wall.getTotalVertices()).toBe(originalWallVertices);
      expect(wall.material).toBeInstanceOf(ShaderMaterial);
      expect(glass.material).toBeInstanceOf(ShaderMaterial);
      expect(glass.material!.needAlphaBlending()).toBe(true);
      expect(glazing.alpha).toBe(0.72);
      expect(report.materials).toHaveLength(3);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
  it("activates the rigged humanoid on production and preview routes without query flags", () => {
    expect(isMeridiaCharacterTrialRequested("", "grand-theft-division.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=baseline", "grand-theft-division.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", "grand-theft-division.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("", "gtd-preview.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=off", "gtd-preview.vercel.app")).toBe(true);
  });
});
