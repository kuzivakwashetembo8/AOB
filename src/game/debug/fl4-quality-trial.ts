/**
 * Opt-in FL4 raster stress trial, never used without fl4Diagnostics=1.
 * Native = display DPR; supernative = 1.25 rendered pixels per physical pixel
 * in each dimension, with 56.25% more pixel work than native.
 */
export type FL4QualityTrial = "native" | "supernative";

export interface FL4RasterOverride {
  readonly trial: FL4QualityTrial | null;
  readonly hardwareScale: number | null;
  readonly source: "quality-trial" | "explicit-scale" | null;
}

export function resolveFL4RasterOverride(params: URLSearchParams): FL4RasterOverride {
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
    if (Number.isFinite(scale) && scale >= 0.75 && scale <= 2) {
      return { trial, hardwareScale: scale, source: "explicit-scale" };
    }
  }
  return trial === null
    ? { trial, hardwareScale: null, source: null }
    : { trial, hardwareScale: trial === "native" ? 1 : 0.8, source: "quality-trial" };
}
