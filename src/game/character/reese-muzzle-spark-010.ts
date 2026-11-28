/**
 * LMS-GUN-011 — retained muzzle-positioned gunfire lighting.
 * The visible flame/particle geometry was removed by owner direction. Keep
 * only the existing short-lived PointLights and their weapon profiles.
 */
import { Color3, PointLight, Vector3, type Scene } from "@babylonjs/core";

type WeaponClass = "rifle" | "smg" | "pistol";
const PROFILES: Record<WeaponClass, { light: number }> = {
  rifle: { light: 200 },
  smg: { light: 135 },
  pistol: { light: 100 },
};
const weaponClass = (weapon: string): WeaponClass =>
  weapon === "m4a1" ? "rifle" : weapon === "mpx9" ? "smg" : "pistol";

export function createReeseMuzzleSpark010(scene: Scene) {
  const lights = Array.from({ length: 4 }, (_, i) => {
    const light = new PointLight("lms-muzzle-flash-light-" + i, Vector3.Zero(), scene);
    light.diffuse = new Color3(1, .58, .28);
    light.specular = new Color3(1, .72, .42);
    light.range = 5;
    light.intensity = 0;
    return { light, age: 1, duration: .09, peak: 0 };
  });
  let cursor = 0, emitted = 0, closed = false;
  const clear = () => {
    for (const entry of lights) {
      entry.age = entry.duration;
      entry.light.intensity = 0;
    }
  };
  return {
    emit(origin: Vector3, _heading: number, weapon = "m4a1") {
      if (closed) return;
      emitted++;
      const profile = PROFILES[weaponClass(weapon)];
      const entry = lights[cursor++ % lights.length]!;
      entry.light.position.copyFrom(origin);
      entry.age = 0;
      entry.duration = .09;
      entry.peak = profile.light;
      entry.light.intensity = profile.light;
    },
    update(dt: number) {
      const step = Math.max(0, dt);
      for (const entry of lights) {
        if (entry.age >= entry.duration) { entry.light.intensity = 0; continue; }
        entry.age += step;
        const t = entry.age;
        entry.light.intensity = entry.peak * Math.exp(-16 * t) *
          (1 - Math.min(1, t / entry.duration) ** 2);
        if (entry.age >= entry.duration) entry.light.intensity = 0;
      }
    },
    clear,
    get emitted() { return emitted; },
    dispose() {
      if (closed) return;
      closed = true;
      clear();
      for (const entry of lights) entry.light.dispose();
    },
  };
}
