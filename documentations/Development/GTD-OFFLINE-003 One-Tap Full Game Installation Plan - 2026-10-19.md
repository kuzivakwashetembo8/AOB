# GTD-OFFLINE-003 — One-Tap Android PWA Offline Game Installation

**Date:** 2026-10-19  
**Status:** IMPLEMENTATION TRIAL — isolated branch; await owner acceptance  
**Branch:** `feat/offline003-one-install-full-offline-20261019`  
**Baseline:** approved-for-continuation OFFLINE-002 branch  
**Authority:** Owner: "Proceed to 003", apply K.I.S.S; players open website, tap Install, then play offline once the full download is complete.

## What the player sees

1. Open GTD while connected to Wi-Fi.
2. Tap the prominent **INSTALL G.T.D** button in the Home screen or Settings.
3. The existing browser-native Add to Home Screen / Install prompt opens. At the same time, GTD begins downloading the **complete game release** in the background of that page.
4. GTD displays a single progress bar, verified transferred file sizes, and the instruction to keep Wi-Fi enabled until completion.
5. If the Android PWA opens before the download completes, installation automatically resumes on opening. Cached and verified assets are reused; download is not restarted from zero.
6. **READY FOR OFFLINE PLAY — Wi-Fi can be turned off** is shown only after all declared files have been cryptographically verified and the service worker is active.
7. A subsequent PWA launch in airplane mode loads navigation, Voight, Meridian world assets and physics from local caches.

**Important technical distinction:** The Android OS may finish adding the PWA icon before ~195 MB of content has downloaded; there is no browser API allowing GTD to make completion of the native installation conditional on a large application-controlled content download. The player must await READY to disconnect. This is a single Install action plus passive progress—no folder picker, extra account, download packs or second wizard.

## Implementation (minimal moving parts)

- **Build script:** `scripts/offline003-package-game.mjs` enumerates the *actual compiled Nitro static output*. It creates one complete `/offline003-game-manifest.json`, with release SHA, file sizes, SHA-256 of every file. No manually edited GLB list, speculative downloads or city re-generation.
- **Client downloader:** `src/lib/offline-game.ts` reads the release-specific manifest, validates same-origin URLs/lengths/hashes, downloads up to three resources concurrently, caches each only after verification, and writes a completion marker last. Interrupted downloads are resumed file-by-file.
- **Worker:** `src/workers/gtd-offline-shell-sw.js` reads the release-specific verified game cache *before* hitting the network for static runtime resources. It never uses that cache for API calls, Supabase, auth, update metadata or unrelated origins.
- **UI:** Existing `InstallAction` becomes the single control and progress indicator in Home and Settings; reuses the accepted Meridian gold design token.
- **Lifecycle:** The SW shell remains small (OFFLINE-002). The full game pack downloads under player-facing app UI, avoiding hundreds of 3D assets in the worker installation event.
- **Version safety:** Each release uses its own content cache namespace. This phase never deletes any existing shell/content cache or local saves. Hash-based cross-release reuse and transactional rollback are still the future OFFLINE-007 program.

## Boundaries and consequences

- The build includes all static resources currently in the deployed release (including some optional and duplicate files); that is intentionally simple and complete. OFFLINE-001/asset optimization and OFFLINE-007 deduplication can reduce later downloads without weakening correctness. Installation package size should be read from the actual build and not guessed.
- The 60-second **game launch** target remains separate from the once-per-release full content download.
- Offline gameplay is a designed capability of the installed release, but Chrome/browser storage may still be evicted by Android or erased by the player. The installer requests persistent storage where permitted; no indefinite storage guarantee can be made.
- A forced browser/PWA process close interrupts a running fetch; the downloader resumes on the next foreground opening. Background downloads after the browser is completely closed are not promised.
- No new vehicles or modifications to wheels, seating, city, terrain, shader, physics, or gameplay controls are in scope. No user sign-in or external asset host dependency is introduced.

## Verification and release gate

1. Compile output manifest must enumerate all static client JS/CSS, local character, GLBs, generated wheel derivatives, textures and WASM; no missing files or API/session routes.
2. All unit, world, mobile-control and vehicle regression tests pass.
3. First-time online installation shows accurate progress, and the app doesn't display READY for incomplete or corrupt packs.
4. Turn Wi-Fi off **after READY**; fully close Chrome/PWA; reopen from the Android launcher. Home, World, Settings, 3D gameplay and vehicles must function without required network requests.
5. Force-close during 50% transfer, reopen, and verify resumed download retains already verified files.
6. Confirm no accidental cache deletion, no access to Supabase or /api routes from the pack, and no unsafe manifest URLs.
7. Obtain owner's visual and gameplay acceptance. Until that occurs, keep branch isolated and do not merge or promote to production.

**STOP CONDITION:** Failing build, quota exhaustion, shell/game version mismatch, or failed true Android airplane-mode gameplay means OFFLINE-003 is NOT closed. Patch in the isolated branch and retest. Do not falsely certify end-to-end offline functionality from unit tests alone.

## Initial implementation checkpoint — READY preview

- **Preview:** https://gtd-kntkdsf8n-interlinkglobaltech.vercel.app/
- **Git build commit:** `41292523195f08951ca597e575806fbae48f534d`
- **Vercel deployment:** `dpl_JCJbK84rFqLts2Sv9YHzMYBgzpgE` — READY; preview only.
- **Tests:** `382/382` passed across `93/93` test files, including manifest validation, cached-GLB worker delivery and inherited driver/graphics/world suites.
- **Release resource pack:** `428` files; `195,005,929` raw bytes, each with SHA-256; includes Babylon client chunks, Draco WASM, Voight GLB, vehicles and static world resources. This is a complete current deployed resource inventory, not necessarily final optimized download wire size.
- **Application shell:** `311` resources / `6,347,739` raw bytes separately staged.
- **Full built public directory:** `433` files / `195,153,569` bytes; missing OFFLINE-001 mandatory assets = 0.
- **Distribution safety:** no merge into `main`, no production deployment, no runtime source GLB changes, no state deletion.

**Player trial required before closing OFFLINE-003:** install from the Home/Settings CTA on Android while Wi-Fi is connected; keep the app in foreground until green/gold **READY FOR OFFLINE PLAY**; turn airplane mode on; fully close and open the installed app; load and drive each accepted vehicle. If it stalls, provide the progress message and current downloaded size. Browser quota behavior varies and cannot be certified from build logs.

**Known platform boundary:** Chrome's native PWA icon may be installed *before* the game resources finish downloading. The platform does not provide a way to make native icon creation wait for the 195 MB app-controlled download. Readiness must therefore be judged by GTD's confirmed in-app READY indicator, not presence of the home-screen icon.

**Next gate:** owner device test and substantial visual acceptance, then patch discovered errors on this branch only. OFFLINE-004 remains unauthorized until this phase is accepted.
