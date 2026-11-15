import { describe, expect, it } from "vitest";
import type { AnalyticsEvent, AnalyticsSession, AnalyticsWindow } from "@/lib/gameplay-analytics/database";
import { assertAnalyticsExportIntegrity, normalizeLegacyMemoryMetadata } from "@/lib/gameplay-analytics/database";
import { readMemorySample } from "@/lib/gameplay-analytics/telemetry";
import { createSerialQueue, flushUntilDrained } from "@/lib/gameplay-analytics/queue";
import { createRecoveryRecord } from "@/lib/gameplay-analytics/recovery";

function makeSession(overrides: Partial<AnalyticsSession> = {}): AnalyticsSession {
  return {
    id: "session-a", schema: "gtd.gameplay-analytics.v1", state: "active",
    startedAt: "2026-11-14T10:00:00.000Z", updatedAt: "2026-11-14T10:00:05.000Z",
    endedAt: null, elapsedMs: 5000,
    application: { release: "test", platform: "web", userAgent: "test", screen: { width: 1, height: 1, dpr: 1 } },
    capabilities: { indexedDb: true, worker: true, resourceTiming: true, longTask: true, memory: true },
    recorder: { lastSequence: 2, droppedEvents: 0, persistenceFailures: 0, checkpointAt: "2026-11-14T10:00:05.000Z" },
    ...overrides,
  };
}
function makeEvent(sequence: number, sessionId = "session-a"): AnalyticsEvent {
  return { id: `event-${sequence}`, sessionId, sequence, at: "2026-11-14T10:00:05.000Z", elapsedMs: 5000, type: "test", data: {} };
}
function makeWindow(sessionId = "session-a"): AnalyticsWindow {
  return {
    id: "window-a", sessionId, at: "2026-11-14T10:00:05.000Z", elapsedMs: 5000, frameCount: 0,
    frameMs: { p50: null, p95: null, p99: null, max: null, over16_67: 0, over33_33: 0, over50: 0, over100: 0 },
    memory: { jsHeapUsedBytes: null, source: "unavailable", availability: "unsupported", quality: "unavailable" },
    notes: [],
  };
}

describe("gameplay analytics reliability contracts", () => {
  it("accepts an active session with a committed monotonic checkpoint", () => {
    expect(() => assertAnalyticsExportIntegrity(makeSession(), [makeEvent(1), makeEvent(2)], [makeWindow()])).not.toThrow();
  });
  it("rejects cross-session events and windows", () => {
    expect(() => assertAnalyticsExportIntegrity(makeSession(), [makeEvent(1, "session-b")], [])).toThrow(/different session/i);
    expect(() => assertAnalyticsExportIntegrity(makeSession(), [], [makeWindow("session-b")])).toThrow(/different session/i);
  });
  it("rejects duplicate and descending event sequences", () => {
    expect(() => assertAnalyticsExportIntegrity(makeSession(), [makeEvent(1), makeEvent(1)], [])).toThrow(/duplicated/i);
    expect(() => assertAnalyticsExportIntegrity(makeSession(), [makeEvent(2), makeEvent(1)], [])).toThrow(/ordered/i);
  });
  it("requires completed sessions to have a valid end timestamp", () => {
    expect(() => assertAnalyticsExportIntegrity(makeSession({ state: "completed" }), [], [])).toThrow(/end timestamp/i);
  });
  it("preserves pre-correction memory values as explicitly unknown legacy telemetry", () => {
    const legacy = { ...makeWindow(), memory: { jsHeapUsedBytes: 10_000_000 } } as unknown as AnalyticsWindow;
    expect(normalizeLegacyMemoryMetadata(legacy).memory).toEqual({
      jsHeapUsedBytes: 10_000_000, source: "legacy-unknown", availability: "unknown", quality: "legacy-unverified",
    });
  });
  it("reports unavailable memory without inventing a numeric value", () => {
    expect(readMemorySample({} as Performance)).toEqual({
      jsHeapUsedBytes: null, source: "unavailable", availability: "unsupported", quality: "unavailable",
    });
  });
  it("preserves browser values and flags repeated readings without claiming precision", () => {
    const performanceLike = { memory: { usedJSHeapSize: 10_000_000 } } as unknown as Performance;
    const first = readMemorySample(performanceLike);
    readMemorySample(performanceLike);
    const third = readMemorySample(performanceLike);
    expect(first.jsHeapUsedBytes).toBe(10_000_000);
    expect(first.quality).toBe("browser-reported-unverified");
    expect(third.quality).toBe("repeated-value");
  });
  it("serializes Worker operations and continues after a rejected operation", async () => {
    const enqueue = createSerialQueue();
    const order: number[] = [];
    const first = enqueue(async () => { order.push(1); throw new Error("expected"); });
    const second = enqueue(async () => { order.push(2); return "committed"; });
    await expect(first).rejects.toThrow("expected");
    await expect(second).resolves.toBe("committed");
    expect(order).toEqual([1, 2]);
  });
  it("repeats final flush when records arrive during an existing flush", async () => {
    let pending = true;
    let calls = 0;
    await flushUntilDrained(async () => {
      calls += 1;
      if (calls === 2) pending = false;
    }, () => pending);
    expect(calls).toBe(2);
  });
  it("attributes recovery to the interrupted session and advances its own sequence", () => {
    const previous = makeSession({ recorder: { lastSequence: 9, droppedEvents: 0, persistenceFailures: 0, checkpointAt: "2026-11-14T10:00:05.000Z" } });
    const result = createRecoveryRecord(previous, "session-b", "2026-11-14T10:01:00.000Z", "recovery-event");
    expect(result.session.id).toBe("session-a");
    expect(result.session.state).toBe("interrupted");
    expect(result.session.elapsedMs).toBe(5000);
    expect(result.session.recorder.checkpointAt).toBe("2026-11-14T10:00:05.000Z");
    expect(result.event.sessionId).toBe("session-a");
    expect(result.event.sequence).toBe(10);
    expect(result.event.data["recoverySessionId"]).toBe("session-b");
    expect(result.event.data["downtimeMs"]).toBeNull();
  });
});
