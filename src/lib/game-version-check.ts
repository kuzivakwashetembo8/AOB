/**
 * REL-010: a Git commit is NOT a production release. This compares the code
 * running in this tab against this origin's last explicitly deployed build.
 * Only GTD shell navigation cache may be retired. Never clear saved data.
 */
declare const __GTD_RELEASE_ID__: string;
declare const __GTD_RELEASE_ENV__: string;
export type VersionDecision = "current" | "offline" | "reload" | "retry-needed";
export type ReleaseManifest = {schema: "gtd-release-v1"; releaseId: string; environment: string; builtAt: string};
export const GTD_VERSION_ATTEMPT_KEY = "gtd-release-attempt-v1";
export const GTD_VERSION_BYPASS_KEY = "gtd-release-bypass-once-v1";

export function validRelease(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{40}$/.test(value);
}
export function decideDeployedRelease(
  running: string, manifest: ReleaseManifest | null, alreadyAttempted: boolean,
): VersionDecision {
  if (!validRelease(running) || !manifest || manifest.schema !== "gtd-release-v1" ||
    !validRelease(manifest.releaseId)) return "offline";
  if (running === manifest.releaseId) return "current";
  return alreadyAttempted ? "retry-needed" : "reload";
}

/** Bounded initial-load check; never runs again while driving. */
export async function checkGameStartupVersion(): Promise<VersionDecision> {
  if (typeof window === "undefined" || !import.meta.env.PROD) return "current";
  const running = __GTD_RELEASE_ID__;
  if (!validRelease(running)) return "offline";
  const store = (() => {try{return window.sessionStorage;}catch{return null;}})();
  try {
    if (store?.getItem(GTD_VERSION_BYPASS_KEY) === "1") {
      store.removeItem(GTD_VERSION_BYPASS_KEY);
      return "offline";
    }
  } catch { /* storage denied: URL sentinel still guards loops */ }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);
  let manifest: ReleaseManifest | null = null;
  try {
    const response = await fetch("/build-version.json", {
      cache: "no-store", signal: controller.signal,
      headers: { "cache-control": "no-cache" },
    });
    if (response.ok) {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "schema" in body) {
        manifest = body as ReleaseManifest;
      }
    }
  } catch { /* offline, DNS, aborted or deployment propagation */ }
  finally {window.clearTimeout(timeout);}

  // Origin scoping avoids interpreting a different app's manifest.
  if (manifest && manifest.environment !== __GTD_RELEASE_ENV__) return "offline";
  const target = manifest?.releaseId;
  let previous: string | null = null;
  try { previous = store?.getItem(GTD_VERSION_ATTEMPT_KEY) ?? null; }
  catch { /* storage denied */ }
  const url = new URL(window.location.href);
  const attempt = target && (previous === target ||
    url.searchParams.get("gtd_release") === target.slice(0, 12));
  const decision = decideDeployedRelease(running,manifest,!!attempt);
  if (decision === "current") {
    try {store?.removeItem(GTD_VERSION_ATTEMPT_KEY);}catch { /* ignored */ }
    if (url.searchParams.has("gtd_release")) {
      url.searchParams.delete("gtd_release");
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }
  if (decision !== "reload" || !target) return decision;

  // The URL sentinel protects against infinite reload even if storage is
  // unavailable and preserves the other query parameters of /game.
  try {store?.setItem(GTD_VERSION_ATTEMPT_KEY,target);}catch { /* ignored */ }
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) await Promise.race([
      registration.update(),
      new Promise<void>(resolve=>window.setTimeout(resolve,1500)),
    ]);
  } catch { /* still perform network navigation */ }
  try {
    if (typeof caches !== "undefined") await caches.delete("gtd-shell-pages");
  } catch { /* restricted CacheStorage must not block startup */ }
  url.searchParams.set("gtd_release",target.slice(0,12));
  window.location.replace(url.toString());
  return "reload";
}

export function retryGameUpdate(): void {
  try {sessionStorage.removeItem(GTD_VERSION_ATTEMPT_KEY);}catch { /* ignored */ }
  const url = new URL(window.location.href);
  url.searchParams.delete("gtd_release");
  window.location.replace(url.toString());
}
export function continueWithInstalledBuild(): void {
  try {sessionStorage.setItem(GTD_VERSION_BYPASS_KEY,"1");}catch { /* ignored */ }
  const url = new URL(window.location.href);
  url.searchParams.delete("gtd_release");
  // Persist URL bypass as a last resort if session storage is restricted.
  if (!sessionStorageAvailable()) url.searchParams.set("gtd_offline","1");
  window.location.replace(url.toString());
}
function sessionStorageAvailable() {
  try {return !!window.sessionStorage;} catch {return false;}
}
