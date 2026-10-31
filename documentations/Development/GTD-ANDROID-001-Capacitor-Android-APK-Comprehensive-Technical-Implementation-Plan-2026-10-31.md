# GTD-ANDROID-001 — Capacitor Android APK Technical Implementation Plan
**Status:** PROPOSED / AWAITING OWNER APPROVAL  
**Date:** 2026-10-31  
**Repository:** interlinkglobal/GTD  
**Owner decision:** Maintain Vercel web/PWA and an independently released, offline-first Android APK from one game source tree. Android releases require manual approval.  
**Scope of this commit:** DOCUMENTATION ONLY. No application, workflow, or deployment changes are authorized by this plan's creation.

## 1. Executive decision
Build a Capacitor Android distribution of G.T.D without rewriting the TypeScript/Babylon.js/Rapier game. Keep the existing TanStack Start web/PWA distribution on Vercel. The APK must contain the compiled client, GLBs, textures, decoders, WASM, fonts, audio, and all runtime assets required for offline play. Android artifacts will be produced by GitHub Actions on demand from an explicitly selected approved GTD commit. The user's separate fork of ionic-team/capacitor is a reference/future patch vehicle; do not fork the GTD game into a second independent gameplay repository and do not maintain a custom Capacitor runtime without demonstrated need.

## 2. Verified source baseline (2026-10-31)
- `package.json`: Vite build and prebuild asset-processing scripts; `@tanstack/react-start`, Babylon.js 9.29.0, Rapier compat 0.21.0, Draco, PWA; no Capacitor dependency currently.
- `vite.config.ts`: `tanstackStart({ spa: { enabled: true } })`, Nitro, VitePWA, release SHA metadata. SPA mode is encouraging, **not proof** that all gameplay routes and imports are server-independent.
- Existing build output: `.vercel/output/static`; `/_shell.html` produced for offline SPA boot. Need to test Android entry document and route fallback; do not assume `index.html` exists.
- `scripts/offline002-package-shell.mjs`: validates a small shell, deliberately excludes large GLBs/WASM; **cannot** establish full offline gameplay.
- `scripts/offline003-package-game.mjs`: creates `offline003-game-manifest.json` with SHA-256 resource hashes from final Nitro static files; useful as an APK closure baseline, but runtime closure requires device network tracing.
- `scripts/offline001-build-inventory.mjs`: build inventory and missing-file audit; explicitly cautions that static hashes alone do not prove dynamic asset closure.
- `src/workers/gtd-offline-shell-sw.js`: existing release-scoped browser worker; its installation/caching semantics must be isolated from Android's preinstalled assets.
- `src/routes/north-heights-preview.tsx`: gameplay boot is browser/client-oriented; audio and local persistence need lifecycle and permission testing.
- Existing production web deployment and its build pipeline must remain unaffected.

## 3. Target architecture
```
interlinkglobal/GTD (one shared source and assets)
  ├─ approved Git SHA ─ web build ─ Vercel ─ browser/PWA
  └─ approved Git SHA ─ Android static bundle ─ Capacitor Android
                           └─ Gradle ─ test APK ─ security gate ─ manual release
```
The APK must load from a locally served application origin provided by Capacitor, not `server.url` pointing to Vercel. All game-critical asset requests must resolve to packaged files or deliberately installed content packs. No network is required for first-launch core gameplay. Optional diagnostics and online services may fail gracefully offline, but cannot block boot.

## 4. Proposed repository layout (subject to audit)
- `capacitor.config.ts` — Android-specific application ID, name, `webDir`, origin/navigation policy.
- `android/` — generated Capacitor Android project, committed only after compatibility review.
- `scripts/android/prepare-web-bundle.mjs` — deterministic packaging from the final built static output, with entrypoint validation.
- `scripts/android/audit-asset-closure.mjs` — check manifest coverage, file sizes, hashes, path encoding, dynamic chunks, and no external critical URLs.
- `scripts/android/verify-release.mjs` — release SHA and packaged file integrity report.
- `.github/workflows/gtd-android-build.yml` — manually dispatched Android build and artifact publication.
- `documentations/Development/` — compatibility audit, results, release checklist, and security-review handoff.
Names may be refined during the audit. Do not modify the standard web build semantics to accommodate Android; use an explicit Android target.

## 5. Work packages and acceptance gates

### ANDROID-001 — Read-only feasibility audit
Inventory: generated HTML and JS entry points; TanStack client-side navigation and Nitro/server imports; absolute/relative asset URLs; GLB loaders, Draco, WASM, dynamic chunks; CSS/font/audio paths; service-worker registration; persistence; browser feature requirements; external API calls; installed asset byte size; Android SDK/Gradle constraints. Identify whether `/_shell.html` can become the packaged entry point or a dedicated static entry is needed. Capture exact file references and unresolved risks.
**Gate:** Owner reviews documented compatibility findings. No gameplay changes.

### ANDROID-002 — Deterministic local web bundle
Build from a pinned Git SHA, then produce a self-contained static directory. Preserve route fallback and URL encoding (including spaces and '+' in GLB filenames). Ensure dynamic imports, decoder binaries, audio and generated assets resolve locally. Fail closed on missing files, incompatible server dependencies, external mandatory resources, release-ID mismatch, and invalid HTML. Reuse OFFLINE-001/003 hash manifests where practical, without claiming offline readiness from a manifest alone.
**Gate:** Browser-based static-serving test plus zero missing critical resources.

### ANDROID-003 — Capacitor integration
Add supported, pinned Capacitor core/CLI/Android packages; configure a provisional application ID `com.interlinkglobal.gtd` pending owner confirmation; landscape and immersive display, splash, Android back behavior, display cutouts, and restrictive external navigation. Use default Capacitor local web origin and native WebView; no permissive `file://` configuration or arbitrary JS bridges. Avoid Capacitor fork changes unless necessary.
**Gate:** Debug APK installs, launches, and navigates to both districts without contacting the hosted website.

### ANDROID-004 — First-install offline closure
Include the complete core game bundle and required resources at install time. Measure APK, installed storage, decompression and first-play footprint. Verify first-ever launch in airplane mode, with caches cleared and no previous online run. Validate GLBs, texture subresources, Rapier WASM, Draco, audio, generated vehicle resources, lazy-loaded route chunks. Runtime network inspection must show no **required** external requests. Optional remote telemetry must not delay boot.
**Gate:** North Heights and South Ward playable on first offline launch; full resource report attached.

### ANDROID-005 — Lifecycle and persistence
Map pause/resume, backgrounding, orientation, audio focus, WebView recreation, process death, restart, and device reboot to existing GTD state contracts. Distinguish process-local state from durable save state; verify browser storage APIs under Capacitor origin. Never claim exact-session recovery unless proven. Handle Android back navigation without accidental exit or progress loss.
**Gate:** Reproducible lifecycle test matrix and documented persistence limits.

### ANDROID-006 — Device performance and stability
Compare PWA/Chrome and APK/WebView on the same Android device, same game SHA, identical settings and test route. Measure cold start, time-to-first-playable, network transfer, asset parse/decode, GPU upload, median and p95 frame time, FPS, memory, crash/ANR rate, battery/thermal trend, and offline success. Local assets should improve delivery reliability, **not presumed FPS**. Profile GPU/physics bottlenecks separately.
**Gate:** No material gameplay regression; performance conclusions supported by measurements.

### ANDROID-007 — Manual GitHub Actions build
`workflow_dispatch` only initially, with explicit source SHA/version input. Use pinned Node, Java, Android SDK and dependency lockfiles; `npm ci`; deterministic web packaging; `npx cap sync android`; Gradle checks and APK assembly; upload APK, SHA-256, manifest, SBOM/dependency report, and build metadata. Set least-privilege GitHub token permissions. Keep secrets out of logs. No automatic production distribution.
**Gate:** Downloadable test APK traceable to an approved source SHA; repeat build and artifact integrity checks.

### ANDROID-008 — Independent security review
Hand off APK and evidence to the owner's separate security tool. Test manifest permissions, exported components, deep links, WebView origin/navigation, native JS bridge, cleartext traffic, remote-content execution, dependencies and licenses, embedded credentials, storage privacy, signing, update integrity, and supply-chain provenance. Document findings and remediation. No RLS relaxation or unauthenticated diagnostics justified by APK packaging.
**Gate:** Security clearance for intended distribution scope.

### ANDROID-009 — Experimental release
Owner manually approves a signed release candidate. Keep debug/test signing separate from release keys; choose Android package ID before public distribution. Publish only after functionality, offline, security and performance gates. Release notes identify source SHA, Android versionCode/versionName, asset inventory, known limitations, and rollback strategy.
**Gate:** Explicit owner acceptance. Web deployment remains independent.

## 6. Release and update policy
- Web: normal feature preview → acceptance → main → Vercel production.
- Android: manually selected approved GTD commit → CI APK → independent security checks → owner acceptance → manual distribution.
- A web deployment does **not** update installed APK code or bundled resources.
- Version Android packages independently from game commit SHA.
- Initial release: fully bundled core content. Optional future district packs require a separately approved architecture for authenticated manifests, signed/integrity-checked downloads, atomic activation, storage quotas, rollback, and offline retention.
- Never use a remote `server.url` production shortcut to simulate bundled offline behavior.

## 7. Failure modes and mitigations
1. **TanStack server coupling:** Audit route imports, SSR data and Nitro dependencies; introduce a dedicated client entry if required. Do not silently fall back to Vercel.
2. **Absolute asset paths and encoded filenames:** Test with actual GLB URLs and lazy imports under Capacitor's local origin.
3. **Large APK/installation footprint:** Inventory actual bytes; keep first proof-of-concept full-bundle and decide on content packs only after measurements.
4. **PWA service-worker collisions:** Disable or isolate browser-only service-worker installation for the Android target if necessary; local APK assets remain source of truth.
5. **WebView performance:** Same-device benchmark, GPU capability checks, memory pressure and process-death testing.
6. **Autoplay/audio focus:** User-gesture and vehicle-music playback tests; background pause and resume.
7. **Telemetry/offline dependencies:** Network failure must not block play; secrets and unrestricted ingestion endpoints are out of scope.
8. **Supply-chain drift:** Pin versions, audit dependencies, lock toolchains and generate reproducible provenance.
9. **Fork maintenance burden:** Depend on upstream Capacitor release initially; fork only for documented defects requiring a patch.

## 8. Test matrix
- Android: at least one low-memory physical device and one modern reference device; record OS version, WebView version, storage and RAM.
- Scenarios: clean install offline; clean install online; cold boot; warm boot; district switch; 125-sedan traffic; NPC population; audio; graphics quality changes; pause/background/foreground; app force-stop; device restart; low-storage behavior; interrupted installation/update; WebView crash recovery.
- Metrics: startup ms, first-playable ms, asset failures, network request counts/bytes, FPS and p95 frame time, RAM/thermal, APK bytes, installed bytes.
- Tests must distinguish native shell overhead, asset delivery, decoding, rendering, physics, and gameplay behavior.

## 9. Definition of done
A GitHub Actions-produced Android APK from an approved GTD SHA installs and launches both South Ward and North Heights on a clean Android device with airplane mode enabled **before first launch**; all core gameplay assets are local; controls and persistence meet existing accepted contracts; device performance is documented with no material regression; security review passes; distribution requires manual approval; and Vercel/PWA continues unchanged.

## 10. Change control
This document is the source-of-truth plan, not authorization to implement. Begin with ANDROID-001 read-only compatibility audit only after owner approval. Subsequent code stages require their defined gates. Preserve web main and production. Record all failures; decommission unsuccessful experimental branches rather than merge broken Android integration.
