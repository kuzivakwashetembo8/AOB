import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
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
  readonly interiorState: InteriorVisibilityState;
  readonly environmentSnapshot: MeridianEnvironmentSnapshot;
  update(realSeconds: number, playerPosition: { x: number; y: number; z: number }): void;
  setTimeMinutes(minutes: number): MeridianEnvironmentSnapshot;
  setTimeScale(scale: number): MeridianEnvironmentSnapshot;
  dispose(): void;
}

export interface GeneratedFirstLightWorldOptions {
  readonly enableCameraBlockers?: boolean;
  readonly enableShadows?: boolean;
}

function createGround(
  scene: Scene,
  physics: MeridianPhysics,
): {
  mesh: Mesh;
  material: StandardMaterial;
  collision: StaticCollisionHandle;
} {
  const material = new StandardMaterial("generated-ground-material", scene);
  material.diffuseColor = new Color3(0.17, 0.16, 0.14);
  material.specularColor = Color3.Black();

  const mesh = MeshBuilder.CreateGround(
    "generated-first-light-ground",
    { width: 160, height: 130 },
    scene,
  );
  mesh.position.z = 20;
  mesh.material = material;
  mesh.receiveShadows = true;
  mesh.isPickable = true;
  mesh.metadata = {
    spatialRole: "terrain",
    cameraBlocker: true,
    cameraGround: true,
  };

  const collision = physics.addStaticBox(
    { x: 0, y: -0.12, z: 20 },
    { x: 80, y: 0.12, z: 65 },
  );

  return { mesh, material, collision };
}

function registerStreetContextCollision(
  physics: MeridianPhysics,
): StaticCollisionHandle[] {
  const handles: StaticCollisionHandle[] = [];
  const plan = planStreetContext(FIRST_LIGHT_CITY_SPEC);

  for (const item of plan.items) {
    if (item.kind !== "parked-car") continue;
    handles.push(
      physics.addStaticBox(
        {
          x: item.position.x,
          y: 0.76,
          z: item.position.z,
        },
        {
          x: 0.88 * item.scale,
          y: 0.76 * item.scale,
          z: 2.0 * item.scale,
        },
        item.yawRadians,
      ),
    );
  }

  return handles;
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

  const ground = createGround(scene, physics);
  const urbanSurfaces = createGeneratedUrbanSurfaces(
    scene,
    FIRST_LIGHT_CITY_SPEC,
  );
  const streetContext = createGeneratedStreetContext(
    scene,
    FIRST_LIGHT_CITY_SPEC,
  );
  const materialLibrary = new BuildingMaterialLibrary(scene);
  const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC).map((spec) =>
    generateBuilding(scene, physics, spec, {
      generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion,
      materialLibrary,
      enableFacadeDetails: true,
      batchingMode: "thin-instances",
      enableCameraBlockers,
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
  const contextCollision = registerStreetContextCollision(physics);

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
    spawn: new Vector3(
      FIRST_LIGHT_PLAYER_SPAWN.position.x,
      FIRST_LIGHT_PLAYER_SPAWN.position.y,
      FIRST_LIGHT_PLAYER_SPAWN.position.z,
    ),
    focus: new Vector3(
      FIRST_LIGHT_CAMERA_FOCUS.position.x,
      FIRST_LIGHT_CAMERA_FOCUS.position.y,
      FIRST_LIGHT_CAMERA_FOCUS.position.z,
    ),
    location: "South Ward // First Light",
    objective: "Enter the South Ward garage and return to the street",
    buildings,
    urbanSurfaces,
    streetContext,
    materialLibrary,
    environment,
    garageInterior,
    shadowGenerator: environment.shadowGenerator,
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
      garageInterior?.dispose();
      environment.dispose();
      for (const building of buildings) building.dispose();
      streetContext.dispose();
      urbanSurfaces.dispose();
      materialLibrary.dispose();
      ground.collision.dispose();
      ground.mesh.dispose();
      ground.material.dispose();
    },
  };
}
