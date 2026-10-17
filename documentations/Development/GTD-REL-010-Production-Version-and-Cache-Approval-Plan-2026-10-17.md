# REL-010 — Production update detection, build selection and safe cache refresh

Date: 2026-10-17
State: APPROVED FOR IMPLEMENTATION — IMPLEMENTED ON ISOLATED REVIEW BRANCH. Preview QA pending; manual production release policy retained.
Goal: a new game launch loads the newest actually deployed and approved build, while preserving player/device data.

## Current release contract and critical distinction

GTD's AGENTS.md, README.md and vercel.json explicitly disable automatic Git deployments ('git.deploymentEnabled: false', 'ignoreCommand: exit 1'). A newly committed GitHub main is **not** automatically available to Vercel users. Therefore neither Ctrl+F5 nor programmatic cache eviction can guarantee the latest repository HEAD. The correct boot-time source of truth is the currently served immutable production deployment, not a raw GitHub commit query. If main has moved and Vercel has not deployed it, the launcher may surface a diagnostic "awaiting release" state but must not refresh on a nonexistent build.

Current PWA: src/lib/pwa.ts registers /sw.js only on supported production top-level pages. vite.config.ts has Workbox NetworkFirst navigation (4-second timeout), CacheFirst hashed scripts/styles/fonts, branded image cache and skipWaiting/clientsClaim. scripts/publish-pwa-worker.mjs copies generated worker/Workbox files to .vercel/output/static. An outdated installed service worker, stale HTML or static cache can keep older code active.

## Proposed deploy-time protocol

1. The explicit Vercel deployment pipeline must emit one unique RELEASE_ID containing immutable Git SHA, manifest hash, build timestamp and compatibility schema version. Include the exact same RELEASE_ID in the startup bundle and a small same-origin /build-version.json endpoint. HTTP response must be no-store, revalidation-safe, and independently checked against the served deployment. Never expose secret CI variables.
2. During initial loading, make a bounded, abortable GET using fetch cache:no-store to the same-origin version endpoint, optionally with a monotonically unique cache-buster. Compare running RELEASE_ID with **deployed** RELEASE_ID, not GitHub main HEAD. If equal, boot normally. If offline or timed out, permit graceful cached/offline gameplay with a clear status; avoid indefinite loader.
3. On mismatch, request serviceWorker registration.update(), wait for an activated matching worker when required, then retire only known, version-scoped GTD app-shell cache entries and stale navigation documents. Favor immutable content-hashed assets over indiscriminate cache clearing. Keep older asset chunks available during multi-tab rollout to prevent mixed-version module loads.
4. Preserve localStorage, the local settings key, IndexedDB/game saves, cookies, auth/session data, CacheStorage outside the specifically owned application-shell caches, and user-downloaded/offline world assets. No localStorage.clear, indexedDB.deleteDatabase, origin-wide storage wipe or Clear-Site-Data wildcard. Do not delete stored player state as a side-effect of checking for updates.
5. Reload at most once per expected deployment ID per session. Use a narrowly named session sentinel and clear it after an acknowledged successful boot. On repeated mismatch, show an explicit recoverable Retry update / Continue offline UI with diagnostics instead of looping. Do not interrupt an already active driving session; update at next safe launcher/initial boot checkpoint.
6. Avoid race between a stale app shell and a newly changed deployment: HTML-to-hashed-script consistency, release pinning, service-worker lifecycle, atomic publish and rollback support all need tests.

## Owner policy decision

Recommended policy: retain manual production promotion. The updater tracks the latest **approved deployed** RELEASE_ID and loads it on cold start; merely pushing main never constitutes release authorization. Alternative: a new CI system that tests, approves and deploys each main commit automatically. That changes the project's release governance and must be approved separately. A manual version picker is possible only with immutable release URLs/manifest retention and security/rollback controls; it is not just cache invalidation.

## Tests, instrumentation and rollback

Automated cases: same build/no reload, changed build/one reload, Git main newer but not deployed/no reload, offline/timeout, stale worker, activation delay, corrupt manifest, failed chunk, cross-tab workers, stale hash, version rollback, one-reload sentinel, cache ownership isolation. Assert persisted preferences, player state, saves and authentication survive bit-for-bit. Real tests on installed PWA Android Chrome, desktop browsers, fresh visits, return visits, degraded connectivity, rolling deployment and rollback. Plain /game and the exact Rover GLB URL must still render when latest approved production build is active. Log only release ID, worker state, update decisions and error reason (no player data).

Approval gate: owner signs off manual-vs-automated deployment policy, initial loading handshake, explicit update/rollback UI and complete persistence/worker QA. Until approval, existing production behavior remains unchanged.

## Implementation handoff (authorized 2026-10-17)

- `vite.config.ts` embeds the deploy source SHA and environment in the startup bundle as `__GTD_RELEASE_ID__` and `__GTD_RELEASE_ENV__`, from Vercel Git metadata.
- `scripts/publish-pwa-worker.mjs` writes `/build-version.json` into deployed Nitro static files with schema, release SHA, environment and timestamp after build. Vercel Git deployment must provide SHA at build time; deployments without a valid immutable SHA fail closed rather than promise unproven freshness. A future non-Git CLI release must pass build metadata explicitly.
- `vercel.json` adds no-store HTTP caching for the version manifest and revalidation for `/sw.js`. Automatic Git builds remain disabled.
- `src/lib/game-version-check.ts` compares running bundle to SAME-ORIGIN deployed metadata before the costly /game Babylon import; aborts after 2.5 s and proceeds offline if metadata unavailable. On mismatch it requests the active worker update (bounded), deletes ONLY `gtd-shell-pages` navigation cache, and navigates to the specific new deployed SHA with at-most-once URL/session sentinel. Never clears data stores, private keys, history, or other caches.
- `src/routes/game.tsx` gates initial boot on version comparison, displays bounded recovery UI on repeated mismatch. `src/ui/menus/bootstrap.tsx` exposes retry and continue-current-build actions; no update interruption during driving.
- `src/test/production-version-check.test.ts` tests version decision matrix and missing metadata. Existing `src/test/pwa-worker-publish.test.ts` protects worker publishing.

**Operational boundary:** Clients running old pre-REL-010 JS cannot magically execute new update-check code until a fresh navigation receives the newly deployed application. The existing service worker's NetworkFirst navigation is the migration path. GitHub `main` that has not been explicitly deployed is never treated as a downloadable release. Review SSO-protected preview /game and /build-version.json before merging. Live tests must confirm persistence of localStorage, IndexedDB, session and world saves across an actual version upgrade and rollback, plus offline and two-tab behavior.
