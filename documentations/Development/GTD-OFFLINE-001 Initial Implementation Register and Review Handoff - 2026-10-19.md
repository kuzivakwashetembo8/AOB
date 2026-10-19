# GTD-OFFLINE-001 — Initial Implementation Register and Review Handoff

**Date:** 2026-10-19 (SAST)
**Status:** DEVELOPMENT IN PROGRESS — isolated branch, not merged, not production-approved
**Implementation branch:** `feat/offline001-dependency-closure-install-20261019`
**Starting baseline:** `feat/veh018-lamborghini-seat-south-ward-openland-10x-20261019` @ `4d5454f3a1272a15f459e514fe74fe6c298c09e3`
**Controlling specification:** `documentations/GTD-OFFLINE-000 Comprehensive Offline-First and Dynamic Updates Technical Plan - 2026-10-19.md`
**Scope of current work:** OFFLINE-001 only, plus owner-directed conspicuous Install action on Home and Settings. OFFLINE-002 to OFFLINE-007 are NOT authorized for implementation, merging or promotion by this register.

## Delivered source changes, pending build and device qualification

1. **Installation affordance:** `src/ui/menus/install-action.tsx` now presents an unmistakable, high-contrast yellow `INSTALL G.T.D` action (not a subtle footer link), with active Install Prompt when available and manual browser/Share-menu guidance otherwise. The Home launcher positions it before the rest of its menu; Settings positions it above the settings editor. If already installed, it reports that state. It is explicitly labelled as PWA application installation, not complete game-content readiness: OFFLINE-003 is responsible for verified full offline installation.
2. **Same-origin provisional Voight:** `scripts/stage-offline001-runtime.mjs` fetches the exact pinned `ual.glb` during build, verifies exact 3,749,364 bytes, glTF magic and original Git blob SHA `e236f349526637a5c829c408d48ce9d8fcde9cff`, and stages it under `public/offline001/character`. The canonical game runtime now imports it from a same-origin URL; no runtime jsDelivr request is intended. Reference source is the pinned `three-player-controller` commit. Current UAL actor remains provisional; no new visual character identity or bone transforms introduced.
3. **Same-origin Draco:** The build copies Babylon's shipped decoder JS/WASM modules into `public/offline001/draco`. `src/game/core/local-decoders.ts` configures `DracoDecoder.DefaultConfiguration` before character/vehicle imports. Missing decoder files fail the build rather than silently reverting to the Babylon CDN.
4. **Local typography:** Pinned Barlow, Barlow Condensed and IBM Plex Mono font faces are staged from Google Fonts' OFL source tree, with exact size and Git blob verification and bundled OFL license texts. `src/styles.css` declares the corresponding local faces and `src/routes/__root.tsx` no longer fetches Google Fonts runtime stylesheets.
5. **Built-asset evidence:** `scripts/offline001-build-inventory.mjs` enumerates built static assets, records SHA-256/size and duplicate digest groups, fails a build when the six source vehicle GLBs, manifest or required local character/decoder/font assets are missing. Its output is an **audit**, NOT proof that all dynamically imported chunks are offline-cache-ready (that belongs to OFFLINE-002/003).
6. **Build wiring:** package `prebuild`, `prebuild:dev` and `predev` stage required assets. The standard release build publishes its worker and audits generated assets. Generated binaries are ignored by Git and retained only in build output; no third-party binary was committed blindly.
7. **Tests and CI:** Source tests cover visible Install affordances, truthful content caveat, local decoder paths and same-origin Voight URL. Isolated GitHub Actions workflow is defined to typecheck, test, inspect existing wheels and build; no manual production deployment. A Vercel preview build was initiated for substantial source integration evidence.

## Still pending for OFFLINE-001 closure

- Actual Vercel build result, startup trace, same-origin GLB/decoder/font HTTP 200, rendered Home/Settings screenshots, Android and desktop Install prompt behavior and retained vehicle/Voight visuals.
- Offline runtime trace: confirm no unanticipated Babylon CDN, WebAssembly, meshopt, KTX/Basis, glTF external-buffer, CSS, or third-party fetch remains. Static source audit is not exhaustive.
- GLB compression experiments against immutable originals: Rover <5 MB and Lamborghini <5 MB are targeted, not accepted. The current Lambo source is ~4.50 MB, already below 5 MB by repo size; no new compression is assumed. Preserve every accepted wheel, paint, seat fit, orientation, collision and body feature. No source GLBs changed during current pass.
- Proven content closure (complete transitive client chunks, build wheel derivative files, URLs, licenses, dynamic conditions), verified release size and deterministic caching behavior.
- Security/rights review for the exact forked UAL demonstration GLB and other third-party GLBs before external redistribution.
- Verify that the new font byte set retains previous appearance and that install CTA fits small landscape screens without obstructing launch.

## Risks and release guard

- Build-time network staging is deliberately pinned and checksum validated. It eliminates these runtime CDN dependencies but does not eliminate the *build-time* external-source availability risk. For a later fully reproducible release, publish audited binaries to a controlled immutable internal artifact store with ownership and checksums.
- GitHub Actions may fail before a runner executes due account/queue infrastructure; such a failure is NOT test evidence and must not be misrepresented as a code regression or success.
- An installed PWA shell is NOT yet a complete offline game. The Install CTA must never claim airplane-mode full play until OFFLINE-003 verifies all resources.
- No automatic promotion to main, no production Vercel alias change, no APK, and no offline-ready badge is authorized.

## Substantial visual checkpoint and next gate

After preview build reaches READY: owner visual review of yellow Install action on Home and Settings, on mobile landscape and desktop, plus source-independent verification that all six existing vehicles and provisional Voight render and drive without new regressions. If build fails, record root cause and patch on this branch; do not promote. OFFLINE-001 closes only when asset closure, compression trials, permissions/security review and tests satisfy the parent plan.

## Initial actual-build evidence — 2026-10-19

**Preview candidate:** `bf4c4337c02a6941cff1d4e45756d96a8b2d997d`  
**Vercel deployment ID:** `dpl_4mCNbcYY7FwHhyfAzAB3UQ4sWViM`  
**Preview URL:** https://gtd-7tukf14fk-interlinkglobaltech.vercel.app/  
**Deployment result:** READY; preview only, no production aliases or promotion.

**Typecheck + regression suite:** Vercel logs show 91/91 test files and **373/373 tests passed**. The install-action and local-decoder tests passed, along with existing world, seating, wheel and driving tests. The subsequent Vite/Nitro production-format build completed.

**Staging:** Exactly **17** runtime resources were staged with content checks, including the pinned UAL character, the three local Draco files and local licensed font/notice files; the original character Git blob SHA was verified.

**Hashed release build inventory:** **430 files**, **195,012,131 bytes**, **0 missing baseline mandatory resources**, **23 groups with duplicate content hashes**. This is a built-static-output byte total, not an optimized installation size and not offline-ready certification. Generated wheel derivatives contribute to the distinction from the smaller original `public/` inventory.

**Corrective patch:** Initial preview `dpl_9BcgbsxArXTFCukjZDSf6JWJ7R6o` failed at build time because the script compared HTTP `Content-Length` (which may represent compressed transfer bytes) to the decoded GLB's true length. Commit `bf4c4337c02a6941cff1d4e45756d96a8b2d997d` removed that unreliable header comparison but preserved exact decoded file length, glTF signature and pinned Git blob SHA checks. The next preview reached READY with those checks passed.

**Unresolved:** owner desktop/mobile visual acceptance of the yellow Home/Settings install CTAs; true browser airplane-mode navigation; external runtime request trace; compression of Rover and the full approved ten-vehicle fleet; content installation/rollback (OFFLINE-003/007). The PWA retains its existing selective caching behavior and MUST NOT be labelled a complete offline game.

**Gate position:** substantial visual checkpoint available for review. OFFLINE-001 is **not yet closed**, and no merge to `main` is authorized.
