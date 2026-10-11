import type { Mesh, Scene } from "@babylonjs/core";

/**
 * Observable witnesses of actual Babylon scene geometry draw submissions.
 * Unlike Scene.onAfterRenderObservable, a sky/car-only frame cannot pass.
 *
 * The live world deliberately does not register ground or Voight as shadow
 * casters, so their mesh callbacks represent the ordinary camera render pass.
 */
export interface WorldRenderWitnesses {
  readonly ground: Mesh;
  readonly voight: Mesh;
  /** Trial-only: asphalt + sidewalk require independent, genuine world draws. */
  readonly roadSurfaces?: readonly Mesh[];
  readonly sidewalkSurfaces?: readonly Mesh[];
  /** Trial-only: a genuine building draw is required, not only flat ground. */
  readonly buildingSurfaces?: readonly Mesh[];
  /** Real generated lane/stop markings, not drawn or faked by the witness. */
  readonly markingSurfaces?: readonly Mesh[];
}

export interface WorldFrameEvidence {
  readonly groundDrawn: boolean;
  readonly roadDrawn: boolean;
  readonly sidewalkDrawn: boolean;
  readonly buildingDrawn: boolean;
  readonly markingDrawn: boolean;
  readonly visibleUrbanSurfaceDrawn: boolean;
  readonly voightDrawn: boolean;
  readonly complete: boolean;
}

export function renderWorldEvidenceFrame(
  scene: Scene,
  witnesses: WorldRenderWitnesses,
): WorldFrameEvidence {
  let groundDrawn = false;
  let roadDrawn = false;
  let sidewalkDrawn = false;
  let buildingDrawn = false;
  let markingDrawn = false;
  let voightDrawn = false;
  const observers: Array<() => void> = [];
  const observe = (mesh: Mesh, onDraw: () => void) => {
    const observer = mesh.onAfterRenderObservable.add(onDraw);
    if (observer) observers.push(() => mesh.onAfterRenderObservable.remove(observer));
  };
  observe(witnesses.ground, () => { groundDrawn = true; });
  observe(witnesses.voight, () => { voightDrawn = true; });
  // These meshes represent the actual traversable Meridian surfaces, not a
  // proxy or synthetic startup marker. Observe submissions in the SAME frame.
  for (const road of witnesses.roadSurfaces ?? []) {
    observe(road, () => { roadDrawn = true; });
  }
  for (const sidewalk of witnesses.sidewalkSurfaces ?? []) {
    observe(sidewalk, () => { sidewalkDrawn = true; });
  }
  for (const building of witnesses.buildingSurfaces ?? []) {
    observe(building, () => { buildingDrawn = true; });
  }
  for (const marking of witnesses.markingSurfaces ?? []) {
    observe(marking, () => { markingDrawn = true; });
  }
  try {
    scene.render();
  } finally {
    for (const remove of observers) remove();
  }
  const visibleUrbanSurfaceDrawn = roadDrawn && sidewalkDrawn;
  return {
    groundDrawn,
    roadDrawn,
    sidewalkDrawn,
    buildingDrawn,
    markingDrawn,
    visibleUrbanSurfaceDrawn,
    voightDrawn,
    // A base terrain draw OR independently drawn asphalt and sidewalks
    // establishes real ground-level city geometry. The humanoid must
    // actually draw in the SAME frame; sky and cars cannot satisfy this.
    complete: voightDrawn &&
      (groundDrawn || visibleUrbanSurfaceDrawn) &&
      (witnesses.buildingSurfaces === undefined || buildingDrawn) &&
      (witnesses.markingSurfaces === undefined || markingDrawn),
  };
}

export interface WorldRenderWarmup {
  /** Mark external vehicle preparation terminal; resolve on a subsequent complete world frame. */
  awaitWorldAfterVehicleSettlement(): Promise<WorldFrameEvidence>;
  snapshot(): {
    frameCount: number;
    postImportFrameCount: number;
    postImportElapsedMs: number | null;
    lastEvidence: WorldFrameEvidence;
    completed: boolean;
    cancelled: boolean;
  };
  cancel(): void;
}

const WARMUP_FRAME_INTERVAL_MS = 32;
const POST_IMPORT_WORLD_DEADLINE_MS = 12000;

/**
 * Shader compilation can make the first imported-rig world frame expensive.
 * The elapsed deadline must not reject a scene after a SINGLE attempt.
 * Normal gameplay retains its historical timeout; experiments may opt into
 * a longer, bounded shader warm-up while real draw evidence accumulates.
 */
export interface WorldRenderWarmupOptions {
  readonly postImportDeadlineMs?: number;
  readonly minimumPostImportRenderAttempts?: number;
}

/**
 * World shader/material preparation must run while GLBs download, but while
 * gameplay input and simulation remain gated by the genuine startup overlay.
 * A finite real-render deadline prevents a new 7/8 infinite loading screen.
 */
export function beginWorldRenderWarmup(
  scene: Scene,
  witnesses: WorldRenderWitnesses,
  options: WorldRenderWarmupOptions = {},
): WorldRenderWarmup {
  const postImportDeadlineMs = Math.min(90000, Math.max(1000,
    options.postImportDeadlineMs ?? POST_IMPORT_WORLD_DEADLINE_MS,
  ));
  const minimumPostImportRenderAttempts = Math.max(2, Math.min(10,
    Math.floor(options.minimumPostImportRenderAttempts ?? 2),
  ));
  let cancelled = false;
  let completed = false;
  let assetsSettledAt: number | null = null;
  let frameHandle: number | null = null;
  let lastFrameTime = -Infinity;
  let frameCount = 0;
  let postImportFrameCount = 0;
  let lastEvidence: WorldFrameEvidence = {
    groundDrawn: false,
    roadDrawn: false,
    sidewalkDrawn: false,
    buildingDrawn: false,
    markingDrawn: false,
    visibleUrbanSurfaceDrawn: false,
    voightDrawn: false,
    complete: false,
  };
  let resolve!: (evidence: WorldFrameEvidence) => void;
  let reject!: (reason: Error) => void;
  const ready = new Promise<WorldFrameEvidence>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // Attach an observer immediately: a GPU/context failure can happen while
  // we are still awaiting external GLBs, before the caller awaits ready.
  void ready.catch(() => {});

  const stop = () => {
    if (frameHandle !== null) cancelAnimationFrame(frameHandle);
    frameHandle = null;
  };
  const fail = (error: Error) => {
    if (completed || cancelled) return;
    completed = true;
    stop();
    reject(error);
  };

  const tick = (time: number) => {
    if (cancelled || completed) return;
    if (time - lastFrameTime >= WARMUP_FRAME_INTERVAL_MS) {
      lastFrameTime = time;
      try {
        lastEvidence = renderWorldEvidenceFrame(scene, witnesses);
        frameCount += 1;
        if (assetsSettledAt !== null) postImportFrameCount += 1;
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      if (assetsSettledAt !== null && lastEvidence.complete) {
        completed = true;
        stop();
        resolve(lastEvidence);
        return;
      }
      if (
        assetsSettledAt !== null &&
        performance.now() - assetsSettledAt >= postImportDeadlineMs &&
        postImportFrameCount >= minimumPostImportRenderAttempts
      ) {
        fail(new Error(
          "World not visible after " + frameCount + " actual render attempts (" +
          postImportFrameCount + " post-import); " +
          "terrain drawn=" + lastEvidence.groundDrawn +
          ", road drawn=" + lastEvidence.roadDrawn +
          ", sidewalk drawn=" + lastEvidence.sidewalkDrawn +
          ", building drawn=" + lastEvidence.buildingDrawn +
          ", marking drawn=" + lastEvidence.markingDrawn +
          ", Voight drawn=" + lastEvidence.voightDrawn,
        ));
        return;
      }
    }
    frameHandle = requestAnimationFrame(tick);
  };
  frameHandle = requestAnimationFrame(tick);

  return {
    snapshot() {
      return {
        frameCount,
        postImportFrameCount,
        postImportElapsedMs: assetsSettledAt === null ? null : Math.round(performance.now() - assetsSettledAt),
        lastEvidence: { ...lastEvidence },
        completed,
        cancelled,
      };
    },
    awaitWorldAfterVehicleSettlement() {
      if (assetsSettledAt === null) assetsSettledAt = performance.now();
      return ready;
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      stop();
      if (!completed) {
        completed = true;
        reject(new Error("World render warm-up cancelled"));
      }
    },
  };
}
