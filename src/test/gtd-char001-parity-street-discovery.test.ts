import { describe, expect, it, vi } from "vitest";
import { NullEngine, Scene } from "@babylonjs/core";
import { createGeneratedUrbanSurfaces } from "../game/world-generation/urban-surface-renderer";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { classifyCharacterTrialStreetMeshes } from "../game/character/character-trial-street-witnesses";

describe("GTD-CHAR-001 parity-world witness discovery", () => {
  it("recognizes real First Light parity streets without generated-asphalt: prefixes", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const surfaces = createGeneratedUrbanSurfaces(scene, FIRST_LIGHT_CITY_SPEC);
    try {
      const { roads, sidewalks, sample } = classifyCharacterTrialStreetMeshes(surfaces.meshes);
      expect(roads.length).toBeGreaterThan(0);
      expect(sidewalks.length).toBeGreaterThan(0);
      expect(roads.every(mesh => mesh.material?.name === "generated-asphalt")).toBe(true);
      expect(sidewalks.every(mesh => mesh.material?.name === "generated-sidewalk")).toBe(true);
      expect(roads.some(mesh => mesh.name.startsWith("generated-parity-"))).toBe(true);
      expect(sample.some(item => item.name.startsWith("generated-parity-"))).toBe(true);
      expect(roads.some(mesh => mesh.name.startsWith("generated-asphalt:"))).toBe(false);
    } finally {
      surfaces.dispose();
      scene.dispose();
      engine.dispose();
    }
  });
});
