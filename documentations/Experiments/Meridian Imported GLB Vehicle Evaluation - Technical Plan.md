# EXP-VEH-001 — Meridian Imported GLB Vehicle Evaluation

**Status:** USER-AUTHORIZED EXPERIMENT; NO FINAL VEHICLE-PIPELINE DECISION; ACTUAL MEASUREMENTS PENDING  
**Authorized:** 2026-10-10  
**Working branch:** `experiment/meridian-imported-car-probe` (derived from `development/meridian-fl4-optimization` at `25a1630a5629138c09450867010f88af1df064d3`)  
**Canonical authority:** `documentations/Meridia First Light Implementation Plan.md`; **existing performance contract:** `documentations/FL-4 Technical Implementation Plan.md`  
**Research:** `documentations/GTD-Car-Design-Research.md`, `documentations/GTD-Car-Design-Research-2.md`, `documentations/Browser Based 3D Asset Generation Tools & Techniques.md` (on main); experimental forked repositories listed below.

## 1. User authorization and scientific method

The user judged two independently viewed forked GLB vehicles to be the first compelling demonstration of GTD-grade visual quality, browser-compatible asset delivery and rendering. They **explicitly authorized a temporary evaluation** in Meridian City, beginning by replacing the visuals of the cars already parked, and asked for comprehensive source-controlled evidence. No final asset, supplier, pipeline, vehicle geometry, IP license, mobile budget, performance threshold or production promotion was approved.

**Doctrine for this experiment:** *Decisions follow measured evidence rather than assumptions; experimentation does not preclude other valid technical solutions.* Keep procedural geometry, Spline-generated originals, licensed marketplace models, script-assisted Blender, and hybrid assets as viable comparators. An experiment failure informs the decision; it does not prove all GLB pipelines unsuitable. Conversely an appealing screenshot does not prove licensing or performance.

**Narrow scope:** existing deterministic parked cars only. They retain stable IDs, exact positions, yaw, scale policy, static Rapier cuboids, navigation, garage interaction and physics semantics. No additional car spawns, drivable physics, new vehicle classes, city content, window/tree changes, sky work or production changes. No final external asset redistribution or inclusion in official game releases.

## 2. Specimens and provenance

| Designation | Source | Source asset | Source-reported size | Caveat |
|---|---|---|---|---|
| A — off-road vehicle | [interlinkglobal/Car-Game-ThreeJS](https://github.com/interlinkglobal/Car-Game-ThreeJS) | `public/vehicals/car.glb` (fork `main`) | 6,062,428 bytes | Model resembles a high-clearance off-road buggy. The repo loads it via `useGLTF`; it is **not the eventual civilian sedan**. The model's original rights and reuse grant have not been verified. |
| B — sports vehicle | [interlinkglobal/JS-3D-Car](https://github.com/interlinkglobal/JS-3D-Car) | `models/ferrari.glb` (fork `master`) | 1,681,572 bytes | Sports-car model with a Ferrari-like identity, credited by the source app to a Sketchfab creator. Rights for incorporation into GTD are **unverified**. The fork uses Three.js `GLTFLoader` plus Draco and named meshes/materials. |

The user's browser-only viewer rendered these assets successfully from GitHub raw URLs. This does **not** prove Babylon.js parity, performance, runtime CORS or commercial reuse. The experiment should **reference the original public URLs** and avoid copying either proprietary-looking binary into the GTD repository; any preview must be labeled a **third-party technical specimen**, not original GTD vehicle content. Probe preview URLs are disposable and must not be promoted or advertised as public production. The asset-specific legal status is **PENDING** until reviewed, and a final original Meridian sedan requires separately verified art rights.

The GLB loading origin is external. External CDN/GitHub availability, CORS, content type and latency are independent potential failures; report them rather than silently classifying them as engine-performance failures. Before distribution, replace external origin with a licensed, appropriately hosted, immutable and versioned first-party artifact.

## 3. Hypotheses: what the test can establish

- **H1 — Visual fit:** both specimens render with recognizable form, proportions, surface shading and realistic contact with the existing roads under Meridian daylight/night conditions. Test three-quarter/front/side/rear views and Voight-scale street view.
- **H2 — Placement/physics preservation:** replacement changes only the visible meshes. Compare exact pre/post planned car IDs, world positions, yaw, dimensions and Rapier collider registrations. Run into/around each car as Voight, including away from garage.
- **H3 — Measurable rendering and loading:** at matched camera, device, time-of-day and hardware scale, collect p50/p95 frame and render durations, active meshes, triangles/indices, draw calls, shadow casters, materials/textures, asset retrieval/load timings, and evidence of errors/cleanup. GPU memory and temperatures that browser APIs do not expose must be marked `UNAVAILABLE`, not invented.
- **H4 — Controlled reversibility:** query switch toggles the existing native proxies vs imported GLBs using the **same source build**, retaining scene and world baselines. Missing/broken GLB reverts to a visible proxy and explicit diagnostic error.
- **H5 — Quality cannot be established from one specimen:** these off-road/sports shapes demonstrate an asset format and potential fidelity, not completion of the civilian fleet sedan design contract. Only paint color is initially authorized as a future civilian model variation.
- **H6 — Cost scaling remains a separate later test:** the first pass replaces existing cars **one-to-one**. Subsequent 1/3/5/10-copy loads or future asset instancing need a named second phase, not assumed from the first screenshots.

**Limits:** The existing static colliders are 1.76 × 1.52 × 4.0 m (before per-car scale), and do not fit arbitrary originals exactly. A uniform visual fit inside that proxy is strictly an **experiment accommodation**, not a representation of the originals' exact dimensions. If either model cannot be shown legibly under that constraint, record the conflict rather than silently expanding collision or parking clearance. The buggy may be too large in apparent wheel/body scale. The Ferrari is not a sedan. This phase cannot support deciding the final sedan's dimensions or its license.

## 4. Implementation design and guardrails

### 4.1 Integration boundary

1. Branch from the accepted pre-continuation FL-4 development baseline, not `main`. Keep `main` and production Vercel pinned and untouched.
2. Add a **reversible, experiment-only** code module for GLB loading and parked-car replacement. Prefer Babylon `@babylonjs/loaders` package version matched to core `9.29.0`, imported only when the probe is enabled. Do **not** import Three.js or React Three Fiber into the GTD runtime.
3. Use `planStreetContext(FIRST_LIGHT_CITY_SPEC)` to enumerate **only the existing** `parked-car` items. Map stable IDs deterministically to specimen A and B (alternating by sorted ID if both are present). Add **no** new positions or colliders.
4. Instantiate a parent root per imported specimen, translate to planned X/Z/Y, align yaw to existing park orientation and apply an **aspect-ratio-preserving** (uniform) normalization based on source GLB mesh bounds. Record source dimensions, scale, model's original forward axis and resulting visual bounds for review. Do not stretch wheels/body independently or change coordinates from seeded world generation.
5. On successful import and validation, disable and/or remove the old vehicle-proxy visuals only for that same planned car. Keep original mesh fallback visible while pending or failed; prevent double-rendering after success. Do not dispose world-owned resources behind their owning lifecycle without updating ownership and shadow lists safely.
6. Render car paint/glass/rubber/lamps from the imported GLB for fidelity comparison. No forced palette overhaul or re-authoring. Avoid unintentionally changing other scene material families.
7. Keep shadows coherent with environment's shadow generator; ensure no hidden proxy casts a duplicate shadow. Attach **no** physics or camera blockers to arbitrary imported render meshes. The unchanged Rapier static box remains the sole collision object.
8. Implement cancellation/disposal guards around asynchronous load completion, including rapid exit/re-entry. No zombie meshes, dangling asset containers, duplicate textures or failed-reload crashes.
9. Make the experiment opt-in via `?gtdVehicleProbe=imports` (and baseline via `?gtdVehicleProbe=baseline`). Use `?fl4Diagnostics=1` for the existing opt-in profiler. Ordinary GTD paths and all production builds retain the previous default renderer.
10. The import URLs are public GitHub-hosted **temporary test dependencies**. Fail gracefully if they 404, CORS-fail, rate-limit or change. Do not commit third-party GLB binaries, do not promote license-uncleared specimens.

### 4.2 Verification and measurement

| Category | Required evidence | State before test |
|---|---|---|
| Source/provenance | fork URL, filename, Git ref, license inspection, bytes and data origin | file paths and bytes verified; rights unresolved |
| Build | strict TypeScript, Vitest regression, Vite/Nitro production build on preview SHA | PENDING |
| Determinism | same vehicle count/IDs/positions/yaw before and after opt-in | PENDING |
| Physics | player blocked by original parked colliders, garage threshold unmodified, curb/road passability and camera blockers intact | PENDING |
| Import | both assets decode/render; graceful partial/failure fallback; orientation and scale recorded | PENDING |
| Lifecycle | reload, pause/resume, exit/re-enter, dispose after/while loading | PENDING |
| Visual | matched camera captures from four angles, Voight scale, road/neutral off-road reasoning, day and night | PENDING |
| Performance | three identical passes: proxy baseline and imported replacement; 30+ s settling then >=120 s sample each; p50/p95 frame/render ms, draw calls, active indices, meshes/materials/textures; desktop and representative landscape mobile | PENDING |
| Final interpretation | findings that support/contradict each hypothesis; explicitly separate actual measurements, assumptions, unknowns and device limitations | PENDING |

Initial acceptance is **not** an FPS number invented in advance. Pass means both assets are shown or failures are documented with causes, unchanged physics is confirmed, import overhead and visual fit are measured, and the user accepts the experiment's evidence as useful. Decision on source-asset adoption requires a **separate commercial-license and art-direction review**.

### 4.3 Recommended capture method

Use the exact **same preview build** with two URLs:
- `/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`
- `/game?gtdVehicleProbe=imports&fl4Diagnostics=1`

Start at the same in-world daytime (14:30), walk to each original parked car, capture front/side/rear/three-quarter views at Voight head/camera height, record load settled state and screenshot, repeat at night using the existing time controls. Inspect `window.__GTD_FL4_REPORT__?.()` after each matched traversal; export raw JSON. Record browser version, device, OS, DPR, render scale, viewport/backbuffer dimensions, timestamp, actual test duration, effective sample count and whether loads were cached. Profile cold and warm imports separately. Do not compare cached import to uncached baseline without annotating the difference.

### 4.4 Rollback

Leave `main` and production unchanged. At any point set `gtdVehicleProbe=baseline` for immediate same-build baseline; remove the experiment-only module/integration or drop the feature branch entirely to abandon. Never repurpose the final original fleet sedan specification to include the Ferrari/buggy.

## 5. Post-experiment decision gate

Report a table of **measured outcomes** vs H1–H6 with exact preview commit, URL and device conditions. Candidate dispositions: `VIABLE AS EXPERIMENT`, `CONDITIONALLY VIABLE`, `BLOCKED BY PROVEN CAUSE`, or `NOT YET MEASURED`. Do not infer final licensing from a public fork or consider external GLB performance equal to the optimized long-term original sedan. All other candidate methods stay under consideration. Await an explicit separate authorization for final sedan implementation, source-asset redistribution, merging into the production branch or increasing parked-car quantity.

## 6. Authorized follow-on amendment — Iteration 2 real-scale vehicles (2026-10-10)

The user's subsequent inspection confirmed both imported GLBs rendered inside Meridian but the original fixed-size normalization made them appear like children's toys. The user explicitly authorized **properly scaling the cars**. This amendment supersedes the **first-iteration-only** requirements above that all imported cars fit the previous small collider envelope and that static parked-car colliders never change. It does **not** supersede stable car IDs/placement/yaw/count, separate model-to-physics ownership, no new vehicle gameplay, licensing limitations, rollback or production isolation.

The active second-iteration implementation:

- Establishes per-specimen **in-world** length targets (buggy 4.05 m; sports car 4.53 m, preliminary class-calibration choices) rather than a universal 3.84 m cap.
- Uses a single uniform scale, compensating for existing per-slot deterministic random scaling, so no wheel, glass or body surface is disproportionately stretched. Model-derived width and height are recorded, not assigned fictionally.
- Replaces **only** each successfully imported parked vehicle's Rapier static box with a measured-width/height/length cuboid at the same planned X/Z/yaw and ground elevation. Failed imports keep the previous visuals *and* collider. Physics allocation/disposal regression tests validate unchanged live body/collider totals.
- Keeps the two control URLs on the same pinned preview build; no extra spawned cars or production code changes.
- Identifies automotive visual and collision alignment, curb clearance, initial proxy-to-GLB appearance swap, browser loading, device performance and licensing as separate outstanding field-measurement gates. Static cuboids remain intentionally coarse and are not evidence of vehicle-driving simulation correctness.

**Detailed subordinate record:** `documentations/Experiments/EXP-VEH-001 Real-Scale Calibration - Iteration 2.md`. **Ready pinned game build:** `b1147110de6e6a4e47b1b3383ede70397901a67a`, Vercel `dpl_9Ai7mu64hqLRHDmD5zP78AQSHHDo`, strict TypeScript + 77 tests/16 files + build passed. **No in-browser real-scale capture or p50/p95 comparison has yet been submitted for this iteration.**
