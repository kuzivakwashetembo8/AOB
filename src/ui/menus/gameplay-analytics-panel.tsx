import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, RefreshCw } from "lucide-react";
import {
  exportAnalyticsSession,
  listAnalyticsSessions,
  type AnalyticsSession,
} from "@/lib/gameplay-analytics/database";

/** Shared local-session viewer used by standalone and paused-game settings. */
export function GameplayAnalyticsPanel() {
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [status, setStatus] = useState("Loading local sessions…");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const nextSessions = await listAnalyticsSessions();
      setSessions(nextSessions);
      setStatus(nextSessions.some((session) => session.state === "active")
        ? "An active session remains; its finalization has not been confirmed."
        : "Local analytics database ready.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Local analytics storage unavailable.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onRecorderStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ status: string; message: string }>).detail;
      if (detail) setStatus(detail.message);
    };
    window.addEventListener("gtd-gameplay-analytics-status", onRecorderStatus);
    return () => window.removeEventListener("gtd-gameplay-analytics-status", onRecorderStatus);
  }, [refresh]);

  const exportSession = async (id: string) => {
    setBusy(true);
    setStatus("Preparing JSON export…");
    try {
      const payload = await exportAnalyticsSession(id);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `poi-gameplay-analytics-${id}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("JSON export prepared on this device.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3" aria-label="Local gameplay analytics">
      <div className="flex items-center justify-between gap-3">
        <p className="overlay-note">Recorded sessions stay on this device. Nothing is uploaded.</p>
        <button type="button" className="settings-tab" onClick={() => void refresh()}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      <p className="overlay-note" role="status" aria-live="polite">{status}</p>
      {sessions.length === 0 ? (
        <p className="overlay-note">No committed analytics sessions are available yet. Recording starts automatically when the application launches.</p>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <article key={session.id} className="setting-row" style={{ alignItems: "center", gap: 16 }}>
              <div className="min-w-0 flex-1">
                <strong>{new Date(session.startedAt).toLocaleString()}</strong>
                <small>{session.state.toUpperCase()} · {Math.round(session.elapsedMs / 1000)}s · {session.id.slice(0, 8)}</small>
                <small>Last committed event #{session.recorder.lastSequence} · dropped {session.recorder.droppedEvents} · persistence failures {session.recorder.persistenceFailures ?? "unknown"}</small>
              </div>
              <button type="button" className="settings-tab" disabled={busy} onClick={() => void exportSession(session.id)}>
                <ArrowDownToLine size={16} /> Export JSON
              </button>
            </article>
          ))}
        </div>
      )}
      <p className="overlay-note">A process kill can leave the most recent uncommitted batch unavailable. Only records committed to local storage appear here.</p>
    </section>
  );
}
