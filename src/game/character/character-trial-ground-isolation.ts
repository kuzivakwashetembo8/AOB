import { Material, StandardMaterial } from "@babylonjs/core";
import type { Mesh } from "@babylonjs/core";

/**
 * GTD-CHAR-001 only: isolate actual Meridian ground-level geometry from
 * shader light/shadow permutations after the imported skeletal PBR asset
 * increases scene material pressure. These are the ORIGINAL generated meshes.
 * Their diffuse textures, transforms, collisions and vertex data are retained.
 *
 * This is not a permanent lighting decision or a performance acceptance run.
 * Production and no-query baseline must not call this function.
 */
export function isolateCharacterTrialGroundShaders(
  ground: Mesh,
  roads: readonly Mesh[],
  sidewalks: readonly Mesh[],
) {
  const selected = [ground, ...roads, ...sidewalks];
  const materials = new Set<StandardMaterial>();
  for (const mesh of selected) {
    if (!(mesh.material instanceof StandardMaterial)) {
      throw new Error("GTD character trial expects genuine StandardMaterial ground and streets: " + mesh.name);
    }
    // Shadows in the accepted reference city are not needed for an isolated
    // 'can the human and actual pavement draw?' test; avoid shadow defines.
    mesh.receiveShadows = false;
    materials.add(mesh.material);
  }
  for (const material of materials) {
    material.disableLighting = true;
    material.maxSimultaneousLights = 1;
    material.markAsDirty(Material.LightDirtyFlag | Material.MiscDirtyFlag);
  }
  return {
    strategy: "original-textured-meshes-unlit-no-receive-shadows" as const,
    meshes: selected.length,
    materials: [...materials].map(material => material.name),
  };
}
