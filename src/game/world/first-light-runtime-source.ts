import type { Scene } from "@babylonjs/core";
import type { Vector3 } from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";
import type { InteriorVisibilityState } from "../core/types";
import { createFirstLightWorld } from "./first-light-world";
import {
  createGeneratedFirstLightWorld,
  type GeneratedFirstLightWorld,
} from "./generated-first-light-world";
import type { MeridianEnvironmentSnapshot } from "./environment-controller";

export type FirstLightWorldSource =
  | "authored-first-light"
  | "generated-first-light";

export const ACTIVE_FIRST_LIGHT_WORLD_SOURCE: FirstLightWorldSource =
  "generated-first-light";

const AUTHORED_ENVIRONMENT: MeridianEnvironmentSnapshot = {
  minuteOfDay: 14 * 60 + 30,
  formattedTime: "14:30",
  timeScale: 0,
  daylight: 1,
  twilight: 0,
  night: 0,
  starVisibility: 0,
  streetlightIntensity: 0,
  horizonGlow: 0.16,
};

export interface RuntimeFirstLightWorld {
  readonly spawn: Vector3;
  readonly focus: Vector3;
  readonly location: string;
  readonly objective: string;
  readonly interiorState: InteriorVisibilityState;
  readonly environmentSnapshot: MeridianEnvironmentSnapshot;
  update(
    realSeconds: number,
    playerPosition: { x: number; y: number; z: number },
  ): void;
  setTimeMinutes(minutes: number): MeridianEnvironmentSnapshot;
  setTimeScale(scale: number): MeridianEnvironmentSnapshot;
  dispose(): void;
}

export function createFirstLightRuntimeWorld(
  scene: Scene,
  physics: MeridianPhysics,
  source: FirstLightWorldSource = ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
  options: {
    readonly enableLandUsePreview?: boolean;
    readonly enableGrassImageTrial?: boolean;
    readonly foliageImageTrial?: import("../world-generation/greenery-image-assets").FoliageImageTrial;
    readonly enableSidewalkSupportCollision?: boolean;
    readonly enableBrickMaterialTrial?: boolean;
    readonly enableBrickBusinessFieldTrial?: boolean;
    readonly brickBusinessFocusSurface?: import("../world-generation/brick-surface-catalog").BrickSurfaceId | null;
    readonly enableWoodSurfaceFieldTrial?: boolean;
    readonly woodSurfaceFocusId?: import("../world-generation/wood-surface-catalog").WoodSurfaceId | null;
    readonly enableGlassSurfaceFieldTrial?: boolean;
    readonly glassSurfaceFocusId?: import("../world-generation/glass-surface-catalog").GlassSurfaceId | null;
  } = {},
): RuntimeFirstLightWorld {
  if (source === "generated-first-light") {
    return createGeneratedFirstLightWorld(scene, physics, {
      enableCameraBlockers: true,
      enableShadows: true,
      enableLandUsePreview: options.enableLandUsePreview ?? false,
      enableGrassImageTrial: options.enableGrassImageTrial ?? false,
      foliageImageTrial: options.foliageImageTrial ?? "off",
      enableSidewalkSupportCollision: options.enableSidewalkSupportCollision ?? false,
      enableBrickMaterialTrial: options.enableBrickMaterialTrial ?? false,
      enableBrickBusinessFieldTrial: options.enableBrickBusinessFieldTrial ?? false,
      brickBusinessFocusSurface: options.brickBusinessFocusSurface ?? null,
      enableWoodSurfaceFieldTrial: options.enableWoodSurfaceFieldTrial ?? false,
      woodSurfaceFocusId: options.woodSurfaceFocusId ?? null,
      enableGlassSurfaceFieldTrial: options.enableGlassSurfaceFieldTrial ?? false,
      glassSurfaceFocusId: options.glassSurfaceFocusId ?? null,
    });
  }

  const authored = createFirstLightWorld(scene, physics);
  let environmentSnapshot = AUTHORED_ENVIRONMENT;
  return {
    spawn: authored.spawn,
    focus: authored.focus,
    location: "South Ward // First Light",
    objective: "Walk the South Ward garage corner",
    interiorState: "outside",
    get environmentSnapshot() {
      return environmentSnapshot;
    },
    update() {},
    setTimeMinutes(minutes) {
      const normalized = ((minutes % 1440) + 1440) % 1440;
      const hour = Math.floor(normalized / 60);
      const minute = Math.floor(normalized % 60);
      environmentSnapshot = {
        ...environmentSnapshot,
        minuteOfDay: normalized,
        formattedTime:
          String(hour).padStart(2, "0") +
          ":" +
          String(minute).padStart(2, "0"),
      };
      return environmentSnapshot;
    },
    setTimeScale(scale) {
      environmentSnapshot = {
        ...environmentSnapshot,
        timeScale: Math.max(0, scale),
      };
      return environmentSnapshot;
    },
    dispose() {
      // Authored First Light remains scene-owned during the rollback window.
      // Scene and physics disposal release its resources.
    },
  };
}

export function isGeneratedFirstLightWorld(
  world: RuntimeFirstLightWorld,
): world is GeneratedFirstLightWorld {
  return "buildings" in world;
}
