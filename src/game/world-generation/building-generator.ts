import { Matrix, MeshBuilder, TransformNode } from "@babylonjs/core";
import type { Material, Mesh, Scene } from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";
import type { ResolvedBuildingSpec } from "./schema";
import { planBuilding } from "./architecture-plan";
import type { BoxPrimitive, GeneratedBuildingPlan, PrimitiveRole } from "./architecture-plan";
import { planFacadeDetails } from "./facade-details";
import type { FacadeDetailPlan } from "./facade-details";
import { BuildingMaterialLibrary } from "./material-library";
import { materialRecipe } from "./representation-materials";
import { REPRESENTATION_POLICIES, selectRepresentationTier } from "./representation-lod";
import type { BatchingMode, RepresentationTier } from "./representation-lod";

/** Step 3 is visual only; Step 4 owns collision, portals and camera blockers. */
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
}
export interface GeneratedBuilding {
  readonly buildingId: string;
  readonly root: TransformNode;
  readonly meshes: readonly Mesh[];
  readonly plan: GeneratedBuildingPlan;
  readonly detailPlan: FacadeDetailPlan;
  readonly batchingMode: BatchingMode;
  readonly representationTier: RepresentationTier;
  readonly physicsIntegrated: false;
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
  scene: Scene, _physics: MeridianPhysics | null, spec: ResolvedBuildingSpec, context: BuildingGenerationContext,
): GeneratedBuilding {
  const plan = planBuilding(spec, context.generatorVersion);
  const detailPlan = context.enableFacadeDetails ? planFacadeDetails(spec, plan) : { primitives: [], decals: [] };
  const batchingMode = context.batchingMode ?? "individual";
  const library = context.materialLibrary ?? new BuildingMaterialLibrary(scene);
  const ownsLibrary = !context.materialLibrary;
  const root = new TransformNode("generated-building:" + spec.id, scene);
  root.position.set(spec.position.x, spec.position.y, spec.position.z);
  root.rotation.y = spec.yawRadians;
  const meshes: Mesh[] = [];
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
      primitiveId: part.id, templateId: part.templateId ?? null, renderClass: kind };
    register(mesh, kind);
  };
  const makeBatches = (parts: readonly BoxPrimitive[]): void => {
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
        primitiveIds: bucket.map((part) => part.id), renderClass: kind, thinInstanced: true };
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
    for (const mesh of meshes) mesh.dispose();
    root.dispose();
    for (const key of leases.values()) library.release(key);
    if (ownsLibrary) library.dispose();
  };
  try {
    const parts = [...plan.primitives, ...detailPlan.primitives];
    if (batchingMode === "thin-instances") makeBatches(parts);
    else if (batchingMode === "individual") {
      for (const part of parts) makeIndividual(part, renderClass(part));
    } else throw new Error("Unknown batching mode: " + batchingMode);
    if (context.initialDistance !== undefined) setRepresentationDistance(context.initialDistance);
  } catch (error) {
    dispose();
    throw error;
  }
  return { buildingId: spec.id, root, meshes, plan, detailPlan, batchingMode,
    get representationTier() { return tier; }, physicsIntegrated: false,
    setRepresentationTier, setRepresentationDistance, dispose };
}
