# FL-4 — Shadow isolation: imported cars visibly loaded (user capture 2026-10-10)

**Status:** USER-VISUAL CONFIRMATION + LOCAL FL-4 JSON CAPTURE; shadow cost is a substantial **candidate**, not yet an isolated cause. FL-4 remains IN PROGRESS.  
**Pinned game source SHA:** `1337738768dab29eb36f8f17c6bb2b762eb57023`  
**Vercel preview:** `dpl_7A5Ba1nibdyFfd7cGc2XJMjLkm8p` — `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app`.  
**Exact route:** `/game?fl4Diagnostics=1&fl4Probe=noShadows` (game-source code sets `scene.shadowsEnabled=false` for this probe; asset models, source URLs, world, colliders and accepted class scales unchanged).  
**Primary evidence:** user screenshots, one before sports car completion and one after, supplied in conversation; local diagnostic JSON `gtd-fl4-imports-2026-10-10T16-53-35-707Z.json`. Raw conversation JSON and screenshots are not represented as stored Git repository attachments by this markdown record.  
**Authority:** `documentations/FL-4 Technical Implementation Plan.md` and accepted development-vehicle record.

## Correction to prior evidence interpretation — loading is not visibly rendered

The user explicitly reports that **the accepted imported cars were not seen rendering during the preceding shadow-enabled exercise, and still had not rendered when the user revisited that exercise**. Although its earlier diagnostic JSON reported `pipeline.stage=settled`, two `loaded` model sources and nine `imported` slots, **do not describe the previous exercise as visually confirmed**. A source status of `loaded` indicates loader completion, and `slot.status=imported` indicates that the code instantiated a vehicle and switched off the proxy; those fields are NOT proof that the appropriate triangles were visibly rasterized in the observed user viewport.

This observation creates a real discrepancy to investigate between source/slot lifecycle and on-screen appearance in the prior shadow-enabled session. Do not overwrite or discard its metrics; categorize the prior evidence as **telemetry-reported imports with visibility not verified (user reports absent)**. The captured shadow-disabled screenshots, by contrast, establish **direct user-observed visible examples of both asset classes**. No conclusion that shaders, shadows or network alone caused the discrepancy is justified yet. It may be partly location, timing or rendering state; verify before choosing a fix.

## 1. Current noShadows field observation

User screenshot 1: buggy visibly present on Meridian street; sports car not yet visibly present.  
User screenshot 2: off-road buggy and Ferrari sports car both visibly present; user says buggy loaded first, sports car later.  
JSON report: `pipeline.stage="settled"`; all nine known parked slots are `status="imported"` and `colliderCalibrated=true`. Five are buggy, four are sports. Both source asset records are `status="loaded"`, `stage="complete"`, `error=null`.

| Capture field | Measured noShadows outcome |
|---|---:|
| Captured UTC | 2026-10-10T16:53:35.707Z |
| Device/browser | Windows x64 / Chrome 155 |
| CSS canvas, backing and render dimensions | 1366 × 633 |
| DPR / hardware scaling / native coverage | 1 / 1 / 100% |
| Recorded recent frames | 560 |
| Frame p50 / p95 | **53.4 / 433.0 ms** |
| Render p50 / p95 | **42.5 / 237.1 ms** |
| Median-derived approximate FPS | **18.73** (not session-average FPS) |
| Median draw calls | **221** |
| Median active meshes | **224** |
| Median active indices | **1,935,591** |
| Total scene meshes | 1,103 |
| Materials / textures | 127 / 58 |
| Registered shadow casters | 834 |
| Shadow map size setting | 2,048 px |
| GLB loader initialization | **2,924 ms** |
| Off-road source load time | **8,878.3 ms** |
| Sports source load time | **25,920.1 ms** |
| Pipeline elapsed at report time | **100,699 ms** since start, not total load-to-completion time |

The `shadowCasterCount=834` describes **registered casters**, not active shadow rendering. The scene can have 834 registered nodes and still have shadow passes **disabled** by `scene.shadowsEnabled=false`. Thus do not read that count as proof shadows ran during this probe. Actual rendered triangles/draw calls are view/visibility-dependent. `frameMsP95=433` and `renderMsP95=237.1` still reflect unacceptable extreme intermittent stalls for a credible desktop real-time action game; disabling shadows alone has NOT completed FL-4 optimization.

**Imported fitted world extents from this successful capture:**
- Off-road (5 slots): width **2.4623m**, height **2.7325m**, length **4.05m**; accepted width multiplier 1.10 and height multiplier 1.00. Model warning: unusually tall vehicle proportions.
- Sports (4 slots): width **2.3681m**, height **1.3584m**, length **4.53m**; accepted width multiplier 1.05 and height multiplier 1.10. No size warning.
No collider acceptance is inferred from `colliderCalibrated=true` without physical player-vehicle walk/impact testing.

## 2. Earlier shadow-enabled import report — descriptive reference, not validated visually

The preceding same-preview import-enabled report `gtd-fl4-imports-2026-10-10T16-14-17-588Z.json` indicated two model sources `loaded` and nine slots `imported` but the user says vehicles were **not visibly rendered** in that exercise. Consequently it cannot establish the same set of visible imported objects under shadows as in the current screenshots. Its diagnostics still offer a *strong shadow-overhead lead* but should not be treated as a strictly matched causal experiment:

| Diagnostic | Earlier shadows enabled (not visually confirmed) | Current noShadows (user visible) |
|---|---:|---:|
| Recorded samples | 1,068 | 560 |
| Frame p50 / p95 ms | 100.0 / 733.0 | 53.4 / 433.0 |
| Render p50 / p95 ms | 83.3 / 657.6 | 42.5 / 237.1 |
| Median derived FPS | 10.00 | 18.73 |
| Median draw calls | 990 | 221 |
| Median active indices | 8,411,016 | 1,935,591 |
| Total mesh count | 1,103 | 1,103 |
| Registered shadow casters | 834 | 834 |

The noShadows capture reports **769 fewer median draw calls (-77.7%)**, **6,475,425 fewer median active indices (-77.0%)**, **40.8 ms shorter p50 render duration (-49.0%)**, and **46.6 ms shorter p50 frame duration (-46.6%)** versus that earlier capture. These deltas are **descriptive**, not a controlled estimate of shadow-only cost: user-confirmed visibility differs, camera/state/history differ, reported frame-sample counts differ, and the scene may have spent part of prior sample histories loading/compiling shader programs. The near-identical total mesh and registered caster counts are consistent with disabling shadow *work* instead of deleting geometry, but other scene state must still be isolated.

**Important:** A high active-index value here may reflect rendering-pass activity or view-dependent statistics rather than unique downloaded asset triangles; these frame counters are NOT an authoritative mesh-polygon budget per GLB.

## 3. Immediate next evidence, no new asset code

1. **Same-build procedural shadow-off control:** `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1&fl4Probe=noShadows` — use similar daylight, route and viewpoint as current capture, allow warm-up and then save JSON. This estimates total-scene shadow savings **without** GLBs.
2. **Shadow-enabled imported visibility verification:** `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1` — after enough time, capture both the **model status** and an actual on-screen vehicle screenshot in the same session. If reports say `imported` but none can be seen at known parking positions, record a mismatch instead of repeatedly classifying a model as visually rendered. No arbitrary waiting period is proof of visibility.
3. **Paired A/B interpretation:** compare baseline `shadows ON vs OFF`, and imports `shadows ON vs OFF`, with actual visibility, same location/view and comparable stable sample windows, to isolate a defensible shadow contribution. Until then, mark hypothesis *shadow rendering dominates* as **strong preliminary lead**.
4. Follow up on the remaining **433ms p95** stalls, 1.94M median active indices, repeated source downloads/parse and usability, regardless of shadow findings; user-approved GLB appearance and scaling remain protected.
5. A true automated visual health gate should record whether the inserted imported meshes are enabled, visible in the camera frustum, and submitted for the main render pass. `imported` alone is insufficient. Propose a separate diagnostics change only if needed; do not alter vehicle art/geometry without authorization.

## 4. Release and milestone status

This diagnostic experiment does **not** authorize shadows removed from GTD's default renderer; in-world realistic street/night light and shadows remain core FL-4 quality requirements. It also does not authorize dropping high-quality vehicles, rolling back accepted size, copying rights-uncleared GLBs to commercial production, or promoting `main`. **FL-4 remains IN PROGRESS**, with desktop/matched shadows, graphics cost, import reliability, collision, landscape mobile, and final acceptance gates unresolved.
