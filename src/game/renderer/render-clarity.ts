/**
 * GTD-PERF-001: physical-pixel-aware graphics clarity.
 *
 * With Babylon Engine in manual hardware-scaling mode, its render buffer is
 * approximately CSS canvas dimensions / hardwareScalingLevel.
 * A physical 100% target therefore uses 1 / devicePixelRatio, NOT 1.
 *
 * Existing Auto/Balanced/Sharper levels are deliberately preserved to avoid
 * silently multiplying fill work for existing mobile players.
 */
export type RenderClarityMode = "Auto" | "Balanced" | "Sharper" | "Native" | "Custom";

export const DEFAULT_RENDER_CLARITY: RenderClarityMode = "Auto";
export const LEGACY_RENDER_PIXELS_PER_CSS_PIXEL = 1.5;
export const MOBILE_AUTO_PIXELS_PER_CSS_PIXEL = 1.75;
export const SHARPER_PIXELS_PER_CSS_PIXEL = 2;
export const DEFAULT_RENDER_SCALE_PERCENT = 100;
export const MIN_RENDER_SCALE_PERCENT = 50;
export const MAX_RENDER_SCALE_PERCENT = 125;
export const RENDER_SCALE_STEP = 5;
export const MAX_RENDER_BUFFER_DIMENSION = 4096;
export const MAX_RENDER_BUFFER_PIXELS = 6_000_000;

export function normalizeRenderClarity(value: unknown): RenderClarityMode {
  return value === "Balanced" || value === "Sharper" || value === "Native" || value === "Custom"
    ? value
    : DEFAULT_RENDER_CLARITY;
}

export function normalizeRenderScalePercent(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || value === null || value === "" || value === undefined) {
    return DEFAULT_RENDER_SCALE_PERCENT;
  }
  return Math.max(
    MIN_RENDER_SCALE_PERCENT,
    Math.min(MAX_RENDER_SCALE_PERCENT, Math.round(number / RENDER_SCALE_STEP) * RENDER_SCALE_STEP),
  );
}

/** Avoid very large off-screen framebuffers on high-DPR devices. */
export function capRenderHardwareScale(
  hardwareScale: number,
  cssWidth?: number,
  cssHeight?: number,
): number {
  if (!Number.isFinite(hardwareScale) || hardwareScale <= 0) return 1;
  if (!cssWidth || !cssHeight || cssWidth <= 0 || cssHeight <= 0) return hardwareScale;
  const dimensionLimit = Math.max(cssWidth, cssHeight) / MAX_RENDER_BUFFER_DIMENSION;
  const areaLimit = Math.sqrt((cssWidth * cssHeight) / MAX_RENDER_BUFFER_PIXELS);
  return Math.max(hardwareScale, dimensionLimit, areaLimit);
}

export function renderHardwareScale(input: {
  mode: RenderClarityMode;
  devicePixelRatio: number;
  coarsePointer: boolean;
  renderScalePercent?: number;
  cssWidth?: number;
  cssHeight?: number;
}): number {
  const dpr = Number.isFinite(input.devicePixelRatio) && input.devicePixelRatio > 0
    ? input.devicePixelRatio
    : 1;
  let scale: number;
  if (input.mode === "Native") {
    scale = 1 / dpr;
  } else if (input.mode === "Custom") {
    scale = 1 / (dpr * normalizeRenderScalePercent(input.renderScalePercent) / 100);
  } else {
    const cssPixelDensity = input.mode === "Balanced"
      ? LEGACY_RENDER_PIXELS_PER_CSS_PIXEL
      : input.mode === "Sharper"
        ? SHARPER_PIXELS_PER_CSS_PIXEL
        : input.coarsePointer
          ? MOBILE_AUTO_PIXELS_PER_CSS_PIXEL
          : LEGACY_RENDER_PIXELS_PER_CSS_PIXEL;
    // Preserve pre-existing (and user-accepted) pixel workload for saved modes.
    scale = Math.max(1, dpr / Math.min(dpr, cssPixelDensity));
  }
  return capRenderHardwareScale(scale, input.cssWidth, input.cssHeight);
}
