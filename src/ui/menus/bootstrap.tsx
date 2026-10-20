import type {StartupCheckEntry} from "@/game/core/loading-checklist";
import type {AuditSnapshot} from "@/lib/real-loading-ledger";
import {LiveLoadingInspector} from "./live-loading-inspector";
import "./real-loading.css";
import {
 STARTUP_LOAD_BUDGET_SECONDS,describeStartupBudget,formatStartupDuration,
} from "@/game/core/startup-load-budget";

/** OBS-105: no retired imports, no planned eight-item list, no fake %
 * denominators. Rows exist only after a measured operation has started or
 * a completed browser resource timing has actually been observed. */
export function BootstrapOverlay({
  entries: _entries, measured, elapsedSeconds=0,error,
  onDownloadDiagnostics,onDownloadStartupDiagnostics,onRetryUpdate,onContinueCurrentBuild,
}:{
  entries:readonly StartupCheckEntry[];
  measured?:AuditSnapshot|undefined;
  elapsedSeconds?:number;error?:string|null;
  onDownloadDiagnostics?:(()=>void)|undefined;
  onDownloadStartupDiagnostics?:(()=>void)|undefined;
  onRetryUpdate?:(()=>void)|undefined;
  onContinueCurrentBuild?:(()=>void)|undefined;
}){
  const budget=describeStartupBudget(elapsedSeconds);
  return <div className="overlay gtd-real-overlay" role="status" aria-label="Preparing Meridian game">
    <div className="overlay-content gtd-real-content">
      <div className="gtd-real-heading">
        <div className="system-label text-primary">MERIDIA // MERIDIAN CITY</div>
        <div className="bootstrap-mark">GTD<span className="text-primary">.</span></div>
        <h2 className="game-title">GRAND THEFT DIVISION</h2>
        <div className={`load-budget-meter ${budget.exceeded?"load-budget-over":""}`}
          data-gtd-startup-budget={budget.exceeded?"over":"within"}
          role="timer" aria-label="Elapsed game loading time versus 60-second target">
          <div className="load-budget-heading">
            <span>GAME LOADING TIME</span><span>{budget.exceeded?"60s BUDGET EXCEEDED":"TARGET: 60 SECONDS"}</span>
          </div>
          <div className="load-budget-face">
            <output data-testid="startup-clock">{formatStartupDuration(elapsedSeconds)}</output>
            <span className="load-budget-separator">/</span>
            <span>{formatStartupDuration(STARTUP_LOAD_BUDGET_SECONDS)}</span>
          </div>
          <div className="load-budget-variance">
            {budget.exceeded?
              `OUTSIDE ATTENTION WINDOW // +${formatStartupDuration(budget.overBySeconds)}`:
              `TIME REMAINING // ${formatStartupDuration(budget.remainingSeconds)}`}
          </div>
        </div>
      </div>
      {measured&&<LiveLoadingInspector snapshot={measured}/>}
      <div className="gtd-real-footer">
        {onDownloadStartupDiagnostics&&
          <button type="button" className="text-primary underline"
            data-gtd-startup-diagnostics="true" onClick={onDownloadStartupDiagnostics}>
            Download measured startup diagnostics (JSON)
          </button>}
        {error&&<span role="alert" className="text-destructive">Meridian could not finish startup: {error}</span>}
        {onDownloadDiagnostics&&error&&
          <button type="button" className="text-primary underline"
            data-gtd-character-data-download="true" onClick={onDownloadDiagnostics}>
            Download character trial data (JSON)
          </button>}
        {onRetryUpdate&&error&&
          <button type="button" className="text-primary underline" onClick={onRetryUpdate}>Retry update</button>}
        {onContinueCurrentBuild&&error&&
          <button type="button" className="text-primary underline"
            onClick={onContinueCurrentBuild}>Continue with installed build</button>}
        {!onRetryUpdate&&<button type="button" className="text-primary underline"
          onClick={()=>window.location.reload()}>Restart loading</button>}
      </div>
    </div>
  </div>;
}
