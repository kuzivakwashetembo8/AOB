import { Color3, ShaderMaterial, StandardMaterial } from "@babylonjs/core";
import type { Mesh, Scene, Texture } from "@babylonjs/core";

/**
 * Trial-only shader isolation on EXISTING Meridian terrain and streets.
 *
 * The previous StandardMaterial.disableLighting workaround retained Babylon's
 * large standard-material effect pipeline and never produced street witnesses
 * on the trial browser. An isolated, explicit worldViewProjection shader avoids
 * light/shadow/UBO variants entirely. Geometry, scene position, original UV
 * mapping, road texture assets and Rapier collision are unchanged.
 *
 * This is deliberately NOT GTD's permanent lighting architecture. The same
 * branch without ?gtdCharacterTrial=ual retains all original materials.
 */
export function isolateCharacterTrialGroundShaders(
  ground: Mesh,
  roads: readonly Mesh[],
  sidewalks: readonly Mesh[],
  scenery: readonly Mesh[] = [],
) {
  const selected = [...new Set([ground, ...roads, ...sidewalks, ...scenery])];
  const sourceMaterials = new Map<StandardMaterial, ShaderMaterial>();
  const scene: Scene = ground.getScene();
  const vertexSource = [
    "precision highp float;",
    "attribute vec3 position;",
    "attribute vec2 uv;",
    "uniform mat4 worldViewProjection;",
    "varying vec2 vTrialUV;",
    "void main(void) {",
    "  vTrialUV = uv;",
    "  gl_Position = worldViewProjection * vec4(position, 1.0);",
    "}",
  ].join("\n");

  for (const mesh of selected) {
    const source = mesh.material;
    if (!(source instanceof StandardMaterial)) {
      throw new Error("GTD trial: missing original StandardMaterial for " + mesh.name);
    }
    let replacement = sourceMaterials.get(source);
    if (!replacement) {
      const texture = source.diffuseTexture as Texture | null;
      const textured = texture !== null && texture !== undefined;
      const fragmentSource = [
        "precision highp float;",
        "varying vec2 vTrialUV;",
        "uniform vec3 trialTint;",
        "uniform float trialOpacity;",
        ...(textured ? ["uniform sampler2D trialDiffuse;"] : []),
        "void main(void) {",
        ...(textured
          ? ["  gl_FragColor = vec4(trialTint, trialOpacity) * texture2D(trialDiffuse, vTrialUV);"]
          : ["  gl_FragColor = vec4(trialTint, trialOpacity);"]),
        "}",
      ].join("\n");
      replacement = new ShaderMaterial(
        "gtd-char001-direct-ground:" + source.name,
        scene,
        { vertexSource, fragmentSource },
        {
          attributes: ["position", "uv"],
          uniforms: ["worldViewProjection", "trialTint", "trialOpacity"],
          needAlphaBlending: source.alpha < 1 || source.useAlphaFromDiffuseTexture,
          ...(textured ? { samplers: ["trialDiffuse"] } : {}),
        },
      );
      replacement.backFaceCulling = source.backFaceCulling;
      replacement.setColor3("trialTint", source.diffuseColor ?? Color3.White());
      replacement.setFloat("trialOpacity", source.alpha);
      if (textured && texture) replacement.setTexture("trialDiffuse", texture);
      sourceMaterials.set(source, replacement);
    }
    // Draw the identical road, pavement and terrain meshes with minimal shader
    // permutations while leaving lighting elsewhere in Meridian untouched.
    mesh.receiveShadows = false;
    mesh.material = replacement;
  }

  return {
    strategy: "original-meshes-direct-uv-shader-no-light-ubos" as const,
    meshes: selected.length,
    materials: [...sourceMaterials.values()].map(material => material.name),
    sceneryMeshes: scenery.length,
    sourceMaterials: [...sourceMaterials.keys()].map(material => material.name),
  };
}
