import { Color3, Matrix, MeshBuilder, StandardMaterial, TransformNode } from "@babylonjs/core";
import type { Material, Mesh, Scene } from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";
import type { ResolvedBuildingSpec } from "./schema";
import { planBuildingInteraction } from "./interaction-plan";
import type {
  BuildingInteractionPlan, BuildingSpatialMetadata, InteractionAnchor, InteriorCell, InteriorPortal,
} from "./interaction-plan";
import { registerBuildingCollision } from "./rapier-adapter";
import type { BuildingCollisionHandle } from "./rapier-adapter";
import { planBuilding } from "./architecture-plan";
import type { BoxPrimitive, GeneratedBuildingPlan, PrimitiveRole } from "./architecture-plan";
import { planFacadeDetails } from "./facade-details";
import type { FacadeDetailPlan } from "./facade-details";
import { BuildingMaterialLibrary } from "./material-library";
import { materialRecipe } from "./representation-materials";
import { REPRESENTATION_POLICIES, selectRepresentationTier } from "./representation-lod";
import {
  BRICK_SCALE_PRESETS, applyPhysicalBrickUV, brickTrialPresetForBuilding,
  createExperimentalBrickMaterial,
} from "./experimental-brick-material";
import type { ExperimentalBrickMaterial } from "./experimental-brick-material";
import { businessBrickForBuilding, businessBrickPhysicalTile } from "./brick-business-field-trial";
import type { BrickSurfaceId } from "./brick-surface-catalog";
import { woodSurfaceForBuilding } from "./wood-south-ward-field-trial";
import { WOOD_SURFACES, woodTileMetres, type WoodSurfaceId } from "./wood-surface-catalog";
import { createImageWallMaterial, type ImageWallMaterial } from "./image-wall-material";
import { isGlassTower, glassSurfaceForBuilding } from "./glass-south-ward-field-trial";
import { GLASS_SURFACES, GLASS_TILE_METRES, type GlassSurfaceId } from "./glass-surface-catalog";
import type { BatchingMode, RepresentationTier } from "./representation-lod";

/** Step 4 adds optional physics and camera semantics without changing the live First Light scene. */
export interface BuildingGenerationContext {
  readonly generatorVersion: number;
  /** Caller-owned materials override catalog recipes and are never disposed here. */
  readonly materials?: Partial<Record<PrimitiveRole, Material>>;
  /** Scene-scoped, caller-owned library enables sharing across many buildings. */
  readonly materialLibrary?: BuildingMaterialLibrary;
  readonly enableFacadeDetails?: boolean;
  readonly batchingMode?: BatchingMode;
  /** SEC-scoped, opt-in material research: apartment A and garage B only. */
  readonly enableBrickMaterialTrial?: boolean;
  /** MAT-005: unaccepted commercial brick imagery, isolated to preview scope. */
  readonly enableBrickBusinessFieldTrial?: boolean;
  /** Optional exact-ID compare on the corner business only. */
  readonly brickBusinessFocusSurface?: BrickSurfaceId | null;
  /** MAT-006 wood-family preview, restricted to previously procedural buildings. */
  readonly enableWoodSurfaceFieldTrial?: boolean;
  readonly woodSurfaceFocusId?: WoodSurfaceId | null;
  readonly enableGlassSurfaceFieldTrial?: boolean;
  readonly glassSurfaceFocusId?: GlassSurfaceId | null;
  /** Metres from camera/player to building origin; default 0 preserves Step 2 output. */
  readonly initialDistance?: number;
  /** Defaults to enabled only when a physics world is provided. */
  readonly enableCameraBlockers?: boolean;
}
export interface GeneratedBuilding {
  readonly buildingId: string;
  readonly root: TransformNode;
  readonly meshes: readonly Mesh[];
  readonly plan: GeneratedBuildingPlan;
  readonly detailPlan: FacadeDetailPlan;
  readonly batchingMode: BatchingMode;
  readonly representationTier: RepresentationTier;
  readonly physicsIntegrated: boolean;
  readonly colliderCount: number;
  readonly interaction: BuildingInteractionPlan;
  readonly cameraBlockers: readonly Mesh[];
  readonly entrances: readonly InteractionAnchor[];
  readonly portals: readonly InteriorPortal[];
  readonly interior: InteriorCell | null;
  readonly spatial: BuildingSpatialMetadata;
  setRepresentationTier(tier: RepresentationTier): void;
  setRepresentationDistance(distance: number): void;
  dispose(): void;
}
type RenderClass = "base" | "detail" | "fixture" | "proxy";
interface RenderGroup { readonly mesh: Mesh; readonly kind: RenderClass; }
const renderClass = (part: BoxPrimitive): RenderClass =>
  part.id.startsWith("detail:") ? "detail" : part.id.includes(":fixture:") ? "fixture" : "base";

/** A separate scene/preview can instantiate generated buildings without touching First Light. */
export function generateBuilding(
  scene: Scene, physics: MeridianPhysics | null, spec: ResolvedBuildingSpec, context: BuildingGenerationContext,
): GeneratedBuilding {
  const plan = planBuilding(spec, context.generatorVersion);
  const interaction = planBuildingInteraction(spec, plan);
  // Curtain towers cannot inherit downpipes, punched-window trim or pseudo
  // masonry cornices. This comparison deliberately has no baked or 3D mullions.
  const detailPlan = context.enableFacadeDetails && !isGlassTower(spec.id)
    ? planFacadeDetails(spec, plan) : { primitives: [], decals: [] };
  const batchingMode = context.batchingMode ?? "individual";
  const library = context.materialLibrary ?? new BuildingMaterialLibrary(scene);
  const ownsLibrary = !context.materialLibrary;
  const root = new TransformNode("generated-building:" + spec.id, scene);
  root.position.set(spec.position.x, spec.position.y, spec.position.z);
  root.rotation.y = spec.yawRadians;
  const meshes: Mesh[] = [];
  const cameraBlockers: Mesh[] = [];
  let collisionHandle: BuildingCollisionHandle | null = null;
  const groups: RenderGroup[] = [];
  const leases = new Map<PrimitiveRole, string>();
  const roleMaterials = new Map<PrimitiveRole, Material>();
  let downpipeMaterial: StandardMaterial | null = null;
  let storefrontLedMaterial: StandardMaterial | null = null;
  const brickPresetId = brickTrialPresetForBuilding(
    spec.id, context.enableBrickMaterialTrial === true);
  const businessSurfaceId = businessBrickForBuilding(
    spec.id, context.enableBrickBusinessFieldTrial === true,
    context.brickBusinessFocusSurface ?? null);
  const brickTrialActive = brickPresetId !== null || businessSurfaceId !== null;
  const woodSurfaceId = woodSurfaceForBuilding(
    spec.id, context.enableWoodSurfaceFieldTrial === true,
    context.woodSurfaceFocusId ?? null);
  const glassSurfaceId = glassSurfaceForBuilding(
    spec.id, context.enableGlassSurfaceFieldTrial === true,
    context.glassSurfaceFocusId ?? null);
  const imageWallActive = brickTrialActive || woodSurfaceId !== null ||
    glassSurfaceId !== null;
  let experimentalBrick: ExperimentalBrickMaterial | null = null;
  let experimentalWood: ImageWallMaterial | null = null;
  let experimentalGlass: ImageWallMaterial | null = null;
  let tier: RepresentationTier = "near";
  let proxiesBuilt = false;
  let disposed = false;

  const materialFor = (role: PrimitiveRole): Material => {
    const supplied = context.materials?.[role];
    if (supplied) return supplied;
    if (role === "wall" && brickTrialActive) {
      if (!experimentalBrick) experimentalBrick = createExperimentalBrickMaterial(
        scene, materialRecipe(spec, context.generatorVersion, "wall"), spec.id,
        businessSurfaceId ?? "BRK-01");
      return experimentalBrick.material;
    }
    if (role === "wall" && glassSurfaceId) {
      if (!experimentalGlass) {
        experimentalGlass = createImageWallMaterial(
          scene, materialRecipe(spec, context.generatorVersion, "wall"),
          "experiment:glass-" + glassSurfaceId + ":" + spec.id,
          GLASS_SURFACES[glassSurfaceId].path);
        // This image provides pure glass tint and soft light sheen only; no
        // frame/mullion geometry or cloud/skyline reflections are baked in.
        experimentalGlass.material.specularColor = new Color3(0.64, 0.70, 0.78);
        experimentalGlass.material.specularPower = 112;
      }
      return experimentalGlass.material;
    }
    if (role === "wall" && woodSurfaceId) {
      if (!experimentalWood) experimentalWood = createImageWallMaterial(
        scene, materialRecipe(spec, context.generatorVersion, "wall"),
        "experiment:wood-" + woodSurfaceId + ":" + spec.id,
        WOOD_SURFACES[woodSurfaceId].path);
      return experimentalWood.material;
    }
    const cached = roleMaterials.get(role);
    if (cached) return cached;
    const recipe = materialRecipe(spec, context.generatorVersion, role);
    const material = library.acquire(recipe);
    roleMaterials.set(role, material);
    leases.set(role, recipe.key);
    return material;
  };
  const register = (mesh: Mesh, kind: RenderClass): void => {
    mesh.parent = root;
    mesh.receiveShadows = true;
    meshes.push(mesh);
    groups.push({ mesh, kind });
  };
  const makeIndividual = (part: BoxPrimitive, kind: RenderClass): void => {
    if (part.templateId === "facade-sign-band") {
      // MA-LED: render the existing storefront band as a luminous, physical
      // diffuser. This is authored by the building facade itself; no separate
      // street-object planner or invisible detached mounting anchor.
      if (!storefrontLedMaterial) {
        storefrontLedMaterial = new StandardMaterial("ma-facade-led:" + spec.id, scene);
        storefrontLedMaterial.diffuseColor = new Color3(0.82, 0.85, 0.87);
        storefrontLedMaterial.specularColor = new Color3(0.42, 0.45, 0.47);
        storefrontLedMaterial.emissiveColor = new Color3(0.035, 0.035, 0.038);
        storefrontLedMaterial.disableLighting = false;
      }
      const housing = MeshBuilder.CreateBox("generated:" + spec.id + ":" + part.id,
        { width: part.size.x, height: part.size.y, depth: part.size.z }, scene);
      housing.position.set(part.center.x, part.center.y, part.center.z);
      housing.material = materialFor("trim");
      housing.metadata = { buildingId: spec.id, templateId: part.templateId, renderClass: kind };
      register(housing, kind);
      const frontBack = part.size.x > part.size.z;
      const led = MeshBuilder.CreateBox("generated-led:" + spec.id + ":" + part.id,
        { width: frontBack ? part.size.x * 0.94 : part.size.x + 0.025,
          height: 0.085,
          depth: frontBack ? part.size.z + 0.025 : part.size.z * 0.94 }, scene);
      led.position.set(part.center.x, part.center.y - 0.12, part.center.z);
      led.material = storefrontLedMaterial;
      led.metadata = { buildingId: spec.id, templateId: "facade-storefront-led",
        renderClass: kind, cameraBlocker: false };
      register(led, kind);
      return;
    }
    if (part.templateId === "facade-downpipe") {
      // WG/MA: facade downpipes are real round metal cylinders, never
      // dark rectangular structural sticks. No change to physics shell.
      if (!downpipeMaterial) {
        downpipeMaterial = new StandardMaterial("municipal-downpipe-metal:" + spec.id, scene);
        downpipeMaterial.diffuseColor = new Color3(0.70, 0.73, 0.73);
        downpipeMaterial.specularColor = new Color3(0.82, 0.85, 0.87);
        downpipeMaterial.specularPower = 80;
      }
      const pipe = MeshBuilder.CreateCylinder(
        "generated:" + spec.id + ":" + part.id,
        { height: part.size.y, diameter: 0.1155, tessellation: 12 }, scene);
      pipe.position.set(part.center.x, part.center.y, part.center.z);
      pipe.material = downpipeMaterial;
      pipe.metadata = { buildingId: spec.id, architecturalRole: "metal",
        primitiveId: part.id, templateId: part.templateId,
        renderClass: kind, cameraBlocker: false };
      register(pipe, kind);
      for (const [name, offset] of [["lower", -1], ["upper", 1]] as const) {
        const collar = MeshBuilder.CreateCylinder(
          "generated:" + spec.id + ":" + part.id + ":" + name,
          { height: 0.11, diameter: 0.16275, tessellation: 12 }, scene);
        collar.position.set(part.center.x,
          part.center.y + offset * Math.max(0, part.size.y / 2 - 0.35),
          part.center.z);
        collar.material = downpipeMaterial;
        register(collar, kind);
      }
      return;
    }
    const mesh = MeshBuilder.CreateBox("generated:" + spec.id + ":" + part.id,
      { width: part.size.x, height: part.size.y, depth: part.size.z }, scene);
    mesh.position.set(part.center.x, part.center.y, part.center.z);
    if (part.rotationZ !== undefined) mesh.rotation.z = part.rotationZ;
    mesh.material = materialFor(part.role);
    if (part.role === "wall") {
      if (brickPresetId) applyPhysicalBrickUV(mesh, part, BRICK_SCALE_PRESETS[brickPresetId]);
      else if (businessSurfaceId) applyPhysicalBrickUV(
        mesh, part, businessBrickPhysicalTile(businessSurfaceId));
      else if (woodSurfaceId) applyPhysicalBrickUV(mesh, part, woodTileMetres(woodSurfaceId));
      else if (glassSurfaceId) applyPhysicalBrickUV(mesh, part, GLASS_TILE_METRES);
    }
    mesh.metadata = { buildingId: spec.id, architecturalRole: part.role,
      primitiveId: part.id, templateId: part.templateId ?? null, renderClass: kind,
      cameraBlocker: false };
    register(mesh, kind);
  };
  const makeBatches = (parts: readonly BoxPrimitive[]): void => {
    if (!scene.getEngine().getCaps().instancedArrays) {
      for (const part of parts) makeIndividual(part, renderClass(part));
      return;
    }
    const buckets = new Map<string, BoxPrimitive[]>();
    for (const part of parts) {
      if (part.templateId === "facade-downpipe" || part.templateId === "facade-sign-band" ||
        (imageWallActive && part.role === "wall")) {
        makeIndividual(part, "detail");
        continue;
      }
      const kind = renderClass(part);
      const key = kind + ":" + part.role;
      const bucket = buckets.get(key) ?? [];
      bucket.push(part);
      buckets.set(key, bucket);
    }
    for (const [key, bucket] of buckets) {
      const first = bucket[0]!;
      const kind = renderClass(first);
      const mesh = MeshBuilder.CreateBox("generated-batch:" + spec.id + ":" + key, { size: 1 }, scene);
      mesh.material = materialFor(first.role);
      mesh.metadata = { buildingId: spec.id, architecturalRole: first.role,
        primitiveIds: bucket.map((part) => part.id), renderClass: kind,
        thinInstanced: true, cameraBlocker: false };
      register(mesh, kind);
      for (const part of bucket) {
        const scale = Matrix.Scaling(part.size.x, part.size.y, part.size.z);
        const rotation = Matrix.RotationZ(part.rotationZ ?? 0);
        const translation = Matrix.Translation(part.center.x, part.center.y, part.center.z);
        mesh.thinInstanceAdd(scale.multiply(rotation).multiply(translation));
      }
      mesh.thinInstanceRefreshBoundingInfo();
    }
  };
  const createCameraBlockers = (): void => {
    if (spec.parameters.cameraBlockerMode === "none") return;
    for (const box of interaction.cameraBlockerBoxes) {
      const mesh = MeshBuilder.CreateBox("generated-camera-blocker:" + spec.id + ":" + box.id,
        { width: box.size.x, height: box.size.y, depth: box.size.z }, scene);
      mesh.parent = root;
      mesh.position.set(box.center.x, box.center.y, box.center.z);
      if (box.rotationZ !== undefined) mesh.rotation.z = box.rotationZ;
      mesh.visibility = 0;
      mesh.isVisible = true;
      mesh.isPickable = true;
      mesh.metadata = {
        buildingId: spec.id, spatialRole: box.role, colliderId: box.id,
        cameraBlocker: true,
      };
      cameraBlockers.push(mesh);
    }
  };
  const ensureProxies = (): void => {
    if (proxiesBuilt) return;
    for (const mass of plan.masses) {
      const proxy: BoxPrimitive = { id: "lod-proxy:" + mass.id, role: "wall",
        center: { x: mass.centerX, y: mass.baseY + mass.height / 2, z: mass.centerZ },
        size: { x: mass.width, y: mass.height, z: mass.depth } };
      makeIndividual(proxy, "proxy");
    }
    proxiesBuilt = true;
  };
  const setRepresentationTier = (next: RepresentationTier): void => {
    if (disposed) throw new Error("Cannot change LOD of disposed building");
    const policy = REPRESENTATION_POLICIES[next];
    if (!policy) throw new Error("Unknown representation tier: " + next);
    if (policy.useMassProxies) ensureProxies();
    tier = next;
    for (const group of groups) {
      const enabled = group.kind === "proxy" ? policy.useMassProxies :
        !policy.useMassProxies && (group.kind === "base" ||
          (group.kind === "detail" && policy.includeFacadeDetails) ||
          (group.kind === "fixture" && policy.includeSmallFixtures));
      group.mesh.setEnabled(enabled);
    }
  };
  const setRepresentationDistance = (distance: number): void => {
    setRepresentationTier(selectRepresentationTier(spec.parameters.lodProfile, distance, tier));
  };
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    collisionHandle?.dispose();
    for (const mesh of cameraBlockers) mesh.dispose();
    for (const mesh of meshes) mesh.dispose();
    downpipeMaterial?.dispose();
    storefrontLedMaterial?.dispose();
    experimentalBrick?.dispose();
    experimentalWood?.dispose();
    experimentalGlass?.dispose();
    root.dispose();
    for (const key of leases.values()) library.release(key);
    if (ownsLibrary) library.dispose();
  };
  try {
    const parts = [
      ...plan.primitives, ...detailPlan.primitives,
      ...(physics ? interaction.closedDoorPanels : []),
    ];
    if (batchingMode === "thin-instances") makeBatches(parts);
    else if (batchingMode === "individual") {
      for (const part of parts) makeIndividual(part, renderClass(part));
    } else throw new Error("Unknown batching mode: " + batchingMode);
    if (context.initialDistance !== undefined) setRepresentationDistance(context.initialDistance);
    if (physics) collisionHandle = registerBuildingCollision(physics, spec.position, spec.yawRadians, interaction);
    if (context.enableCameraBlockers ?? physics !== null) createCameraBlockers();
  } catch (error) {
    dispose();
    throw error;
  }
  return { buildingId: spec.id, root, meshes, plan, detailPlan, batchingMode,
    interaction, cameraBlockers, entrances: interaction.anchors,
    portals: interaction.portals, interior: interaction.interior, spatial: interaction.spatial,
    get representationTier() { return tier; },
    get physicsIntegrated() { return collisionHandle !== null; },
    get colliderCount() { return collisionHandle?.colliderCount ?? 0; },
    setRepresentationTier, setRepresentationDistance, dispose };
}
