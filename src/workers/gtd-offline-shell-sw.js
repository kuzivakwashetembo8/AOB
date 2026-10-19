/* OFFLINE-002: generated release-scoped app-shell worker.
 * Build substitutes the config constant with a vetted, exact set of
 * same-origin static shell resources. Do NOT add GLBs, physics WASM or world
 * packs here; OFFLINE-003 owns complete game downloads and verification.
 */
const config = __GTD_OFFLINE_SHELL_CONFIG__;
const CACHE_NAME = "gtd-offline-shell-" + config.releaseId;
const GAME_CACHE_NAME = "gtd-offline-game-" + config.releaseId;
const SHELL_URL = "/_shell.html";
const ROUTES = new Set(["/", "/settings", "/world", "/game"]);
const SHELL_PREFIXES = ["/icons/", "/offline001/fonts/"];
const SHELL_FILES = new Set(["/manifest.webmanifest", "/favicon.png", "/_shell.html"]);
const REQUIRED = new Set(config.resources);
const sameOrigin = (url) => url.origin === self.location.origin;
const isShellAsset = (url) => sameOrigin(url) &&
  (SHELL_FILES.has(url.pathname) ||
    SHELL_PREFIXES.some(p => url.pathname.startsWith(p)) ||
    (url.pathname.startsWith("/assets/") && /\.(js|css|jpe?g|svg)$/.test(url.pathname)));
function fromCache(request) {
  return caches.open(CACHE_NAME).then(cache => cache.match(request, {ignoreSearch: false}));
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Bounded batches prevent hundreds of simultaneous connections on mobile.
    for (let index = 0; index < config.resources.length; index += 6) {
      await cache.addAll(config.resources.slice(index, index + 6));
    }
    // Fail-closed: an incomplete shell MUST NOT activate. Retain the old worker.
    for (const url of config.resources) {
      if (!(await cache.match(url))) throw Error("Missing release shell resource: " + url);
    }
    // No skipWaiting: do not replace a live player's controlling worker.
  })());
});

self.addEventListener("activate", event => {
  // No global cache cleanup and no forced clients.claim; previously working
  // releases stay intact. OFFLINE-007 will own reference-aware GC/activation.
  event.waitUntil(Promise.resolve());
});

// The checklist must verify the controlling worker belongs to THIS release.
// An older installed PWA worker can otherwise make cached files appear ready
// while still serving resources from a different release.
self.addEventListener("message", event => {
  if (event.data?.type !== "GTD_OFFLINE_RELEASE_QUERY") return;
  event.ports?.[0]?.postMessage({
    type:"GTD_OFFLINE_RELEASE",releaseId:config.releaseId,
  });
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!sameOrigin(url)) return;
  // API calls, build-version checks, telemetry, authentication, and HTTP
  // requests outside the public app routes are always left to the network.
  if (request.mode === "navigate" && ROUTES.has(url.pathname.replace(/\/$/, "") || "/")) {
    event.respondWith((async () => {
      // Existing online SSR/redirect behavior remains available; a bounded
      // network attempt falls back to the exact release's client-side shell.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const response = await fetch(request, {signal: controller.signal});
        if (response.ok && response.headers.get("content-type")?.includes("text/html"))
          return response;
      } catch { /* offline, timeout, server failure */ }
      finally { clearTimeout(timer); }
      return await fromCache(SHELL_URL) ?? Response.error();
    })());
    return;
  }
  // OFFLINE-003: the complete game pack is downloaded and SHA-256 verified by
  // the Install UI. Only same-release static resources are served from it.
  // Never intercept telemetry, authorization, version checks or worker scripts.
  if (url.pathname === "/sw.js" || url.pathname === "/build-version.json" ||
      url.pathname.startsWith("/api/") || url.pathname.startsWith("/~oauth")) return;
  const isGameResource = isShellAsset(url) ||
    /\.(?:glb|gltf|bin|wasm|webp|png|jpg|jpeg|svg|json|css|js|woff2?|ttf)$/i.test(url.pathname);
  if (!isGameResource) return;
  event.respondWith((async () => {
    // CacheStorage is shared by the installed PWA and this worker. The
    // downloader only stores content after verifying its cryptographic hash.
    const gameCache = await caches.open(GAME_CACHE_NAME);
    const gameFile = await gameCache.match(request);
    if (gameFile) return gameFile;
    const cached = await fromCache(request);
    if (cached) return cached;
    // Optional chunks can be cached opportunistically when online. Required
    // chunks were downloaded by install and must be present before activation.
    try {
      const response = await fetch(request);
      if (response.ok && response.type !== "opaque" && !url.pathname.includes("/api/")) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
