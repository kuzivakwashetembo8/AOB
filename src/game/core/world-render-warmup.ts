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
}

export interface WorldFrameEvidence {
  readonly groundDrawn: boolean;
  readonly voightDrawn: boolean;
  readonly complete: boolean;
}

export function renderWorldEvidenceFrame(
  scene: Scene,
  witnesses: WorldRenderWitnesses,
): WorldFrameEvidence {
  let groundDrawn = false;
  let voightDrawn = false;
  const groundObserver = witnesses.ground.onAfterRenderObservable.add(() => {
    groundDrawn = true;
  });
  const voightObserver = witnesses.voight.onAfterRenderObservable.add(() => {
    voightDrawn = true;
  });
  try {
    // Real graphics render; there is no synthetic mesh-completion event.
    scene.render();
  } finally {
    if (groundObserver) witnesses.ground.onAfterRenderObservable.remove(groundObserver);
    if (voightObserver) witnesses.voight.onAfterRenderObservable.remove(voightObserver);
  }
  return { groundDrawn, voightDrawn, complete: groundDrawn && voightDrawn };
}

export interface WorldRenderWarmup {
  /** Mark external vehicle preparation terminal; resolve on a subsequent complete world frame. */
  awaitWorldAfterVehicleSettlement(): Promise<WorldFrameEvidence>;
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
          "ground drawn=" + lastEvidence.groundDrawn + ", Voight drawn=" + lastEvidence.voightDrawn,
        ));
        return;
      }
    }
    frameHandle = requestAnimationFrame(tick);
  };
  frameHandle = requestAnimationFrame(tick);

  return {
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
