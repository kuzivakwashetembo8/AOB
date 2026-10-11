import { capRenderHardwareScale, renderHardwareScale } from "../renderer/render-clarity";

/**
 * FL4 trials are diagnostics-only and now reference real physical display
 * density. The reported backing/render sizes remain the final truth.
 */
export type FL4QualityTrial = "native" | "supernative";

export interface FL4RasterOverride {
  readonly trial: FL4QualityTrial | null;
  readonly hardwareScale: number | null;
  readonly source: "quality-trial" | "explicit-scale" | null;
}

export function resolveFL4RasterOverride(
  params: URLSearchParams,
  devicePixelRatio = 1,
  cssWidth?: number,
  cssHeight?: number,
): FL4RasterOverride {
  if (params.get("fl4Diagnostics") !== "1") {
    return { trial: null, hardwareScale: null, source: null };
  }
  const requestedTrial = params.get("fl4QualityTrial");
  const trial: FL4QualityTrial | null =
    requestedTrial === "native" || requestedTrial === "supernative"
      ? requestedTrial : null;
  const explicit = params.get("fl4Scale");
  if (explicit !== null && explicit.trim() !== "") {
    const scale = Number(explicit);
    if (Number.isFinite(scale) && scale >= 0.2 && scale <= 2) {
      return {
        trial,
        hardwareScale: capRenderHardwareScale(scale, cssWidth, cssHeight),
        source: "explicit-scale",
      };
    }
  }
  return trial === null
    ? { trial, hardwareScale: null, source: null }
    : {
      trial,
      hardwareScale: renderHardwareScale({
        mode: trial === "native" ? "Native" : "Custom",
        renderScalePercent: trial === "native" ? 100 : 125,
        devicePixelRatio,
        coarsePointer: true,
        cssWidth,
        cssHeight,
      }),
      source: "quality-trial",
    };
}
