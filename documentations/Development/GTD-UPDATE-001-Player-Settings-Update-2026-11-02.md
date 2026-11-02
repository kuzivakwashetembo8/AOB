# GTD-UPDATE-001 — Player-initiated Game Update in Settings

Date: 2026-11-02
Status: Feature preview; owner acceptance and production merge pending.
Branch: `feature/settings-update-release-20261102`
Baseline: main `928aa37e20fe39fb995e9fdae9fb9b26a5ab2e2d`.

## Goal

Users press **Settings → System → Update Game** and receive the newest **published deployment of the currently visited origin**, including new executable assets. The resulting navigation must not be controlled by the old game's cached shell.

Unlike Ctrl+F5, websites cannot control browser cache eviction of every HTTP/CDN entry or invoke a literal hard-refresh keyboard command. This is the safe, game-scoped equivalent:
1. Request same-origin `/build-version.json` and `/offline002-shell-resources.json` with `cache: no-store` and a unique query; validate a 40-character SHA and matching release IDs.
2. Stage the new `/sw.js` with `updateViaCache: none`. The existing OFFLINE-002 installer downloads all bounded app shell assets (<=24 MB) into a **release-specific** cache before becoming install-ready; abort without deletion when incomplete.
3. Query the waiting service worker's own release ID over a MessageChannel; do not activate a mismatching worker.
4. After explicit player click, send `GTD_OFFLINE_ACTIVATE_UPDATE`. Its worker handler runs `skipWaiting()` solely upon verified user action. No silent forced update during active play.
5. Delete only obsolete `gtd-offline-shell-*`, `gtd-offline-game-*` and legacy G.T.D/Workbox shell cache namespaces, preserving the newly staged release. Never touch player save data in localStorage, IndexedDB or sessionStorage.
6. Reload the same route using a unique `gtd_update=<sha-prefix>-<nonce>` URL argument; hashed bundles, navigation and the new service worker all belong to the published release. On the next settings visit, warn when the installed JS version doesn't match the requested SHA.
7. The 3D loader fetches new world/GLB/WASM assets as needed. The large complete OFFLINE-003 pack is not claimed fully downloaded or verified: users who need full offline play must reinstall or revalidate that pack.

The status panel shows checking, downloading, activating, clearing and reloading, with a non-destructive error when network/version/worker checks fail. The same shared editor appears on the launcher settings page and in the paused game.

## Constraints and acceptance

- Do not query GitHub HEAD; latest code is not necessarily deployed. Same-origin Vercel deployment metadata is the authority.
- Preview deployments are pinned to their own origin; their Update button does **not** jump into production.
- Preserve game saves, character/settings preferences, and mission progress.
- Warn that unsaved in-memory activity can be lost on reload and full offline files may need reinstallation.
- Offline or mismatching release metadata must not clear any cache.
- New release worker must complete shell download **before** old shell removal.
- The update button may be repeated even if the release is unchanged: it still refreshes scoped caches and navigates with a new URL.
- Validate TypeScript and the full Vitest suite on preview. No merge to main without owner instruction.
