import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_TOUCH_CAMERA_SENSITIVITY,
  MAX_TOUCH_CAMERA_SENSITIVITY,
  MIN_TOUCH_CAMERA_SENSITIVITY,
  mapTouchCameraDrag,
  normalizeTouchCameraSensitivity,
  touchCameraRadiansPerPixel,
} from "../game/input/touch-camera-sensitivity";
import { defaults } from "../ui/menus/settings-state";
import { Scene } from "../ui/menus/shell";

describe("FL-4 mobile camera sensitivity and clean 3D presentation", () => {
  it("defaults to responsive, tunable mobile swipe sensitivity", () => {
    expect(defaults.touchSensitivity).toBe(DEFAULT_TOUCH_CAMERA_SENSITIVITY);
    expect(DEFAULT_TOUCH_CAMERA_SENSITIVITY).toBe(60);
    expect(normalizeTouchCameraSensitivity(0)).toBe(MIN_TOUCH_CAMERA_SENSITIVITY);
    expect(normalizeTouchCameraSensitivity(110)).toBe(MAX_TOUCH_CAMERA_SENSITIVITY);
    expect(normalizeTouchCameraSensitivity(Number.NaN)).toBe(DEFAULT_TOUCH_CAMERA_SENSITIVITY);
    expect(touchCameraRadiansPerPixel(60)).toBeCloseTo(0.0081, 6);
    expect(touchCameraRadiansPerPixel(60)).toBeGreaterThan(0.002 * 4);
    expect(touchCameraRadiansPerPixel(100)).toBeGreaterThan(touchCameraRadiansPerPixel(60));
    expect(touchCameraRadiansPerPixel(10)).toBeLessThan(touchCameraRadiansPerPixel(60));
  });

  it("translates a single horizontal swipe into a fast turn and respects invert Y", () => {
    const normal = mapTouchCameraDrag(350, 120, 60, false);
    const inverted = mapTouchCameraDrag(350, 120, 60, true);
    // A single 350px swipe gives ~163 degrees rather than ~40 degrees.
    expect(Math.abs(normal.alpha)).toBeGreaterThan(2.8);
    expect(normal.alpha).toBeCloseTo(inverted.alpha);
    expect(inverted.beta).toBeCloseTo(-normal.beta);
    expect(mapTouchCameraDrag(0, 0, 100, false)).toEqual({ alpha: -0, beta: 0 });
  });

  it("does not place decorative menu scanlines over the Babylon game canvas", () => {
    const game = renderToStaticMarkup(<Scene game />);
    const menu = renderToStaticMarkup(<Scene />);
    expect(game).toContain("game-scene");
    expect(game).not.toContain("scene-grid");
    expect(menu).toContain("scene-grid");
  });
});
