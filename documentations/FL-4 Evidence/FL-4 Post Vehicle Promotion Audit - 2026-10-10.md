# FL-4 Post-Vehicle-Promotion Audit — 2026-10-10

**Decision: FL-4 IN PROGRESS, NOT COMPLETED.**  
**Development branch:** development/meridian-fl4-optimization.  
**Canonical authority:** documentations/Meridia First Light Implementation Plan.md and documentations/FL-4 Technical Implementation Plan.md.  
**Vehicle acceptance:** documentations/Development/Imported Vehicle Benchmark - Experimental Evidence to Development Acceptance.md.  
**Import/editing process:** documentations/Development/Imported 3D Assets - Foundational Editing and GTD Standard Pipeline.md.

## Reconciliation with newly accepted imported vehicles

The user explicitly accepted two imported GLB reference vehicles as **official ongoing GTD technical/development assets** following four iterations of screenshot-led tests, but did NOT authorize commercial asset use, production merge or marking the entire First Light phase completed. The off-road buggy has target length 4.05 m, width ×1.10, height ×1.00; the sports car has target length 4.53 m, width ×1.05 and height ×1.10. These are the accepted **development rendering/scale** reference, not an original sedan specification.

Original EXP-VEH-001 iteration-4 preview dpl_2jmyF5VqAYPTcoRAiNoc3S3fEQnR passed strict TypeScript, 78 Vitest tests/16 files and build. User accepted screenshots of the sports car from multiple third-person angles. Successful import in the actual city and credible scale are established. They do NOT demonstrate official model redistribution rights, many-copy FPS/VRAM cost, device thermal sustainability, perfect collision shape, original GTD vehicle IP or full-world performance acceptance. Users previously reported no noticeable slowdown, but no paired p50/p95 timing logs prove zero cost.

Following this approval, the isolated experiment commits/documents were fast-forwarded to the development branch (from 25a1630 to 7d9db27); source gtd-runtime.ts was then modified to render imported specimens **by default on development previews**, preserving an explicit baseline query parameter for native procedural parked-car A/B. No production/main source changes occurred. This developmental integration still needs its own tested READY preview and targeted runtime QA. The experiment's original verified preview is a historical comparison, not proof of the new default-mode behavior.

## FL-4 work package audit

| Package | Current evidence-based status | Remaining completion condition |
|---|---|---|
| FL4-01 reproducible benchmark | PARTIAL | Stable full-window desktop scene and real-device baseline vs imported-car frame/render, draw call, index count and resource telemetry with full conditions and raw JSON. The previous measured ~15 FPS desktop sample was with DevTools docked in a reduced 811 × 633 viewport; cannot treat as undocked performance. |
| FL4-02 mobile resolution/sharpness | OPEN | User saw blur in mobile PWA. Actual phone CSS/backing/render dimensions, DPR and frame-time samples needed before selecting a measured resolution policy. Current Babylon hardware scaling is a plausible *source-level* cause, not confirmed on user device. |
| FL4-03 desktop + real mobile matrix | PARTIAL/BLOCKED | Controlled walking/sprinting/camera, garage entry and exit, pause/resume, orientation, exit/reentry, context where possible, and thermal observations on real desktop and landscape phone. |
| FL4-04 bottleneck-based optimization | NOT PROVEN | Measure before changing draw calls, shadows, compression, instancing/LOD or render resolution; retain only net-beneficial, visually acceptable remedies. Imported GLBs are a quality breakthrough, not proof of frame-time optimization. |
| FL4-05 full scene regression | PARTIAL | Vehicle/Voight collision and curb/road placement, buildings/garage, tree canopies, landscape PWA, approved FL-3 time/night sky, source/build/test and matched before/after screenshots. |
| FL4-06 final milestone acceptance | BLOCKED | Consolidated hardware evidence, user review/acceptance, documented exceptions and separate production release authorization. |

## Important class-specific art status

**Trees:** accepted for current stage. Current near-uniform trunk and proportional canopy are not to be reworked merely because imported cars are more detailed.

**Vehicles:** approved development reference. Not licensed for commerce; do not silently treat example Ferrari/off-road shape as an original GTD everyday fleet sedan. Keep asset pipeline flexible enough for legal edits/new authored meshes, model replacement and color-only variants on the future original sedan.

**Windows:** user approved architectural exception B IN DISCUSSION only: on multirow buildings remove the lowest *ordinary* generated window band; retain actual storefront glazing, functional entrances and authored garage openings. Regular aligned bays/columns should replace unexplained procedural gaps. The user previously said do not implement yet; this exact follow-on geometry change is **not implemented or accepted**. The earlier tall-storey window-height patch does not satisfy it. It remains an outstanding source-of-truth-driven architectural review.

**Street props/lamps/posts:** the approved imported-asset pipeline can now be used as a development workflow for these families, with original/licensed models and their own geometry, material, physics, light, performance and semantic acceptance. No blanket import or art expansion is implied.

## Next concrete FL-4 continuation

1. Verify post-development-promotion exact source SHA with strict TypeScript, full Vitest and Vite/Nitro build; create an explicitly nonproduction review preview. Confirm imported cars show by default and the same-build legacy control works with query gtdVehicleProbe=baseline.
2. Capture identical daylight street/garage and night camera paths, using ?fl4Diagnostics=1 in both imported/default and procedural/baseline modes. Export each browser report and record hardware, browser, DPR, canvas backing, render size, loading status, frame/render p50/p95, draw calls, active mesh/indices and screenshots. A 90–120 second full-window desktop route is preferable to the earlier docked-DevTools partial sample.
3. On real mobile landscape, repeat baseline and test one bounded render scaling candidate (?fl4Diagnostics=1&fl4Scale=...), recording sharpness and p50/p95 at actual DPR/viewport/backbuffer. Do not optimize resolution without measured device evidence.
4. Run Voight-to-parked-car collision and sidewalk clearance checks, garage traversal, pause/resize/reentry and day/night regression. Benchmark cold/warm GLB load; record failed model fallback and accepted model scale.
5. Enter FL4-04 optimization only with observed bottleneck. Record no-change-required if measurement supports it. Preserve user-accepted lighting, trees, FL-3 garage and vehicles.
6. Publish honest pass/block matrix and obtain explicit FL-4 milestone acceptance after all gates complete. Keep commercial license and production approval as independently gated decisions.

### Capture commands

Browser console once per same-device test run:

    copy(JSON.stringify(window.__GTD_FL4_REPORT__?.(), null, 2))
    copy(JSON.stringify(window.__GTD_VEHICLE_PROBE_REPORT__?.(), null, 2))

Run separately because each copy overwrites the clipboard. Mobile debugging may need remote inspection or a subsequently authorized export-control enhancement.

## Acceptance register snapshot

A01 PARTIAL; A02 PARTIAL; A03 PARTIAL; A04 PARTIAL; A05 OPEN; A06 PARTIAL/BLOCKED; A07 FL-3 ACCEPTED/POST-IMPORT CHECK OPEN; A08 FL-3 ACCEPTED/REGRESSION OPEN; A09 OPEN; A10 OPEN; A11 experiment 78/78 PASS/development default PENDING; A12 BLOCKED.

**Verdict:** FL-4 is still active. The newly adopted vehicles raise GTD's visible art baseline and justify continuing the game-development asset pipeline, but the next FL-4 action must be measurement and regression rather than inventing a completion claim or automatically remodeling unrelated assets.

## Post-promotion verification evidence — 2026-10-10

**Development game source:** e107d86fa1f824a486727385e5bc0f7a9da71ca1. **Vercel deployment:** dpl_C9HCRZLbXx85tF99kVo6fnWzxHSU, READY, at https://gtd-12vxak3am-interlinkglobaltech.vercel.app. The sequential verification command was npx tsc --noEmit && npm run test && npm run build. Result: **PASS**, 16 Vitest files and **78/78 tests passed**. The Vite/Nitro build completed and the deployment status is READY.

**Default developmental imported cars:** https://gtd-12vxak3am-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1

**Same SHA, legacy procedural-car control:** https://gtd-12vxak3am-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1

Development-source policy selects imported GLBs on nonproduction hosts by default; the latter URL expressly overrides to the previous procedural renderer. The imported off-road and sports models remain source-pinned remote technical-development references, without commercial licensing clearance. Source-code tests and READY deployment do **not** verify actual browser default/override operation, real-device FPS or GPU utilization; those remain live-review requirements.

**Next FL4-01/02 acquisition:** matched hardware/viewport/game-time 90–120-second runs of both URLs, saving browser diagnostics before performing resolution experiments on real landscape mobile. The old production baseline remains unchanged. FL-4 NOT ACCEPTED.

## FL-4 resumed: local performance evidence acquisition, 2026-10-10

**Status remains: FL-4 IN PROGRESS.** The user asked to resume FL-4 after formal development promotion and asset-workflow documentation. The next concrete work item is **FL4-01/02/03 data collection**, not relighting, arbitrary vehicle rescaling or marking FL4-04 optimization complete without measurements.

A mobile-friendly, flag-gated diagnostics export is now integrated on the development branch: `src/game/debug/fl4-evidence-export.ts`, `src/game/core/gtd-runtime.ts`, and `src/test/fl4-evidence-export.test.ts`. It exposes a small **Save FL-4 data** button only when `?fl4Diagnostics=1`; on click, the player downloads a local `gtd.fl4.evidence.v1` JSON with existing `gtd.fl4.v1` metrics and imported-car status/fit reports. There is no automatic network upload, no default HUD noise, no normal-path renderer change and no asset geometry/material modification. The old DevTools methods remain available.

**Pinned app SHA:** `f2ae42d0432ea5940dc08d11f480ded4820679e8`. **Vercel:** `dpl_6mqv7tNCxE8W1an56VNY9McyciUh` READY at `https://gtd-qxgrlbdqm-interlinkglobaltech.vercel.app`. Strict TypeScript, **80/80 tests across 17 files**, and Vite/Nitro application build PASSED. One earlier test-fixture typing failure in preview `dpl_DzWzASJeRo4Vuxsx4EaBH6EbTXNH` was corrected; do not cite that failed preview as ready.

**Same-build URLs:**
- Imported developmental cars: `https://gtd-qxgrlbdqm-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1`
- Original proxy comparison: `https://gtd-qxgrlbdqm-interlinkglobaltech.vercel.app/game?gtdVehicleProbe=baseline&fl4Diagnostics=1`

**Full measurement protocol:** `documentations/FL-4 Evidence/Development Device Measurement Continuation - Local JSON Export.md`. Compare matching camera/street/garage/daylight routes and consistent viewport/device settings. Save JSON from both modes on desktop and a representative landscape mobile browser/PWA; supplement with perceptual sharpness, frame responsiveness, repeated reentry and physical vehicle/garage interaction. The file contains up to the most recent 1,800 frame samples, so record actual sampling durations rather than assuming each export represents two full minutes.

**Remaining requirements:** actual browser/mobile download functional test; same-device raw desktop/mobile A/B frame and render p50/p95, draw calls, resource and native-pixel coverage evidence; verified user-perceived touch/garage/night/vehicle collision regression; device-specific sharpness diagnosis under GTD-VIS-002; measured bottleneck decision for FL4-04; full FL4-05 visual regression and user FL4-06 acceptance. Existing accepted tree visual geometry should remain unchanged. Window-grammar correction B remains separately discussed and **not authorized for implementation**. Commercial/rights clearance and production/main promotion are independently gated.

**Result:** Development imported vehicles are approved and documented, but a visually convincing new asset is not a substitute for whole-milestone responsiveness/stability evidence. FL-4 cannot be closed until its canonical user-device and acceptance gates are satisfied or explicitly dispositioned.
