/**
 * EXP-VEH-001 — Import two publicly hosted, license-UNCLEARED reference
 * specimens into the *existing* parked-car slots for an isolated cost test.
 * Absolutely not a production-car source or a licensing determination.
 *
 * The initial legacy proxy stays intact while an import is pending or fails.
 * Successful imports disable ONLY matching visible proxy meshes. The existing
 * fixed Rapier collider, seeded street plan, world coordinates and garage
 * remain untouched. No GLB is copied into this repository.
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
  VEHICLE_CLASS_TARGET_LENGTH_METRES,
} from "./vehicle-probe-plan";

export interface ImportedCarProbe {
  report(): ImportedCarProbeReport;
  dispose(): void;
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
}

interface MutableAssetStatus {
  id: string;
  url: string;
  bytes: number;
  status: "loading" | "loaded" | "failed";
  loadMs: number | null;
  error: string | null;
}

export interface ImportedCarProbeReport {
  readonly experiment: "EXP-VEH-001";
  readonly state: "running" | "disposed";
  readonly copyright: "unverified third-party specimens — evaluation only";
  readonly slots: readonly SlotResult[];
  readonly assetSources: readonly {
    id: string;
    url: string;
    bytes: number;
    status: "loading" | "loaded" | "failed";
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
  }));
  const assetSources: MutableAssetStatus[] = Array.from(new Map(
    parked.map((_, index) => {
      const source = sourceForExistingSlot(index);
      return [source.id, {
        id: source.id,
        url: source.rootUrl + source.fileName,
        bytes: source.bytes,
        status: "loading" as "loading" | "loaded" | "failed",
        loadMs: null as number | null,
        error: null as string | null,
      } as MutableAssetStatus] as const;
    }),
  ).values());
  const templates: AssetContainer[] = [];
  const liveEntries: Array<ReturnType<AssetContainer["instantiateModelsToScene"]>> = [];
  const roots: TransformNode[] = [];
  let disposed = false;

  function report(): ImportedCarProbeReport {
    return {
      experiment: "EXP-VEH-001",
      state: disposed ? "disposed" : "running",
      copyright: "unverified third-party specimens — evaluation only",
      slots: slotResults.map((slot) => ({ ...slot })),
      assetSources: assetSources.map((source) => ({ ...source })),
    };
  }

  async function loadModels(): Promise<void> {
    // Only code-split/download the GLB loader for explicitly requested probe.
    await import("@babylonjs/loaders/glTF");
    if (disposed) return;
    const grouped = new Map(
      parked.map((item, index) => [item.id, sourceForExistingSlot(index)] as const),
    );
    await Promise.all(assetSources.map(async (asset) => {
      const source = Array.from(grouped.values()).find((entry) => entry.id === asset.id)!;
      const started = performance.now();
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
              VEHICLE_CLASS_TARGET_LENGTH_METRES[source.id],
            );
            slot.fit = fit;
            centerOffset.position.set(-bounds.center.x, -bounds.floorY, -bounds.center.z);
            uniformFit.scaling.setAll(fit.uniformScale);
            orientation.rotation.y = fit.rotateYRadians;
            anchor.position.set(item.position.x, item.position.y, item.position.z);
            anchor.rotation.y = item.yawRadians;
            anchor.scaling.setAll(item.scale);
            slot.finalVisualMetres = {
              width: fit.originalWidth * fit.uniformScale * item.scale,
              height: fit.originalHeight * fit.uniformScale * item.scale,
              length: fit.originalLength * fit.uniformScale * item.scale,
            };

            for (const mesh of visuals) {
              mesh.receiveShadows = true;
              world.environment.addShadowCaster(mesh);
            }
            // Fallback meshes remain owned by the generated street context
            // and will be disposed by it. Disabled proxies do not render.
            for (const mesh of world.streetContext.meshes) {
              if (
                mesh.name === "generated-car-body:" + item.id ||
                mesh.name === "generated-car-cabin:" + item.id ||
                mesh.name.startsWith("generated-car-wheel:" + item.id + ":")
              ) mesh.setEnabled(false);
            }
            slot.status = "imported";
            slot.loadMs = asset.loadMs;
          } catch (slotError) {
            current.dispose();
            slot.status = "fallback";
            slot.failure = String(slotError);
          }
        }
      } catch (error) {
        asset.status = "failed";
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
  }

  void loadModels().catch((error) => {
    for (const slot of slotResults) {
      if (slot.status !== "loading") continue;
      slot.status = "fallback";
      slot.failure = String(error);
    }
    for (const asset of assetSources) {
      if (asset.status !== "loading") continue;
      asset.status = "failed";
      asset.error = String(error);
    }
    console.warn("[EXP-VEH-001] Importer failed; preserving original parked cars.", error);
  });

  return {
    report,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const entry of liveEntries) entry.dispose();
      for (const root of roots) root.dispose(false, false);
      for (const template of templates) template.dispose();
    },
  };
}
