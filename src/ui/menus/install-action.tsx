import { useEffect, useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { useInstallPrompt } from "@/lib/standalone";
import { OfflineInstallChecklist } from "./offline-install-checklist";
import {
  getOfflineProgress, subscribeOfflineProgress, inspectOfflineReadiness,
  startOfflineDownload,
} from "@/lib/offline-game";

type InstallPlacement = "launcher" | "settings";
function mb(n: number) { return (n / 1_000_000).toFixed(1); }

/**
 * OFFLINE-003: one Install action handles native PWA install and complete game
 * download. Android needs Wi-Fi until the full verified pack says READY.
 */
export function InstallAction({ placement = "launcher" }: { placement?: InstallPlacement }) {
  const { availability, install, standalone } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(getOfflineProgress);

  useEffect(() => {
    const unsubscribe = subscribeOfflineProgress(setProgress);
    void inspectOfflineReadiness().then(() => {
      // Installation is resumed automatically from the Android app after a
      // browser process switch. Already verified resources are not re-fetched.
      if (standalone && getOfflineProgress().phase !== "ready") {
        void startOfflineDownload();
      }
    });
    return unsubscribe;
  }, [standalone]);

  function onInstall() {
    setError(false);
    // Start downloading without awaiting: the browser's beforeinstallprompt
    // requires the direct user gesture and must be invoked immediately.
    if (progress.phase !== "ready") void startOfflineDownload();
    if (standalone) return;
    if (availability !== "prompt") {
      setShowHelp((current) => !current);
      return;
    }
    void install().then((accepted) => {
      if (!accepted) setShowHelp(true);
    }).catch(() => {
      setError(true);
      setShowHelp(true);
    });
  }

  // A browser tab with complete files isn't proof the Android home-screen
  // app has been launched. Keep the headline consistent with Settings.
  const ready=progress.phase === "ready" && standalone;
  const filesReady=progress.phase === "ready" && !standalone;
  const downloading=progress.phase === "downloading" || progress.phase === "checking";
  const pct=progress.bytesTotal>0
    ? Math.min(100,Math.round(progress.bytesDone/progress.bytesTotal*100)) : 0;
  const ios = availability === "ios";

  return (
    <div className={`install-action install-action--${placement}`}>
      {standalone ? (
        <div className="install-installed" role="status">
          <CheckCircle2 size={19} aria-hidden="true" /> G.T.D APP INSTALLED
        </div>
      ) : (
        <button
          type="button"
          className="install-button"
          aria-label="Install G.T.D application"
          aria-expanded={showHelp}
          onClick={onInstall}
        >
          <Download size={19} strokeWidth={2.5} aria-hidden="true" />
          <span>INSTALL G.T.D</span>
        </button>
      )}
      {ready ? (
        <p className="offline-ready" role="status">
          <CheckCircle2 size={15} aria-hidden="true" />
          READY FOR OFFLINE PLAY — Wi-Fi can be turned off.
        </p>
      ) : (
        <>
          {filesReady && (
            <p className="install-disclaimer" role="status">
              Game files downloaded. Open GTD from its installed app icon to
              confirm offline play.
            </p>
          )}
          {standalone && !downloading && (
            <button className="install-button" type="button" onClick={onInstall}>
              <Download size={18} /> {progress.phase === "error" ? "RETRY DOWNLOAD" : "DOWNLOAD OFFLINE GAME"}
            </button>
          )}
          {progress.phase === "downloading" && (
            <div className="offline-download" role="status" aria-live="polite">
              <div className="offline-download-label">
                <span>INSTALLING GAME RESOURCES</span><span>{pct}%</span>
              </div>
              <div className="offline-download-track" role="progressbar"
                aria-label="Offline game download" aria-valuemin={0}
                aria-valuemax={100} aria-valuenow={pct}>
                <div className="offline-download-fill" style={{width:`${pct}%`}} />
              </div>
              <p>{mb(progress.bytesDone)} / {mb(progress.bytesTotal)} MB verified</p>
            </div>
          )}
          {progress.phase === "error" && (
            <p className="install-hint" role="alert">
              {progress.message}. Keep Wi-Fi connected and tap {standalone ? "Retry Download" : "Install G.T.D"} to resume.
            </p>
          )}
          <p className="install-disclaimer">
            {filesReady
              ? "Install or open the GTD app from your device home screen."
              : "Keep GTD open and Wi-Fi connected until it says READY FOR OFFLINE PLAY."}
          </p>
        </>
      )}
      {showHelp && !standalone && (
        <p className="install-hint" role="status">
          {error ? "The browser could not open the installer. " : ""}
          {ios
            ? "On iPhone or iPad: Share → Add to Home Screen."
            : "In your browser menu, select Install app or Add to Home Screen if available."}
        </p>
      )}
      {placement === "settings" && (
        <OfflineInstallChecklist progress={progress} standalone={standalone} />
      )}
    </div>
  );
}
