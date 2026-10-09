import { NullEngine, Scene } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import {
  MERIDIAN_BASE_GAME_MINUTES_PER_REAL_SECOND,
  MeridianClock,
  createMeridianEnvironment,
} from "../game/world/environment-controller";

describe("Meridian FL-3 environment controller", () => {
  it("uses a 48-real-minute canonical day at 1x", () => {
    expect(MERIDIAN_BASE_GAME_MINUTES_PER_REAL_SECOND).toBeCloseTo(0.5);
    const clock = new MeridianClock(12 * 60, 1);
    clock.update(120);
    expect(clock.minuteOfDay).toBeCloseTo(13 * 60);
    expect(clock.format()).toBe("13:00");
  });

  it("supports the 24-minute FL-3 test cycle and direct time editing", () => {
    const clock = new MeridianClock(6 * 60, 2);
    clock.update(60);
    expect(clock.format()).toBe("07:00");
    clock.setMinuteOfDay(18 * 60 + 42);
    expect(clock.format()).toBe("18:42");
    clock.setTimeScale(0);
    clock.update(600);
    expect(clock.format()).toBe("18:42");
  });

  it("wraps Meridian time across midnight", () => {
    const clock = new MeridianClock(23 * 60 + 50, 2);
    clock.update(20);
    expect(clock.format()).toBe("00:10");
  });

  it("keeps daytime bright while making night urban, starred, and street-lit", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const environment = createMeridianEnvironment(scene, {
        enableShadows: true,
        initialMinuteOfDay: 12 * 60,
        initialTimeScale: 0,
      });
      const noon = environment.snapshot();
      expect(noon.daylight).toBeGreaterThan(0.95);
      expect(noon.starVisibility).toBeLessThan(0.01);
      expect(noon.streetlightIntensity).toBeLessThan(0.01);
      expect(environment.shadowGenerator).toBeNull();
      expect(
        environment.streetlights.every((light) => light.intensity < 0.01),
      ).toBe(true);

      const dusk = environment.setTimeMinutes(18 * 60);
      expect(dusk.twilight).toBeGreaterThan(0.5);
      expect(dusk.horizonGlow).toBeGreaterThan(noon.horizonGlow);

      const midnight = environment.setTimeMinutes(0);
      expect(midnight.night).toBeGreaterThan(0.95);
      expect(midnight.starVisibility).toBeGreaterThan(0.95);
      expect(midnight.streetlightIntensity).toBeGreaterThan(2.5);
      expect(
        environment.streetlights.every((light) => light.intensity > 2.5),
      ).toBe(true);
      expect(
        environment.streetlights.every((light) => light.range >= 17),
      ).toBe(true);
      expect(
        environment.interiorLights.every((light) => light.intensity > 1.2),
      ).toBe(true);
      expect(scene.getMeshByName("meridian-star-dome")?.visibility).toBeGreaterThan(
        0.95,
      );

      environment.dispose();
      expect(scene.lights).toHaveLength(0);
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
