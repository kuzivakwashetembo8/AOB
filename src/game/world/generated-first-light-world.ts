import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import { planGroundLandUse } from "../world-generation/ground-land-use";
import { createGroundLandTexture } from "../world-generation/ground-land-surface";
import type {
  MeridianPhysics,
  StaticCollisionHandle,
} from "../physics/rapier-world";
import {
  BuildingMaterialLibrary,
  FIRST_LIGHT_CAMERA_FOCUS,
  FIRST_LIGHT_CITY_SPEC,
  FIRST_LIGHT_PLAYER_SPAWN,
  createGeneratedStreetContext,
  createGeneratedUrbanSurfaces,
  generateBuilding,
  planStreetContext,
  resolveCityBuildings,
} from "../world-generation";
import type {
  GeneratedBuilding,
  GeneratedStreetContext,
  GeneratedUrbanSurfaces,
} from "../world-generation";
import type { StreetContextPlan } from "../world-generation/street-context";
import {createMercerExtraParkedGLBs} from "../vehicles/mercer-additional-parked-glbs-006";
import type { ForestryBudget, ForestryPlan, ForestryDensityFocus } from "../world-generation/urban-forestry-plan";
import {
  createMeridianEnvironment,
  type InteriorVisibilityState,
  type MeridianEnvironmentController,
  type MeridianEnvironmentSnapshot,
} from "./environment-controller";
import {
  createSouthWardGarageInterior,
  type GeneratedGarageInterior,
} from "./hero-garage-interior";

export interface GeneratedFirstLightWorld {
  readonly spawn: Vector3;
  readonly focus: Vector3;
  readonly location: string;
  readonly objective: string;
  readonly buildings: readonly GeneratedBuilding[];
  readonly urbanSurfaces: GeneratedUrbanSurfaces;
  readonly streetContext: GeneratedStreetContext;
  readonly materialLibrary: BuildingMaterialLibrary;
  readonly environment: MeridianEnvironmentController;
  readonly garageInterior: GeneratedGarageInterior | null;
  readonly shadowGenerator: MeridianEnvironmentController["shadowGenerator"];
  readonly forestryReport: ForestryPlan | null;
  readonly interiorState: InteriorVisibilityState;
  readonly environmentSnapshot: MeridianEnvironmentSnapshot;
  /** Owner's Range Rover-only preview, separate from accepted imported slots. */
  readonly rangeRoverReview: ReturnType<typeof createMercerExtraParkedGLBs> | null;
  readonly rangeRoverReviewReady: Promise<void> | null;
  /**
   * EXP-VEH-001 only: substitute the collision box of an already-existing
   * parked-car slot after its imported visual succeeds. The world retains
   * ownership of both legacy and replacement Rapier handles.
   */
  replaceParkedCarCollider(
    itemId: string,
    dimensions: { readonly x: number; readonly y: number; readonly z: number },
  ): void;
  /** Imported-only game: remove invisible legacy collision until GLB is ready. */
  suspendParkedCarColliders(): void;
  /** EXP-VEH-002: transfer exactly one imported parked car to its live driving actor. */
  releaseParkedCarCollider(itemId: string): void;
  update(realSeconds: number, playerPosition: { x: number; y: number; z: number }): void;
  setTimeMinutes(minutes: number): MeridianEnvironmentSnapshot;
  setTimeScale(scale: number): MeridianEnvironmentSnapshot;
  dispose(): void;
}

export interface GeneratedFirstLightWorldOptions {
  readonly enableLandUsePreview?: boolean;
  readonly enableTreePlace001?: boolean;
  readonly treeBudget?: ForestryBudget;
  readonly treeDensityFocus?: ForestryDensityFocus;
  readonly enableCameraBlockers?: boolean;
  /** Explicitly opt in Range Rover driving; Sedan/ergoninane remain absent. */
  readonly enableRangeRoverDriveReview?: boolean;
  readonly enableShadows?: boolean;
  /** GTD-CHAR-001 only: register real First Light raised sidewalk colliders. */
  readonly enableSidewalkSupportCollision?: boolean;
  /** Explicit image-derived brick material A/B experiment only. */
  readonly enableBrickMaterialTrial?: boolean;
  /** MAT-005 owner-directed visual witness surfaces; not production acceptance. */
  readonly enableBrickBusinessFieldTrial?: boolean;
  readonly brickBusinessFocusSurface?: import("../world-generation/brick-surface-catalog").BrickSurfaceId | null;
  readonly enableWoodSurfaceFieldTrial?: boolean;
  readonly woodSurfaceFocusId?: import("../world-generation/wood-surface-catalog").WoodSurfaceId | null;
  readonly enableGlassSurfaceFieldTrial?: boolean;
  readonly glassSurfaceFocusId?: import("../world-generation/glass-surface-catalog").GlassSurfaceId | null;
}

function createGround(
  scene: Scene,
  physics: MeridianPhysics,
  landUsePreview = false,
): {
  mesh: Mesh;
  material: StandardMaterial;
  collision: StaticCollisionHandle;
  disposeTexture(): void;
} {
  const material=new StandardMaterial("generated-ground-material",scene);
  let groundTexture: ReturnType<typeof createGroundLandTexture> | null = null;
  material.diffuseColor=new Color3(0.17,0.16,0.14);
  material.specularColor=Color3.Black();
  const mesh=MeshBuilder.CreateGround(
    "generated-first-light-ground",{width:160,height:130},scene,
  );
  mesh.position.z=20;
  if(landUsePreview){
    const plan=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,
      {left:-80,right:80,north:-45,south:85});
    // Grass fills every residual metre under the original road/building meshes.
    // The original flat mesh remains the sole ground draw and collision support.
    const positions=mesh.getVerticesData("position")??[];
    const uvs:number[]=[];
    for(let i=0;i<positions.length;i+=3)
      uvs.push((positions[i]!+80)/160,(positions[i+2]!+65)/130);
    mesh.setVerticesData("uv",uvs);
    // GRN-004: photographic carpet-grass trials rejected. The accepted
    // GRN-01 procedural image is always the sole residual-ground material.
    groundTexture=createGroundLandTexture(scene,plan);
    material.diffuseTexture=groundTexture;
    material.diffuseColor=Color3.White();
    material.specularColor=Color3.Black();
    material.disableLighting=true;
    material.maxSimultaneousLights=1;
    mesh.metadata={...mesh.metadata,landUsePreview:true,landUseCoverage:plan.counts,
      groundFinish:"GRN-01"};
  }
  mesh.material=material;
  mesh.receiveShadows=true;
  mesh.isPickable=true;
  mesh.metadata={...mesh.metadata,spatialRole:"terrain",
    cameraBlocker:true,cameraGround:true};
  const collision=physics.addStaticBox(
    {x:0,y:-0.12,z:20},{x:80,y:0.12,z:65},
  );
  return {mesh,material,collision,disposeTexture(){
    groundTexture?.dispose();
  }};
}

function registerStreetContextCollision(
  physics: MeridianPhysics,
  plan: StreetContextPlan,
  parkedHandles?: Map<string, StaticCollisionHandle>,
): StaticCollisionHandle[] {
  const handles: StaticCollisionHandle[] = [];

  for (const item of plan.items) {
    switch (item.kind) {
      case "parked-car": {
        const parkedHandle = physics.addStaticBox(
          { x: item.position.x, y: 0.76, z: item.position.z },
          {
            x: 0.88 * item.scale,
            y: 0.76 * item.scale,
            z: 2.0 * item.scale,
          },
          item.yawRadians,
        );
        handles.push(parkedHandle);
        parkedHandles?.set(item.id, parkedHandle);
        break;
      }
      case "streetlight":
        handles.push(
          physics.addStaticCylinder(
            {
              x: item.position.x,
              y: 2.65 * item.scale,
              z: item.position.z,
            },
            2.65 * item.scale,
            0.13 * item.scale,
          ),
        );
        break;
      case "tree":
        handles.push(
          physics.addStaticCylinder(
            {
              x: item.position.x,
              y: 1.8 * item.scale,
              z: item.position.z,
            },
            1.8 * item.scale,
            0.28 * item.scale,
          ),
        );
        break;
      case "bench":
        handles.push(
          physics.addStaticBox(
            { x: item.position.x, y: 0.48, z: item.position.z },
            { x: 0.95, y: 0.48, z: 0.36 },
            item.yawRadians,
          ),
        );
        break;
      case "bin":
        handles.push(
          physics.addStaticBox(
            { x: item.position.x, y: 0.48, z: item.position.z },
            { x: 0.34, y: 0.48, z: 0.34 },
            item.yawRadians,
          ),
        );
        break;
      case "shrub":
        // Shrubs remain deliberately decorative.
        break;
    }
  }

  return handles;
}

function registerUrbanNavigationCollision(
  physics: MeridianPhysics,
  urbanSurfaces: GeneratedUrbanSurfaces,
  enableSidewalkSupportCollision = false,
): StaticCollisionHandle[] {
  const handles: StaticCollisionHandle[] = [];
  for (const mesh of urbanSurfaces.meshes) {
    const curb = mesh.name.includes("curb");
    // The original scene only registered curbs. Parity sidewalk tops are
    // Y=0.11, while the global ground collider tops at Y=0. This left the
    // player's physical support at the ground height and swallowed boots
    // into rendered pavement. Match existing sidewalk boxes exactly, trial
    // only; do NOT use AABBs for rotated procedural sidewalk polygons.
    const paritySidewalk = enableSidewalkSupportCollision &&
      mesh.name.startsWith("generated-parity-") &&
      mesh.material?.name === "generated-sidewalk";
    if (!curb && !paritySidewalk) continue;
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    handles.push(
      physics.addStaticBox(
        {
          x: box.centerWorld.x,
          y: box.centerWorld.y,
          z: box.centerWorld.z,
        },
        {
          x: Math.max(0.02, box.extendSizeWorld.x),
          y: Math.max(0.02, box.extendSizeWorld.y),
          z: Math.max(0.02, box.extendSizeWorld.z),
        },
      ),
    );
  }
  return handles;
}

function registerGaragePropCollision(
  physics: MeridianPhysics,
  garageInterior: GeneratedGarageInterior | null,
): StaticCollisionHandle[] {
  const handles: StaticCollisionHandle[] = [];
  for (const mesh of garageInterior?.meshes ?? []) {
    if (!mesh.name.startsWith("garage-tire-")) continue;
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    handles.push(
      physics.addStaticBox(
        {
          x: box.centerWorld.x,
          y: box.centerWorld.y,
          z: box.centerWorld.z,
        },
        {
          x: Math.max(0.12, box.extendSizeWorld.x),
          y: Math.max(0.12, box.extendSizeWorld.y),
          z: Math.max(0.12, box.extendSizeWorld.z),
        },
      ),
    );
  }
  return handles;
}

function registerGarageThresholdCollision(
  physics: MeridianPhysics,
  building: GeneratedBuilding,
): StaticCollisionHandle[] {
  const handles: StaticCollisionHandle[] = [];
  for (const portal of building.portals) {
    const centerX = (portal.exterior.x + portal.interior.x) / 2;
    const centerZ = (portal.exterior.z + portal.interior.z) / 2;
    const frontRear = portal.facade === "front" || portal.facade === "rear";
    const yaw =
      building.spatial.yawRadians + (frontRear ? 0 : Math.PI / 2);
    handles.push(
      physics.addStaticBox(
        {
          x: centerX,
          y: building.spatial.origin.y + 0.11,
          z: centerZ,
        },
        {
          x: Math.max(0.45, portal.width / 2 - 0.08),
          y: 0.11,
          z: 0.36,
        },
        yaw,
        // Actual 22 cm garage sill: physically exists, but must not be
        // auto-climbed like an ordinary 21 cm roadside curb.
        { vehicleNoStep: true },
      ),
    );
  }
  return handles;
}

function registerGarageInteriorCollision(
  physics: MeridianPhysics,
  building: GeneratedBuilding,
): StaticCollisionHandle[] {
  const handles: StaticCollisionHandle[] = [];
  const yaw = building.spatial.yawRadians;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const origin = building.spatial.origin;
  const fixtures = [
    { x: -3.7, y: 0.52, z: -3.75, hx: 2.1, hy: 0.52, hz: 0.43 },
    { x: -5.45, y: 1.05, z: -2.85, hx: 0.63, hy: 1.05, hz: 0.33 },
    {
      x: building.interior ? building.interior.localMax.x - 0.48 : 5.9,
      y: 1.05,
      z: -1.35,
      hx: 1.8,
      hy: 1.05,
      hz: 0.36,
      localYaw: Math.PI / 2,
    },
    { x: 5.45, y: 1.08, z: 2.85, hx: 0.83, hy: 1.08, hz: 0.29 },
    { x: 4.1, y: 0.88, z: 3.02, hx: 0.41, hy: 0.88, hz: 0.36 },
    { x: -4.6, y: 0.43, z: 3.1, hx: 1.28, hy: 0.43, hz: 0.4 },
  ] as const;

  for (const fixture of fixtures) {
    const worldX = origin.x + fixture.x * cos - fixture.z * sin;
    const worldZ = origin.z + fixture.x * sin + fixture.z * cos;
    handles.push(
      physics.addStaticBox(
        { x: worldX, y: origin.y + fixture.y, z: worldZ },
        { x: fixture.hx, y: fixture.hy, z: fixture.hz },
        yaw + ("localYaw" in fixture ? fixture.localYaw : 0),
      ),
    );
  }
  return handles;
}

function applyGarageVisibility(
  building: GeneratedBuilding,
  state: InteriorVisibilityState,
): void {
  const roofVisibility =
    state === "inside" ? 0.08 : state === "threshold" ? 0.38 : 1;
  for (const mesh of building.meshes) {
    if (mesh.metadata?.architecturalRole === "roof") {
      mesh.visibility = roofVisibility;
    }
  }
}

function classifyGarageInterior(
  building: GeneratedBuilding,
  playerPosition: { x: number; y: number; z: number },
): InteriorVisibilityState {
  const interior = building.interior;
  if (!interior) return "outside";

  const yaw = building.spatial.yawRadians;
  const dx = playerPosition.x - building.spatial.origin.x;
  const dz = playerPosition.z - building.spatial.origin.z;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const localX = dx * cos + dz * sin;
  const localZ = -dx * sin + dz * cos;
  const localY = playerPosition.y - building.spatial.origin.y;

  const inside =
    localX >= interior.localMin.x &&
    localX <= interior.localMax.x &&
    localZ >= interior.localMin.z &&
    localZ <= interior.localMax.z &&
    localY >= interior.localMin.y - 0.2 &&
    localY <= interior.localMax.y + 0.5;
  if (inside) return "inside";

  const portal = building.portals[0];
  if (!portal) return "outside";
  const exteriorDistance = Math.hypot(
    playerPosition.x - portal.exterior.x,
    playerPosition.z - portal.exterior.z,
  );
  const interiorDistance = Math.hypot(
    playerPosition.x - portal.interior.x,
    playerPosition.z - portal.interior.z,
  );
  return Math.min(exteriorDistance, interiorDistance) <= 1.45
    ? "threshold"
    : "outside";
}

export function createGeneratedFirstLightWorld(
  scene: Scene,
  physics: MeridianPhysics,
  options: GeneratedFirstLightWorldOptions = {},
): GeneratedFirstLightWorld {
  const enableCameraBlockers = options.enableCameraBlockers ?? true;
  const enableShadows = options.enableShadows ?? true;

  const ground = createGround(scene, physics, options.enableLandUsePreview ?? false);
  const urbanSurfaces = createGeneratedUrbanSurfaces(
    scene,
    FIRST_LIGHT_CITY_SPEC,
    {skipLegacyParcelInfill: options.enableLandUsePreview ?? false},
  );
  const streetPlan = planStreetContext(FIRST_LIGHT_CITY_SPEC, {
    enableTreePlace001: options.enableTreePlace001 ?? false,
    treeBudget: options.treeBudget ?? 6,
    treeDensityFocus: options.treeDensityFocus ?? "balanced",
  });
  const streetContext = createGeneratedStreetContext(
    scene,
    FIRST_LIGHT_CITY_SPEC,
    { skipPocketParkGround: options.enableLandUsePreview ?? false, plan: streetPlan },
  );
  const materialLibrary = new BuildingMaterialLibrary(scene);
  const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC).map((spec) =>
    generateBuilding(scene, physics, spec, {
      generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion,
      materialLibrary,
      enableFacadeDetails: true,
      batchingMode: "thin-instances",
      enableCameraBlockers,
      enableBrickMaterialTrial: options.enableBrickMaterialTrial ?? false,
      enableBrickBusinessFieldTrial: options.enableBrickBusinessFieldTrial ?? false,
      brickBusinessFocusSurface: options.brickBusinessFocusSurface ?? null,
      enableWoodSurfaceFieldTrial: options.enableWoodSurfaceFieldTrial ?? false,
      woodSurfaceFocusId: options.woodSurfaceFocusId ?? null,
      enableGlassSurfaceFieldTrial: options.enableGlassSurfaceFieldTrial ?? false,
      glassSurfaceFocusId: options.glassSurfaceFocusId ?? null,
    }),
  );
  const heroGarage =
    buildings.find((building) => building.buildingId === "sw-fl-garage") ??
    null;
  const garageInterior = heroGarage
    ? createSouthWardGarageInterior(scene, heroGarage)
    : null;
  const environment = createMeridianEnvironment(scene, {
    enableShadows,
    initialMinuteOfDay: 14 * 60 + 30,
    // FL-3 development uses the 24-real-minute validation cycle. 1x remains
    // the canonical 48-real-minute Meridian day.
    initialTimeScale: 2,
  });
  const parkedCollisionHandles = new Map<string, StaticCollisionHandle>();
  const parkedById = new Map(
    streetPlan.items
      .filter((item) => item.kind === "parked-car")
      .map((item) => [item.id, item] as const),
  );
  const contextCollision = registerStreetContextCollision(physics, streetPlan, parkedCollisionHandles);
  // VEH-007 owner directive: Sedan development delegated/pending, remove its
  // render, asset network request and physical collider entirely. The secondary
  // ergoninane GLB is also deferred. Only the Range Rover is loaded, behind
  // its own explicit preview flag, then eligible for live driving ownership.
  const rangeRoverReview=options.enableRangeRoverDriveReview
    ? createMercerExtraParkedGLBs(scene,physics,streetPlan.items)
    : null;
  const urbanNavigationCollision = registerUrbanNavigationCollision(
    physics,
    urbanSurfaces,
    options.enableSidewalkSupportCollision ?? false,
  );
  const garageInteriorCollision = heroGarage
    ? registerGarageInteriorCollision(physics, heroGarage)
    : [];
  const garagePropCollision = registerGaragePropCollision(
    physics,
    garageInterior,
  );
  const garageThresholdCollision = heroGarage
    ? registerGarageThresholdCollision(physics, heroGarage)
    : [];

  for (const mesh of urbanSurfaces.meshes) {
    mesh.receiveShadows = true;
  }

  for (const building of buildings) {
    for (const mesh of building.meshes) {
      environment.addShadowCaster(mesh);
    }
  }

  for (const mesh of streetContext.meshes) {
    mesh.receiveShadows = true;
    if (
      !mesh.name.startsWith("generated-public-space:") &&
      !mesh.name.startsWith("generated-grass-variation:")
    ) {
      environment.addShadowCaster(mesh);
    }
  }

  for (const mesh of garageInterior?.meshes ?? []) {
    environment.addShadowCaster(mesh);
  }

  let disposed = false;
  let interiorState: InteriorVisibilityState = "outside";
  let environmentSnapshot = environment.snapshot();

  return {
    // Spawn near the Range Rover in its isolated driving preview.
    // The canonical spawn remains unchanged in ordinary gameplay.
    spawn: rangeRoverReview
      ? new Vector3(-5.45,0.92,6.8)
      : new Vector3(
          FIRST_LIGHT_PLAYER_SPAWN.position.x,
          FIRST_LIGHT_PLAYER_SPAWN.position.y,
          FIRST_LIGHT_PLAYER_SPAWN.position.z,
        ),
    focus: rangeRoverReview
      ? new Vector3(-5.45,1.10,10.55)
      : new Vector3(
          FIRST_LIGHT_CAMERA_FOCUS.position.x,
          FIRST_LIGHT_CAMERA_FOCUS.position.y,
          FIRST_LIGHT_CAMERA_FOCUS.position.z,
        ),
    location: "South Ward // First Light",
    objective: rangeRoverReview
      ? "VEH-007 Range Rover: approach and press F to drive; F exit when stopped"
      : "Enter the South Ward garage and return to the street",
    buildings,
    urbanSurfaces,
    streetContext,
    forestryReport: streetPlan.forestry,
    materialLibrary,
    environment,
    garageInterior,
    rangeRoverReview,
    rangeRoverReviewReady: rangeRoverReview?.ready ?? null,
    shadowGenerator: environment.shadowGenerator,
    suspendParkedCarColliders() {
      if (disposed) throw new Error("Cannot suspend car colliders after world disposal");
      for (const [itemId, handle] of parkedCollisionHandles) {
        handle.dispose();
        const index = contextCollision.indexOf(handle);
        if (index !== -1) contextCollision.splice(index, 1);
        parkedCollisionHandles.delete(itemId);
      }
    },
    releaseParkedCarCollider(itemId) {
      if (disposed) throw new Error("Cannot release parked-car collision after world disposal");
      if (!parkedById.has(itemId)) throw new Error("Unknown parked-car slot: " + itemId);
      const handle = parkedCollisionHandles.get(itemId);
      if (!handle) throw new Error("Parked-car collision unavailable for trial: " + itemId);
      handle.dispose();
      parkedCollisionHandles.delete(itemId);
      const index = contextCollision.indexOf(handle);
      if (index !== -1) contextCollision.splice(index, 1);
    },
    replaceParkedCarCollider(itemId, dimensions) {
      if (disposed) throw new Error("Cannot update parked-car collision after world disposal");
      if (![dimensions.x, dimensions.y, dimensions.z].every(
        (value) => Number.isFinite(value) && value > 0,
      )) throw new Error("Invalid imported parked-car dimensions");
      const item = parkedById.get(itemId);
      const prior = parkedCollisionHandles.get(itemId);
      if (!item) throw new Error("Unknown parked-car collider: " + itemId);
      // Allocate the new collider first; if allocation fails the old one remains.
      const replacement = physics.addStaticBox(
        {
          x: item.position.x,
          y: item.position.y + dimensions.y / 2,
          z: item.position.z,
        },
        { x: dimensions.x / 2, y: dimensions.y / 2, z: dimensions.z / 2 },
        item.yawRadians,
      );
      if (prior) {
        prior.dispose();
        const index = contextCollision.indexOf(prior);
        if (index !== -1) contextCollision.splice(index, 1);
      }
      parkedCollisionHandles.set(itemId, replacement);
      contextCollision.push(replacement);
    },
    get interiorState() {
      return interiorState;
    },
    get environmentSnapshot() {
      return environmentSnapshot;
    },
    update(realSeconds, playerPosition) {
      environmentSnapshot = environment.update(realSeconds);
      interiorState = heroGarage
        ? classifyGarageInterior(heroGarage, playerPosition)
        : "outside";
      if (heroGarage) applyGarageVisibility(heroGarage, interiorState);
    },
    setTimeMinutes(minutes) {
      environmentSnapshot = environment.setTimeMinutes(minutes);
      return environmentSnapshot;
    },
    setTimeScale(scale) {
      environmentSnapshot = environment.setTimeScale(scale);
      return environmentSnapshot;
    },
    dispose() {
      if (disposed) return;
      disposed = true;

      for (const handle of contextCollision) handle.dispose();
      for (const handle of urbanNavigationCollision) handle.dispose();
      for (const handle of garageInteriorCollision) handle.dispose();
      for (const handle of garagePropCollision) handle.dispose();
      for (const handle of garageThresholdCollision) handle.dispose();
      rangeRoverReview?.dispose();
      garageInterior?.dispose();
      environment.dispose();
      for (const building of buildings) building.dispose();
      streetContext.dispose();
      urbanSurfaces.dispose();
      materialLibrary.dispose();
      ground.collision.dispose();
      ground.mesh.dispose();
      ground.disposeTexture();
      ground.material.dispose();
    },
  };
}
