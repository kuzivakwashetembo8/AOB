# FL4-04 — Reversible GLB Shadow/Distance LOD Optimization Experiment

**Status:** USER-AUTHORIZED SOURCE IMPLEMENTATION; PERFORMANCE AND VISUAL ACCEPTANCE PENDING  
**Date:** 2026-10-10  
**Experiment branch:** `optimization/fl4-vehicle-shadow-lod` forked from approved `development/meridian-fl4-optimization` at `2af3f674ff6347a778015dc1253e8229c547acae`.  
**Canonical authority:** `documentations/FL-4 Technical Implementation Plan.md`, especially FL4-04, and `documentations/Meridia First Light Implementation Plan.md`.  
**Relevant measured evidence:** `documentations/FL-4 Evidence/Shadow Isolation - Imported Cars Visibly Loaded - 2026-10-10.md`; `documentations/FL-4 Evidence/Same-Build Desktop A-B - Imported Vehicles versus Procedural Baselines - 2026-10-10.md`.

## Motivation: what the user actually measured

The accepted detailed buggy and sports car are viable GTD development assets but the current nine-placement import scheme is expensive under the inspected desktop scenario:

- Same source build, shadows disabled: **imported**: 53.4ms median frame, 42.5ms median render, 221 median draw calls, 1,935,591 median active indices; **procedural**: 33.3ms frame, 10.4ms render, 88 calls, 59,610 indices.
- With scene shadows enabled, a prior report **registered** 834 shadow casters and 990 median draw calls for telemetry-reported imported slots, compared to 316 registered casters for the procedural scene. The user did **not** confirm the imported cars visibly rendered in the earlier shadow-enabled capture; that sample is NOT a visual pass.
- Separate shadow-disabled imported screenshots visibly confirmed buggy and sports in Meridian. Most of the scene's new meshes/casters are GLB submeshes. Raw assets have unresolved third-party commercial/redistribution rights.
- The large shifts in median active indices, render time and registered casters justify a targeted experiment; they do NOT prove individual vehicle meshes are the only cause of slowdown or guarantee fixed FPS.

**User authorization:** proceed with a reversible FL4-04 optimization experiment; preserve accepted high-quality vehicles and their approved dimensions/positions/collisions. User may independently inspect Payback's front-end for rendering techniques; external observations are candidate ideas until they are supported by reproducible evidence in GTD.

## Test architecture — four isolated modes on the SAME code SHA

All modes require `?fl4Diagnostics=1`; without it any `fl4VehicleOptimization` query is ignored, preserving the current accepted high-quality development default.

| Setting | Near imported GLBs | Vehicle shadow-map participation | Distant car visual |
|---|---|---|---|
| `fl4VehicleOptimization=full` (or omit) | Unmodified full models | All imported submeshes (existing baseline) | Full imported GLBs |
| `fl4VehicleOptimization=selectiveShadows` | Unmodified full models | Up to **four substantial surface candidates per vehicle** | Full imported GLBs |
| `fl4VehicleOptimization=distanceLOD` | Unmodified full models | All imported submeshes (for detailed instances) | Pre-existing procedural proxies |
| `fl4VehicleOptimization=combined` | Unmodified full models | Selective significant casters | Procedural proxies beyond threshold |

**Shadow-caster selection:** for each successfully imported instance, inspect its submeshes' decoded world bounding extents and rank nonempty components by projected surface-span heuristic `width×length + 0.4×height×(width+length)`. Stable IDs break ties. Retain up to 4 selected meshes and register them in Babylon's shadow generator with `addShadowCaster(mesh, false)` to avoid recursive re-addition of all descendant details. The **ordinary camera pass still renders ALL detailed imported meshes**. This is a test of shadow proxy choice, not an accepted final sun/night shadow silhouette. A blank or incorrect wheel/body shadow is a documented visual failure.

**Distance LOD:** each existing imported slot keeps its approved detailed GLB near the camera and re-enables its **already-existing** procedural six-mesh proxy only beyond 36 m. The high-detail model returns on approach inside 28 m; hysteresis reduces popping at threshold. Exactly one representation is enabled per imported slot at a time; this does NOT change the car count, world position, static Rapier collider, model URL, calibration, accepted appearance at review distance or road map. Proxy shapes are visibly less realistic and intentionally qualify only as a long-distance diagnostic substitute. If proxy pop or mismatch is noticeable at acceptable game distances, reject/refine this idea rather than declaring the appearance preserved everywhere.

**Isolation note:** the shadow probe reduces *registered vehicle shadow components*; the distance LOD reduces *active detailed meshes* outside the near camera range. This does not constitute offline mesh decimation, texture compression, geometry instancing, draw-call merging or GPU memory optimization. GLB network files are still downloaded and instantiated even if some slots render proxies at distance. These are distinct future questions, not achieved benefits of this patch.

## Code ownership and telemetry

- `src/game/experiments/fl4-vehicle-optimization.ts`: pure diagnostic-mode gating, deterministic bounded shadow selection, distance threshold/hysteresis rules.
- `src/game/experiments/imported-car-evaluation.ts`: per-vehicle material/geometry/collision unchanged; optional shadow list selection and an opt-in before-render active-representation check; diagnostics `importedVehicles.optimization` exposes mode, selected vehicle shadow casters, source submesh candidate counts, detailed slot count and far-proxy slot count. Model loading and lifecycle disposal remain with existing importer.
- `src/game/core/gtd-runtime.ts`: resolves the mode only when diagnostics enabled.
- `src/test/fl4-vehicle-optimization.test.ts`: validates mode gating, deterministic candidate selection, rejection of empty/invalid geometry and hysteresis.

## Verification matrix

**Automated:** `npx tsc --noEmit && npm run test && npm run build` on the pinned preview SHA; all prior world/physics tests must remain green. A build passing does not establish browser GLB visibility, frame-time improvement or shadow correctness.

**Desktop test, same URL host and app SHA:**

1. Use `/game?fl4Diagnostics=1` for baseline full imported cars with normal shadows; wait until both model classes visibly appear. Capture the same camera position and time with **Save FL-4 data**. Confirm `importedVehicles.pipeline.stage=settled`, nine imported slot statuses and the mode telemetry `full`.
2. Repeat with `&fl4VehicleOptimization=selectiveShadows`. Quantify **shadowCasterCount**, draw calls, active indices, p50/p95 frame/render times, and screenshot of the vehicle-to-road shadow contact. If missing or malformed shadow dominates quality, do not adopt.
3. Repeat with `&fl4VehicleOptimization=distanceLOD`. Record diagnostics when near an imported car (fullDetailSlots), then far enough away (distantProxySlots); quantify measured mesh/indices and look for silhouette pop and incorrect far vehicle placement. Confirm close-up accepted cars retain exact approved body/cabin/wheel detail.
4. Repeat with `&fl4VehicleOptimization=combined` only after separately reviewing the independent variants. Test with shadows disabled `&fl4Probe=noShadows` where useful to isolate camera-pass distance LOD cost from shadow work.
5. Replicate controls on representative landscape mobile/PWA and night scene if desktop result is useful. Include time-in-scene, viewport, hardware scale and warm/cold GLB load state. Never compare a full-loaded scene against a still-loading placeholder state.

**Hard exclusions:** no source GLB redistributed into Git, no color/geometry reauthoring, no accepted size modification, no new car spawns, no changes to Rapier collision dimensions, no default shadow removal, no production deployment, and no automatic main merge.

## Decision gates

- Selective shadow policy may advance only if **shadow image quality passes** from close and far cameras and measured renderer statistics improve at matched scene conditions.
- Distance LOD may advance only if **popping/far-fidelity is acceptable**, return-to-full occurs reliably well before gameplay interaction, and measured scene cost falls where detailed imports were replaced.
- The accepted full imported development vehicles remain the default until a subsequent explicit user acceptance authorizes an optimized behavior. If a mode is inferior, leave it diagnostic-only and record why. If network loading dominates, address delivery/decoding in a separate experiment.
- FL4-04 remains OPEN until measurable improvement with preserved approved art and actual user-device evidence; FL-4 as a whole also still requires mobile sharpness, full-world gameplay, physics and final user approval.

## Background technical basis

Babylon's documentation distinguishes GPU instancing from ordinary scene meshes (see [Babylon.js Instances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances)); Babylon maintainers document that `ShadowGenerator.addShadowCaster` populates the shadow render list, so reducing eligible detailed meshes is a targeted way to isolate those extra rendering passes (see [Shadow Generator discussion](https://forum.babylonjs.com/t/problem-with-shadowgenerator/12709) and [GLTF shadow descendants](https://forum.babylonjs.com/t/shadows-from-gltf-models/8847)). These sources support **the mechanism**, not a claim that the current GTD experiment has already achieved particular FPS savings.

## Verified nonproduction preview — ready for in-world evidence

**Pinned game-code SHA:** `bb06dad14a9d3efd8cc6a0119ff540070acef75a`, on `optimization/fl4-vehicle-shadow-lod`.  
**Pinned deployment:** Vercel `dpl_6e628qkAXrSnruHcNDSSSRwybmnF`, **READY**, host `https://gtd-j8uiuoj8g-interlinkglobaltech.vercel.app`.  
**Verification:** strict `npx tsc --noEmit` passed; **84/84 Vitest tests across 18 files passed**; Vite client, SSR and Nitro build completed. Prior first build `dpl_GtRPBd9jwc1iHRLoXJRrhYWkVP1h` was also READY but is **superseded for comparisons** by the pinned baseline-preserving build `bb06dad`. Do not combine screenshots or performance exports between the two builds.

**Same-commit diagnostic URLs** (all show high-quality source GLBs near the player; allow both models to visibly finish loading before captures):

- Current accepted **full** control with ordinary shadows: `https://gtd-j8uiuoj8g-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1`
- Selective vehicle shadow casters only: `https://gtd-j8uiuoj8g-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1&fl4VehicleOptimization=selectiveShadows`
- Distant six-mesh procedural-vehicle visual LOD only: `https://gtd-j8uiuoj8g-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1&fl4VehicleOptimization=distanceLOD`
- Both controls together: `https://gtd-j8uiuoj8g-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1&fl4VehicleOptimization=combined`

**First recommended A/B:** full vs `selectiveShadows` with *normal* shadows enabled. Match same street, view, Meridian daytime and warm scene. Capture screenshots including roadway contact shadows and export JSON `Save FL-4 data` in each mode. Confirm `importedVehicles.optimization.mode`, `selectedVehicleShadowCasters`, `originalImportedSubmeshes`, `fullDetailSlots` and `distantProxySlots` plus `pipeline.stage=settled` and each slot's `status=imported`. Do not declare success if models only report loaded but remain visually absent. The second A/B (full vs `distanceLOD`) should include a near and far test to check proxy switching. The `combined` mode is exploratory only until isolated contributions and artistic side effects are known.

**Important distinction from prior reports:** This deployment proves source and automated-test compatibility; **no desktop/mobile screenshot or FL-4 metrics JSON for these optimization modes has yet been captured**. In particular, reduced casters / distant proxies are hypotheses, not measured improved FPS or accepted final rendering. No changes to the approved `development/meridian-fl4-optimization` branch, production `main`, accepted model source files or vehicle dimensions were made by the feature branch.

## First same-build user evidence: selectiveShadows vs full (2026-10-10, UTC 18:04–18:05)

**Status: SOURCE-REPORTED SUBSTANTIAL SHADOW-PASS WORK REDUCTION — FRAME-TIME ACCEPTANCE AND VISUAL QA NOT YET ESTABLISHED.** This section supersedes the earlier statement that no optimization data had been captured. The user provided two source-generated `gtd.fl4.evidence.v1` JSON exports from the same pinned app `bb06dad14a9d3efd8cc6a0119ff540070acef75a` at `gtd-j8uiuoj8g-interlinkglobaltech.vercel.app`:
- `gtd-fl4-imports-2026-10-10T18-04-53-082Z.json`: `?fl4Diagnostics=1&fl4VehicleOptimization=selectiveShadows`.
- `gtd-fl4-imports-2026-10-10T18-05-49-684Z.json`: `?fl4Diagnostics=1` (full original imported-shadow baseline).

These files were supplied in conversation and are **not embedded in this repository**. Both exports identify Windows x64, Chrome 155, 1366×633 CSS/backing/render pixels, DPR 1, scaling 1, native pixel coverage 100%, shadow-map size 2048; `importedVehicles.pipeline.stage=settled`; both asset sources `loaded`; all **nine** existing slots `status=imported`, `colliderCalibrated=true`, `fullDetailSlots=9`, `distantProxySlots=0`. This establishes code-path and telemetry consistency; **no accompanying screenshot for this A/B pair** verifies GLB visibility or shadow/contact fidelity. The prior user reported invisible vehicles in an earlier `full` session despite `imported` statuses; do not repeat that mistake.

### Static and per-frame diagnostic comparison

| Metric | Full shadows | Selective vehicle shadows | Observed reduction |
|---|---:|---:|---:|
| Selected vehicle shadow-casting geometric submeshes | 509 | **36** | **92.9%** |
| Registered shadow casters, entire scene | 834 | **352** | **57.8%** |
| Original geometric submeshes in all imported assets | 509 | **509** | none |
| Total scene meshes | 1103 | **1103** | none |
| Scene materials / textures | 127 / 58 | **127 / 58** | none |
| Median draw calls | 932 | **465** | **50.1%** |
| Median active indices | 8,112,825 | **3,713,475** | **54.2%** |
| Median active meshes | 241 | **170** | **29.5%** |
| Recent frame sample count | **41** | **1800** | **not comparable** |
| Frame p50 / p95 | 583.1 / 9549.8 ms | **66.8 / 83.6 ms** | indicative only |
| Render p50 / p95 | 502.9 / 3585.5 ms | **62.6 / 70.4 ms** | indicative only |
| Approximate FPS from median frame | 1.71 | **14.97** | indicative only, NOT an attributable fixed speedup |

The **482 fewer registered casters** align with the vehicle policy selecting 36 rather than 518 imported registered mesh entries: full scene shadow list 834 = 316 baseline context casters + 518 vehicle entries; selective 352 = 316 + 36. Its `originalImportedSubmeshes=509` counts geometric submeshes only and is not equal to the former 518 total imported registrations; parent nodes and recursive registration explain why the counts must not be conflated. Main-camera geometry **was not decimated**; the submitted draw-call/index declines indicate that shadow participation was a major part of the previous render work. Draw calls and active indices are counters across the sampled frame/render state, not unique triangle budgets or verified GPU time.

### Critical confounder: severe full-session stalls and asymmetric sample windows

The `full` report has **only 41 recent frames**, a **58,331 ms** glTF-loader initialization and a **335,415.7 ms** sports model source load, compared with the selective report's **1800 frames**, **3414 ms** loader initialization and **41,757.7 ms** sports load. Off-road loads were 6267 vs 10009.3 ms. Total pipeline elapsed at capture was ~479.4s (full) vs ~418.3s (selective), which is pipeline age, **not cumulative download duration**.

Consequently, do **not** state that selective shadows make GTD exactly 8.7x faster, cure all stalls, or cause quicker GLB source downloads. The two runs have demonstrably different loader behavior, sample counts, cache/network/browser timing and potentially player position/visibility. Median shadow/render counters supply a strong engineering optimization signal, but full-mode `frameMsP95=9549.8ms` is not a steady-state benchmark with 41 frames. The selective trial still reports 66.8ms p50 frame (~15 median-derived FPS), so it does **not** yet satisfy a smooth action-game performance objective.

### Decision and next tests

**Provisional decision:** selective vehicle shadow participation passes the **mechanism/counter-reduction gate** for FL4-04. It does **NOT** pass final visual shadow fidelity, responsive gameplay, platform-wide stability, or production promotion.

1. **Visual gate:** obtain side-by-side same-position screenshots from these same-commit `full` and `selectiveShadows` routes, with both GLB vehicle classes clearly visible, shadows enabled, same time-of-day and sunlight angle; inspect silhouette, tires, wheel-to-ground contact, buggy roll cage and proximity to other geometry. A caster-ranking heuristic may omit indispensable narrow but tall components, so visual QA is necessary.
2. **Repeat sample gate:** capture `full` after both models visibly appear and gameplay has stabilized, allowing the diagnostics ring to record at least ~1000 or ideally 1800 recent frames. Repeat selective in the same camera position/route with comparable sample counts; if full mode remains too slow to collect them, record a reproducible blocker rather than fabricate an equal-sample benchmark.
3. **Independent geometry gate:** next run `distanceLOD` at far and near viewpoints using `importedVehicles.optimization.fullDetailSlots` and `distantProxySlots` to validate transitions. Do not add results from combined mode until single-variable visual QA passes.
4. **Loading gate:** compare browser Network/Performance logs for the large sports-model loading variance independently from shadow-pass cost. `loadMs` source fields are duplicated per slot, not separate network requests.
5. **Rendering gate:** if selective shadows retain acceptable imagery and the follow-up controlled delta persists, consider staged improvement of cast-shadow representation and asset LOD with no changes to accepted calibration or collisions; future modified behavior still requires user approval.

**Release gate:** `optimization/fl4-vehicle-shadow-lod` remains isolated; no merge to `development/meridian-fl4-optimization` or `main`, no default behavior change, no commercial rights assertion. FL4-04 experiment remains **IN PROGRESS**, FL-4 remains **IN PROGRESS**.
