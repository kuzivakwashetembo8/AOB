import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  PointLight,
  ShadowGenerator,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { AbstractMesh, Mesh, Scene } from "@babylonjs/core";
import { planStreetContext } from "../world-generation/street-context";
import { FIRST_LIGHT_CITY_SPEC } from "../world-generation/first-light-spec";

export const MERIDIAN_DAY_MINUTES = 24 * 60;
export const MERIDIAN_CANONICAL_DAY_REAL_MINUTES = 48;
export const MERIDIAN_FL3_TEST_DAY_REAL_MINUTES = 24;
export const MERIDIAN_BASE_GAME_MINUTES_PER_REAL_SECOND =
  MERIDIAN_DAY_MINUTES / (MERIDIAN_CANONICAL_DAY_REAL_MINUTES * 60);

export type MeridianTimePreset = "dawn" | "noon" | "dusk" | "midnight";
export type InteriorVisibilityState = "outside" | "threshold" | "inside";

export interface MeridianEnvironmentSnapshot {
  readonly minuteOfDay: number;
  readonly formattedTime: string;
  readonly timeScale: number;
  readonly daylight: number;
  readonly night: number;
}

export class MeridianClock {
  private minuteOfDayValue: number;
  private timeScaleValue: number;

  constructor(initialMinuteOfDay = 14 * 60 + 30, initialTimeScale = 2) {
    this.minuteOfDayValue = wrapMinutes(initialMinuteOfDay);
    this.timeScaleValue = Math.max(0, initialTimeScale);
  }

  get minuteOfDay(): number {
    return this.minuteOfDayValue;
  }

  get timeScale(): number {
    return this.timeScaleValue;
  }

  setMinuteOfDay(value: number): void {
    this.minuteOfDayValue = wrapMinutes(value);
  }

  setTimeScale(value: number): void {
    this.timeScaleValue = Math.max(0, Number.isFinite(value) ? value : 0);
  }

  setPreset(preset: MeridianTimePreset): void {
    const values: Record<MeridianTimePreset, number> = {
      dawn: 6 * 60,
      noon: 12 * 60,
      dusk: 18 * 60,
      midnight: 0,
    };
    this.setMinuteOfDay(values[preset]);
  }

  update(realSeconds: number): void {
    if (!Number.isFinite(realSeconds) || realSeconds <= 0) return;
    this.setMinuteOfDay(
      this.minuteOfDayValue +
        realSeconds *
          MERIDIAN_BASE_GAME_MINUTES_PER_REAL_SECOND *
          this.timeScaleValue,
    );
  }

  format(): string {
    const minute = Math.floor(this.minuteOfDayValue + 0.0001);
    const hours = Math.floor(minute / 60) % 24;
    const minutes = minute % 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
  }
}

export interface MeridianEnvironmentController {
  readonly clock: MeridianClock;
  readonly sun: DirectionalLight;
  readonly ambient: HemisphericLight;
  readonly shadowGenerator: ShadowGenerator | null;
  readonly streetlights: readonly PointLight[];
  readonly interiorLights: readonly PointLight[];
  update(realSeconds: number): MeridianEnvironmentSnapshot;
  snapshot(): MeridianEnvironmentSnapshot;
  setTimeMinutes(minutes: number): MeridianEnvironmentSnapshot;
  setTimeScale(scale: number): MeridianEnvironmentSnapshot;
  setPreset(preset: MeridianTimePreset): MeridianEnvironmentSnapshot;
  addShadowCaster(mesh: AbstractMesh): void;
  dispose(): void;
}

function wrapMinutes(value: number): number {
  const safe = Number.isFinite(value) ? value : 0;
  return ((safe % MERIDIAN_DAY_MINUTES) + MERIDIAN_DAY_MINUTES) % MERIDIAN_DAY_MINUTES;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) return value >= edge1 ? 1 : 0;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function color(
  day: readonly [number, number, number],
  night: readonly [number, number, number],
  daylight: number,
): Color3 {
  return new Color3(
    night[0] + (day[0] - night[0]) * daylight,
    night[1] + (day[1] - night[1]) * daylight,
    night[2] + (day[2] - night[2]) * daylight,
  );
}

function headless(scene: Scene): boolean {
  const engine = scene.getEngine() as {
    getClassName?: () => string;
    constructor?: { name?: string };
  };
  return (
    engine.getClassName?.() === "NullEngine" ||
    engine.constructor?.name === "NullEngine"
  );
}

function daylightForMinutes(minutes: number): number {
  const hour = wrapMinutes(minutes) / 60;
  const sunrise = smoothstep(5.45, 7.15, hour);
  const sunset = 1 - smoothstep(17.15, 19.15, hour);
  return clamp01(sunrise * sunset);
}

function createSky(scene: Scene): {
  mesh: Mesh;
  material: StandardMaterial;
} {
  const material = new StandardMaterial("meridian-sky-material", scene);
  material.backFaceCulling = false;
  material.disableLighting = true;
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();

  const mesh = MeshBuilder.CreateSphere(
    "meridian-sky-dome",
    { diameter: 280, segments: 16 },
    scene,
  );
  mesh.infiniteDistance = true;
  mesh.isPickable = false;
  mesh.material = material;
  return { mesh, material };
}

export function createMeridianEnvironment(
  scene: Scene,
  options: {
    readonly enableShadows?: boolean;
    readonly initialMinuteOfDay?: number;
    readonly initialTimeScale?: number;
  } = {},
): MeridianEnvironmentController {
  const clock = new MeridianClock(
    options.initialMinuteOfDay,
    options.initialTimeScale,
  );

  const ambient = new HemisphericLight(
    "meridian-environment-ambient",
    new Vector3(0.18, 1, -0.12),
    scene,
  );
  const sun = new DirectionalLight(
    "meridian-environment-sun",
    new Vector3(-0.5, -1, 0.38),
    scene,
  );
  sun.position = new Vector3(24, 34, -18);
  sun.shadowMinZ = 0.1;
  sun.shadowMaxZ = 160;
  sun.autoUpdateExtends = true;

  const shadows =
    options.enableShadows !== false && !headless(scene)
      ? new ShadowGenerator(2048, sun)
      : null;
  if (shadows) {
    shadows.usePercentageCloserFiltering = true;
    shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    shadows.bias = 0.0005;
    shadows.normalBias = 0.025;
    shadows.transparencyShadow = true;
  }

  const sky = createSky(scene);

  const streetlights = planStreetContext(FIRST_LIGHT_CITY_SPEC).items
    .filter((item) => item.kind === "streetlight")
    .map((item) => {
      const light = new PointLight(
        "meridian-streetlight:" + item.id,
        new Vector3(item.position.x, item.position.y + 5.55 * item.scale, item.position.z),
        scene,
      );
      light.diffuse = new Color3(1, 0.78, 0.48);
      light.specular = new Color3(0.6, 0.42, 0.24);
      light.range = 10.5 * item.scale;
      light.intensity = 0;
      return light;
    });

  const interiorLights = [
    new PointLight(
      "south-ward-garage-interior-light-west",
      new Vector3(-10.2, 3.55, -5.25),
      scene,
    ),
    new PointLight(
      "south-ward-garage-interior-light-east",
      new Vector3(-4.8, 3.55, -5.25),
      scene,
    ),
  ];
  for (const light of interiorLights) {
    light.diffuse = new Color3(1, 0.88, 0.68);
    light.specular = new Color3(0.42, 0.32, 0.2);
    light.range = 7.2;
    light.intensity = 0.55;
  }

  const apply = (): MeridianEnvironmentSnapshot => {
    const minutes = clock.minuteOfDay;
    const hour = minutes / 60;
    const daylight = daylightForMinutes(minutes);
    const night = 1 - daylight;

    const solarPhase = clamp01((hour - 5.5) / 13.5);
    const elevation = Math.max(0.04, Math.sin(solarPhase * Math.PI));
    const azimuth = -Math.PI * 0.18 + solarPhase * Math.PI * 1.08;
    const horizontal = Math.max(0.15, Math.cos(Math.asin(Math.min(0.99, elevation))));
    sun.direction.set(
      -Math.cos(azimuth) * horizontal,
      -Math.max(0.12, elevation),
      -Math.sin(azimuth) * horizontal,
    );
    sun.position.set(
      -sun.direction.x * 42,
      Math.max(12, -sun.direction.y * 42),
      -sun.direction.z * 42,
    );
    sun.intensity = 0.06 + daylight * 1.02;

    const horizonWarmth = 1 - Math.abs(daylight * 2 - 1);
    sun.diffuse = new Color3(
      0.55 + daylight * 0.45,
      0.48 + daylight * 0.37 - horizonWarmth * 0.05,
      0.5 + daylight * 0.28 - horizonWarmth * 0.12,
    );

    ambient.intensity = 0.16 + daylight * 0.68;
    ambient.diffuse = color([0.66, 0.75, 0.86], [0.11, 0.15, 0.25], daylight);
    ambient.groundColor = color([0.17, 0.15, 0.13], [0.035, 0.04, 0.06], daylight);

    const skyColor = color([0.34, 0.56, 0.78], [0.012, 0.022, 0.065], daylight);
    const horizon = color([0.68, 0.72, 0.73], [0.055, 0.07, 0.11], daylight);
    sky.material.emissiveColor = skyColor;
    scene.clearColor.set(skyColor.r * 0.55, skyColor.g * 0.65, skyColor.b * 0.78, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0025 + night * 0.0017;
    scene.fogColor = horizon;

    const streetlightIntensity = smoothstep(0.28, 0.72, night) * 1.45;
    for (const light of streetlights) light.intensity = streetlightIntensity;
    for (const light of interiorLights) {
      light.intensity = 0.48 + night * 0.58;
    }

    return {
      minuteOfDay: clock.minuteOfDay,
      formattedTime: clock.format(),
      timeScale: clock.timeScale,
      daylight,
      night,
    };
  };

  let disposed = false;
  let current = apply();

  return {
    clock,
    sun,
    ambient,
    shadowGenerator: shadows,
    streetlights,
    interiorLights,
    update(realSeconds) {
      clock.update(realSeconds);
      current = apply();
      return current;
    },
    snapshot() {
      return current;
    },
    setTimeMinutes(minutes) {
      clock.setMinuteOfDay(minutes);
      current = apply();
      return current;
    },
    setTimeScale(scale) {
      clock.setTimeScale(scale);
      current = apply();
      return current;
    },
    setPreset(preset) {
      clock.setPreset(preset);
      current = apply();
      return current;
    },
    addShadowCaster(mesh) {
      shadows?.addShadowCaster(mesh);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      shadows?.dispose();
      for (const light of streetlights) light.dispose();
      for (const light of interiorLights) light.dispose();
      sun.dispose();
      ambient.dispose();
      sky.mesh.dispose();
      sky.material.dispose();
    },
  };
}
