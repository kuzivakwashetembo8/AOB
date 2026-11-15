import type { AnalyticsEvent, AnalyticsSession, AnalyticsWindow } from "./database";
import { readMemorySample } from "./telemetry";
import { flushUntilDrained } from "./queue";

declare const __GTD_RELEASE_ID__: string;

const MAX_QUEUE = 2000;
const FRAME_CAPACITY = 3600;
const ACK_TIMEOUT_MS = 10000;

type FrameBuffer = { values: Float32Array; size: number; head: number };
type WorkerReply = { type: string; requestId?: string; message?: string };
type PendingRequest = {
  expectedType: string;
  resolve: (reply: WorkerReply) => void;
  reject: (error: Error) => void;
  timeout: number;
};

let active = false;
let finalizing = false;
let worker: Worker | null = null;
let sessionId = "";
let startedAt = 0;
let sequence = 0;
let dropped = 0;
let events: AnalyticsEvent[] = [];
let windows: AnalyticsWindow[] = [];
let frameBuffer: FrameBuffer = { values: new Float32Array(FRAME_CAPACITY), size: 0, head: 0 };
let frameHandle = 0;
let flushTimer = 0;
let lastFrame = 0;
let lastWindow = 0;
let resourceObserver: PerformanceObserver | null = null;
let longTaskObserver: PerformanceObserver | null = null;
let flushPromise: Promise<void> | null = null;
let finalizationPromise: Promise<void> | null = null;
let readyPromise: Promise<void> = Promise.resolve();
const pendingRequests = new Map<string, PendingRequest>();

let onVisibility: (() => void) | null = null;
let onError: ((event: ErrorEvent) => void) | null = null;
let onRejection: ((event: PromiseRejectionEvent) => void) | null = null;
let onPageHide: (() => void) | null = null;

const now = () => performance.now();
const elapsed = () => Math.max(0, Math.round(now() - startedAt));
const safeText = (value: unknown, max = 240) => String(value ?? "").replace(/[\r\n\t]/g, " ").slice(0, max);

function notifyStatus(status: "completed" | "degraded", message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gtd-gameplay-analytics-status", { detail: { status, message } }));
  }
}

function push(type: string, data: Record<string, unknown> = {}) {
  if (!active || finalizing) return;
  if (events.length >= MAX_QUEUE) {
    dropped += 1;
    return;
  }
  events.push({
    id: crypto.randomUUID(),
    sessionId,
    sequence: ++sequence,
    at: new Date().toISOString(),
    elapsedMs: elapsed(),
    type,
    data,
  });
}

function summarize() {
  const values = Array.from(frameBuffer.values.slice(0, frameBuffer.size)).sort((a, b) => a - b);
  const q = (p: number) => {
    const value = values[Math.max(0, Math.ceil(p * values.length) - 1)];
    return value === undefined ? null : Number(value.toFixed(2));
  };
  windows.push({
    id: crypto.randomUUID(),
    sessionId,
    at: new Date().toISOString(),
    elapsedMs: elapsed(),
    frameCount: values.length,
    frameMs: {
      p50: q(0.5),
      p95: q(0.95),
      p99: q(0.99),
      max: values.length ? Number(values.at(-1)!.toFixed(2)) : null,
      over16_67: values.filter((value) => value > 16.67).length,
      over33_33: values.filter((value) => value > 33.33).length,
      over50: values.filter((value) => value > 50).length,
      over100: values.filter((value) => value > 100).length,
    },
    memory: readMemorySample(performance),
    notes: [],
  });
  if (windows.length > 60) windows.shift();
  frameBuffer.size = 0;
  frameBuffer.head = 0;
}

function frame(time: number) {
  if (!active || finalizing) return;
  if (lastFrame > 0) {
    const delta = time - lastFrame;
    if (delta >= 0 && delta <= 1000) {
      frameBuffer.values[frameBuffer.head] = delta;
      frameBuffer.head = (frameBuffer.head + 1) % FRAME_CAPACITY;
      frameBuffer.size = Math.min(FRAME_CAPACITY, frameBuffer.size + 1);
    }
  }
  lastFrame = time;
  if (time - lastWindow >= 1000) {
    summarize();
    lastWindow = time;
  }
  frameHandle = requestAnimationFrame(frame);
}

function requestWorker(message: Record<string, unknown>, expectedType: string): Promise<WorkerReply> {
  if (!worker) return Promise.reject(new Error("Analytics Worker is unavailable"));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Analytics Worker acknowledgement timed out: ${expectedType}`));
    }, ACK_TIMEOUT_MS);
    pendingRequests.set(requestId, { expectedType, resolve, reject, timeout });
    try {
      worker!.postMessage({ ...message, requestId });
    } catch (error) {
      window.clearTimeout(timeout);
      pendingRequests.delete(requestId);
      reject(error instanceof Error ? error : new Error("Could not send analytics message"));
    }
  });
}

function handleWorkerMessage(event: MessageEvent<WorkerReply>) {
  const reply = event.data;
  if (!reply.requestId) return;
  const pending = pendingRequests.get(reply.requestId);
  if (!pending) return;
  pendingRequests.delete(reply.requestId);
  window.clearTimeout(pending.timeout);
  if (reply.type === "error") pending.reject(new Error(reply.message ?? "Analytics persistence failed"));
  else if (reply.type !== pending.expectedType) pending.reject(new Error(`Unexpected analytics Worker reply: ${reply.type}`));
  else pending.resolve(reply);
}

function rejectPendingRequests(error: Error) {
  for (const [id, pending] of pendingRequests) {
    window.clearTimeout(pending.timeout);
    pending.reject(error);
    pendingRequests.delete(id);
  }
}

function sanitizeResource(raw: string) {
  try {
    const url = new URL(raw, location.href);
    return url.origin === location.origin ? url.pathname.slice(0, 200) : url.hostname + url.pathname.slice(0, 160);
  } catch {
    return "unidentified-resource";
  }
}

function flush(): Promise<void> {
  if (flushPromise) return flushPromise;
  if (!worker) return Promise.reject(new Error("Analytics Worker is unavailable"));
  const run = async () => {
    await readyPromise;
    while (events.length || windows.length) {
      const batchEvents = events.slice();
      const batchWindows = windows.slice();
      await requestWorker({
        type: "batch",
        events: batchEvents,
        windows: batchWindows,
        droppedEvents: dropped,
        elapsedMs: elapsed(),
      }, "committed");
      events.splice(0, batchEvents.length);
      windows.splice(0, batchWindows.length);
    }
    await requestWorker({ type: "heartbeat", elapsedMs: elapsed() }, "heartbeat");
  };
  flushPromise = run()
    .catch((error: unknown) => {
      notifyStatus("degraded", error instanceof Error ? error.message : "Analytics persistence is incomplete.");
      throw error;
    })
    .finally(() => {
      flushPromise = null;
    });
  return flushPromise;
}

export function recordGameplayAnalytics(type: string, data: Record<string, unknown> = {}) {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data).slice(0, 24)) {
    if (/token|password|cookie|authorization|email|phone|location|address/i.test(key)) continue;
    clean[safeText(key, 60)] =
      typeof value === "number" && Number.isFinite(value)
        ? value
        : typeof value === "boolean" || value === null
          ? value
          : safeText(value);
  }
  push(safeText(type, 80), clean);
}

function cleanupLifecycle() {
  cancelAnimationFrame(frameHandle);
  window.clearInterval(flushTimer);
  resourceObserver?.disconnect();
  longTaskObserver?.disconnect();
  if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
  if (onError) window.removeEventListener("error", onError);
  if (onRejection) window.removeEventListener("unhandledrejection", onRejection);
  if (onPageHide) window.removeEventListener("pagehide", onPageHide);
  onVisibility = null;
  onError = null;
  onRejection = null;
  onPageHide = null;
}

export function startGameplayAnalytics() {
  if (active || typeof window === "undefined" || typeof Worker === "undefined" || typeof indexedDB === "undefined") return;
  active = true;
  finalizing = false;
  finalizationPromise = null;
  sessionId = crypto.randomUUID();
  startedAt = now();
  sequence = 0;
  dropped = 0;
  events = [];
  windows = [];
  frameBuffer = { values: new Float32Array(FRAME_CAPACITY), size: 0, head: 0 };
  lastFrame = 0;
  lastWindow = 0;

  try {
    worker = new Worker(new URL("../../workers/gameplay-analytics.worker.ts", import.meta.url), { type: "module" });
  } catch {
    active = false;
    worker = null;
    notifyStatus("degraded", "Analytics Worker could not be started.");
    return;
  }

  const session: AnalyticsSession = {
    id: sessionId,
    schema: "gtd.gameplay-analytics.v1",
    state: "active",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    endedAt: null,
    elapsedMs: 0,
    application: {
      release: typeof __GTD_RELEASE_ID__ === "string" ? __GTD_RELEASE_ID__ : "development",
      platform: /Android/i.test(navigator.userAgent) ? "android-webview" : "web",
      userAgent: safeText(navigator.userAgent, 300),
      screen: { width: screen.width, height: screen.height, dpr: devicePixelRatio || 1 },
    },
    capabilities: {
      indexedDb: true,
      worker: true,
      resourceTiming: typeof PerformanceObserver !== "undefined",
      longTask: typeof PerformanceObserver !== "undefined",
      memory: !!(performance as Performance & { memory?: unknown }).memory,
    },
    recorder: { lastSequence: 0, droppedEvents: 0, persistenceFailures: 0, checkpointAt: null },
  };

  worker.onmessage = handleWorkerMessage;
  worker.onerror = () => {
    const error = new Error("Analytics Worker stopped unexpectedly.");
    rejectPendingRequests(error);
    notifyStatus("degraded", error.message);
  };
  readyPromise = requestWorker({ type: "start", session }, "ready").then(() => undefined);
  void readyPromise.catch((error: unknown) => {
    notifyStatus("degraded", error instanceof Error ? error.message : "Analytics session could not be started.");
  });

  push("application.bootstrap", { readyState: document.readyState });
  push("lifecycle.visibility", { state: document.visibilityState });

  try {
    resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        push("asset.transfer", {
          path: sanitizeResource(entry.name),
          initiator: entry.initiatorType,
          durationMs: Math.round(entry.duration),
          transferBytes: entry.transferSize || null,
          decodedBytes: entry.decodedBodySize || null,
        });
      }
    });
    resourceObserver.observe({ type: "resource", buffered: true });
  } catch {
    // Resource Timing unavailable.
  }

  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        push("performance.long-task", { durationMs: Math.round(entry.duration), startMs: Math.round(entry.startTime) });
      }
    });
    longTaskObserver.observe({ type: "longtask" });
  } catch {
    // Long Tasks API unavailable.
  }

  onVisibility = () => {
    push("lifecycle.visibility", { state: document.visibilityState });
    if (document.visibilityState === "hidden") void flush().catch(() => undefined);
  };
  onError = (event) => push("application.error", {
    message: safeText(event.message),
    filename: sanitizeResource(event.filename),
    line: event.lineno,
  });
  onRejection = (event) => push("application.unhandled-rejection", {
    reason: safeText(event.reason instanceof Error ? event.reason.message : event.reason),
  });
  onPageHide = () => {
    void finalizeGameplayAnalytics("pagehide").catch(() => undefined);
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  window.addEventListener("pagehide", onPageHide);

  frameHandle = requestAnimationFrame(frame);
  flushTimer = window.setInterval(() => {
    void flush().catch(() => undefined);
  }, 3000);
  push("recorder.started", { checkpointIntervalMs: 3000, frameSampling: "bounded typed-array; 1-second windows" });
}

function finalizeGameplayAnalytics(reason: "stop" | "pagehide"): Promise<void> {
  if (finalizationPromise) return finalizationPromise;
  if (!active || !worker) return Promise.resolve();

  push("recorder.stopped", { reason });
  summarize();
  finalizing = true;
  cleanupLifecycle();

  finalizationPromise = (async () => {
    try {
      await flushUntilDrained(flush, () => events.length > 0 || windows.length > 0);
      await requestWorker({
        type: "finish",
        at: new Date().toISOString(),
        elapsedMs: elapsed(),
      }, "finished");
      notifyStatus("completed", "Gameplay analytics session committed locally.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analytics finalization was not confirmed.";
      notifyStatus("degraded", message);
      throw error;
    } finally {
      worker?.terminate();
      worker = null;
      active = false;
      finalizing = false;
      rejectPendingRequests(new Error("Analytics Worker has been closed."));
    }
  })();
  return finalizationPromise;
}

export function stopGameplayAnalytics(): Promise<void> {
  return finalizeGameplayAnalytics("stop");
}
