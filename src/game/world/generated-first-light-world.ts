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
    switch (item.kind) {
      case "parked-car":
        handles.push(
          physics.addStaticBox(
            { x: item.position.x, y: 0.76, z: item.position.z },
            {
              x: 0.88 * item.scale,
              y: 0.76 * item.scale,
              z: 2.0 * item.scale,
            },
            item.yawRadians,
          ),
        );
        break;
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
): StaticCollisionHandle[] {
  const handles: StaticCollisionHandle[] = [];
  for (const mesh of urbanSurfaces.meshes) {
    if (!mesh.name.includes("curb")) continue;
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
  const urbanNavigationCollision = registerUrbanNavigationCollision(
    physics,
    urbanSurfaces,
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
