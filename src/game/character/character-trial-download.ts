import type { StartupCheckEntry } from "../core/loading-checklist";

/**
 * Locally generated failure evidence; never transmitted automatically.
 * Downloads remain available even when Babylon initialization fails at 7/8.
 */
export function composeCharacterTrialDownload(
  error: string | null,
  entries: readonly StartupCheckEntry[],
  runtime: unknown,
  details: {
    capturedAt: string;
    userAgent: string;
    browserErrors?: readonly string[];
  },
) {
  return {
    schema: "gtd.char001.startup-evidence.v1" as const,
    capturedAt: details.capturedAt,
    page: typeof window === "undefined" ? "/game" : window.location.origin + window.location.pathname,
    trial: "ual",
    userAgent: details.userAgent,
    error,
    checkpoints: entries.map(entry => ({ ...entry })),
    browserErrors: (details.browserErrors ?? []).slice(-25),
    runtime,
    notes: [
      "Captured by explicit user request; not automatically uploaded.",
      "Browser console may contain additional shader messages not represented by window error events.",
      "A successful HTTP response is not evidence of actual Babylon ground/character rendering.",
    ],
  };
}

export function downloadCharacterTrialEvidence(
  error: string | null,
  entries: readonly StartupCheckEntry[],
  browserErrors: readonly string[] = [],
): void {
  let runtime: unknown = null;
  let captureError: string | null = null;
  try {
    runtime = window.__GTD_CHAR_DIAGNOSTICS__?.() ?? null;
  } catch (reason) {
    captureError = reason instanceof Error ? reason.message : String(reason);
  }
  const snapshot = {
    ...composeCharacterTrialDownload(error, entries, runtime, {
      capturedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      browserErrors,
    }),
    captureError,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "gtd-char001-startup-" + snapshot.capturedAt.replace(/[:.]/g, "-") + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
