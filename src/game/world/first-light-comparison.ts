import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { MeridianPhysics } from "../physics/rapier-world";
import { createFirstLightWorld } from "./first-light-world";
import {
  BuildingMaterialLibrary,
  FIRST_LIGHT_CITY_SPEC,
  createGeneratedStreetContext,
  createGeneratedUrbanSurfaces,
  generateBuilding,
  resolveCityBuildings,
} from "../world-generation";
import type {
  GeneratedBuilding,
  GeneratedStreetContext,
  GeneratedUrbanSurfaces,
} from "../world-generation";

export interface FirstLightComparisonStats {
  readonly buildingCount: number;
  readonly roadSegmentCount: number;
  readonly intersectionCount: number;
  readonly generatedMeshCount: number;
  readonly generatedColliderCount: number;
  readonly urbanMeshCount: number;
  readonly contextItemCount: number;
}

export interface FirstLightComparisonRuntime {
  readonly stats: FirstLightComparisonStats;
  dispose(): void;
}

function createOverviewCamera(scene: Scene, name: string): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    name,
    -Math.PI / 3.2,
    1.02,
    92,
    new Vector3(0, 8, 24),
    scene,
  );
  camera.lowerRadiusLimit = 35;
  camera.upperRadiusLimit = 130;
  camera.lowerBetaLimit = 0.35;
  camera.upperBetaLimit = 1.45;
  camera.minZ = 0.1;
  camera.fov = 0.82;
  scene.activeCamera = camera;
  return camera;
}

function configureComparisonScene(scene: Scene): void {
  scene.clearColor = new Color4(0.055, 0.075, 0.09, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0045;
  scene.fogColor = new Color3(0.09, 0.12, 0.14);
}

function createGeneratedLighting(
  scene: Scene,
): { sun: DirectionalLight; shadows: ShadowGenerator } {
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

  const shadows = new ShadowGenerator(2048, sun);
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  shadows.bias = 0.0005;
  shadows.normalBias = 0.025;
  shadows.transparencyShadow = true;

  return { sun, shadows };
}

function createGeneratedGround(scene: Scene): void {
  const material = new StandardMaterial("generated-ground-material", scene);
  material.diffuseColor = new Color3(0.17, 0.16, 0.14);
  material.specularColor = Color3.Black();

  const ground = MeshBuilder.CreateGround(
    "generated-first-light-ground",
    { width: 160, height: 130 },
    scene,
  );
  ground.position.z = 20;
  ground.material = material;
  ground.receiveShadows = true;
}

async function createAuthoredRuntime(
  canvas: HTMLCanvasElement,
): Promise<{
  engine: Engine;
  scene: Scene;
  physics: MeridianPhysics;
}> {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
  });
  const scene = new Scene(engine);
  configureComparisonScene(scene);
  const physics = await MeridianPhysics.create();
  createFirstLightWorld(scene, physics);
  createOverviewCamera(scene, "authored-first-light-comparison-camera");
  engine.runRenderLoop(() => scene.render());
  return { engine, scene, physics };
}

async function createGeneratedRuntime(
  canvas: HTMLCanvasElement,
): Promise<{
  engine: Engine;
  scene: Scene;
  physics: MeridianPhysics;
  buildings: GeneratedBuilding[];
  materialLibrary: BuildingMaterialLibrary;
  urbanSurfaces: GeneratedUrbanSurfaces;
  streetContext: GeneratedStreetContext;
}> {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
  });
  const scene = new Scene(engine);
  configureComparisonScene(scene);
  const { shadows } = createGeneratedLighting(scene);
  createGeneratedGround(scene);
  const urbanSurfaces = createGeneratedUrbanSurfaces(
    scene,
    FIRST_LIGHT_CITY_SPEC,
  );
  const streetContext = createGeneratedStreetContext(
    scene,
    FIRST_LIGHT_CITY_SPEC,
  );
  createOverviewCamera(scene, "generated-first-light-comparison-camera");

  const physics = await MeridianPhysics.create();
  const materialLibrary = new BuildingMaterialLibrary(scene);
  const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC).map((spec) =>
    generateBuilding(scene, physics, spec, {
      generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion,
      materialLibrary,
      enableFacadeDetails: true,
      batchingMode: "thin-instances",
      enableCameraBlockers: false,
    }),
  );

  for (const mesh of urbanSurfaces.meshes) {
    mesh.receiveShadows = true;
  }

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

  engine.runRenderLoop(() => scene.render());
  return {
    engine,
    scene,
    physics,
    buildings,
    materialLibrary,
    urbanSurfaces,
    streetContext,
  };
}

export async function bootstrapFirstLightComparison(
  authoredCanvas: HTMLCanvasElement,
  generatedCanvas: HTMLCanvasElement,
): Promise<FirstLightComparisonRuntime> {
  let authored:
    | Awaited<ReturnType<typeof createAuthoredRuntime>>
    | undefined;
  let generated:
    | Awaited<ReturnType<typeof createGeneratedRuntime>>
    | undefined;

  try {
    authored = await createAuthoredRuntime(authoredCanvas);
    generated = await createGeneratedRuntime(generatedCanvas);

    const stats: FirstLightComparisonStats = {
      buildingCount: generated.buildings.length,
      roadSegmentCount: FIRST_LIGHT_CITY_SPEC.roads.segments.length,
      intersectionCount: FIRST_LIGHT_CITY_SPEC.roads.intersections.length,
      generatedMeshCount: generated.buildings.reduce(
        (total, building) => total + building.meshes.length,
        0,
      ),
      generatedColliderCount: generated.buildings.reduce(
        (total, building) => total + building.colliderCount,
        0,
      ),
      urbanMeshCount: generated.urbanSurfaces.meshes.length,
      contextItemCount: generated.streetContext.itemCount,
    };

    const resize = () => {
      authored?.engine.resize();
      generated?.engine.resize();
    };
    window.addEventListener("resize", resize);

    let disposed = false;
    return {
      stats,
      dispose() {
        if (disposed) return;
        disposed = true;
        window.removeEventListener("resize", resize);

        for (const building of generated?.buildings ?? []) {
          building.dispose();
        }
        generated?.streetContext.dispose();
        generated?.urbanSurfaces.dispose();
        generated?.materialLibrary.dispose();
        generated?.scene.dispose();
        generated?.engine.dispose();
        generated?.physics.destroy();

        authored?.scene.dispose();
        authored?.engine.dispose();
        authored?.physics.destroy();
      },
    };
  } catch (error) {
    for (const building of generated?.buildings ?? []) {
      building.dispose();
    }
    generated?.streetContext.dispose();
    generated?.urbanSurfaces.dispose();
    generated?.materialLibrary.dispose();
    generated?.scene.dispose();
    generated?.engine.dispose();
    generated?.physics.destroy();

    authored?.scene.dispose();
    authored?.engine.dispose();
    authored?.physics.destroy();
    throw error;
  }
}
