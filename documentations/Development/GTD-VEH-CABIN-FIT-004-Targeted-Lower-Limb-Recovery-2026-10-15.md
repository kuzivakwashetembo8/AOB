# GTD-VEH-CABIN-FIT-004 — Targeted Lower-Limb Recovery

Date: 2026-10-15
Status: EXPERIMENTAL PATCH IMPLEMENTED; REAL BROWSER VISUAL ACCEPTANCE PENDING
Owner authorization: "Utilize document to attempt new patch."
Source: [GTD-VEH-CABIN-FIT-003 Deep Root-Cause Investigation](./GTD-VEH-CABIN-FIT-003-Deep-Root-Cause-Investigation-2026-10-15.md)

## 1. Intent and preserved baseline

The owner explicitly authorized a *new patch attempt* based on the deep investigation. This is a **separately gated primary-leg recovery attempt**. The previously owner-accepted AR1 seat-back/head/torso alignment remains unchanged. No whole-model translation, humanoid shrinking, geometry hiding, Ferrari height/scale adjustment or implicit production promotion is permitted.

Implementation branch: `exp/veh-cabin-fit-004-recovery-20261015`, derived from the rejected Cabin Fit 003 branch. The accepted AR1 experiment remains a separate intact preview.

### Engineering separation

- **Primary — lower-leg penetration:** This experimental patch addresses the actual sampled shoe and calf geometry, replacing the Fit 003 one-point/80-mm refusal.
- **Secondary — floating Ferrari:** **NOT CHANGED.** The separate Rapier full-cuboid/autostep root-cause candidate requires an independent solution and verification. Cabin Fit 004 cannot certify wheel-to-road contact.
- **Future vehicles:** Ferrari uses its dedicated imported carpet geometry. Buggy has no verified cabin profile; it remains fail-closed rather than inheriting Ferrari measurements.
- **Status:** G4 NOT CLOSED, G6 NOT STARTED, `main` unchanged.

## 2. Implemented code

1. `src/game/character/skinned-foot-geometry.ts`: retain original foot/toe sampling and additionally enumerate actual `calf_l/r`-weighted skinned vertices using the imported UAL bone mapping. Return per-foot *and* per-calf floor deficits, covered/uncovered vertex counts, and source mesh identity. Calf geometry outside the imported carpet footprint is reported as **unmeasured**, not treated as verified inside the cabin.
2. `src/game/character/cabin-fit-004-policy.ts`: plan a finite set of candidate **foot target offsets based on observed deformation**, bounded by 220 mm in the experiment. This is not a new absolute seat height, and it is **not** approval to apply 220 mm to arbitrary new vehicles or in all circumstances.
3. `src/game/character/driver-cabin-pose.ts`: only after AR1's accepted leg/head/torso positioning, perform a measured lower-limb candidate search. Use the existing parent-parity-safe two-link IK solver for each candidate, verify *actual deformed foot and calf surfaces*, restore thigh/calf quaternions on failure, and accept only when both feet meet real carpet coverage and measured floor clearance. Remain opt-in via `gtdCabinFit004=1`.
4. `src/game/vehicles/vehicle-cabin-envelope.ts`: provide a coherent frame-local floor sampler, avoiding per-vertex recalculation of the car-to-world inverse. This does not change Ferrari geometry.
5. `src/game/core/gtd-runtime.ts` and `src/game/character/voight-humanoid-trial.ts`: wire new opt-in separately; no fit parameter yields the accepted pre-existing behavior.
6. `src/test/veh-cabin-fit-004.test.ts`: finite measured candidate calculation, missing-footwell or calf-refusal conditions, and saturation bounds.

## 3. Actual imported-asset evidence (read-only headless)

The implementation was bundled in an isolated Vercel sandbox, then loaded into **Babylon.js 9.29.0 NullEngine** with the pinned Ferrari GLB and UAL `Driving_Loop`. The reconstructed scene preserved the real Ferrari fitting transform and the GTD character root/seat normalization.

| Metric | Failed Fit003 baseline | Candidate Fit004 |
| --- | ---: | ---: |
| Left shoe Y minus carpet Y | −139.1 mm | **+38.0 mm** |
| Right shoe Y minus carpet Y | −137.9 mm | **+28.8 mm** |
| Left floor-deficit-derived foot target shift | 0 mm | **165.1 mm** |
| Right floor-deficit-derived foot target shift | 0 mm | **163.9 mm** |
| Sampled foot vertices per side | 98 | 98 |
| Sampled calf vertices per side | 157 | 157 |
| Left measured foot/calf points penetrating after candidate | nonzero | **0** |
| Right measured foot/calf points penetrating after candidate | nonzero | **0** |
| Left calf points with no carpet support triangle | not certified | **12** |
| Right calf points with no carpet support triangle | not certified | **0** |
| Status | `too-deep`, zero lift | `floor-clear-not-cabin-certified` |

**Interpretation:** The new method solved the measured shoe and calf vs. carpet-floor condition for the imported reconstruction without altering seat/head/torso or the vehicle. This does **NOT** establish complete three-dimensional occupancy of the underbody, side panels, firewall, pedal box and all unmeasured calf vertices. It also does not establish the rendered browser state, walking/exit cycle, multiple vehicle positions, or mobile runtime behavior.

**Headless performance observation:** Over 85 test frames, total sample render time was ~279 ms; average ~3.3 ms, p95 ~4.9 ms, maximum **~60.7 ms** with three frames above 16 ms. This is an isolated Node NullEngine timing, **not a measured desktop/mobile frame budget**. It identifies a calibration hitch risk that should be checked or amortized before acceptance, especially on mobile.

## 4. Reproducible preview and gate

Target query flags (after a successful deployment):
`/game?gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1&gtdCabinFit004=1`

Compare against the exact same preview host **without** `gtdCabinFit004=1` to isolate the effect of the new fitter. Never turn on `gtdCabinFit003=1` simultaneously for an acceptance claim. The older accepted AR1 preview remains independently available.

Runtime diagnostic:
`window.__GTD_VEH_FIT_002_REPORT__?.().character.fittedDrivingPose.cabinFit004`

Expected successful intermediate state: `floor-clear-not-cabin-certified`, with both sides' real witnessed foot/calf counts and `verifiedTargetLiftsMetres`. Any missing, rejected or unstable candidate must be reported, not concealed as success.

**Owner visual review matrix:** low side/underside, overhead, left/right front-quarter, idling and driving, exit/re-board, different road locations, and mobile landscape. Compare body, head and hands against AR1. The floating-car secondary failure remains explicitly open and must be measured independently, not conflated with the new foot solver.

## 5. Rollback / release contract

- Do not merge this experimental result until the owner visually accepts it.
- If feet remain visible: report actual `cabinFit004` status, attempted target shifts, uncovered vertices, and matched screenshot; preserve accepted AR1. Do not arbitrarily raise the 220-mm candidate cap.
- If the car still floats: record it as the independent **wheel-support** failure; this patch does not change Rapier or vehicle ground calibration.
- If a new leg pose destabilizes animation/exit or causes a hitch, reject this candidate and revert to the AR1 control.
- Only after both legs and wheel support satisfy G1–G4 test **and actual rendered** criteria may G6 be reconsidered.

## 6. Current verification log

The actual imported asset and headless lower-leg clearance tests **PASS for the sampled floor surface**. Full TypeScript/Vitest Vercel build and human browser visual results are tracked separately; green build tests do not close this release gate.
