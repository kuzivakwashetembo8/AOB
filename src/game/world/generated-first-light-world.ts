import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  ShadowGenerator,
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

export interface GeneratedFirstLightWorld {
  readonly spawn: Vector3;
  readonly focus: Vector3;
  readonly location: string;
  readonly objective: string;
  readonly buildings: readonly GeneratedBuilding[];
  readonly urbanSurfaces: GeneratedUrbanSurfaces;
  readonly streetContext: GeneratedStreetContext;
  readonly materialLibrary: BuildingMaterialLibrary;
  readonly shadowGenerator: ShadowGenerator | null;
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

  const collision = physics.addStaticBox(
    { x: 0, y: -0.12, z: 20 },
    { x: 80, y: 0.12, z: 65 },
  );

  return { mesh, material, collision };
}

function createLighting(
  scene: Scene,
  enableShadows: boolean,
): {
  sky: HemisphericLight;
  sun: DirectionalLight;
  shadows: ShadowGenerator | null;
} {
  const sky = new HemisphericLight(
    "generated-first-light-sky",
    new Vector3(0.2, 1, -0.15),
    scene,
  );
  sky.intensity = 0.82;
  sky.diffuse = new Color3(0.72, 0.77, 0.78);
  sky.groundColor = new Color3(0.15, 0.14, 0.13);

  const sun = new DirectionalLight(
    "generated-first-light-sun",
    new Vector3(-0.5, -1, 0.38),
    scene,
  );
  sun.position = new Vector3(24, 34, -18);
  sun.intensity = 1.05;
  sun.diffuse = new Color3(1, 0.83, 0.66);
  sun.shadowMinZ = 0.1;
  sun.shadowMaxZ = 140;
  sun.autoUpdateExtends = true;

  const engine = scene.getEngine() as {
    getClassName?: () => string;
    constructor?: { name?: string };
  };
  const headless =
    engine.getClassName?.() === "NullEngine" ||
    engine.constructor?.name === "NullEngine";

  if (!enableShadows || headless) {
    return { sky, sun, shadows: null };
  }

  const shadows = new ShadowGenerator(2048, sun);
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  shadows.bias = 0.0005;
  shadows.normalBias = 0.025;
  shadows.transparencyShadow = true;

  return { sky, sun, shadows };
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

export function createGeneratedFirstLightWorld(
  scene: Scene,
  physics: MeridianPhysics,
  options: GeneratedFirstLightWorldOptions = {},
): GeneratedFirstLightWorld {
  const enableCameraBlockers = options.enableCameraBlockers ?? true;
  const enableShadows = options.enableShadows ?? true;

  const { sky, sun, shadows } = createLighting(scene, enableShadows);
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
  const contextCollision = registerStreetContextCollision(physics);

  for (const mesh of urbanSurfaces.meshes) {
    mesh.receiveShadows = true;
  }

  if (shadows) {
    for (const building of buildings) {
      for (const mesh of building.meshes) {
        shadows.addShadowCaster(mesh);
      }
    }

    for (const mesh of streetContext.meshes) {
      mesh.receiveShadows = true;
      if (
        !mesh.name.startsWith("generated-public-space:") &&
        !mesh.name.startsWith("generated-grass-variation:")
      ) {
        shadows.addShadowCaster(mesh);
      }
    }
  }

  let disposed = false;
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
    objective: "Walk the generated South Ward garage corner",
    buildings,
    urbanSurfaces,
    streetContext,
    materialLibrary,
    shadowGenerator: shadows,
    dispose() {
      if (disposed) return;
      disposed = true;

      for (const handle of contextCollision) handle.dispose();
      for (const building of buildings) building.dispose();
      streetContext.dispose();
      urbanSurfaces.dispose();
      materialLibrary.dispose();
      ground.collision.dispose();
      shadows?.dispose();
      ground.mesh.dispose();
      ground.material.dispose();
      sun.dispose();
      sky.dispose();
    },
  };
}
