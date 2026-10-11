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

/**
 * Independent HEAD check for the SAME hashed JS module that failed to import.
 * Programmatic HEAD has no script destination, avoiding the PWA script cache
 * handler while preserving cookies on the preview's origin. No file content
 * or credentials are collected in the exported report.
 */
export function failedRuntimeModuleUrl(error: string | null, origin: string): string | null {
  if (!error) return null;
  const match = error.match(/https?:\/\/[^\s"'<>]+\/assets\/gtd-runtime-[A-Za-z0-9_-]+\.js(?:\?[^\s"'<>]+)?/);
  if (!match) return null;
  try {
    const url = new URL(match[0]);
    if (url.origin !== origin) return null;
    return url.origin + url.pathname;
  } catch {
    return null;
  }
}

export async function probeCharacterModuleRequest(
  error: string | null,
  origin: string,
  request: typeof fetch,
) {
  const asset = failedRuntimeModuleUrl(error, origin);
  if (!asset) return { attempted: false as const, reason: "No matching same-origin runtime JS URL in error" };
  try {
    const response = await request(asset, {
      method: "HEAD",
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(6500),
    });
    let finalOrigin = "";
    try { finalOrigin = new URL(response.url).origin; } catch { /* opaque redirect */ }
    return {
      attempted: true as const,
      asset,
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      contentType: response.headers.get("content-type"),
      finalOrigin,
      serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
      note: "A later HEAD response is diagnostic only: it does not recreate the failed JavaScript import.",
    };
  } catch (cause) {
    return {
      attempted: true as const,
      asset,
      networkError: cause instanceof Error ? cause.name + ": " + cause.message : String(cause),
      serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
      note: "CORS, network, browser policy, authentication redirect, or timeout may block the HEAD request.",
    };
  }
}

export async function downloadCharacterTrialEvidence(
  error: string | null,
  entries: readonly StartupCheckEntry[],
  browserErrors: readonly string[] = [],
): Promise<void> {
  let runtime: unknown = null;
  let captureError: string | null = null;
  try {
    runtime = window.__GTD_CHAR_DIAGNOSTICS__?.() ?? null;
  } catch (reason) {
    captureError = reason instanceof Error ? reason.message : String(reason);
  }
  // Resolve asset status before making the local JSON download. The probe
  // cannot affect Babylon or startup checkpoints.
  const moduleRequest = await probeCharacterModuleRequest(error, window.location.origin, fetch);
  const snapshot = {
    ...composeCharacterTrialDownload(error, entries, runtime, {
      capturedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      browserErrors,
    }),
    captureError,
    moduleRequest,
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
