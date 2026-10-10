# FL-4 Desktop A/B Evidence — Imported Vehicles Not Activated (2026-10-10)

**Status:** CAPTURED — VALID DIAGNOSTIC EXPORTS; IMPORTED-ASSET PERFORMANCE COMPARISON INVALID / BLOCKED.  
**Source build:** `f2ae42d0432ea5940dc08d11f480ded4820679e8`, nonproduction Vercel `dpl_6mqv7tNCxE8W1an56VNY9McyciUh` (`gtd-qxgrlbdqm-interlinkglobaltech.vercel.app`).  
**Authority:** FL4-01 baseline, FL4-04 cost attribution, FL4-05 regression; `documentations/FL-4 Technical Implementation Plan.md`; imported-asset development adoption record.  
**Primary evidence:** User-supplied browser screenshots (2026-10-10 17:56 and 17:59 SAST displayed clock) and original diagnostic JSON exports `gtd-fl4-baseline-2026-10-10T15-57-13-924Z.json` and `gtd-fl4-imports-2026-10-10T15-59-50-125Z.json`. This markdown records analyzed values only; the source JSON remains a conversation attachment and is NOT represented as a file inside this Git repository.

## Measured environment (both reports)
Windows NT 10 x64; Chrome 155; viewport/CSS canvas/backing/render buffer each **1366 × 633** at DPR **1**, hardware scaling **1**. Actual rendered pixels 864,678, expected native 864,678 (**100% native pixel coverage** for this desktop case). Babylon scene: 585 total meshes, 81 materials, 57 textures, 316 shadow casters, 2048 shadow map.

## Results

| Report variable | Baseline/procedural mode | Imported-development mode (requested, NOT activated) |
|---|---:|---:|
| Route | `?gtdVehicleProbe=baseline&fl4Diagnostics=1` | `?fl4Diagnostics=1` |
| Captured timestamp (UTC) | 15:57:13.924 | 15:59:50.125 |
| Frame samples | 1,800 | 1,030 |
| Frame p50 / p95 (ms) | 49.8 / 82.9 | 49.6 / 83.4 |
| Render-call p50 / p95 (ms) | 32.5 / 58.4 | 31.5 / 62.8 |
| FPS from median frame (not true run-average) | 20.08 | 20.16 |
| Draw calls median | 548 | 548 |
| Active meshes median | 232 | 232 |
| Active indices median | 181,494 | 181,494 |
| Boot-to-ready (ms) | 4024.1 | 1924.1 |
| First-frame measurement (ms) | 433.4 | 233.6 |
| Imported-vehicle report | `null` by control design | `running` |
| Imported source status | Not applicable | BOTH `loading` with `loadMs: null, error: null` |
| Imported parked car status | Not applicable | ALL **9** slots `loading`; no fitted bounds or collider replacements |

**Direct field observation:** Both screenshots depict the original generated car proxies; the import-default screenshot does not show the accepted buggy/sports models. The evidence capture button successfully saved separate local JSON reports. The import route selector worked (`vehicleMode=imports` and a populated importer report), but neither source advanced to `loaded` nor to `failed` before the JSON snapshot.

**Engineering interpretation:** The identical active geometry counts are consistent with the same procedural models still rendering. This comparison does **not** quantify imported geometry overhead, GLB instancing, saved GPU time, regression/performance parity, or proper vehicle collider fit. The approximately 20 median-based FPS in the procedural scene warrants profiling on a controlled device, but two runs with different sample sizes, paths/camera histories and warm/cold cache cannot attribute any changes to imported assets. A perceived unchanged frame rate is not proof of zero cost. Boot-to-ready measurements also do not measure successful completion of asynchronous vehicle imports; import loading runs after world ready.

## Source inspection and unresolved cause

`src/game/core/gtd-runtime.ts` selects imported vehicles on this nonproduction hostname unless `gtdVehicleProbe=baseline`; its activation is verified indirectly because an `ImportedCarProbeReport` exists. The importer `src/game/experiments/imported-car-evaluation.ts` initializes the glTF loader via `await import("@babylonjs/loaders/glTF")` **before** either remote asset's `loadAssetContainerAsync` begins. Source `status=loading` covers both that module initialization wait and remote model download/decode. Neither source has a timeout or detailed phase in the current report. The stage could therefore be loader initialization, remote request, or decoding; the provided JSON contains no network-response status, Resource Timing or console trace. Neither license status nor Babylon model format validity can be determined from this stalled event. Previously, isolated previews demonstrated both assets loaded into Meridian successfully; do not revoke visual acceptance from this incomplete load.

**Do not assume** CORS, failed URLs, private repositories, a Vercel bug or Babylon incompatibility without a browser Network/Console trace or additional lifecycle instrumentation. Both immutable GLB source URLs are unchanged from the accepted experimental previews.

## Follow-on

1. Add **development diagnostics only** to distinguish waiting-for-glTF-loader, asset retrieval/parse, per-slot instantiation, terminal import and failure, including elapsed wait duration. Do not change accepted vehicle proportions or renderer ownership.
2. Reproduce with the same pinned candidate, hold the capture until model settles or the diagnostic stage remains demonstrably stuck; export `gtd.fl4.evidence.v1` twice when useful. On desktop use browser Network/Console if accessible.
3. When imports **actually finish** and every source/slot has a terminal state, repeat matched same-device A/B; only then compare genuine imported cost.
4. Independently profile base-scene shadow/draw-call cost and investigate mobile DPR/softness under GTD-VIS-002. The desktop report at DPR 1 does not close a mobile sharpness issue.

**Release status:** Technical-development acceptance of the two example vehicles remains in force; the *current preview's import availability* is BLOCKED. FL-4 remains IN PROGRESS. Main/production must not change automatically.

## Follow-on diagnostic implementation and verification

**Follow-on source code SHA:** `1337738768dab29eb36f8f17c6bb2b762eb57023`. **Vercel nonproduction:** `dpl_7A5Ba1nibdyFfd7cGc2XJMjLkm8p`, **READY**, `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app`. Strict TypeScript, **17 Vitest files / 81 passing tests**, and full application build **PASSED**.

`src/game/experiments/imported-car-evaluation.ts` now records:
- `importedVehicles.pipeline.stage`: `initializing-gltf-loader`, `loading-models`, `settled` or `failed`.
- `importedVehicles.pipeline.elapsedMs` and `loaderInitializationMs`.
- For each source `assetSources[].stage`: `awaiting-loader`, `loading-model`, `instantiating`, `complete` or `failed`, plus ongoing `pendingMs` when still loading, source status and loader error.
- These fields are included in the existing opt-in **Save FL-4 data** JSON; they do **not** change GLB URLs, dimensions, source licenses, physics, fallback, collision, scene visuals or default resolution. If import never leaves `initializing-gltf-loader`, the bottleneck is **before remote GLB loading**. If it moves to `loading-models` and sources remain in `loading-model`, the bottleneck is somewhere **within GLB load / download / parsing**, and browser Network/Console evidence remains necessary to distinguish those sub-stages.

**Follow-up link:** `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1`. After allowing a normal gameplay interval, click **Save FL-4 data** and inspect the resulting `importedVehicles.pipeline` and `importedVehicles.assetSources[]`. If the same procedure yields terminal loaded cars, then collect matched same-build procedural baseline at `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`. If still pending, upload the JSON to isolate the stage; do **not** claim import vs proxy performance parity. The new field-test outcome itself remains PENDING.

**FL-4 decision remains OPEN:** no proven imported-asset runtime cost yet, despite successful diagnostics export and passing automated tests. User visual development acceptance of the buggy/sports car from earlier successful previews remains valid, and no renewed car scale work is authorized by this issue.
