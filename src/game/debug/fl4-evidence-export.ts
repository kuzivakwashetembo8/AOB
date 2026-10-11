/**
 * FL4-01/02/03 — opt-in capture of native device diagnostics without DevTools.
 * Only created on /game?fl4Diagnostics=1; no telemetry leaves the device.
 */
import type { FL4Report } from "./fl4-diagnostics";
import type { ImportedCarProbeReport } from "../experiments/imported-car-evaluation";

export interface FL4EvidenceSnapshot {
  readonly schema: "gtd.fl4.evidence.v1";
  readonly capturedAt: string;
  readonly page: string;
  readonly vehicleMode: "imports" | "baseline";
  readonly metrics: FL4Report;
  readonly importedVehicles: ImportedCarProbeReport | null;
}

export function composeFL4EvidenceSnapshot(
  metrics: FL4Report,
  importedVehicles: ImportedCarProbeReport | null,
  page: string,
  capturedAt: string,
): FL4EvidenceSnapshot {
  return {
    schema: "gtd.fl4.evidence.v1",
    capturedAt,
    page,
    vehicleMode: importedVehicles === null ? "baseline" : "imports",
    metrics,
    importedVehicles,
  };
}

/**
 * Small development capture surface. The canvas, game commands, simulation,
 * physics, and scene render policy remain unchanged. Ordinary /game never
 * creates this button. An export requires an explicit user click.
 */
export function mountFL4EvidenceExport(
  metrics: () => FL4Report,
  importedVehicles: () => ImportedCarProbeReport | null,
): () => void {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Save FL-4 data";
  button.setAttribute("aria-label", "Save local FL-4 device and vehicle diagnostic report");
  button.setAttribute("data-gtd-fl4-export", "true");
  Object.assign(button.style, {
    position: "fixed",
    top: "max(6px, env(safe-area-inset-top))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "60",
    boxSizing: "border-box",
    height: "32px",
    minHeight: "32px",
    maxHeight: "32px",
    width: "auto",
    maxWidth: "170px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    flexShrink: "0",
    border: "1px solid rgba(255,255,255,.45)",
    borderRadius: "6px",
    background: "rgba(11,18,27,.92)",
    color: "white",
    padding: "0 10px",
    fontFamily: "system-ui, sans-serif",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    touchAction: "manipulation",
    whiteSpace: "nowrap",
  } as Partial<CSSStyleDeclaration>);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    try {
      const snapshot = composeFL4EvidenceSnapshot(
        metrics(),
        importedVehicles(),
        window.location.href,
        new Date().toISOString(),
      );
      const data = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const objectUrl = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "gtd-fl4-" + snapshot.vehicleMode + "-" +
        snapshot.capturedAt.replace(/[:.]/g, "-") + ".json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      button.textContent = "FL-4 data saved";
    } catch (error) {
      button.textContent = "FL-4 export failed";
      console.error("[FL4] Local diagnostic export failed", error);
    }
  });

  // The standalone PWA styles body > * as 100%-height containers. Appending
  // a button directly under body produced a full-screen central panel on
  // Android. Mount inside the existing game viewport instead.
  const gameViewport = document.querySelector(".game-viewport");
  (gameViewport ?? document.body).appendChild(button);
  return () => button.remove();
}
