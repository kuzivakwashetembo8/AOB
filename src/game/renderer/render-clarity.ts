/**
 * FL4-02: explicit device-pixel-ratio aware image clarity.
 *
 * Babylon Engine hardwareScalingLevel maps native physical pixels to render
 * pixels: 1 = full physical display density. A number above 1 means fewer
 * pixels followed by browser/compositor upscale, which can soften the world.
 */
export type RenderClarityMode = "Auto" | "Balanced" | "Sharper" | "Native";

export const DEFAULT_RENDER_CLARITY: RenderClarityMode = "Auto";
export const LEGACY_RENDER_PIXELS_PER_CSS_PIXEL = 1.5;
export const MOBILE_AUTO_PIXELS_PER_CSS_PIXEL = 1.75;
export const SHARPER_PIXELS_PER_CSS_PIXEL = 2;

export function normalizeRenderClarity(value: unknown): RenderClarityMode {
  return value === "Balanced" || value === "Sharper" || value === "Native"
    ? value
    : DEFAULT_RENDER_CLARITY;
}

export function renderHardwareScale(input: {
  mode: RenderClarityMode;
  devicePixelRatio: number;
  coarsePointer: boolean;
}): number {
  const dpr = Number.isFinite(input.devicePixelRatio) && input.devicePixelRatio > 0
    ? input.devicePixelRatio
    : 1;
  const targetPixelsPerCssPixel = input.mode === "Native"
    ? dpr
    : input.mode === "Balanced"
      ? LEGACY_RENDER_PIXELS_PER_CSS_PIXEL
      : input.mode === "Sharper"
        ? SHARPER_PIXELS_PER_CSS_PIXEL
        : input.coarsePointer
          ? MOBILE_AUTO_PIXELS_PER_CSS_PIXEL
          : LEGACY_RENDER_PIXELS_PER_CSS_PIXEL;

  // Never render above full native resolution implicitly. Full native on
  // higher-density phones remains available as an explicit player choice.
  return Math.max(1, dpr / Math.min(dpr, targetPixelsPerCssPixel));
}
