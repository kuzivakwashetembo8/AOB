import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  Material,
  MeshBuilder,
  PointLight,
  RawTexture,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  Vector3,
} from "@babylonjs/core";
import type { AbstractMesh, Mesh } from "@babylonjs/core";
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
  readonly twilight: number;
  readonly night: number;
  readonly starVisibility: number;
  readonly streetlightIntensity: number;
  readonly horizonGlow: number;
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
  readonly nightFill: HemisphericLight;
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
  const sunrise = smoothstep(5.35, 7.25, hour);
  const sunset = 1 - smoothstep(17.0, 19.35, hour);
  return clamp01(sunrise * sunset);
}

function twilightForDaylight(daylight: number): number {
  return clamp01(1 - Math.abs(daylight - 0.5) * 2);
}

function createStarTexture(scene: Scene): RawTexture {
  const width = 1024;
  const height = 512;
  const pixels = new Uint8Array(width * height * 4);
  let seed = 0x47544431;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const write = (x: number, y: number, value: number, alpha: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = (y * width + x) * 4;
    pixels[index] = value;
    pixels[index + 1] = Math.min(255, value + 4);
    pixels[index + 2] = Math.min(255, value + 14);
    pixels[index + 3] = Math.max(pixels[index + 3]!, alpha);
  };

  for (let index = 0; index < 1350; index += 1) {
    const x = Math.floor(random() * width);
    // Reduce density toward the horizon so the field reads as distant sky,
    // not particles hanging immediately above the district.
    const y = Math.floor(random() * height * 0.82);
    const sample = random();
    const bright = sample > 0.985;
    const medium = sample > 0.88;
    const value = Math.round(
      bright ? 225 + random() * 28 : medium ? 155 + random() * 55 : 100 + random() * 55,
    );
    const alpha = Math.round(
      bright ? 205 + random() * 35 : medium ? 135 + random() * 65 : 82 + random() * 60,
    );
    // Intentionally one texel only. Four-point flares made the sky feel
    // miniature and close; real distant stars should read primarily as dots.
    write(x, y, value, alpha);
  }

  const texture = RawTexture.CreateRGBATexture(
    pixels,
    width,
    height,
    scene,
    true,
    false,
    Texture.NEAREST_SAMPLINGMODE,
  );
  texture.name = "meridian-procedural-star-field";
  texture.hasAlpha = true;
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.CLAMP_ADDRESSMODE;
  return texture;
}

function createSky(scene: Scene): {
  mesh: Mesh;
  material: StandardMaterial;
  starMesh: Mesh;
  starMaterial: StandardMaterial;
  starTexture: RawTexture;
} {
  const material = new StandardMaterial("meridian-sky-material", scene);
  material.backFaceCulling = false;
  material.disableLighting = true;
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();

  const mesh = MeshBuilder.CreateSphere(
    "meridian-sky-dome",
    { diameter: 280, segments: 20 },
    scene,
  );
  mesh.infiniteDistance = true;
  mesh.isPickable = false;
  mesh.material = material;

  const starTexture = createStarTexture(scene);
  const starMaterial = new StandardMaterial("meridian-star-material", scene);
  starMaterial.backFaceCulling = false;
  starMaterial.disableLighting = true;
  starMaterial.diffuseColor = Color3.White();
  starMaterial.emissiveColor = Color3.White();
  starMaterial.specularColor = Color3.Black();
  starMaterial.diffuseTexture = starTexture;
  starMaterial.emissiveTexture = starTexture;
  starMaterial.opacityTexture = starTexture;
  starMaterial.useAlphaFromDiffuseTexture = true;
  starMaterial.transparencyMode = Material.MATERIAL_ALPHABLEND;

  const starMesh = MeshBuilder.CreateSphere(
    "meridian-star-dome",
    { diameter: 279, segments: 20 },
    scene,
  );
  starMesh.infiniteDistance = true;
  starMesh.isPickable = false;
  starMesh.material = starMaterial;
  starMesh.visibility = 0;

  return { mesh, material, starMesh, starMaterial, starTexture };
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
  const nightFill = new HemisphericLight(
    "meridian-night-readability-fill",
    new Vector3(-0.22, 0.72, 0.28),
    scene,
  );
  nightFill.diffuse = new Color3(0.18, 0.23, 0.34);
  nightFill.groundColor = new Color3(0.055, 0.06, 0.08);
  nightFill.intensity = 0;

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
        new Vector3(
          item.position.x,
          item.position.y + 5.05 * item.scale,
          item.position.z,
        ),
        scene,
      );
      light.diffuse = new Color3(1, 0.8, 0.52);
      light.specular = new Color3(0.68, 0.48, 0.28);
      light.range = 17.5 * item.scale;
      light.intensity = 0;
      return light;
    });

  const streetlightGlowMaterial = scene.getMaterialByName(
    "generated-streetlight-glow",
  );
  const streetlightGlow =
    streetlightGlowMaterial instanceof StandardMaterial
      ? streetlightGlowMaterial
      : null;

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
    light.range = 8.2;
    light.intensity = 0.55;
  }

  const apply = (): MeridianEnvironmentSnapshot => {
    const minutes = clock.minuteOfDay;
    const hour = minutes / 60;
    const daylight = daylightForMinutes(minutes);
    const twilight = twilightForDaylight(daylight);
    const night = 1 - daylight;
    const starVisibility = smoothstep(0.58, 0.92, night);
    const horizonGlow = clamp01(0.16 + twilight * 0.72 + night * 0.2);

    const solarPhase = clamp01((hour - 5.5) / 13.5);
    const elevation = Math.max(0.04, Math.sin(solarPhase * Math.PI));
    const azimuth = -Math.PI * 0.18 + solarPhase * Math.PI * 1.08;
    const horizontal = Math.max(
      0.15,
      Math.cos(Math.asin(Math.min(0.99, elevation))),
    );
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
    sun.intensity = 0.04 + daylight * 1.04;

    const dusk = hour >= 12 ? twilight : 0;
    const dawn = hour < 12 ? twilight : 0;
    sun.diffuse = new Color3(
      0.52 + daylight * 0.48 + (dawn + dusk) * 0.08,
      0.45 + daylight * 0.39 + dawn * 0.06,
      0.48 + daylight * 0.3 - dusk * 0.13,
    );

    // City night is dark, not unlit. Preserve enough cool ambient fill for
    // silhouettes/materials while local lights provide the warm contrast.
    ambient.intensity = 0.34 + daylight * 0.52 + twilight * 0.09;
    ambient.diffuse = color(
      [0.66, 0.75, 0.86],
      [0.23, 0.29, 0.42],
      daylight,
    );
    ambient.groundColor = color(
      [0.17, 0.15, 0.13],
      [0.09, 0.085, 0.1],
      daylight,
    );

    // Deliberate game-lighting cheat: this has no visible emitter. It creates
    // the city-night luminance floor so roads, facades and Voight remain
    // readable between practical light sources.
    nightFill.intensity = night * 0.34 + twilight * 0.08;
    nightFill.diffuse = new Color3(
      0.16 + twilight * 0.04,
      0.21 + twilight * 0.035,
      0.34 + twilight * 0.025,
    );

    const skyColor = color(
      [0.34, 0.56, 0.78],
      [0.03, 0.065, 0.15],
      daylight,
    );
    if (twilight > 0) {
      skyColor.r += dusk * 0.07 + dawn * 0.035;
      skyColor.g += dusk * 0.025 + dawn * 0.045;
      skyColor.b += dawn * 0.04;
    }

    const horizon = color(
      [0.68, 0.72, 0.73],
      [0.14, 0.115, 0.12],
      daylight,
    );
    horizon.r += twilight * 0.2;
    horizon.g += twilight * 0.09;
    horizon.b += dawn * 0.05;

    sky.material.emissiveColor = skyColor;
    sky.starMesh.visibility = starVisibility;
    sky.starMaterial.alpha = 0.18 + starVisibility * 0.62;
    scene.clearColor.set(
      Math.max(0.022, skyColor.r * 0.72),
      Math.max(0.04, skyColor.g * 0.76),
      Math.max(0.09, skyColor.b * 0.84),
      1,
    );
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0021 + night * 0.0012;
    scene.fogColor = horizon;

    const streetlightIntensity =
      smoothstep(0.16, 0.68, night) * (2.35 + twilight * 0.38);
    for (const light of streetlights) {
      light.intensity = streetlightIntensity;
    }
    if (streetlightGlow) {
      const glowStrength = clamp01(streetlightIntensity / 2.35);
      streetlightGlow.emissiveColor = new Color3(
        0.17 + glowStrength * 1.05,
        0.1 + glowStrength * 0.62,
        0.035 + glowStrength * 0.18,
      );
    }

    for (const light of interiorLights) {
      light.intensity = 0.5 + night * 0.82;
    }

    return {
      minuteOfDay: clock.minuteOfDay,
      formattedTime: clock.format(),
      timeScale: clock.timeScale,
      daylight,
      twilight,
      night,
      starVisibility,
      streetlightIntensity,
      horizonGlow,
    };
  };

  let disposed = false;
  let current = apply();

  return {
    clock,
    sun,
    ambient,
    nightFill,
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
      nightFill.dispose();
      sky.starMesh.dispose();
      sky.mesh.dispose();
      sky.starMaterial.diffuseTexture = null;
      sky.starMaterial.emissiveTexture = null;
      sky.starMaterial.opacityTexture = null;
      sky.starTexture.dispose();
      sky.starMaterial.dispose();
      sky.material.dispose();
    },
  };
}
