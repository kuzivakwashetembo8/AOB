import { describe, expect, it } from "vitest";
import { approximateFps, percentile, renderScaleCoverage } from "../game/debug/fl4-metrics";

describe("FL-4 measurement invariants", () => {
  it("computes stable percentiles independent of sample order", () => {
    expect(percentile([40, 10, 20, 30], 0.5)).toBe(20);
    expect(percentile([40, 10, 20, 30], 0.95)).toBe(40);
    expect(percentile([10, Number.NaN, -7, 20], 0.5)).toBe(10);
    expect(percentile([], 0.5)).toBeNull();
    expect(percentile([20], 1.1)).toBeNull();
  });

  it("reports median-derived fps without treating zero or missing frames as valid", () => {
    expect(approximateFps(16.67)).toBeCloseTo(59.99, 1);
    expect(approximateFps(0)).toBeNull();
    expect(approximateFps(null)).toBeNull();
  });

  it("distinguishes CSS pixels from native and actual rendered pixels", () => {
    const values = { cssWidth: 800, cssHeight: 600, devicePixelRatio: 2 };
    expect(renderScaleCoverage({ ...values, renderWidth: 800, renderHeight: 600 })).toMatchObject({
      expectedNativePixels: 1920000,
      actualPixels: 480000,
      nativeCoveragePercent: 25,
    });
    expect(renderScaleCoverage({ ...values, renderWidth: 1600, renderHeight: 1200 }).nativeCoveragePercent).toBe(100);
  });
});
