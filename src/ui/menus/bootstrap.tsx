import type { StartupCheckEntry } from "@/game/core/loading-checklist";
import { startupCompletion } from "@/game/core/loading-checklist";

/**
 * Unlike the old shell-only progress graphic, every status below is driven by
 * the renderer, Rapier, world builder, real GLB importer, or first scene render.
 */
export function BootstrapOverlay({
  entries,
  error,
}: {
  entries: readonly StartupCheckEntry[];
  error?: string | null;
}) {
  const completion = startupCompletion(entries);
  return (
    <div className="overlay" role="status" aria-label="Preparing Meridian game">
      <div className="overlay-content">
        <div className="system-label text-primary mb-4">MERIDIA // MERIDIAN CITY</div>
        <div className="bootstrap-mark">GTD<span className="text-primary">.</span></div>
        <h2 className="game-title mt-2">GRAND THEFT DIVISION</h2>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Completed startup checks"
          aria-valuemin={0}
          aria-valuemax={entries.length}
          aria-valuenow={completion.resolved}
        >
          <div className="progress-fill" style={{ width: `${completion.percent}%` }} />
        </div>
        <div className="bootstrap-detail">
          <span>{error ? "STARTUP ERROR" : "CHECKING REAL GAME DEPENDENCIES"}</span>
          <span>{completion.resolved}/{completion.total} VERIFIED OR RESOLVED</span>
        </div>
        <div className="diagnostics" role="list" aria-label="Live startup readiness checklist">
          {entries.map((entry) => (
            <div key={entry.id} role="listitem" className="flex items-center justify-between gap-2" data-checkpoint={entry.id} data-state={entry.status}>
              <span>{entry.label}</span>
              <span className={entry.status === "done" ? "text-system" : entry.status === "failed" ? "text-destructive" : "text-primary"}>
                {entry.status === "done"
                  ? "✓"
                  : entry.status === "failed"
                    ? "UNAVAILABLE"
                    : entry.status === "skipped"
                      ? "N/A"
                      : entry.status === "running"
                        ? "WORKING"
                        : "WAITING"}
              </span>
            </div>
          ))}
        </div>
        {completion.failed > 0 && !error && (
          <p className="overlay-note" role="alert">
            {completion.failed} optional vehicle preparation check(s) unavailable. Missing cars will leave empty, noncolliding spaces.
          </p>
        )}
        {error && (
          <div role="alert" className="overlay-note">
            <p>Meridian could not finish startup: {error}</p>
            <button type="button" className="mt-3 text-primary underline" onClick={() => window.location.reload()}>
              Retry loading
            </button>
          </div>
        )}
        {!error && (
          <p className="overlay-note">
            The game opens only after the requested vehicle imports and the first rendered frame settle.
          </p>
        )}
      </div>
    </div>
  );
}
