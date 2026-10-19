import { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { useInstallPrompt } from "@/lib/standalone";

type InstallPlacement = "launcher" | "settings";

/**
 * OFFLINE-001: prominent application installation CTA.
 * Installing the PWA shell is NOT the same as installing every game resource.
 * OFFLINE-003 will own the complete verified content-pack installer.
 */
export function InstallAction({ placement = "launcher" }: { placement?: InstallPlacement }) {
  const { availability, install, standalone } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState(false);

  if (standalone) {
    return (
      <div className={`install-action install-action--${placement}`}>
        <div className="install-installed" role="status">
          <CheckCircle2 size={19} aria-hidden="true" /> G.T.D APP INSTALLED
        </div>
        <p className="install-disclaimer">Full offline game resources are not ready yet.</p>
      </div>
    );
  }

  async function onInstall() {
    setError(false);
    if (availability !== "prompt") {
      setShowHelp((current) => !current);
      return;
    }
    try {
      const accepted = await install();
      if (!accepted) setShowHelp(true);
    } catch {
      setError(true);
      setShowHelp(true);
    }
  }

  const ios = availability === "ios";
  return (
    <div className={`install-action install-action--${placement}`}>
      <button
        type="button"
        className="install-button"
        aria-label="Install G.T.D application"
        aria-expanded={showHelp}
        onClick={() => void onInstall()}
      >
        <Download size={19} strokeWidth={2.5} aria-hidden="true" />
        <span>INSTALL G.T.D</span>
      </button>
      <p className="install-disclaimer">
        Add the app to your device. Complete offline resources come in a later update.
      </p>
      {showHelp && (
        <p className="install-hint" role="status">
          {error ? "The browser could not open the installer. " : ""}
          {ios
            ? "On iPhone or iPad: Share → Add to Home Screen."
            : "In your browser menu, select Install app or Add to Home Screen if available."}
        </p>
      )}
    </div>
  );
}
