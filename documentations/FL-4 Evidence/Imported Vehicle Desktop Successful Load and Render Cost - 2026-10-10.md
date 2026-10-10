# FL-4 — Imported vehicles loaded; desktop render and loading cost captured (2026-10-10)

**Status:** CAPTURED USER DEVICE EVIDENCE; VALID SUCCESSFUL IMPORT; **PERFORMANCE RISK HIGH**, but matched-build A/B cost attribution still OPEN.  
**Source build:** `1337738768dab29eb36f8f17c6bb2b762eb57023` on `development/meridian-fl4-optimization`; Vercel `dpl_7A5Ba1nibdyFfd7cGc2XJMjLkm8p` READY, `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app`.  
**Primary uploaded file:** `gtd-fl4-imports-2026-10-10T16-14-17-588Z.json` in conversation; captured at 2026-10-10T16:14:17.588Z. **Raw JSON is a user-uploaded attachment, not committed to Git**. This record preserves actual reported values.

## 1. Result: availability is confirmed, not permanently failed

`importedVehicles.pipeline.stage = "settled"`; loader initialization elapsed **3,082 ms**. Both source models completed with no error:
- Off-road GLB `car.glb` (6,062,428 bytes): `loadMs = 17,823.6` (**17.8 seconds**), stage `complete`.
- Sports GLB `ferrari.glb` (1,681,572 bytes): `loadMs = 101,445.2` (**101.4 seconds**), stage `complete`.

All **nine pre-existing parked slots** report `status = "imported"`, `failure = null`, `colliderCalibrated = true`: **five buggy slots and four sports-car slots**. The source `loadMs` is replicated in each matching parked slot; **do not add those nine values together** or misinterpret them as independent car downloads.

The pipeline reported `elapsedMs = 209,771` at capture (**209.8 seconds since import startup**). This is the pipeline's age at snapshot, *not* the time needed for all models to complete; the latest documented source load completed by about 101.4 seconds after model loading began. The previous October 10 report from source SHA `f2ae42d0...` showed the original cars and both source requests `loading` at capture time. The successful follow-up establishes delayed completion on this trial and makes a general “assets cannot load” diagnosis unsupported. It does **not** prove that every browser session always succeeds; capture network and decode sub-stages before claiming the cause of slow loads.

## 2. Accepted models and actual dimensional evidence

| Asset class | Number of rendered parked slots | Fitted world size (width × height × length, m) | Accepted parent adjustment | Fit warning |
|---|---:|---|---|---|
| Off-road | 5 | **2.4623 × 2.7325 × 4.0500** | Width 1.10; height 1.00 | `unusual vehicle height`; verify visual/physics contact rather than silently rescale accepted art |
| Sports | 4 | **2.3681 × 1.3584 × 4.5300** | Width 1.05; height 1.10 | None |

Real fitted geometry was computed from the decoded GLB mesh bounds; all matching class slots reached the same final size despite differing seeded parked-slot scales. Static Rapier cuboids were calibrated for each imported slot. A `colliderCalibrated: true` code path is **not a substitute for a user's physical collision test**.

## 3. Render and device metrics — actual imported scene

**Environment:** Windows 10 x64, Chrome 155, viewport/canvas/backbuffer/render resolution **1366×633**, DPR 1, Babylon hardware scale 1, **100% native pixel coverage**. Source reports 1,068 recent frame samples; this is not necessarily 1,068 frames since start of loading and is not necessarily a fixed-length 120-second test.

| Metric | Imported-dev scene (this actual file) |
|---|---:|
| `frameMsP50` / `frameMsP95` | **100.0 / 733.0 ms** |
| `renderMsP50` / `renderMsP95` | **83.3 / 657.6 ms** |
| Approx FPS from p50 frame time | **10.00 FPS**, not average FPS |
| Median draw calls | **990** |
| Median active meshes / indices | **236 / 8,411,016** |
| Total scene meshes | **1,103** |
| Scene materials / textures | **127 / 58** |
| Shadow casters / shadow-map width | **834 / 2,048 px** |
| Boot-to-ready / first-frame time | **2,095.7 / 331.8 ms** (do not treat as import readiness) |
| GPU timer / GPU memory / thermals | **UNAVAILABLE** |

This scene demonstrates a major throughput deficit in the user desktop environment when all nine GLB car slots are active. The large p95 values indicate very long intermittent stalls; whether such stalls are related to model load, shader compilation, repeated shadow passes or other events is **not determined by this aggregate report**. The existing diagnostics measure wall time around Babylon scene rendering, not GPU frame time.

## 4. Historical procedural sample for context — NOT matched-build A/B

The earlier **procedural-car-only** file `gtd-fl4-baseline-2026-10-10T15-57-13-924Z.json`, on **different** development build `f2ae42d0...` (Vercel `dpl_6mqv7tNCxE8W1an56VNY9McyciUh`), used the same reported Chrome/device class and pixel dimensions, but has 1,800 rather than 1,068 samples and potentially different camera/elapsed-session conditions:

| Quantity | Older procedural-only capture | Current imported-success capture | Ratio/delta (descriptive, NOT causal) |
|---|---:|---:|---:|
| Frame p50 / p95 (ms) | 49.8 / 82.9 | 100.0 / 733.0 | 2.01× / 8.84× |
| Render p50 / p95 (ms) | 32.5 / 58.4 | 83.3 / 657.6 | 2.56× / 11.26× |
| Approx median-based FPS | 20.08 | 10.00 | ~0.50× |
| Median draw calls | 548 | 990 | **+442 / 1.81×** |
| Median active indices | 181,494 | 8,411,016 | **+8,229,522 / 46.34×** |
| Total scene meshes | 585 | 1,103 | **+518** |
| Shadow casters | 316 | 834 | **+518** |
| Materials | 81 | 127 | +46 |
| Textures | 57 | 58 | +1 |

**Material observation:** The exactly matching `+518` counts for scene meshes and shadow casters is consistent with the imported mesh additions being registered in the shadow render list, but does **not** prove all 518 are active visible casters or that shadow rendering accounts for any particular fraction of the frame cost. The current imported loader source registers each imported visual mesh as a shadow caster; the model instances reuse source geometry/materials, yet median active indices still increased substantially.

**Important limitation:** These are two *different builds*, with unequal sample histories and potentially unmatched views. The table demonstrates a serious profiling lead rather than an exact controlled “cars cost X ms” measurement. The earlier `imports` request at the older SHA also returned only loading statuses and a procedural scene; it is **not a valid imported benchmark**.

## 5. Highest-value next controlled tests

1. **Same-build procedural control, no source changes:** open `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`; repeat similar camera/site/daylight/movement and save JSON. Compare p50/p95, draw calls, active indices and caster counts with this successful import sample. Avoid conflating GLB loading with steady-state FPS; first wait for `pipeline.stage=settled`.
2. **Shadow isolation on same imported build:** run `https://gtd-dvxf6vjyw-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1&fl4Probe=noShadows`, waiting for **all 9 slots imported**; save JSON after a comparable warmed-up traversal. This tests the rendering effect of disabling *all scene shadows*, not only vehicle shadows; it is a diagnostic upper bound, not a chosen aesthetic solution.
3. **If required after controlled A/B:** request user approval for a narrow count/LOD/shadow participation trial (e.g., keep accepted mesh visible but exclude fine wheel/interior meshes from shadow pass, use distance LOD or local repeated geometry instancing) while keeping the accepted car appearance and collider footprint. Measure instead of assuming. Avoid blindly removing imported reference vehicles or lowering scene-wide visual quality.
4. **Asset availability:** 17.8s and 101.4s source loads are unacceptable as a proven instant swap; isolate download vs decode/parse/first-use with browser Network/Performance tooling before choosing hosting, compression, preloading or worker decode. Technical-development inclusion does **not** clear the underlying third-party assets' redistribution rights.
5. **Continue separate mobile FL-4 gates:** DPR/native coverage, touch camera and movement, garage/day-night, collision regression; do not conclude the landscape PWA experience from DPR 1 desktop data.

**Disposition:** The user-approved imported example vehicles remain **DEVELOPMENT ACCEPTED**. Their appearance and scale are not revoked by this report. The asset pipeline and nine-slot physics registration **worked in this captured session**. Render load, slow model availability, mobile testing, and final FL-4 acceptance are **OPEN**. No changes to `main`, production, or accepted mesh scales are authorized by this result alone.

## User observation correction — telemetry success vs actual visual confirmation

Following these reports, the user explicitly clarified that **the imported cars did not visibly render in the preceding shadow-enabled exercise**. Preserve the measured `loaded` source statuses, nine `imported` slot states and costly render/frame timings as **telemetry**. They do **not**, by themselves, establish that those imported models were shown to the user on-screen. Accordingly, previous phrases such as "rendered parked slots" and statements concluding visually successful appearance from status flags alone must be read as **code-level model instantiation**, not user-confirmed rasterized output.

The later noShadows probe on the same pinned build **did** visibly show buggy and sports models in supplied screenshots, and its JSON records completed sources/slots with frame p50 53.4ms, median draw calls 221 and median active indices 1,935,591. This result does not retroactively prove visible import presence under shadows. See `documentations/FL-4 Evidence/Shadow Isolation - Imported Cars Visibly Loaded - 2026-10-10.md` for evidence, limitations and subsequent matched control test. FL-4 performance/visibility gates remain OPEN.
