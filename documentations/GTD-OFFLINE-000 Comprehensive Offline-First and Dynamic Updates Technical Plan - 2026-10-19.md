# GTD-OFFLINE-000 — Offline-First Game, Complete Installation and Dynamic Updates
## Comprehensive technical implementation plan for OFFLINE-001 through OFFLINE-007

**Project:** G.T.D — Grand Theft Division, Meridian City  
**Date:** 2026-10-19 (SAST)  
**Status:** PROPOSED — DOCUMENTATION ONLY; AWAITING OWNER APPROVAL  
**Repository:** interlinkglobal/GTD  
**Canonical documentation location:** /documentations  
**Documentation branch:** docs/gtd-offline-001-007-technical-plan-20261019 (based on main; not a gameplay release)  
**Implementation authorization:** NONE. The existence of this document does not authorize code changes, asset re-encoding, integration, merge, deployment, public release or security-sensitive operations.

---

## 0. Executive decision and intended player experience

GTD will evolve from an installable online-distributed browser game into an offline-first, self-contained game. The first implementation target is the existing PWA; a subsequent Capacitor-based Android package must contain the complete supported base release at installation time, so it can launch on a never-connected device after installation. The same core engine, assets, game rules and state contracts must serve both channels.

The network distributes content, authorized updates and optional diagnostics. The network must not be necessary for simulation, rendering, movement, vehicle operation, mission progression or local saves. Offline mode is a normal operating state, not an error state.

**Definition A, approved by owner:** the complete currently released game content must be present before an installation is declared playable offline. On the PWA, a first-ever download of that content necessarily needs connectivity; subsequent launches do not. On the later self-contained APK, all required base content is embedded at install time, so the first launch can occur offline.

**Player-facing goals:**
- Install GTD once, complete and verify its content pack, and play in airplane mode without a special URL, troubleshooting or Internet handshake.
- Start a playable frame within the established maximum of 60,000 milliseconds after entering game startup, including offline startup. Measure rather than assume an improvement from eliminating transfers.
- Retain progress, preferences and downloaded content across restarts, ordinary updates and network failures.
- Show honest download sizes, progress, installed version, content integrity status and updates; never misrepresent a partially installed world as offline-ready.
- Receive small updates by reusing unchanged resources, without downloading every vehicle, texture or world asset again.
- Keep the last playable release usable after a failed, corrupt, interrupted or incompatible update.
- Preserve the accepted visual and driving experience: Voight, ground, streets, lighting, vehicles, steering, wheels, seating, collision and mobile controls.

## 1. Inputs, authoritative baseline and boundaries

### 1.1 Repository inspection and status interpretation

The source audit considered GitHub main at ea92e9cf4688db3f367b781011174e6ab8c48ba7 and, to reflect the latest six-vehicle work, development branch feat/veh018-lamborghini-seat-south-ward-openland-10x-20261019 at 4d5454f3a1272a15f459e514fe74fe6c298c09e3. The development branch is NOT assumed to be merged, deployed or owner-accepted as a complete release. Implementation begins only after a new branch/release-diff audit and owner approval.

Observed inventory on both inspected refs: 113 files in public, approximately 144.01 MB of original public-file bytes: eight GLB files totalling approximately 53.09 MB, 85 WebP files totalling approximately 87.96 MB, twelve PNG files, six JSON surface manifests and a PWA manifest. This is NOT a full packaged-game size, not an installed size, and not a list of required runtime assets. It includes inactive/duplicated candidates and excludes compiled chunks, generated rig derivatives, runtime dependency WASM/decoders and bundled fonts.

Key evidence:
- package.json: TanStack Start, React, Babylon 9.29.0, Rapier 0.21.0, Vite/VitePWA, and glTF/Draco dependencies.
- vite.config.ts: generated service worker; empty build-time globPatterns; network-first navigation, cache-first selective shell items, skipWaiting and clientsClaim; large game assets are not currently guaranteed offline.
- scripts/publish-pwa-worker.mjs: Nitro/Vercel service-worker publication and immutable build-version metadata.
- src/lib/pwa.ts: guarded registration for eligible production top-level windows.
- src/lib/game-version-check.ts: bounded same-origin network release check and reload logic.
- src/lib/startup-telemetry.ts and src/lib/server/startup-telemetry-ingest.ts: game reporting through same-origin API then server-side Supabase; no durable local outbox currently established.
- src/routes/__root.tsx: external Google Fonts stylesheet.
- src/game/character/voight-humanoid-trial.ts: provisional UAL humanoid and animations imported from jsDelivr pinned external repository; gameplay-critical remote dependency.
- src/game/physics/rapier-world.ts: Rapier WASM initialization.
- src/game/vehicles/mercer-additional-parked-glbs-006.ts: six native locally hosted car GLBs on latest development branch, some derivative rig paths.
- src/routes/game.tsx: real startup timing and bridge, but Save/Load presently says runtime save not connected.
- src/ui/menus/settings-state.ts: existing localStorage interface preferences.
- src/game/world-generation: typed/seeded procedural buildings, streets, terrain, textures, spatial logic and representation LOD.

Existing requirements from AGENTS.md remain binding: four TanStack routes, shared UI under src/ui, engine behind RuntimeBridge, runtime saves distinct from UI preferences, guarded production service worker, NO indiscriminate large-world asset precache, manual Vercel promotion, GitHub main as canonical release source and no automatic deployment from normal commits.

Related specifications: GTD-PWA-001, GTD-REL-010, GTD-LOAD-060/061, GTD-WHEEL-001, existing vehicle seating and wheel acceptance documents, FL-4 startup/graphics requirements, Procedure DDD decommission restrictions. This program does not revive a decommissioned branch.

### 1.2 Fleet target: six current + four future = ten unique vehicles

| Vehicle | Category | Source status at planning | Source GLB size | Offline-pack disposition |
| --- | --- | --- | ---: | --- |
| Range Rover Sport 2018 | SUV | Latest development branch; locally hosted | ~24.35 MB | Included when release-qualified; re-encode target below 5 MB |
| Toyota Hilux | Pickup | Latest development branch; locally hosted | ~17.21 MB | Included when release-qualified; optimization candidate after measurement |
| Land Rover Defender | SUV/off-road | Latest development branch; locally hosted | ~0.43 MB | Included when release-qualified; local Draco decoder required |
| Dodge HP | Car | Latest development branch; exact source variant not verified | ~1.95 MB | Included when release-qualified |
| BMW M4 Competition | Coupe | Latest development branch; locally hosted | ~1.93 MB | Included when release-qualified |
| Lamborghini Temerario | Supercar | Latest development branch; locally hosted | ~4.50 MB | Included when release-qualified; user has not yet intentionally compressed it |
| Sedan A | Sedan | FUTURE, not present as accepted playable asset | TBD | Add through MVRS/vehicle admission, later release |
| Sedan B | Sedan | FUTURE, not present as accepted playable asset | TBD | Add through MVRS/vehicle admission, later release |
| City bus | Bus | FUTURE, not present as accepted playable asset | TBD | Class-appropriate wheel count, length, turning, doors, collision, seats |
| Police car | Emergency vehicle | FUTURE, not present as accepted playable asset | TBD | Police light/siren assets and gameplay rules when approved |

The two future sedans are distinct new vehicles, not color variations; the new bus and police car complete the ten-vehicle target. Do NOT revive the previously delegated/removed Sedan as accepted work without a separate owner decision. Retired Ferrari and Buggy remain retired. Do not conflate ten unique car/vehicle models with potentially many ambient traffic variants.

**Size target:** the owner expects both unoptimized Rover and Lamborghini source assets to be reducible below 5 MB each. The current Lamborghini source is already approximately 4.50 MB in GitHub; confirm its exact bytes and visual quality before deciding whether further encoding is advantageous. The Rover is ~24.35 MB and requires a genuine reduction. Both size goals are targets, not permission to lose original wheels, unique mesh details, body geometry, cabins, materials, glass, seat calibration, forward axes or animation. Preserve immutable original assets and measure the qualified final derivative, decoded runtime memory, startup time and mobile appearance. Acceptance is visual/functional plus size; NEVER approve a corrupted or low-fidelity <5 MB file solely because it meets size. Investigate glTF texture compression, measured geometric simplification, Draco/meshopt compatibility and reused materials while keeping build-time tooling off the player's device. A smaller compressed download can still cause greater decode CPU/GPU cost: benchmark both. New bus may appropriately exceed 5 MB if justified and separately approved.

### 1.3 Non-goals and authority

No multiplayer, cloud-authoritative mission progress, mandatory authentication, server-side game simulation, stealth asset changes, vehicle redesign, city expansion, traffic implementation, new native APK, automatic production deployment or mass asset deletion is authorized here. Asset licensing/commercial redistribution must be assessed separately, especially the provisional UAL character and third-party branded vehicle GLBs; technical local availability does not establish legal permission to redistribute an APK.

## 2. Target architecture and dependency classification

Shared, platform-neutral runtime:
1. **Bootstrap/app shell:** HTML, route graph, React/TS/JS/CSS, menus, touch/keyboard UI, fonts, icons, locale and errors.
2. **Engine:** Babylon.js renderer and glTF loader, Rapier and its local WASM binary, shader/runtime chunks, WebGL and optional local geometry/image transcoder WASM.
3. **World:** South Ward/First Light world schema, seed, tile/block/road/lot/building metadata, procedural shaders/textures, accepted materials, road collision, tree and grass geometry, lighting and environment.
4. **Actors:** Voight local rigged GLB, skeleton/animations, character locomotion, camera, collision, six approved vehicles and their source/qualified rig artifacts, driving physics, wheels and seats.
5. **Input/simulation/UI:** fixed-step update, keyboard/touch, pause/settings, collision/steering/boarding, HUD, missions as implemented; all internally deterministic enough to restore from a save.
6. **State:** interface settings in existing localStorage; versioned gameplay snapshots/checkpoints and update metadata in IndexedDB or approved equivalent; diagnostics outbox separate from saves.
7. **Distribution:** immutable versioned client shell, immutable content hashes, manifest and service worker, offline installer, content manager and verified release selector.
8. **Optional transport:** HTTP distribution and explicit approved release metadata from Vercel, diagnostics via same-origin API/Supabase, future opt-in services. Offline gameplay never requires these.
9. **Device capabilities:** modern browser or WebView with supported WebGL, WASM, local storage and input; GPU, RAM, CPU, available disk and OS life-cycle. No architecture can manufacture hardware capability.

The eventual Android packaging route is Capacitor or equivalent embedded-WebView shell containing the fully built release. The APK/AAB packaging is a later separately approved track; it must not create a second gameplay implementation. Native Play Store app binary upgrades follow the permitted store update channel. OFFLINE-007 is primarily a versioned content-update design and does not grant remote arbitrary executable-code installation.

### 2.1 Mandatory resource manifest

Generate at BUILD time from actual compiled output and source/runtime references; never hand-maintain an incomplete list. Manifest categories: critical-shell, critical-runtime, critical-gameplay, required-visual, required-audio (once present), optional-content, diagnostics-only, legacy/unreferenced, developer-only. For each file record:
- stable logical ID, normalized immutable origin-relative URL, semantic purpose and owning subsystem;
- content SHA-256, exact encoded byte length, MIME type, content encoding and decoded/decompressed expected bounds where practical;
- asset type and decoder dependencies, source/provenance, derivative version, MVRS rig/seat/forward-axis qualification identifiers;
- required/optional classification, dependency edges, world scope, build/release compatibility range;
- fallback behavior for optional files, and security/redistribution approval status.

Verify final transitive dependency closure: route HTML and dynamic JS chunks, assets referenced through code, Draco loaders, WASM, imported GLB external buffers/textures, generated wheel derivatives, CSS URL assets, fonts and icons. Include generated outputs from build scripts in release verification; never confuse originals in public with deployed files. Build fails if a mandatory resource is remote, missing, insecure, improperly typed, beyond license restrictions or not hash-resolvable. External font imports should be replaced with local permitted fonts or local fallbacks. Localize the Voight UAL test source only after confirming redistribution rights; if rights are uncertain, acquire an authorized substitute and preserve the current accepted appearance/animation or flag it for separate owner approval.

### 2.2 Startup and content separation

**Shell:** small, deterministic, pre-cached, capable of rendering Home/Settings/Offline Installer/Recovery entirely offline. Build and ship shell-specific versioned precache rather than blindly globbing all world assets.

**Required world pack:** explicitly scheduled large GLBs, qualified wheel derivatives, textures and content metadata, downloaded/verified using a managed installer (NOT unbounded Workbox service-worker install precaching). The world pack is COMPLETE only after every required file is present, integrity-verified and resolvable locally.

**Application launch:** read active installed release and offline readiness first; initialize locally and render. Optional release query/telemetry must not block offline startup. If content is incomplete, show truthful repair/install UI; never create fake gameplay readiness.

**Offline PWA distinction:** a fresh browser without prior assets cannot magically download the game in airplane mode. The later APK must ship an embedded, verified baseline without first-launch network need.

## 3. OFFLINE-001 — Dependency closure, asset optimization and build reproducibility

**Goal:** turn unknown external dependencies into an auditable, local, versioned runtime set; reduce installation cost without visual regressions.

**Work:**
1. Build source and production network-dependency scanner: external URL literals, runtime fetch/import paths, Babylon transcoder configuration, CSS/font imports, glTF nested references, CDN fallback and server/API dependencies; capture actual Network panel traces and runtime misses.
2. Inventory live vs dormant files, hashed binaries, duplicates (especially original Wood/Glass alongside /assets/surfaces mirrors), source vs generated wheel GLBs, inactive leaves/experiment assets and unused PNGs. Delete NOTHING before reviewed classification and release usage validation.
3. Bring the currently required Voight GLB/animations and all required decoders onto same-origin/package-local immutable paths, with license/provenance review. Explicitly configure Babylon/Draco/other transcoders so no fallback contacts public CDNs.
4. Include fonts locally or select accepted system-font fallback; remove external mandatory stylesheet/preconnect.
5. Generate reproducible release dependency closure report and immutable asset manifest, including final Vite/Nitro output after wheel-extraction scripts.
6. Run controlled Rover and Lamborghini compression trials from immutable originals; retain A/B screenshots near/far/night/cabin, wheel-turning, UVs, material appearance, collider envelope, seat fit, steering and mobile load metrics. Target each under 5 MB where achievable without loss. Record reasons if target conflicts with fidelity. Assess Hilux next but do not change it without specific acceptance.
7. Record fleet manifest accommodating 10 future unique vehicles, arbitrary axle count (bus), versions and qualification states, without adding unapproved models.
8. Enforce CI guard: mandatory HTTP dependencies and remote CDN fallbacks fail offline qualification; approved optional telemetry/update endpoints are allowlisted and failure-tolerant.

**Outputs:** dependency report, release manifest generator, locally resolvable core resources, measured asset compression register, licensing gate, CI qualification and documentation/evidence.

**Improvement:** predictable startup over weak networks after installation, lower distribution cost, absence of third-party CDN outages and a fixed evidence trail for future APK building.

**Security notes:** provenance, redistribution licenses, hash validation of downloaded originals, secure sandboxed conversion tooling, build dependency scanning/SBOM and no execution of untrusted authoring scripts. This is NOT a claim of zero security risk.

**Gate:** production runtime with network blocked loads all required dependencies from verified local resources; resource manifest matches the built files; no accepted visual or physics regression.

## 4. OFFLINE-002 — Offline application shell and stable startup

**Goal:** Home, Settings, Play, World and safe fallback/recovery routes can render offline without a live Nitro SSR request.

**Work:**
1. Determine supported TanStack Start client/static route output alongside the existing Vercel build. Keep same shared UI and route contracts; eliminate runtime server data loaders for mandatory gameplay/navigation.
2. Versioned shell precache of HTML/fallback, JS/CSS chunks, route metadata, icons and fonts. Keep shell and world asset caches separate; inspect service-worker deployment under .vercel/output/static.
3. Align PWA registration with existing guards: only top-level production; development and preview caches must not pollute canonical production. Add real offline navigation tests for /, /game, /world and /settings.
4. Preserve REL-010's deployment-source policy: a GitHub commit is NOT automatically a released build. Startup lookup must be opportunistic, bounded and never hold offline gameplay. Eliminate forced reloads while driving; design migration from currently unconditional skipWaiting/clientsClaim.
5. Introduce clear installed-version/readiness state and accessible recovery flow, landscape UI, no browser tab-bar assumption.

**Improvement:** feels and starts like an application; stable navigation, boot and error recovery even in airplane mode.

**Security notes:** same-origin-only cache interception, prevent caching APIs/secrets/authenticated content; manifest and resource paths normalized to prevent traversal or arbitrary remote URLs.

**Gate:** route-by-route cold boot using already installed shell and disconnected network; exact client chunk set verified; old valid shell remains accessible after failed update.

## 5. OFFLINE-003 — Complete content installation and integrity verification

**Goal:** do not claim offline ready until every released playable resource is present, verified, and addressable.

**Work:**
1. Explicit resource-download manager (not giant worker install). Fetch all critical content by immutable paths; concurrency bounded by mobile memory and performance observations. Download progress measured in verified bytes, not number of promises.
2. Preflight user-visible disk estimate via StorageManager.estimate() and persist() where available; consent for large downloads and metered networks; show required bytes, already retained bytes, incremental bytes and headroom for staging/rollback. Browser quota is advisory, not a durability guarantee.
3. Use CacheStorage for URL-addressed static responses; consider OPFS only after compatibility/performance evaluation. Keep user save data in separate IndexedDB stores. Avoid double-storing the same large asset merely to make two version namespaces.
4. Content hashes validated using Web Crypto SHA-256 in bounded memory; support streaming/incremental verification if browser constraints require it, using audited implementation. Detect truncation, wrong MIME/content, HTML error pages masquerading as GLB, corrupt assets and mismatched hashes.
5. Resumable download queue across sessions: per-file completed-state after verified write; if partial-byte range resume cannot be independently proven safe, restart that file only, not the whole game. Pause/cancel/retry with jitter and short bounded network timeouts; never require an always-running tab.
6. Store a release-ready flag only after all mandatory checks pass. The flag alone is insufficient: verify actual file existence and manifest invariants at boot, repairing incomplete state rather than guessing.
7. Distinguish installation/download time from 60-second gameplay boot budget; the installer shows truthful transferred/verified progress and elapsed time.
8. Provide appropriate PWA offline-readiness messaging and future APK packer feed from identical verified content manifest.

**Improvement:** one-time content download, clear progress, resilient poor-network setup, predictable airplane-mode gameplay.

**Security notes:** user consent and data usage visibility, strict allowlist, HTTPS, response size ceilings, per-file integrity, quota enforcement, no executable from untrusted hosts.

**Gate:** completed PWA install starts game after airplane-mode restart; interrupted/insufficient-space install reports incompleteness and resumes without discarding verified files.

## 6. OFFLINE-004 — Persistent local save/load, schema migration and crash recovery

**Goal:** gameplay and progress survive browser/application termination without needing authentication or cloud services.

**Work:**
1. Implement runtime-owned save contract behind GameRuntime/RuntimeBridge (not React ticking or arbitrary UI localStorage). Define versioned snapshots: player identity/position/orientation, world/seed/schema, vehicle location/drive state and ownership if applicable, checkpoint/mission flags, time/event state if implemented, modified world state and relevant future NPC/traffic state. Do not invent or persist absent features.
2. Save in IndexedDB with explicit versioned schema, checksum or record validation, atomic transaction and last-known-good checkpoint. Define autosave cadence based on state mutation, checkpoints and pause/visibility, without blocking the render loop.
3. Restore world after compatible runtime boot and collision/asset readiness; validate save schema and coordinates before use to avoid spawning inside geometry or reviving removed vehicles. Carry explicit migration tables and incompatible-save recovery.
4. Preserve the existing key gtd-interface-settings in localStorage; do not clear it. Consider user-initiated export/import of portable save format and recovery backup, with clear privacy implications.
5. Keep gameplay saves, settings, installation metadata and telemetry outbox separate; none is deleted as a routine update. Offline-only guest play is the default.
6. Test crash/kill during transaction, corrupted record, schema rollback, insufficient quota, privacy mode limitations, multi-tab ownership and old-save migration.

**Improvement:** progress is reliable in real-world device interruptions, the game functions without sign-in and users can restart safely.

**Security notes:** schema validation and import file size limits, avoid persisting secrets, protect private player data, no cross-origin access; browser storage may still be removed by OS/user and must not be described as indestructible.

**Gate:** save, force-close, airplane-mode relaunch and restore accurately; old saves survive updates unchanged or via verified migrations; rollback behavior defined.

## 7. OFFLINE-005 — Network-independent operations and release coordination

**Goal:** offline state cannot interrupt gameplay; diagnostics and update checks are best-effort add-ons.

**Work:**
1. Make gameplay boot and runtime independent of /api/telemetry/startup, Supabase, /build-version.json and remote services. Preserve small bounded timeouts only for optional asynchronous checks; no full-screen loading deadlock.
2. Persist validated non-identifying diagnostic events in local outbox when offline, with bounds, TTL, consent/privacy defaults, deduplicated event/run IDs, retry backoff and batch transfer only when online. Distinguish network speed observations from scene/GPU cost.
3. Online/offline detector uses actual request success, not navigator.onLine alone; move between states without losing simulation or HUD.
4. Keep approved, intentionally deployed production releases as only update candidates. Never treat a merely merged Git commit as deployed; stage in background when safe, activate only with explicit release compatibility/readiness and player-safe transition.
5. Reconcile existing service-worker autoUpdate/skipWaiting/clientsClaim and REL-010 reload behavior with release pinning and OFFLINE-007; changes require specific compatibility tests. Preserve the last playable shell and game pack through upgrade.
6. Security/operations: no privileged Supabase key in browser, no mandatory auth for solo offline play, no automatic analytics upload of save contents, no silent global cache deletion.

**Improvement:** weak or missing connectivity becomes unremarkable; more reliable diagnostics after reconnection, fewer interruptions and clearer updates.

**Gate:** airplanemode continuous play plus eventual bounded telemetry sync after reconnection; no duplicate/corrupt reports or involuntary game restart.

## 8. OFFLINE-006 — Qualification, performance, device testing and release gates

**Goal:** independent evidence that GTD is genuinely offline-capable and retains its visual/physical standards.

### 8.1 Required test environments
- Android installed Chrome PWA, browser tab, desktop Chrome/Edge; additional browser/WebView matrices as supported and reported.
- Fresh install, completed installed content, warmed cache, low/high bandwidth, high latency, captive portal, offline from startup, offline mid-drive, reconnection.
- High/low disk headroom, browser quota denial and eviction where reproducible; PWA reinstall and explicit site-data removal.
- Small-memory and slow-CPU/GPU classes; background/foreground; tab suspension and process kill; two simultaneous tabs.
- Production and isolated preview builds, old/new shell, same/different resource packs, rollback and mixed-release races.

### 8.2 Non-negotiable tests
1. With network traffic disallowed, shell navigates and /game reaches a real first playable frame with ground, buildings, Voight, all release-required GLBs and physics. Capture Network trace and assert zero required external fetches.
2. Drive every approved vehicle: forward/reverse/left/right, proper facing/camera, independent wheels, seat containment, four-wheel road integrity, boarding/exiting, collisions and input parity. For future bus test class-specific geometry/axle behavior separately.
3. Start timer at game-route bootstrap and stop only at accepted first-playable-frame checkpoint. More than 60,000 ms is a FAIL, never hidden by an offline flag; retain GPU, parse, instantiation and shader tracing.
4. Installed resources all pass SHA-256 checks and size accounting, with no phantom required files. Installation status matches actual storage.
5. Save/reload, forced close, old snapshot migration, update activation, update failure and rollback do not lose player data or the last playable release.
6. Simulate HTTP 404/500/HTML-for-GLB, corrupt chunk, wrong WASM, decoder absent, network loss halfway through a vehicle, asset permission failure and device storage pressure.
7. Explicitly test already-approved graphics: bricks, wood, glass, sky, streetlights, trees/grass, accepted city layout, mobile clarity and controls.
8. Security tests: malicious manifest URL, path traversal, tampered hash/signature, version downgrade, replayed stale update, excessive file size, hostile glTF/texture metadata, service-worker scope and cache-owned-only deletion.
9. Distinguish time to finish first-time download from startup after complete installation. Full-size native APK cold offline first-run is a separate later acceptance gate.
10. Generate machine-readable acceptance report with exact build SHA, device/browser, asset hashes, failures, first-frame time, resident/peak memory where measurable, network evidence and owner visual checkpoints.

### 8.3 Substantial visual checkpoints only
- CP-1: Offline Installer UI and truthful complete-content progress/readiness.
- CP-2: First complete airplane-mode game launch, accepted South Ward + Voight + currently approved vehicles.
- CP-3: Real persistent save/reload after force close.
- CP-4: Dynamic update reuses unchanged files and activates safely.
- CP-5: Corrupt/interrupted-update rollback preserves playable version.
- CP-6 (future separate fleet releases): each materially completed group of new sedan/bus/police assets, not cosmetic single-object changes.

One branch/component at a time, tests before previews, no deployments for ±one tree, trivial prop or unseen plumbing. Preview links required at substantial checkpoints for desktop/mobile when technically available; no unsupported assertion that a source commit has deployed.

**Gate:** test results and user visual acceptance, performance within budget, no blocking security findings, no data loss or critical offline network dependency. If a gate fails, repair on isolated branch; after failed attempts use existing Procedure DDD rather than crossing unacceptable changes into main.

## 9. OFFLINE-007 — Dynamic updates, deduplication and last-playable rollback

**Goal:** approved releases download only resources that have genuinely changed, reuse all unmodified installed files, and never sacrifice the last verified playable release for an incomplete replacement.

### 9.1 Two update classes

**Class A: versioned content changes** — GLBs, compressed textures, surface catalogs, audio, city data and compatible declarative metadata. A signed/verified release manifest points to content-addressed immutable files; the client computes the set difference against existing verified files. This is the first and preferred dynamic update pathway.

**Class B: application-code/shell changes** — JS, CSS, routes, service worker, WASM engine/decoder compatibility and native APK binaries. Browser PWA code can update via its approved same-origin deployment and service-worker lifecycle, provided old shell and new shell remain version-consistent and rollback-safe. For Play-distributed APKs, native application self-updating outside the store is not authorized; native binaries update through store-compliant means. Do not introduce a remote executable-code/JS bundle updater as an unstated shortcut. A future alternative demands separate platform/security/legal review and owner approval.

### 9.2 Release and asset addressing model

Immutable release descriptor contains:
- releaseId tied to an explicitly approved deployment, channel (production/preview), publish timestamp, monotonically controlled release sequence, expiration/revocation policy and source Git SHA;
- schema versions: shell, content pack, game save and MVRS vehicle rigs; allowed compatibilities and minimum supported client build;
- complete sorted list of mandatory and optional resources: stable ID, immutable origin-relative content URL, SHA-256, exact bytes, kind, dependency list and qualification signatures;
- compatibility constraints, required available disk headroom and release notes;
- authenticated integrity: signed manifest with pinned public verification key(s), subject to browser compatibility assessment of the chosen vetted signature scheme; HTTPS and strict same-origin/allowlisted distribution still required.

Asset URL strategy: content-addressed immutable paths, such as /gtd-content/sha256/<digest>/<sanitized-name>. Never overwrite bytes at an existing immutable key. CDN HTTP cache can then reuse bytes by hash. Do not trust mutable paths or a manifest that asserts a hash without checking data.

### 9.3 Safe differential update algorithm

1. Read active release pointer, verified installed content index and currently available device storage. Do not overwrite active records.
2. Fetch ONLY the approved new production release manifest; validate origin, schema, signature, release channel, monotonic/replay policy, compatibility and resource paths. Bad manifest -> reject update, keep playing.
3. Form SHA-256 set difference: common, changed, new and obsolete content. REUSE verified common assets by content hash without network transfer. Do not redownload unchanged Rover, Lamborghini, six-vehicle fleet or textures merely because a release SHA changed.
4. Estimate total unique incremental bytes, verification/staging headroom and potential rollback storage. Show user precise proposed download size and available space; if not enough, defer update without touching active playable assets.
5. Download only missing blobs into release staging/cache, bounded concurrency; validate every file by SHA-256, length and MIME and required codec, then mark VERIFIED. A partial write is never playable.
6. Build the full candidate dependency closure using shared verified unchanged blobs plus new staged blobs. Validate shell/content/MVRS/save compatibility and optionally stage smoke checks. Candidate remains STAGED until all checks pass.
7. At a safe checkpoint (launcher, restart or explicit Update now; NEVER during an active drive), atomically switch the active release *metadata pointer* in a database transaction or equivalent verified protocol. Keep pinned old release, all referenced assets and old shell until candidate successfully boots and first playable frame is acknowledged. An interrupted pointer write resolves to exactly the old or new consistent release.
8. If boot/health check fails, roll active pointer back to the recorded last-known-good release, expose a recoverable reason, and blacklist that candidate until repaired or manually retried.
9. After successfully verified activation and rollback-retention policy, garbage collect only objects not referenced by active/last-known-good/staged installations or other live tabs. Never clear arbitrary CacheStorage, localStorage, IndexedDB or all service-worker caches.
10. On network interruption, halt/retry only needed objects. Continue existing installed game, with no gameplay interruption. User saves are outside content GC.

**Important:** shell and service-worker update are NOT made automatically atomic merely by IndexedDB pointer switching. OFFLINE-007 must build a separate coordination/compatibility protocol for old and new HTML/JS/WASM, old/new service-worker control and multiple tabs. Do not prematurely call skipWaiting/clientsClaim on a candidate that breaks the active session. Prefer two-phase activation, immutable chunk URLs, client acknowledgments, release-scoped serving, and a controlled restart. If browser limitations prevent true shell rollback, scope the first OFFLINE-007 release to content-only deltas, retain old native/installed shell and document the limitation explicitly.

### 9.4 Dynamic-update cost policy

Primary saving: **file-level content-addressed reuse**. A new release changing one vehicle should not trigger re-downloads of the other nine vehicles, the city textures, or unchanged code chunks.

Optional future optimization: binary delta patches for very large GLBs, only after measurements establish that bandwidth savings exceed patch complexity, device CPU/memory use, extra temporary bytes, and corruption risk. Full-file replacement of the changed GLB is acceptable: it is still dynamic updating because all unchanged files are reused. Every patched output must hash to the canonical target digest; otherwise discard it and retain original or retry full replacement.

Multiple color variants of the same car should reuse geometry and material sources where technically viable. Procedural generation and seeded variation remain preferred over shipping redundant meshes.

### 9.5 State machine and failure modes

Proposed lifecycle: NOT_INSTALLED -> INSTALLING -> VERIFYING -> READY -> ACTIVE. New update: ACTIVE -> UPDATE_AVAILABLE -> STAGING -> VERIFIED_CANDIDATE -> ACTIVATION_PENDING -> ACTIVE_NEW -> LAST_KNOWN_GOOD. Failures from any staging state return to ACTIVE_OLD; activation/boot failure returns to LAST_KNOWN_GOOD_OLD. STORAGE_INSUFFICIENT, INCOMPATIBLE, SIGNATURE_INVALID and DOWNLOAD_INTERRUPTED are explicit recoverable outcomes, not silent data deletion.

Critical cases: power loss mid-file; expired/forged manifest; HTTP success serving wrong asset; two tabs updating simultaneously; quota exceeded at 90%; SW stale shell with new GLBs; new shell with old save; rollback to old shell after a newer save; CDN deletion of prior immutable chunks; native APK upgrade while offline; release manifest rollback attack. Every case must have a deterministic retention and recovery rule.

### 9.6 Retention policy

At minimum preserve the current active release and one previously acknowledged last-known-good release; retain referenced unchanged blobs once, not duplicated per-release when storage architecture supports it. Account for memory/cache eviction by browsers. If simultaneous copies cannot fit, do NOT update automatically and never free last-known-good resources first. Explicit user storage-management UI may report optional assets and old recoverable copies, but may not delete active data or saves without informed action. Installer status must reflect browser eviction accurately.

**Improvement:** lower repeat download cost, faster release adoption on weak networks, less wasted storage, transparent versioning and strong recoverability.

**Gate:** measured demonstration that a one-vehicle-only update downloads that asset plus strictly necessary metadata/chunks, reuses unchanged files by hash, survives forced kill and corruption, preserves saves and starts a real playable frame; owner approves before promotion.

## 10. Security, privacy and supply-chain assessment (mandatory approval gate)

Risk cannot honestly be declared zero. The plan introduces persistent downloaded content, update distribution and local save processing, each with security implications. No security-sensitive implementation proceeds before its mitigation is approved and verified.

| Risk | Impact | Mitigation / gate |
| --- | --- | --- |
| Forged or tampered update manifest | Malicious/corrupt resource activation | Signed approved manifests with pinned verifier, HTTPS, strict origin allowlist and replay control; reject on failure |
| Malicious GLB/texture/WASM or compressor input | Parser exploit or denial of service | Signed/hashed vetted content, bounded asset sizes and decompression limits, supply-chain review, build-time sandbox; no untrusted runtime files |
| Remote executable code updates | Code injection / store policy violation | Content-only first; audited same-origin PWA shell workflow; Play APK binaries through Play-compatible upgrade; separate authorization for exceptions |
| Browser quota and cache eviction | Offline game stops working or save loss | Storage preflight and persistence request, readiness recheck, explicit recovery, independent save backup/export; no false absolute persistence guarantee |
| Interrupted update / partial SW activation | Broken or mixed release | Two-phase activation, immutable URLs, retained old shell, last-known-good pointers, multi-tab and kill testing |
| IndexedDB migration / corrupted save | Player progress loss | Transactional migration and backups, schema validation, old data preservation, rollback compatibility |
| Third-party asset rights | Redistribution dispute | Provenance and documented redistribution permission before assets enter public offline/APK pack; replace if unlicensed |
| Telemetry handling | Sensitive data leakage | Local bounded outbox, no save contents/secrets, server-only Supabase credentials, documented consent and retention |
| Untrusted cross-origin resources | Dependency compromise / tracking | Eliminate mandatory CDNs, Content Security Policy tested against loaders, no broad wildcards, strict origin-scoped requests |
| Downgrade/replay attack | Old vulnerable build activated | Signed monotonic release sequence or vetted anti-replay policy plus separately authorized rollback channel |
| Cache deletion error | Removes settings/saves/content | Named cache ownership, reference-count GC, no Clear-Site-Data wildcard or storage-wide clear |

Additional control: source dependency/SBOM and vulnerability review; artifact provenance tied to reproducible release build; HTTPS and vetted browser APIs; preserve user-origin data; no authentication prerequisite; telemetry opt-in/privacy requirements to be decided before shipping if needed. Package-source code and release contents should not embed secrets.

**Security decision classification:** Documentation-only branch poses no application runtime/security change. OFFLINE-001/002 local dependency closure is generally risk-reducing but asset rights and decoder supply chain require inspection. OFFLINE-003/004/005 introduce quota, persistence and data-processing risks requiring test gates. OFFLINE-007 introduces high-impact update-chain risk and explicitly requires its own security review and owner go/no-go, even if OFFLINE-001 through OFFLINE-006 are authorized together. No claim of security-risk-free implementation is made.

## 11. Work packages, dependencies and authorization gates

| Phase | Depends on | Deliverable | Approval / rollout gate |
| --- | --- | --- | --- |
| OFFLINE-001 | This owner-approved plan | Proven complete dependency graph, local binaries, measured Rover/Lambo optimization trials | Security/license review + actual-source visual QA |
| OFFLINE-002 | 001 critical resource closure | Offline TanStack application shell and recovery routes | Offline navigation proof, no mixed shell |
| OFFLINE-003 | 001 manifest + 002 shell | Complete resumable verified installed world pack | Airplane-mode first-play after PWA install |
| OFFLINE-004 | Runtime save boundary and 002/003 | Crash-consistent local save/load | Force-close restore and migration QA |
| OFFLINE-005 | 002/004 storage and telemetry boundary | Offline diagnostics/outbox and nonblocking release checks | No gameplay network dependency |
| OFFLINE-006 | 001–005 | Device/network/security/performance acceptance matrix | Owner confirms substantial checkpoints |
| OFFLINE-007 | Verified 001–006 architecture, security review | Delta-by-content-hash updater, two-phase activation, rollback | Separate security and update/rollback sign-off before production |

**Order:** Plan approval -> OFFLINE-001 isolated implementation branch -> one change at a time -> verify -> substantial checkpoint -> owner approval -> next milestone. OFFLINE-007's contract and compatibility boundaries are considered during earlier milestones to avoid technical debt, but update activation is not authorized in advance. Do not silently combine a fleet asset replacement and unrelated offline infrastructure in one difficult-to-revert change.

**Source branch/release rule:** GitHub main is canonical accepted source, but only manually approved Vercel promotions become distributed web releases. Current six-vehicle October 19 development work is not silently treated as deployed main. Before implementing, rebase/branch from the owner's chosen accepted revision and explicitly list pending six-vehicle differences. Do not merge or cherry-pick features from Procedure DDD decommissioned branches.

**Artifact rule:** documentation-first under /documentations, status tracked (proposed/experimental/accepted/decommissioned), tests and evidence logged. No implementation or deployment while this document is AWAITING OWNER APPROVAL.

## 12. User-visible benefits and measurable KPIs

| Metric | Baseline | Target / interpretation |
| --- | --- | --- |
| First playable frame after game launch | Existing GTD-LOAD-060 limit | <= 60,000 ms on tested supported devices; offline removes network transfers but not decode/GPU work |
| Critical gameplay network dependency | Remote Voight and possible decoder/CDN, font, shell fetches | Zero after complete offline installation |
| Game content readiness | Current service worker not complete-content-aware | All mandatory resources verified, explicit READY state |
| Repeated update downloads | Potential repeat retrieval/caching inconsistencies | Download only changed hashes and compatible shell chunks; report exact bytes saved |
| Player progress | Save/Load currently not wired | Local transactional saves, recovery and migrations |
| Installation footprint | ~144 MB original public assets, not deploy/install size | Measure complete build; optimize Rover target <5 MB and Lambo target <5 MB without quality loss |
| Vehicle coverage | Six source GLBs on current development branch | Six qualifying now; ten distinct models once two sedans, bus and police car are separately delivered |
| Service resilience | Network-sensitive imports/version/reporting | Offline gameplay uninterrupted on network outage and update failure |
| Rollback | Worker/cache behavior not transactional across world packs | Keep last known good and validated asset references throughout update |

## 13. Open design decisions that do not block plan documentation

- Verify whether full shell rollback is technically supportable across every intended browser; if not, ship OFFLINE-007 initially as content-only incremental updates and retain store-driven APK binary update policy.
- Define mandatory versioned save-state fields as gameplay features become real, particularly future missions/NPCs/traffic; no speculative save schema should invent implemented behavior.
- Establish distribution licensing for UAL GLB and imported vehicle meshes before any publicly redistributed APK or full offline pack.
- Decide exact supported browser/Android device baseline after hardware/performance measurements, not from assumptions.
- Do not set a fabricated final installed-byte budget before measuring compiled artifacts, original vs derivative duplicates, decoders and final vehicle compression.

## 14. Explicit owner approval request

Approval of this plan should authorize **only beginning OFFLINE-001** on a new isolated implementation branch, subject to dependency provenance, licensing and security preflight. OFFLINE-002 through OFFLINE-007 remain sequenced plans requiring evidence/acceptance at their own gates; specifically OFFLINE-007 must pass a dedicated security/update-chain review. A separate authorization is required for merging to main, manually deploying to Vercel production, creating the final APK and any public distribution.

**No code, source GLBs, runtime assets, deployment settings, release cache or application data have been changed in drafting this plan.**

**Next owner decision:** approve the architecture and authorize OFFLINE-001 dependency-closure implementation, or request amendments to this document.