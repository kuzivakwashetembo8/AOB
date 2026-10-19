# GTD-OFFLINE-002 — Offline Application Shell and Meridian Theme Preservation

**Date:** 2026-10-19 (SAST)
**Status:** ISOLATED EXPERIMENT — NOT ACCEPTED
**Branch:** feat/offline002-static-shell-20261019
**Parent:** OFFLINE-001 baseline 4aeb8592673d163b845eddf4c90847e2c6a1fc76
**Authority:** Owner authorized OFFLINE-002 and asked to replace default bright yellow with the existing game gold.

## Intended result

A client-hydrated GTD shell (Home, World, Settings) operable after complete shell installation with no network. The game itself is NOT considered offline-ready until OFFLINE-003 packages and verifies required Rapier WASM, Voight, GLBs, world and texture resources.

## Design

1. TanStack Start SPA mode generates a static /_shell.html with the existing router and UI. Nitro and API remain for optional online operations.
2. After compilation, scripts/offline002-package-shell.mjs checks the actual Nitro output and deployed version metadata. It enumerates and hashes shell resources and caps the initial cache at 24MB. It excludes GLB, WASM and large world textures.
3. src/workers/gtd-offline-shell-sw.js becomes the installed /sw.js, with version-scoped shell CacheStorage, bounded online navigation and offline fallback to the same build's cached /_shell.html for exactly /, /world, /settings and /game.
4. All shell assets are mandatory at service-worker installation; partial installs cannot activate. No unconditional skipWaiting, clientsClaim, broad cache clearing or deletion of old working caches. OFFLINE-007 later owns update reconciliation and GC.
5. Offline shell never intercepts APIs, build-version checks, telemetry or authentication routes; caches only same-origin public shell URLs.
6. Install CTA on Home and Settings uses GTD's established --primary gold, primary foreground and focus glow, rather than generic #facc15 yellow.

## Limits and required QA

- A first-ever PWA installation still requires internet access; the shell is available offline only after its service-worker install completes.
- Missing game resources must never be presented as offline-ready. Direct /game navigation is not a proof of offline gameplay.
- Retaining old caches protects rollback but increases temporary storage cost until OFFLINE-007 manages it.
- Test real Android Chrome PWA, desktop browser, offline reload for Home/Settings/World, interrupted navigation, app updates, old worker transition, and unchanged game visuals, controls, physics and startup.
- Verify release output contains /_shell.html and /sw.js; build-time shell manifest must include required HTML/bootstrap CSS/JS and avoid all GLB and Rapier WASM, within 24MB.
- No production merge, deployment or user acceptance is implied. Vercel preview is permitted at a substantial checkpoint only after tests.

## Implementation evidence and checkpoint — 2026-10-19

**Preview:** https://gtd-35fcukzly-interlinkglobaltech.vercel.app/
**Build Git SHA:** f2f09b6db909ef3d3e73003ac39d058c1b159b31
**Vercel deployment:** dpl_2EA9cGCgKztMUrtWXAzHoWkPnM1n
**Deployment state:** READY (preview only; not deployed to production).

- **Typecheck, regression:** 92/92 test files passed; **377/377 tests passed**, including four mocked service-worker navigation/security-scope scenarios.
- **Build:** Nitro/Vercel output generated successfully with /_shell.html. REL-010 immutable release metadata and the scoped /sw.js emitted.
- **Small shell pack:** **311 file resources, 6,341,381 bytes** (approximately 6.34 MB), under the 24 MB cap.
- **Full static output:** **432 resources / 195,086,392 bytes**, zero missing items in OFFLINE-001 mandatory build inventory; shell cache intentionally excludes GLB/WASM world assets.
- **Visual design:** the Install button now uses var(--primary) and var(--primary-foreground) for the game's own Meridian gold, retaining its existing fonts and high-contrast treatment.
- **Update preservation:** worker does not call skipWaiting, clients.claim or broad cache deletion; version-scoped working caches retained.

**Repair history:** Initial build dpl_CsJFP5NjE7S5aiTrvKJU4oCLjVK7 showed 374 passing and 3 failing tests because the worker config substitution token appeared twice, once in a comment. Corrected only the comment (commit f2f09b6db909ef3d3e73003ac39d058c1b159b31). Subsequent preview passed all 377.

**Not yet certified:** actual Android Chrome installed-PWA airplane-mode navigation on Home/World/Settings, 3D rendering with offline gameplay asset download, device cache eviction and manual visual approval. External read-only web fetch did not reach the protected preview; READY and artifact counts are supported by Vercel build/deployment logs. Do not assert end-to-end offline game readiness.

**State:** substantial implementation checkpoint available; isolated branch remains unmerged. Owner review required before acceptance.
