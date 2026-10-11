import { describe, expect, it } from "vitest";
import {
  DEFAULT_RENDER_CLARITY,
  LEGACY_RENDER_PIXELS_PER_CSS_PIXEL,
  MOBILE_AUTO_PIXELS_PER_CSS_PIXEL,
  SHARPER_PIXELS_PER_CSS_PIXEL,
  normalizeRenderClarity,
  normalizeRenderScalePercent,
  renderHardwareScale,
} from "../game/renderer/render-clarity";
import { renderScaleCoverage } from "../game/debug/fl4-metrics";
import { defaults } from "../ui/menus/settings-state";

const scale = (
  devicePixelRatio: number,
  mode: "Auto" | "Balanced" | "Sharper" | "Native" | "Custom",
  coarsePointer = true,
  renderScalePercent = 100,
) => renderHardwareScale({ devicePixelRatio, mode, coarsePointer, renderScalePercent });

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
    expect(scale(3, "Native")).toBeCloseTo(1 / 3);
  });

  it("improves mobile pixel coverage measurably without increasing desktop DPR1", () => {
    const cssWidth = 800, cssHeight = 360, dpr = 3;
    const pixels = (mode: "Auto" | "Balanced" | "Sharper" | "Native") =>
      renderScaleCoverage({
        cssWidth,
        cssHeight,
        devicePixelRatio: dpr,
        renderWidth: Math.round(cssWidth / scale(dpr, mode)),
        renderHeight: Math.round(cssHeight / scale(dpr, mode)),
      }).nativeCoveragePercent!;
    expect(pixels("Balanced")).toBeCloseTo(2.8, 0);
    expect(pixels("Auto")).toBeGreaterThan(pixels("Balanced"));
    expect(pixels("Sharper")).toBeGreaterThan(pixels("Auto"));
    expect(pixels("Native")).toBeCloseTo(100, 0);
    expect(scale(1, "Auto", false)).toBe(1);
    expect(scale(1, "Sharper", true)).toBe(1);
  });

  it("keeps previously accepted desktop scaling with auto and native requires opt-in", () => {
    expect(scale(2.5, "Auto", false)).toBeCloseTo(2.5 / 1.5);
    expect(scale(2.5, "Auto", true)).toBeCloseTo(2.5 / 1.75);
    expect(scale(2.5, "Native", false)).toBeCloseTo(0.4);
    expect(scale(2.5, "Native", true)).toBeCloseTo(0.4);
    expect(scale(2.5, "Balanced", false)).toBeCloseTo(2.5 / 1.5);
    expect(scale(2, "Sharper")).toBe(1);
  });

  it("rejects invalid stored modes and avoids illegal positive/negative DPR", () => {
    expect(normalizeRenderClarity("Auto")).toBe("Auto");
    expect(normalizeRenderClarity("Balanced")).toBe("Balanced");
    expect(normalizeRenderClarity("Sharper")).toBe("Sharper");
    expect(normalizeRenderClarity("Native")).toBe("Native");
    expect(normalizeRenderClarity("Custom")).toBe("Custom");
    expect(normalizeRenderScalePercent(103)).toBe(105);
    expect(normalizeRenderScalePercent(999)).toBe(125);
    expect(normalizeRenderScalePercent(-9)).toBe(50);
    expect(normalizeRenderScalePercent(undefined)).toBe(100);
    expect(normalizeRenderClarity("75%")).toBe("Auto");
    expect(normalizeRenderClarity(undefined)).toBe("Auto");
    expect(scale(Number.NaN, "Auto")).toBe(1);
    expect(scale(-1, "Auto")).toBe(1);
  });

  it("targets the actual physical raster at 100% and permits opt-in supersampling", () => {
    const dpr = 1.875;
    expect(scale(dpr, "Native")).toBeCloseTo(1 / dpr, 5);
    expect(scale(dpr, "Custom", true, 100)).toBeCloseTo(1 / dpr, 5);
    expect(scale(dpr, "Custom", true, 125)).toBeCloseTo(1 / (dpr * 1.25), 5);
    expect(scale(dpr, "Custom", true, 50)).toBeCloseTo(1 / (dpr * 0.5), 5);
    const renderWidth = Math.round(819.2 / scale(dpr, "Native"));
    const renderHeight = Math.round(384 / scale(dpr, "Native"));
    expect(renderWidth).toBe(1536);
    expect(renderHeight).toBe(720);
  });

  it("caps high-DPR framebuffer demands while keeping ordinary phone native achievable", () => {
    expect(renderHardwareScale({
      mode: "Native", devicePixelRatio: 1.875, coarsePointer: true,
      cssWidth: 819.2, cssHeight: 384,
    })).toBeCloseTo(1 / 1.875);
    const scaleCapped = renderHardwareScale({
      mode: "Custom", renderScalePercent: 125, devicePixelRatio: 4,
      coarsePointer: true, cssWidth: 1920, cssHeight: 1080,
    });
    const cappedWidth = 1920 / scaleCapped;
    const cappedHeight = 1080 / scaleCapped;
    expect(cappedWidth).toBeLessThanOrEqual(4096.01);
    expect(cappedWidth * cappedHeight).toBeLessThanOrEqual(6_000_001);
  });
});
