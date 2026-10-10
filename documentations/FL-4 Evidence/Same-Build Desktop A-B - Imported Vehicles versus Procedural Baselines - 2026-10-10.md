# FL-4 — Same-Build Desktop A/B: Imported Vehicles vs Procedural Baselines

**Date:** 2026-10-10 (user captures 16:14, 16:32, 16:43 UTC).  
**Status:** Measured developmental performance regression; source-level cost contributors identified; shadow/geometry attribution still unisolated. **FL-4 remains IN PROGRESS.**
**Pinned application:** `1337738768dab29eb36f8f17c6bb2b762eb57023`, Vercel READY `dpl_7A5Ba1nibdyFfd7cGc2XJMjLkm8p`, `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app`.
**Primary source records:** Conversation uploads `gtd-fl4-imports-2026-10-10T16-14-17-588Z.json`, `gtd-fl4-baseline-2026-10-10T16-32-59-134Z.json`, `gtd-fl4-baseline-2026-10-10T16-43-54-248Z.json`. These raw user files were inspected but are **not** themselves added to the Git repository. Earlier evidence: `Imported Vehicle Desktop Successful Load and Render Cost - 2026-10-10.md`.

## 1. Test validity and controls

All three exports identify **the same immutable preview host**, Windows x64 Chrome 155, DPR 1, viewport/canvas/backing/render width 1366×633, hardware scaling 1, 864,678 rendered pixels / 100% native coverage, and a 2,048px shadow-map width. Both newer files explicitly selected `?gtdVehicleProbe=baseline&fl4Diagnostics=1` and have `importedVehicles=null`; the earlier imported report from the same build selected the developmental default `?fl4Diagnostics=1` and confirms `pipeline=settled`, 2 loaded model sources, 9 imported parked slots and calibrated colliders.

**This is SAME-BUILD baseline versus imported, not necessarily frame-for-frame camera-locked/fully steady-state A/B.** Sample counts differ and actual movement/view histories are unavailable. The first two baselines also have noticeably different frame timings despite nearly constant draw calls and indices. FPS is `1000 / frameMsP50` (median-derived approximate FPS), not a full-run mean; p95 is an empirical percentile of the recent frame-sample ring.

## 2. Source-reported measurements

| Report | Procedural control A | Procedural control B | Loaded imported vehicles |
|---|---:|---:|---:|
| Capture time UTC | 16:32:59 | 16:43:54 | 16:14:17 |
| Recorded frames | 1,045 | 1,800 | 1,068 |
| Frame median / p95 (ms) | 49.8 / 83.4 | 33.3 / 50.3 | **100.0 / 733.0** |
| Render median / p95 (ms) | 27.3 / 60.1 | 26.7 / 36.3 | **83.3 / 657.6** |
| Median-derived approximate FPS | 20.08 | 30.03 | **10.00** |
| Median draw calls | 386 | 376 | **990** |
| Median active mesh count | 70 | 60 | **236** |
| Median active indices | 160,062 | 165,834 | **8,411,016** |
| Total scene meshes | 585 | 585 | **1,103** |
| Scene materials / textures | 81 / 57 | 81 / 57 | **127 / 58** |
| Registered shadow casters | 316 | 316 | **834** |
| Rendered native pixel coverage | 100% | 100% | 100% |
| GPU frame timer / GPU memory | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE |

**Ratios against the two valid same-build procedural baselines:**

- Median **frame time 2.01–3.00×** as long; median-derived FPS **10 versus 20.08–30.03**.
- Median scene-render wall time **3.05–3.12×** as long.
- p95 frame time **8.79–14.57×** as long; high intermittent spikes demand load-/shader-/shadow-timing isolation.
- Median draw calls **2.56–2.63×** as many (+604–614 calls).
- Median active indices **50.72–52.55×** as many (+8.245–8.251 million indices).
- Registered scene meshes +518; shadow casters +518; materials +46; textures +1. The **exact same +518** in scene mesh and shadow-list counts is notable, but does not prove that all 518 are visible casters every frame, nor does it assign a causal millisecond cost to shadow passes.

The two procedural baselines themselves vary significantly in p50 frame time (49.8 vs 33.3ms) and p95 render time (60.1 vs 36.3ms) despite almost fixed geometry load. Thus avoid presenting a singular guaranteed FPS regression percentage or a controlled equal-camera microbenchmark. Nonetheless the large cost differentials across both baselines are sufficient to prioritize FL4-04 profiling.

## 3. Source-level leads, not conclusions

- `src/game/experiments/imported-car-evaluation.ts` instantiates nine imported GLB specimens across two source templates and calls `world.environment.addShadowCaster(mesh)` for every imported visual mesh; `src/game/world/generated-first-light-world.ts` registers baseline environment and procedural street casters. This is a credible additional shadow-work lead; **not yet an isolated measured cause**.
- The GLB geometries are considerably more complex than procedural proxies: median active index count jumped by about 8.25 million. This is **measured scene index throughput**, not asset GPU allocation in bytes nor proof that every triangle is drawn in every camera or every shadow pass.
- Loading was successful but slow: glTF-loader initialization 3.082s; buggy model source 17.824s, sports-car source 101.445s. The report's source-level `loadMs` is duplicated across matching parked slots and should **not** be summed nine times. The render p95 capture may contain shader compilation or other warmup spikes, but no per-frame correlated trace was submitted.
- Browser GPU timing, GPU memory, thermal and decoded asset memory are not instrumented. Diagnose those before asserting exact CPU vs GPU causation.

## 4. Authorized diagnostics available right now (no source change)

The **same** pinned Vercel preview supports `?fl4Diagnostics=1&fl4Probe=noShadows` (verified in `src/game/core/gtd-runtime.ts`, setting `scene.shadowsEnabled=false`). This disables **all scene shadow rendering** for a test only; it is not a proposed art change or license workaround.

Run:

1. **Imports + shadows OFF:** `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1&fl4Probe=noShadows`. Wait for actual imported vehicles and `importedVehicles.pipeline.stage=settled`; then choose **Save FL-4 data** after matched exploration. If the old proxies remain, the run is invalid for imported rendering attribution.
2. **Procedural control + shadows OFF (recommended next):** `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1&fl4Probe=noShadows`; measure identical route/device conditions. Same controls with shadows enabled are already captured.
3. Compare frame/render p50/p95, draw calls and active indices within the same build. Compare the shadow-off delta for imported scene vs the shadow-off delta for procedural baseline; this does not isolate **vehicle shadows exclusively**, but provides an upper bound on total scene shadow cost. Note `scene.shadowCasterCount` reports registered caster list length and **can remain 834 even while `scene.shadowsEnabled=false`**.
4. If shadow-off still performs poorly, next narrow patch proposal should focus on source geometry LOD, asset decimation *with unchanged accepted outward look*, cached instantiation, and distance-based mesh management; otherwise prioritize shadow caster policies and shadow-pass batching. Neither approach is authorized for implementation merely by this report.

## 5. Decision status

**Accepted art is locked:** buggy 4.05m length, 1.10 width multiplier; sports car 4.53m length, 1.05 width and 1.10 height multipliers. No silent down-scaling, GLB removal, or reintroduction of procedural cars as permanent development default. Development-only rights constraints remain unchanged, and `main`/production untouched.

**PASS:** imported vehicles can render all nine existing slots with calibrated Rapier cuboids; same-build procedural controls save diagnostic JSON.  
**BLOCKED:** high render time, extreme tail stalls, ~101-second sports GLB delivery, mobile/PWA baselines, detailed isolation of material/shadow/geometry cost, end-to-end physical gameplay acceptance.  
**FL-4 acceptance:** NOT COMPLETE; collect same-build shadow-off evidence before setting priorities for the first performance optimization patch.
