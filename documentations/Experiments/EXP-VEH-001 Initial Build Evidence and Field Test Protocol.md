# EXP-VEH-001 — Initial Build Evidence and Field Test Protocol

**Status:** COMPILED + PREVIEW READY. IN-WORLD IMPORT/PHYSICS/QUALITY/PERFORMANCE STILL AWAIT ACTUAL BROWSER EVIDENCE.  
**Date:** 2026-10-10  
**Source code SHA:** `63a22935eda3cd6fa99d48dd61b261dc157207b6` on `experiment/meridian-imported-car-probe`  
**Vercel preview deployment:** `dpl_AKgZ7kPtpnMg9WWrzMNQSdCmXiHB`, **READY**, `https://gtd-3jewfbyct-interlinkglobaltech.vercel.app`  
**Initial failed validation:** deployment `dpl_3zzxSqFtQsGFn9qeQ1UyK84zbesU`, source `4c24a085dba07b1d11c3adcfc1c33afbb1986af4`, failed TypeScript read-only telemetry type errors; corrected in `63a22935eda3cd6fa99d48dd61b261dc157207b6`.  
**Governing specification:** [Meridian Imported GLB Vehicle Evaluation — Technical Plan](./Meridian%20Imported%20GLB%20Vehicle%20Evaluation%20-%20Technical%20Plan.md).

## 1. Exact preview comparison controls

**Original cars (same-build control):**

`https://gtd-3jewfbyct-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`

**Imported GLB specimens (experimental change only):**

`https://gtd-3jewfbyct-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=imports&fl4Diagnostics=1`

Both URLs refer to the exact same deployed source SHA, First Light city, original car IDs/positions, road geometry, garage, building system, tree renderer, day/night lighting, camera and Rapier physics. Only imported-vehicle visual loading is enabled in the second URL. Vehicle count is unchanged. This is a comparison test, not increased traffic or a production art decision.

**Browser inspection:** In DevTools console, after in-world load stabilizes:

- `window.__GTD_VEHICLE_PROBE_REPORT__?.()` reports per-vehicle `loading | imported | fallback`, source, load duration, inferred source bounds, aspect-preserving fit factor and errors. This function only exists on imported experiment URL.
- `window.__GTD_FL4_REPORT__?.()` reports rendering conditions, active frame samples, p50/p95 render and frame times, draw-call estimate, active meshes and indices, shadow/material/texture scene statistics and known unsupported measurements. This function requires `fl4Diagnostics=1`.
- Record reports at minimum after a 30-second visual stabilization, then at least two minutes of matched exploration in each mode. Reload to reset samples; note cold/warm GLB cache behavior and any fallback errors.

**Critical:** The preview build tool has **not rendered the scene or executed the browser GLB fetches on a user device**. READY and compiling are not proof that both imported models render or occupy exactly expected spots. The browser report and screenshots are required evidence.

## 2. What was changed and what is protected

| Dimension | Experiment implementation | Disposition |
|---|---|---|
| Renderer | Added `@babylonjs/loaders@9.29.0` matching `@babylonjs/core@9.29.0`, dynamically loads glTF importer on opt-in | Static integration/code verified |
| Source assets | Remotely loads immutable-commit GLBs from `interlinkglobal/Car-Game-ThreeJS` and `interlinkglobal/JS-3D-Car`; no GLB binary copied into GTD | Source references wired; third-party rights unverified |
| Determinism | Assigns two specimens to existing parked-car item IDs in sorted alternating order | Pure planner tests passed |
| Placement | Computes source mesh bounds; uniformly scales to the existing 1.66 × 1.48 × 3.84-m visual envelope within the 1.76 × 1.52 × 4.0-m static collider | Pure fitter tests passed; actual imported model bounds not yet observed |
| Visual replacement | Hides each old body/glass/four-wheel set **only after successful matching imported vehicle creation** | Implemented, browser behavior pending |
| Failure handling | Original proxy remains visible if missing glTF loader, remote CDN fails or imported vehicle bounds are invalid | Implemented, browser failure test pending |
| Physics | No changes to static Rapier collider registrations, car positions/yaw/scale generation, garage collision or player movement | Source-level noninterference; gameplay validation pending |
| Shadows | Registers imported meshes with existing Meridian shadow generator, keeps original world lighting | Code integrated; night/day screenshots pending |
| Lifetime | Caches each source in an AssetContainer, clones into per-car slots with shared materials, disposes clones/source on runtime exit | Code integrated; reload/rapid re-entry stress test pending |
| Backout | Disable experiment via `gtdVehicleProbe=baseline` on same build; production `main` unchanged | Reversible control available |

## 3. Recorded verification results — actual, not inferred

| Gate | Measured outcome | Status |
|---|---|---|
| First source validation | TypeScript compilation failed on read-only asset-telemetry declarations | **FAIL**, corrected before final preview |
| Final strict TypeScript | `npx tsc --noEmit` completed, allowing sequential Vitest and build to run | **PASS** |
| Automated tests | **16 test files, 76 tests passed**, including three `imported-vehicle-experiment.test.ts` assertions | **PASS** |
| Vite/TanStack/Nitro release compilation | `npm run build` successful in Vercel; Vite client ~11.81s, SSR ~1.04s, Nitro environment ~7.51s; overall deployment build reported completed | **PASS** |
| glTF runtime JS payload | Build output includes `glTF-*.js`, **576.96 kB uncompressed / 105.40 kB gzip** | **MEASURED BUNDLE OUTPUT**; not a total transfer-cost or runtime-memory measurement |
| Release pipeline | Vercel `dpl_AKgZ7kPtpnMg9WWrzMNQSdCmXiHB` **READY** at code SHA `63a2293` | **PASS** |
| Browser import success | No verified scene screenshots or `__GTD_VEHICLE_PROBE_REPORT__` yet | **NOT MEASURED** |
| Front/side/rear vehicle quality inside Meridian | No actual matched in-world screenshots yet | **NOT MEASURED** |
| Player-car / curb / garage traversal | Automated existing world-physics regression passed, but imported-cars browser behavior untested | **PARTIAL**, real traversal open |
| Desktop/mobile frame-time, draw-call and memory effect | No paired device reports yet | **NOT MEASURED** |
| Commercial licenses | Source fork public, but original car ownership/reuse permissions unresolved | **NOT VERIFIED — FINAL ADOPTION BLOCKED** |

**Build-cost interpretation:** `105.40 kB gzip` is the standalone glTF module chunk, not the total browser bundle, GLB transfers, decoded geometry, shader memory, texture memory or FPS overhead. The two source GLB files were approximately 6.06 MB and 1.68 MB in their source repositories. Actual HTTP requests, compression/decode time, GPU memory and shadow cost still require the field test.

## 4. Hypothesis ledger and next user review

| Hypothesis | Present evidence |
|---|---|
| H1 — Quality and coherence in Meridian | Unproven; external forked assets rendered in independent viewer, but not yet documented in GTD world |
| H2 — Physics and placement preservation | Existing collider-registration code untouched; source tests pass, but user must verify real contact and visible fit |
| H3 — Measured cost | GLB sizes/build chunk reported; no scene-specific runtime metrics yet |
| H4 — Baseline and fallback | URL controls and per-model fallback wired; runtime failure injection and actual browser proof outstanding |
| H5 — Final civilian sedan suitability | Not tested; specimens are off-road/sports technical examples, not Meridian's everyday fleet sedan |
| H6 — Multi-copy scaling | Only original parked-car count tested; higher population tests deliberately deferred |

**Next observations:** Open both URLs, identify original parked car locations, capture imported vs proxy screenshots at same view and time. Use exported `window.__GTD_FL4_REPORT__?.()` to compare measured p50/p95 and draw calls with samples of at least two minutes; inspect `window.__GTD_VEHICLE_PROBE_REPORT__?.()` and note which specimens actually loaded. Repeat with representative mobile PWA. Record all contradictions rather than retrofitting a hypothesis.

**User acceptance boundary:** This release is a **non-production experiment**, not a vehicle asset selection or a benchmark pass. No final vehicle merge, asset redistribution, new driving feature, copied Ferrari, Spline purchase or production deploy is authorized. Other candidate workflows remain viable, subject to their own evidence.

## 5. Field observation #1 — user browser screenshots and walk-through (2026-10-10)

**Status update:** The user supplied **six screenshots from the READY imported-car preview** showing the cars actually loaded in Meridian City and a qualitative interaction/performance report. These observations supersede the earlier "in-world import unproven" state **for the observed session**, but do **not** constitute a quantitative FPS/graphics-cost result or prove all failure/lifecycle conditions. The screenshots are attached in the conversation, not copied into Git.

**Observed setting:** Desktop Chrome on Windows (as displayed in screenshot browser chrome), route `/game?gtdVehicleProbe=imports&fl4Diagnostics=1`, source preview `dpl_AKgZ7kPtpnMg9WWrzMNQSdCmXiHB` at app SHA `63a2293`. Meridian in-game times span approximately 14:53–16:03 (the timestamps are **in-game clock values**, not capture timestamps). **Exact CPU/GPU, CSS/backbuffer resolution, GPU memory and hardware class remain unrecorded.**

### Direct observations (qualitative evidence)

1. **Actual GLB imports succeed in GTD:** Both the red low sports car and the red high-clearance off-road vehicle are visible on Meridian streets in the supplied captures. Distinct body/roof, windows, wheels, lights and vehicle-specific geometry are recognizable from multiple camera angles. This confirms the **browser-facing rendering pipeline in this observed session**, not license compliance or final adoption.
2. **Initial visual loading transition:** The original procedural parked proxies appear first, then abruptly change to the imported specimens once loading completes. The current importer deliberately keeps proxy meshes visible until success and then disables them. This is a **real observed transition**, acceptable as a temporary fallback but a future loading/presentation issue to measure and resolve if this approach is adopted.
3. **Scale mismatch:** The imported models appear **too small relative to Voight and the street/lane**, reading as toy vehicles despite adequate mesh detail. The mismatch persists in overhead/nearby/front/rear views, so the current sample does not yet give an adequate visual-fidelity-to-performance comparison at intended game-world dimensions.
4. **Interaction/perceived responsiveness:** The user observed **no visible slowdown or gameplay/physics behavior change** during their inspection. This is valuable qualitative feedback, **not a measured zero frame-time cost, proof of contact alignment, nor proof that Rapier physics is unaffected at true-size geometry**.
5. **Environment fit:** Vehicle shapes, material differences and shadowing appear inside the actual Meridian roads/building context. The existing buildings, sky and trees remain present. No comparative screenshots from `gtdVehicleProbe=baseline` under *matched conditions* or saved profiler reports were provided, so cross-mode cost remains unquantified.

### Source diagnosis grounded in actual code (not a measured source dimension)

- `src/game/experiments/vehicle-probe-plan.ts` restricts **every** GLB, irrespective of type, to visual bounds `{ x: 1.66, y: 1.48, z: 3.84 }` using a **single minimum** of (width cap / source width), (height cap / source height), and (length cap / source length). A tall buggy or wide sports model can therefore be uniformly shrunk on the *tightest dimension* and fail to fill other axes. This is a **plausible direct contributor** to the toy-like result, not yet a proven sole cause.
- `src/game/experiments/imported-car-evaluation.ts` also multiplies the normalized root by each pre-existing street item's `item.scale`; bounds and fit scales are not included in the user's screenshots, so the final actual rendered dimensions are **not yet computed**. The current report exposes `fit.originalWidth`, `fit.originalLength`, `fit.originalHeight` and `fit.uniformScale`, but it does not currently expose final world-space X/Y/Z dimensions or visually fitted collider residuals.
- `src/game/world/generated-first-light-world.ts` maintains its former Rapier parked-car box (full nominal width 1.76 m, height 1.52 m, length 4.0 m multiplied by street-item scale), **independent of imported visual geometry**. Upsizing visuals **without a matching deliberate physics test** risks visible/physical mismatch and Voight passing through car surfaces or being stopped in empty space.
- **Do not fix this by independently stretching width, height and length**: that distorts tires, windows, proportions and the vehicle's own geometric evidence. Calibration should be uniform, and the resulting footprint checked against class-appropriate reference dimensions and road width.

### Updated hypothesis ledger

| Hypothesis / gate | Current evidence-based status | Remaining required proof |
|---|---|---|
| H1 — imported vehicle quality & recognizable body | **PARTIAL PASS — verified in Meridian from multiple in-world screenshots** | Intended real-world footprint/Voight scale and matched day/night camera captures; not final sedan style |
| H2 — existing placement and Rapier behavior | **PARTIAL — visually still parked, user reported no obvious physics problems** | Quantified visual bounds and matched Rapier bounds, hands-on collision checks at correct scale |
| H3 — import/rendering performance | **OPEN — qualitative no noticeable slowdown** | Same-build `__GTD_FL4_REPORT__` baseline/imports p50/p95, draw calls, active indices, load cost, cache conditions and device data |
| H4 — fallback and reversible baseline | **PARTIAL — initial old proxies and later successful GLBs visibly confirmed** | Probe status JSON, load failure handling and rapid exit/re-entry; avoid visible placeholder snap on final product |
| H5 — first civilian sedan suitability | **NOT ESTABLISHED** | Both specimens are off-road/sports technical probes, not ordinary GTD sedan candidates |
| H6 — multi-copy performance and quality | **NOT ESTABLISHED** | Class-correct scaling at existing count first, then controlled 1/3/5/10 scenarios after separate test specification |
| Commercial licensing | **UNVERIFIED** | Check source rights and original creator permissions before final use/redistribution |

### Next engineering decision gate — size-corrected repeat, not yet implemented

1. **Capture actual specimen bounds and fitted dimensions** from the browser probe JSON. Extend telemetry to show post-parent-scale world-space width/height/length and collider-versus-rendered extents, rather than guessing from a screenshot.
2. **Define class-appropriate size targets** for the temporary sports/buggy specimens against real vehicles, existing lanes, and Voight. Preserve original mesh aspect ratios through a single uniform scale. **Do not force the off-road vehicle into sedan height** or make the Ferrari a sedan. Identify and reconcile the apparent need for around 1.75–1.85 m civilian sedan width *only when testing a sedan specimen*, not when assigning both temporary reference assets one fictional geometry.
3. **Decouple testing stages:** size-corrected **visual-only A/B** with original colliders marked as intentionally mismatched (no valid physics conclusions), then separate **matched-collider interaction A/B** where the Rapier proxy is recalibrated and validated, if separately authorized. Never claim authentic interactions while visual and physical extents differ.
4. Keep existing parked IDs, positions, yaw and count as much as clearance permits. Record parking/curb/boundary conflicts instead of silently relocating cars to make them fit. Validate model floor height, wheel ground contact and perspective in addition to width and length.
5. Capture **matched browser telemetry** and screenshot viewpoints for baseline/probe at the same hardware scaling and game time, with warm and cold load distinguished. Preserve current report as a historic source-specific benchmark; any later build must have its own SHA and corresponding evidence.
6. **Deferred UX note:** The abrupt proxy→GLB swap is an empirically observed flaw of the loading presentation, not GLB quality. Later assess preloading, holding the car slot empty until resolved, or a controlled reveal; do not conflate the swap with FPS rendering cost.

**Conclusion:** EXP-VEH-001 has produced a reproducible, positive first proof of *GLB rendering and visual recognizability in GTD's actual city*, plus a documented **scale-normalization defect/constraint** that invalidates treating the present sample as the final cost basis. User's "no visible performance change" remains a real qualitative observation; objective performance is still **UNMEASURED**. This is **evidence to continue the same experiment**, not evidence to reject imports or to select them permanently.
