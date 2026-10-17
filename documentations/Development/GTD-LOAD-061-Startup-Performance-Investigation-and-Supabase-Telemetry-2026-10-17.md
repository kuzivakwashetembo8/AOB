# GTD-LOAD-061 — Release-blocking mobile startup latency: investigation, evidence and analytics contract

**Date:** 2026-10-17  
**Status:** DOCUMENTATION / INVESTIGATION DESIGN ONLY. **NO performance optimization, telemetry collection, schema deployment, or changes to the game's startup behavior are authorized or implemented by this record.**  
**Severity:** **P0 release blocker for the current GTD review branch**; this is not evidence that unchanged production has the same timings.  
**Related standards:** [GTD-LOAD-060](./GTD-LOAD-060-One-Minute-Startup-Attention-Budget-2026-10-17.md); [FL-4 first-frame deadlock evidence](../FL-4%20Evidence/First%20Frame%20Startup%20Readiness%20Deadlock%20-%202026-10-11.md); [FL-4 imported-vehicle loading and render evidence](../FL-4%20Evidence/Imported%20Vehicle%20Desktop%20Successful%20Load%20and%20Render%20Cost%20-%202026-10-10.md).  
**Investigated code baseline:** GTD review branch `fix/veh007-dynamic-world-steering-20261017`, SHA `73cc667fc34d040ff7e0af9f7190ec0ee064e10e`. Production `main` remains `8c41fd4800387b1f4f0daea690a6d0af1dd59948`.  
**Affected preview:** `https://gtd-osczbad96-interlinkglobaltech.vercel.app/game` (Vercel build from above review SHA). Screenshots are user-supplied real-device observations, not synthetic benchmarks.

## 1. Executive decision

The GTD-LOAD-060 one-minute attention budget is **demonstrably breached by both captured successful Android loads**. There is no basis to waive or redefine the 60-second limit, mislabel a partly rendered scene as playable, omit accepted vehicles, or merge this branch to production based solely on green unit tests.

**Do not optimize by guesswork.** Instrument the complete boot critical path, compare same-build/identical-setting cold and warm runs, isolate each asset and renderer cost, then make minimal reversible optimizations with quality parity. A future Supabase project is intended as the collection and longitudinal analysis destination, **not** permission to upload personal/device data before the telemetry contract is approved and the project is ready.

### Non-negotiable quality/release constraints
1. User-perceived startup to the **actual first playable frame**, inclusive of initial version check and all required imports, must be **<= 60.000 seconds** per target run. Report >60s as failure even if the session eventually opens. Do not automatically terminate late gameplay.
2. Existing authentic Toyota Hilux and Range Rover GLBs, accepted steering/colliders, mobile graphics, Voight, accessible controls, settings and player state remain intact unless the owner separately approves an explicit visual/performance tradeoff.
3. A user should never see a falsely completed loading meter because a vehicle's import or actual ground/Voight draw was skipped. Likewise an HTTP 200, a Vercel build, or an isolated NullEngine test is **not** real-device load acceptance.
4. Owner-approved Git -> deployment separation remains in place. Any experiment stays on an isolated review branch until separately released.

## 2. Evidence ledger: fact versus inference

### Real Android screenshot evidence (2026-10-17)

| Evidence | Clock shown | Observed UI state | Supported conclusion |
|---|---:|---|---|
| Loading attempt captured around phone 11:37 | `07:00 / 01:00` | Overlay, `7/8 VERIFIED OR RESOLVED` | Startup remained blocked at seven minutes; **which exact checkpoint was open must be read from an uncut checklist/trace**. |
| Successful gameplay captured around phone 11:38 | `07:28 / 01:00` | Meridian world rendered with Toyota and Range Rover; final `OVER TARGET +06:28` | Completed user-visible startup took **448 s**, **388 s over** budget, **7.47x** permitted duration. |
| Another loading screenshot around 11:41 | `00:59 / 01:00` | Overlay, `5/8 VERIFIED OR RESOLVED` | At 59 seconds three checkpoints had not yet resolved. The screenshot alone does **not** identify which dependencies caused the wait. |
| Successful gameplay captured around 11:47 | `06:54 / 01:00` | World rendered with both parked SUVs; final `OVER TARGET +05:54` | Completed startup took **414 s**, **354 s over** budget, **6.90x** permitted duration. |

**Pairing caution:** Phone-clock proximity suggests the 07:00 overlay belongs to the 07:28 run and the 00:59 overlay belongs to the 06:54 run, but no correlated run IDs were captured; those pairings are **unverified**. Do not derive precise stage durations from image timestamps, animation progress percentage, or 5/8 versus 7/8 alone.

**Observed completed sample:** n = 2. Values are 448 s and 414 s (mean/median for this two-run sample = 431 s = 07:11; range 34 s). This is a **case finding**, NOT a statistically defensible population P50/P95. Whether the two loads were cold-cache, warm-cache or different network states has not been recorded.

**Screenshot context:** Android landscape, mobile browser/in-app web presentation and Wi-Fi icon visible. No verified transfer-rate, GPU, RAM, CPU, browser performance trace, precise network identity, cache state, or measured thermals. Do not infer those from icons or battery percentage.

### Source-backed current code facts

- `src/game/core/loading-checklist.ts` defines **eight** runtime checkpoints: renderer, physics, world, Voight, GLTF loader, off-road vehicles, sports cars, first completed scene. The numerator counts **terminal states** (done, failed, skipped), **not** progress through bytes or render stages. **Rover/Toyota are not individually represented** in these eight entries.
- `src/game/core/startup-load-budget.ts` uses monotonic elapsed timestamps. `src/routes/game.tsx` begins timing before `checkGameStartupVersion()` and stops on `first-frame: done`. The display is rounded **down** to seconds: “01:00” displayed can mean anywhere within 60.000–60.999 s, and the current `describeStartupBudget` only flags after flooring. **GTD-LOAD-061 verification must distinguish precise threshold (>60000 ms) from rounded display** without quietly redefining the standard.
- `src/lib/game-version-check.ts` makes a bounded `/build-version.json` request (2,500 ms before abort), may request service-worker update and issue guarded reload. Record all attempts and new navigation legs; a redirected/reloaded session needs a trace ID to avoid falsely reporting a single short leg as total end-to-end wait.
- `src/game/core/gtd-runtime.ts` builds Babylon/physics/city, begins imported vehicle loading, loads Voight, then **sequentially awaits** the existing imported-car `settled` promise and the Mercer `rangeRoverReviewReady` promise, creates drive actors, and waits for the post-import world-render witness before signaling `first-frame: done`. Some work occurs concurrently before these awaits; do **not** add the two wait durations as if both imports were necessarily sequential.
- `src/game/experiments/imported-car-evaluation.ts` loads remote buggy and Ferrari *source* GLBs through Babylon, instantiates them into nine parking slots and emits the off-road/sports checkpoint outcomes. Its `report()` already exposes partial loader stage/elapsed/loadMs evidence, but `loadMs` is not an end-to-end network-vs-parse breakdown.
- `src/game/vehicles/mercer-additional-parked-glbs-006.ts` loads **both** real local assets via `loadAssetContainerAsync`, instantiates their full GLB hierarchies, computes bounds/fit and creates colliders. The Toyota is correctly `visualOnly: true` and excluded from driving but **not** excluded from the startup readiness promise. Both imports begin independently inside `Promise.all(instances.map(...))`. Each visible mesh is currently `alwaysSelectAsActiveMesh=true`, a possible render workload amplifier that requires profiling.
- `src/game/core/world-render-warmup.ts` renders actual witnesses repeatedly while GLBs are settling; by default attempts are separated by at least 32 ms. After imports settle, the main runtime requires actual ground/Voight/urban draws (and uses an extended 45 s deadline for the character trial), rather than reporting a sky-only frame as ready.

### Filesize inventory, **not** a measured transfer waterfall

The Git tree stores:
- Range Rover GLB: **24,349,788 bytes** (~23.22 MiB).
- Toyota Hilux GLB: **17,214,188 bytes** (~16.42 MiB).
- Together **41,563,976 bytes (~39.64 MiB)** of compressed/container source payload.
- Existing off-road and sports source estimates in `vehicle-probe-plan.ts`: 6,062,428 and 1,681,572 bytes (~7.39 MiB). The *approximate source-asset total* is **49,307,976 bytes (~47.02 MiB)**, before other world textures, scripts and runtime data.

**Do not equate repository file sizes with actual over-the-wire transfer, decoded CPU/RAM cost, GPU upload cost, mesh count, cache hit/miss status or time.** Source textures may be internal; HTTP transfer size may vary; future codecs must be measured.

### Historical precedents, **not** matching Android A/B evidence

- On 2026-10-10 a documented older desktop FL-4 import run showed off-road `loadMs≈17.8 s`, Ferrari source `loadMs≈101.4 s` and severe render long-tail; it ran a **different commit/device/scenario**, so it supports plausibility of slow GLTF work, **not** causality for the 2026-10-17 Android 414/448-second cases.
- On 2026-10-11 a previous 7/8 stall resulted from awaiting Babylon `scene.whenReadyAsync()` before any real render; GTD replaced that deadlock with an actual-world-render gate. Current code is different. Do not resurrect the historical diagnosis without a new trace showing a first-frame witness blockage.

## 3. Mechanism and ranked investigation leads

| Hypothesis / competing explanation | Evidence available | Unproven part | Experiment that discriminates |
|---|---|---|---|
| H1 — GLB network / decode / allocation dominates the critical path | ~47 MiB of source model files; two pipelines on the readiness path; historical imported cars slow | Which model, request phase or device resource dominates in these runs | Independently time request→response, parse/container ready, instantiation, geometry/material readiness and collider fit per asset; inspect long tasks. |
| H2 — Rendering during async import induces CPU/GPU contention or main-thread stalls | `beginWorldRenderWarmup` renders repeatedly, vehicle meshes forced active | That overlap adds minutes on this phone | Matched-build trial with measured warm-up cadence or controlled temporary pause while imports run; preserve real final render/asset gate. |
| H3 — first-frame witness stays incomplete after imports | 7/8 observed once; prior historical 7/8 deadlock | Whether this run reached/started the first-frame checkpoint | Record first-frame start, render-attempt count, last witness booleans, shader/effect failure and post-import elapsed. |
| H4 — cache/service worker/retry or endpoint inconsistency | Version-check handshake and PWA caching exist | Whether two loads were network-cold or reused cached assets; whether reload occurred | Record release IDs, navigation leg count, worker state, resource timing and cache provenance when available. |
| H5 — mobile memory pressure/GC/thermal constraints | Several dense imported scenes; user mobile environment | No available memory/thermal/GC timeline | Measure main-thread long tasks, heap where exposed, scene mesh/material/texture/draw-call counts and renderer frame durations; compare identical cold/warm runs. |
| H6 — unstable or cross-origin remote GitHub source delivery | Ferrari/Buggy URLs are externally hosted | Actual throughput, retry, DNS or CORS visibility on user's device | Network resource timing with appropriately configured TAO when permitted; classify unknowns honestly. |

**Important:** Hypothesis rank is investigative priority, not probability or an assertion that Toyota alone caused the regression.

## 4. Proposed instrumentation contract (not yet implemented)

### Timing semantics and run identity

- Use a new random **run_id UUID** per user navigation/boot, plus optional **trace_id UUID** spanning **one automatic version-update reload chain**. Both are transient; no persistent fingerprint or stable device identity.
- Record **`timeOrigin` + `performance.now()`**-derived durations with subsecond precision. Avoid using `Date.now()` differences as high-resolution duration truth. UTC wall-clock `created_at` is for server arrival/ordering, not performance calculation.
- `boot_start`: first visible loading-route start. `first_playable`: accepted actual `first-frame: done` after all mandatory imports. `boot_failed`, `boot_aborted`, `tab_backgrounded` and `navigation_reloaded` are **distinct** outcomes; do not count failed/abandoned runs as successfully under-budget.
- Keep the **raw `duration_ms`**, not just display seconds. **Budget failure iff duration_ms > 60000.** On-screen `MM:SS` is display only. Preserve overage `max(0, duration_ms - 60000)`. A 60,500-ms run is over budget even if the display reads `01:00`.
- Record a `visibility_timeline` or at minimum foreground/background duration and count. Separate `wall_elapsed_ms`, `foreground_elapsed_ms` and `background_elapsed_ms`. Owner's 60-second contract uses full wall elapsed; foreground-only can be used diagnostically but **cannot replace** actual user wait time.
- Persist a compact **local diagnostics ring buffer** (bounded count/size), exportable by the owner. **Until consent/backend integration is approved, nothing is transmitted.** Avoid overwriting game saves or local settings.
- All stage events need `stage_start_ms`, `stage_end_ms`, `status`, `error_code`, `parent_span_id`, `work_id` and `is_blocking`. Overlapping spans must be represented as a timeline/critical-path DAG. **Never sum concurrent vehicle spans** to manufacture the user's boot time.

### Required stages and probes

| Stage key (stable) | Start/stop boundary | Detail fields |
|---|---|---|
| `version_handshake` | Begin deployed SHA check → current/offline/reload outcome | running/deployed SHA, timeouts, retry count, worker state; omit URLs/query credentials |
| `engine_initialize` | Babylon Engine/Scene construction → initialization complete | WebGL backend/vendor family if safely obtainable, render scale/DPR/canvas pixels |
| `physics_initialize` | Rapier import/create → ready | success/failure and elapsed |
| `world_generate` | City/world creation → objects/colliders available | mesh/material/texture counts, generated street context counts |
| `character_import` | Voight GLB/rig request → live pose placed | network/container/rig instantiation subspans |
| `gltf_loader_initialize` | Dynamic module import → loader ready | dynamic import duration |
| `asset_download` | Individual GLB request → body complete where detectable | asset_id, known file bytes, transferred bytes only if exposed, HTTP outcome/cache classification if reliable |
| `asset_parse` | Whole downloaded GLB available → parsed container ready | Babylon loader duration; **do not claim separate network/parse times if Babylon's API cannot expose them** |
| `asset_instantiate` | `instantiateModelsToScene` → real meshes mounted | root/mesh/material/texture counts, vertex/index counts, cached source |
| `asset_fit_collider` | Bounds/scale → collider and/or driving-actor creation | actor kind, actual dimensions, failure code |
| `import_pipeline_settlement` | Await existing parked-car probe `settled` | offroad/sports source statuses and blocking wait |
| `mercer_settlement` | Await Rover+Toyota collection `ready` | each individual spec status, wait elapsed, visual-only flag |
| `world_warmup` | Warm-up loop start → final qualifying evidence | attempts total/post-import, average/p95 render ms if sampled, ground/road/Voight witnesses |
| `first_playable_frame` | Imported assets settled → `first-frame: done` | successful render completion, render witness booleans |
| `boot_total` | route timer starts → first playable or failure/abandon | outcome, `duration_ms`, budget result |

**Substage fidelity requirement:** `loadAssetContainerAsync(url)` returns after loading and parsing; a wrapper clock alone is not a download-only measurement. To isolate transfer vs decode, use browser Resource Timing **when cross-origin permissions permit** or instrument an explicit fetch + Babylon loader-from-bytes workflow **only as a separately approved feature**, observing cache/CORS/GPU consequences. Mark timing components `unknown` rather than subtracting unsupported numbers.

### Long-task / rendering signals

Collect where browser APIs expose them: `PerformanceObserver` long-task count and total/max time, `performance.getEntriesByType('resource')` with TAO constraints, JS heap estimate where exposed, memory-pressure/context-lost events, engine shader compilation if instrumented, render warm-up frame timings, active meshes and draw calls if cheap to sample. Unsupported APIs must produce `null` plus `availability_reason`, **not fabricated zeroes**. Do not poll expensive scene metrics every frame; sample at start/end of stages or very low rate in opt-in diagnostics.

## 5. Supabase future data contract (proposal, **NO PROJECT YET CONNECTED**)

The owner is creating the Supabase project separately. No project URL/ID, database credentials, JWT secret, service-role token, collection endpoint or data-store schema has been supplied or configured in GTD. **Do not invent any, add environment values, run migrations, or begin collection.**

### Recommended minimum tables

1. **`performance.startup_runs`** — `run_id uuid primary key`, optional `trace_id uuid`, `release_sha char(40)`, `environment`, `started_at timestamptz`, `duration_ms numeric null`, `outcome` enum (`playable`,`failed`,`aborted`,`reloaded`), `budget_ms=60000`, `over_budget bool null`, `cache_cohort` (`cold_confirmed`,`warm_confirmed`,`unknown`), `device_class` (coarse `mobile`,`desktop`,`tablet`), `browser_family`, `network_class` (coarse/nullable), `foreground_ms`, `background_ms`, `preview_experiment`, `telemetry_schema_version`, `ingested_at`. Do **not** store exact user agent, raw IP, geolocation, persistent person ID or authentication data as performance fields.
2. **`performance.startup_spans`** — `event_id uuid primary key`, `run_id uuid references startup_runs on delete cascade`, `span_id uuid`, `parent_span_id uuid null`, `stage_key`, `asset_id null`, `start_offset_ms`, `end_offset_ms`, `duration_ms`, `status`, `is_blocking`, `error_code null`, `attributes jsonb` with allowlisted keys only; composite index on `(run_id, start_offset_ms)` and on `(stage_key, duration_ms)`.
3. **`performance.asset_observations`** — `id uuid primary key`, `run_id uuid`, `asset_id` (bounded logical ID, not arbitrary full URL), `source_kind` (`same_origin`,`cross_origin`), `source_bytes_known` null, `transfer_bytes` null, `download_ms` null, `container_ready_ms` null, `instantiate_ms` null, `gpu_ready_ms` null, `cache_evidence` (`confirmed_network`,`confirmed_cache`,`unknown`), `mesh_count`, `materials_count`, `result` and `error_code`. Add `(asset_id, run_id)` index.

**Ownership / privacy:** Browser must **not** have direct unrestricted SQL-table insert permission, and a Supabase `service_role` or secret signing key must never reach a client bundle. Preferred path: an authenticated/rate-limited same-origin ingest endpoint or Supabase Edge Function that validates a narrow telemetry JSON schema, payload size, allowed stage names, environment and release, sanitizes all attributes, assigns server receipt time, then inserts with **server-held credentials**. Enable RLS on all tables; no public SELECT, UPDATE or DELETE, and preferably no direct anon INSERT. Restrict dashboard reads to authorized project personnel. Review legal/consent requirements before enabling anonymous player analytics.

**Collection controls:** Begin with **owner-triggered opt-in diagnostics** on previews; no automatic public telemetry yet. Later decide sampling rate, privacy disclosure/consent, retention (proposal 30-day raw runs / 90-day aggregates), aggregation and deletion procedure, ingestion cost limits, bot/event flooding controls, daily volume limits, and connection failures. Batch in memory, drop safely or locally buffer with a strict bound when offline; network analytics **must never block first playable frame**. No cookies, localStorage values, saved-game contents, passwords, screen images or arbitrary freeform exception text in transmitted events.

### Example **proposed** event payload (not emitted yet)

```json
{
  "schema": "gtd.startup.v1",
  "run_id": "4a55b615-0c85-4d06-9dfb-715035ae4e9e",
  "release_sha": "73cc667fc34d040ff7e0af9f7190ec0ee064e10e",
  "environment": "preview",
  "outcome": "playable",
  "budget_ms": 60000,
  "duration_ms": 448000,
  "device_class": "mobile",
  "cache_cohort": "unknown",
  "spans": [
    {
      "stage_key": "mercer_settlement",
      "asset_id": null,
      "start_offset_ms": null,
      "end_offset_ms": null,
      "status": "unknown"
    }
  ]
}
```

**Example warning:** Only `duration_ms=448000` and `release_sha`/preview cohort have grounding in this captured trial context; its `run_id` is a fabricated illustrative UUID, and **all span boundaries above are explicitly unknown**. Do not seed this example into a real analytics database as an observed run.

### Initial Supabase dashboards / queries (when populated)

- Rolling n, success rate, failure/abandon rate, over-60s rate; p50/p75/p95/p99 end-to-end elapsed *by deployed SHA, mobile device class, browser family, cache cohort*; confidence/small-n visibility.
- Critical-path breakdown: which asset/stage determines readiness, elapsed/blocked time vs wall elapsed, not the sum of parallel spans. Top regressing assets and cold-vs-warm deltas.
- `7/8` & `5/8` stall frequency by checkpoint ID and actual last known active span; last successful/failed render witness, worker reload/retry rate, timeout/rate-limit failures.
- Matched build A/B evidence with controlled asset/renderer experiment flags, coherent traffic assignment, visual-quality baseline and reported sample sizes.
- **Do not** compare all-time mobile and desktop percentiles without stratification, or interpret two screenshots as p95.

## 6. Experiment plan and sequence (approval gated)

### Phase 0 — baseline preservation / instrumented build
- Freeze a review SHA, record Vercel deployment ID, owner device/browser/version, render preset, vehicle count, screen orientation, active network, service-worker state, cold/warm classification. Do **not** clear player data. Preserve the accepted current screenshots and 448/414-second results.
- Expose a lightweight opt-in `GTD-LOAD-061` local diagnostic export, include **trace timeline** and summary; no Supabase transport until approved.
- Verify timers using synthetic delayed promises, parallel spans, reload chains, offline/aborted scenarios, tab background/foreground, failures, timing API absence and first-frame semantics.

### Phase 1 — identify the critical path
- On the **same** commit and device, record >=3 runs per planned condition if practicable: new cold-cache session and warm-cache repeat. Distinguish “cache warm” experimentally rather than by impression; do not clear storage/game saves to manufacture a cold profile.
- Report exact times for version check, renderer, physics, city, Voight, each GLB, loader, instantiation, warm-up, collider and final render. Identify the longest **blocking chain** and how much of the total exceeds 60, with availability flags where subspans cannot be measured.
- Capture failures/long stalls, not just successful load durations. Attribute event loops and network issues only with trace support.

### Phase 2 — controlled hypotheses
- **Toyota-specific A/B:** owner-authorized same-build diagnostic flag disables only its **visual-only** import and its parking collider; all other assets/settings stay identical. Compare matched device/cache/network conditions and restore Toyota for acceptance. This is an investigation flag, **not** authorization to ship without Toyota.
- **Legacy remote imports A/B:** isolate buggy/Ferrari pipeline without silently showing procedural placeholders or invalidating accepted-world visual requirements; trial remains diagnostic only. Test cross-origin network caching and availability separately.
- **Render-warm-up A/B:** isolate low-risk cadence and scene active-mesh behavior **without eliminating the real final frame**. Measure long-task and draw-call effect; reject any “improvement” that only delays visual stutter until gameplay.
- **Delivery/asset optimization candidates:** conditionally evaluate HTTP CDN caching, verified content-hashed URLs, GLB compression/meshopt/Draco where fidelity can be preserved, KTX2 texture transcode, worker-based decoding where supported, shared instanced geometry, deferred *noncritical* visuals, and controlled preloading. Each requires a pre/post trace plus geometry/material/visual parity; large compressed files alone do not prove the best solution.
- **Physics/criticality review:** A decorative parked Toyota may eventually be deferred until *after* the real first playable frame **only with an explicit owner decision to redefine which objects must be present at initial playability**, plus a visible streaming handoff that does not pop in unfairly, block colliders, or lie about readiness. Not pre-authorized.

### Phase 3 — release proof
- Exact original-world real GPU render gate and range Rover/Toyota visibility, wheel contact, imported materials, steering, collision, app settings and driving input must remain correct.
- **0 observed >60,000 ms startup runs in the owner-designated test matrix is the initial release gate** (a test pass, not a guarantee of a population p95). For a future production SLO, define an adequately sized statistical cohort and explicit p95/availability/long-tail objectives after instrumentation collects meaningful volume.
- Unit/integration tests and production-style build, fresh/warm Android landscape tests on at least the owner's device, cross-browser if available, offline/PWA/update tests, and release SHA verification must pass. Document all residual failures; do not merge this P0 defect to main.
- Keep the active frontend stopwatch for ongoing regression visibility even after performance improves.

## 7. Tasks, dependencies and responsibilities

| Work item | Owner / dependency | Status |
|---|---|---|
| Record current screenshots, actual elapsed values, source facts and hypotheses | GTD engineering documentation | **DONE** (this record) |
| Provide/create Supabase project, environment separation and access | Owner (outside this branch) | **EXTERNAL DEPENDENCY — IN PROGRESS** |
| Agree opt-in/consent, secure ingestion, schema, retention, volume and dashboard scope | Owner + engineering | **PENDING APPROVAL** |
| Implement local stage/asset tracing and diagnostics download | Engineering after separate implementation authorization | **NOT STARTED** |
| Run matched same-build experiments with reproducible conditions | Engineering + owner mobile verification | **NOT STARTED** |
| Apply only measured, reversible performance improvements | Engineering after evidence and approval | **NOT STARTED** |
| Verify first playable <=60s without quality loss and decide main promotion | Owner release gate | **BLOCKED BY PERFORMANCE** |

### Supabase connection handoff checklist
When the owner reports the project ready, request only: project reference/URL (non-secret), dev vs production environment choice, intended ingestion topology (same-origin server or Edge Function), authorized personnel for dashboards, agreed telemetry sampling/retention and whether to permit anonymous opt-in diagnostics. Put keys and service-role credentials **only in secret-managed server/Edge environments**, never in source, logs, markdown, browser code or GitHub. Use approved migrations in a review environment first; test RLS/abuse prevention and verify no upload occurs before consent/authorization.

## 8. Decision log / explicit exclusions

- **Decision:** Treat confirmed 07:28 and 06:54 as unacceptable startup failures against a 01:00 target.
- **Decision:** Keep GTD-LOAD-060 first-render criterion truthful; **do not** use 5/8 or 7/8 as a percentage of elapsed network transfer.
- **Decision:** Do not imply that Toyota alone caused this; current code shows plausible multiple overlapping blockers and rendering contention, with insufficient source-specific mobile timings.
- **Decision:** Document Supabase-ready schemas and instrumentation semantics; **do not create or connect a Supabase project, insert data, alter game code or deploy** as part of this documentation request.
- **Next actionable handoff:** On Supabase project readiness and owner authorization, implement opt-in local stage tracing first and then secure analytics ingestion; use the resulting evidence to propose a small, bounded, fidelity-preserving load-time correction.

---
**Cross-reference:** `GTD-LOAD-060` defines the 60-second experience contract. This `GTD-LOAD-061` record defines the observed P0 failure, investigation method and proposed analytics architecture. Neither record constitutes evidence that a latency optimization has been implemented or that Supabase collection is live.
