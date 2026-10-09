import { Matrix, MeshBuilder, TransformNode } from "@babylonjs/core";
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
  const detailPlan = context.enableFacadeDetails ? planFacadeDetails(spec, plan) : { primitives: [], decals: [] };
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
  let tier: RepresentationTier = "near";
  let proxiesBuilt = false;
  let disposed = false;

  const materialFor = (role: PrimitiveRole): Material => {
    const supplied = context.materials?.[role];
    if (supplied) return supplied;
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
    const mesh = MeshBuilder.CreateBox("generated:" + spec.id + ":" + part.id,
      { width: part.size.x, height: part.size.y, depth: part.size.z }, scene);
    mesh.position.set(part.center.x, part.center.y, part.center.z);
    if (part.rotationZ !== undefined) mesh.rotation.z = part.rotationZ;
    mesh.material = materialFor(part.role);
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
