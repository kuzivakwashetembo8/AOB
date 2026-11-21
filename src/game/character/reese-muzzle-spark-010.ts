/**
 * LMS-GUN-011 — Babylon adaptation of Claude-of-Duty's weapon-class muzzle FX.
 * COD's source FX are Three.js atlas particles; AOB keeps its Babylon renderer.
 * The port preserves the source profile: incandescent core, irregular gas
 * tongues, bore-aligned jet, forward embers, delayed smoke and short real light.
 */
import { Color3, Mesh, MeshBuilder, PointLight, StandardMaterial, Vector3, type Scene } from "@babylonjs/core";

type Part = { mesh: Mesh; life: number; duration: number; start: number; end: number };
type WeaponClass = "rifle" | "smg" | "pistol";
const PROFILES: Record<WeaponClass, { scale: number; lobes: number; jet: number; light: number; sparks: number; smoke: number }> = {
  rifle: { scale: 1, lobes: 4, jet: 1, light: 200, sparks: 8, smoke: 1 },
  smg: { scale: .78, lobes: 3, jet: .75, light: 135, sparks: 6, smoke: .7 },
  pistol: { scale: .66, lobes: 2, jet: .6, light: 100, sparks: 5, smoke: .55 },
};
const weaponClass = (weapon: string): WeaponClass =>
  weapon === "m4a1" ? "rifle" : weapon === "mpx9" ? "smg" : "pistol";

export function createReeseMuzzleSpark010(scene: Scene) {
  const material = (name: string, color: Color3, alpha = 1) => {
    const m = new StandardMaterial(name, scene);
    m.disableLighting = true; m.emissiveColor = color; m.diffuseColor = color; m.alpha = alpha;
    return m;
  };
  const hotMat = material("lms-muzzle-hot-core", new Color3(1, .96, .84));
  const coreMat = material("lms-muzzle-burning-core", new Color3(1, .66, .3));
  const gasMat = material("lms-muzzle-propellant-gas", new Color3(1, .29, .045), .92);
  const emberMat = material("lms-muzzle-burning-powder", new Color3(1, .43, .1));
  const smokeMat = material("lms-muzzle-powder-smoke", new Color3(.32, .29, .26), .2);
  const parts: Part[] = [];
  const part = (mesh: Mesh, duration: number, start: number, end: number, mat: StandardMaterial) => {
    mesh.material = mat; mesh.isPickable = false; mesh.isVisible = false;
    const p = { mesh, life: 0, duration, start, end }; parts.push(p); return p;
  };
  const core = part(MeshBuilder.CreateSphere("lms-muzzle-core", { diameter: .13, segments: 6 }, scene), .062, .66, 1.05, coreMat);
  const hot = part(MeshBuilder.CreateSphere("lms-muzzle-hot-core", { diameter: .056, segments: 6 }, scene), .046, .65, 1, hotMat);
  const lobes = Array.from({ length: 4 }, (_, i) =>
    part(MeshBuilder.CreateCylinder("lms-muzzle-gas-lobe-" + i, { height: .25, diameterTop: .012, diameterBottom: .085, tessellation: 5 }, scene), .052, .55, 1, gasMat));
  const jet = part(MeshBuilder.CreateCylinder("lms-muzzle-forward-jet", { height: .28, diameterTop: .012, diameterBottom: .06, tessellation: 5 }, scene), .044, .65, 1, gasMat);
  const sparks = Array.from({ length: 8 }, (_, i) =>
    part(MeshBuilder.CreateCylinder("lms-muzzle-ember-" + i, { height: .12, diameterTop: .002, diameterBottom: .012, tessellation: 4 }, scene), .2 + (i % 4) * .035, .7, .08, emberMat));
  const smoke = Array.from({ length: 3 }, (_, i) =>
    part(MeshBuilder.CreateSphere("lms-muzzle-smoke-" + i, { diameter: .1 + i * .025, segments: 5 }, scene), .38 + i * .06, .22, 1.05, smokeMat));
  const lights = Array.from({ length: 4 }, (_, i) => {
    const light = new PointLight("lms-muzzle-flash-light-" + i, Vector3.Zero(), scene);
    light.diffuse = new Color3(1, .58, .28); light.specular = new Color3(1, .72, .42);
    light.range = 5; light.intensity = 0;
    return { light, age: 1, duration: .09, peak: 0 };
  });
  let cursor = 0, emitted = 0, closed = false;
  const activate = (p: Part, pos: Vector3, rot: Vector3, scale: number) => {
    p.life = p.duration; p.mesh.position.copyFrom(pos); p.mesh.rotation.copyFrom(rot);
    p.mesh.scaling.setAll(p.start * scale); p.mesh.isVisible = true;
  };
  const clear = () => {
    for (const p of parts) { p.life = 0; p.mesh.isVisible = false; }
    for (const e of lights) { e.age = e.duration; e.light.intensity = 0; }
  };
  return {
    emit(origin: Vector3, heading: number, weapon = "m4a1") {
      if (closed) return;
      emitted++;
      const profile = PROFILES[weaponClass(weapon)];
      const scale = profile.scale * (.88 + ((emitted * .61803398875) % 1) * .24);
      const forward = new Vector3(Math.sin(heading), 0, Math.cos(heading));
      const right = new Vector3(forward.z, 0, -forward.x);
      activate(core, origin, new Vector3(0, heading, 0), scale);
      activate(hot, origin, new Vector3(0, heading, 0), scale);
      const lobeCount = Math.max(2, profile.lobes);
      lobes.forEach((p, i) => {
        if (i >= lobeCount) { p.life = 0; p.mesh.isVisible = false; return; }
        const angle = (i / lobeCount) * Math.PI * 2 + ((emitted * .73) % 1) * .8;
        const side = right.scale(Math.cos(angle) * .075).add(Vector3.Up().scale(Math.sin(angle) * .045));
        const pos = origin.add(forward.scale(.07)).add(side);
        activate(p, pos, new Vector3(Math.PI / 2 + Math.sin(angle) * .48, heading, Math.cos(angle) * .35), scale);
      });
      activate(jet, origin.add(forward.scale(.13 * profile.jet)), new Vector3(Math.PI / 2, heading, 0), scale);
      sparks.forEach((p, i) => {
        if (i >= profile.sparks) { p.life = 0; p.mesh.isVisible = false; return; }
        const a = emitted * 1.91 + i * 2.399;
        const d = forward.scale(.72 + (i % 3) * .12)
          .add(right.scale(Math.sin(a) * .16))
          .add(Vector3.Up().scale(Math.cos(a * 1.31) * .12)).normalize();
        const pos = origin.add(d.scale(.055));
        activate(p, pos, new Vector3(Math.PI / 2 - Math.atan2(d.y, Math.sqrt(d.x * d.x + d.z * d.z)), heading, Math.atan2(d.x, d.z)), scale);
      });
      smoke.forEach((p, i) => {
        const pos = origin.add(forward.scale(.035 + i * .025)).add(Vector3.Up().scale(i * .018));
        activate(p, pos, new Vector3(0, heading + i * 1.7, 0), scale * (.7 + profile.smoke * .3));
      });
      const light = lights[cursor++ % lights.length]!;
      light.light.position.copyFrom(origin); light.age = 0; light.duration = .09;
      light.peak = profile.light; light.light.intensity = profile.light;
    },
    update(dt: number) {
      const step = Math.max(0, dt);
      for (const p of parts) {
        if (p.life <= 0) continue;
        p.life = Math.max(0, p.life - step);
        const t = 1 - p.life / p.duration;
        p.mesh.scaling.setAll(Math.max(.015, p.start + (p.end - p.start) * t));
        if (p.life === 0) p.mesh.isVisible = false;
      }
      for (const e of lights) {
        if (e.age >= e.duration) { e.light.intensity = 0; continue; }
        e.age += step;
        const t = e.age;
        e.light.intensity = e.peak * Math.exp(-16 * t) * (1 - Math.min(1, t / e.duration) ** 2);
        if (e.age >= e.duration) e.light.intensity = 0;
      }
    },
    clear,
    get emitted() { return emitted; },
    dispose() {
      if (closed) return;
      closed = true; clear();
      for (const p of parts) p.mesh.dispose();
      for (const e of lights) e.light.dispose();
      hotMat.dispose(); coreMat.dispose(); gasMat.dispose(); emberMat.dispose(); smokeMat.dispose();
    },
  };
}
