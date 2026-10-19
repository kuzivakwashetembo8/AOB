import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import { OFFLINE_CATEGORIES, type OfflineProgress } from "@/lib/offline-game";

/** OFFLINE-003: read-only, truthful summary of verified game resources. */
export function OfflineInstallChecklist({
  progress, standalone,
}: {progress:OfflineProgress; standalone:boolean}) {
  const checking=progress.phase==="checking";
  const downloading=progress.phase==="downloading";
  const ready=progress.phase==="ready" && standalone;
  const anyKnown=progress.categories.some(group=>group.total>0);
  // Whole-pack counters remain FILE counts. Vehicle rows are unique MODEL
  // counts, so adding the displayed category numerators would mix units.
  const appLabel=standalone?"Installed":"Not confirmed";
  return (
    <section className="offline-checklist" aria-label="G.T.D installation checklist">
      <div className="offline-checklist-heading">
        <h2>GAME INSTALLATION</h2>
        <span className="offline-checklist-overline">
          {ready?"COMPLETE":downloading?"INSTALLING":checking?"CHECKING":"STATUS"}
        </span>
      </div>
      <p className="offline-checklist-intro">
        Your game is ready to play without Wi-Fi only when everything below is installed.
      </p>
      <ol className="offline-checklist-items">
        <li className="offline-checklist-item">
          <span className="offline-checklist-icon">
            {standalone?<CheckCircle2 size={17} aria-hidden="true"/>:
              <Circle size={17} aria-hidden="true"/>}
          </span>
          <span className="offline-checklist-info">
            <strong>GTD app on this device</strong>
            <small>{standalone?"Opened from your installed app":
              "Install from the browser, then open GTD from its app icon"}</small>
          </span>
          <span className={standalone?"offline-checklist-status is-complete":"offline-checklist-status"}>
            {appLabel}
          </span>
        </li>
        {OFFLINE_CATEGORIES.map(category=>{
          const group=progress.categories.find(entry=>entry.id===category.id);
          const total=group?.total??0;
          const installed=group?.installed??0;
          const complete=total>0 && installed===total;
          return (
            <li className="offline-checklist-item" key={category.id}>
              <span className="offline-checklist-icon">
                {complete?<CheckCircle2 size={17} aria-hidden="true"/>:
                  downloading && installed>0?<LoaderCircle size={17} aria-hidden="true"/>:
                    <Circle size={17} aria-hidden="true"/>}
              </span>
              <span className="offline-checklist-info">
                <strong>{category.label}</strong>
                <small>{category.detail}</small>
              </span>
              <span className={complete?"offline-checklist-status is-complete":"offline-checklist-status"}>
                {complete?"Installed":total>0?`${installed} / ${total}`:
                  checking?"Checking":"Not checked"}
              </span>
            </li>
          );
        })}
        <li className="offline-checklist-item offline-checklist-final">
          <span className="offline-checklist-icon">
            {ready?<CheckCircle2 size={17} aria-hidden="true"/>:<Circle size={17} aria-hidden="true"/>}
          </span>
          <span className="offline-checklist-info">
            <strong>Play without Wi-Fi</strong>
            <small>{ready?"All resources installed. Disconnect and play.":
              "Available after installation and verification"}</small>
          </span>
          <span className={ready?"offline-checklist-status is-complete":"offline-checklist-status"}>
            {ready?"READY":"Waiting"}
          </span>
        </li>
      </ol>
      <p className="offline-checklist-footnote">
        {anyKnown?`${progress.done} of ${progress.total} resource files installed · ${(progress.bytesDone/1e6).toFixed(1)} of ${(progress.bytesTotal/1e6).toFixed(1)} MB verified.`:
          "Connect to Wi-Fi to check the game download."}
        {" "}Each category updates automatically as files arrive.
      </p>
      {progress.phase==="error" && (
        <p className="offline-checklist-error" role="alert">
          Download paused: {progress.message}. Retry above when connected to Wi-Fi.
        </p>
      )}
    </section>
  );
}
