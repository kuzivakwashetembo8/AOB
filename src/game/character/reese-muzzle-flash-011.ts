/**
 * LMS-COD-FX-001 — Babylon-native port of Claude of Duty's muzzle-flash recipe.
 *
 * Preserves its weapon-class profiles and visual sequence: incandescent crown,
 * asymmetric gas tongues, forward jet, down-bore embers, delayed powder puffs,
 * lingering barrel smoke and a short-range point-light pulse. Three.js/GPU
 * atlas dependencies are deliberately not imported into AOB's Babylon scene.
 */
import {
  Color3, Mesh, MeshBuilder, PointLight, Quaternion, StandardMaterial, TransformNode, Vector3,
  type Scene,
} from "@babylonjs/core";

export type ReeseMuzzleWeapon001 = "m4a1" | "mpx9" | "p19";
export const COD_MUZZLE_PROFILES_001 = {
  rifle: { scale: 1, lobes: 3, jet: 1, light: 200, smoke: 1, sparks: 8 },
  smg: { scale: .78, lobes: 3, jet: .75, light: 135, smoke: .7, sparks: 6 },
  pistol: { scale: .66, lobes: 2, jet: .6, light: 100, smoke: .55, sparks: 5 },
} as const;

const UP = new Vector3(0, 1, 0);
const ZERO = new Vector3(0, 0, 0);
type Particle = {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  duration: number;
  drag: number;
  gravity: number;
  startScale: number;
  endScale: number;
  aspect: number;
  smoke: boolean;
  material: StandardMaterial | null;
};
type Burst = {
  core: Particle;
  heart: Particle;
  lobes: Particle[];
  jet: Particle;
  sparks: Particle[];
  puffs: Particle[];
  smoke: Particle[];
  particles: Particle[];
  light: PointLight;
  lightLife: number;
  lightPeak: number;
  lightDuration: number;
};
const profileFor = (id: ReeseMuzzleWeapon001) =>
  id === "mpx9" ? COD_MUZZLE_PROFILES_001.smg :
  id === "p19" ? COD_MUZZLE_PROFILES_001.pistol :
  COD_MUZZLE_PROFILES_001.rifle;

export function createReeseMuzzleFlash011(scene: Scene) {
  const coreMat = new StandardMaterial("lms-cod-fx-core", scene);
  coreMat.disableLighting = true;
  coreMat.emissiveColor = new Color3(1, .66, .28);
  coreMat.diffuseColor = new Color3(1, .86, .62);
  coreMat.alpha = .98;

  const heartMat = new StandardMaterial("lms-cod-fx-heart", scene);
  heartMat.disableLighting = true;
  heartMat.emissiveColor = new Color3(1, .88, .66);
  heartMat.diffuseColor = new Color3(1, .96, .82);

  const gasMat = new StandardMaterial("lms-cod-fx-gas", scene);
  gasMat.disableLighting = true;
  gasMat.emissiveColor = new Color3(1, .27, .055);
  gasMat.diffuseColor = new Color3(1, .48, .16);

  const jetMat = new StandardMaterial("lms-cod-fx-jet", scene);
  jetMat.disableLighting = true;
  jetMat.emissiveColor = new Color3(1, .48, .16);

  const smokeMat = new StandardMaterial("lms-cod-fx-smoke", scene);
  smokeMat.diffuseColor = new Color3(.48, .47, .45);
  smokeMat.emissiveColor = new Color3(.045, .04, .035);
  smokeMat.specularColor = new Color3(.02, .02, .02);
  smokeMat.alpha = .34;

  const emberMat = new StandardMaterial("lms-cod-fx-embers", scene);
  emberMat.disableLighting = true;
  emberMat.emissiveColor = new Color3(1, .58, .22);

  const makeParticle = (
    name: string, shape: "sphere" | "cone", material: StandardMaterial,
    smoke = false,
  ): Particle => {
    const mesh = shape === "sphere"
      ? MeshBuilder.CreateSphere(name, { diameter: 1, segments: 5 }, scene)
      : MeshBuilder.CreateCylinder(name, {
          height: 1, diameterTop: .005, diameterBottom: 1, tessellation: 5,
        }, scene);
    mesh.material = material;
    mesh.renderingGroupId = 1;
    mesh.isPickable = false;
    mesh.isVisible = false;
    mesh.rotationQuaternion = new Quaternion();
    mesh.scaling.setAll(.001);
    const smokeMaterial = smoke ? material.clone(name + "-material") : null;
    if (smokeMaterial) mesh.material = smokeMaterial;
    return {
      mesh, velocity: new Vector3(), life: 0, duration: 1, drag: 0,
      gravity: 0, startScale: 0, endScale: 0, aspect: 1, smoke, material: smokeMaterial,
    };
  };

  const makeBurst = (index: number): Burst => {
    const prefix = "lms-cod-fx-" + index;
    const core = makeParticle(prefix + "-crown", "sphere", coreMat);
    const heart = makeParticle(prefix + "-heart", "sphere", heartMat);
    const lobes = Array.from({ length: 4 }, (_, i) =>
      makeParticle(prefix + "-gas-" + i, "cone", gasMat));
    const jet = makeParticle(prefix + "-jet", "cone", jetMat);
    const sparks = Array.from({ length: 8 }, (_, i) =>
      makeParticle(prefix + "-ember-" + i, "cone", emberMat));
    const puffs = Array.from({ length: 2 }, (_, i) =>
      makeParticle(prefix + "-powder-puff-" + i, "sphere", gasMat));
    const smoke = Array.from({ length: 3 }, (_, i) =>
      makeParticle(prefix + "-barrel-smoke-" + i, "sphere", smokeMat, true));
    const light = new PointLight(prefix + "-flash-light", ZERO.clone(), scene);
    light.intensity = 0;
    light.range = 5;
    light.diffuse = new Color3(1, .57, .28);
    light.specular = new Color3(1, .45, .18);
    const particles = [core, heart, jet, ...lobes, ...sparks, ...puffs, ...smoke];
    return {
      core, heart, lobes, jet, sparks, puffs, smoke, particles, light,
      lightLife: 0, lightPeak: 0, lightDuration: .09,
    };
  };

  const bursts = Array.from({ length: 4 }, (_, i) => makeBurst(i));
  let cursor = 0;
  let effectParent: TransformNode | null = null;
  let seed = 0x51f15e;
  let emitted = 0;
  const forward = new Vector3(0, 0, 1);
  const right = new Vector3(1, 0, 0);
  const up = new Vector3(0, 1, 0);
  const lobeDir = new Vector3();
  const sparkDir = new Vector3();
  const originOffset = new Vector3();

  const random = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const range = (a: number, b: number) => a + (b - a) * random();
  const hide = (p: Particle) => {
    p.life = 0;
    p.mesh.isVisible = false;
    if (p.material) p.material.alpha = 0;
  };
  const spawn = (
    p: Particle, x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    start: number, end: number, life: number, drag: number, gravity = 0,
    direction?: Vector3, aspect = 1,
  ) => {
    p.mesh.position.set(x, y, z);
    p.velocity.set(vx, vy, vz);
    p.startScale = start; p.endScale = end;
    p.life = life; p.duration = life; p.drag = drag; p.gravity = gravity; p.aspect = aspect;
    p.mesh.scaling.set(start, start * aspect, start);
    p.mesh.isVisible = true;
    if (direction) {
      p.mesh.rotationQuaternion ??= new Quaternion();
      Quaternion.FromUnitVectorsToRef(UP, direction, p.mesh.rotationQuaternion);
    }
    if (p.material) p.material.alpha = .34;
  };
  const clearBurst = (b: Burst) => {
    hide(b.core); hide(b.heart); hide(b.jet);
    for (const p of b.particles) hide(p);
    b.lightLife = 0; b.light.intensity = 0;
  };
  const clear = () => { for (const b of bursts) clearBurst(b); };
  const setParent = (parent: TransformNode | null) => {
    if (effectParent === parent) return;
    clear();
    effectParent = parent;
    for (const b of bursts) {
      for (const p of b.particles) p.mesh.parent = parent;
      b.light.parent = parent;
    }
  };

  const emit = (
    muzzle: Vector3, direction: Vector3, weapon: ReeseMuzzleWeapon001,
  ) => {
    const profile = profileFor(weapon);
    const b = bursts[cursor++ % bursts.length]!;
    clearBurst(b);
    seed = (seed ^ (++emitted * 0x9e3779b9)) >>> 0;
    forward.copyFrom(direction);
    if (forward.lengthSquared() < .0001) forward.set(0, 0, 1);
    forward.normalize();
    right.set(forward.z, 0, -forward.x);
    if (right.lengthSquared() < .0001) right.set(1, 0, 0);
    right.normalize();
    Vector3.CrossToRef(forward, right, up).normalize();

    const gain = .86 + random() * .28;
    const scale = profile.scale * (.88 + random() * .24);
    const coreColour = new Color3(1, .76 + random() * .12, .48 + random() * .1);
    originOffset.copyFrom(forward).scaleInPlace(.1);
    b.light.position.copyFrom(muzzle).addInPlace(originOffset);

    // Incandescent crown and the smaller white-hot heart (COD muzzle.js).
    spawn(b.core, muzzle.x, muzzle.y, muzzle.z, 0, 0, 0,
      .085 * scale, .135 * scale, .062, 10);
    spawn(b.heart, muzzle.x, muzzle.y, muzzle.z, 0, 0, 0,
      .036 * scale, .056 * scale, .046, 12);
    coreMat.emissiveColor.copyFrom(coreColour);

    // Three or four independent, off-axis tongues of burning gas.
    const ports = Math.min(4, Math.max(3,
      profile.lobes + (random() < .45 ? 1 : 0)));
    const rollBase = random() * Math.PI * 2;
    const weak = Math.floor(random() * ports);
    const long = Math.floor(random() * ports);
    for (let i = 0; i < ports; i++) {
      const roll = rollBase + (i / ports) * Math.PI * 2 + range(-.55, .55);
      const pitch = range(.4, .85);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      lobeDir.set(
        forward.x * cp + right.x * Math.cos(roll) * sp + up.x * Math.sin(roll) * sp,
        forward.y * cp + right.y * Math.cos(roll) * sp + up.y * Math.sin(roll) * sp,
        forward.z * cp + right.z * Math.cos(roll) * sp + up.z * Math.sin(roll) * sp,
      ).normalize();
      const choke = i === weak ? range(.4, .62) :
        i === long ? range(1.1, 1.35) : range(.78, 1);
      const push = range(.6, 2.2) * choke;
      const length = (.18 + .14 * Math.pow(random(), 1.5)) * scale * choke;
      const p = b.lobes[i]!;
      spawn(p,
        muzzle.x + lobeDir.x * length * .34,
        muzzle.y + lobeDir.y * length * .34,
        muzzle.z + lobeDir.z * length * .34,
        lobeDir.x * push, lobeDir.y * push, lobeDir.z * push,
        (.06 + .05 * random()) * scale * choke, length,
        range(.04, .06), 12, 0, lobeDir, 1.5);
    }

    // Short forward gas jet, aligned to the bore rather than a floating ball.
    spawn(b.jet,
      muzzle.x + forward.x * .04, muzzle.y + forward.y * .04, muzzle.z + forward.z * .04,
      forward.x * 7, forward.y * 7, forward.z * 7,
      .045 * scale * profile.jet, .018 * scale * profile.jet,
      .044, 14, 0, forward, 3.5);

    // Hot powder grains are constrained to a forward cone, never thrown back
    // toward the shooter's face.
    const sparkCount = profile.sparks;
    for (let i = 0; i < sparkCount; i++) {
      sparkDir.set(
        forward.x + right.x * range(-.55, .55) + up.x * range(-.55, .55),
        forward.y + right.y * range(-.55, .55) + up.y * range(-.55, .55),
        forward.z + right.z * range(-.55, .55) + up.z * range(-.55, .55),
      ).normalize();
      if (Vector3.Dot(sparkDir, forward) < .55) sparkDir.copyFrom(forward);
      const speed = range(2.5, 8.5);
      const size = range(.005, .011);
      spawn(b.sparks[i]!,
        muzzle.x + forward.x * .012, muzzle.y + forward.y * .012, muzzle.z + forward.z * .012,
        sparkDir.x * speed, sparkDir.y * speed, sparkDir.z * speed,
        size, size * .4, range(.1, .4), 3.2, -11, sparkDir, 7);
    }

    // Brief warm powder puffs followed by softer, longer-lived barrel smoke.
    for (let i = 0; i < b.puffs.length; i++) {
      const side = range(-.7, .7);
      const lift = range(-.2, .7);
      spawn(b.puffs[i]!,
        muzzle.x + forward.x * .018 + right.x * side * .008,
        muzzle.y + forward.y * .018 + lift * .008,
        muzzle.z + forward.z * .018 + right.z * side * .008,
        right.x * side * range(.6, 1.9), .12 + lift, right.z * side * range(.6, 1.9),
        .018 * scale, .075 * scale * (.7 + profile.smoke * .5),
        range(.3, .55) * (.7 + profile.smoke * .5), 7, .5);
    }
    for (let i = 0; i < b.smoke.length; i++) {
      const side = range(-1, 1);
      const lift = range(.1, 1);
      const speed = range(.4, 2.2) * profile.smoke;
      const p = b.smoke[i]!;
      spawn(p,
        muzzle.x + forward.x * range(0, .09) + right.x * side * .01,
        muzzle.y + forward.y * range(0, .09) + lift * .01,
        muzzle.z + forward.z * range(0, .09) + right.z * side * .01,
        right.x * side * speed, .28 + lift * .2, right.z * side * speed,
        range(.03, .055) * profile.smoke,
        range(.16, .32) * profile.smoke,
        range(.5, 1.15) * (.6 + profile.smoke * .6), 2.6, .36);
    }

    // A warm, short-range light pool: 90 ms, 5 m cutoff, weapon-class power.
    b.light.diffuse.copyFrom(coreColour);
    b.light.range = 5 * scale;
    b.lightPeak = profile.light / 200 * 1.5 * gain;
    b.lightDuration = .09;
    b.lightLife = b.lightDuration;
    b.light.intensity = b.lightPeak;
  };

  const update = (dt: number) => {
    const step = Math.max(0, Math.min(dt, .1));
    for (const b of bursts) {
      for (const p of b.particles) {
        if (p.life <= 0) continue;
        p.life = Math.max(0, p.life - step);
        const age = 1 - p.life / p.duration;
        const drag = Math.exp(-p.drag * step);
        p.velocity.x *= drag; p.velocity.y = p.velocity.y * drag + p.gravity * step;
        p.velocity.z *= drag;
        p.mesh.position.x += p.velocity.x * step;
        p.mesh.position.y += p.velocity.y * step;
        p.mesh.position.z += p.velocity.z * step;
        const size = p.startScale + (p.endScale - p.startScale) * age;
        p.mesh.scaling.set(Math.max(.001, size), Math.max(.001, size * p.aspect), Math.max(.001, size));
        if (p.material) p.material.alpha = .34 * (1 - age) * (p.life > 0 ? 1 : 0);
        if (p.life === 0) p.mesh.isVisible = false;
      }
      if (b.lightLife > 0) {
        b.lightLife = Math.max(0, b.lightLife - step);
        const t = b.lightLife / b.lightDuration;
        b.light.intensity = b.lightPeak * t * t;
      } else b.light.intensity = 0;
    }
  };

  return {
    emit,
    update,
    setParent,
    clear,
    get emitted() { return emitted; },
    dispose() {
      clear();
      for (const b of bursts) {
        for (const p of b.particles) {
          p.mesh.dispose();
          p.material?.dispose();
        }
        b.light.dispose();
      }
      coreMat.dispose(); heartMat.dispose(); gasMat.dispose(); smokeMat.dispose(); jetMat.dispose(); emberMat.dispose();
    },
  };
}
