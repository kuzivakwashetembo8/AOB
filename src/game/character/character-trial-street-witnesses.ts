import type { Mesh } from "@babylonjs/core";
import { isGeneratedFirstLightWorld, type RuntimeFirstLightWorld } from "../world/first-light-runtime-source";

/**
 * In the First Light reference district roads have generated-parity-* names,
 * whereas procedural districts use asphalt/sidewalk segment identifiers.
 * Both pipelines share the material identities below. Inspect the actual
 * generated urban-surface collection, not guessed names in scene.meshes.
 */
export function resolveCharacterTrialStreetWitnesses(world: RuntimeFirstLightWorld): {
  readonly roads: readonly Mesh[];
  readonly sidewalks: readonly Mesh[];
  readonly sample: readonly { name: string; material: string | null }[];
} {
  const surfaces = isGeneratedFirstLightWorld(world) ? world.urbanSurfaces.meshes : [];
  return classifyCharacterTrialStreetMeshes(surfaces);
}

export function classifyCharacterTrialStreetMeshes(surfaces: readonly Mesh[]) {
  const roads = surfaces.filter(mesh => mesh.material?.name === "generated-asphalt");
  const sidewalks = surfaces.filter(mesh => mesh.material?.name === "generated-sidewalk");
  return {
    roads,
    sidewalks,
    sample: surfaces.slice(0, 30).map(mesh => ({
      name: mesh.name,
      material: mesh.material?.name ?? null,
    })),
  };
}
