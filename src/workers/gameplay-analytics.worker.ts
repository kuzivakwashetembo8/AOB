import {
  GAMEPLAY_ANALYTICS_DB,
  GAMEPLAY_ANALYTICS_VERSION,
  type AnalyticsSession,
  type AnalyticsEvent,
  type AnalyticsWindow,
} from "../lib/gameplay-analytics/database";
import { createSerialQueue } from "../lib/gameplay-analytics/queue";
import { createRecoveryRecord } from "../lib/gameplay-analytics/recovery";

type Message =
  | { type: "start"; requestId: string; session: AnalyticsSession }
  | { type: "batch"; requestId: string; events: AnalyticsEvent[]; windows: AnalyticsWindow[]; droppedEvents: number; elapsedMs: number }
  | { type: "finish"; requestId: string; at: string; elapsedMs: number }
  | { type: "heartbeat"; requestId: string; elapsedMs: number };

let dbPromise: Promise<IDBDatabase> | null = null;
let session: AnalyticsSession | null = null;
let persistenceFailures = 0;
const enqueueMessage = createSerialQueue();

function db(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(GAMEPLAY_ANALYTICS_DB, GAMEPLAY_ANALYTICS_VERSION);
    request.onupgradeneeded = () => {
      const value = request.result;
      if (!value.objectStoreNames.contains("sessions")) value.createObjectStore("sessions", { keyPath: "id" });
      if (!value.objectStoreNames.contains("events")) {
        const store = value.createObjectStore("events", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
      }
      if (!value.objectStoreNames.contains("windows")) {
        const store = value.createObjectStore("windows", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open analytics database"));
  });
  return dbPromise;
}

function commit(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Analytics transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Analytics transaction aborted"));
  });
}

async function saveCheckpoint(elapsedMs: number): Promise<void> {
  if (!session) throw new Error("Analytics session has not started");
  const updatedAt = new Date().toISOString();
  const nextSession: AnalyticsSession = {
    ...session,
    elapsedMs: Math.max(session.elapsedMs, Math.max(0, Math.floor(elapsedMs))),
    updatedAt,
    recorder: { ...session.recorder, persistenceFailures, checkpointAt: updatedAt },
  };
  const database = await db();
  const tx = database.transaction("sessions", "readwrite");
  tx.objectStore("sessions").put(nextSession);
  await commit(tx);
  session = nextSession;
}

async function handleMessage(message: Message): Promise<void> {
  if (message.type === "start") {
    persistenceFailures = 0;
    session = {
      ...message.session,
      recorder: { ...message.session.recorder, persistenceFailures: 0 },
    };
    const database = await db();
    const tx = database.transaction(["sessions", "events"], "readwrite");
    const sessions = tx.objectStore("sessions");
    const events = tx.objectStore("events");
    const prior = sessions.getAll();
    prior.onsuccess = () => {
      const at = new Date().toISOString();
      for (const old of prior.result as AnalyticsSession[]) {
        if (old.state !== "active" || old.id === session?.id) continue;
        const recovery = createRecoveryRecord(old, session!.id, at, crypto.randomUUID());
        sessions.put(recovery.session);
        events.put(recovery.event);
      }
      sessions.put(session!);
    };
    await commit(tx);
    self.postMessage({ type: "ready", requestId: message.requestId });
    return;
  }

  if (message.type === "batch") {
    if (!session) throw new Error("Analytics session has not started");
    if (message.events.some((item) => item.sessionId !== session!.id) ||
        message.windows.some((item) => item.sessionId !== session!.id)) {
      throw new Error("Analytics batch contains records from another session");
    }
    const updatedAt = new Date().toISOString();
    const nextSession: AnalyticsSession = {
      ...session,
      elapsedMs: Math.max(session.elapsedMs, Math.max(0, Math.floor(message.elapsedMs))),
      updatedAt,
      recorder: {
        ...session.recorder,
        lastSequence: Math.max(session.recorder.lastSequence, message.events.at(-1)?.sequence ?? session.recorder.lastSequence),
        droppedEvents: Math.max(session.recorder.droppedEvents, message.droppedEvents),
        persistenceFailures,
        checkpointAt: updatedAt,
      },
    };
    const database = await db();
    const tx = database.transaction(["sessions", "events", "windows"], "readwrite");
    const eventStore = tx.objectStore("events");
    const windowStore = tx.objectStore("windows");
    for (const item of message.events) eventStore.put(item);
    for (const item of message.windows) windowStore.put(item);
    tx.objectStore("sessions").put(nextSession);
    await commit(tx);
    session = nextSession;
    self.postMessage({ type: "committed", requestId: message.requestId, sequence: session.recorder.lastSequence });
    return;
  }

  if (message.type === "heartbeat") {
    await saveCheckpoint(message.elapsedMs);
    self.postMessage({ type: "heartbeat", requestId: message.requestId });
    return;
  }

  if (message.type === "finish") {
    if (!session) throw new Error("Analytics session has not started");
    const nextSession: AnalyticsSession = {
      ...session,
      state: "completed",
      endedAt: message.at,
      elapsedMs: Math.max(session.elapsedMs, Math.max(0, Math.floor(message.elapsedMs))),
      updatedAt: message.at,
      recorder: { ...session.recorder, persistenceFailures, checkpointAt: message.at },
    };
    const database = await db();
    const tx = database.transaction("sessions", "readwrite");
    tx.objectStore("sessions").put(nextSession);
    await commit(tx);
    session = nextSession;
    self.postMessage({ type: "finished", requestId: message.requestId });
  }
}

async function reportFailure(message: Message, error: unknown) {
  persistenceFailures += 1;
  if (session) {
    const failedSession: AnalyticsSession = {
      ...session,
      recorder: { ...session.recorder, persistenceFailures },
    };
    try {
      const database = await db();
      const tx = database.transaction("sessions", "readwrite");
      tx.objectStore("sessions").put(failedSession);
      await commit(tx);
      session = failedSession;
    } catch {
      // The primary failure remains visible to the client; a second storage failure may prevent counting it.
    }
  }
  self.postMessage({
    type: "error",
    requestId: message.requestId,
    message: error instanceof Error ? error.message : "Analytics persistence failed",
  });
}

self.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  void enqueueMessage(async () => {
    try {
      await handleMessage(message);
    } catch (error) {
      await reportFailure(message, error);
    }
  });
};
