import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NullEngine, Scene as BabylonScene } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { materialRecipe } from "../game/world-generation/representation-materials";
import { buildSurfaceTexturePixels, createSurfaceTexture } from "../game/world-generation/surface-textures";
import { Scene } from "../ui/menus/shell";

const wallRecipe = (() => {
  const building = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC).find(
    spec => materialRecipe(spec, FIRST_LIGHT_CITY_SPEC.generatorVersion, "wall").textureKind === "brick-relief",
  );
  if (!building) throw new Error("First Light must include relief masonry for this regression");
  return materialRecipe(building, FIRST_LIGHT_CITY_SPEC.generatorVersion, "wall");
})();

describe("MA-FM-07 image bleed through generated facade textures", () => {
  it("initializes ALL 128 rows of the brick relief texture, not just the first 64", () => {
    const { pixels, size } = buildSurfaceTexturePixels(wallRecipe);
    expect(size).toBe(128);
    expect(pixels.length).toBe(128 * 128 * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        expect(pixels[offset + 3], `alpha at row ${y} column ${x}`).toBe(255);
        expect(pixels[offset]! + pixels[offset + 1]! + pixels[offset + 2]!).toBeGreaterThan(0);
      }
    }
    const firstHalf = pixels.slice(0, 64 * size * 4);
    const secondHalf = pixels.slice(64 * size * 4);
    expect(firstHalf.some(value => value !== 0)).toBe(true);
    expect(secondHalf.some(value => value !== 0)).toBe(true);
  });

  it("keeps ordinary opaque masonry at 64px fully initialized and leaves glass intentional", () => {
    const opaque = { ...wallRecipe, textureKind: "brick" as const };
    const { pixels, size } = buildSurfaceTexturePixels(opaque);
    expect(size).toBe(64);
    expect(pixels.length).toBe(64 * 64 * 4);
    for (let index = 3; index < pixels.length; index += 4) expect(pixels[index]).toBe(255);

    const glass = { ...wallRecipe, textureKind: "glass" as const, alpha: 0.72 };
    const translucent = buildSurfaceTexturePixels(glass);
    expect(translucent.size).toBe(64);
    expect(translucent.pixels[3]).toBeLessThan(255);
  });

  it("uploads the exact complete pixel buffer to a headless Babylon texture", () => {
    const engine = new NullEngine();
    const scene = new BabylonScene(engine);
    try {
      const texture = createSurfaceTexture(scene, wallRecipe);
      expect(texture.getSize()).toMatchObject({ width: 128, height: 128 });
      expect(texture.hasAlpha).toBe(false);
      texture.dispose();
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("never mounts the launcher hero image or scanner backdrop in the game route", () => {
    const gameHTML = renderToStaticMarkup(createElement(Scene, { game: true }));
    expect(gameHTML).toContain("game-scene");
    expect(gameHTML).not.toContain("<img");
    expect(gameHTML).not.toContain("meridian-city");
    expect(gameHTML).not.toContain("scene-grid");
    const launcherHTML = renderToStaticMarkup(createElement(Scene));
    expect(launcherHTML).toContain("<img");
    expect(launcherHTML).toContain("scene-grid");
  });
});
