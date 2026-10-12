import {
  AnimationGroup,
  Material,
  Mesh,
  Scene,
  SceneLoader,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { VoightPrototype } from "./voight";
import {
  GaitContinuityController,
  type GaitInputs,
  type GaitDecision,
} from "./locomotion/gait-continuity";

/**
 * GTD-CHAR-001 isolated model-source trial. The Quaternius UAL demonstration
 * mannequin is NOT the approved Voight and cannot be promoted as final art.
 * Pinned fork content avoids live upstream source drift during A/B sampling.
 */
export const MERIDIA_TRIAL_SOURCE = {
  author: "Quaternius (Universal Animation Library)",
  referenceRepo: "interlinkglobal/three-player-controller",
  referenceCommit: "ca82bbc76a3b9b0afa80c73b60167adf6123b9b6",
  sourceBlobSha: "e236f349526637a5c829c408d48ce9d8fcde9cff",
  sourceBytes: 3749364,
  rootUrl: "https://cdn.jsdelivr.net/gh/interlinkglobal/three-player-controller@ca82bbc76a3b9b0afa80c73b60167adf6123b9b6/example/public/glb/",
  fileName: "ual.glb",
} as const;

export interface CharacterTrialReport {
  readonly source: typeof MERIDIA_TRIAL_SOURCE;
  readonly triangles: number;
  readonly meshCount: number;
  readonly skeletonCount: number;
  readonly boneCount: number;
  readonly animationGroups: string[];
  readonly heightBeforeNormalization: number;
  readonly normalizationScale: number;
  readonly modelLoadMs: number;
  readonly activeAnimation: string;
  readonly notes: string[];
  readonly visualForwardDeg: number;
  readonly gaitState: string;
  readonly gaitTransitionCount: number;
}

/**
 * The UAL GLB introduces PBR materials into a city with many streetlights.
 * On WebGL2, a 16-light PBR variant can exceed the device's 12 vertex
 * uniform-buffer binding limit and prevent ALL first-frame witnesses.
 *
 * Restrict only PBR material shader variants in this opt-in experiment.
 * Preserve the city lights, shadows, StandardMaterials and imported geometry.
 * Called after each import and before pre/post-vehicle world-render attempts.
 */
export function capTrialPbrLightUniforms(scene: Scene, maxLights = 4): number {
  let changed = 0;
  for (const material of scene.materials) {
    if (!material.getClassName().startsWith("PBR")) continue;
    const shader = material as Material & { maxSimultaneousLights?: number };
    if (typeof shader.maxSimultaneousLights !== "number" ||
        shader.maxSimultaneousLights <= maxLights) continue;
    shader.maxSimultaneousLights = maxLights;
    material.markAsDirty(Material.LightDirtyFlag);
    changed += 1;
  }
  return changed;
}

// Shared with game UI: the live/default character must never disagree
// with the tuning and diagnostic menus on production.
export { isMeridiaCharacterTrialRequested } from "./character-mode";

function preferredClip(groups: AnimationGroup[], choices: readonly string[]): AnimationGroup | null {
  for (const choice of choices) {
    const exact = groups.find((group) => group.name.toLowerCase() === choice.toLowerCase());
    if (exact) return exact;
  }
  for (const choice of choices) {
    const fuzzy = groups.find((group) => group.name.toLowerCase().includes(choice.toLowerCase()));
    if (fuzzy) return fuzzy;
  }
  return null;
}

export type LoadedMeridiaCharacter = VoightPrototype & {
  readonly witness: Mesh;
  readonly report: () => CharacterTrialReport;
  updateAnimation: (inputs: GaitInputs) => GaitDecision;
  setVisualForward: (degrees: number) => void;
};

export async function loadMeridiaCharacterTrial(scene: Scene): Promise<LoadedMeridiaCharacter> {
  const startedAt = performance.now();
  const imported = await SceneLoader.ImportMeshAsync(
    "", MERIDIA_TRIAL_SOURCE.rootUrl, MERIDIA_TRIAL_SOURCE.fileName, scene,
  );
  // Cap excessive PBR shader light variants before the first scene draw.
  capTrialPbrLightUniforms(scene);
  const meshes = imported.meshes.filter((mesh): mesh is Mesh =>
    mesh instanceof Mesh && mesh.getTotalVertices() > 0,
  );
  if (!meshes.length || !imported.skeletons.length || !imported.animationGroups.length) {
    throw new Error("UAL trial failed: expected actual skinned humanoid and animations");
  }
  const skinned = meshes.filter(mesh => mesh.skeleton !== null);
  const witness = skinned.find(mesh => mesh.isVisible && mesh.visibility > 0) ??
    meshes.find(mesh => mesh.isVisible && mesh.visibility > 0);
  if (!witness) throw new Error("UAL trial failed: no visible character mesh");

  for (const mesh of meshes) mesh.computeWorldMatrix(true);
  const boundsMin = new Vector3(Infinity, Infinity, Infinity);
  const boundsMax = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const mesh of meshes) {
    const box = mesh.getBoundingInfo().boundingBox;
    boundsMin.minimizeInPlace(box.minimumWorld);
    boundsMax.maximizeInPlace(box.maximumWorld);
  }
  const sourceHeight = boundsMax.y - boundsMin.y;
  if (!Number.isFinite(sourceHeight) || sourceHeight < 0.01) {
    throw new Error("UAL trial failed: invalid humanoid dimensions");
  }

  const root = new TransformNode("gtd-char001-trial-actor-root", scene);
  const visualRoot = new TransformNode("gtd-char001-trial-visual-normalization", scene);
  visualRoot.parent = root;
  // Imported glTF root nodes have no parent; preserve their joint hierarchy.
  for (const item of [...imported.transformNodes, ...imported.meshes]) {
    if (!item.parent) item.parent = visualRoot;
  }
  const normalScale = 1.78 / sourceHeight;
  visualRoot.scaling.setAll(normalScale);
  visualRoot.position.set(
    -(boundsMin.x + boundsMax.x) * 0.5 * normalScale,
    -0.9 - boundsMin.y * normalScale,
    -(boundsMin.z + boundsMax.z) * 0.5 * normalScale,
  );
  // Authoring-forward axis is calibrated separately from physics/root heading.
  // For Meridian, the reference demo's extra +90° visual correction
  // pointed the model sideways to physics/root travel on all four arrows.
  // The calibration control stays available for live verification.
  let visualForwardDeg = 0;
  visualRoot.rotation.y = visualForwardDeg * Math.PI / 180;

  const clips = {
    idle: preferredClip(imported.animationGroups, ["Idle_Loop", "idle"]),
    walk: preferredClip(imported.animationGroups, ["Walk_Loop", "walk"]),
    sprint: preferredClip(imported.animationGroups, ["Sprint_Loop", "run", "sprint"]),
    jump: preferredClip(imported.animationGroups, ["Jump_Loop", "Jump_Start", "jump", "fall"]),
    land: preferredClip(imported.animationGroups, ["Jump_Land", "land"]),
  };
  if (!clips.idle || !clips.walk) {
    throw new Error("UAL trial failed: no compatible idle/walking animation clips");
  }
  imported.animationGroups.forEach(group => group.stop());
  let active: AnimationGroup | null = null;
  let outgoing: AnimationGroup | null = null;
  let blend = 1;
  let activeName = "idle";
  const gaitController = new GaitContinuityController();
  let lastGait: GaitDecision | null = null;

  function switchTo(group: AnimationGroup, name: string) {
    if (group === active) return;
    outgoing?.stop();
    outgoing = active;
    active = group;
    activeName = name;
    blend = 0;
    active.start(true);
    active.setWeightForAllAnimatables(0);
  }
  switchTo(clips.idle, "idle");

  const reportInfo = {
    source: MERIDIA_TRIAL_SOURCE,
    triangles: meshes.reduce((sum, mesh) => sum + Math.floor(mesh.getTotalIndices() / 3), 0),
    meshCount: meshes.length,
    skeletonCount: imported.skeletons.length,
    boneCount: imported.skeletons.reduce((sum, skeleton) => sum + skeleton.bones.length, 0),
    animationGroups: imported.animationGroups.map(group => group.name),
    heightBeforeNormalization: sourceHeight,
    normalizationScale: normalScale,
    modelLoadMs: performance.now() - startedAt,
    notes: [
      "Temporary UAL demo model, NOT approved Voight identity or a source-model decision.",
      "Geometry and bone counts measured after import. Report is not GPU memory.",
      "This preview uses Babylon.js and existing Rapier physics; Three.js Foot IK is NOT directly installed.",
      "Animation state playback and blending are experimental; no foot IK solution is claimed.",
      "Canonical development character: this rig supersedes the retired capsule on main and previews.",
    ],
  };
  return {
    root,
    witness,
    report: (): CharacterTrialReport => ({
      ...reportInfo, activeAnimation: activeName, visualForwardDeg,
      gaitState: lastGait?.state ?? "idle",
      gaitTransitionCount: lastGait?.transitionCount ?? 0,
    }),
    setVisualForward(degrees) {
      // L0 axis calibration: only adjust the imported visual node, never
      // double-rotate the kinematic physics actor or skeleton.
      if (!Number.isFinite(degrees)) return;
      visualForwardDeg = Math.max(-180, Math.min(180, degrees));
      visualRoot.rotation.y = visualForwardDeg * Math.PI / 180;
    },
    updateAnimation(inputs) {
      // L2: Visual state follows corrected Rapier travel but rejects
      // transient one-tick support/speed loss during sustained movement.
      // This never alters physics translation or collision.
      const decision = gaitController.update(inputs);
      lastGait = decision;
      const group = clips[decision.state] ?? clips.idle;
      if (group) switchTo(group, decision.state);
      if (active) {
        blend = Math.min(1, blend + Math.max(0, inputs.dt) / 0.18);
        active.setWeightForAllAnimatables(blend);
      }
      if (outgoing) {
        outgoing.setWeightForAllAnimatables(1 - blend);
        if (blend >= 1) {
          outgoing.stop();
          outgoing = null;
        }
      }
      return decision;
    },
  };
}
