# FL-4 — Closeout Candidate and Final Review Register

**Decision:** CLOSEOUT IMPLEMENTATION AUTHORIZED; **NOT YET ACCEPTED / NOT YET COMPLETE**.  
**Date:** 2026-10-10  
**Proposed review branch:** `review/fl4-final-acceptance-candidate`, forked from `optimization/fl4-vehicle-shadow-lod` SHA `6214b582a65f2f87e4a342ce6cb1778f3babb9b2`.  
**Canonical source:** `documentations/Meridia First Light Implementation Plan.md`; governed by `documentations/FL-4 Technical Implementation Plan.md`.  
**User directive:** Stop expanding research and experiments; bring FL-4 to acceptance before continuing other game areas. This is authorization to prepare the finish candidate and validate it, **not a substitute for explicit visual and actual-device acceptance**.  
**Production release:** not authorized. `main` and published production site must remain unchanged.

## 1. Fixed creative baseline

This closeout does not reopen or silently discard established GTD quality. Keep FL-3 South Ward garage traversal and Rapier boundaries, camera/controls and time-of-day/night atmosphere; accepted tree canopy and trunk, streets, buildings, and observed visually convincing imported sports car/off-road buggy. The imported GLBs are **approved technical development assets**, not commercial/redistributable assets. Their calibrated dimensions remain:
- Off-road buggy: target length **4.05 m**, width `×1.10`, height `×1.00`.
- Sports car: target length **4.53 m**, width `×1.05`, height `×1.10`.
Keep positions, counts (5 buggy and 4 sports), existing static collision approximation and separate manual rights clearance for commercial use. No NPC/traffic system, new district, alternative sedan or poles/lamps asset phase is introduced by FL-4 closeout.

## 2. Evidence-supported optimization selection — stop exploratory expansion

The measured FL4-04 candidate is **selective vehicle shadow participation**:
- Same-build probe reports `834 → 352` registered shadow casters (**57.8% reduction**), `932 → 465` median draw calls (**50.1% reduction**), `8.11M → 3.71M` median active indices (**54.2% reduction**), and the same `1103` scene meshes.
- User-provided sample histories were **41 full frames vs 1800 selective frames**, with striking model-loading time differences. Therefore **do not claim an exact attributable FPS improvement** or that the severe full-mode p95 stalls have been solved. A prior selective capture showed ~15 median-derived FPS; responsive-game acceptance remains OPEN.
- The chosen closeout intervention preserves all nine GLB model instances and full camera-pass meshes; up to four substantial submeshes per car cast detailed shadows. Camera-visual and contact-shadow fidelity **has not yet been approved** by the user.

**Explicit exclusion:** `distanceLOD` and `combined` remain opt-in research probes. They deliberately expose the older toy-like procedural vehicles at a distance, so they are **not automatically approved for the final art standard** despite potential FPS gain. No new asset/modeling research is required to reach the current review stage.

**QA feature gate:** `?fl4FinalReview=1` activates the selective shadow candidate on a nonproduction review host **even without `fl4Diagnostics=1`**, so normal gameplay performance can be judged without the instrumentation collector. Without the flag, the accepted full-detail development behavior remains unchanged. On the same review build `?fl4FinalReview=1&fl4Diagnostics=1` activates the candidate with a **Save FL-4 data** export for evidence; `?fl4Diagnostics=1&fl4VehicleOptimization=full` explicitly restores the full-shadow A/B control. The review flag is rejected for the public `grand-theft-division.vercel.app` hostname and is not on `main`. Any adopted release-time default remains a separate explicit decision.

## 3. Canonical acceptance gate matrix

| Package | Evidence already available | Closeout gate / present disposition |
|---|---|---|
| FL4-01 baseline and profiling | Multiple original-proxy and imported-vehicle desktop JSON exports at DPR 1, full resolution, with p50/p95, draw calls, indices, registered shadow casters, GLB loading and exact deployment provenance | **PARTIAL / measurable**: desktop A/B established high vehicle rendering cost and large shadow-pass savings; no GPU timer / memory numbers (unsupported). Final candidate needs actual representative performance observation, not a guessed universal FPS requirement |
| FL4-02 mobile sharpness | GTD-VIS-002 documents user-observed blurred mobile PWA and initial devicePixelRatio hardware-scaling analysis; diagnostic exporter supports native-pixel reporting | **OPEN**: representative mobile DPR/backing/render/nativeCoverage and frame-time evidence; avoid adjusting mobile default before evidence and user acceptance |
| FL4-03 device/browser matrix | Windows Chrome desktop measurements, user screenshots and tested movement views; unit/integration physics lifecycle tests | **PARTIAL**: real landscape mobile PWA control, camera, walk/sprint, garage entry/exit, pause/resume, orientation, relaunch and perceivable responsiveness/stability need one final user field pass |
| FL4-04 justified optimization | Selective shadow test shows 482 fewer registered casters, 467 fewer median draw calls and 4.4M fewer median active indices, while 1103 meshes and all model instance statuses remain | **CANDIDATE**: retain only after user visibly approves accepted car shape and reasonable shadows/lighting, and measured responsiveness on test devices. Distance-LOD proxy art NOT default |
| FL4-05 whole-scene regression | Automated world-generation, Rapier static collider disposal, spatial logic and night/visual prior acceptance exist | **PARTIAL**: verify at runtime South Ward garage access, player-car physical contact, both directional controls, trees, windows and day/night/stars with the new shadow policy |
| FL4-06 final acceptance and milestone | Candidate branch and reproducible nonproduction preview after successful build | **BLOCKED until explicit acceptance**: user confirms visually acceptable scene and responsive/stable tested desktop/mobile; document remaining approved exceptions; only then update canonical First Light SOT to `FL-4 COMPLETED` / `FIRST LIGHT ACCEPTED`. Production main merge is a separate authorization |

**Accepted exclusions:** small horizontal sky banding GTD-VIS-001 may remain a nonblocking visual-polish issue if the user continues that disposition. Licensing limitations require independent clearance before commercial/public asset inclusion; this is NOT automatically resolved or waived by FL-4 performance completion. The previously agreed storefront/ordinary-window rule B remains discussed but unimplemented and is **not silently added to FL-4** unless the user explicitly authorizes architectural work.

## 4. Final acceptance walkthrough — no additional research phase

Use **one immutable review deployment**, then execute this compact route:
1. **Desktop normal play:** load `?fl4FinalReview=1`; wait until both GLB source classes are *visibly* present (a settled JSON slot state alone does not prove pixels reached the user); walk along parked cars, inspect realistic wheel contact and shadows; approach buggy and sports; enter/leave South Ward garage, orbit camera, sprint, test arrows and other controls.
2. **Desktop diagnostics:** use the same host `?fl4FinalReview=1&fl4Diagnostics=1`, let the scene settle, save one JSON. Compare against same-build `?fl4Diagnostics=1&fl4VehicleOptimization=full` *only if necessary* to judge performance. Report scene-view discrepancies explicitly; no predetermined FPS thresholds are silently invented.
3. **Mobile landscape:** load the same candidate in browser/PWA, assess sharpness, touch/turn behavior, garage, day/night, reentry; save `fl4Diagnostics=1` JSON if supported and note device model and PWA/browser context. Record perceptual suitability or a precise blocker; unsupported thermal counters are `N/A`, not fabricated values.
4. **Decision:** accept the candidate only if the visual quality and responsiveness/stability are acceptable to the user on documented tested devices. Record the final approval and limitations *before* marking canonical FL-4 complete. If one gate fails, classify `BLOCKED` or `FAIL` precisely and repair **that** item only; do not restart open-ended unrelated investigation.

## 5. Verification, ownership, and rollback

- Before final review, the branch must pass strict TypeScript, full tests, and production-mode app build; the pinned review deployment must be READY. Record commit/deployment evidence below.
- The prior accepted renderer remains available both on unchanged `development/meridian-fl4-optimization` and via the explicit `full` control query. No baseline GLB or Rapier change in this candidate.
- This document is a **pre-acceptance register**; **do not** update `Meridia First Light Implementation Plan.md` to `FL-4 COMPLETED` before the user actually accepts the milestone. 
- Any promotion to `main` or production is independently authorized; ordinary Vercel preview delivery is not production authorization.

## 6. Pinned candidate verification

**Build and preview verified READY — 2026-10-10**

- **Application/source SHA:** `22efb7db6de2837f460a5a74da24f39e4ad96e36` on `review/fl4-final-acceptance-candidate`.
- **Pinned Vercel:** `dpl_8x4AscVNsL4fMqKnKyp3r5SZQ75S`, READY at `https://gtd-qvjoxnz0p-interlinkglobaltech.vercel.app`.
- **Verification command:** `npx tsc --noEmit && npm run test && npm run build`; Vercel deployment reached READY and the final Vite/Nitro build completed. This chained command guarantees the app build stage did not execute after a failed TypeScript or test stage. Earlier optimization branch passed 84 tests across 18 files; this closeout candidate adds one final-review flag contract test. Exact console test count for this pinned build was not separately extracted from the truncated provider event window; do not invent a number.
- **Normal-play final review (no sampler):** `https://gtd-qvjoxnz0p-interlinkglobaltech.vercel.app/game?fl4FinalReview=1`.
- **Final review with opt-in evidence export:** `https://gtd-qvjoxnz0p-interlinkglobaltech.vercel.app/game?fl4FinalReview=1&fl4Diagnostics=1`.
- **Same SHA full-renderer rollback control:** `https://gtd-qvjoxnz0p-interlinkglobaltech.vercel.app/game?fl4Diagnostics=1&fl4VehicleOptimization=full`.

**Code accepted for review, not yet milestone-approved:** neither this READY deploy nor prior A/B shadow-work reductions prove user-approved vehicle shadows, actual mobile sharpness, user-perceived movement responsiveness, or complete gameplay/garage regression. No screenshots or physical-device results for this pinned closeout candidate have been submitted. FL4-02/03/05/06 remain OPEN until the final user review and supported acceptance decision. This is a fixed-scope **acceptance review**, not permission to start another general optimization study. No `main` or public-production changes occurred. 

## 7. User conditional acceptance, imported-only correction, verification

The user replied **"Yes with one exception"** to the final-review candidate: the accepted buggy and sports-car GLBs, not the rejected procedural cars, are the sole default vehicle models. No old car is to appear during GLB loading, failure or distance LOD. Future models derive from edited/imported assets. See `FL-4 User Acceptance Exception - Imported Vehicles Only.md` for the binding development representation rule, suspension of invisible legacy Rapier colliders, model-loading errors and test plan.

The correction is implemented on the pinned review app SHA `1125249db71dcdcd85cd10e055f6f565c16ae689`, deployment `dpl_DYUR4hFCRpxR4r1SjwNHmKjAadwt` **READY**, URL `https://gtd-9r7dn47x2-interlinkglobaltech.vercel.app/game?fl4FinalReview=1`. The chained strict TypeScript, **83/83 Vitest tests across 18 files**, and Vite/Nitro application build all passed. No legacy car mesh may render during accepted GLB import; no old parked-car collider remains while loading or on failure. `distanceLOD` and `combined` legacy modes have been retired. `?gtdVehicleProbe=baseline` remains an explicitly requested archival diagnostic comparison only, not a user-facing fallback.

**Milestone status:** user conditionally accepts the First Light finish candidate subject to this exception. The code/build gate for the exception has now passed, but the corrected build has **not yet been visually observed by the user** in desktop/landscape mobile; previous final-review mobile sharpness, device responsiveness, scene/garage gameplay gates remain insufficiently measured. Preserve this distinction, record the exception as addressed by source tests, and seek the final short user in-world confirmation before updating canonical FL-4 to unqualified COMPLETED. Neither production nor `main` has changed.
