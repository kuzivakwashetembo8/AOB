import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { MeridianPhysics } from "../physics/rapier-world";
import { createFirstLightWorld } from "./first-light-world";
import { FIRST_LIGHT_CITY_SPEC } from "../world-generation";
import {
  createGeneratedFirstLightWorld,
  type GeneratedFirstLightWorld,
} from "./generated-first-light-world";

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
  world: GeneratedFirstLightWorld;
}> {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
  });
  const scene = new Scene(engine);
  configureComparisonScene(scene);
  const physics = await MeridianPhysics.create();
  const world = createGeneratedFirstLightWorld(scene, physics, {
    enableCameraBlockers: true,
    enableShadows: true,
  });
  createOverviewCamera(scene, "generated-first-light-comparison-camera");

  engine.runRenderLoop(() => scene.render());
  return { engine, scene, physics, world };
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
      buildingCount: generated.world.buildings.length,
      roadSegmentCount: FIRST_LIGHT_CITY_SPEC.roads.segments.length,
      intersectionCount: FIRST_LIGHT_CITY_SPEC.roads.intersections.length,
      generatedMeshCount: generated.world.buildings.reduce(
        (total, building) => total + building.meshes.length,
        0,
      ),
      generatedColliderCount: generated.world.buildings.reduce(
        (total, building) => total + building.colliderCount,
        0,
      ),
      urbanMeshCount: generated.world.urbanSurfaces.meshes.length,
      contextItemCount: generated.world.streetContext.itemCount,
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

        generated?.world.dispose();
        generated?.scene.dispose();
        generated?.engine.dispose();
        generated?.physics.destroy();

        authored?.scene.dispose();
        authored?.engine.dispose();
        authored?.physics.destroy();
      },
    };
  } catch (error) {
    generated?.world.dispose();
    generated?.scene.dispose();
    generated?.engine.dispose();
    generated?.physics.destroy();

    authored?.scene.dispose();
    authored?.engine.dispose();
    authored?.physics.destroy();
    throw error;
  }
}
