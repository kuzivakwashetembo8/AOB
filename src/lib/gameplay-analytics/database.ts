export const GAMEPLAY_ANALYTICS_DB = "gtd-gameplay-analytics";
export const GAMEPLAY_ANALYTICS_VERSION = 1;

export type AnalyticsMemorySample = {
  jsHeapUsedBytes: number | null;
  source: "performance.memory.usedJSHeapSize" | "unavailable" | "legacy-unknown";
  availability: "available" | "unsupported" | "unknown";
  quality: "browser-reported-unverified" | "repeated-value" | "invalid" | "unavailable" | "legacy-unverified";
};

export type AnalyticsSession = {
  id: string;
  schema: "gtd.gameplay-analytics.v1";
  state: "active" | "completed" | "interrupted";
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
  elapsedMs: number;
  application: { release: string; platform: string; userAgent: string; screen: { width: number; height: number; dpr: number } };
  capabilities: { indexedDb: boolean; worker: boolean; resourceTiming: boolean; longTask: boolean; memory: boolean };
  recorder: { lastSequence: number; droppedEvents: number; persistenceFailures: number | null; checkpointAt: string | null };
};

export type AnalyticsEvent = {
  id: string;
  sessionId: string;
  sequence: number;
  at: string;
  elapsedMs: number;
  type: string;
  data: Record<string, unknown>;
};

export type AnalyticsWindow = {
  id: string;
  sessionId: string;
  at: string;
  elapsedMs: number;
  frameCount: number;
  frameMs: { p50: number | null; p95: number | null; p99: number | null; max: number | null; over16_67: number; over33_33: number; over50: number; over100: number };
  memory: AnalyticsMemorySample;
  notes: string[];
};

export function normalizeLegacySession(session: AnalyticsSession): AnalyticsSession {
  return {
    ...session,
    recorder: { ...session.recorder, persistenceFailures: session.recorder.persistenceFailures ?? null },
  };
}

export function normalizeLegacyMemoryMetadata(window: AnalyticsWindow): AnalyticsWindow {
  const memory = window.memory as unknown as Record<string, unknown> | null;
  if (memory &&
      typeof memory["source"] === "string" &&
      typeof memory["availability"] === "string" &&
      typeof memory["quality"] === "string") return window;
  return {
    ...window,
    memory: {
      jsHeapUsedBytes: memory && typeof memory["jsHeapUsedBytes"] === "number" ? memory["jsHeapUsedBytes"] : null,
      source: "legacy-unknown",
      availability: "unknown",
      quality: "legacy-unverified",
    },
  };
}

export function assertAnalyticsExportIntegrity(session: AnalyticsSession, events: AnalyticsEvent[], windows: AnalyticsWindow[]): void {
  if (!session.id || !Number.isFinite(session.elapsedMs) || session.elapsedMs < 0) {
    throw new Error("Analytics export contains an invalid session identity or duration.");
  }
  if (!Number.isFinite(Date.parse(session.startedAt)) || !Number.isFinite(Date.parse(session.updatedAt))) {
    throw new Error("Analytics export contains invalid session timestamps.");
  }
  if (session.state === "completed" && (!session.endedAt || !Number.isFinite(Date.parse(session.endedAt)))) {
    throw new Error("Completed analytics sessions require a valid end timestamp.");
  }
  if (session.state === "active" && session.recorder.checkpointAt &&
      Date.parse(session.recorder.checkpointAt) > Date.parse(session.startedAt) && session.elapsedMs <= 0) {
    throw new Error("Active analytics session has a checkpoint but no elapsed duration.");
  }
  const seen = new Set<number>();
  let previous = 0;
  for (const event of events) {
    if (event.sessionId !== session.id) throw new Error("Analytics event belongs to a different session.");
    if (!Number.isInteger(event.sequence) || event.sequence <= 0 || seen.has(event.sequence)) {
      throw new Error("Analytics event sequence is invalid or duplicated.");
    }
    if (event.sequence < previous) throw new Error("Analytics events are not ordered by sequence.");
    seen.add(event.sequence);
    previous = event.sequence;
  }
  for (const item of windows) {
    if (item.sessionId !== session.id) throw new Error("Performance window belongs to a different session.");
    if (!item.memory || !("availability" in item.memory) || !("source" in item.memory) || !("quality" in item.memory)) {
      throw new Error("Performance window is missing memory provenance metadata.");
    }
    if (item.memory["availability"] === "unsupported" && item.memory["jsHeapUsedBytes"] !== null) {
      throw new Error("Unsupported memory telemetry must not contain a measured value.");
    }
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(GAMEPLAY_ANALYTICS_DB, GAMEPLAY_ANALYTICS_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
      if (!db.objectStoreNames.contains("events")) {
        const store = db.createObjectStore("events", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
      }
      if (!db.objectStoreNames.contains("windows")) {
        const store = db.createObjectStore("windows", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open analytics database"));
  });
}

export async function listAnalyticsSessions(): Promise<AnalyticsSession[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("sessions", "readonly");
      const req = tx.objectStore("sessions").getAll();
      req.onsuccess = () => resolve((req.result as AnalyticsSession[]).map(normalizeLegacySession).sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error ?? new Error("Could not list analytics sessions"));
    });
  } finally {
    db.close();
  }
}

export async function exportAnalyticsSession(id: string): Promise<Record<string, unknown>> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(["sessions", "events", "windows"], "readonly");
      const sessionRequest = tx.objectStore("sessions").get(id);
      const eventsRequest = tx.objectStore("events").index("sessionId").getAll(id);
      const windowsRequest = tx.objectStore("windows").index("sessionId").getAll(id);
      tx.oncomplete = () => {
        if (!sessionRequest.result) return reject(new Error("Analytics session not found"));
        const session = normalizeLegacySession(sessionRequest.result as AnalyticsSession);
        const events = (eventsRequest.result as AnalyticsEvent[]).sort((a, b) => a.sequence - b.sequence);
        const windows = (windowsRequest.result as AnalyticsWindow[]).map(normalizeLegacyMemoryMetadata);
        try {
          assertAnalyticsExportIntegrity(session, events, windows);
          resolve({ schema: "gtd.gameplay-analytics.v1", exportedAt: new Date().toISOString(), session, events, performance_windows: windows });
        } catch (error) {
          reject(error);
        }
      };
      tx.onerror = () => reject(tx.error ?? new Error("Could not export analytics session"));
      tx.onabort = () => reject(tx.error ?? new Error("Analytics export transaction aborted"));
    });
  } finally {
    db.close();
  }
}
