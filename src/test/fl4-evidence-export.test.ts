import { describe, expect, it } from "vitest";
import type { FL4Report } from "../game/debug/fl4-diagnostics";
import type { ImportedCarProbeReport } from "../game/experiments/imported-car-evaluation";
import { composeFL4EvidenceSnapshot } from "../game/debug/fl4-evidence-export";

describe("FL4 development device evidence export", () => {
  const metric = {
    schema: "gtd.fl4.v1",
    viewport: { width: 800, height: 400, dpr: 2 },
    render: { width: 800, height: 400, hardwareScalingLevel: 1 },
    samples: { count: 1800, frameMsP50: 16.7, frameMsP95: 22.1 },
  } as FL4Report;
  const capturedAt = "2026-10-10T15:00:00.000Z";

  it("preserves runtime resolution and frame evidence for the native baseline", () => {
    const evidence = composeFL4EvidenceSnapshot(
      metric,
      null,
      "https://preview.example/game?gtdVehicleProbe=baseline&fl4Diagnostics=1",
      capturedAt,
    );
    expect(evidence.schema).toBe("gtd.fl4.evidence.v1");
    expect(evidence.vehicleMode).toBe("baseline");
    expect(evidence.metrics).toBe(metric);
    expect(evidence.metrics.viewport.dpr).toBe(2);
    expect(evidence.metrics.samples.frameMsP95).toBe(22.1);
    expect(evidence.importedVehicles).toBeNull();
    expect(JSON.parse(JSON.stringify(evidence)).capturedAt).toBe(capturedAt);
  });

  it("includes imported-car loading/fit details without inventing GPU measures", () => {
    const imported: ImportedCarProbeReport = {
      experiment: "EXP-VEH-001",
      state: "running",
      copyright: "unverified third-party specimens — evaluation only",
      pipeline: { stage: "settled", elapsedMs: 500, loaderInitializationMs: 170 },
      slots: [{
        id: "parked:0",
        source: "sports",
        status: "imported",
        loadMs: 144,
        fit: null,
        finalVisualMetres: { width: 2, height: 1.4, length: 4.53 },
        failure: null,
        colliderCalibrated: true,
      }],
      assetSources: [],
    };
    const evidence = composeFL4EvidenceSnapshot(
      metric,
      imported,
      "https://preview.example/game?fl4Diagnostics=1",
      capturedAt,
    );
    expect(evidence.vehicleMode).toBe("imports");
    expect(evidence.importedVehicles?.slots[0]?.status).toBe("imported");
    expect(evidence.metrics.render.hardwareScalingLevel).toBe(1);
    expect(Object.keys(evidence)).not.toContain("gpuMemory");
  });

  it("preserves loader bootstrap versus pending remote-model stages in export", () => {
    const base = {
      experiment: "EXP-VEH-001",
      state: "running",
      copyright: "unverified third-party specimens — evaluation only",
      slots: [],
    } as const;
    const awaiting: ImportedCarProbeReport = {
      ...base,
      pipeline: {
        stage: "initializing-gltf-loader",
        elapsedMs: 52000,
        loaderInitializationMs: null,
      },
      assetSources: [{
        id: "sports",
        url: "https://example.test/ferrari.glb",
        bytes: 100,
        status: "loading",
        stage: "awaiting-loader",
        pendingMs: 52000,
        loadMs: null,
        error: null,
      }],
    };
    const report = composeFL4EvidenceSnapshot(metric, awaiting, "https://preview.example/game", capturedAt);
    const serialized = JSON.parse(JSON.stringify(report)) as typeof report;
    expect(serialized.importedVehicles?.pipeline.stage).toBe("initializing-gltf-loader");
    expect(serialized.importedVehicles?.pipeline.elapsedMs).toBe(52000);
    expect(serialized.importedVehicles?.assetSources[0]?.stage).toBe("awaiting-loader");
    expect(serialized.importedVehicles?.assetSources[0]?.pendingMs).toBe(52000);
  });
});
