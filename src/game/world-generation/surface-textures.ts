import { RawTexture, Texture } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { MaterialRecipe, SurfaceTextureKind } from "./representation-materials";

const SIZE = 64;

function parseHex(color: string): readonly [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function hash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function noise(seed: number, x: number, y: number): number {
  let value = seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

function textureValue(
  kind: SurfaceTextureKind,
  seed: number,
  x: number,
  y: number,
): { shade: number; alpha: number } {
  const n = noise(seed, x, y);
  switch (kind) {
    case "brick": {
      const row = Math.floor(y / 8);
      const offset = row % 2 === 0 ? 0 : 8;
      const mortar = y % 8 <= 1 || (x + offset) % 16 <= 1;
      return mortar
        ? { shade: 0.68, alpha: 1 }
        : { shade: 0.88 + n * 0.18, alpha: 1 };
    }
    case "brick-relief": {
      const brickRow = Math.floor(y / 12);
      const stagger = brickRow % 2 === 0 ? 0 : 16;
      const localX = (x + stagger) % 32;
      const localY = y % 12;
      // Consistent running-bond mortar joints plus four-direction bevel:
      // more convincing stacked hard masonry without 3D geometry per brick.
      if (localY <= 1 || localX <= 1) return { shade: 0.49 + n * 0.08, alpha: 1 };
      const brickVariation = noise(seed ^ 0xb12ca957,
        Math.floor((x + stagger) / 32), brickRow);
      const raisedEdge = localY === 2 || localX === 2 ? 0.10 : 0;
      const recessedEdge = localY >= 10 || localX >= 30 ? -0.15 : 0;
      return {
        shade: 0.90 + (brickVariation - 0.5) * 0.17 +
          (n - 0.5) * 0.055 + raisedEdge + recessedEdge,
        alpha: 1,
      };
    }
    case "block": {
      const row = Math.floor(y / 12);
      const offset = row % 2 === 0 ? 0 : 12;
      const joint = y % 12 <= 1 || (x + offset) % 24 <= 1;
      return joint
        ? { shade: 0.74, alpha: 1 }
        : { shade: 0.91 + n * 0.12, alpha: 1 };
    }
    case "concrete": {
      const streak = x % 23 === 0 ? -0.05 : 0;
      const patch = noise(seed ^ 0x91e10da5, Math.floor(x / 8), Math.floor(y / 8));
      return { shade: 0.90 + n * 0.14 + streak + (patch > 0.78 ? -0.08 : 0), alpha: 1 };
    }
    case "plaster": {
      return { shade: 0.94 + (n - 0.5) * 0.12, alpha: 1 };
    }
    case "metal": {
      const seam = x % 16 <= 1 ? -0.12 : 0;
      const streak = noise(seed ^ 0x5bd1e995, Math.floor(x / 4), y);
      return { shade: 0.92 + seam + (streak - 0.5) * 0.08, alpha: 1 };
    }
    case "glass": {
      const band = (x + y) % 29 < 3 ? 0.12 : 0;
      const vertical = x % 17 === 0 ? -0.08 : 0;
      return { shade: 0.78 + band + vertical + n * 0.08, alpha: 0.88 };
    }
    case "asphalt": {
      const aggregate = n > 0.86 ? 0.18 : n < 0.12 ? -0.10 : 0;
      const crack = (x * 3 + y * 5 + seed) % 97 === 0 ? -0.18 : 0;
      return { shade: 0.84 + aggregate + crack, alpha: 1 };
    }
    case "paving": {
      const joint = x % 16 <= 1 || y % 16 <= 1;
      return joint
        ? { shade: 0.72, alpha: 1 }
        : { shade: 0.94 + (n - 0.5) * 0.08, alpha: 1 };
    }
    case "roof": {
      const seam = y % 18 <= 1 ? -0.08 : 0;
      return { shade: 0.88 + seam + (n - 0.5) * 0.08, alpha: 1 };
    }
  }
}

/**
 * The generated buffer MUST be fully initialised at its declared dimensions.
 * MA-FM-07 (2026-10-12): 128px relief textures were only filled for 64 rows,
 * producing transparent lower halves and revealing the homepage hero layer.
 * Keeping this CPU builder separate makes coverage testable without WebGL.
 */
export function buildSurfaceTexturePixels(
  recipe: MaterialRecipe,
): { readonly pixels: Uint8Array; readonly size: number } {
  const [red, green, blue] = parseHex(recipe.color);
  const size = recipe.textureKind === "brick-relief" ? 128 : SIZE;
  const pixels = new Uint8Array(size * size * 4);
  const seed = hash(recipe.key);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const { shade, alpha } = textureValue(recipe.textureKind, seed, x, y);
      const grime = recipe.variation.grime * Math.max(0, (y / size - 0.58) * 0.18);
      const weather = (recipe.variation.weathering - 0.5) * 0.07;
      const patch =
        recipe.variation.patching > 0.72 &&
        noise(seed ^ 0x27d4eb2d, Math.floor(x / 10), Math.floor(y / 10)) > 0.82
          ? -0.08
          : 0;
      const factor = Math.max(0.45, shade - grime + weather + patch);
      pixels[index] = clamp(red * factor);
      pixels[index + 1] = clamp(green * factor);
      pixels[index + 2] = clamp(blue * factor);
      pixels[index + 3] = recipe.alpha >= 1 ? 255 : clamp(255 * alpha);
    }
  }
  return { pixels, size };
}

export function createSurfaceTexture(
  scene: Scene,
  recipe: MaterialRecipe,
): RawTexture {
  const { pixels, size } = buildSurfaceTexturePixels(recipe);
  const texture = RawTexture.CreateRGBATexture(
    pixels,
    size,
    size,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
  );
  texture.name = "meridian-surface:" + recipe.key;
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  texture.uScale = recipe.textureScale.u;
  texture.vScale = recipe.textureScale.v;
  texture.uOffset = recipe.variation.uvOffset.u * 0.35;
  texture.vOffset = recipe.variation.uvOffset.v * 0.35;
  texture.hasAlpha = recipe.alpha < 1;
  return texture;
}
