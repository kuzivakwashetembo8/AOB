import type { Scene } from "@babylonjs/core";
import type { Vector3 } from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";
import { createFirstLightWorld } from "./first-light-world";
import {
  createGeneratedFirstLightWorld,
  type GeneratedFirstLightWorld,
} from "./generated-first-light-world";

export type FirstLightWorldSource =
  | "authored-first-light"
  | "generated-first-light";

export const ACTIVE_FIRST_LIGHT_WORLD_SOURCE: FirstLightWorldSource =
  "generated-first-light";

export interface RuntimeFirstLightWorld {
  readonly spawn: Vector3;
  readonly focus: Vector3;
  readonly location: string;
  readonly objective: string;
  dispose(): void;
}

export function createFirstLightRuntimeWorld(
  scene: Scene,
  physics: MeridianPhysics,
  source: FirstLightWorldSource = ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
): RuntimeFirstLightWorld {
  if (source === "generated-first-light") {
    return createGeneratedFirstLightWorld(scene, physics, {
      enableCameraBlockers: true,
      enableShadows: true,
    });
  }

  const authored = createFirstLightWorld(scene, physics);
  return {
    spawn: authored.spawn,
    focus: authored.focus,
    location: "South Ward // First Light",
    objective: "Walk the South Ward garage corner",
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
