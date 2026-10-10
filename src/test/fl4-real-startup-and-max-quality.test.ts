import { describe, expect, it } from "vitest";
import { renderHardwareScale } from "../game/renderer/render-clarity";
import {
  applyStartupCheckpoint,
  initialStartupChecklist,
  startupCompletion,
} from "../game/core/loading-checklist";
import { resolveFL4RasterOverride } from "../game/debug/fl4-quality-trial";

describe("FL4 real first-light startup gate", () => {
  it("begins pending, checks only actual terminal outcomes, and never marks an active vehicle as done", () => {
    let checklist = initialStartupChecklist();
    expect(startupCompletion(checklist)).toEqual({
      resolved: 0, total: 8, failed: 0, percent: 0, settled: false,
    });
    for (const id of ["renderer", "physics", "world", "voight", "vehicle-loader"] as const) {
      checklist = applyStartupCheckpoint(checklist, { id, status: "done" });
    }
    checklist = applyStartupCheckpoint(checklist, { id: "vehicle-offroad", status: "running" });
    checklist = applyStartupCheckpoint(checklist, { id: "vehicle-sports", status: "running" });
    expect(startupCompletion(checklist).settled).toBe(false);
    expect(startupCompletion(checklist).percent).toBeLessThan(100);
    expect(checklist.filter((entry) => entry.status === "done")).toHaveLength(5);
    checklist = applyStartupCheckpoint(checklist, { id: "vehicle-offroad", status: "done" });
    checklist = applyStartupCheckpoint(checklist, { id: "vehicle-sports", status: "done" });
    expect(startupCompletion(checklist).settled).toBe(false);
    checklist = applyStartupCheckpoint(checklist, { id: "first-frame", status: "done" });
    expect(startupCompletion(checklist)).toMatchObject({ resolved: 8, percent: 100, settled: true });
  });

  it("retains failure and skip states rather than laundering failed assets into success", () => {
    let entries = initialStartupChecklist();
    for (const item of entries) {
      entries = applyStartupCheckpoint(entries, { id: item.id, status: "done" });
    }
    entries = applyStartupCheckpoint(entries, {
      id: "vehicle-sports", status: "failed", detail: "Model unavailable",
    });
    expect(startupCompletion(entries)).toEqual({
      resolved: 8, total: 8, failed: 1, percent: 100, settled: true,
    });
    expect(entries.find((entry) => entry.id === "vehicle-sports")).toMatchObject({
      status: "failed", detail: "Model unavailable",
    });
    entries = applyStartupCheckpoint(entries, { id: "vehicle-offroad", status: "skipped" });
    expect(entries.find((entry) => entry.id === "vehicle-offroad")?.status).toBe("skipped");
  });
});

describe("FL4 maximum mobile raster stress trial", () => {
  const trial = (query: string) => resolveFL4RasterOverride(new URLSearchParams(query));

  it("cannot silently change normal /game or persisted presets", () => {
    expect(trial("fl4QualityTrial=supernative").hardwareScale).toBeNull();
    expect(trial("fl4Diagnostics=0&fl4QualityTrial=native").trial).toBeNull();
    expect(trial("fl4Diagnostics=1&fl4QualityTrial=invalid").hardwareScale).toBeNull();
    expect(renderHardwareScale({ mode: "Auto", devicePixelRatio: 3, coarsePointer: true }))
      .toBeCloseTo(3 / 1.75);
  });

  it("supports explicit real native and 1.25x native opt-in without changing source scene quality", () => {
    expect(trial("fl4Diagnostics=1&fl4QualityTrial=native")).toEqual({
      trial: "native", hardwareScale: 1, source: "quality-trial",
    });
    expect(trial("fl4Diagnostics=1&fl4QualityTrial=supernative")).toEqual({
      trial: "supernative", hardwareScale: 0.8, source: "quality-trial",
    });
  });

  it("honors valid explicit scaling and rejects unsafe accidental overrides", () => {
    expect(trial("fl4Diagnostics=1&fl4QualityTrial=supernative&fl4Scale=1.3")).toMatchObject({
      hardwareScale: 1.3, source: "explicit-scale",
    });
    expect(trial("fl4Diagnostics=1&fl4QualityTrial=native&fl4Scale=0.2").hardwareScale).toBe(1);
    expect(trial("fl4Diagnostics=1&fl4Scale=").hardwareScale).toBeNull();
    expect(trial("fl4Diagnostics=1&fl4Scale=not-a-number").hardwareScale).toBeNull();
    expect(trial("fl4Diagnostics=1&fl4Scale=0.75").hardwareScale).toBe(0.75);
  });
});
