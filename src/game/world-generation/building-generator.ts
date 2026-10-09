import { Color3, MeshBuilder, StandardMaterial, TransformNode } from "@babylonjs/core";
import type { Material, Mesh, Scene } from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";
import type { FacadeMaterial, ResolvedBuildingSpec } from "./schema";
import { planBuilding } from "./architecture-plan";
import type { GeneratedBuildingPlan, PrimitiveRole } from "./architecture-plan";

/**
 * Step 2 builds only visual architecture. Step 4 will add semantic Rapier
 * collision, camera blockers and interior portals. This boundary never mutates
 * physics or the existing First Light runtime.
 */
export interface BuildingGenerationContext {
  readonly generatorVersion: number;
  /** Caller-owned materials are shared and never disposed by the generator. */
  readonly materials?: Partial<Record<PrimitiveRole, Material>>;
}

export interface GeneratedBuilding {
  readonly buildingId: string;
  readonly root: TransformNode;
  readonly meshes: readonly Mesh[];
  readonly plan: GeneratedBuildingPlan;
  readonly physicsIntegrated: false;
  dispose(): void;
}

const WALL_COLORS: Record<FacadeMaterial, string> = {
  "warm-brick": "#80543d",
  "weathered-concrete": "#727577",
  "painted-block": "#a59b86",
  "garage-block": "#817b71",
  "industrial-metal": "#66727b",
  "plaster": "#c4b7a4",
  "storefront-glass": "#426272",
};
const ROLE_COLORS: Record<Exclude<PrimitiveRole, "wall">, string> = {
  roof: "#4f5457",
  trim: "#9a968d",
  glass: "#314b59",
  metal: "#5b656b",
  storefront: "#3d5b65",
};

/** Generates a visual shell from an already-resolved Step 1 BuildingSpec. */
export function generateBuilding(
  scene: Scene,
  _physics: MeridianPhysics | null,
  spec: ResolvedBuildingSpec,
  context: BuildingGenerationContext,
): GeneratedBuilding {
  const plan = planBuilding(spec, context.generatorVersion);
  const root = new TransformNode(`generated-building:${spec.id}`, scene);
  root.position.set(spec.position.x, spec.position.y, spec.position.z);
  root.rotation.y = spec.yawRadians;
  const meshes: Mesh[] = [];
  const ownedMaterials: StandardMaterial[] = [];
  const materialCache = new Map<PrimitiveRole, Material>();
  let disposed = false;

  const materialFor = (role: PrimitiveRole): Material => {
    const supplied = context.materials?.[role];
    if (supplied) return supplied;
    const cached = materialCache.get(role);
    if (cached) return cached;
    const material = new StandardMaterial(`generated:${spec.id}:${role}`, scene);
    material.diffuseColor = Color3.FromHexString(
      role === "wall" ? WALL_COLORS[spec.parameters.facadeMaterial] : ROLE_COLORS[role],
    );
    material.specularColor = new Color3(0.06, 0.06, 0.06);
    if (role === "glass" || role === "storefront") material.alpha = 0.84;
    materialCache.set(role, material);
    ownedMaterials.push(material);
    return material;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const mesh of meshes) mesh.dispose();
    root.dispose();
    for (const material of ownedMaterials) material.dispose();
  };

  try {
    for (const primitive of plan.primitives) {
      const mesh = MeshBuilder.CreateBox(
        `generated:${spec.id}:${primitive.id}`,
        { width: primitive.size.x, height: primitive.size.y, depth: primitive.size.z },
        scene,
      );
      mesh.parent = root;
      mesh.position.set(primitive.center.x, primitive.center.y, primitive.center.z);
      if (primitive.rotationZ !== undefined) mesh.rotation.z = primitive.rotationZ;
      mesh.material = materialFor(primitive.role);
      mesh.receiveShadows = true;
      mesh.metadata = {
        buildingId: spec.id,
        architecturalRole: primitive.role,
        primitiveId: primitive.id,
        templateId: primitive.templateId ?? null,
      };
      meshes.push(mesh);
    }
  } catch (error) {
    dispose();
    throw error;
  }

  return { buildingId: spec.id, root, meshes, plan, physicsIntegrated: false, dispose };
}
