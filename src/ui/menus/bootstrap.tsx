import type { StartupCheckEntry } from "@/game/core/loading-checklist";
import { startupCompletion } from "@/game/core/loading-checklist";
import {
  STARTUP_LOAD_BUDGET_SECONDS, describeStartupBudget, formatStartupDuration,
} from "@/game/core/startup-load-budget";

/**
 * Unlike the old shell-only progress graphic, every status below is driven by
 * the renderer, Rapier, world builder, real GLB importer, or first scene render.
 */
export function BootstrapOverlay({
  entries,
  elapsedSeconds = 0,
  error,
  onDownloadDiagnostics,
  onDownloadStartupDiagnostics,
  onRetryUpdate,
  onContinueCurrentBuild,
}: {
  entries: readonly StartupCheckEntry[];
  elapsedSeconds?: number;
  error?: string | null;
  onDownloadDiagnostics?: (() => void) | undefined;
  onDownloadStartupDiagnostics?: (() => void) | undefined;
  onRetryUpdate?: (() => void) | undefined;
  onContinueCurrentBuild?: (() => void) | undefined;
}) {
  const completion = startupCompletion(entries);
  const budget = describeStartupBudget(elapsedSeconds);
  return (
    <div className="overlay" role="status" aria-label="Preparing Meridian game">
      <div className="overlay-content">
        <div className="system-label text-primary mb-4">MERIDIA // MERIDIAN CITY</div>
        <div className="bootstrap-mark">GTD<span className="text-primary">.</span></div>
        <h2 className="game-title mt-2">GRAND THEFT DIVISION</h2>
        <div className={`load-budget-meter ${budget.exceeded ? "load-budget-over" : ""}`}
          data-gtd-startup-budget={budget.exceeded ? "over" : "within"}
          role="timer"
          aria-label="Elapsed game loading time versus 60-second target"
          aria-live="off">
          <div className="load-budget-heading">
            <span>GAME LOADING TIME</span>
            <span>{budget.exceeded ? "60s BUDGET EXCEEDED" : "TARGET: 60 SECONDS"}</span>
          </div>
          <div className="load-budget-face">
            <output data-testid="startup-clock">{formatStartupDuration(elapsedSeconds)}</output>
            <span className="load-budget-separator">/</span>
            <span>{formatStartupDuration(STARTUP_LOAD_BUDGET_SECONDS)}</span>
          </div>
          <div className="load-budget-variance">
            {budget.exceeded
              ? `OUTSIDE ATTENTION WINDOW // +${formatStartupDuration(budget.overBySeconds)}`
              : `TIME REMAINING // ${formatStartupDuration(budget.remainingSeconds)}`}
          </div>
        </div>
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
            {onDownloadStartupDiagnostics && (
              <button
                type="button"
                className="mt-3 mr-5 text-primary underline"
                data-gtd-startup-diagnostics="true"
                onClick={onDownloadStartupDiagnostics}
              >Download startup diagnostics (JSON)</button>
            )}
            {onDownloadDiagnostics && (
              <button
                type="button"
                data-gtd-character-data-download="true"
                className="mt-3 mr-5 text-primary underline"
                onClick={onDownloadDiagnostics}
              >
                Download character trial data (JSON)
              </button>
            )}
            {onRetryUpdate ? (
              <div className="mt-3 flex gap-5">
                <button type="button" className="text-primary underline" onClick={onRetryUpdate}>Retry update</button>
                <button type="button" className="text-primary underline" onClick={onContinueCurrentBuild}>
                  Continue with installed build
                </button>
              </div>
            ) : (
              <button type="button" className="mt-3 text-primary underline" onClick={() => window.location.reload()}>
                Retry loading
              </button>
            )}
          </div>
        )}
        {!error && (
          <div className="overlay-note">
            <p>The game opens only after the requested vehicle imports and the first rendered frame settle.</p>
            <button
              type="button"
              className="mt-2 text-primary underline"
              onClick={() => window.location.reload()}
              aria-label="Restart game loading"
            >
              Restart loading if a network request remains stuck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
