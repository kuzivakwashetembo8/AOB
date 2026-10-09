/**
 * Pure FL-4 benchmarking calculations. Never run from React state or affect
 * fixed-step simulation. Values are displayed only when diagnostics are enabled.
 */
export function percentile(values: readonly number[], fraction: number): number | null {
  if (values.length === 0 || !Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
    return null;
  }
  const sorted = values.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = Math.ceil((sorted.length - 1) * fraction);
  return Math.round(sorted[index]! * 100) / 100;
}

export function approximateFps(medianFrameMs: number | null): number | null {
  return medianFrameMs !== null && medianFrameMs > 0
    ? Math.round(100000 / medianFrameMs) / 100
    : null;
}

export function renderScaleCoverage(input: {
  cssWidth: number;
  cssHeight: number;
  renderWidth: number;
  renderHeight: number;
  devicePixelRatio: number;
}): { expectedNativePixels: number; actualPixels: number; nativeCoveragePercent: number | null } {
  const { cssWidth, cssHeight, renderWidth, renderHeight, devicePixelRatio } = input;
  const expectedNativePixels =
    Math.round(cssWidth * devicePixelRatio) * Math.round(cssHeight * devicePixelRatio);
  const actualPixels = renderWidth * renderHeight;
  return {
    expectedNativePixels,
    actualPixels,
    nativeCoveragePercent: expectedNativePixels > 0
      ? Math.round((actualPixels / expectedNativePixels) * 1000) / 10
      : null,
  };
}
