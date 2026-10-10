# FL-4 — Next Evidence Acquisition: Local Device JSON Export

**Status:** MEASUREMENT TOOL BUILT AND PREVIEW READY; ACTUAL MOBILE DOWNLOAD BEHAVIOR AND DEVICE BENCHMARKS PENDING USER VALIDATION  
**Date:** 2026-10-10  
**Source authority:** `documentations/FL-4 Technical Implementation Plan.md` (FL4-01/02/03/05/06), `documentations/Meridia First Light Implementation Plan.md`  
**Previously verified development baseline:** `e107d86fa1f824a486727385e5bc0f7a9da71ca1` / Vercel READY `dpl_C9HCRZLbXx85tF99kVo6fnWzxHSU` / 78 tests.  
**Updated capture build:** separate pinned SHA, deployment and test evidence to be appended after verification.  
**Related decisions:** `documentations/Development/Imported Vehicle Benchmark - Experimental Evidence to Development Acceptance.md` and `documentations/Development/Imported 3D Assets - Foundational Editing and GTD Standard Pipeline.md`.

## Why the diagnostic surface changed

The existing `FL4Diagnostics` measured frame intervals, Babylon `scene.render()` JavaScript wall time, draw calls and active indices, native-pixel coverage, canvas CSS/backing/render resolution and browser/user-agent. It previously required `window.__GTD_FL4_REPORT__?.()` in browser DevTools, which is awkward or unavailable on a landscape PWA on a phone. To unblock *actual* FL4-01/02/03 device evidence without introducing production UI or fake benchmark data, `src/game/debug/fl4-evidence-export.ts` now supplies a small **Save FL-4 data** button **only with `?fl4Diagnostics=1`**.

- Tap/click saves a **local JSON file** with `schema=gtd.fl4.evidence.v1`, full page URL, timestamp, baseline/imported-car mode, the existing `gtd.fl4.v1` metrics report and `EXP-VEH-001` model statuses/fit metrics if that mode is active.
- No telemetry is sent to a network service by the export control. The player may share the saved JSON manually for analysis.
- It is removed on game runtime disposal; normal `/game` has **no export button**, no added render resolution change and no development statistics HUD.
- Existing console methods remain valid for desktop. This is **data acquisition**, not an FPS or visual improvement and not proof of phone download compatibility before a real-device test.
- One tap exports one snapshot. The renderer continues to collect only its **most recent 1,800 recorded frames**, not necessarily the entire elapsed session. At 60 FPS that covers roughly 30 seconds; at 15 FPS roughly two minutes. Do not mislabel `samples.count` as a timed 120-second sample without a separate elapsed-time log.

## First controlled A/B protocol: desktop

Use the **same development preview SHA** for both captures; no in-place branch URL because future branch updates can change source.

1. Open `/game?fl4Diagnostics=1` (development default: accepted imported buggy/sports car). Allow GLB loading to settle; if available, inspect `importedVehicles.slots[].status` for `imported` vs `fallback`.
2. Use the daytime time control at the same clock setting. Walk to the same parked-car slot, set a comparable view and spend enough time moving, turning and pausing to capture >=1,000 samples. Avoid DevTools docked comparisons that change viewport/resolution.
3. Select **Save FL-4 data**; keep the downloaded `gtd-fl4-imports-....json`, screenshot(s), browser viewport, hardware identification and subjective notes.
4. Open `/game?gtdVehicleProbe=baseline&fl4Diagnostics=1` from the **same build**, with same window size, location, camera and time. Repeat and download `gtd-fl4-baseline-....json`.
5. Compare `metrics.samples.frameMsP50/P95`, `renderMsP50/P95`, `drawCallsP50`, `activeIndicesP50`, `metrics.render`, `metrics.pixelCoverage`, `metrics.scene`, and `importedVehicles.assetSources[]` loading status/timing. First-time cold loads must be distinguished from warm cached loads. Changes to camera/viewpoint, full-screen state and loaded scene invalidate a strict A/B.

## Second protocol: landscape mobile/PWA

Use the identical development URL/commit on the phone, NOT the older production PWA as though it were current branch. Open the same imported/default and `gtdVehicleProbe=baseline` URLs and **tap Save FL-4 data** after normal movement, camera, garage and pause/resume testing; verify files actually saved on the specific device. Record device model, OS/browser/PWA mode, landscape CSS viewport and DPR (JSON contains most platform fields), whether zoom/resize occurred, perceived crispness, responsiveness, and if accessible battery/thermal information.

**GTD-VIS-002** (mobile native sharpness) remains OPEN until actual pixel dimensions and frame-cost comparison are obtained. On the same phone, consider one *separately documented* `?fl4Diagnostics=1&fl4Scale=...` run after baseline; smaller Babylon hardware scale generally increases rendered pixels. Do **not** apply a persistent graphics-scale default without both improved sharpness and acceptable measured frame time and user review. GTD-VIS-001 horizontal sky banding is a separate user-classified cosmetic/nonblocking issue.

## Acceptance and interpretation

This effort targets the measurement gates, not the entire FL-4 milestone. A passing test/build and READY development preview establish only tool availability. **Open:** browser-export click outcome; actual mobile downloads; desktop/mobile matched JSON pairs; benchmark-driven optimization need; lighting, garage and camera real-play regression; window-facade corrections discussed but not authorized; rights-unverified imported example GLBs; and explicit final user acceptance.

**Metrics semantics:** `renderMs` is wall time around Babylon scene rendering, not GPU time. `fpsApprox` is derived from median frame interval, not total-run average FPS. Browser GPU memory/thermal sensors are not available from the current report, and no per-object attribution is implied by a draw-call delta. A lack of perceived slowdown is legitimate qualitative evidence but **not** a measured zero-cost result.

**FL-4 status remains IN PROGRESS.** No production or `main` promotion should occur as a side effect of diagnostics capture. Decisions about final first GTD civilian sedan and new lamp/post assets are independent of remaining First Light performance gates.

## Verified corrected preview — 2026-10-10

**Application/source SHA:** `f2ae42d0432ea5940dc08d11f480ded4820679e8`. **Vercel preview:** `dpl_6mqv7tNCxE8W1an56VNY9McyciUh`, **READY**, `https://gtd-qxgrlbdqm-interlinkglobaltech.vercel.app`.

**Chained validation:** `npx tsc --noEmit && npm run test && npm run build` — **PASS**. Actual Vercel logs show **17 Vitest test files, 80/80 tests passed**, including two new export snapshot contract tests; Vite/Nitro build completed. Initial preview `dpl_DzWzASJeRo4Vuxsx4EaBH6EbTXNH` failed TypeScript on an incomplete sample fixture; this was fixed in source SHA above. The failed preview is superseded and should not be used for testing.

**Final same-build study URLs:**
- Imported development vehicles: `https://gtd-qxgrlbdqm-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1`
- Procedural baseline controls: `https://gtd-qxgrlbdqm-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`

With either route, look for the small **Save FL-4 data** button; it saves local JSON when clicked/tapped. If a browser restricts downloads, note the precise failure and use the desktop console methods instead. No real phone download success or frame-cost comparison has yet been established.

**Pipeline warning observed in build:** The output reported individual large chunks (notably a large generated-world JS chunk) and a general chunk-size warning. This is an engineering lead for FL4-04 to investigate **after** real load/frame metrics are captured, not proof of GPU overload or a measured regression. Full asset rights and production promotion remain separate blockers.
