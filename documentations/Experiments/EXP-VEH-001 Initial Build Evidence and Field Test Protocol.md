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
