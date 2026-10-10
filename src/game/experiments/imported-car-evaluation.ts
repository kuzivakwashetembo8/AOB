/**
 * EXP-VEH-001 — Import two publicly hosted, license-UNCLEARED reference
 * specimens into the *existing* parked-car slots for an isolated cost test.
 * Absolutely not a production-car source or a licensing determination.
 *
 * The initial legacy proxy stays intact while an import is pending or fails.
 * Successful imports disable ONLY matching visible proxy meshes. The existing
 * seeded street plan, world coordinates and garage remain untouched. Each
 * successfully imported car receives a matching static Rapier cuboid; a failed
 * import keeps its original collider. No GLB is copied into this repository.
 */
import {
  AbstractMesh,
  TransformNode,
  Vector3,
  loadAssetContainerAsync,
} from "@babylonjs/core";
import type { AssetContainer, Scene } from "@babylonjs/core";
import {
  FIRST_LIGHT_CITY_SPEC,
  planStreetContext,
} from "../world-generation";
import type { GeneratedFirstLightWorld } from "../world/generated-first-light-world";
import {
  planImportedVehicleFit,
  sourceForExistingSlot,
} from "./vehicle-probe-plan";
import {
  selectVehicleShadowCasterIds,
  usesSelectiveVehicleShadows,
  usesVehicleDistanceLOD,
  wantsFullVehicleDetail,
  type FL4VehicleOptimizationMode,
} from "./fl4-vehicle-optimization";

export interface ImportedCarProbe {
  report(): ImportedCarProbeReport;
  dispose(): void;
}

export interface ImportedCarProbeOptions {
  /** Diagnostic-only. The accepted development visual is unchanged by default. */
  readonly optimizationMode?: FL4VehicleOptimizationMode;
}

type SlotStatus = "loading" | "imported" | "fallback";

interface SlotResult {
  readonly id: string;
  readonly source: string;
  status: SlotStatus;
  loadMs: number | null;
  fit: ReturnType<typeof planImportedVehicleFit> | null;
  finalVisualMetres: { width: number; height: number; length: number } | null;
  failure: string | null;
  colliderCalibrated: boolean;
}

type AssetLoadStage = "awaiting-loader" | "loading-model" | "instantiating" | "complete" | "failed";
type ImportPipelineStage = "initializing-gltf-loader" | "loading-models" | "settled" | "failed";

interface MutableAssetStatus {
  id: string;
  url: string;
  bytes: number;
  status: "loading" | "loaded" | "failed";
  stage: AssetLoadStage;
  // Timestamp used only to calculate elapsed pending time in report().
  startedAtMs: number | null;
  loadMs: number | null;
  error: string | null;
}

export interface ImportedCarProbeReport {
  readonly experiment: "EXP-VEH-001";
  readonly state: "running" | "disposed";
  readonly copyright: "unverified third-party specimens — evaluation only";
  /** Diagnostic-only: separates module initialization from remote asset work. */
  readonly pipeline: {
    stage: ImportPipelineStage;
    elapsedMs: number;
    loaderInitializationMs: number | null;
  };
  readonly optimization?: {
    readonly mode: FL4VehicleOptimizationMode;
    readonly selectedVehicleShadowCasters: number;
    readonly originalImportedSubmeshes: number;
    readonly fullDetailSlots: number;
    readonly distantProxySlots: number;
  };
  readonly slots: readonly SlotResult[];
  readonly assetSources: readonly {
    id: string;
    url: string;
    bytes: number;
    status: "loading" | "loaded" | "failed";
    stage: AssetLoadStage;
    /** Ongoing elapsed wall time, or null once a terminal result is reached. */
    pendingMs: number | null;
    loadMs: number | null;
    error: string | null;
  }[];
}

function modelBounds(meshes: readonly AbstractMesh[]): {
  size: { x: number; y: number; z: number };
  center: Vector3;
  floorY: number;
} {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const mesh of meshes) {
    if (!mesh.getTotalVertices()) continue;
    mesh.computeWorldMatrix(true);
    const bounds = mesh.getBoundingInfo().boundingBox;
    minX = Math.min(minX, bounds.minimumWorld.x);
    minY = Math.min(minY, bounds.minimumWorld.y);
    minZ = Math.min(minZ, bounds.minimumWorld.z);
    maxX = Math.max(maxX, bounds.maximumWorld.x);
    maxY = Math.max(maxY, bounds.maximumWorld.y);
    maxZ = Math.max(maxZ, bounds.maximumWorld.z);
  }
  return {
    size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
    center: new Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2),
    floorY: minY,
  };
}

export function beginImportedCarEvaluation(
  scene: Scene,
  world: GeneratedFirstLightWorld,
  options: ImportedCarProbeOptions = {},
): ImportedCarProbe {
  const parked = planStreetContext(FIRST_LIGHT_CITY_SPEC).items
    .filter((item) => item.kind === "parked-car")
    .sort((a, b) => a.id.localeCompare(b.id));
  const slotResults: SlotResult[] = parked.map((item, index) => ({
    id: item.id,
    source: sourceForExistingSlot(index).id,
    status: "loading",
    loadMs: null,
    fit: null,
    finalVisualMetres: null,
    failure: null,
    colliderCalibrated: false,
  }));
  const assetSources: MutableAssetStatus[] = Array.from(new Map(
    parked.map((_, index) => {
      const source = sourceForExistingSlot(index);
      return [source.id, {
        id: source.id,
        url: source.rootUrl + source.fileName,
        bytes: source.bytes,
        status: "loading" as "loading" | "loaded" | "failed",
        stage: "awaiting-loader" as AssetLoadStage,
        startedAtMs: null as number | null,
        loadMs: null as number | null,
        error: null as string | null,
      } as MutableAssetStatus] as const;
    }),
  ).values());
  const optimizationMode = options.optimizationMode ?? "full";
  const selectiveShadows = usesSelectiveVehicleShadows(optimizationMode);
  const distanceLOD = usesVehicleDistanceLOD(optimizationMode);
  const distanceSlots: Array<{
    readonly id: string;
    readonly x: number;
    readonly z: number;
    readonly detailedRoot: TransformNode;
    readonly fallbackMeshes: AbstractMesh[];
    fullDetail: boolean;
  }> = [];
  let selectedVehicleShadowCasters = 0;
  let originalImportedSubmeshes = 0;
  const templates: AssetContainer[] = [];
  const liveEntries: Array<ReturnType<AssetContainer["instantiateModelsToScene"]>> = [];
  const roots: TransformNode[] = [];
  let disposed = false;
  const pipelineStart = performance.now();
  let pipelineStage: ImportPipelineStage = "initializing-gltf-loader";
  let loaderInitializationMs: number | null = null;
  // Updating enabled states, not geometry buffers or colliders. When the
  // camera is far away we reuse the original already-created proxy as LOD.
  const beforeRenderObserver = distanceLOD
    ? scene.onBeforeRenderObservable.add(() => {
      const camera = scene.activeCamera;
      if (!camera) return;
      for (const slot of distanceSlots) {
        const distance = Math.hypot(camera.position.x - slot.x, camera.position.z - slot.z);
        const detailed = wantsFullVehicleDetail(slot.fullDetail, distance);
        if (detailed === slot.fullDetail) continue;
        slot.fullDetail = detailed;
        slot.detailedRoot.setEnabled(detailed);
        for (const fallback of slot.fallbackMeshes) fallback.setEnabled(!detailed);
      }
    })
    : null;

  function report(): ImportedCarProbeReport {
    const now = performance.now();
    return {
      experiment: "EXP-VEH-001",
      state: disposed ? "disposed" : "running",
      copyright: "unverified third-party specimens — evaluation only",
      pipeline: {
        stage: pipelineStage,
        elapsedMs: Math.round(now - pipelineStart),
        loaderInitializationMs,
      },
      optimization: {
        mode: optimizationMode,
        selectedVehicleShadowCasters,
        originalImportedSubmeshes,
        fullDetailSlots: distanceLOD
          ? distanceSlots.filter((slot) => slot.fullDetail).length
          : slotResults.filter((slot) => slot.status === "imported").length,
        distantProxySlots: distanceLOD
          ? distanceSlots.filter((slot) => !slot.fullDetail).length
          : 0,
      },
      slots: slotResults.map((slot) => ({ ...slot })),
      assetSources: assetSources.map(({ startedAtMs, ...source }) => ({
        ...source,
        pendingMs: source.status === "loading"
          ? Math.round(now - (startedAtMs ?? pipelineStart))
          : null,
      })),
    };
  }

  async function loadModels(): Promise<void> {
    // Only code-split/download the GLB loader for explicitly requested probe.
    await import("@babylonjs/loaders/glTF");
    loaderInitializationMs = Math.round(performance.now() - pipelineStart);
    if (disposed) return;
    pipelineStage = "loading-models";
    const grouped = new Map(
      parked.map((item, index) => [item.id, sourceForExistingSlot(index)] as const),
    );
    await Promise.all(assetSources.map(async (asset) => {
      const source = Array.from(grouped.values()).find((entry) => entry.id === asset.id)!;
      const started = performance.now();
      asset.startedAtMs = started;
      asset.stage = "loading-model";
      let container: AssetContainer | null = null;
      try {
        container = await loadAssetContainerAsync(source.rootUrl + source.fileName, scene);
        asset.loadMs = performance.now() - started;
        if (disposed) {
          container.dispose();
          return;
        }
        templates.push(container);
        asset.status = "loaded";
        asset.stage = "instantiating";

        const matching = parked.filter((item) => grouped.get(item.id)?.id === source.id);
        for (const item of matching) {
          const slot = slotResults.find((entry) => entry.id === item.id)!;
          const current = container.instantiateModelsToScene(
            (sourceName) => "vehicle-probe:" + item.id + ":" + sourceName,
            false,
          );
          liveEntries.push(current);
          const anchor = new TransformNode("vehicle-probe-anchor:" + item.id, scene);
          const orientation = new TransformNode("vehicle-probe-orientation:" + item.id, scene);
          const uniformFit = new TransformNode("vehicle-probe-fit:" + item.id, scene);
          const centerOffset = new TransformNode("vehicle-probe-origin:" + item.id, scene);
          roots.push(anchor);
          orientation.parent = anchor;
          uniformFit.parent = orientation;
          centerOffset.parent = uniformFit;
          for (const node of current.rootNodes) node.parent = centerOffset;

          const modelMeshes = new Set<AbstractMesh>();
          for (const node of current.rootNodes) {
            if (node instanceof AbstractMesh) modelMeshes.add(node);
            for (const mesh of node.getChildMeshes(false)) modelMeshes.add(mesh);
          }
          const visuals = [...modelMeshes];
          try {
            const bounds = modelBounds(visuals);
            const fit = planImportedVehicleFit(
              bounds.size,
              source.targetLengthMeters,
              item.scale,
              { widthMultiplier: source.widthMultiplier, heightMultiplier: source.heightMultiplier },
            );
            slot.fit = fit;
            centerOffset.position.set(-bounds.center.x, -bounds.floorY, -bounds.center.z);
            uniformFit.scaling.setAll(fit.uniformScale);
            orientation.rotation.y = fit.rotateYRadians;
            anchor.position.set(item.position.x, item.position.y, item.position.z);
            anchor.rotation.y = item.yawRadians;
            // Width and height are calibrated in parked-car LOCAL/world
            // transverse/vertical axes AFTER source-long-axis rotation.
            // Length remains controlled by the original uniform fit.
            anchor.scaling.set(
              item.scale * fit.shapeAdjustment.widthMultiplier,
              item.scale * fit.shapeAdjustment.heightMultiplier,
              item.scale,
            );
            slot.finalVisualMetres = {
              width: fit.worldDimensions.x,
              height: fit.worldDimensions.y,
              length: fit.worldDimensions.z,
            };

            // All imported geometry remains full quality in the main camera
            // pass. Only shadow-map participation is reduced in the opt-in
            // selectiveShadows / combined diagnostic variants.
            const shadowIds = selectiveShadows
              ? new Set(selectVehicleShadowCasterIds(visuals.map((mesh) => {
                mesh.computeWorldMatrix(true);
                const bounds = mesh.getBoundingInfo().boundingBox;
                return {
                  id: mesh.uniqueId.toString(),
                  vertices: mesh.getTotalVertices(),
                  width: bounds.maximumWorld.x - bounds.minimumWorld.x,
                  height: bounds.maximumWorld.y - bounds.minimumWorld.y,
                  length: bounds.maximumWorld.z - bounds.minimumWorld.z,
                };
              })))
              : null;
            for (const mesh of visuals) {
              mesh.receiveShadows = true;
              const geometric = mesh.getTotalVertices() > 0;
              if (geometric) originalImportedSubmeshes++;
              if (shadowIds) {
                // Only actual selected geometry participates in this test;
                // no descendant recursion that would defeat the isolation.
                if (!geometric || !shadowIds.has(mesh.uniqueId.toString())) continue;
                world.shadowGenerator?.addShadowCaster(mesh, false);
              } else {
                // EXACT pre-experiment shadow path: keep root/parent nodes and
                // Babylon descendant registration unchanged for the A/B control.
                world.environment.addShadowCaster(mesh);
              }
              if (geometric) selectedVehicleShadowCasters++;
            }
            // Convert only this successfully imported vehicle's static Rapier
            // box to its actual rendered dimensions; failure slots preserve
            // the old visual and original collider without modification.
            world.replaceParkedCarCollider(item.id, fit.worldDimensions);
            slot.colliderCalibrated = true;
            // Retain the existing procedural visuals as distant visual LOD,
            // but keep the approved GLB at full quality near Voight.
            // Full and proxy representations are never active together.
            const fallbackMeshes = world.streetContext.meshes.filter((mesh) =>
              mesh.name === "generated-car-body:" + item.id ||
              mesh.name === "generated-car-cabin:" + item.id ||
              mesh.name.startsWith("generated-car-wheel:" + item.id + ":"),
            );
            for (const mesh of fallbackMeshes) mesh.setEnabled(false);
            if (distanceLOD) {
              distanceSlots.push({
                id: item.id,
                x: item.position.x,
                z: item.position.z,
                detailedRoot: anchor,
                fallbackMeshes,
                fullDetail: true,
              });
            }
            slot.status = "imported";
            slot.loadMs = asset.loadMs;
            if (fit.warnings.length > 0) {
              console.warn("[EXP-VEH-001] Check vehicle class dimensions against Meridian roads", item.id, fit.worldDimensions, fit.warnings);
            }
          } catch (slotError) {
            current.dispose();
            slot.status = "fallback";
            slot.failure = String(slotError);
          }
        }
        asset.stage = "complete";
      } catch (error) {
        asset.status = "failed";
        asset.stage = "failed";
        asset.error = String(error);
        asset.loadMs = performance.now() - started;
        for (const slot of slotResults) {
          if (slot.source !== asset.id) continue;
          slot.status = "fallback";
          slot.failure = asset.error;
        }
        console.warn("[EXP-VEH-001] Asset unavailable; using original parked proxies.", asset.id, error);
        if (container && !templates.includes(container)) container.dispose();
      }
    }));
    pipelineStage = "settled";
  }

  void loadModels().catch((error) => {
    pipelineStage = "failed";
    for (const slot of slotResults) {
      if (slot.status !== "loading") continue;
      slot.status = "fallback";
      slot.failure = String(error);
    }
    for (const asset of assetSources) {
      if (asset.status !== "loading") continue;
      asset.status = "failed";
      asset.stage = "failed";
      asset.error = String(error);
    }
    console.warn("[EXP-VEH-001] Importer failed; preserving original parked cars.", error);
  });

  return {
    report,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (beforeRenderObserver) scene.onBeforeRenderObservable.remove(beforeRenderObserver);
      distanceSlots.length = 0;
      for (const entry of liveEntries) entry.dispose();
      for (const root of roots) root.dispose(false, false);
      for (const template of templates) template.dispose();
    },
  };
}
