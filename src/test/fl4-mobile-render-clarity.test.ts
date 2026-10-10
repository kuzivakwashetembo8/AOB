import { describe, expect, it } from "vitest";
import {
  DEFAULT_RENDER_CLARITY,
  LEGACY_RENDER_PIXELS_PER_CSS_PIXEL,
  MOBILE_AUTO_PIXELS_PER_CSS_PIXEL,
  SHARPER_PIXELS_PER_CSS_PIXEL,
  normalizeRenderClarity,
  renderHardwareScale,
} from "../game/renderer/render-clarity";
import { renderScaleCoverage } from "../game/debug/fl4-metrics";
import { defaults } from "../ui/menus/settings-state";

const scale = (
  devicePixelRatio: number,
  mode: "Auto" | "Balanced" | "Sharper" | "Native",
  coarsePointer = true,
) => renderHardwareScale({ devicePixelRatio, mode, coarsePointer });

describe("FL4-02 DPR-aware mobile image clarity", () => {
  it("keeps an ergonomic default without claiming all phones can run native", () => {
    expect(DEFAULT_RENDER_CLARITY).toBe("Auto");
    expect(defaults.renderClarity).toBe("Auto");
    expect(LEGACY_RENDER_PIXELS_PER_CSS_PIXEL).toBe(1.5);
    expect(MOBILE_AUTO_PIXELS_PER_CSS_PIXEL).toBe(1.75);
    expect(SHARPER_PIXELS_PER_CSS_PIXEL).toBe(2);
    expect(scale(3, "Balanced")).toBeCloseTo(2); // old 1.5px/CSS
    expect(scale(3, "Auto")).toBeCloseTo(3 / 1.75);
    expect(scale(3, "Sharper")).toBeCloseTo(1.5);
    expect(scale(3, "Native")).toBe(1);
  });

  it("improves mobile pixel coverage measurably without increasing desktop DPR1", () => {
    const cssWidth = 800, cssHeight = 360, dpr = 3;
    const pixels = (mode: "Auto" | "Balanced" | "Sharper" | "Native") =>
      renderScaleCoverage({
        cssWidth,
        cssHeight,
        devicePixelRatio: dpr,
        renderWidth: Math.round((cssWidth * dpr) / scale(dpr, mode)),
        renderHeight: Math.round((cssHeight * dpr) / scale(dpr, mode)),
      }).nativeCoveragePercent!;
    expect(pixels("Balanced")).toBeCloseTo(25, 0);
    expect(pixels("Auto")).toBeGreaterThan(pixels("Balanced"));
    expect(pixels("Sharper")).toBeGreaterThan(pixels("Auto"));
    expect(pixels("Native")).toBeCloseTo(100, 0);
    expect(scale(1, "Auto", false)).toBe(1);
    expect(scale(1, "Sharper", true)).toBe(1);
  });

  it("keeps previously accepted desktop scaling with auto and native requires opt-in", () => {
    expect(scale(2.5, "Auto", false)).toBeCloseTo(2.5 / 1.5);
    expect(scale(2.5, "Auto", true)).toBeCloseTo(2.5 / 1.75);
    expect(scale(2.5, "Native", false)).toBe(1);
    expect(scale(2.5, "Native", true)).toBe(1);
    expect(scale(2.5, "Balanced", false)).toBeCloseTo(2.5 / 1.5);
    expect(scale(2, "Sharper")).toBe(1);
  });

  it("rejects invalid stored modes and avoids illegal positive/negative DPR", () => {
    expect(normalizeRenderClarity("Auto")).toBe("Auto");
    expect(normalizeRenderClarity("Balanced")).toBe("Balanced");
    expect(normalizeRenderClarity("Sharper")).toBe("Sharper");
    expect(normalizeRenderClarity("Native")).toBe("Native");
    expect(normalizeRenderClarity("75%")).toBe("Auto");
    expect(normalizeRenderClarity(undefined)).toBe("Auto");
    expect(scale(Number.NaN, "Auto")).toBe(1);
    expect(scale(-1, "Auto")).toBe(1);
  });
});
