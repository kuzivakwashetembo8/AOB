import { useState } from "react";
import { Download } from "lucide-react";
import { useInstallPrompt } from "@/lib/standalone";

/** Subtle launcher install control; renders nothing when install is unavailable or already installed. */
export function InstallAction() {
  const { availability, install } = useInstallPrompt();
  const [hint, setHint] = useState(false);
  if (availability === "unavailable") return null;
  return (
    <span className="install-action">
      <button
        type="button"
        className="install-button"
        aria-expanded={availability === "ios" ? hint : undefined}
        onClick={() => (availability === "prompt" ? void install() : setHint((v) => !v))}
      >
        <Download size={12} aria-hidden /> INSTALL
      </button>
      {hint && availability === "ios" && (
        <span className="install-hint" role="note">
          SHARE <span className="text-primary">→</span> ADD TO HOME SCREEN
        </span>
      )}
    </span>
  );
}
