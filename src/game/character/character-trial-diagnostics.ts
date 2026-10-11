import type { Engine, Mesh, Scene } from "@babylonjs/core";

export type TrialSceneReport = ReturnType<typeof collectCharacterTrialSceneReport>;

function entry(mesh: Mesh) {
  return {
    name: mesh.name,
    material: mesh.material?.name ?? null,
    enabled: mesh.isEnabled(),
    visible: mesh.isVisible,
    visibility: mesh.visibility,
    vertices: mesh.getTotalVertices(),
    indices: mesh.getTotalIndices(),
    position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
  };
}

/**
 * Capture a real device's current scene even on a failed 7/8 startup.
 * Browser graphics memory and actual GPU shader time are NOT measurable here.
 * This function neither repairs/creates world meshes nor alters render state.
 */
export function collectCharacterTrialSceneReport(scene: Scene, engine: Engine) {
  const rawCanvas = engine.getRenderingCanvas();
  const gl = rawCanvas?.getContext("webgl2") as WebGL2RenderingContext | null | undefined;
  const meshNames = scene.meshes.filter(mesh =>
    mesh.name.startsWith("generated-") || mesh.name.includes("trial") ||
    mesh.name.includes("voight"),
  );
  const materialGroups = new Map<string, number>();
  for (const material of scene.materials) {
    const key = material.getClassName();
    materialGroups.set(key, (materialGroups.get(key) ?? 0) + 1);
  }
  const streetMaterials = scene.meshes.filter((mesh): mesh is Mesh =>
    mesh.getClassName() === "Mesh" &&
    (mesh.material?.name === "generated-asphalt" ||
     mesh.material?.name === "generated-sidewalk"));
  const camera = scene.activeCamera;
  return {
    schema: "gtd.char001.scene.v1" as const,
    collectedAt: new Date().toISOString(),
    graphics: {
      renderer: "Babylon.js WebGL",
      devicePixelRatio: typeof window === "undefined" ? null : window.devicePixelRatio,
      viewport: {
        width: typeof window === "undefined" ? null : window.innerWidth,
        height: typeof window === "undefined" ? null : window.innerHeight,
      },
      framebuffer: { width: rawCanvas?.width ?? null, height: rawCanvas?.height ?? null },
      hardwareScalingLevel: engine.getHardwareScalingLevel(),
      maxVertexUniformBlocks: gl ? gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS) as number : null,
      maxFragmentUniformBlocks: gl ? gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS) as number : null,
    },
    scene: {
      meshCount: scene.meshes.length,
      materialCount: scene.materials.length,
      lightsCount: scene.lights.length,
      ready: scene.isReady(),
      materialTypes: Object.fromEntries(materialGroups),
      camera: camera
        ? {
            name: camera.name,
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            mode: camera.mode,
          }
        : null,
    },
    witnessCandidates: {
      terrain: scene.getMeshByName("generated-first-light-ground")
        ? entry(scene.getMeshByName("generated-first-light-ground") as Mesh)
        : null,
      byMaterial: streetMaterials.slice(0, 40).map(entry),
      byMaterialCount: {
        asphalt: streetMaterials.filter(x => x.material?.name === "generated-asphalt").length,
        sidewalk: streetMaterials.filter(x => x.material?.name === "generated-sidewalk").length,
      },
      generatedSamples: meshNames.slice(0, 75).map(mesh => ({
        name: mesh.name,
        material: mesh.material?.name ?? null,
        enabled: mesh.isEnabled(),
        visible: mesh.isVisible,
      })),
    },
    renderProbe: {
      activeMeshes: scene.getActiveMeshes().length,
      // Active-mesh and frustum checks reveal whether meshes were skipped
      // before shader submission, rather than silently reporting no draws.
      witnesses: [scene.getMeshByName("generated-first-light-ground"), ...streetMaterials.slice(0, 12)]
        .filter((mesh): mesh is Mesh => mesh !== null && mesh.getClassName() === "Mesh")
        .map(mesh => ({
          name: mesh.name,
          material: mesh.material?.name ?? null,
          materialType: mesh.material?.getClassName() ?? null,
          materialDisableLighting: mesh.material?.getClassName() === "StandardMaterial"
            ? (mesh.material as import("@babylonjs/core").StandardMaterial).disableLighting
            : null,
          receiveShadows: mesh.receiveShadows,
          active: scene.getActiveMeshes().data.includes(mesh),
          inCameraFrustum: camera ? camera.isInFrustum(mesh.getBoundingInfo()) : null,
        })),
    },
    limitations: [
      "Scene snapshots do not prove pixels reached the display.",
      "Vertex uniform block limits are browser/WebGL reported; no GPU memory is measured.",
      "Mesh and material counts include all of Meridian, not just the character.",
    ],
  };
}

export type CharacterTrialRuntimeEvidence = {
  readonly schema: "gtd.char001.runtime.v1";
  readonly scene: TrialSceneReport;
  readonly character: unknown;
  readonly vehicles: unknown;
  readonly warmup: unknown;
  readonly surfaceIsolation?: unknown;
};

declare global {
  interface Window {
    __GTD_CHAR_DIAGNOSTICS__?: () => CharacterTrialRuntimeEvidence;
  }
}
